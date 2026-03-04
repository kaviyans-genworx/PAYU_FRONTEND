export interface User {
  user_id: string;
  name: string;
  email: string;
}

export interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
}

export interface MessageResponse {
  message: string;
}
