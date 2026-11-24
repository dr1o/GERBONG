import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  ChevronRight,
  X,
  RefreshCw,
  AlertCircle,
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

function AuthorAvatar({ name, imageUrl }) {
  const [imgError, setImgError] = useState(false);

  if (imageUrl && !imgError) {
    return (
      <img
        src={imageUrl}
        alt={name}
        onError={() => setImgError(true)}
        className="h-14 w-14 rounded-[2px] object-cover border border-[#D5CFC2] bg-[#EFECE4] shrink-0"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[2px] border border-[#D5CFC2] bg-[#EFECE4] font-serif text-base font-bold text-[#161615]">
      {getInitials(name)}
    </div>
  );
}

export default function AuthorsPage() {
  const { isAdmin } = useAuth();
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchAuthors = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axiosClient.get("/authors");
      setAuthors(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal memuat daftar tokoh."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuthors();
  }, [fetchAuthors]);

  const filteredAuthors = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return authors;
    return authors.filter((author) =>
      [author.name, author.era, author.lifespan, author.birthplace, author.bio]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    );
  }, [authors, search]);

  return (
    <section className="space-y-5">
      {/* Page Header */}
      <div className="flex items-end justify-between gap-3 border-b border-[#D5CFC2] pb-3">
        <div className="flex items-baseline gap-2.5">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#161615]">
            Pemikir &amp; Tokoh
          </h1>
          {!loading && (
            <span className="font-mono text-xs text-[#57534E]">
              [{authors.length}]
            </span>
          )}
        </div>

        {isAdmin && (
          <Link
            to="/authors/new"
            className="inline-flex items-center gap-1.5 rounded-[2px] bg-[#991B1B] hover:bg-[#7F1D1D] px-3.5 py-2 text-sm font-medium text-[#F4F1EA] transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>Tambah Tokoh</span>
          </Link>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#57534E]" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama tokoh, era, atau tempat lahir..."
          aria-label="Cari tokoh"
          className="w-full rounded-[2px] border border-[#D5CFC2] bg-[#FAF8F3] pl-9 pr-9 py-2 text-sm text-[#161615] placeholder:text-[#57534E]/75 focus:border-[#991B1B] focus:outline-none transition-colors"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Bersihkan pencarian"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-[2px] p-1 text-[#57534E] hover:text-[#161615] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-start justify-between gap-3 rounded-[2px] border border-[#991B1B] bg-[#991B1B]/10 p-3.5 text-sm text-[#991B1B]">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchAuthors}
            className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#991B1B] bg-[#F4F1EA] hover:bg-[#EFECE4] px-2.5 py-1 text-xs font-medium text-[#991B1B] shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Coba Lagi
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <div className="border-t border-[#D5CFC2] divide-y divide-[#D5CFC2]">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex items-center gap-4 py-4 animate-pulse"
            >
              <div className="h-14 w-14 rounded-[2px] bg-[#E5DFD2] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded-[2px] bg-[#E5DFD2]" />
                <div className="h-3 w-28 rounded-[2px] bg-[#EAE4D8]" />
                <div className="h-3 w-full rounded-[2px] bg-[#EAE4D8]" />
              </div>
            </div>
          ))}
        </div>
      ) : authors.length === 0 ? (
        isAdmin ? (
          <EmptyState
            title="Belum Ada Tokoh di Arsip"
            description="Basis data tokoh GERBONG masih kosong. Tambahkan pemikir, sastrawan, atau tokoh sejarah Indonesia pertama untuk memulai arsip."
            actionLabel="+ Tambah Tokoh Pertama"
            actionTo="/authors/new"
          />
        ) : (
          <EmptyState
            title="Belum ada data di arsip"
            description="Belum ada data tokoh yang dipublikasikan di arsip GERBONG."
          />
        )
      ) : filteredAuthors.length === 0 ? (
        <EmptyState
          title="Tokoh Tidak Ditemukan"
          description={`Tidak ada tokoh yang cocok dengan kata kunci "${search}".`}
          actionLabel="Reset Pencarian"
          onAction={() => setSearch("")}
        />
      ) : (
        <div className="border-t border-[#D5CFC2] divide-y divide-[#D5CFC2]">
          {filteredAuthors.map((author) => (
            <Link
              key={author.id}
              to={`/authors/${author.id}`}
              className="group flex items-start gap-4 py-4 hover:bg-[#EFECE4]/70 -mx-2 px-2 transition-colors"
            >
              <AuthorAvatar name={author.name} imageUrl={author.image_url} />

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="font-serif text-lg font-bold text-[#161615] group-hover:text-[#991B1B] transition-colors truncate">
                    {author.name}
                  </h2>
                  <ChevronRight className="w-4 h-4 text-[#57534E] group-hover:text-[#991B1B] transition-colors shrink-0 self-center" />
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#57534E]">
                  {author.lifespan && (
                    <span className="font-mono text-[#161615]">
                      {author.lifespan}
                    </span>
                  )}
                  {author.era && (
                    <span className="rounded-[2px] border border-[#D5CFC2] bg-[#EFECE4] px-1.5 py-0.5 text-[11px] font-medium text-[#161615]">
                      {author.era}
                    </span>
                  )}
                  {author.birthplace && (
                    <span className="truncate">• {author.birthplace}</span>
                  )}
                </div>

                {(author.quote || author.bio) && (
                  <p className="mt-1.5 line-clamp-2 text-xs text-[#57534E] leading-relaxed">
                    {author.quote ? `“${author.quote}”` : author.bio}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
