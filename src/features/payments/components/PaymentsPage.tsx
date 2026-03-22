import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { paymentService } from "../services/paymentService";
import type { PaymentSummary } from "@/types/documents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Pagination } from "@/components/common/Pagination";
import { usePagination } from "@/hooks/usePagination";
import {
  AlertCircle,
  CreditCard,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
} from "lucide-react";

function fmtNum(val?: number | null): string {
  if (val == null) return "—";
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function paymentStatusBadge(status?: string | null) {
  if (!status || status === "PENDING") {
    return { variant: "warning" as const, label: "PENDING", icon: Clock };
  }
  if (status === "COMPLETED") {
    return { variant: "success" as const, label: "COMPLETED", icon: CheckCircle2 };
  }
  return { variant: "secondary" as const, label: status, icon: Clock };
}

export function PaymentsPage() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PaymentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search, filter, sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"date" | "amount" | "vendor">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Derive unique statuses for filter dropdown
  const uniqueStatuses = useMemo(
    () => Array.from(new Set(payments.map((p) => p.payment_status || "PENDING"))).sort(),
    [payments],
  );

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await paymentService.listPayments();
      setPayments(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Filtered & sorted payments
  const filteredPayments = useMemo(() => {
    let list = payments;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.invoice_numbers.some((n) => n.toLowerCase().includes(q)) ||
          p.po_numbers.some((n) => n.toLowerCase().includes(q)) ||
          (p.vendor_name && p.vendor_name.toLowerCase().includes(q)) ||
          String(p.group_id).includes(q)
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((p) => (p.payment_status || "PENDING") === statusFilter);
    }

    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "date":
          cmp =
            new Date(a.accepted_at ?? 0).getTime() -
            new Date(b.accepted_at ?? 0).getTime();
          break;
        case "amount":
          cmp = (a.total_amount ?? 0) - (b.total_amount ?? 0);
          break;
        case "vendor":
          cmp = String(a.vendor_name ?? "").localeCompare(
            String(b.vendor_name ?? "")
          );
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [payments, searchQuery, statusFilter, sortField, sortDir]);

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
  } = usePagination(filteredPayments, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            All accepted PO–Invoice pairs ready for payment
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPayments}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Search, Filter, Sort controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice, PO, or vendor…"
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
            const [f, d] = e.target.value.split("-") as ["date" | "amount" | "vendor", "asc" | "desc"];
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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardContent className="py-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
            <p className="text-2xl font-bold mt-1">{payments.length}</p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="py-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">
              {payments.filter((p) => !p.payment_status || p.payment_status === "PENDING").length}
            </p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="py-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Completed</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">
              {payments.filter((p) => p.payment_status === "COMPLETED").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments list */}
      {filteredPayments.length === 0 ? (
        <Card className="border shadow-sm bg-white dark:bg-card">
          <CardContent className="py-12 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {payments.length === 0
                ? "No payments yet. Accept validation groups to see them here."
                : "No payments match your search."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border shadow-sm bg-white dark:bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Showing {startIndex + 1}–{endIndex} of {totalItems} payment
              {totalItems > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y bg-muted/50">
                    <th className="text-left px-5 py-3 font-semibold text-foreground">Group</th>
                    <th className="text-left px-5 py-3 font-semibold text-foreground">Invoices</th>
                    <th className="text-left px-5 py-3 font-semibold text-foreground">Purchase Orders</th>
                    <th className="text-left px-5 py-3 font-semibold text-foreground">Vendor</th>
                    <th className="text-right px-5 py-3 font-semibold text-foreground">Amount</th>
                    <th className="text-center px-5 py-3 font-semibold text-foreground">Match</th>
                    <th className="text-center px-5 py-3 font-semibold text-foreground">Payment</th>
                    <th className="text-center px-5 py-3 font-semibold text-foreground w-[100px]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((p) => {
                    const ps = paymentStatusBadge(p.payment_status);
                    const PsIcon = ps.icon;
                    return (
                      <tr
                        key={p.group_id}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/payments/${p.group_id}`)}
                      >
                        <td className="px-5 py-3.5 font-semibold">#{p.group_id}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            <span className="truncate max-w-[150px]">
                              {p.invoice_numbers.join(", ") || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate max-w-[150px]">
                              {p.po_numbers.join(", ") || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">
                          {p.vendor_name || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-semibold">
                          {fmtNum(p.total_amount)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <Badge
                            variant={
                              p.match_status?.toUpperCase() === "MISMATCH" ||
                              p.match_status?.toUpperCase() === "NO_MATCH"
                                ? "destructive"
                                : "success"
                            }
                            className="text-xs"
                          >
                            {p.match_status?.replace(/_/g, " ") || "—"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <Badge variant={ps.variant} className="text-xs gap-1">
                            <PsIcon className="h-3 w-3" />
                            {ps.label}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <Button
                            size="sm"
                            variant={p.payment_status === "COMPLETED" ? "ghost" : "default"}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/payments/${p.group_id}`);
                            }}
                          >
                            {p.payment_status === "COMPLETED" ? "View" : "Pay"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
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
