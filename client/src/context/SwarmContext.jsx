import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const SwarmContext = createContext(null);

export const STUN_ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:global.stun.twilio.com:3478" },
];

export const DEFAULT_WEBTORRENT_TRACKERS = [
  "wss://tracker.openwebtorrent.com",
  "wss://tracker.btorrent.xyz",
  "wss://tracker.fastcast.nz",
  "wss://tracker.webtorrent.dev",
];

let singletonClient = null;

function extractInfoHash(magnetURI = "") {
  const match = String(magnetURI).match(/xt=urn:btih:([a-fA-F0-9]{40}|[a-zA-Z2-7]{32})/i);
  return match ? match[1].toLowerCase() : null;
}

function getOrCreateWebTorrentClient() {
  if (singletonClient && !singletonClient.destroyed) {
    return singletonClient;
  }

  if (typeof window === "undefined" || typeof window.WebTorrent !== "function") {
    return null;
  }

  singletonClient = new window.WebTorrent({
    tracker: {
      rtcConfig: {
        iceServers: STUN_ICE_SERVERS,
      },
      announce: DEFAULT_WEBTORRENT_TRACKERS,
    },
  });

  singletonClient.on("error", (err) => {
    console.warn("[GERBONG Swarm] WebTorrent client warning:", err?.message || err);
  });

  return singletonClient;
}

function getMimeTypeForFile(fileName = "", formatHint = "") {
  const lower = String(fileName).toLowerCase();
  const hint = String(formatHint).toUpperCase();
  if (lower.endsWith(".pdf") || hint === "PDF") {
    return "application/pdf";
  }
  if (lower.endsWith(".epub") || hint === "EPUB") {
    return "application/epub+zip";
  }
  return "application/octet-stream";
}

function pickPrimaryBookFile(files = [], formatHint = "") {
  if (!Array.isArray(files) || files.length === 0) return null;

  const hint = String(formatHint).toLowerCase();
  if (hint === "epub" || hint === "pdf") {
    const matchedHint = files.find((f) =>
      String(f.name || "").toLowerCase().endsWith(`.${hint}`)
    );
    if (matchedHint) return matchedHint;
  }

  const bookFile = files.find((f) => {
    const name = String(f.name || "").toLowerCase();
    return name.endsWith(".epub") || name.endsWith(".pdf");
  });
  if (bookFile) return bookFile;

  return [...files].sort((a, b) => (b.length || 0) - (a.length || 0))[0];
}

async function createBlobUrlFromTorrentFile(file, formatHint = "") {
  if (!file) throw new Error("Berkas tidak ditemukan di dalam torrent.");
  const mimeType = getMimeTypeForFile(file.name, formatHint);

  if (typeof file.blob === "function") {
    const rawBlob = await file.blob();
    const typedBlob =
      rawBlob instanceof Blob && rawBlob.type === mimeType
        ? rawBlob
        : new Blob([rawBlob], { type: mimeType });
    return URL.createObjectURL(typedBlob);
  }

  if (typeof file.arrayBuffer === "function") {
    const buffer = await file.arrayBuffer();
    return URL.createObjectURL(new Blob([buffer], { type: mimeType }));
  }

  if (typeof file.getBlob === "function") {
    const rawBlob = await new Promise((resolve, reject) => {
      file.getBlob((err, b) => (err ? reject(err) : resolve(b)));
    });
    return URL.createObjectURL(new Blob([rawBlob], { type: mimeType }));
  }

  if (typeof file.getBuffer === "function") {
    const buffer = await new Promise((resolve, reject) => {
      file.getBuffer((err, buf) => (err ? reject(err) : resolve(buf)));
    });
    return URL.createObjectURL(new Blob([buffer], { type: mimeType }));
  }

  if (typeof file.getBlobURL === "function") {
    return new Promise((resolve, reject) => {
      file.getBlobURL((err, url) => (err ? reject(err) : resolve(url)));
    });
  }

  throw new Error("Metode ekstraksi Blob tidak didukung oleh versi WebTorrent ini.");
}

