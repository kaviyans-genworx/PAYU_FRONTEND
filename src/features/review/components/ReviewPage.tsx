import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/hooks/useAppStore";
import { resetUpload } from "@/features/upload";
import { reviewService } from "../services/reviewService";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  ArrowLeft,
  Send,
  Plus,
  Trash2,
  FileText,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Eye,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Editable Line Item shape                                          */
/* ------------------------------------------------------------------ */

interface LineItemForm {
  line_number: number;
  item_code: string;
  item_description: string;
  quantity: string;
  unit_price: string;
  total_price: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function ReviewPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { result } = useAppSelector((s) => s.upload);

  /* ── Derived from Redux ────────────────────────────────── */

  const isInvoice = result?.document_type === "invoice";
  const extractedData = (result?.extracted_data ?? {}) as Record<
    string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  >;
  const score = result?.score;
  const fileUrl = result?.file_url;
  const storedRecord = result?.stored_record;

  /* ── Form state ────────────────────────────────────────── */

  const [form, setForm] = useState(() => ({
    invoice_number: String(extractedData.invoice_number ?? ""),
    po_number: String(extractedData.po_number ?? ""),
    reference_po_number: String(extractedData.reference_po_number ?? ""),
    vendor_name: String(extractedData.vendor_name ?? ""),
    vendor_email: String(extractedData.vendor_email ?? ""),
    vendor_phone: String(extractedData.vendor_phone ?? ""),
    vendor_address: String(extractedData.vendor_address ?? ""),
    vendor_tax_id: String(extractedData.vendor_tax_id ?? ""),
    currency: String(extractedData.currency ?? "USD"),
    due_date: String(extractedData.due_date ?? ""),
    po_date: String(extractedData.po_date ?? ""),
    subtotal: String(extractedData.subtotal ?? "0"),
    tax_amount: String(extractedData.tax_amount ?? "0"),
    discount_amount: String(extractedData.discount_amount ?? "0"),
    total_amount: String(extractedData.total_amount ?? "0"),
  }));

  const [lineItems, setLineItems] = useState<LineItemForm[]>(() =>
    ((extractedData.line_items as unknown[]) ?? []).map(
      (raw: unknown, idx: number) => {
        const item = raw as Record<string, unknown>;
        return {
          line_number: Number(item.line_number ?? idx + 1),
          item_code: String(item.item_code ?? ""),
          item_description: String(item.item_description ?? ""),
          quantity: String(item.quantity ?? ""),
          unit_price: String(item.unit_price ?? ""),
          total_price: String(item.total_price ?? ""),
        };
      },
    ),
  );

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /* ── Early return if no data ───────────────────────────── */

