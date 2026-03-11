import axios from "axios";
import { CORE_API_BASE_URL } from "@/config/env";
import { TOKEN_KEY } from "@/config/constants";
import type {
  ValidationGroupSummary,
  ValidationGroupDetail,
} from "@/types/documents";

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const validationService = {
  async listGroups(): Promise<ValidationGroupSummary[]> {
    const { data } = await axios.get<ValidationGroupSummary[]>(
      `${CORE_API_BASE_URL}/api/validations/groups`,
      { headers: authHeaders() },
    );
    return data;
  },

  async getGroupDetail(groupId: number): Promise<ValidationGroupDetail> {
    const { data } = await axios.get<ValidationGroupDetail>(
      `${CORE_API_BASE_URL}/api/validations/groups/${groupId}`,
      { headers: authHeaders() },
    );
    return data;
  },
};