export function SwarmProvider({ children }) {
  const [clientReady, setClientReady] = useState(false);
  const [activeTorrents, setActiveTorrents] = useState([]);
  const [totalPeers, setTotalPeers] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [totalUploaded, setTotalUploaded] = useState(0);

  // Store extra metadata per torrent (keyed by infoHash or magnetURI)
  const metaMapRef = useRef(new Map());
  // Track cumulative uploaded bytes from removed torrents so totalUploaded never drops
  const archivedUploadedBytesRef = useRef(0);

  const syncTelemetry = useCallback(() => {
    const client = getOrCreateWebTorrentClient();
    if (!client) {
      setClientReady(false);
      setActiveTorrents([]);
      setTotalPeers(0);
      setDownloadSpeed(0);
      setUploadSpeed(0);
      setTotalUploaded(archivedUploadedBytesRef.current);
      return;
    }

    setClientReady(true);

    const torrents = Array.isArray(client.torrents) ? client.torrents : [];
    let peersSum = 0;
    let downSum = 0;
    let upSum = 0;
    let currentUploadedSum = 0;

    const snapshots = torrents.map((t) => {
      const key = (t.infoHash || "").toLowerCase() || t.magnetURI;
      const meta = metaMapRef.current.get(key) || metaMapRef.current.get(t.magnetURI) || {};
      const peers = Number(t.numPeers || 0);
      const down = Number(t.downloadSpeed || 0);
      const up = Number(t.uploadSpeed || 0);
      const uploaded = Number(t.uploaded || 0);
      const downloaded = Number(t.downloaded || 0);
      const length = Number(t.length || 0);
      const rawProgress = Number(t.progress || 0);
      const progress = t.done
        ? 100
        : Math.min(100, Math.max(0, Math.round(rawProgress * 1000) / 10));

      peersSum += peers;
      downSum += down;
      upSum += up;
      currentUploadedSum += uploaded;

      return {
        infoHash: t.infoHash || key,
        magnetURI: t.magnetURI || meta.originalMagnetURI || "",
        originalMagnetURI: meta.originalMagnetURI || t.magnetURI || "",
        name: t.name || meta.title || "Memuat metadata torrent...",
        title: meta.title || t.name || "Arsip GERBONG",
        format: meta.format || "",
        progress,
        numPeers: peers,
        downloadSpeed: down,
        uploadSpeed: up,
        downloaded,
        uploaded,
        length,
        done: Boolean(t.done),
        ready: Boolean(t.ready),
        status: meta.status || (t.done ? "seeding" : t.ready ? "downloading" : "connecting"),
        blobUrl: meta.blobUrl || null,
        torrentFileUrl: meta.torrentFileUrl || null,
        fileName: meta.fileName || null,
        error: meta.error || null,
      };
    });

    setActiveTorrents(snapshots);
    setTotalPeers(peersSum);
    setDownloadSpeed(Number(client.downloadSpeed || downSum || 0));
    setUploadSpeed(Number(client.uploadSpeed || upSum || 0));
    setTotalUploaded(archivedUploadedBytesRef.current + currentUploadedSum);
  }, []);

  useEffect(() => {
    syncTelemetry();
    const interval = window.setInterval(syncTelemetry, 1000);
    return () => window.clearInterval(interval);
  }, [syncTelemetry]);

  const findExistingTorrent = useCallback((client, identifier) => {
    if (!client || !identifier) return null;
    const raw = String(identifier).trim();
    const hash = extractInfoHash(raw) || raw.toLowerCase();

    const byHashOrMagnet = client.torrents.find((t) => {
      const tHash = (t.infoHash || "").toLowerCase();
      const meta = metaMapRef.current.get(tHash) || metaMapRef.current.get(t.magnetURI);
      return (
        (tHash && tHash === hash) ||
        t.magnetURI === raw ||
        meta?.originalMagnetURI === raw
      );
    });

    if (byHashOrMagnet) return byHashOrMagnet;

    try {
      return client.get(raw) || null;
    } catch {
      return null;
    }
  }, []);

  const attachTorrentExtraction = useCallback(
    (torrent, metaKey, options = {}) => {
      const updateMeta = (patch) => {
        const current = metaMapRef.current.get(metaKey) || {};
        const next = { ...current, ...patch };
        metaMapRef.current.set(metaKey, next);
        if (torrent.infoHash) {
          metaMapRef.current.set(torrent.infoHash.toLowerCase(), next);
        }
        if (torrent.magnetURI) {
          metaMapRef.current.set(torrent.magnetURI, next);
        }
        syncTelemetry();
      };

      const ensureTorrentFileUrl = () => {
        const current = metaMapRef.current.get(metaKey) || {};
        if (current.torrentFileUrl || !torrent.torrentFile) return;
        try {
          const torrentBlob = new Blob([torrent.torrentFile], {
            type: "application/x-bittorrent",
          });
          const torrentFileUrl = URL.createObjectURL(torrentBlob);
          updateMeta({ torrentFileUrl });
        } catch {
          // ignore if torrentFile bytes are unavailable
        }
      };

      const extractWhenComplete = async () => {
        const current = metaMapRef.current.get(metaKey) || {};
        if (current.blobUrl || current.extracting) return current.blobUrl;

        const targetFile = pickPrimaryBookFile(torrent.files, options.format || current.format);
        if (!targetFile) {
          updateMeta({
            status: "error",
            error: "Tidak ada berkas buku (.epub/.pdf) di dalam paket torrent ini.",
          });
          return null;
        }

        updateMeta({
          extracting: true,
          fileName: targetFile.name,
          status: "extracting",
        });

        try {
          const blobUrl = await createBlobUrlFromTorrentFile(
            targetFile,
            options.format || current.format
          );
          updateMeta({
            blobUrl,
            fileName: targetFile.name,
            extracting: false,
            status: "seeding",
            error: null,
          });
          return blobUrl;
        } catch (err) {
          updateMeta({
            extracting: false,
            status: "error",
            error: err?.message || "Gagal menyiapkan berkas bacaan dari torrent.",
          });
          return null;
        }
      };

      torrent.on("metadata", () => {
        ensureTorrentFileUrl();
        syncTelemetry();
      });

      torrent.on("ready", () => {
        ensureTorrentFileUrl();
        const file = pickPrimaryBookFile(torrent.files, options.format);
        updateMeta({
          fileName: file?.name || torrent.name,
          status: torrent.done ? "seeding" : "downloading",
        });
        if (torrent.done) {
          extractWhenComplete();
        }
      });

      torrent.on("download", () => {
        syncTelemetry();
      });

      torrent.on("upload", () => {
        syncTelemetry();
      });

      torrent.on("wire", () => {
        syncTelemetry();
      });

      torrent.on("done", () => {
        extractWhenComplete();
      });

      torrent.on("error", (err) => {
        updateMeta({
          status: "error",
          error: err?.message || "Terjadi gangguan pada koneksi torrent.",
        });
      });

      if (torrent.ready) {
        ensureTorrentFileUrl();
        const file = pickPrimaryBookFile(torrent.files, options.format);
        updateMeta({
          fileName: file?.name || torrent.name,
          status: torrent.done ? "seeding" : "downloading",
        });
      } else if (torrent.torrentFile) {
        ensureTorrentFileUrl();
      }

      if (torrent.done) {
        extractWhenComplete();
      }
    },
    [syncTelemetry]
  );

  const streamMagnet = useCallback(
    (magnetURI, options = {}) => {
      const cleaned = String(magnetURI || "").trim();
      if (!cleaned) {
        throw new Error("Magnet URI kosong atau tidak valid.");
      }

      const client = getOrCreateWebTorrentClient();
      if (!client) {
        throw new Error(
          "WebTorrent belum termuat di peramban. Pastikan skrip CDN WebTorrent aktif."
        );
      }

      const infoHash = extractInfoHash(cleaned);
      const metaKey = infoHash || cleaned;

      const existing = findExistingTorrent(client, cleaned);
      if (existing) {
        const existingKey = (existing.infoHash || "").toLowerCase() || metaKey;
        const currentMeta =
          metaMapRef.current.get(existingKey) || metaMapRef.current.get(metaKey) || {};
        metaMapRef.current.set(existingKey, {
          ...currentMeta,
          originalMagnetURI: cleaned,
          title: options.title || currentMeta.title || existing.name,
          format: options.format || currentMeta.format || "",
        });
        attachTorrentExtraction(existing, existingKey, options);
        syncTelemetry();
        return existing;
      }

      metaMapRef.current.set(metaKey, {
        originalMagnetURI: cleaned,
        title: options.title || "Arsip GERBONG",
        format: options.format || "",
        status: "connecting",
        blobUrl: null,
        fileName: null,
        error: null,
      });

      const torrent = client.add(cleaned, {
        announce: DEFAULT_WEBTORRENT_TRACKERS,
      });

      attachTorrentExtraction(torrent, metaKey, options);
      syncTelemetry();
      return torrent;
    },
    [attachTorrentExtraction, findExistingTorrent, syncTelemetry]
  );

  const removeTorrent = useCallback(
    (magnetURIOrInfoHash) => {
      const client = getOrCreateWebTorrentClient();
      if (!client || !magnetURIOrInfoHash) return;

      const target = findExistingTorrent(client, magnetURIOrInfoHash);
      if (!target) return;

      archivedUploadedBytesRef.current += Number(target.uploaded || 0);

      const keysToClean = [
        (target.infoHash || "").toLowerCase(),
        target.magnetURI,
        String(magnetURIOrInfoHash).trim(),
        extractInfoHash(String(magnetURIOrInfoHash)),
      ].filter(Boolean);

      for (const k of keysToClean) {
        const meta = metaMapRef.current.get(k);
        if (meta?.blobUrl) {
          try {
            URL.revokeObjectURL(meta.blobUrl);
          } catch {
            // ignore revoke errors
          }
        }
        if (meta?.torrentFileUrl) {
          try {
            URL.revokeObjectURL(meta.torrentFileUrl);
          } catch {
            // ignore revoke errors
          }
        }
        metaMapRef.current.delete(k);
      }

      try {
        target.destroy();
      } catch {
        try {
          client.remove(target);
        } catch {
          // ignore remove errors
        }
      }

      syncTelemetry();
    },
    [findExistingTorrent, syncTelemetry]
  );

  const clearAllTorrents = useCallback(() => {
    const client = getOrCreateWebTorrentClient();
    if (!client) return;

    const list = [...client.torrents];
    for (const t of list) {
      archivedUploadedBytesRef.current += Number(t.uploaded || 0);
      try {
        t.destroy();
      } catch {
        // ignore
      }
    }

    for (const meta of metaMapRef.current.values()) {
      if (meta?.blobUrl) {
        try {
          URL.revokeObjectURL(meta.blobUrl);
        } catch {
          // ignore
        }
      }
      if (meta?.torrentFileUrl) {
        try {
          URL.revokeObjectURL(meta.torrentFileUrl);
        } catch {
          // ignore
        }
      }
    }
    metaMapRef.current.clear();
    syncTelemetry();
  }, [syncTelemetry]);

  const getTorrentByMagnet = useCallback(
    (magnetURI) => {
      if (!magnetURI) return null;
      const raw = String(magnetURI).trim();
      const hash = extractInfoHash(raw) || raw.toLowerCase();

      return (
        activeTorrents.find(
          (t) =>
            (t.infoHash && t.infoHash.toLowerCase() === hash) ||
            t.magnetURI === raw ||
            t.originalMagnetURI === raw
        ) || null
      );
    },
    [activeTorrents]
  );

  const value = useMemo(
    () => ({
      clientReady,
      activeTorrents,
      totalPeers,
      downloadSpeed,
      uploadSpeed,
      totalUploaded,
      streamMagnet,
      removeTorrent,
      clearAllTorrents,
      getTorrentByMagnet,
    }),
    [
      clientReady,
      activeTorrents,
      totalPeers,
      downloadSpeed,
      uploadSpeed,
      totalUploaded,
      streamMagnet,
      removeTorrent,
      clearAllTorrents,
      getTorrentByMagnet,
    ]
  );

  return <SwarmContext.Provider value={value}>{children}</SwarmContext.Provider>;
}

export function useSwarm() {
  const context = useContext(SwarmContext);
  if (!context) {
    throw new Error("useSwarm harus digunakan di dalam SwarmProvider.");
  }
  return context;
}

export default SwarmContext;
