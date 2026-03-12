import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch } from "@/hooks/useAppStore";
import { addReviewItem } from "@/features/review/slices/reviewSlice";
import { poService } from "../services/poService";
import type { PurchaseOrderOut } from "@/types/documents";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { DocumentViewer } from "@/components/common/DocumentViewer";
import { Badge } from "@/components/ui/badge";
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

export function PODetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [po, setPO] = useState<PurchaseOrderOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    poService
      .getPurchaseOrder(Number(id))
      .then((record) => {
        if (record.status?.toUpperCase() === "PENDING") {
          dispatch(
            addReviewItem({
              document_type: "po",
              extracted_data: {
                po_number: record.po_number,
                currency: record.currency,
                po_date: record.po_date,
                subtotal: record.subtotal,
                tax_amount: record.tax_amount,
                discount_amount: record.discount_amount,
                total_amount: record.total_amount,
                line_items: record.line_items?.map((li, idx) => ({
                  line_number: li.line_number ?? idx + 1,
                  item_code: li.item_code,
                  item_description: li.item_description,
                  quantity: li.quantity,
                  unit_price: li.unit_price,
                  total_price: li.total_price,
                })),
              },
              stored_record: { id: record.id, po_number: record.po_number },
              file_url: record.file_url,
            }),
          );
          setRedirecting(true);
          setLoading(false);
          setTimeout(() => navigate("/review", { replace: true }), 2000);
          return;
        }
        setPO(record);
      })
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { detail?: string } } }).response?.data
            ?.detail ??
          (err instanceof Error
            ? err.message
            : "Failed to load purchase order");
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [id, dispatch, navigate]);

  if (redirecting) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="flex items-center gap-3 rounded-lg border border-amber-400/50 bg-amber-50 dark:bg-amber-950/30 px-6 py-4">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
              This purchase order is pending review
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">
              Redirecting to the review page…
            </p>
          </div>
        </div>
        <LoadingSpinner size={24} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/purchase-orders")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Purchase Orders
        </Button>
        <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">
            {error || "Purchase order not found."}
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
          onClick={() => navigate("/purchase-orders")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            PO {po.po_number || `#${po.id}`}
          </h1>
        </div>
        <Badge variant={statusVariant(po.status)}>{po.status}</Badge>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Document preview */}
        <div className="lg:w-3/5 min-w-0">
          <div className="lg:sticky lg:top-4 h-[calc(100vh-10rem)] min-h-[400px] border rounded-xl shadow-sm overflow-hidden bg-background">
            <DocumentViewer
              fileUrl={po.file_url ?? null}
              title={`PO ${po.po_number || "Document"}`}
            />
          </div>
        </div>

        {/* Right: PO details */}
        <div className="lg:w-2/5 space-y-5 min-w-0">
          {/* PO Info */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                PO Info
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <InfoRow label="PO Number" value={po.po_number} />
              <InfoRow label="Currency" value={po.currency} />
              <InfoRow
                label="PO Date"
                value={
                  po.po_date
                    ? new Date(po.po_date).toLocaleDateString()
                    : undefined
                }
              />
              <InfoRow
                label="Created"
                value={
                  po.created_at
                    ? new Date(po.created_at).toLocaleString()
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
                value={formatCurrency(po.subtotal)}
              />
              <InfoRow
                label="Tax Amount"
                value={formatCurrency(po.tax_amount)}
              />
              <InfoRow
                label="Discount"
                value={formatCurrency(po.discount_amount)}
              />
              <InfoRow
                label="Total Amount"
                value={
                  <span className="font-semibold">
                    {formatCurrency(po.total_amount)}
                  </span>
                }
              />
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Ordered Items
                <span className="ml-2 text-xs font-normal normal-case">
                  ({po.line_items?.length ?? 0})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {po.line_items && po.line_items.length > 0 ? (
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
                      {po.line_items.map((item, idx) => (
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
