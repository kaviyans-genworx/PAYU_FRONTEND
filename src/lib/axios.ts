import axios from "axios";
import { TOKEN_KEY } from "@/config/constants";
import { CORE_API_BASE_URL, ENDPOINTS } from "@/config/env";

// ── Auth axios instance (no baseURL — ENDPOINTS contain full paths) ──
export const auth_axios_instance = axios.create({
  withCredentials: true,
});

auth_axios_instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Core API axios instance (baseURL for /api routes) ──
export const core_axios_intance = axios.create({
  baseURL: CORE_API_BASE_URL,
  withCredentials: true,
});


// REQUEST INTERCEPTOR - ADD AUTH TOKEN TO HEADER
core_axios_intance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Variables for handling concurrent requests during refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

// REFRESH TOKEN INTERCEPTOR - HANDLES 401 UNAUTHORIZED
core_axios_intance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return core_axios_intance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          ENDPOINTS.AUTH.REFRESH,
          {},
          { withCredentials: true }
        );

        const newToken = data.access_token;
        localStorage.setItem(TOKEN_KEY, newToken);
        core_axios_intance.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);

        return core_axios_intance(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = "/";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default core_axios_intance;