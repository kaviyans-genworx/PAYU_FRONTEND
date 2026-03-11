import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { validationService } from "../services/validationService";
import type { ValidationGroupDetail } from "@/types/documents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ArrowLeft, AlertCircle, FileText, FileSpreadsheet } from "lucide-react";

function statusVariant(
  status: string,
): "success" | "warning" | "destructive" | "secondary" {
  switch (status.toLowerCase()) {
    case "validated":
    case "matched":
      return "success";
    case "pending":
      return "warning";
    case "failed":
    case "mismatched":
      return "destructive";
    default:
      return "secondary";
  }
}

export function ValidationGroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ValidationGroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) return;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await validationService.getGroupDetail(Number(groupId));
        setDetail(data);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { detail?: string } } }).response?.data
            ?.detail ??
          (err instanceof Error ? err.message : "Failed to load group detail");
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    void fetchDetail();
  }, [groupId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/validation")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  if (!detail) return null;

  const maxRows = Math.max(
    detail.merged_invoice_items.length,
    detail.merged_po_items.length,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/validation")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Validation Group {detail.group_id}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={statusVariant(detail.status)}>{detail.status}</Badge>
            {detail.created_at && (
              <span className="text-xs text-muted-foreground">
                Created {new Date(detail.created_at).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Section 1 & 2 — Invoices and POs side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Invoices */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Invoices ({detail.invoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y bg-muted/50">
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                      Invoice #
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                      Vendor
                    </th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detail.invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-medium">
                        {inv.invoice_number ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {inv.vendor_name ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {inv.total_amount != null
                          ? inv.total_amount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                  {detail.invoices.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                        No invoices in this group.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Orders */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="h-4 w-4" />
              Purchase Orders ({detail.pos.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y bg-muted/50">
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                      PO #
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                      Vendor
                    </th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detail.pos.map((po) => (
                    <tr
                      key={po.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-medium">
                        {po.po_number ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {po.vendor_name ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {po.total_amount != null
                          ? po.total_amount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                  {detail.pos.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                        No purchase orders linked.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 3 — Item Comparison */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Item Comparison</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y bg-muted/50">
                  {/* Invoice items header */}
                  <th
                    colSpan={4}
                    className="text-center px-4 py-2 font-semibold text-foreground border-r"
                  >
                    Merged Invoice Items
                  </th>
                  {/* PO items header */}
                  <th
                    colSpan={4}
                    className="text-center px-4 py-2 font-semibold text-foreground"
                  >
                    Merged PO Items
                  </th>
                </tr>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                    Item
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">
                    Qty
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">
                    Unit Price
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground border-r">
                    Total
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                    Item
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
                {maxRows === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-6 text-center text-muted-foreground"
                    >
                      No line items to compare.
                    </td>
                  </tr>
                ) : (
                  Array.from({ length: maxRows }).map((_, i) => {
                    const inv = detail.merged_invoice_items[i];
                    const po = detail.merged_po_items[i];

                    // Highlight qty mismatch when both rows exist and share the same item_code
                    const qtyMismatch =
                      inv &&
                      po &&
                      inv.item_code === po.item_code &&
                      inv.quantity !== po.quantity;

                    const totalMismatch =
                      inv &&
                      po &&
                      inv.item_code === po.item_code &&
                      inv.total_price !== po.total_price;

                    return (
                      <tr
                        key={i}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        {/* Invoice side */}
                        <td className="px-4 py-2.5">
                          {inv
                            ? inv.item_description || inv.item_code || "—"
                            : ""}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right font-mono ${
                            qtyMismatch ? "text-amber-600 font-semibold" : ""
                          }`}
                        >
                          {inv ? inv.quantity ?? "—" : ""}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono">
                          {inv ? inv.unit_price ?? "—" : ""}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right font-mono border-r ${
                            totalMismatch
                              ? "text-amber-600 font-semibold"
                              : ""
                          }`}
                        >
                          {inv ? inv.total_price ?? "—" : ""}
                        </td>

                        {/* PO side */}
                        <td className="px-4 py-2.5">
                          {po
                            ? po.item_description || po.item_code || "—"
                            : ""}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right font-mono ${
                            qtyMismatch ? "text-amber-600 font-semibold" : ""
                          }`}
                        >
                          {po ? po.quantity ?? "—" : ""}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono">
                          {po ? po.unit_price ?? "—" : ""}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right font-mono ${
                            totalMismatch
                              ? "text-amber-600 font-semibold"
                              : ""
                          }`}
                        >
                          {po ? po.total_price ?? "—" : ""}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