  if (!result || !storedRecord) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">
          No extraction data available. Upload a document first.
        </p>
        <Button variant="outline" onClick={() => navigate("/upload")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go to Upload
        </Button>
      </div>
    );
  }

  /* ── Helpers ───────────────────────────────────────────── */

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateLineItem = (
    index: number,
    field: keyof LineItemForm,
    value: string | number,
  ) => {
    setLineItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        line_number: prev.length + 1,
        item_code: "",
        item_description: "",
        quantity: "",
        unit_price: "",
        total_price: "",
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  /* ── Submit ────────────────────────────────────────────── */

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const items = lineItems.map((li) => ({
        line_number: li.line_number,
        item_code: li.item_code || undefined,
        item_description: li.item_description || undefined,
        quantity: li.quantity ? Number(li.quantity) : undefined,
        unit_price: li.unit_price ? Number(li.unit_price) : undefined,
        total_price: li.total_price ? Number(li.total_price) : undefined,
      }));

      if (isInvoice) {
        if (!form.reference_po_number.trim()) {
          setSubmitError("Reference PO Number is required for invoices.");
          setSubmitting(false);
          return;
        }
        await reviewService.submitInvoiceReview(storedRecord.id, {
          invoice_number: form.invoice_number || undefined,
          reference_po_number: form.reference_po_number,
          vendor_name: form.vendor_name || undefined,
          vendor_email: form.vendor_email || undefined,
          vendor_phone: form.vendor_phone || undefined,
          vendor_address: form.vendor_address || undefined,
          vendor_tax_id: form.vendor_tax_id || undefined,
          currency: form.currency || undefined,
          due_date: form.due_date || undefined,
          subtotal: form.subtotal ? Number(form.subtotal) : undefined,
          tax_amount: form.tax_amount ? Number(form.tax_amount) : undefined,
          discount_amount: form.discount_amount
            ? Number(form.discount_amount)
            : undefined,
          total_amount: form.total_amount
            ? Number(form.total_amount)
            : undefined,
          line_items: items,
        });
        dispatch(resetUpload());
        navigate("/invoices");
      } else {
        await reviewService.submitPOReview(storedRecord.id, {
          po_number: form.po_number || undefined,
          vendor_name: form.vendor_name || undefined,
          vendor_email: form.vendor_email || undefined,
          vendor_phone: form.vendor_phone || undefined,
          vendor_address: form.vendor_address || undefined,
          vendor_tax_id: form.vendor_tax_id || undefined,
          currency: form.currency || undefined,
          po_date: form.po_date || undefined,
          subtotal: form.subtotal ? Number(form.subtotal) : undefined,
          tax_amount: form.tax_amount ? Number(form.tax_amount) : undefined,
          discount_amount: form.discount_amount
            ? Number(form.discount_amount)
            : undefined,
          total_amount: form.total_amount
            ? Number(form.total_amount)
            : undefined,
          line_items: items,
        });
        dispatch(resetUpload());
        navigate("/purchase-orders");
      }
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { detail?: string } };
        message?: string;
      };
      setSubmitError(
        axiosErr.response?.data?.detail ??
          axiosErr.message ??
          "Submission failed",
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Determine preview type ────────────────────────────── */

  const isPdf =
    fileUrl?.toLowerCase().includes(".pdf") ??
    false;

  /* ── Render ────────────────────────────────────────────── */

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/upload")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Review {isInvoice ? "Invoice" : "Purchase Order"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Verify the extracted data, make corrections, and submit.
          </p>
        </div>
        {/* Score badge */}
        {score && (
          <div className="flex items-center gap-2">
            <span
              className={`text-lg font-bold ${
                score.requires_review
                  ? "text-amber-600"
                  : "text-emerald-600"
              }`}
            >
              {score.percentage}%
            </span>
            <Badge
              variant={score.requires_review ? "warning" : "success"}
            >
              {score.requires_review ? "Review Required" : "Good Quality"}
            </Badge>
          </div>
        )}
      </div>

      {/* Error banner */}
      {submitError && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">
              Submission Failed
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {submitError}
            </p>
          </div>
        </div>
      )}

      {/* ── Split View ─────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── LEFT: Document Preview ─────────────────────── */}
        <div className="lg:w-3/5 min-w-0">
          <div className="lg:sticky lg:top-4">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Document Preview
                  </CardTitle>
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Open full size
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {fileUrl ? (
                  isPdf ? (
                    <iframe
                      src={fileUrl}
                      className="w-full rounded-lg border"
                      style={{ height: "calc(100vh - 160px)", minHeight: 600 }}
                      title="Document Preview"
                    />
                  ) : (
                    <div
                      className="flex items-center justify-center rounded-lg border bg-muted/30 p-3 overflow-auto"
                      style={{ height: "calc(100vh - 160px)", minHeight: 600 }}
                    >
                      <img
                        src={fileUrl}
                        alt="Document Preview"
                        className="max-w-full h-auto rounded-lg object-contain"
                        style={{ maxHeight: "calc(100vh - 200px)", minHeight: 500 }}
                      />
                    </div>
                  )
                ) : (
                  <div
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 text-muted-foreground"
                    style={{ height: "calc(100vh - 160px)", minHeight: 600 }}
                  >
                    <FileText className="h-12 w-12 mb-3 opacity-40" />
                    <p className="text-sm">No document preview available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── RIGHT: Editable Form ───────────────────────── */}
        <div className="lg:w-2/5 space-y-5 pb-8 min-w-0">
          {/* ─ Document Info ─────────────────────────────── */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                {isInvoice ? (
                  <FileText className="h-4 w-4" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                Document Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isInvoice ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="invoice_number">Invoice Number</Label>
                    <Input
                      id="invoice_number"
                      value={form.invoice_number}
                      onChange={(e) =>
                        updateField("invoice_number", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reference_po_number">
                      Reference PO Number{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="reference_po_number"
                      value={form.reference_po_number}
                      onChange={(e) =>
                        updateField("reference_po_number", e.target.value)
                      }
                      placeholder="Required — links invoice to PO"
                      className={
                        !form.reference_po_number.trim()
                          ? "border-amber-400"
                          : ""
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="currency">Currency</Label>
                      <Input
                        id="currency"
                        value={form.currency}
                        onChange={(e) =>
                          updateField("currency", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="due_date">Due Date</Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={form.due_date}
                        onChange={(e) =>
                          updateField("due_date", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="po_number">PO Number</Label>
                    <Input
                      id="po_number"
                      value={form.po_number}
                      onChange={(e) =>
                        updateField("po_number", e.target.value)
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="currency">Currency</Label>
                      <Input
                        id="currency"
                        value={form.currency}
                        onChange={(e) =>
                          updateField("currency", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="po_date">PO Date</Label>
                      <Input
                        id="po_date"
                        type="date"
                        value={form.po_date}
                        onChange={(e) =>
                          updateField("po_date", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* ─ Vendor Info ───────────────────────────────── */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Vendor Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="vendor_name">Vendor Name</Label>
                <Input
                  id="vendor_name"
                  value={form.vendor_name}
                  onChange={(e) =>
                    updateField("vendor_name", e.target.value)
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="vendor_email">Email</Label>
                  <Input
                    id="vendor_email"
                    type="email"
                    value={form.vendor_email}
                    onChange={(e) =>
                      updateField("vendor_email", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor_phone">Phone</Label>
                  <Input
                    id="vendor_phone"
                    value={form.vendor_phone}
                    onChange={(e) =>
                      updateField("vendor_phone", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor_address">Address</Label>
                <Input
                  id="vendor_address"
                  value={form.vendor_address}
                  onChange={(e) =>
                    updateField("vendor_address", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor_tax_id">Tax / GST ID</Label>
                <Input
                  id="vendor_tax_id"
                  value={form.vendor_tax_id}
                  onChange={(e) =>
                    updateField("vendor_tax_id", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* ─ Line Items (editable table) ───────────────── */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Line Items
                  <span className="ml-2 text-xs font-normal normal-case">
                    ({lineItems.length})
                  </span>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addLineItem}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Row
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y bg-muted/50">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground w-12">
                        #
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground w-24">
                        Code
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                        Description
                      </th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground w-20">
                        Qty
                      </th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground w-24">
                        Unit Price
                      </th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground w-24">
                        Total
                      </th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, idx) => (
                      <tr
                        key={idx}
                        className="border-b last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-3 py-1.5 text-muted-foreground tabular-nums">
                          {item.line_number}
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            value={item.item_code}
                            onChange={(e) =>
                              updateLineItem(idx, "item_code", e.target.value)
                            }
                            className="h-8 text-xs font-mono"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            value={item.item_description}
                            onChange={(e) =>
                              updateLineItem(
                                idx,
                                "item_description",
                                e.target.value,
                              )
                            }
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateLineItem(idx, "quantity", e.target.value)
                            }
                            className="h-8 text-xs text-right"
                            step="any"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) =>
                              updateLineItem(
                                idx,
                                "unit_price",
                                e.target.value,
                              )
                            }
                            className="h-8 text-xs text-right"
                            step="any"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            type="number"
                            value={item.total_price}
                            onChange={(e) =>
                              updateLineItem(
                                idx,
                                "total_price",
                                e.target.value,
                              )
                            }
                            className="h-8 text-xs text-right"
                            step="any"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <button
                            onClick={() => removeLineItem(idx)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="Remove row"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {lineItems.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center py-6 text-sm text-muted-foreground"
                        >
                          No line items. Click "Add Row" to add one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ─ Financial Summary ─────────────────────────── */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="subtotal">Subtotal</Label>
                  <Input
                    id="subtotal"
                    type="number"
                    value={form.subtotal}
                    onChange={(e) =>
                      updateField("subtotal", e.target.value)
                    }
                    step="any"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tax_amount">Tax Amount</Label>
                  <Input
                    id="tax_amount"
                    type="number"
                    value={form.tax_amount}
                    onChange={(e) =>
                      updateField("tax_amount", e.target.value)
                    }
                    step="any"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="discount_amount">Discount</Label>
                  <Input
                    id="discount_amount"
                    type="number"
                    value={form.discount_amount}
                    onChange={(e) =>
                      updateField("discount_amount", e.target.value)
                    }
                    step="any"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="total_amount">
                    Total Amount
                  </Label>
                  <Input
                    id="total_amount"
                    type="number"
                    value={form.total_amount}
                    onChange={(e) =>
                      updateField("total_amount", e.target.value)
                    }
                    step="any"
                    className="font-semibold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─ Score Breakdown (collapsible) ──────────────── */}
          {score?.breakdown && score.breakdown.length > 0 && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Quality Score Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {score.breakdown.map((entry) => (
                    <div
                      key={entry.field}
                      className="flex items-center justify-between px-4 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {entry.actual_score === entry.max_score ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                        )}
                        <span className="text-foreground">
                          {entry.field}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {entry.reason}
                        </span>
                        <span className="text-xs font-medium tabular-nums w-10 text-right">
                          {entry.actual_score}/{entry.max_score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─ Actions ───────────────────────────────────── */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <LoadingSpinner
                    size={16}
                    className="text-primary-foreground"
                  />
                  Submitting…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Review
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/upload")}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
