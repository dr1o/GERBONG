import axios from "axios";

export const ADMIN_TOKEN_KEY = "gerbong_admin_token";

let unauthorizedHandler = null;

export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

const defaultApiBaseUrl =
  typeof window !== "undefined" && window.location?.hostname
    ? `http://${window.location.hostname}:3000/api`
    : "http://localhost:3000/api";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

axiosClient.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined" ? window.localStorage.getItem(ADMIN_TOKEN_KEY) : null;
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || "");

    if (status === 401 && !requestUrl.includes("/auth/login")) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(ADMIN_TOKEN_KEY);
      }
      unauthorizedHandler?.();
    }

    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error, fallback = "Terjadi kesalahan saat menghubungi server.") {
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message === "Network Error") {
    return "Tidak dapat terhubung ke server API GERBONG. Pastikan server backend aktif.";
  }
  return error?.message || fallback;
}

export default axiosClient;
