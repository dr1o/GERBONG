import { useEffect } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { SwarmProvider } from "./context/SwarmContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import BottomNav from "./components/BottomNav.jsx";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute.jsx";
import AuthorsPage from "./pages/AuthorsPage.jsx";
import AuthorDetailPage from "./pages/AuthorDetailPage.jsx";
import AuthorFormPage from "./pages/AuthorFormPage.jsx";
import WorksPage from "./pages/WorksPage.jsx";
import WorkDetailPage from "./pages/WorkDetailPage.jsx";
import WorkFormPage from "./pages/WorkFormPage.jsx";
import AboutProfilePage from "./pages/AboutProfilePage.jsx";
import AdminLoginPage from "./pages/AdminLoginPage.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <SwarmProvider>
        <div className="min-h-dvh bg-[#F4F1EA] text-[#161615]">
          <ScrollToTop />

          {/* Editorial Masthead */}
          <header className="sticky top-0 z-30 border-b-2 border-[#161615] bg-[#F4F1EA]">
            <div className="max-w-2xl mx-auto px-4 py-3 flex items-baseline justify-between gap-3">
              <Link to="/authors" className="group min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                  <span className="font-serif text-xl font-bold tracking-tight text-[#161615] group-hover:text-[#991B1B] transition-colors">
                    GERBONG
                  </span>
                  <span className="text-xs text-[#57534E] truncate">
                    Gerakan Bacaan dan Arsip Gotong-Royong
                  </span>
                </div>
              </Link>

              <span className="font-mono text-[11px] text-[#57534E] shrink-0">
                [PWA • P2P]
              </span>
            </div>
          </header>

          {/* Main Mobile-First Container */}
          <main className="max-w-2xl mx-auto px-4 pt-6 pb-24">
            <Routes>
              <Route path="/" element={<Navigate to="/authors" replace />} />

              {/* Authors CRUD */}
              <Route path="/authors" element={<AuthorsPage />} />
              <Route
                path="/authors/new"
                element={
                  <ProtectedAdminRoute>
                    <AuthorFormPage />
                  </ProtectedAdminRoute>
                }
              />
              <Route path="/authors/:id" element={<AuthorDetailPage />} />
              <Route
                path="/authors/:id/edit"
                element={
                  <ProtectedAdminRoute>
                    <AuthorFormPage />
                  </ProtectedAdminRoute>
                }
              />

              {/* Works CRUD */}
              <Route path="/works" element={<WorksPage />} />
              <Route
                path="/works/new"
                element={
                  <ProtectedAdminRoute>
                    <WorkFormPage />
                  </ProtectedAdminRoute>
                }
              />
              <Route path="/works/:id" element={<WorkDetailPage />} />
              <Route
                path="/works/:id/edit"
                element={
                  <ProtectedAdminRoute>
                    <WorkFormPage />
                  </ProtectedAdminRoute>
                }
              />

              {/* Profile & About */}
              <Route path="/about" element={<AboutProfilePage />} />

              {/* Admin Auth */}
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/authors" replace />} />
            </Routes>
          </main>

          {/* Persistent Bottom Navigation */}
          <BottomNav />
        </div>
      </SwarmProvider>
    </AuthProvider>
  );
}
