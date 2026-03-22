import {core_axios_intance} from "@/lib/axios";
import type { PurchaseOrderOut } from "@/types/documents";

export const poService = {
  async listPurchaseOrders(): Promise<PurchaseOrderOut[]> {
    const { data } = await core_axios_intance.get<PurchaseOrderOut[]>(
      `/purchase-orders`
    );
    return data;
  },

  async getPurchaseOrder(id: number): Promise<PurchaseOrderOut> {
    const { data } = await core_axios_intance.get<PurchaseOrderOut>(
      `/purchase-orders/${id}`
    );
    return data;
  },

  async deletePurchaseOrder(id: number): Promise<{ message: string }> {
    const { data } = await core_axios_intance.delete<{ message: string }>(
      `/purchase-orders/${id}`
    );
    return data;
  },
};
