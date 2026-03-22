
export const API_BASE_URL = "http://localhost:8000/api/v1";
export const CORE_API_BASE_URL = "http://localhost:8001"

// export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://payu-auth-backend-717740758627.us-east1.run.app/api/v1";

// export const CORE_API_BASE_URL = import.meta.env.VITE_CORE_API_BASE_URL || "https://payu-core-backend-717740758627.us-east1.run.app";

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
    EXTRACT: `${CORE_API_BASE_URL}/extraction/extract`,
    UPLOAD_PO: `${CORE_API_BASE_URL}/extraction/documents/upload`,
    PENDING_REVIEW: `${CORE_API_BASE_URL}/extraction/pending-review`,
    RESULT: (jobId: string) => `${CORE_API_BASE_URL}/documents/${jobId}/result`,
  },
} as const;
