import axios from "axios";
import { CORE_API_BASE_URL } from "@/config/env";
import { TOKEN_KEY } from "@/config/constants";
import type {
  ValidationGroupSummary,
  ValidationGroupDetail,
  ValidationResultsOut,
  MappedItemsOut,
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

  async getGroupResults(groupId: number): Promise<ValidationResultsOut> {
    const { data } = await axios.get<ValidationResultsOut>(
      `${CORE_API_BASE_URL}/api/validations/groups/${groupId}/results`,
      { headers: authHeaders() },
    );
    return data;
  },

  async getMappedItems(groupId: number): Promise<MappedItemsOut> {
    const { data } = await axios.get<MappedItemsOut>(
      `${CORE_API_BASE_URL}/api/validations/groups/${groupId}/mapped-items`,
      { headers: authHeaders() },
    );
    return data;
  },
};
