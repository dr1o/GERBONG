import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Github,
  ExternalLink,
  Sun,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  KeyRound,
  LogOut,
} from "lucide-react";
import { useSwarm } from "../context/SwarmContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const CREATOR_PROFILE = {
  nama: "Fitrandi Sabila Mustaqim",
  nim: "21120124130061",
  githubHandle: "dr1o",
  githubUrl: "https://github.com/dr1o",
};

function formatSpeed(bytesPerSec = 0) {
  const num = Number(bytesPerSec || 0);
  if (num < 1024) return `${num.toFixed(0)} B/s`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB/s`;
  return `${(num / (1024 * 1024)).toFixed(2)} MB/s`;
}

function formatMegabytes(bytes = 0) {
  return (Number(bytes || 0) / (1024 * 1024)).toFixed(2);
}

export default function AboutProfilePage() {
  const { isAdmin, logout } = useAuth();
  const {
    activeTorrents,
    totalPeers,
    downloadSpeed,
    uploadSpeed,
    totalUploaded,
    removeTorrent,
    clearAllTorrents,
  } = useSwarm();

  const wakeLockSentinelRef = useRef(null);

  const [wakeLockEnabled, setWakeLockEnabled] = useState(false);
  const [wakeLockError, setWakeLockError] = useState("");
  const [copiedHash, setCopiedHash] = useState("");

  async function requestScreenWakeLock() {
    setWakeLockError("");
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      setWakeLockError("Peramban ini tidak mendukung Screen Wake Lock API.");
      setWakeLockEnabled(false);
      return;
    }

    try {
      const sentinel = await navigator.wakeLock.request("screen");
      wakeLockSentinelRef.current = sentinel;
      setWakeLockEnabled(true);

      sentinel.addEventListener("release", () => {
        if (wakeLockSentinelRef.current === sentinel) {
          wakeLockSentinelRef.current = null;
          setWakeLockEnabled(false);
        }
      });
    } catch (err) {
      setWakeLockError(
        err?.message || "Gagal mengaktifkan Screen Wake Lock pada perangkat ini."
      );
      setWakeLockEnabled(false);
    }
  }

  async function releaseScreenWakeLock() {
    setWakeLockError("");
    try {
      if (wakeLockSentinelRef.current) {
        await wakeLockSentinelRef.current.release();
        wakeLockSentinelRef.current = null;
      }
    } catch {
      // ignore release errors
    } finally {
      setWakeLockEnabled(false);
    }
  }

  function handleToggleWakeLock() {
    if (wakeLockEnabled) {
      releaseScreenWakeLock();
    } else {
      requestScreenWakeLock();
    }
  }

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        wakeLockEnabled &&
        !wakeLockSentinelRef.current
      ) {
        requestScreenWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [wakeLockEnabled]);

  useEffect(() => {
    return () => {
      if (wakeLockSentinelRef.current) {
        wakeLockSentinelRef.current.release().catch(() => {});
      }
    };
  }, []);

  async function handleCopyMagnet(magnetURI, infoHash) {
    if (!magnetURI) return;
    try {
      await navigator.clipboard.writeText(magnetURI);
    } catch {
      const el = document.createElement("textarea");
      el.value = magnetURI;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedHash(infoHash);
    setTimeout(() => setCopiedHash(""), 2500);
  }

  return (
    <section className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-[#D5CFC2] pb-3">
        <h1 className="font-serif text-2xl font-bold tracking-tight text-[#161615]">
          Katalog, Profil &amp; Simpul Relawan
        </h1>
      </div>

      {/* Creator Profile Card */}
      <div className="rounded-[2px] border border-[#D5CFC2] bg-[#FAF8F3] p-5 space-y-3">
        <h2 className="font-serif text-xl font-bold tracking-tight text-[#161615] border-b border-[#D5CFC2] pb-2">
          Identitas Penyusun
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="space-y-1">
            <p className="font-serif text-lg font-bold text-[#161615]">
              {CREATOR_PROFILE.nama}
            </p>
            <p className="font-mono text-xs text-[#57534E]">
              NIM: <span className="text-[#161615] font-semibold">{CREATOR_PROFILE.nim}</span>
            </p>
          </div>

          <a
            href={CREATOR_PROFILE.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] hover:border-[#161615] px-3.5 py-2 font-mono text-xs font-medium text-[#161615] transition-colors"
          >
            <Github className="w-4 h-4 text-[#991B1B]" />
            <span>@{CREATOR_PROFILE.githubHandle}</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#57534E]" />
          </a>
        </div>
      </div>

      {/* About GERBONG Card */}
      <div className="rounded-[2px] border border-[#D5CFC2] bg-[#FAF8F3] p-5 space-y-4">
        <h2 className="font-serif text-xl font-bold tracking-tight text-[#161615] border-b border-[#D5CFC2] pb-2">
          Gerakan Bacaan dan Arsip Gotong-Royong (GERBONG)
        </h2>

        <p className="text-sm text-[#161615] leading-relaxed">
          <strong>GERBONG</strong> adalah Progressive Web App (PWA) arsip digital
          terdesentralisasi yang menghimpun biografi pemikir dan karya sejarah Indonesia.
          Alih-alih bergantung pada satu server penyimpanan berkas terpusat, GERBONG
          memisahkan katalog metadata dan distribusi berkas agar pengetahuan tetap hidup
          secara kolektif.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 border border-[#D5CFC2] divide-y sm:divide-y-0 sm:divide-x divide-[#D5CFC2] bg-[#F4F1EA]">
          <div className="p-3.5 space-y-1">
            <h3 className="font-serif text-sm font-bold text-[#161615]">
              Control Plane (Katalog Metadata)
            </h3>
            <p className="text-xs text-[#57534E] leading-relaxed">
              REST API Express + Supabase PostgreSQL mengelola indeks tokoh, kategori, dan
              tautan Magnet URI dengan dukungan cache offline PWA.
            </p>
          </div>

          <div className="p-3.5 space-y-1">
            <h3 className="font-serif text-sm font-bold text-[#161615]">
              Data Plane (WebTorrent P2P)
            </h3>
            <p className="text-xs text-[#57534E] leading-relaxed">
              Berkas <code className="font-mono text-[#991B1B]">.epub</code> dan{" "}
              <code className="font-mono text-[#991B1B]">.pdf</code> dialirkan langsung
              antar-peramban relawan melalui WebRTC tanpa beban penyimpanan terpusat.
            </p>
          </div>
        </div>
      </div>

      {/* Simpul Relawan GERBONG Card */}
      <div className="rounded-[2px] border border-[#D5CFC2] bg-[#FAF8F3] p-5 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#D5CFC2] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl font-bold tracking-tight text-[#161615]">
                Simpul Relawan GERBONG
              </h2>
              <span className="font-mono text-xs text-[#991B1B]">
                [{activeTorrents.length > 0 ? "SEEDING" : "SIAGA"}]
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[#57534E]">
              Telemetri WebTorrent P2P &amp; penyemaian arsip gotong-royong
            </p>
          </div>

          {/* Screen Wake Lock Toggle */}
          <button
            type="button"
            onClick={handleToggleWakeLock}
            aria-pressed={wakeLockEnabled}
            className={`inline-flex items-center gap-2 rounded-[2px] border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              wakeLockEnabled
                ? "border-[#991B1B] bg-[#991B1B] text-[#F4F1EA]"
                : "border-[#D5CFC2] bg-[#F4F1EA] hover:border-[#161615] text-[#161615]"
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>
              {wakeLockEnabled ? "Screen Wake Lock: Aktif" : "Aktifkan Screen Wake Lock"}
            </span>
          </button>
        </div>

        <p className="text-xs text-[#57534E] leading-relaxed">
          Peramban Anda otomatis berfungsi sebagai simpul relawan WebTorrent yang menyemai
          (<em>seed</em>) buku-buku arsip yang sedang Anda buka. Aktifkan{" "}
          <strong className="text-[#161615]">Screen Wake Lock</strong> agar layar tidak mati saat menyemai arsip bagi
          pembaca lain.
        </p>

        {wakeLockError && (
          <div className="flex items-start gap-2 rounded-[2px] border border-[#991B1B] bg-[#991B1B]/10 px-3 py-2 text-xs text-[#991B1B]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{wakeLockError}</span>
          </div>
        )}

        {/* Telemetry Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border border-[#D5CFC2] divide-y sm:divide-y-0 sm:divide-x divide-[#D5CFC2] bg-[#F4F1EA]">
          <div className="p-3">
            <p className="text-[11px] text-[#57534E]">Torrent Aktif</p>
            <p className="mt-0.5 font-mono text-base font-semibold text-[#161615]">
              {activeTorrents.length}
            </p>
          </div>

          <div className="p-3">
            <p className="text-[11px] text-[#57534E]">Total Diunggah</p>
            <p className="mt-0.5 font-mono text-base font-semibold text-[#991B1B]">
              {formatMegabytes(totalUploaded)} MB
            </p>
          </div>

          <div className="p-3">
            <p className="text-[11px] text-[#57534E]">Total Peers</p>
            <p className="mt-0.5 font-mono text-base font-semibold text-[#161615]">
              {totalPeers}
            </p>
          </div>

          <div className="p-3">
            <p className="text-[11px] text-[#57534E]">Kecepatan Up / Down</p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-[#161615]">
              ↑ {formatSpeed(uploadSpeed)}
            </p>
            {downloadSpeed > 0 && (
              <p className="font-mono text-[11px] text-[#57534E]">
                ↓ {formatSpeed(downloadSpeed)}
              </p>
            )}
          </div>
        </div>

        {/* Active Seeding Torrents List */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D5CFC2] pb-2">
            <h3 className="font-serif text-base font-bold text-[#161615]">
              Daftar Torrent yang Disemai{" "}
              <span className="font-mono text-xs font-normal text-[#57534E]">
                [{activeTorrents.length}]
              </span>
            </h3>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={activeTorrents.length === 0}
                onClick={clearAllTorrents}
                className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#991B1B] bg-[#F4F1EA] hover:bg-[#991B1B]/10 disabled:opacity-40 disabled:pointer-events-none px-3 py-1.5 text-xs font-medium text-[#991B1B] transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hentikan Semua Torrent</span>
              </button>
            </div>
          </div>

          {activeTorrents.length === 0 ? (
            <div className="py-4 text-left border-b border-[#D5CFC2]">
              <p className="font-serif text-sm font-bold text-[#161615]">
                Belum ada torrent yang sedang disemai
              </p>
              <p className="mt-0.5 text-xs text-[#57534E]">
                Buka salah satu karya di tab Pustaka lalu klik &ldquo;Muat &amp; Baca dari
                Swarm&rdquo; untuk membaca sekaligus menyemai secara otomatis.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#D5CFC2] border-b border-[#D5CFC2]">
              {activeTorrents.map((t) => (
                <div key={t.infoHash || t.magnetURI} className="py-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-serif text-base font-bold text-[#161615] truncate">
                        {t.title || t.name}
                      </p>
                      <p className="font-mono text-[11px] text-[#57534E] truncate">
                        InfoHash: {t.infoHash || "Menghubungkan..."}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {t.magnetURI && (
                        <button
                          type="button"
                          onClick={() => handleCopyMagnet(t.magnetURI, t.infoHash)}
                          className="inline-flex items-center gap-1 rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] hover:border-[#161615] px-2 py-1 text-[11px] text-[#161615] transition-colors cursor-pointer"
                        >
                          {copiedHash === t.infoHash ? (
                            <>
                              <Check className="w-3 h-3 text-[#991B1B]" />
                              <span>Disalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Magnet</span>
                            </>
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          removeTorrent(t.originalMagnetURI || t.magnetURI || t.infoHash)
                        }
                        aria-label={`Hentikan torrent ${t.title || t.name}`}
                        className="rounded-[2px] border border-[#991B1B] bg-[#F4F1EA] hover:bg-[#991B1B]/10 p-1.5 text-[#991B1B] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-[#57534E]">
                    <span className="text-[#991B1B] font-semibold">
                      Progress: {Number(t.progress || 0).toFixed(1)}%
                    </span>
                    <span>Peers: {t.numPeers}</span>
                    <span>Up: {formatSpeed(t.uploadSpeed)}</span>
                    <span>Diunggah: {formatMegabytes(t.uploaded)} MB</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="font-mono text-[11px] text-[#57534E]">
          STUN: stun.l.google.com:19302 • global.stun.twilio.com:3478
        </p>
      </div>

      {/* Akses Pengelola (Admin) Card */}
      <div className="rounded-[2px] border border-[#D5CFC2] bg-[#FAF8F3] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-lg font-bold tracking-tight text-[#161615]">
              Akses Pengelola (Admin)
            </h2>
            {isAdmin && (
              <span className="font-mono text-xs font-semibold text-[#991B1B]">
                [AKTIF]
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-[#57534E]">
            {isAdmin
              ? "Sesi pengelola aktif. Anda dapat menambah, menyunting, dan menghapus data tokoh, karya, serta kategori."
              : "Pembaca tidak perlu login. Masuk sebagai admin hanya untuk mengelola katalog arsip."}
          </p>
        </div>

        {isAdmin ? (
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center justify-center gap-2 rounded-[2px] border border-[#991B1B] bg-[#F4F1EA] hover:bg-[#991B1B]/10 px-4 py-2 text-xs font-medium text-[#991B1B] transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Admin Aktif — Logout</span>
          </button>
        ) : (
          <Link
            to="/admin/login"
            className="inline-flex items-center justify-center gap-2 rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] hover:border-[#161615] px-4 py-2 text-xs font-medium text-[#161615] transition-colors shrink-0"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#991B1B]" />
            <span>Admin Login</span>
          </Link>
        )}
      </div>
    </section>
  );
}
