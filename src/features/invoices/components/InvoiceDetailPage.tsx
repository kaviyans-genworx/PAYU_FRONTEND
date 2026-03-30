import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { invoiceService } from "../services/invoiceService";
import type { InvoiceOut } from "@/types/documents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { DocumentViewer } from "@/components/common/DocumentViewer";
import {
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { InfoRow } from "@/components/common/InfoRow";
import { formatCurrency } from "@/utils/formatCurrency";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function statusVariant(
  status: string,
): "success" | "warning" | "destructive" | "secondary" {
  switch (status.toUpperCase()) {
    case "EXTRACTED":
    case "MATCHED":
      return "success";
    case "REVIEW_REQUIRED":
    case "PENDING":
      return "warning";
    case "REJECTED":
      return "destructive";
    default:
      return "secondary";
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<InvoiceOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    invoiceService
      .getInvoice(Number(id))
      .then((inv) => {
        setInvoice(inv);
      })
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { detail?: string } } }).response?.data
            ?.detail ??
          (err instanceof Error ? err.message : "Failed to load invoice");
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/invoices")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Invoices
        </Button>
        <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">
            {error || "Invoice not found."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (window.history.length > 2) {
              navigate(-1);
            } else {
              navigate("/invoices");
            }
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Invoice {invoice.invoice_number || `#${invoice.id}`}
          </h1>
        </div>
        <Badge variant={statusVariant(invoice.status)}>{invoice.status}</Badge>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Document preview */}
        <div className="lg:w-3/5 min-w-0">
          <div className="lg:sticky lg:top-4 h-[calc(100vh-10rem)] min-h-[400px] border rounded-xl shadow-sm overflow-hidden bg-background">
            <DocumentViewer
              fileUrl={invoice.file_url ?? null}
              title={`Invoice ${invoice.invoice_number || "Document"}`}
            />
          </div>
        </div>

        {/* Right: Invoice details */}
        <div className="lg:w-2/5 space-y-5 min-w-0">
          {/* Invoice Info */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Invoice Info
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <InfoRow label="Invoice Number" value={invoice.invoice_number} />
              <InfoRow label="Status" value={invoice.status} />
              <InfoRow label="Vendor ID" value={invoice.vendor_id} />
              <InfoRow label="Currency" value={invoice.currency} />
              <InfoRow
                label="Due Date"
                value={
                  invoice.due_date
                    ? new Date(invoice.due_date).toLocaleDateString()
                    : undefined
                }
              />
              <InfoRow
                label="Created"
                value={
                  invoice.created_at
                    ? new Date(invoice.created_at).toLocaleString()
                    : undefined
                }
              />
              <InfoRow
                label="Updated"
                value={
                  invoice.updated_at
                    ? new Date(invoice.updated_at).toLocaleString()
                    : undefined
                }
              />
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Vendor Details
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <InfoRow label="Vendor Name" value={invoice.vendor?.vendor_name} />
              <InfoRow label="Email" value={invoice.vendor?.vendor_email} />
              <InfoRow label="Phone" value={invoice.vendor?.vendor_phone} />
              <InfoRow label="Address" value={invoice.vendor?.vendor_address} />
              <InfoRow label="Tax / GST ID" value={invoice.vendor?.gst_number} />
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <InfoRow
                label="Subtotal"
                value={formatCurrency(invoice.subtotal)}
              />
              <InfoRow
                label="Tax Amount"
                value={formatCurrency(invoice.tax_amount)}
              />
              <InfoRow
                label="Discount"
                value={formatCurrency(invoice.discount_amount)}
              />
              <InfoRow
                label="Total Amount"
                value={
                  <span className="font-semibold">
                    {formatCurrency(invoice.total_amount)}
                  </span>
                }
              />
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Line Items
                <span className="ml-2 text-xs font-normal normal-case">
                  ({invoice.line_items?.length ?? 0})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {invoice.line_items && invoice.line_items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y bg-muted/50">
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground w-12">
                          #
                        </th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                          Code
                        </th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                          Description
                        </th>
                        <th className="text-right px-4 py-2 font-medium text-muted-foreground">
                          Qty
                        </th>
                        <th className="text-right px-4 py-2 font-medium text-muted-foreground">
                          Unit Price
                        </th>
                        <th className="text-right px-4 py-2 font-medium text-muted-foreground">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.line_items.map((item, idx) => (
                        <tr
                          key={item.id ?? idx}
                          className="border-b last:border-0"
                        >
                          <td className="px-4 py-2 text-muted-foreground tabular-nums">
                            {item.line_number ?? idx + 1}
                          </td>
                          <td className="px-4 py-2 font-mono text-xs">
                            {item.item_code || "—"}
                          </td>
                          <td className="px-4 py-2">
                            {item.item_description || "—"}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums">
                            {item.quantity ?? "—"}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums">
                            {formatCurrency(item.unit_price)}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums font-medium">
                            {formatCurrency(item.total_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-6">
                  No line items.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
