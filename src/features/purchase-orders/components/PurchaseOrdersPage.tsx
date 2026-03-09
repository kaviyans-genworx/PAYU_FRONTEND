import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { FileSpreadsheet, RefreshCw, AlertCircle } from "lucide-react";

export function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PurchaseOrderOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await poService.listPurchaseOrders();
      setOrders(data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail ??
        (err instanceof Error ? err.message : "Failed to load purchase orders");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Purchase Orders
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            View and manage all extracted purchase orders.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders}>
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
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No purchase orders found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {orders.length} purchase order{orders.length > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y bg-muted/50">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      PO #
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                      Total Amount
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Currency
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      PO Date
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((po) => (
                    <tr
                      key={po.id}
                      className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/purchase-orders/${po.id}`)}
                    >
                      <td className="px-4 py-2.5 font-medium">
                        {po.po_number || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {po.total_amount != null
                          ? po.total_amount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5">{po.currency || "—"}</td>
                      <td className="px-4 py-2.5">
                        {po.po_date
                          ? new Date(po.po_date).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {po.created_at
                          ? new Date(po.created_at).toLocaleDateString()
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
