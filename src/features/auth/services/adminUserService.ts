import axiosInstance from "@/lib/axios";
import { ENDPOINTS } from "@/config/env";
import type {
  AdminUser,
  CreateAdminUserPayload,
  UpdateAdminUserPayload,
} from "@/types/auth";

export const adminUserService = {
  async listUsers(): Promise<AdminUser[]> {
    const { data } = await axiosInstance.get<AdminUser[]>(ENDPOINTS.ADMIN_USERS.BASE);
    return data;
  },

  async createUser(payload: CreateAdminUserPayload): Promise<AdminUser> {
    const { data } = await axiosInstance.post<AdminUser>(
      ENDPOINTS.ADMIN_USERS.BASE,
      payload,
      {
        headers: { "Content-Type": "application/json" },
      },
    );
    return data;
  },

  async updateUser(
    userId: number,
    payload: UpdateAdminUserPayload,
  ): Promise<AdminUser> {
    const { data } = await axiosInstance.put<AdminUser>(
      ENDPOINTS.ADMIN_USERS.BY_ID(userId),
      payload,
      {
        headers: { "Content-Type": "application/json" },
      },
    );
    return data;
  },
};
