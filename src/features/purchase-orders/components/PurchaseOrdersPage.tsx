import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { poService } from "../services/poService";
import type { PurchaseOrderOut } from "@/types/documents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Pagination } from "@/components/common/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { FileSpreadsheet, RefreshCw, AlertCircle, Search, Upload } from "lucide-react";

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

type SortField = "date" | "amount" | "vendor";
type SortDir = "asc" | "desc";

export function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<PurchaseOrderOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search, filter, sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const uniqueStatuses = useMemo(
    () => Array.from(new Set(orders.map((o) => o.status))).sort(),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    let list = orders;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((po) =>
        (po.po_number ?? "").toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((po) => po.status === statusFilter);
    }

    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "date":
          cmp =
            new Date(a.created_at ?? 0).getTime() -
            new Date(b.created_at ?? 0).getTime();
          break;
        case "amount":
          cmp = (a.total_amount ?? 0) - (b.total_amount ?? 0);
          break;
        case "vendor":
          cmp = (a.vendor_id ?? 0) - (b.vendor_id ?? 0);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [orders, searchQuery, statusFilter, sortField, sortDir]);

  const {
    currentPage,
    totalPages,
    paginatedItems,
    totalItems,
    startIndex,
    endIndex,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    goToPage,
  } = usePagination(filteredOrders, 10);

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

  useEffect(() => {
    const message = (location.state as { successMessage?: string } | null)
      ?.successMessage;
    if (!message) {
      return;
    }

    setSuccessMessage(message);
    navigate(location.pathname, { replace: true });
  }, [location.pathname, location.state, navigate]);

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

      {/* Search, Filter, Sort controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by PO number…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          {uniqueStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={`${sortField}-${sortDir}`}
          onChange={(e) => {
            const [f, d] = e.target.value.split("-") as [SortField, SortDir];
            setSortField(f);
            setSortDir(d);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Sort by"
        >
          <option value="date-desc">Date (Newest)</option>
          <option value="date-asc">Date (Oldest)</option>
          <option value="amount-desc">Amount (High-Low)</option>
          <option value="amount-asc">Amount (Low-High)</option>
          <option value="vendor-asc">Vendor (A-Z)</option>
          <option value="vendor-desc">Vendor (Z-A)</option>
        </select>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-emerald-500/40 bg-emerald-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-800">
                Success
              </p>
              <p className="text-sm text-emerald-700 mt-0.5">
                {successMessage}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSuccessMessage(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size={32} />
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-lg font-medium">No purchase orders yet</p>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Upload a purchase order document to get started with extraction and processing.
            </p>
            <Button className="mt-2 gap-2" onClick={() => navigate("/upload")}>
              <Upload className="h-4 w-4" />
              Upload Purchase Order
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Showing {startIndex + 1}–{endIndex} of {totalItems} purchase
              order{totalItems > 1 ? "s" : ""}
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
                      PO Date
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((po) => (
                    <tr
                      key={po.id}
                      role="button"
                      tabIndex={0}
                      className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          if (po.status === "PENDING") {
                            navigate(`/review?poId=${po.id}`);
                          } else {
                            navigate(`/purchase-orders/${po.id}`);
                          }
                        }
                      }}
                      onClick={() => {
                        if (po.status === "PENDING") {
                          navigate(`/review?poId=${po.id}`);
                        } else {
                          navigate(`/purchase-orders/${po.id}`);
                        }
                      }}
                    >
                      <td className="px-4 py-2.5 font-medium">
                        {po.po_number || "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={statusVariant(po.status)}>
                          {po.status}
                        </Badge>
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
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              startIndex={startIndex}
              endIndex={endIndex}
              hasNextPage={hasNextPage}
              hasPrevPage={hasPrevPage}
              onNextPage={nextPage}
              onPrevPage={prevPage}
              onGoToPage={goToPage}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
