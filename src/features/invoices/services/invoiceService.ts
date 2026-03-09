import axios from "axios";
import { CORE_API_BASE_URL } from "@/config/env";
import { TOKEN_KEY } from "@/config/constants";
import type { InvoiceOut } from "@/types/documents";

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const invoiceService = {
  async listInvoices(): Promise<InvoiceOut[]> {
    const { data } = await axios.get<InvoiceOut[]>(
      `${CORE_API_BASE_URL}/invoices`,
      { headers: authHeaders() },
    );
    return data;
  },

  async getInvoice(id: number): Promise<InvoiceOut> {
    const { data } = await axios.get<InvoiceOut>(
      `${CORE_API_BASE_URL}/invoices/${id}`,
      { headers: authHeaders() },
    );
    return data;
  },
};
