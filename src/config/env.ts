// ── API base URLs ───────────────────────────────────────
// In production (deployed behind nginx), both services are
// accessible through the same origin via reverse proxy:
//   /auth/*  → Auth backend
//   /api/*   → Core backend
//
// In local dev (docker-compose), the services run on
// separate ports: localhost:8000 (auth) and localhost:8001 (core).
//
// Use VITE_* env vars to override at build time.

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export const CORE_API_BASE_URL =
  import.meta.env.VITE_CORE_API_BASE_URL || "http://localhost:8001";

export const ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    VALIDATE_TOKEN: `${API_BASE_URL}/auth/validate_token`,
    CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
  },
  ADMIN_USERS: {
    BASE: `${API_BASE_URL}/admin/users`,
    BY_ID: (userId: number) => `${API_BASE_URL}/admin/users/${userId}`,
    DEACTIVATE: (userId: number) => `${API_BASE_URL}/admin/users/${userId}/deactivate`,
  },
  EXTRACTION: {
    EXTRACT: `/extraction/extract`,
    UPLOAD_PO: `/extraction/documents/upload`,
    PENDING_REVIEW: `/extraction/pending-review`,
    RESULT: (jobId: string) =>
      `/documents/${jobId}/result`,
  },
} as const;

