import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { FileText, RefreshCw, AlertCircle } from "lucide-react";

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

export function InvoicesPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await invoiceService.listInvoices();
      setInvoices(data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail ??
        (err instanceof Error ? err.message : "Failed to load invoices");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchInvoices();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            View and manage all extracted invoices.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInvoices}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size={32} />
        </div>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No invoices found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {invoices.length} invoice{invoices.length > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y bg-muted/50">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Invoice #
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                      Total Amount
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Currency
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Due Date
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                    >
                      <td className="px-4 py-2.5 font-medium">
                        {inv.invoice_number || "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={statusVariant(inv.status)}>
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {inv.total_amount != null
                          ? inv.total_amount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5">{inv.currency || "—"}</td>
                      <td className="px-4 py-2.5">
                        {inv.due_date
                          ? new Date(inv.due_date).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {inv.created_at
                          ? new Date(inv.created_at).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
