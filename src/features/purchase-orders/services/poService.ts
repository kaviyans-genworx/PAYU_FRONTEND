import axios from "axios";
import { CORE_API_BASE_URL } from "@/config/env";
import { TOKEN_KEY } from "@/config/constants";
import type { PurchaseOrderOut } from "@/types/documents";

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const poService = {
  async listPurchaseOrders(): Promise<PurchaseOrderOut[]> {
    const { data } = await axios.get<PurchaseOrderOut[]>(
      `${CORE_API_BASE_URL}/purchase-orders`,
      { headers: authHeaders() },
    );
    return data;
  },

  async getPurchaseOrder(id: number): Promise<PurchaseOrderOut> {
    const { data } = await axios.get<PurchaseOrderOut>(
      `${CORE_API_BASE_URL}/purchase-orders/${id}`,
      { headers: authHeaders() },
    );
    return data;
  },
};
