import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export const FAVORITES_STORAGE_KEY = "gerbong_favorite_works";

const FavoritesContext = createContext(null);

function normalizeWorkSnapshot(work) {
  if (!work || work.id == null) return null;

  return {
    id: work.id,
    title: work.title || "Tanpa Judul",
    year: work.year ?? null,
    format: work.format || "EPUB",
    file_size: work.file_size || null,
    page_count: work.page_count ?? null,
    summary: work.summary || null,
    magnet_uri: work.magnet_uri || null,
    author_id: work.author_id ?? work.authors?.id ?? null,
    category_id: work.category_id ?? work.categories?.id ?? null,
    authors: work.authors
      ? {
          id: work.authors.id,
          name: work.authors.name,
          lifespan: work.authors.lifespan || null,
        }
      : null,
    categories: work.categories
      ? {
          id: work.categories.id,
          name: work.categories.name,
        }
      : null,
    savedAt: work.savedAt || new Date().toISOString(),
  };
}

function loadStoredFavorites() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeWorkSnapshot).filter(Boolean);
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(loadStoredFavorites);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // Ignore storage quota errors
    }
  }, [favorites]);

  const isFavorite = useCallback(
    (workId) => {
      if (workId == null) return false;
      return favorites.some((item) => String(item.id) === String(workId));
    },
    [favorites]
  );

  const toggleFavorite = useCallback((work) => {
    const normalized = normalizeWorkSnapshot(work);
    if (!normalized) return;

    setFavorites((prev) => {
      const exists = prev.some((item) => String(item.id) === String(normalized.id));
      if (exists) {
        return prev.filter((item) => String(item.id) !== String(normalized.id));
      }
      return [{ ...normalized, savedAt: new Date().toISOString() }, ...prev];
    });
  }, []);

  const removeFavorite = useCallback((workId) => {
    if (workId == null) return;
    setFavorites((prev) => prev.filter((item) => String(item.id) !== String(workId)));
  }, []);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  const value = useMemo(
    () => ({
      favorites,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      clearFavorites,
    }),
    [favorites, isFavorite, toggleFavorite, removeFavorite, clearFavorites]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites harus digunakan di dalam FavoritesProvider.");
  }
  return context;
}

export default FavoritesContext;
