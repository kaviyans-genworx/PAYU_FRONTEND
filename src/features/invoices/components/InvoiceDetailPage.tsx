import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch } from "@/hooks/useAppStore";
import { addReviewItem } from "@/features/review/slices/reviewSlice";
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
import {
  ArrowLeft,
  FileText,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%] truncate">
        {value ?? "—"}
      </span>
    </div>
  );
}

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

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
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
        if (inv.status?.toUpperCase() === "PENDING") {
          dispatch(
            addReviewItem({
              document_type: "invoice",
              extracted_data: {
                invoice_number: inv.invoice_number,
                currency: inv.currency,
                due_date: inv.due_date,
                subtotal: inv.subtotal,
                tax_amount: inv.tax_amount,
                discount_amount: inv.discount_amount,
                total_amount: inv.total_amount,
                line_items: inv.line_items?.map((li, idx) => ({
                  line_number: li.line_number ?? idx + 1,
                  item_code: li.item_code,
                  item_description: li.item_description,
                  quantity: li.quantity,
                  unit_price: li.unit_price,
                  total_price: li.total_price,
                })),
              },
              stored_record: { id: inv.id, invoice_number: inv.invoice_number },
              file_url: inv.file_url,
            }),
          );
          navigate("/review", { replace: true });
          return;
        }
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
  }, [id, dispatch, navigate]);

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
          onClick={() => navigate("/invoices")}
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
          {invoice.file_url ? (
            <Card className="border shadow-sm lg:sticky lg:top-4">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Document
                  </CardTitle>
                  <a
                    href={invoice.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    Open <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardHeader>
              <CardContent>
                {invoice.file_url.toLowerCase().includes(".pdf") ? (
                  <iframe
                    src={invoice.file_url}
                    className="w-full rounded-lg border"
                    style={{ height: "calc(100vh - 160px)", minHeight: 600 }}
                    title="Invoice Document"
                  />
                ) : (
                  <div className="flex items-center justify-center rounded-lg border bg-muted/30 p-3 overflow-auto" style={{ height: "calc(100vh - 120px)", minHeight: 750 }}>
                    <img
                      src={invoice.file_url}
                      alt="Invoice Document"
                      className="max-w-full h-auto rounded-lg object-contain"
                      style={{ maxHeight: "calc(100vh + 300px)", minHeight: 750 }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <FileText className="h-12 w-12 opacity-40 mb-3" />
                <p className="text-sm">No document attached</p>
              </CardContent>
            </Card>
          )}
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
