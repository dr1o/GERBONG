import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Tag,
  Loader2,
  AlertCircle,
  Plus,
} from "lucide-react";
import axiosClient, { getApiErrorMessage } from "../api/axiosClient.js";
import CategoryManagerModal from "../components/CategoryManagerModal.jsx";

export default function WorkFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedAuthorId = searchParams.get("author_id") || "";

  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [form, setForm] = useState({
    author_id: isEdit ? "" : preselectedAuthorId,
    category_id: "",
    title: "",
    year: "",
    format: "EPUB",
    file_size: "",
    page_count: "",
    summary: "",
    magnet_uri: "",
  });

  const loadFormOptions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const requests = [
        axiosClient.get("/authors"),
        axiosClient.get("/categories"),
      ];
      if (isEdit) {
        requests.push(axiosClient.get(`/works/${id}`));
      }

      const [authorsRes, categoriesRes, workRes] = await Promise.all(requests);

      const loadedAuthors = Array.isArray(authorsRes.data) ? authorsRes.data : [];
      const loadedCategories = Array.isArray(categoriesRes.data) ? categoriesRes.data : [];

      setAuthors(loadedAuthors);
      setCategories(loadedCategories);

      if (isEdit && workRes?.data) {
        const w = workRes.data;
        setForm({
          author_id: w.author_id != null ? String(w.author_id) : "",
          category_id: w.category_id != null ? String(w.category_id) : "",
          title: w.title || "",
          year: w.year != null ? String(w.year) : "",
          format: String(w.format || "EPUB").toUpperCase() === "PDF" ? "PDF" : "EPUB",
          file_size: w.file_size || "",
          page_count: w.page_count != null ? String(w.page_count) : "",
          summary: w.summary || "",
          magnet_uri: w.magnet_uri || "",
        });
      } else if (!isEdit && preselectedAuthorId) {
        setForm((prev) => ({ ...prev, author_id: String(preselectedAuthorId) }));
      }
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          isEdit ? "Gagal memuat data karya untuk disunting." : "Gagal memuat daftar tokoh dan kategori."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [id, isEdit, preselectedAuthorId]);

  useEffect(() => {
    loadFormOptions();
  }, [loadFormOptions]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      setError("Judul karya wajib diisi.");
      return;
    }

    const yearRaw = form.year.trim();
    const parsedYear =
      yearRaw === "" ? null : Number.isNaN(Number(yearRaw)) ? yearRaw : Number(yearRaw);

    const pageCountRaw = form.page_count.trim();
    const parsedPageCount =
      pageCountRaw === "" ? null : Number.parseInt(pageCountRaw, 10);

    if (pageCountRaw !== "" && (Number.isNaN(parsedPageCount) || parsedPageCount < 0)) {
      setError("Jumlah halaman harus berupa angka positif.");
      return;
    }

    setSubmitting(true);
    setError("");

    const payload = {
      author_id: form.author_id || null,
      category_id: form.category_id || null,
      title: trimmedTitle,
      year: parsedYear,
      format: form.format,
      file_size: form.file_size.trim() || null,
      page_count: parsedPageCount,
      summary: form.summary.trim() || null,
      magnet_uri: form.magnet_uri.trim() || null,
    };

    try {
      const { data } = isEdit
        ? await axiosClient.put(`/works/${id}`, payload)
        : await axiosClient.post("/works", payload);

      navigate(`/works/${data?.id || id}`, { replace: true });
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          isEdit ? "Gagal memperbarui karya." : "Gagal menyimpan karya baru."
        )
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-sm text-[#57534E] gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-[#991B1B]" />
        Memuat formulir karya...
      </div>
    );
  }

  const backHref = isEdit
    ? `/works/${id}`
    : preselectedAuthorId
      ? `/authors/${preselectedAuthorId}`
      : "/works";

  return (
    <section className="space-y-5">
      <div className="border-b border-[#D5CFC2] pb-3">
        <Link
          to={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-[#57534E] hover:text-[#161615] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>
            {isEdit
              ? "Kembali ke Detail Karya"
              : preselectedAuthorId
                ? "Kembali ke Profil Tokoh"
                : "Kembali ke Pustaka"}
          </span>
        </Link>

        <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-[#161615]">
          {isEdit ? "Edit Karya Pustaka" : "Tambah Karya Baru"}
        </h1>
        <p className="mt-1 text-xs text-[#57534E]">
          Indeks metadata buku atau naskah beserta Magnet URI WebTorrent ke arsip GERBONG.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-[2px] border border-[#991B1B] bg-[#991B1B]/10 p-3 text-sm text-[#991B1B]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-[2px] border border-[#D5CFC2] bg-[#FAF8F3] p-5"
      >
        {/* Title */}
        <div className="space-y-1.5">
          <label
            htmlFor="work-title"
            className="block text-xs font-semibold text-[#161615]"
          >
            Judul Karya <span className="text-[#991B1B]">*</span>
          </label>
          <input
            id="work-title"
            name="title"
            type="text"
            required
            value={form.title}
            onChange={handleChange}
            placeholder="Contoh: Madilog (Materialisme, Dialektika, dan Logika)"
            className="w-full rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] px-3 py-2 text-sm text-[#161615] placeholder:text-[#57534E]/70 focus:border-[#991B1B] focus:outline-none"
          />
        </div>

        {/* Author & Category Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="work-author"
                className="block text-xs font-semibold text-[#161615]"
              >
                Tokoh / Penulis
              </label>
              <Link
                to="/authors/new"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#991B1B] hover:underline"
              >
                <Plus className="w-3 h-3" />
                Tokoh Baru
              </Link>
            </div>
            <select
              id="work-author"
              name="author_id"
              value={form.author_id}
              onChange={handleChange}
              className="w-full rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] px-3 py-2 text-sm text-[#161615] focus:border-[#991B1B] focus:outline-none"
            >
              <option value="">-- Pilih Tokoh --</option>
              {authors.map((author) => (
                <option key={author.id} value={String(author.id)}>
                  {author.name}
                  {author.lifespan ? ` (${author.lifespan})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="work-category"
                className="block text-xs font-semibold text-[#161615]"
              >
                Kategori
              </label>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#991B1B] hover:underline cursor-pointer"
              >
                <Tag className="w-3 h-3" />
                Kelola Kategori
              </button>
            </div>
            <select
              id="work-category"
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className="w-full rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] px-3 py-2 text-sm text-[#161615] focus:border-[#991B1B] focus:outline-none"
            >
              <option value="">-- Pilih Kategori --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Format & Year */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="work-format"
              className="block text-xs font-semibold text-[#161615]"
            >
              Format Berkas
            </label>
            <select
              id="work-format"
              name="format"
              value={form.format}
              onChange={handleChange}
              className="w-full rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] px-3 py-2 font-mono text-sm text-[#161615] focus:border-[#991B1B] focus:outline-none"
            >
              <option value="EPUB">EPUB</option>
              <option value="PDF">PDF</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="work-year"
              className="block text-xs font-semibold text-[#161615]"
            >
              Tahun Terbit
            </label>
            <input
              id="work-year"
              name="year"
              type="text"
              inputMode="numeric"
              value={form.year}
              onChange={handleChange}
              placeholder="Contoh: 1943"
              className="w-full rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] px-3 py-2 font-mono text-sm text-[#161615] placeholder:text-[#57534E]/70 focus:border-[#991B1B] focus:outline-none"
            />
          </div>
        </div>

        {/* File Size & Page Count */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="work-file-size"
              className="block text-xs font-semibold text-[#161615]"
            >
              Ukuran Berkas
            </label>
            <input
              id="work-file-size"
              name="file_size"
              type="text"
              value={form.file_size}
              onChange={handleChange}
              placeholder="Contoh: 2.4 MB"
              className="w-full rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] px-3 py-2 font-mono text-sm text-[#161615] placeholder:text-[#57534E]/70 focus:border-[#991B1B] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="work-page-count"
              className="block text-xs font-semibold text-[#161615]"
            >
              Jumlah Halaman
            </label>
            <input
              id="work-page-count"
              name="page_count"
              type="number"
              min="0"
              value={form.page_count}
              onChange={handleChange}
              placeholder="Contoh: 412"
              className="w-full rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] px-3 py-2 font-mono text-sm text-[#161615] placeholder:text-[#57534E]/70 focus:border-[#991B1B] focus:outline-none"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-1.5">
          <label
            htmlFor="work-summary"
            className="block text-xs font-semibold text-[#161615]"
          >
            Ringkasan / Sinopsis
          </label>
          <textarea
            id="work-summary"
            name="summary"
            rows={4}
            value={form.summary}
            onChange={handleChange}
            placeholder="Uraikan pokok bahasan, konteks sejarah, atau catatan edisi karya ini..."
            className="w-full rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] px-3 py-2 text-sm text-[#161615] placeholder:text-[#57534E]/70 focus:border-[#991B1B] focus:outline-none resize-y"
          />
        </div>

        {/* Magnet URI */}
        <div className="space-y-1.5">
          <label
            htmlFor="work-magnet-uri"
            className="block text-xs font-semibold text-[#161615]"
          >
            Magnet URI (WebTorrent)
          </label>
          <textarea
            id="work-magnet-uri"
            name="magnet_uri"
            rows={3}
            value={form.magnet_uri}
            onChange={handleChange}
            placeholder="magnet:?xt=urn:btih:..."
            className="w-full rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] px-3 py-2 font-mono text-xs text-[#161615] placeholder:text-[#57534E]/70 focus:border-[#991B1B] focus:outline-none resize-y"
          />
          <p className="text-[11px] text-[#57534E]">
            Opsional saat mengindeks metadata; diperlukan untuk streaming P2P langsung di pembaca.
          </p>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#D5CFC2]">
          <Link
            to={backHref}
            className="rounded-[2px] border border-[#D5CFC2] bg-[#EFECE4] hover:border-[#161615] px-4 py-2 text-sm font-medium text-[#161615] transition-colors"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-[2px] bg-[#991B1B] hover:bg-[#7F1D1D] disabled:opacity-60 px-4 py-2 text-sm font-medium text-[#F4F1EA] transition-colors cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{submitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Karya"}</span>
          </button>
        </div>
      </form>

      {/* Categories Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onUpdated={(updatedCategories) => {
          setCategories(updatedCategories);
          setForm((prev) => {
            if (
              prev.category_id &&
              !updatedCategories.some((c) => String(c.id) === String(prev.category_id))
            ) {
              return { ...prev, category_id: "" };
            }
            return prev;
          });
        }}
      />
    </section>
  );
}
