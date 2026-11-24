import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Share2,
  Pencil,
  Trash2,
  Plus,
  Check,
  Loader2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import axiosClient, { getApiErrorMessage } from "../api/axiosClient.js";
import EmptyState from "../components/EmptyState.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "TK"
  );
}

export default function AuthorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imgError, setImgError] = useState(false);

  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchAuthor = useCallback(async () => {
    setLoading(true);
    setError("");
    setImgError(false);
    try {
      const { data } = await axiosClient.get(`/authors/${id}`);
      setAuthor(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal memuat profil tokoh."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAuthor();
  }, [fetchAuthor]);

  async function handleShare() {
    const shareUrl = window.location.href;
    const shareData = {
      title: `${author?.name || "Tokoh"} — GERBONG`,
      text: `Pelajari arsip pemikiran ${author?.name || "tokoh ini"} di GERBONG (Gerakan Bacaan dan Arsip Gotong-Royong).`,
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

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const tempInput = document.createElement("input");
      tempInput.value = shareUrl;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError("");
    try {
      await axiosClient.delete(`/authors/${id}`);
      navigate("/authors", { replace: true });
    } catch (err) {
      setDeleteError(
        getApiErrorMessage(
          err,
          "Gagal menghapus tokoh. Pastikan seluruh karya terkait sudah dihapus atau dipindahkan."
        )
      );
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-sm text-[#57534E] gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-[#991B1B]" />
        Memuat berkas tokoh...
      </div>
    );
  }

  if (error || !author) {
    return (
      <div className="space-y-4">
        <Link
          to="/authors"
          className="inline-flex items-center gap-1.5 text-sm text-[#57534E] hover:text-[#161615] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Tokoh
        </Link>
        <div className="rounded-[2px] border border-[#991B1B] bg-[#991B1B]/10 p-4 text-sm text-[#991B1B] flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Tokoh tidak dapat dimuat</p>
            <p className="mt-1">{error || "Data tokoh tidak ditemukan."}</p>
          </div>
        </div>
      </div>
    );
  }

  const works = Array.isArray(author.works) ? author.works : [];

  return (
    <article className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D5CFC2] pb-3">
        <Link
          to="/authors"
          className="inline-flex items-center gap-1.5 text-sm text-[#57534E] hover:text-[#161615] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Daftar Tokoh</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#D5CFC2] bg-[#FAF8F3] hover:border-[#161615] px-3 py-1.5 text-xs font-medium text-[#161615] transition-colors cursor-pointer"
          >
            {copied ? (
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
                to={`/authors/${author.id}/edit`}
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

      {/* Inline Delete Confirmation */}
      {isAdmin && confirmDelete && (
        <div className="rounded-[2px] border border-[#991B1B] bg-[#FAF8F3] p-4 space-y-3">
          <p className="text-sm text-[#161615]">
            Hapus profil <span className="font-semibold">{author.name}</span> dari arsip GERBONG? Tindakan ini tidak dapat dibatalkan.
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
              {deleting ? "Menghapus..." : "Ya, Hapus Tokoh"}
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

      {/* Thinker Dossier Index Card */}
      <div className="rounded-[2px] border border-[#D5CFC2] bg-[#FAF8F3] p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 border-b border-[#D5CFC2] pb-5">
          {author.image_url && !imgError ? (
            <img
              src={author.image_url}
              alt={author.name}
              onError={() => setImgError(true)}
              className="h-24 w-24 rounded-[2px] object-cover border border-[#D5CFC2] bg-[#EFECE4] shrink-0"
            />
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[2px] border border-[#D5CFC2] bg-[#EFECE4] font-serif text-2xl font-bold text-[#161615]">
              {getInitials(author.name)}
            </div>
          )}

          <div className="space-y-1.5 min-w-0">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#161615] leading-tight">
              {author.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#57534E]">
              {author.lifespan && (
                <span className="font-mono text-[#161615] font-medium">
                  {author.lifespan}
                </span>
              )}
              {author.era && (
                <span className="rounded-[2px] border border-[#D5CFC2] bg-[#EFECE4] px-2 py-0.5 text-[11px] font-medium text-[#161615]">
                  {author.era}
                </span>
              )}
              {author.birthplace && <span>Tempat Lahir: {author.birthplace}</span>}
            </div>
          </div>
        </div>

        {author.quote && (
          <blockquote className="mt-4 border-l-2 border-[#991B1B] pl-4 py-1">
            <p className="font-serif italic text-base text-[#161615] leading-relaxed">
              &ldquo;{author.quote}&rdquo;
            </p>
          </blockquote>
        )}

        <div className="mt-4 pt-4 border-t border-[#D5CFC2]">
          <h2 className="font-serif text-base font-bold text-[#161615] mb-2">
            Biografi &amp; Riwayat Pemikiran
          </h2>
          {author.bio ? (
            <p className="text-sm text-[#161615] leading-relaxed whitespace-pre-line">
              {author.bio}
            </p>
          ) : (
            <p className="text-xs text-[#57534E] italic">
              Belum ada catatan biografi untuk tokoh ini.
            </p>
          )}
        </div>
      </div>

      {/* Works by this Author */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3 border-b border-[#D5CFC2] pb-2.5">
          <div className="flex items-baseline gap-2">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-[#161615]">
              Bibliografi Karya
            </h2>
            <span className="font-mono text-xs text-[#57534E]">
              [{works.length}]
            </span>
          </div>

          {isAdmin && (
            <Link
              to={`/works/new?author_id=${author.id}`}
              className="inline-flex items-center gap-1.5 rounded-[2px] bg-[#991B1B] hover:bg-[#7F1D1D] px-3 py-1.5 text-xs font-medium text-[#F4F1EA] transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              <span>Tambah Karya</span>
            </Link>
          )}
        </div>

        {works.length === 0 ? (
          isAdmin ? (
            <EmptyState
              title="Belum Ada Karya Tercatat"
              description={`Belum ada buku atau tulisan milik ${author.name} di arsip GERBONG.`}
              actionLabel="+ Tambah Karya"
              actionTo={`/works/new?author_id=${author.id}`}
            />
          ) : (
            <EmptyState
              title="Belum ada data di arsip"
              description={`Belum ada buku atau tulisan milik ${author.name} yang dipublikasikan di arsip GERBONG.`}
            />
          )
        ) : (
          <div className="divide-y divide-[#D5CFC2] border-b border-[#D5CFC2]">
            {works.map((work) => {
              const fmt = (work.format || "EPUB").toUpperCase();

              return (
                <Link
                  key={work.id}
                  to={`/works/${work.id}`}
                  className="group flex items-start justify-between gap-3 py-3.5 hover:bg-[#EFECE4]/70 -mx-2 px-2 transition-colors"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-[2px] border border-[#161615] px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-[#161615]">
                        {fmt}
                      </span>
                      {work.categories?.name && (
                        <span className="rounded-[2px] border border-[#D5CFC2] bg-[#EFECE4] px-1.5 py-0.5 text-[11px] text-[#57534E]">
                          {work.categories.name}
                        </span>
                      )}
                      {work.year && (
                        <span className="font-mono text-xs text-[#57534E]">
                          ({work.year})
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-base font-bold text-[#161615] group-hover:text-[#991B1B] transition-colors">
                      {work.title}
                    </h3>

                    {work.summary && (
                      <p className="line-clamp-2 text-xs text-[#57534E] leading-relaxed">
                        {work.summary}
                      </p>
                    )}

                    {(work.file_size || work.page_count) && (
                      <div className="flex items-center gap-3 font-mono text-[11px] text-[#57534E] pt-0.5">
                        {work.file_size && <span>{work.file_size}</span>}
                        {work.page_count && <span>{work.page_count} hlm.</span>}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#57534E] group-hover:text-[#991B1B] shrink-0 mt-1 transition-colors" />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </article>
  );
}
