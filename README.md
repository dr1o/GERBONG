# GERBONG — Gerakan Bacaan dan Arsip Gotong-Royong

**Tugas Akhir Praktikum Pemrograman Perangkat Bergerak (PPB) — Progressive Web App (PWA)**  
**Penyusun:** Fitrandi Sabila Mustaqim (`21120124130061`)  
**GitHub:** [@dr1o](https://github.com/dr1o)

GERBONG adalah Progressive Web App (PWA) arsip digital terdesentralisasi untuk tokoh pemikir dan karya sejarah Indonesia. Proyek ini memisahkan **Control Plane** (API katalog metadata) dan **Data Plane** (distribusi berkas `.pdf`/`.epub` peer-to-peer melalui WebTorrent WebRTC).

## Struktur Repositori

- `server/` — **Control Plane (Modul 1 RESTful API):** Node.js, Express (`"type": "module"`), Supabase PostgreSQL (`@supabase/supabase-js`) dengan pola MVC (`config/`, `models/`, `controllers/`, `routes/`, `middleware/`), proteksi write admin (`Authorization: Bearer <ADMIN_TOKEN>`), siap deploy di Vercel (`server/vercel.json`).
- `client/` — **Data Plane & PWA:** Vite + React, Tailwind CSS, React Router, Axios (request/response interceptors), `vite-plugin-pwa` (Workbox `NetworkFirst` caching untuk `/api/*`), WebTorrent (CDN), `pdfjs-dist` (inline PDF canvas reader + layar penuh), dan `epubjs` (inline EPUB reader + layar penuh).

## Menjalankan Secara Lokal

### 1. Backend (`server/`)
```bash
cd server
npm install
cp .env.example .env   # isi SUPABASE_URL, SUPABASE_KEY, ADMIN_PASSWORD, ADMIN_TOKEN
npm run dev
```

### 2. Frontend PWA (`client/`)
```bash
cd client
npm install
npm run dev
```

## Deploy ke Vercel (Gratis)

Repositori ini dirancang sebagai monorepo (`server/` dan `client/`) untuk di-deploy sebagai 2 proyek Vercel dari satu repositori GitHub:

1. **Backend API (`server/`):** Import repo ini di Vercel → set **Root Directory** ke `server` → tambahkan Environment Variables (`SUPABASE_URL`, `SUPABASE_KEY`, `ADMIN_PASSWORD`, `ADMIN_TOKEN`) → Deploy.
2. **Frontend PWA (`client/`):** Import repo yang sama di Vercel → set **Root Directory** ke `client`, **Framework Preset** ke `Vite` → tambahkan Environment Variable `VITE_API_URL=https://<domain-server-anda>.vercel.app/api` → Deploy.
