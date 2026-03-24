import { core_axios_intance } from '@/lib/axios';
import type { InvoiceOut } from "@/types/documents";


export const invoiceService = {
  async listInvoices(): Promise<InvoiceOut[]> {
    const { data } = await core_axios_intance.get<InvoiceOut[]>(
      `/invoices`
    );
    return data;
  },

  async getInvoice(id: number): Promise<InvoiceOut> {
    const { data } = await core_axios_intance.get<InvoiceOut>(
      `/invoices/${id}`
    );
    return data;
  },
};
