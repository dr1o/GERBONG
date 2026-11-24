import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, AlertCircle, Image as ImageIcon } from "lucide-react";
import axiosClient, { getApiErrorMessage } from "../api/axiosClient.js";

const INITIAL_FORM = {
  name: "",
  era: "",
  lifespan: "",
  birthplace: "",
  bio: "",
  quote: "",
  image_url: "",
};

export default function AuthorFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    let active = true;

    async function loadAuthor() {
      setLoading(true);
      setError("");
      try {
        const { data } = await axiosClient.get(`/authors/${id}`);
        if (!active) return;
        setForm({
          name: data.name || "",
          era: data.era || "",
          lifespan: data.lifespan || "",
          birthplace: data.birthplace || "",
          bio: data.bio || "",
          quote: data.quote || "",
          image_url: data.image_url || "",
        });
      } catch (err) {
        if (!active) return;
        setError(getApiErrorMessage(err, "Gagal memuat data tokoh untuk disunting."));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAuthor();
    return () => {
      active = false;
    };
  }, [id, isEdit]);

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "image_url") setPreviewError(false);
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setError("Nama tokoh wajib diisi.");
      return;
    }

    setSubmitting(true);
    setError("");

    const payload = {
      name: trimmedName,
      era: form.era.trim() || null,
      lifespan: form.lifespan.trim() || null,
      birthplace: form.birthplace.trim() || null,
      bio: form.bio.trim() || null,
      quote: form.quote.trim() || null,
      image_url: form.image_url.trim() || null,
    };

    try {
      const { data } = isEdit
        ? await axiosClient.put(`/authors/${id}`, payload)
        : await axiosClient.post("/authors", payload);

      navigate(`/authors/${data?.id || id}`, { replace: true });
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          isEdit ? "Gagal memperbarui data tokoh." : "Gagal menambahkan tokoh baru."
        )
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-sm text-[#57534E] gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-[#991B1B]" />
        Memuat formulir tokoh...
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="border-b border-[#D5CFC2] pb-3">
        <Link
          to={isEdit ? `/authors/${id}` : "/authors"}
          className="inline-flex items-center gap-1.5 text-sm text-[#57534E] hover:text-[#161615] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isEdit ? "Kembali ke Profil Tokoh" : "Kembali ke Daftar Tokoh"}</span>
        </Link>

        <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-[#161615]">
          {isEdit ? "Edit Profil Tokoh" : "Tambah Tokoh Baru"}
        </h1>
        <p className="mt-1 text-xs text-[#57534E]">
          Catat identitas pemikir atau tokoh sejarah Indonesia ke dalam katalog GERBONG.
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
        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="author-name" className="block text-xs font-semibold text-[#161615]">
            Nama Tokoh <span className="text-[#991B1B]">*</span>
          </label>
          <input
            id="author-name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            placeholder="Contoh: Tan Malaka"
            className="w-full rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] px-3 py-2 text-sm text-[#161615] placeholder:text-[#57534E]/70 focus:border-[#991B1B] focus:outline-none"
          />
        </div>

        {/* Era & Lifespan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="author-era" className="block text-xs font-semibold text-[#161615]">
              Era / Periode
            </label>
            <input
              id="author-era"
              name="era"
              type="text"
              value={form.era}
              onChange={handleChange}
              placeholder="Contoh: Pergerakan Nasional"
              className="w-full rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] px-3 py-2 text-sm text-[#161615] placeholder:text-[#57534E]/70 focus:border-[#991B1B] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="author-lifespan" className="block text-xs font-semibold text-[#161615]">
              Rentang Hidup (Lifespan)
            </label>
            <input
              id="author-lifespan"
              name="lifespan"
              type="text"
              value={form.lifespan}
              onChange={handleChange}
              placeholder="Contoh: 1897–1949"
              className="w-full rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] px-3 py-2 font-mono text-sm text-[#161615] placeholder:text-[#57534E]/70 focus:border-[#991B1B] focus:outline-none"
            />
          </div>
        </div>

        {/* Birthplace */}
        <div className="space-y-1.5">
          <label htmlFor="author-birthplace" className="block text-xs font-semibold text-[#161615]">
            Tempat Lahir
          </label>
          <input
            id="author-birthplace"
            name="birthplace"
            type="text"
            value={form.birthplace}
            onChange={handleChange}
            placeholder="Contoh: Nagari Pandam Gadang, Suliki, Sumatera Barat"
            className="w-full rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] px-3 py-2 text-sm text-[#161615] placeholder:text-[#57534E]/70 focus:border-[#991B1B] focus:outline-none"
          />
        </div>

        {/* Image URL + Preview */}
        <div className="space-y-1.5">
          <label htmlFor="author-image-url" className="block text-xs font-semibold text-[#161615]">
            URL Potret (Image URL)
          </label>
          <div className="flex items-center gap-3">
            <input
              id="author-image-url"
              name="image_url"
              type="url"
              value={form.image_url}
              onChange={handleChange}
              placeholder="https://upload.wikimedia.org/..."
              className="flex-1 rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] px-3 py-2 text-sm text-[#161615] placeholder:text-[#57534E]/70 focus:border-[#991B1B] focus:outline-none"
            />
            <div className="h-10 w-10 shrink-0 rounded-[2px] border border-[#D5CFC2] bg-[#EFECE4] overflow-hidden flex items-center justify-center">
              {form.image_url.trim() && !previewError ? (
                <img
                  src={form.image_url}
                  alt="Pratinjau potret"
                  onError={() => setPreviewError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon className="w-4 h-4 text-[#57534E]" />
              )}
            </div>
          </div>
        </div>

        {/* Quote */}
        <div className="space-y-1.5">
          <label htmlFor="author-quote" className="block text-xs font-semibold text-[#161615]">
            Kutipan Pilihan
          </label>
          <textarea
            id="author-quote"
            name="quote"
            rows={2}
            value={form.quote}
            onChange={handleChange}
            placeholder="Idealisme adalah kemewahan terakhir yang hanya dimiliki oleh pemuda..."
            className="w-full rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] px-3 py-2 text-sm text-[#161615] placeholder:text-[#57534E]/70 focus:border-[#991B1B] focus:outline-none resize-y"
          />
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <label htmlFor="author-bio" className="block text-xs font-semibold text-[#161615]">
            Biografi
          </label>
          <textarea
            id="author-bio"
            name="bio"
            rows={5}
            value={form.bio}
            onChange={handleChange}
            placeholder="Tuliskan riwayat singkat, kiprah pemikiran, dan pengaruh tokoh..."
            className="w-full rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] px-3 py-2 text-sm text-[#161615] placeholder:text-[#57534E]/70 focus:border-[#991B1B] focus:outline-none resize-y"
          />
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#D5CFC2]">
          <Link
            to={isEdit ? `/authors/${id}` : "/authors"}
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
            <span>{submitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Tokoh"}</span>
          </button>
        </div>
      </form>
    </section>
  );
}
