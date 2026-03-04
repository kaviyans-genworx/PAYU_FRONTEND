import axios from "axios";
import { TOKEN_KEY } from "@/config/constants";

const axiosInstance = axios.create({
  withCredentials: true,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
});

// Request interceptor – attach access token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor – handle 401 / token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post("/api/v1/auth/refresh", null, {
          withCredentials: true,
        });
        const newToken = data.access_token;
        localStorage.setItem(TOKEN_KEY, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
