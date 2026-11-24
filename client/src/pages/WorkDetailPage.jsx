import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Share2,
  Pencil,
  Trash2,
  Check,
  Copy,
  Radio,
  Loader2,
  AlertCircle,
  ChevronRight,
  XCircle,
  Download,
  ExternalLink,
} from "lucide-react";
import axiosClient, { getApiErrorMessage } from "../api/axiosClient.js";
import { useSwarm } from "../context/SwarmContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import EpubViewer from "../components/EpubViewer.jsx";
import PdfViewer from "../components/PdfViewer.jsx";

function formatSpeed(bytesPerSec = 0) {
  const num = Number(bytesPerSec || 0);
  if (num < 1024) return `${num.toFixed(0)} B/s`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB/s`;
  return `${(num / (1024 * 1024)).toFixed(2)} MB/s`;
}

export default function WorkDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const {
    streamMagnet,
    removeTorrent,
    getTorrentByMagnet,
  } = useSwarm();

  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sharedCopied, setSharedCopied] = useState(false);
  const [magnetCopied, setMagnetCopied] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [swarmStarted, setSwarmStarted] = useState(false);
  const [swarmError, setSwarmError] = useState("");
  const [pendingTorrentDownload, setPendingTorrentDownload] = useState(false);

  const fetchWork = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axiosClient.get(`/works/${id}`);
      setWork(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal memuat detail karya."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWork();
  }, [fetchWork]);

  const activeMagnetKey = work?.magnet_uri || "";
  const activeTorrent = getTorrentByMagnet(activeMagnetKey);

  useEffect(() => {
    if (activeTorrent) {
      setSwarmStarted(true);
    }
  }, [activeTorrent]);

  const triggerTorrentFileDownload = useCallback((torrentFileUrl, bookTitle) => {
    const slug = String(bookTitle || "arsip-gerbong")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "arsip-gerbong";
    const link = document.createElement("a");
    link.href = torrentFileUrl;
    link.download = `${slug}.torrent`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  useEffect(() => {
    if (pendingTorrentDownload && activeTorrent?.torrentFileUrl) {
      triggerTorrentFileDownload(activeTorrent.torrentFileUrl, work?.title);
      setPendingTorrentDownload(false);
    }
  }, [pendingTorrentDownload, activeTorrent?.torrentFileUrl, triggerTorrentFileDownload, work?.title]);

  function handleDownloadTorrentFile() {
    setSwarmError("");
    if (activeTorrent?.torrentFileUrl) {
      triggerTorrentFileDownload(activeTorrent.torrentFileUrl, work?.title);
      return;
    }
    if (!work?.magnet_uri) {
      setSwarmError("Karya ini belum memiliki Magnet URI untuk membuat berkas .torrent.");
      return;
    }
    try {
      setPendingTorrentDownload(true);
      setSwarmStarted(true);
      streamMagnet(work.magnet_uri, {
        title: work.title,
        format: work.format,
      });
    } catch (err) {
      setPendingTorrentDownload(false);
      setSwarmError(err?.message || "Gagal mengambil metadata .torrent dari swarm.");
    }
  }

  async function copyText(text, onDone) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    onDone(true);
    setTimeout(() => onDone(false), 2500);
  }

  async function handleShare() {
    const shareUrl = window.location.href;
    const shareData = {
      title: `${work?.title || "Karya"} — GERBONG`,
      text: `Baca "${work?.title || "karya ini"}" di GERBONG (Gerakan Bacaan dan Arsip Gotong-Royong).`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch (err) {
      if (err?.name === "AbortError") return;
    }

    await copyText(shareUrl, setSharedCopied);
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError("");
    try {
      if (activeMagnetKey) {
        removeTorrent(activeMagnetKey);
      }
      await axiosClient.delete(`/works/${id}`);
      navigate("/works", { replace: true });
    } catch (err) {
      setDeleteError(getApiErrorMessage(err, "Gagal menghapus karya."));
      setDeleting(false);
    }
  }

  function handleStreamFromSwarm() {
    setSwarmError("");
    if (!work?.magnet_uri) {
      setSwarmError("Karya ini belum memiliki Magnet URI untuk dialirkan dari swarm.");
      return;
    }

    try {
      setSwarmStarted(true);
      streamMagnet(work.magnet_uri, {
        title: work.title,
        format: work.format,
      });
    } catch (err) {
      setSwarmError(err?.message || "Gagal memulai streaming dari swarm WebTorrent.");
    }
  }

  function handleStopSwarm() {
    if (activeMagnetKey) {
      removeTorrent(activeMagnetKey);
    }
    setSwarmStarted(false);
    setSwarmError("");
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-sm text-[#57534E] gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-[#991B1B]" />
        Memuat kartu katalog pustaka...
      </div>
    );
  }

  if (error || !work) {
    return (
      <div className="space-y-4">
        <Link
          to="/works"
          className="inline-flex items-center gap-1.5 text-sm text-[#57534E] hover:text-[#161615] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Pustaka
        </Link>
        <div className="rounded-[2px] border border-[#991B1B] bg-[#991B1B]/10 p-4 text-sm text-[#991B1B] flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Karya tidak dapat dimuat</p>
            <p className="mt-1">{error || "Data karya tidak ditemukan."}</p>
          </div>
        </div>
      </div>
    );
  }

  const fmt = String(work.format || "EPUB").toUpperCase();
  const isPdf = fmt === "PDF";
  const authorId = work.authors?.id || work.author_id;

  const progress = activeTorrent ? Number(activeTorrent.progress || 0) : 0;
  const peers = activeTorrent ? Number(activeTorrent.numPeers || 0) : 0;
  const downSpeed = activeTorrent ? Number(activeTorrent.downloadSpeed || 0) : 0;
  const upSpeed = activeTorrent ? Number(activeTorrent.uploadSpeed || 0) : 0;
  const blobUrl = activeTorrent?.blobUrl || null;

  return (
    <article className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D5CFC2] pb-3">
        <Link
          to="/works"
          className="inline-flex items-center gap-1.5 text-sm text-[#57534E] hover:text-[#161615] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Katalog Pustaka</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#D5CFC2] bg-[#FAF8F3] hover:border-[#161615] px-3 py-1.5 text-xs font-medium text-[#161615] transition-colors cursor-pointer"
          >
            {sharedCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#991B1B]" />
                <span>Tautan Disalin</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-[#991B1B]" />
                <span>Bagikan</span>
              </>
            )}
          </button>

          {isAdmin && (
            <>
              <Link
                to={`/works/${work.id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#D5CFC2] bg-[#FAF8F3] hover:border-[#161615] px-3 py-1.5 text-xs font-medium text-[#161615] transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setConfirmDelete((prev) => !prev);
                  setDeleteError("");
                }}
                className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#991B1B] bg-[#FAF8F3] hover:bg-[#991B1B]/10 px-3 py-1.5 text-xs font-medium text-[#991B1B] transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      {isAdmin && confirmDelete && (
        <div className="rounded-[2px] border border-[#991B1B] bg-[#FAF8F3] p-4 space-y-3">
          <p className="text-sm text-[#161615]">
            Hapus karya <span className="font-semibold">&ldquo;{work.title}&rdquo;</span> dari katalog GERBONG? Tindakan ini tidak dapat dibatalkan.
          </p>
          {deleteError && (
            <p className="text-xs text-[#991B1B] flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{deleteError}</span>
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 rounded-[2px] bg-[#991B1B] hover:bg-[#7F1D1D] disabled:opacity-60 px-3.5 py-1.5 text-xs font-medium text-[#F4F1EA] transition-colors cursor-pointer"
            >
              {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {deleting ? "Menghapus..." : "Ya, Hapus Karya"}
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => setConfirmDelete(false)}
              className="rounded-[2px] border border-[#D5CFC2] bg-[#EFECE4] hover:border-[#161615] px-3.5 py-1.5 text-xs font-medium text-[#161615] transition-colors cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Library Catalog Card */}
      <div className="rounded-[2px] border border-[#D5CFC2] bg-[#FAF8F3] p-5 space-y-5">
        <div className="space-y-2.5 border-b border-[#D5CFC2] pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-[2px] border border-[#161615] px-1.5 py-0.5 font-mono text-[11px] font-semibold uppercase text-[#161615]">
              {fmt}
            </span>

            {work.categories?.name && (
              <span className="rounded-[2px] border border-[#D5CFC2] bg-[#EFECE4] px-2 py-0.5 text-xs font-medium text-[#57534E]">
                {work.categories.name}
              </span>
            )}
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#161615] leading-tight">
            {work.title}
          </h1>

          {/* Author Link Row */}
          {work.authors?.name && authorId && (
            <Link
              to={`/authors/${authorId}`}
              className="group inline-flex items-center gap-1.5 pt-1 text-sm font-medium text-[#161615] hover:text-[#991B1B] transition-colors"
            >
              <span>Oleh: <strong className="font-serif">{work.authors.name}</strong></span>
              {work.authors.lifespan && (
                <span className="font-mono text-xs text-[#57534E]">
                  ({work.authors.lifespan})
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-[#57534E] group-hover:text-[#991B1B]" />
            </Link>
          )}
        </div>

        {/* Monospace Catalog Index Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border border-[#D5CFC2] divide-y sm:divide-y-0 sm:divide-x divide-[#D5CFC2] bg-[#F4F1EA]">
          <div className="p-3">
            <p className="text-[11px] text-[#57534E]">Tahun Terbit</p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-[#161615]">
              {work.year || "—"}
            </p>
          </div>
          <div className="p-3">
            <p className="text-[11px] text-[#57534E]">Format</p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-[#161615]">
              {fmt}
            </p>
          </div>
          <div className="p-3">
            <p className="text-[11px] text-[#57534E]">Ukuran Berkas</p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-[#161615]">
              {work.file_size || "—"}
            </p>
          </div>
          <div className="p-3">
            <p className="text-[11px] text-[#57534E]">Jumlah Halaman</p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-[#161615]">
              {work.page_count ? `${work.page_count} hlm.` : "—"}
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-1.5">
          <h2 className="font-serif text-base font-bold text-[#161615]">
            Ringkasan Karya
          </h2>
          {work.summary ? (
            <p className="text-sm text-[#161615] leading-relaxed whitespace-pre-line">
              {work.summary}
            </p>
          ) : (
            <p className="text-xs text-[#57534E] italic">
              Belum ada sinopsis atau ringkasan untuk karya ini.
            </p>
          )}
        </div>

        {/* Magnet URI & Contribute Seeding (qBittorrent / .torrent) */}
        <div className="border-t border-[#D5CFC2] pt-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-serif text-base font-bold text-[#161615]">
              Bantu Menyemai (qBittorrent / Klien Torrent)
            </h2>
            {(work.magnet_uri || activeTorrent?.magnetURI) && (
              <div className="flex flex-wrap items-center gap-1.5">
                <a
                  href={work.magnet_uri || activeTorrent?.magnetURI}
                  className="inline-flex items-center gap-1 rounded-[2px] border border-[#991B1B] bg-[#FAF8F3] hover:bg-[#991B1B]/10 px-2.5 py-1 text-xs font-medium text-[#991B1B] transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Buka di Klien Torrent</span>
                </a>

                <button
                  type="button"
                  onClick={handleDownloadTorrentFile}
                  disabled={pendingTorrentDownload}
                  className="inline-flex items-center gap-1 rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] hover:border-[#161615] disabled:opacity-60 px-2.5 py-1 text-xs font-medium text-[#161615] transition-colors cursor-pointer"
                >
                  {pendingTorrentDownload ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-[#991B1B]" />
                      <span>Mengambil .torrent...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3 h-3 text-[#991B1B]" />
                      <span>Unduh .torrent</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    copyText(work.magnet_uri || activeTorrent?.magnetURI, setMagnetCopied)
                  }
                  className="inline-flex items-center gap-1 rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] hover:border-[#161615] px-2.5 py-1 text-xs font-medium text-[#161615] transition-colors cursor-pointer"
                >
                  {magnetCopied ? (
                    <>
                      <Check className="w-3 h-3 text-[#991B1B]" />
                      <span>Disalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Salin Magnet</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {work.magnet_uri || activeTorrent?.magnetURI ? (
            <>
              <p className="text-xs text-[#57534E]">
                Ingin ikut menjaga ketersediaan arsip ini? Buka tautan magnet atau unduh berkas{" "}
                <code className="font-mono text-[#161615]">.torrent</code> untuk menyemai lewat
                qBittorrent, Transmission, atau WebTorrent Desktop.
              </p>
              <code className="block w-full overflow-x-auto rounded-[2px] border border-[#D5CFC2] bg-[#EFECE4] px-3 py-2 font-mono text-[11px] text-[#161615] break-all">
                {work.magnet_uri || activeTorrent?.magnetURI}
              </code>
            </>
          ) : (
            <p className="border-y border-[#D5CFC2] py-2.5 text-xs text-[#57534E]">
              Belum ada Magnet URI yang ditautkan pada entri katalog ini.
            </p>
          )}
        </div>
      </div>

      {/* WebTorrent Swarm Reader Section */}
      <section className="rounded-[2px] border border-[#D5CFC2] bg-[#FAF8F3] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#D5CFC2] pb-3.5">
          <div>
            <h2 className="font-serif text-2xl font-bold tracking-tight text-[#161615]">
              Ruang Baca &amp; Swarm P2P
            </h2>
            <p className="mt-0.5 text-xs text-[#57534E]">
              Alirkan berkas {fmt} langsung dari jaringan WebRTC peer-to-peer sambil ikut menyemai.
            </p>
          </div>

          {/* Primary Action Button: Muat & Baca dari Swarm */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!swarmStarted ? (
              <button
                type="button"
                onClick={handleStreamFromSwarm}
                className="inline-flex items-center gap-2 rounded-[2px] bg-[#991B1B] hover:bg-[#7F1D1D] px-4 py-2 text-xs sm:text-sm font-medium text-[#F4F1EA] transition-colors cursor-pointer"
              >
                <Radio className="w-4 h-4" />
                <span>Muat &amp; Baca dari Swarm</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopSwarm}
                className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#991B1B] bg-[#F4F1EA] hover:bg-[#991B1B]/10 px-3.5 py-2 text-xs font-medium text-[#991B1B] transition-colors cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Hentikan Swarm</span>
              </button>
            )}
          </div>
        </div>

        {/* Swarm Error Alert */}
        {(swarmError || activeTorrent?.error) && (
          <div className="flex items-start gap-2.5 rounded-[2px] border border-[#991B1B] bg-[#991B1B]/10 p-3 text-xs text-[#991B1B]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{swarmError || activeTorrent?.error}</span>
          </div>
        )}

        {/* Live Telemetry Bar (Progress %, Peers, Down, Up) */}
        {swarmStarted && (
          <div className="space-y-3 rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] p-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#161615] flex items-center gap-2">
                  {!blobUrl && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#991B1B]" />
                  )}
                  {blobUrl
                    ? "Berkas siap dibaca • Menyemai ke Swarm (Seeding)"
                    : peers > 0
                      ? "Mengunduh potongan berkas dari peer..."
                      : "Mencari peer seeder di WebRTC Swarm..."}
                </span>
                <span className="font-mono font-semibold text-[#991B1B]">
                  {progress.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden bg-[#D5CFC2]">
                <div
                  className="h-full bg-[#991B1B] transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>

            {/* 4 Telemetry Metrics: Progress %, Peers, Down, Up */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border border-[#D5CFC2] divide-y sm:divide-y-0 sm:divide-x divide-[#D5CFC2] bg-[#FAF8F3]">
              <div className="px-3 py-2">
                <p className="text-[11px] text-[#57534E]">Progress %</p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-[#161615]">
                  {progress.toFixed(1)}%
                </p>
              </div>

              <div className="px-3 py-2">
                <p className="text-[11px] text-[#57534E]">Peers</p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-[#161615]">
                  {peers}
                </p>
              </div>

              <div className="px-3 py-2">
                <p className="text-[11px] text-[#57534E]">Down</p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-[#161615]">
                  {formatSpeed(downSpeed)}
                </p>
              </div>

              <div className="px-3 py-2">
                <p className="text-[11px] text-[#57534E]">Up</p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-[#991B1B]">
                  {formatSpeed(upSpeed)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Active Book Viewer (EPUB or PDF) */}
        {blobUrl && (
          <div className="pt-1">
            {isPdf ? (
              <PdfViewer
                blobUrl={blobUrl}
                title={work.title}
                seedingStatus={{ peers, uploadSpeed: upSpeed }}
              />
            ) : (
              <EpubViewer
                blobUrl={blobUrl}
                title={work.title}
                seedingStatus={{ peers, uploadSpeed: upSpeed }}
              />
            )}
          </div>
        )}
      </section>
    </article>
  );
}
