/* ──────────────────────────────────────────────────────────────
 * Shared types for Invoice, PO, and Review features.
 * ────────────────────────────────────────────────────────────── */

// ── Line-item shapes ─────────────────────────────────────────

export interface LineItem {
  line_number?: number;
  item_code?: string;
  item_description?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
}

// ── Score ────────────────────────────────────────────────────

export interface ScoreBreakdownEntry {
  field: string;
  max_score: number;
  actual_score: number;
  reason: string;
}

export interface ExtractionScore {
  total_score: number;
  max_possible: number;
  percentage: number;
  requires_review: boolean;
  breakdown: ScoreBreakdownEntry[];
}

// ── Invoice Out (from GET /invoices) ─────────────────────────

export interface InvoiceItemOut {
  id: number;
  invoice_id: number;
  line_number?: number;
  item_code?: string;
  item_description?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  created_at?: string;
}

export interface InvoiceOut {
  id: number;
  invoice_number?: string;
  vendor_id?: number;
  currency?: string;
  due_date?: string;
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  status: string;
  file_url?: string;
  created_at?: string;
  updated_at?: string;
  line_items: InvoiceItemOut[];
}

// ── PO Out (from GET /purchase-orders) ───────────────────────

export interface OrderedItemOut {
  id: number;
  po_id: number;
  line_number?: number;
  item_code?: string;
  item_description?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  created_at?: string;
}

export interface PurchaseOrderOut {
  id: number;
  po_number?: string;
  vendor_id: number;
  currency?: string;
  po_date?: string;
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  status: string;
  file_url?: string;
  created_at?: string;
  updated_at?: string;
  line_items: OrderedItemOut[];
}

// ── Review submission payloads ───────────────────────────────

export interface SubmitPOReviewPayload {
  po_number?: string;
  vendor_name?: string;
  vendor_email?: string;
  vendor_phone?: string;
  vendor_address?: string;
  vendor_tax_id?: string;
  currency?: string;
  po_date?: string;
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  line_items: LineItem[];
}

export interface SubmitInvoiceReviewPayload {
  invoice_number?: string;
  reference_po_number: string;
  vendor_name?: string;
  vendor_email?: string;
  vendor_phone?: string;
  vendor_address?: string;
  vendor_tax_id?: string;
  currency?: string;
  due_date?: string;
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  line_items: LineItem[];
}

// ── Search result shapes ─────────────────────────────────────

export interface VendorSearchResult {
  id: number;
  vendor_name: string | null;
  vendor_email: string | null;
  vendor_phone: string | null;
  vendor_address: string | null;
  gst_number: string | null;
}

export interface POSearchResult {
  id: number;
  po_number: string;
  vendor_id: number;
  status: string;
  total_amount: number | null;
  vendor: VendorSearchResult | null;
}
