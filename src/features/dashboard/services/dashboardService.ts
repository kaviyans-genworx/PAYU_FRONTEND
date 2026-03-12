import axios from "axios";
import { CORE_API_BASE_URL } from "@/config/env";
import { TOKEN_KEY } from "@/config/constants";
import type {
  InvoiceOut,
  PurchaseOrderOut,
  ValidationGroupSummary,
} from "@/types/documents";

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface DashboardData {
  invoices: InvoiceOut[];
  purchaseOrders: PurchaseOrderOut[];
  validationGroups: ValidationGroupSummary[];
}

export const dashboardService = {
  async fetchAll(): Promise<DashboardData> {
    const [invoices, purchaseOrders, validationGroups] = await Promise.all([
      axios
        .get<InvoiceOut[]>(`${CORE_API_BASE_URL}/invoices`, {
          headers: authHeaders(),
        })
        .then((r) => r.data),
      axios
        .get<PurchaseOrderOut[]>(`${CORE_API_BASE_URL}/purchase-orders`, {
          headers: authHeaders(),
        })
        .then((r) => r.data),
      axios
        .get<ValidationGroupSummary[]>(
          `${CORE_API_BASE_URL}/api/validations/groups`,
          { headers: authHeaders() },
        )
        .then((r) => r.data)
        .catch(() => [] as ValidationGroupSummary[]),
    ]);

    return { invoices, purchaseOrders, validationGroups };
  },
};
