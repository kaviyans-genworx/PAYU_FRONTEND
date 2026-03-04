import axiosInstance from "@/lib/axios";
import { ENDPOINTS } from "@/config/env";
import type { AuthResponse, MessageResponse } from "@/types/auth";

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

  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<MessageResponse> {
    const params = new URLSearchParams();
    params.append("name", name);
    params.append("email", email);
    params.append("password", password);

    const { data } = await axiosInstance.post<MessageResponse>(
      ENDPOINTS.AUTH.REGISTER,
      params,
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
