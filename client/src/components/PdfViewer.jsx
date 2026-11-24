import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Loader2,
  AlertCircle,
} from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 3.0;
const ZOOM_STEP = 0.25;
const MAX_CANVAS_SIDE = 4096;

function formatSpeed(bytesPerSec = 0) {
  const num = Number(bytesPerSec || 0);
  if (num < 1024) return `${num.toFixed(0)} B/s`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB/s`;
  return `${(num / (1024 * 1024)).toFixed(2)} MB/s`;
}

export default function PdfViewer({ blobUrl, title = "Dokumen PDF", seedingStatus = null }) {
  const viewportRef = useRef(null);
  const canvasRef = useRef(null);
  const pdfDocRef = useRef(null);
  const renderTaskRef = useRef(null);
  const pinchStartRef = useRef(null);

  const [loadingDoc, setLoadingDoc] = useState(true);
  const [renderingPage, setRenderingPage] = useState(false);
  const [error, setError] = useState("");
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [zoom, setZoom] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Lock background page scroll while reading in full-screen overlay (keeps page & seeding alive)
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

  // Track container width so PDF auto-fits on phone, tablet, desktop, and fullscreen transitions
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const updateWidth = () => {
      if (el.clientWidth > 0) {
        setContainerWidth(el.clientWidth);
      }
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isFullscreen]);

  // Load PDF document from blobUrl via ArrayBuffer (reliable across mobile & desktop)
  useEffect(() => {
    if (!blobUrl) return;

    let cancelled = false;
    let loadingTask = null;

    setLoadingDoc(true);
    setError("");
    setNumPages(0);
    setPageNumber(1);
    setPageInput("1");
    setZoom(1);

    async function loadPdf() {
      try {
        const res = await fetch(blobUrl);
        if (!res.ok) {
          throw new Error("Berkas PDF gagal dibaca dari memori peramban.");
        }
        const buffer = await res.arrayBuffer();
        if (cancelled) return;

        loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
        const pdfDoc = await loadingTask.promise;

        if (cancelled) {
          pdfDoc.destroy().catch(() => {});
          return;
        }

        if (pdfDocRef.current) {
          pdfDocRef.current.destroy().catch(() => {});
        }
        pdfDocRef.current = pdfDoc;
        setNumPages(pdfDoc.numPages);
        setPageNumber(1);
        setPageInput("1");
        setLoadingDoc(false);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Gagal memuat berkas PDF.");
          setLoadingDoc(false);
        }
      }
    }

    loadPdf();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
        renderTaskRef.current = null;
      }
      if (loadingTask) {
        loadingTask.destroy().catch(() => {});
      }
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy().catch(() => {});
        pdfDocRef.current = null;
      }
    };
  }, [blobUrl]);

  // Render active page onto HiDPI canvas whenever page, zoom, or width changes
  useEffect(() => {
    const pdfDoc = pdfDocRef.current;
    const canvas = canvasRef.current;
    if (!pdfDoc || !canvas || loadingDoc || numPages === 0 || containerWidth === 0) {
      return;
    }

    let cancelled = false;

    async function renderPage() {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
        renderTaskRef.current = null;
      }

      setRenderingPage(true);

      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (cancelled) return;

        const unscaledViewport = page.getViewport({ scale: 1 });
        // In desktop fullscreen, cap fit width to a comfortable reading column (~920px) so pages don't blow up awkwardly
        const maxFitWidth = isFullscreen ? Math.min(containerWidth - 24, 920) : containerWidth - 24;
        const availableWidth = Math.max(260, maxFitWidth);
        const fitScale = availableWidth / unscaledViewport.width;
        const targetScale = fitScale * zoom;
        const viewport = page.getViewport({ scale: targetScale });

        // Cap devicePixelRatio and canvas dimensions so mobile browsers stay crisp and crash-free
        const rawDpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const maxScaleX = MAX_CANVAS_SIDE / Math.max(1, viewport.width);
        const maxScaleY = MAX_CANVAS_SIDE / Math.max(1, viewport.height);
        const safeDpr = Math.max(1, Math.min(rawDpr, maxScaleX, maxScaleY));

        const ctx = canvas.getContext("2d", { alpha: false });
        canvas.width = Math.floor(viewport.width * safeDpr);
        canvas.height = Math.floor(viewport.height * safeDpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const renderContext = {
          canvasContext: ctx,
          viewport,
          transform: safeDpr !== 1 ? [safeDpr, 0, 0, safeDpr, 0, 0] : undefined,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;

        if (!cancelled) {
          renderTaskRef.current = null;
          setRenderingPage(false);
        }
      } catch (err) {
        if (err?.name === "RenderingCancelledException" || cancelled) {
          return;
        }
        setError(err?.message || "Gagal merender halaman PDF.");
        setRenderingPage(false);
      }
    }

    renderPage();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
        renderTaskRef.current = null;
      }
    };
  }, [pageNumber, zoom, containerWidth, loadingDoc, numPages, isFullscreen]);

  const goToPage = useCallback(
    (nextPage) => {
      if (numPages === 0) return;
      const clamped = Math.min(numPages, Math.max(1, nextPage));
      setPageNumber(clamped);
      setPageInput(String(clamped));
      if (viewportRef.current) {
        viewportRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [numPages]
  );

  const handlePrev = useCallback(() => {
    goToPage(pageNumber - 1);
  }, [goToPage, pageNumber]);

  const handleNext = useCallback(() => {
    goToPage(pageNumber + 1);
  }, [goToPage, pageNumber]);

  // Keyboard navigation on desktop
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlePrev, handleNext]);

  function handlePageInputSubmit(e) {
    e.preventDefault();
    const parsed = Number.parseInt(pageInput, 10);
    if (!Number.isNaN(parsed)) {
      goToPage(parsed);
    } else {
      setPageInput(String(pageNumber));
    }
  }

  function adjustZoom(delta) {
    setZoom((prev) => {
      const next = Math.round((prev + delta) * 100) / 100;
      return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    });
  }

  // Two-finger pinch-to-zoom on mobile touchscreens
  function handleTouchStart(e) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartRef.current = {
        dist: Math.hypot(dx, dy),
        zoom,
      };
    }
  }

  function handleTouchMove(e) {
    if (e.touches.length === 2 && pinchStartRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / Math.max(1, pinchStartRef.current.dist);
      const nextZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, Math.round(pinchStartRef.current.zoom * ratio * 20) / 20)
      );
      setZoom(nextZoom);
    }
  }

  function handleTouchEnd(e) {
    if (e.touches.length < 2) {
      pinchStartRef.current = null;
    }
  }

  if (!blobUrl) return null;

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-50 flex flex-col bg-[#F4F1EA]"
          : "rounded-[2px] border border-[#D5CFC2] bg-[#FAF8F3] overflow-hidden"
      }
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D5CFC2] bg-[#EFECE4] px-3.5 py-2.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-[#991B1B] shrink-0" />
          <span className="font-serif text-sm font-bold text-[#161615] truncate">{title}</span>
          {isFullscreen && seedingStatus && (
            <span className="hidden sm:inline font-mono text-[11px] text-[#991B1B] shrink-0">
              [SEEDING • {seedingStatus.peers}P • ↑ {formatSpeed(seedingStatus.uploadSpeed)}]
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-[2px] border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
              isFullscreen
                ? "border-[#991B1B] bg-[#991B1B] text-[#F4F1EA] hover:bg-[#7F1D1D]"
                : "border-[#D5CFC2] bg-[#FAF8F3] text-[#161615] hover:border-[#161615]"
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

          <a
            href={blobUrl}
            download={`${title.replace(/[^a-zA-Z0-9_-]+/g, "_") || "arsip-gerbong"}.pdf`}
            className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#D5CFC2] bg-[#FAF8F3] hover:border-[#161615] px-2.5 py-1 text-xs font-medium text-[#161615] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#991B1B]" />
            <span className="hidden sm:inline">Unduh PDF</span>
          </a>
        </div>
      </div>

      {/* Page & Zoom Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D5CFC2] bg-[#FAF8F3] px-3.5 py-2 shrink-0">
        {/* Page Jumper */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            disabled={loadingDoc || pageNumber <= 1}
            aria-label="Halaman sebelumnya"
            className="rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] hover:border-[#161615] disabled:opacity-40 p-1.5 text-[#161615] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <form onSubmit={handlePageInputSubmit} className="inline-flex items-center gap-1">
            <input
              type="text"
              inputMode="numeric"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={handlePageInputSubmit}
              aria-label="Nomor halaman"
              disabled={loadingDoc || numPages === 0}
              className="w-12 rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] px-1.5 py-1 text-center font-mono text-xs text-[#161615] focus:border-[#991B1B] focus:outline-none"
            />
            <span className="font-mono text-xs text-[#57534E]">
              / {numPages || "—"}
            </span>
          </form>

          <button
            type="button"
            onClick={handleNext}
            disabled={loadingDoc || pageNumber >= numPages}
            aria-label="Halaman berikutnya"
            className="rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] hover:border-[#161615] disabled:opacity-40 p-1.5 text-[#161615] transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => adjustZoom(-ZOOM_STEP)}
            disabled={loadingDoc || zoom <= MIN_ZOOM}
            aria-label="Perkecil tampilan"
            className="rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] hover:border-[#161615] disabled:opacity-40 p-1.5 text-[#161615] transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setZoom(1)}
            disabled={loadingDoc}
            title="Reset ke lebar layar (100%)"
            className="min-w-[54px] rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] hover:border-[#161615] px-2 py-1 font-mono text-xs text-[#161615] transition-colors cursor-pointer"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            type="button"
            onClick={() => adjustZoom(ZOOM_STEP)}
            disabled={loadingDoc || zoom >= MAX_ZOOM}
            aria-label="Perbesar tampilan"
            className="rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] hover:border-[#161615] disabled:opacity-40 p-1.5 text-[#161615] transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {zoom !== 1 && (
            <button
              type="button"
              onClick={() => setZoom(1)}
              aria-label="Pas lebar layar"
              title="Pas lebar layar"
              className="rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] hover:border-[#161615] p-1.5 text-[#57534E] hover:text-[#161615] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Inline Scrollable & Zoomable Canvas Viewport */}
      <div
        ref={viewportRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full overflow-auto bg-[#E8E2D5] p-3 ${
          isFullscreen ? "flex-1 min-h-0" : "min-h-[420px] max-h-[75dvh]"
        }`}
      >
        {loadingDoc ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2.5 text-xs text-[#57534E]">
            <Loader2 className="w-5 h-5 animate-spin text-[#991B1B]" />
            <span>Membuka dokumen PDF...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center gap-2">
            <AlertCircle className="w-6 h-6 text-[#991B1B]" />
            <p className="font-serif text-base font-bold text-[#161615]">
              Gagal Menampilkan PDF
            </p>
            <p className="max-w-sm text-xs text-[#57534E]">{error}</p>
          </div>
        ) : (
          <div className="relative mx-auto w-fit">
            {renderingPage && (
              <div className="absolute top-2 right-2 z-10 inline-flex items-center gap-1.5 rounded-[2px] border border-[#D5CFC2] bg-[#FAF8F3]/95 px-2 py-1 font-mono text-[10px] text-[#57534E]">
                <Loader2 className="w-3 h-3 animate-spin text-[#991B1B]" />
                <span>Render...</span>
              </div>
            )}
            <canvas
              ref={canvasRef}
              className="block border border-[#D5CFC2] bg-white"
            />
          </div>
        )}
      </div>

      {/* Bottom Prev / Next Bar */}
      <div className="flex items-center justify-between gap-3 border-t border-[#D5CFC2] bg-[#EFECE4] px-3.5 py-2.5 shrink-0 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={handlePrev}
          disabled={loadingDoc || pageNumber <= 1}
          className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#D5CFC2] bg-[#F4F1EA] hover:border-[#161615] disabled:opacity-40 px-3 py-1.5 text-xs font-medium text-[#161615] transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-[#991B1B]" />
          <span>Sebelumnya</span>
        </button>

        <span className="font-mono text-xs text-[#57534E]">
          Hal. {numPages > 0 ? `${pageNumber} / ${numPages}` : "—"}
        </span>

        <button
          type="button"
          onClick={handleNext}
          disabled={loadingDoc || pageNumber >= numPages}
          className="inline-flex items-center gap-1.5 rounded-[2px] bg-[#991B1B] hover:bg-[#7F1D1D] disabled:opacity-40 px-3 py-1.5 text-xs font-medium text-[#F4F1EA] transition-colors cursor-pointer"
        >
          <span>Berikutnya</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
