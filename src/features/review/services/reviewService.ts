import {core_axios_intance} from "@/lib/axios";
import type {
  SubmitPOReviewPayload,
  SubmitInvoiceReviewPayload,
  VendorSearchResult,
  POSearchResult,
} from "@/types/documents";


export const reviewService = {
  async submitPOReview(
    poId: number,
    payload: SubmitPOReviewPayload,
  ): Promise<Record<string, unknown>> {
    const { data } = await core_axios_intance.post(
      `/extraction/po/${poId}/submit-review`,
      payload,
    );
    return data;
  },

  async submitInvoiceReview(
    invoiceId: number,
    payload: SubmitInvoiceReviewPayload,
  ): Promise<Record<string, unknown>> {
    const { data } = await core_axios_intance.post(
      `/extraction/invoice/${invoiceId}/submit-review`,
      payload,
    );
    return data;
  },

  async searchVendors(query: string): Promise<VendorSearchResult[]> {
    const { data } = await core_axios_intance.get(
      `/vendors/search`,
      { params: { q: query } },
    );
    return data;
  },

  async searchPurchaseOrders(query: string): Promise<POSearchResult[]> {
    const { data } = await core_axios_intance.get(
      `/purchase-orders/search`,
      { params: { q: query } },
    );
    return data;
  },

  async deletePurchaseOrder(poId: number): Promise<{ message: string }> {
    const { data } = await core_axios_intance.delete<{ message: string }>(
      `/purchase-orders/${poId}`
    );
    return data;
  },
};
