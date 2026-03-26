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

export interface VendorOut {
  id: number;
  vendor_name?: string | null;
  vendor_email?: string | null;
  vendor_phone?: string | null;
  vendor_address?: string | null;
  gst_number?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceOut {
  id: number;
  invoice_number?: string;
  vendor_id?: number;
  vendor?: VendorOut | null;
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
  vendor?: VendorOut | null;
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
  po_references: string[];
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

// ── Validation Group shapes ──────────────────────────────────

export interface ValidationGroupSummary {
  id: number;
  status: string;
  invoice_count: number;
  po_count: number;
  created_at?: string;
}

export interface InvoiceBrief {
  id: number;
  invoice_number?: string;
  vendor_name?: string;
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
}

export interface POBrief {
  id: number;
  po_number?: string;
  vendor_name?: string;
  subtotal?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
}

export interface MergedItem {
  item_code?: string;
  item_description?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
}

export interface ValidationGroupDetail {
  group_id: number;
  status: string;
  created_at?: string;
  invoices: InvoiceBrief[];
  pos: POBrief[];
  merged_invoice_items: MergedItem[];
  merged_po_items: MergedItem[];
}

// ── Validation Results ───────────────────────────────────────

export interface DiscrepancyOut {
  discrepancy_type: string;
  severity: string;
  po_value?: string;
  invoice_value?: string;
  message: string;
  ai_explanation?: string;
}

export interface MappedItemPair {
  link_id: number;
  matched_quantity?: number;

  invoice_item_id: number;
  invoice_item_code?: string;
  invoice_item_description?: string;
  invoice_quantity?: number;
  invoice_unit_price?: number;
  invoice_total_price?: number;

  po_item_id: number;
  po_item_code?: string;
  po_item_description?: string;
  po_quantity?: number;
  po_unit_price?: number;
  po_total_price?: number;
}

export interface MappedItemsOut {
  group_id: number;
  mapped_items: MappedItemPair[];
}

export interface ValidationResultsOut {
  group_id: number;
  validation_status?: string;
  match_status?: string;
  invoices: InvoiceBrief[];
  pos: POBrief[];
  merged_invoice_items: MergedItem[];
  merged_po_items: MergedItem[];
  discrepancies: DiscrepancyOut[];
  mapped_items: MappedItemPair[];
  ai_summary?: string;
  ai_suggestions: string[];
  accepted_for_payment: boolean;
}

export interface DiscrepancyMailDraft {
  group_id: number;
  vendor_name?: string | null;
  to_email: string;
  subject: string;
  body: string;
  invoice_numbers: string[];
  po_numbers: string[];
  discrepancy_count: number;
  attachment_count: number;
}

export interface DiscrepancyMailSendPayload {
  to_email: string;
  subject: string;
  body: string;
}

export interface DiscrepancyMailSendResponse {
  message: string;
  group_id: number;
}

// ── Payment types ────────────────────────────────────────────

export interface AcceptForPaymentResponse {
  message: string;
  group_id: number;
  validation_status: string;
  match_status: string;
  accepted_for_payment: boolean;
}

export interface PaymentSummary {
  group_id: number;
  invoice_numbers: string[];
  po_numbers: string[];
  vendor_name?: string | null;
  total_amount?: number | null;
  validation_status?: string | null;
  match_status?: string | null;
  payment_status?: string | null;
  accepted_at?: string | null;
}

export interface PaymentVendorBrief {
  id: number;
  vendor_name?: string | null;
  vendor_email?: string | null;
  vendor_phone?: string | null;
  vendor_address?: string | null;
  gst_number?: string | null;
}

export interface PaymentDetail {
  group_id: number;
  invoices: InvoiceBrief[];
  pos: POBrief[];
  vendor?: PaymentVendorBrief | null;
  total_amount?: number | null;
  validation_status?: string | null;
  match_status?: string | null;
  payment_status?: string | null;
  accepted_for_payment: boolean;
}

export interface PayNowResponse {
  message: string;
  group_id: number;
  payment_status: string;
}
