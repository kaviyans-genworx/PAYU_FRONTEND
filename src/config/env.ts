export const API_BASE_URL = "http://localhost:8000/api/v1";
export const CORE_API_BASE_URL = "http://localhost:8001";

export const ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
  },
  EXTRACTION: {
    EXTRACT: `${CORE_API_BASE_URL}/extraction/extract`,
    PENDING_REVIEW: `${CORE_API_BASE_URL}/extraction/pending-review`,
  },
} as const;
