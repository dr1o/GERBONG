import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { getApiErrorMessage } from "../api/axiosClient.js";

export default function AdminLoginPage() {
  const { isAdmin, login } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (isAdmin) {
    return <Navigate to="/authors" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password) {
      setError("Masukkan password admin terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await login(password);
      navigate("/authors", { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "Password admin tidak valid."));
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="border-b border-[#D5CFC2] pb-3">
        <Link
          to="/about"
          className="inline-flex items-center gap-1.5 text-sm text-[#57534E] hover:text-[#161615] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Profil &amp; Relawan</span>
        </Link>
        <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-[#161615]">
          Admin Login GERBONG
        </h1>
      </div>

      <div className="rounded-[2px] border border-[#D5CFC2] bg-[#FAF8F3] p-5 space-y-4">
        <p className="text-xs text-[#57534E] leading-relaxed">
          Pembaca tetap dapat menjelajah, membaca, dan menjadi relawan seeder tanpa login.
          Masuk sebagai admin untuk menambah, menyunting, atau menghapus data arsip.
        </p>

        {error && (
          <div className="flex items-start gap-2.5 rounded-[2px] border border-[#991B1B] bg-[#991B1B]/10 p-3 text-xs text-[#991B1B]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="admin-password"
              className="block text-xs font-semibold text-[#161615]"
            >
              Password Admin
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#57534E]" />
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password admin..."
                autoComplete="current-password"
                autoFocus
                className="w-full rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] pl-9 pr-3 py-2 text-sm text-[#161615] placeholder:text-[#57534E]/70 focus:border-[#991B1B] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-[2px] bg-[#991B1B] hover:bg-[#7F1D1D] disabled:opacity-60 px-4 py-2 text-sm font-medium text-[#F4F1EA] transition-colors cursor-pointer"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{submitting ? "Memverifikasi..." : "Masuk sebagai Admin"}</span>
          </button>
        </form>
      </div>
    </section>
  );
}
