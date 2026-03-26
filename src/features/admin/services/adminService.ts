import { core_axios_intance } from "@/lib/axios";
import type { PurchaseOrderOut } from "@/types/documents";



export interface AdminDashboardSummary {
  total_invoices: number;
  total_purchase_orders: number;
  total_validations: number;
  total_pending_validation: number;
  total_unmatched_invoices: number;
}

export interface AdminDashboardTrendPoint {
  date: string;
  invoices: number;
  validations: number;
  purchase_orders: number;
}

export interface AdminDashboardTrends {
  points: AdminDashboardTrendPoint[];
}

export interface UnmappedInvoice {
  id: number;
  invoice_number?: string | null;
  vendor_name?: string | null;
  vendor_email?: string | null;
  total_amount?: number | null;
  created_at?: string | null;
  status: string;
}

export const adminService = {
  async getDashboardSummary(fromDate: string, toDate: string): Promise<AdminDashboardSummary> {
    const { data } = await core_axios_intance.get<AdminDashboardSummary>(
      "/admin/dashboard/summary",
      { params: { from_date: fromDate, to_date: toDate } }
    );
    return data;
  },

  async getDashboardTrends(fromDate: string, toDate: string): Promise<AdminDashboardTrends> {
    const { data } = await core_axios_intance.get<AdminDashboardTrends>(
      "/admin/dashboard/trends",
      { params: { from_date: fromDate, to_date: toDate } },
    );
    return data;
  },

  async listUnmappedInvoices(): Promise<UnmappedInvoice[]> {
    const { data } = await core_axios_intance.get<UnmappedInvoice[]>(
      "/admin/invoices/unmapped",
    );
    return data;
  },

  async listPurchaseOrders(): Promise<PurchaseOrderOut[]> {
    const { data } = await core_axios_intance.get<PurchaseOrderOut[]>(
      "/purchase-orders",
    );
    return data;
  },

  async mapInvoiceToPO(invoiceId: number, poIds: number[]): Promise<{ message: string }> {
    const { data } = await core_axios_intance.post<{ message: string }>(
      `/admin/invoices/${invoiceId}/map-po`,
      { po_ids: poIds },
    );
    return data;
  },

  async enqueueValidation(invoiceId: number): Promise<{ message: string }> {
    const { data } = await core_axios_intance.post<{ message: string }>(
      `/admin/invoices/${invoiceId}/enqueue`,
    );
    return data;
  },

  async notifyVendor(invoiceId: number): Promise<{ message: string }> {
    const { data } = await core_axios_intance.post<{ message: string }>(
      `/admin/invoices/${invoiceId}/notify-vendor`,
    );
    return data;
  },

  async deleteUnmappedInvoice(invoiceId: number): Promise<{ message: string }> {
    const { data } = await core_axios_intance.delete<{ message: string }>(
      `/admin/invoices/${invoiceId}`,
    );
    return data;
  },
};

