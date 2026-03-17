import axiosInstance from "@/lib/axios";
import { ENDPOINTS } from "@/config/env";
import type {
  AuthResponse,
  MessageResponse,
  TokenValidationResponse,
} from "@/types/auth";

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const params = new URLSearchParams();
    params.append("email", email);
    params.append("password", password);

    const { data } = await axiosInstance.post<AuthResponse>(
      ENDPOINTS.AUTH.LOGIN,
      params,
    );
    return data;
  },

  async validateToken(): Promise<TokenValidationResponse> {
    const { data } = await axiosInstance.get<TokenValidationResponse>(
      ENDPOINTS.AUTH.VALIDATE_TOKEN,
    );
    return data;
  },

  async changePassword(
    oldPassword: string,
    newPassword: string,
  ): Promise<MessageResponse> {
    const { data } = await axiosInstance.post<MessageResponse>(
      ENDPOINTS.AUTH.CHANGE_PASSWORD,
      {
        old_password: oldPassword,
        new_password: newPassword,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return data;
  },

  async refresh(): Promise<AuthResponse> {
    const { data } = await axiosInstance.post<AuthResponse>(
      ENDPOINTS.AUTH.REFRESH,
    );
    return data;
  },

  async logout(): Promise<MessageResponse> {
    const { data } = await axiosInstance.post<MessageResponse>(
      ENDPOINTS.AUTH.LOGOUT,
    );
    return data;
  },
};
