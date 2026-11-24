import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axiosClient, {
  ADMIN_TOKEN_KEY,
  setUnauthorizedHandler,
} from "../api/axiosClient.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(ADMIN_TOKEN_KEY) || "";
  });

  const isAdmin = Boolean(token);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
    setToken("");
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    const storedToken =
      typeof window !== "undefined" ? window.localStorage.getItem(ADMIN_TOKEN_KEY) : null;
    if (storedToken) {
      axiosClient.get("/auth/verify").catch(() => {});
    }
  }, []);

  const login = useCallback(async (password) => {
    const { data } = await axiosClient.post("/auth/login", { password });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
    }
    setToken(data.token);
    return data;
  }, []);

  const value = useMemo(
    () => ({
      isAdmin,
      token,
      login,
      logout,
    }),
    [isAdmin, token, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider.");
  }
  return context;
}

export default AuthContext;
