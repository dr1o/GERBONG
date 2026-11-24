import { useEffect, useState, useCallback } from "react";
import { X, Plus, Pencil, Trash2, Check, Loader2, AlertCircle } from "lucide-react";
import axiosClient, { getApiErrorMessage } from "../api/axiosClient.js";

export default function CategoryManagerModal({ isOpen, onClose, onUpdated }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [savingId, setSavingId] = useState(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axiosClient.get("/categories");
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal memuat daftar kategori."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetchCategories();
    setEditingId(null);
    setConfirmDeleteId(null);
  }, [isOpen, fetchCategories]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleCreate(e) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setError("Nama kategori tidak boleh kosong.");
      return;
    }

    setCreating(true);
    setError("");
    try {
      const { data } = await axiosClient.post("/categories", { name: trimmed });
      setNewName("");
      const updatedList = [...categories, data].sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );
      setCategories(updatedList);
      onUpdated?.(updatedList);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal menambahkan kategori."));
    } finally {
      setCreating(false);
    }
  }

  function startEditing(cat) {
    setEditingId(cat.id);
    setEditingName(cat.name || "");
    setConfirmDeleteId(null);
    setError("");
  }

  async function handleRename(id) {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setError("Nama kategori tidak boleh kosong.");
      return;
    }

    setSavingId(id);
    setError("");
    try {
      const { data } = await axiosClient.put(`/categories/${id}`, { name: trimmed });
      const updatedList = categories
        .map((item) => (item.id === id ? data : item))
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setCategories(updatedList);
      setEditingId(null);
      setEditingName("");
      onUpdated?.(updatedList);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal memperbarui nama kategori."));
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    setError("");
    try {
      await axiosClient.delete(`/categories/${id}`);
      const updatedList = categories.filter((item) => item.id !== id);
      setCategories(updatedList);
      setConfirmDeleteId(null);
      onUpdated?.(updatedList);
    } catch (err) {
      setError(getApiErrorMessage(err, "Gagal menghapus kategori. Pastikan tidak digunakan oleh karya."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#161615]/50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="w-full max-w-lg rounded-[2px] border border-[#161615] bg-[#F4F1EA] overflow-hidden flex flex-col max-h-[85dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D5CFC2]">
          <div>
            <h2
              id="category-modal-title"
              className="font-serif text-xl font-bold text-[#161615] tracking-tight"
            >
              Kelola Kategori
            </h2>
            <p className="text-xs text-[#57534E]">
              Tambah, ubah nama, atau hapus klasifikasi pustaka
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal kategori"
            className="rounded-[2px] p-1.5 text-[#57534E] hover:text-[#161615] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create form */}
        <form onSubmit={handleCreate} className="p-4 border-b border-[#D5CFC2] bg-[#EFECE4]">
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nama kategori baru (mis. Filsafat, Sejarah)..."
              className="flex-1 rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] px-3 py-2 text-sm text-[#161615] placeholder:text-[#57534E]/70 focus:border-[#991B1B] focus:outline-none"
            />
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-1.5 rounded-[2px] bg-[#991B1B] hover:bg-[#7F1D1D] disabled:opacity-60 px-4 py-2 text-sm font-medium text-[#F4F1EA] transition-colors cursor-pointer shrink-0"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Tambah
            </button>
          </div>
        </form>

        {/* Error banner */}
        {error && (
          <div className="mx-4 mt-3 flex items-start gap-2 rounded-[2px] border border-[#991B1B] bg-[#991B1B]/10 px-3 py-2 text-xs text-[#991B1B]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Categories list */}
        <div className="flex-1 overflow-y-auto px-4 divide-y divide-[#D5CFC2]">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-[#57534E]">
              <Loader2 className="w-4 h-4 animate-spin text-[#991B1B]" />
              Memuat kategori...
            </div>
          ) : categories.length === 0 ? (
            <div className="py-8 text-left">
              <p className="font-serif text-base font-bold text-[#161615]">
                Belum ada kategori
              </p>
              <p className="mt-1 text-xs text-[#57534E]">
                Tambahkan kategori pertama di kolom atas untuk mengelompokkan karya.
              </p>
            </div>
          ) : (
            categories.map((cat) => {
              const isEditing = editingId === cat.id;
              const isConfirmingDelete = confirmDeleteId === cat.id;

              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between gap-2 py-2.5"
                >
                  {isEditing ? (
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleRename(cat.id);
                          } else if (e.key === "Escape") {
                            setEditingId(null);
                          }
                        }}
                        autoFocus
                        className="flex-1 rounded-[2px] border border-[#991B1B] bg-[#FAF8F3] px-2.5 py-1 text-sm text-[#161615] focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={savingId === cat.id}
                        onClick={() => handleRename(cat.id)}
                        aria-label="Simpan nama kategori"
                        className="rounded-[2px] bg-[#991B1B] hover:bg-[#7F1D1D] p-1.5 text-[#F4F1EA] transition-colors cursor-pointer"
                      >
                        {savingId === cat.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        aria-label="Batal ubah"
                        className="rounded-[2px] border border-[#D5CFC2] bg-[#EFECE4] p-1.5 text-[#161615] transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-[#161615] truncate">
                        {cat.name}
                      </span>

                      <div className="flex items-center gap-1 shrink-0">
                        {isConfirmingDelete ? (
                          <>
                            <button
                              type="button"
                              disabled={deletingId === cat.id}
                              onClick={() => handleDelete(cat.id)}
                              className="rounded-[2px] bg-[#991B1B] hover:bg-[#7F1D1D] px-2.5 py-1 text-xs font-medium text-[#F4F1EA] transition-colors cursor-pointer"
                            >
                              {deletingId === cat.id ? "Menghapus..." : "Hapus"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-[2px] border border-[#D5CFC2] bg-[#EFECE4] px-2.5 py-1 text-xs text-[#161615] transition-colors cursor-pointer"
                            >
                              Batal
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditing(cat)}
                              aria-label={`Ubah kategori ${cat.name}`}
                              className="rounded-[2px] p-1.5 text-[#57534E] hover:text-[#161615] transition-colors cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmDeleteId(cat.id);
                                setEditingId(null);
                              }}
                              aria-label={`Hapus kategori ${cat.name}`}
                              className="rounded-[2px] p-1.5 text-[#57534E] hover:text-[#991B1B] transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
