import { useEffect, useRef, useState } from "react";
import ePub from "epubjs";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Loader2,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  List,
  Maximize2,
  Minimize2,
} from "lucide-react";

function formatSpeed(bytesPerSec = 0) {
  const num = Number(bytesPerSec || 0);
  if (num < 1024) return `${num.toFixed(0)} B/s`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB/s`;
  return `${(num / (1024 * 1024)).toFixed(2)} MB/s`;
}

export default function EpubViewer({ blobUrl, title = "Bacaan EPUB", seedingStatus = null }) {
  const viewerRef = useRef(null);
  const bookRef = useRef(null);
  const renditionRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toc, setToc] = useState([]);
  const [currentHref, setCurrentHref] = useState("");
  const [locationLabel, setLocationLabel] = useState("Memuat halaman...");
  const [fontSize, setFontSize] = useState(100);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Lock page scroll during fullscreen reading overlay
  useEffect(() => {
    if (!isFullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (e) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isFullscreen]);

  // Trigger epubjs layout resize after toggling fullscreen
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        renditionRef.current?.resize();
      } catch {
        // ignore resize errors if rendition not ready
      }
    }, 50);
    return () => window.clearTimeout(timer);
  }, [isFullscreen]);

  useEffect(() => {
    if (!blobUrl || !viewerRef.current) return;

    let cancelled = false;
    setLoading(true);
    setError("");
    setToc([]);
    setLocationLabel("Menyiapkan buku EPUB...");

    const container = viewerRef.current;
    container.innerHTML = "";

    let book = null;
    let rendition = null;

    try {
      book = ePub(blobUrl, { openAs: "epub" });
      bookRef.current = book;

      rendition = book.renderTo(container, {
        width: "100%",
        height: "100%",
        flow: "paginated",
        spread: "none",
      });
      renditionRef.current = rendition;

      rendition.themes.default({
        body: {
          background: "#FAF8F3 !important",
          color: "#161615 !important",
          "font-family": "'Newsreader', Georgia, serif !important",
          "line-height": "1.75 !important",
          padding: "16px 20px !important",
        },
        "a, a:link, a:visited": {
          color: "#991B1B !important",
        },
        "h1, h2, h3, h4": {
          color: "#161615 !important",
        },
      });

      rendition.themes.fontSize(`${fontSize}%`);

      book.loaded.navigation
        .then((nav) => {
          if (!cancelled && nav?.toc) {
            setToc(nav.toc);
          }
        })
        .catch(() => {});

      rendition.on("relocated", (location) => {
        if (cancelled) return;
        setAtStart(Boolean(location?.atStart));
        setAtEnd(Boolean(location?.atEnd));
        if (location?.start?.href) {
          setCurrentHref(location.start.href);
        }
        const displayed = location?.start?.displayed;
        if (displayed?.page && displayed?.total) {
          setLocationLabel(`Hal. ${displayed.page} / ${displayed.total}`);
        } else {
          setLocationLabel("Sedang membaca");
        }
      });

      rendition
        .display()
        .then(() => {
          if (!cancelled) {
            setLoading(false);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err?.message || "Gagal memuat isi berkas EPUB.");
            setLoading(false);
          }
        });
    } catch (err) {
      setError(err?.message || "Berkas EPUB tidak dapat dibuka.");
      setLoading(false);
    }

    return () => {
      cancelled = true;
      try {
        if (book) book.destroy();
      } catch {
        // ignore cleanup warnings
      }
      bookRef.current = null;
      renditionRef.current = null;
    };
  }, [blobUrl]);

  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.fontSize(`${fontSize}%`);
    }
  }, [fontSize]);

  function handlePrev() {
    renditionRef.current?.prev();
  }

  function handleNext() {
    renditionRef.current?.next();
  }

  function handleTocChange(e) {
    const targetHref = e.target.value;
    setCurrentHref(targetHref);
    if (targetHref && renditionRef.current) {
      renditionRef.current.display(targetHref);
    }
  }

  function adjustFontSize(delta) {
    setFontSize((prev) => Math.min(160, Math.max(80, prev + delta)));
  }

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-50 flex flex-col bg-[#FAF8F3]"
          : "rounded-[2px] border border-[#D5CFC2] bg-[#FAF8F3] overflow-hidden"
      }
    >
      {/* Reader Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D5CFC2] bg-[#EFECE4] px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="w-4 h-4 text-[#991B1B] shrink-0" />
          <span className="font-serif text-sm font-bold text-[#161615] truncate">{title}</span>
          {isFullscreen && seedingStatus && (
            <span className="hidden sm:inline font-mono text-[11px] text-[#991B1B] shrink-0">
              [SEEDING • {seedingStatus.peers}P • ↑ {formatSpeed(seedingStatus.uploadSpeed)}]
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* TOC Dropdown */}
          {toc.length > 0 && (
            <div className="relative flex items-center">
              <List className="w-3.5 h-3.5 text-[#57534E] mr-1.5 hidden sm:inline" />
              <select
                value={currentHref}
                onChange={handleTocChange}
                aria-label="Daftar Isi Bab"
                className="max-w-[140px] sm:max-w-[200px] rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] px-2 py-1 text-xs text-[#161615] focus:border-[#991B1B] focus:outline-none truncate"
              >
                <option value="">Daftar Bab...</option>
                {toc.map((item, idx) => (
                  <option key={`${item.href}-${idx}`} value={item.href}>
                    {item.label?.trim() || `Bab ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Font Size Controls */}
          <div className="inline-flex items-center rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA]">
            <button
              type="button"
              onClick={() => adjustFontSize(-10)}
              aria-label="Perkecil huruf"
              className="p-1.5 text-[#57534E] hover:text-[#161615] transition-colors cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono text-[11px] text-[#57534E]">{fontSize}%</span>
            <button
              type="button"
              onClick={() => adjustFontSize(10)}
              aria-label="Perbesar huruf"
              className="p-1.5 text-[#57534E] hover:text-[#161615] transition-colors cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-[2px] border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
              isFullscreen
                ? "border-[#991B1B] bg-[#991B1B] text-[#F4F1EA] hover:bg-[#7F1D1D]"
                : "border-[#D5CFC2] bg-[#F4F1EA] text-[#161615] hover:border-[#161615]"
            }`}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Tutup Layar Penuh</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-[#991B1B]" />
                <span>Layar Penuh</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* EPUB Viewport */}
      <div
        className={`relative w-full bg-[#FAF8F3] ${
          isFullscreen ? "flex-1 min-h-0" : "h-[480px] sm:h-[560px]"
        }`}
      >
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 bg-[#FAF8F3]/95 text-xs text-[#57534E]">
            <Loader2 className="w-5 h-5 animate-spin text-[#991B1B]" />
            <span>Merender halaman EPUB...</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#FAF8F3] p-6 text-center">
            <AlertCircle className="w-6 h-6 text-[#991B1B]" />
            <p className="font-serif text-base font-bold text-[#161615]">Gagal Membuka EPUB</p>
            <p className="max-w-sm text-xs text-[#57534E]">{error}</p>
          </div>
        )}

        <div ref={viewerRef} className="h-full w-full" />
      </div>

      {/* Prev / Next Navigation Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-[#D5CFC2] bg-[#EFECE4] px-4 py-2.5 shrink-0 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={handlePrev}
          disabled={loading || Boolean(error)}
          className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] hover:border-[#161615] disabled:opacity-40 px-3 py-1.5 text-xs font-medium text-[#161615] transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-[#991B1B]" />
          <span>Sebelumnya</span>
        </button>

        <span className="font-mono text-[11px] text-[#57534E] text-center truncate">
          {atStart ? "Awal Buku • " : atEnd ? "Akhir Buku • " : ""}
          {locationLabel}
        </span>

        <button
          type="button"
          onClick={handleNext}
          disabled={loading || Boolean(error)}
          className="inline-flex items-center gap-1.5 rounded-[2px] bg-[#991B1B] hover:bg-[#7F1D1D] disabled:opacity-40 px-3 py-1.5 text-xs font-medium text-[#F4F1EA] transition-colors cursor-pointer"
        >
          <span>Berikutnya</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
