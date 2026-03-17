export interface User {
  user_id: number;
  name: string;
  email: string;
}

export interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  userId: number | null;
  roleId: number | null;
  isFirstLogin: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  is_first_login: boolean;
}

export interface TokenValidationResponse {
  user_id: number;
  role_id: number;
  is_first_login: boolean;
}

export interface MessageResponse {
  message: string;
}

export interface AdminUser {
  user_id: number;
  name: string;
  email: string;
  role_id: number;
  role_name: string | null;
  is_active: boolean;
  is_first_login: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateAdminUserPayload {
  name: string;
  email: string;
  role_id: number;
}

export interface UpdateAdminUserPayload {
  name?: string;
  role_id?: number;
  is_active?: boolean;
}
