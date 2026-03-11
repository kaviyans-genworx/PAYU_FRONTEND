import axios from "axios";
import { CORE_API_BASE_URL } from "@/config/env";
import { TOKEN_KEY } from "@/config/constants";
import type {
  SubmitPOReviewPayload,
  SubmitInvoiceReviewPayload,
  VendorSearchResult,
  POSearchResult,
} from "@/types/documents";

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const reviewService = {
  async submitPOReview(
    poId: number,
    payload: SubmitPOReviewPayload,
  ): Promise<Record<string, unknown>> {
    const { data } = await axios.post(
      `${CORE_API_BASE_URL}/extraction/po/${poId}/submit-review`,
      payload,
      { headers: { ...authHeaders(), "Content-Type": "application/json" } },
    );
    return data;
  },

  async submitInvoiceReview(
    invoiceId: number,
    payload: SubmitInvoiceReviewPayload,
  ): Promise<Record<string, unknown>> {
    const { data } = await axios.post(
      `${CORE_API_BASE_URL}/extraction/invoice/${invoiceId}/submit-review`,
      payload,
      { headers: { ...authHeaders(), "Content-Type": "application/json" } },
    );
    return data;
  },

  async searchVendors(query: string): Promise<VendorSearchResult[]> {
    const { data } = await axios.get(
      `${CORE_API_BASE_URL}/vendors/search`,
      { params: { q: query }, headers: authHeaders() },
    );
    return data;
  },

  async searchPurchaseOrders(query: string): Promise<POSearchResult[]> {
    const { data } = await axios.get(
      `${CORE_API_BASE_URL}/purchase-orders/search`,
      { params: { q: query }, headers: authHeaders() },
    );
    return data;
  },
};
