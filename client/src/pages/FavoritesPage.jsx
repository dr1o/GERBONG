import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  Check,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";
import axiosClient, { getApiErrorMessage } from "../api/axiosClient.js";
import EmptyState from "../components/EmptyState.jsx";
import { useFavorites } from "../context/FavoritesContext.jsx";

export default function FavoritesPage() {
  const { favorites, isFavorite, toggleFavorite, removeFavorite, clearFavorites } =
    useFavorites();

  const [showPicker, setShowPicker] = useState(false);
  const [catalogWorks, setCatalogWorks] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [pickerSearch, setPickerSearch] = useState("");
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError("");
    try {
      const { data } = await axiosClient.get("/works");
      setCatalogWorks(Array.isArray(data) ? data : []);
    } catch (err) {
      setCatalogError(getApiErrorMessage(err, "Gagal memuat katalog buku."));
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showPicker && catalogWorks.length === 0 && !catalogLoading) {
      loadCatalog();
    }
  }, [showPicker, catalogWorks.length, catalogLoading, loadCatalog]);

  const filteredCatalog = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return catalogWorks;
    return catalogWorks.filter((work) =>
      [work.title, work.authors?.name, work.categories?.name, work.format, work.year]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [catalogWorks, pickerSearch]);

  return (
    <section className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-[#D5CFC2] pb-3">
        <div>
          <div className="flex items-baseline gap-2.5">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[#161615]">
              Pustaka Favorit
            </h1>
            <span className="font-mono text-xs text-[#57534E]">
              [{favorites.length}]
            </span>
          </div>
          <p className="mt-1 text-xs text-[#57534E]">
            Daftar bacaan pilihan yang tersimpan secara lokal di perangkat Anda (localStorage).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowPicker((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-[2px] border px-3 py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
              showPicker
                ? "border-[#161615] bg-[#EFECE4] text-[#161615]"
                : "border-[#991B1B] bg-[#991B1B] hover:bg-[#7F1D1D] text-[#F4F1EA]"
            }`}
          >
            {showPicker ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showPicker ? "Tutup Pilihan" : "Pilih Buku dari Katalog"}</span>
          </button>

          {favorites.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmClearAll((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#991B1B] bg-[#FAF8F3] hover:bg-[#991B1B]/10 px-3 py-2 text-xs sm:text-sm font-medium text-[#991B1B] transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirm Clear All */}
      {confirmClearAll && favorites.length > 0 && (
        <div className="rounded-[2px] border border-[#991B1B] bg-[#FAF8F3] p-4 space-y-3">
          <p className="text-sm text-[#161615]">
            Kosongkan seluruh {favorites.length} buku dari daftar favorit lokal perangkat ini?
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                clearFavorites();
                setConfirmClearAll(false);
              }}
              className="rounded-[2px] bg-[#991B1B] hover:bg-[#7F1D1D] px-3.5 py-1.5 text-xs font-medium text-[#F4F1EA] transition-colors cursor-pointer"
            >
              Ya, Hapus Semua
            </button>
            <button
              type="button"
              onClick={() => setConfirmClearAll(false)}
              className="rounded-[2px] border border-[#D5CFC2] bg-[#EFECE4] hover:border-[#161615] px-3.5 py-1.5 text-xs font-medium text-[#161615] transition-colors cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Catalog Book Picker Panel */}
      {showPicker && (
        <div className="rounded-[2px] border border-[#D5CFC2] bg-[#FAF8F3] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-[#D5CFC2] pb-2">
            <h2 className="font-serif text-lg font-bold text-[#161615]">
              Pilih Buku ke Favorit
            </h2>
            <button
              type="button"
              onClick={loadCatalog}
              disabled={catalogLoading}
              className="font-mono text-[11px] text-[#991B1B] hover:underline cursor-pointer disabled:opacity-50"
            >
              {catalogLoading ? "Memuat..." : "[Muat Ulang]"}
            </button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#57534E]" />
            <input
              type="search"
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              placeholder="Cari judul buku atau tokoh di katalog..."
              aria-label="Cari buku untuk ditambahkan ke favorit"
              className="w-full rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] pl-9 pr-9 py-2 text-sm text-[#161615] placeholder:text-[#57534E]/75 focus:border-[#991B1B] focus:outline-none"
            />
            {pickerSearch && (
              <button
                type="button"
                onClick={() => setPickerSearch("")}
                aria-label="Bersihkan pencarian katalog"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#57534E] hover:text-[#161615] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {catalogError && (
            <div className="flex items-start gap-2 rounded-[2px] border border-[#991B1B] bg-[#991B1B]/10 p-3 text-xs text-[#991B1B]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{catalogError}</span>
            </div>
          )}

          {catalogLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-[#57534E]">
              <Loader2 className="w-4 h-4 animate-spin text-[#991B1B]" />
              Memuat daftar buku dari katalog...
            </div>
          ) : filteredCatalog.length === 0 ? (
            <p className="py-6 text-xs text-[#57534E] border-y border-[#D5CFC2]">
              Tidak ada buku di katalog yang cocok untuk dipilih.
            </p>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-[#D5CFC2] border-y border-[#D5CFC2]">
              {filteredCatalog.map((work) => {
                const saved = isFavorite(work.id);
                const fmt = String(work.format || "EPUB").toUpperCase();

                return (
                  <div
                    key={work.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-[2px] border border-[#161615] px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-[#161615]">
                          {fmt}
                        </span>
                        {work.year && (
                          <span className="font-mono text-[11px] text-[#57534E]">
                            {work.year}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-serif text-sm font-bold text-[#161615] truncate">
                        {work.title}
                      </p>
                      {work.authors?.name && (
                        <p className="text-xs text-[#57534E] truncate">
                          {work.authors.name}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleFavorite(work)}
                      className={`inline-flex items-center gap-1.5 rounded-[2px] border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                        saved
                          ? "border-[#991B1B] bg-[#991B1B] text-[#F4F1EA]"
                          : "border-[#D5CFC2] bg-[#F4F1EA] hover:border-[#161615] text-[#161615]"
                      }`}
                    >
                      {saved ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Tersimpan</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5 text-[#991B1B]" />
                          <span>Pilih</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Saved Favorites List */}
      {favorites.length === 0 ? (
        <EmptyState
          title="Belum Ada Buku Favorit"
          description="Simpan buku pilihan Anda dari katalog Pustaka atau klik tombol Pilih Buku di atas. Data favorit disimpan di memori peramban tanpa perlu login."
          actionLabel="Jelajahi Katalog Pustaka"
          actionTo="/works"
        />
      ) : (
        <div className="border-t border-b border-[#D5CFC2] divide-y divide-[#D5CFC2]">
          {favorites.map((work) => {
            const fmt = String(work.format || "EPUB").toUpperCase();

            return (
              <div
                key={work.id}
                className="flex items-start justify-between gap-3 py-4 hover:bg-[#EFECE4]/50 -mx-2 px-2 transition-colors"
              >
                <Link to={`/works/${work.id}`} className="group min-w-0 flex-1 space-y-1">
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
                  </div>

                  <div className="flex items-center gap-1.5">
                    <h2 className="font-serif text-lg font-bold text-[#161615] group-hover:text-[#991B1B] transition-colors leading-snug">
                      {work.title}
                    </h2>
                    <ChevronRight className="w-4 h-4 text-[#57534E] group-hover:text-[#991B1B] shrink-0" />
                  </div>

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

                  {work.summary && (
                    <p className="line-clamp-2 text-xs text-[#57534E] leading-relaxed">
                      {work.summary}
                    </p>
                  )}

                  {(work.file_size || work.page_count) && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 font-mono text-[11px] text-[#57534E]">
                      {work.file_size && <span>{work.file_size}</span>}
                      {work.page_count && <span>{work.page_count} hlm.</span>}
                    </div>
                  )}
                </Link>

                <button
                  type="button"
                  onClick={() => removeFavorite(work.id)}
                  aria-label={`Hapus ${work.title} dari favorit`}
                  className="inline-flex items-center gap-1 rounded-[2px] border border-[#991B1B] bg-[#FAF8F3] hover:bg-[#991B1B]/10 px-2.5 py-1.5 text-xs font-medium text-[#991B1B] transition-colors cursor-pointer shrink-0 mt-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
