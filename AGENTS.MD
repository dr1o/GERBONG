# AGENTS.md — GERBONG (Gerakan Bacaan dan Arsip Gotong-Royong)

## Project Overview
GERBONG (*Gerakan Bacaan dan Arsip Gotong-Royong*) is a full-CRUD Progressive Web App (PWA) decentralized digital archive of Indonesian thinkers and historical works.
- **Control Plane (`server/`):** Node.js + Express RESTful API connected to Supabase PostgreSQL using strict MVC structure (`config/`, `models/`, `controllers/`, `routes/`), deployed on Vercel.
- **Data Plane (`client/`):** Vite + React PWA using WebTorrent (WebRTC) to stream `.epub` and `.pdf` files directly from peer seeders via `magnet_uri` stored in Supabase.

## Repository Structure
- `server/` — Modul 1 Express + Supabase MVC API
  - `src/config/supabaseClient.js`
  - `src/models/` (`categoryModel.js`, `authorModel.js`, `workModel.js`)
  - `src/controllers/` (`categoryController.js`, `authorController.js`, `workController.js`)
  - `src/routes/` (`categoryRoutes.js`, `authorRoutes.js`, `workRoutes.js`)
  - `src/index.js`
  - `vercel.json`
- `client/` — Vite + React PWA
  - `public/` (PWA icons + manifest assets)
  - `src/api/axiosClient.js`
  - `src/context/SwarmContext.jsx`
  - `src/components/` (`BottomNav.jsx`, `EmptyState.jsx`, `EpubViewer.jsx`, `PdfViewer.jsx`, `CategoryManagerModal.jsx`)
  - `src/pages/` (`AuthorsPage.jsx`, `AuthorDetailPage.jsx`, `AuthorFormPage.jsx`, `WorksPage.jsx`, `WorkDetailPage.jsx`, `WorkFormPage.jsx`, `AboutProfilePage.jsx`)

## Hard Technical Guardrails (DO NOT VIOLATE)
1. **Branding Consistency:** Always brand the UI, navbar header, About page, and `vite-plugin-pwa` manifest as **GERBONG** (*Gerakan Bacaan dan Arsip Gotong-Royong*).
2. **Empty Database First:** All Supabase tables (`categories`, `authors`, `works`) start completely empty (`0` rows). Never crash on empty arrays (`[]`). Every list page must render a clean `EmptyState` component with a direct CTA button to create the first entry.
3. **Full CRUD Required:** Both backend and frontend must support **Create (`POST`), Read (`GET`), Update (`PUT`), and Delete (`DELETE`)** for `categories`, `authors`, and `works`.
4. **Never install `webtorrent` via npm inside `client/`:** Importing the npm package in Vite breaks the build due to missing Node `Buffer` and `process` polyfills. Load `<script src="https://cdn.jsdelivr.net/npm/webtorrent@latest/webtorrent.min.js"></script>` in `client/index.html` and access `window.WebTorrent`.
5. **Modul 1 Backend Rules:** Use ES Modules (`"type": "module"`). Query Supabase exclusively via `@supabase/supabase-js` using `SUPABASE_URL` and `SUPABASE_KEY` from `.env`. Enable `cors()` globally.
6. **EPUB & PDF Rendering:** Use `epubjs` attached to a DOM `ref` (`ePub(blobUrl).renderTo(...)`) for `.epub` files and an embedded `<object>`/`<iframe>` for `.pdf` files.
7. **TA Rubric Mandatory UI Rules:**
   - Persistent fixed **Bottom Navigation Bar** with 3 tabs: `Tokoh` (`/authors`), `Pustaka` (`/works`), and `Profil & Relawan` (`/about`).
   - Minimum 5 main views: `/authors` (List 1), `/authors/:id` (Detail 1), `/works` (List 2), `/works/:id` (Detail 2), and `/about` (Profile + About GERBONG + Volunteer Seeding Node), plus CRUD form routes (`/authors/new`, `/authors/:id/edit`, `/works/new`, `/works/:id/edit`).
   - Configure `vite-plugin-pwa` with `registerType: 'autoUpdate'`, valid `manifest` (`display: 'standalone'`), and Workbox `NetworkFirst` runtime caching for `/api/*` requests.
   8. NEXT_PUBLIC_SUPABASE_URL=https://zgbbsbvceqtekbfttnwk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_JyxibVnman0pgOYGEzbj0A_66HHukoT
## Access Control & Role Guardrails
9. **Anonymous-First Experience:** Readers MUST NEVER be forced to log in to browse `/authors`, browse `/works`, stream/read/download books via WebTorrent, or toggle **Mode Relawan** on `/about`. All `GET` endpoints remain completely public.
10. **Admin-Only Write Protection:** Protect all `POST`, `PUT`, and `DELETE` routes on `/api/authors`, `/api/works`, and `/api/categories` with `src/middleware/adminAuth.js` verifying `Authorization: Bearer <ADMIN_TOKEN>`.
11. **Conditional Admin UI:** Hide all `+ Tambah`, `Edit`, `Delete`, and `Kelola Kategori` buttons when `isAdmin` is false. Provide a discreet **Admin Login** button inside `/about` (and route `/admin/login`) so the Bottom Navigation Bar stays clean with its 3 tabs.
