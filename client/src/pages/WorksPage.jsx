import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  Tag,
  Bookmark,
  ChevronRight,
  X,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import axiosClient, { getApiErrorMessage } from "../api/axiosClient.js";
import EmptyState from "../components/EmptyState.jsx";
import CategoryManagerModal from "../components/CategoryManagerModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useFavorites } from "../context/FavoritesContext.jsx";

const FORMAT_TABS = [
  { key: "ALL", label: "Semua" },
  { key: "EPUB", label: "EPUB" },
  { key: "PDF", label: "PDF" },
];

export default function WorksPage() {
  const { isAdmin } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [works, setWorks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formatFilter, setFormatFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [worksRes, categoriesRes] = await Promise.all([
        axiosClient.get("/works"),
        axiosClient.get("/categories"),
      ]);
      setWorks(Array.isArray(worksRes.data) ? worksRes.data : []);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal memuat katalog pustaka."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCounts = useMemo(() => {
    let epub = 0;
    let pdf = 0;
    for (const work of works) {
      const fmt = String(work.format || "").toUpperCase();
      if (fmt === "EPUB") epub += 1;
      else if (fmt === "PDF") pdf += 1;
    }
    return { ALL: works.length, EPUB: epub, PDF: pdf };
  }, [works]);

  const filteredWorks = useMemo(() => {
    const q = search.trim().toLowerCase();

    return works.filter((work) => {
      if (formatFilter !== "ALL") {
        const fmt = String(work.format || "").toUpperCase();
        if (fmt !== formatFilter) return false;
      }

      if (categoryFilter) {
        const workCatId = String(work.category_id ?? work.categories?.id ?? "");
        if (workCatId !== String(categoryFilter)) return false;
      }

      if (q) {
        const haystack = [
          work.title,
          work.authors?.name,
          work.categories?.name,
          work.year,
          work.summary,
          work.format,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [works, formatFilter, categoryFilter, search]);

  const hasActiveFilters = formatFilter !== "ALL" || Boolean(categoryFilter) || Boolean(search.trim());

  function resetFilters() {
    setFormatFilter("ALL");
    setCategoryFilter("");
    setSearch("");
  }

  return (
    <section className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-[#D5CFC2] pb-3">
        <div className="flex items-baseline gap-2.5">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#161615]">
            Pustaka Arsip
          </h1>
          {!loading && (
            <span className="font-mono text-xs text-[#57534E]">
              [{works.length}]
            </span>
          )}
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#D5CFC2] bg-[#FAF8F3] hover:border-[#161615] px-3 py-2 text-xs sm:text-sm font-medium text-[#161615] transition-colors cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-[#991B1B]" />
              <span>Kelola Kategori</span>
            </button>

            <Link
              to="/works/new"
              className="inline-flex items-center gap-1.5 rounded-[2px] bg-[#991B1B] hover:bg-[#7F1D1D] px-3.5 py-2 text-xs sm:text-sm font-medium text-[#F4F1EA] transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              <span>Tambah Karya</span>
            </Link>
          </div>
        )}
      </div>

      {/* Search & Format Filter Controls */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#57534E]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul buku, tokoh, kategori, atau tahun..."
            aria-label="Cari karya"
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

        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Format Filter Tabs */}
          <div
            role="tablist"
            aria-label="Filter format berkas"
            className="inline-flex rounded-[2px] border border-[#D5CFC2] bg-[#EFECE4]"
          >
            {FORMAT_TABS.map(({ key, label }) => {
              const active = formatFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFormatFilter(key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? "bg-[#991B1B] text-[#F4F1EA]"
                      : "text-[#57534E] hover:text-[#161615]"
                  }`}
                >
                  <span>{label}</span>
                  <span className="font-mono text-[10px] opacity-85">
                    ({formatCounts[key]})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Optional Category Filter */}
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter kategori"
              className="rounded-[2px] border border-[#D5CFC2] bg-[#FAF8F3] px-3 py-1.5 text-xs font-medium text-[#161615] focus:border-[#991B1B] focus:outline-none"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
        </div>
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
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#991B1B] bg-[#F4F1EA] hover:bg-[#EFECE4] px-2.5 py-1 text-xs font-medium text-[#991B1B] shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Coba Lagi
          </button>
        </div>
      )}

      {/* Works List */}
      {loading ? (
        <div className="border-t border-[#D5CFC2] divide-y divide-[#D5CFC2]">
          {[1, 2, 3].map((item) => (
            <div key={item} className="py-4 space-y-2 animate-pulse">
              <div className="flex gap-2">
                <div className="h-4 w-12 rounded-[2px] bg-[#E5DFD2]" />
                <div className="h-4 w-20 rounded-[2px] bg-[#EAE4D8]" />
              </div>
              <div className="h-5 w-3/4 rounded-[2px] bg-[#E5DFD2]" />
              <div className="h-3.5 w-1/2 rounded-[2px] bg-[#EAE4D8]" />
            </div>
          ))}
        </div>
      ) : works.length === 0 ? (
        isAdmin ? (
          <EmptyState
            title="Pustaka Arsip Masih Kosong"
            description="Belum ada buku atau dokumen sejarah yang tersimpan di GERBONG. Tambahkan karya pertama beserta tautan Magnet WebTorrent-nya."
            actionLabel="+ Tambah Karya Pertama"
            actionTo="/works/new"
            secondaryLabel="Kelola Kategori"
            onSecondaryAction={() => setIsCategoryModalOpen(true)}
          />
        ) : (
          <EmptyState
            title="Belum ada data di arsip"
            description="Belum ada karya pustaka yang dipublikasikan di arsip GERBONG."
          />
        )
      ) : filteredWorks.length === 0 ? (
        <EmptyState
          title="Karya Tidak Ditemukan"
          description="Tidak ada karya yang sesuai dengan kombinasi filter atau kata kunci pencarian saat ini."
          actionLabel={hasActiveFilters ? "Reset Filter" : undefined}
          onAction={hasActiveFilters ? resetFilters : undefined}
        />
      ) : (
        <div className="border-t border-[#D5CFC2] divide-y divide-[#D5CFC2]">
          {filteredWorks.map((work) => {
            const fmt = String(work.format || "EPUB").toUpperCase();
            const saved = isFavorite(work.id);

            return (
              <Link
                key={work.id}
                to={`/works/${work.id}`}
                className="group block py-4 hover:bg-[#EFECE4]/70 -mx-2 px-2 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    {/* Top Metadata Line */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-[2px] border border-[#161615] px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-[#161615]">
                        {fmt}
                      </span>
                      {work.categories?.name && (
                        <span className="rounded-[2px] border border-[#D5CFC2] bg-[#EFECE4] px-1.5 py-0.5 text-[11px] font-medium text-[#57534E]">
                          {work.categories.name}
                        </span>
                      )}
                      {work.year && (
                        <span className="font-mono text-xs text-[#57534E]">
                          {work.year}
                        </span>
                      )}
                      {work.magnet_uri && (
                        <span className="font-mono text-[10px] text-[#991B1B]">
                          [P2P]
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="font-serif text-lg font-bold text-[#161615] group-hover:text-[#991B1B] transition-colors leading-snug">
                      {work.title}
                    </h2>

                    {/* Author */}
                    {work.authors?.name && (
                      <p className="text-xs text-[#161615]">
                        <span>{work.authors.name}</span>
                        {work.authors.lifespan && (
                          <span className="ml-1.5 font-mono text-[#57534E]">
                            ({work.authors.lifespan})
                          </span>
                        )}
                      </p>
                    )}

                    {/* Summary */}
                    {work.summary && (
                      <p className="line-clamp-2 text-xs text-[#57534E] leading-relaxed">
                        {work.summary}
                      </p>
                    )}

                    {/* Monospace Technical Footer */}
                    {(work.file_size || work.page_count) && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 font-mono text-[11px] text-[#57534E]">
                        {work.file_size && <span>{work.file_size}</span>}
                        {work.page_count && <span>{work.page_count} hlm.</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 mt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite(work);
                      }}
                      aria-label={saved ? `Hapus ${work.title} dari favorit` : `Simpan ${work.title} ke favorit`}
                      aria-pressed={saved}
                      title={saved ? "Hapus dari Favorit" : "Simpan ke Favorit"}
                      className={`rounded-[2px] border p-1.5 transition-colors cursor-pointer ${
                        saved
                          ? "border-[#991B1B] bg-[#991B1B] text-[#F4F1EA]"
                          : "border-[#D5CFC2] bg-[#FAF8F3] text-[#57534E] hover:border-[#161615] hover:text-[#161615]"
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" fill={saved ? "currentColor" : "none"} />
                    </button>
                    <ChevronRight className="w-4 h-4 text-[#57534E] group-hover:text-[#991B1B] transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Categories Modal */}
      {isAdmin && (
        <CategoryManagerModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onUpdated={(updatedCategories) => {
            setCategories(updatedCategories);
            if (
              categoryFilter &&
              !updatedCategories.some((c) => String(c.id) === String(categoryFilter))
            ) {
              setCategoryFilter("");
            }
            fetchData();
          }}
        />
      )}
    </section>
  );
}
