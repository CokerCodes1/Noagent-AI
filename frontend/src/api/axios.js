import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5003/api";

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || API_BASE_URL.replace(/\/api$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const normalizedUrl = String(config.url || "");
  const isProtectedRequest =
    Boolean(token) ||
    normalizedUrl.startsWith("/auth") ||
    normalizedUrl.startsWith("/admin") ||
    normalizedUrl.startsWith("/landlord") ||
    normalizedUrl.startsWith("/notifications") ||
    normalizedUrl.startsWith("/payment") ||
    normalizedUrl.startsWith("/technicians/me");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (isProtectedRequest) {
    config.headers["Cache-Control"] = "no-store";
    config.headers["X-NoAgentNaija-Private"] = "1";
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (!config) {
      return Promise.reject(error);
    }

    const method = String(config.method || "get").toLowerCase();
    const shouldRetry =
      method === "get" &&
      !config.__retried &&
      (!response || response.status >= 500 || response.status === 429);

    if (!shouldRetry) {
      return Promise.reject(error);
    }

    config.__retried = true;
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    return api(config);
  }
);

export function extractErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

export default api;
