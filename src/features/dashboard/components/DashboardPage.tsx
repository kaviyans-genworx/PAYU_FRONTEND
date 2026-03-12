import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  dashboardService,
  type DashboardData,
} from "../services/dashboardService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  FileText,
  FileSpreadsheet,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Clock,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

/* ─── Helpers ──────────────────────────────────────────────── */

function fmtNum(val?: number | null): string {
  if (val == null) return "—";
  return val.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function validationBucket(
  status: string,
): "passed" | "failed" | "partial" {
  switch (status.toLowerCase()) {
    case "passed":
    case "validated":
    case "matched":
      return "passed";
    case "failed":
    case "error":
    case "mismatched":
      return "failed";
    default:
      return "partial";
  }
}

/* ─── Stat Card ────────────────────────────────────────────── */

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
  onClick,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
}) {
  return (
    <Card
      className={`border shadow-sm ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription className="text-sm font-medium">
          {title}
        </CardDescription>
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

/* ─── Mini Bar Chart (CSS-only) ────────────────────────────── */

function MiniBarChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-3 h-32">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-semibold tabular-nums">{d.value}</span>
          <div
            className={`w-full rounded-t-md ${d.color} transition-all duration-500`}
            style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? "4px" : "0" }}
          />
          <span className="text-[10px] text-muted-foreground text-center leading-tight mt-1">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Mini Pie (CSS conic-gradient) ────────────────────────── */

function MiniPie({
  data,
}: {
  data: { label: string; value: number; color: string; textColor: string }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        No data
      </div>
    );
  }

  // Build conic gradient stops
  let cumulative = 0;
  const stops = data
    .map((d) => {
      const start = cumulative;
      const end = cumulative + (d.value / total) * 100;
      cumulative = end;
      return `${d.color} ${start.toFixed(1)}% ${end.toFixed(1)}%`;
    })
    .join(", ");

  return (
    <div className="flex items-center gap-6">
      <div
        className="h-28 w-28 rounded-full shrink-0"
        style={{ background: `conic-gradient(${stops})` }}
      />
      <div className="space-y-1.5">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-muted-foreground">{d.label}</span>
            <span className="font-semibold ml-auto tabular-nums">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Dashboard ───────────────────────────────────────── */

export function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardService.fetchAll();
      setData(result);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail ??
        (err instanceof Error ? err.message : "Failed to load dashboard data");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  // Computed analytics
  const analytics = useMemo(() => {
    if (!data) return null;

    const { invoices, purchaseOrders, validationGroups } = data;

    // Validation buckets
    const validationPassed = validationGroups.filter(
      (g) => validationBucket(g.status) === "passed",
    ).length;
    const validationFailed = validationGroups.filter(
      (g) => validationBucket(g.status) === "failed",
    ).length;
    const validationPartial = validationGroups.filter(
      (g) => validationBucket(g.status) === "partial",
    ).length;

    // Invoices awaiting validation (PENDING / REVIEW_REQUIRED)
    const invoicesAwaiting = invoices.filter((inv) =>
      ["PENDING", "REVIEW_REQUIRED"].includes(inv.status.toUpperCase()),
    );

    // Invoices without PO mapping (vendor_id missing or invoice status not MATCHED)
    const invoicesUnmapped = invoices.filter(
      (inv) => !inv.vendor_id && inv.status.toUpperCase() !== "MATCHED",
    );

    // POs not yet invoiced — simplified heuristic: POs with no matching invoice vendor_id
    const invoiceVendorIds = new Set(
      invoices.map((inv) => inv.vendor_id).filter(Boolean),
    );
    const posNotInvoiced = purchaseOrders.filter(
      (po) => !invoiceVendorIds.has(po.vendor_id),
    );

    // Overdue POs: po_date < today and not linked to any invoice
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overduePOs = purchaseOrders.filter((po) => {
      if (!po.po_date) return false;
      const poDate = new Date(po.po_date);
      return poDate < today && !invoiceVendorIds.has(po.vendor_id);
    });

    // Recent validation groups (last 5)
    const recentValidations = [...validationGroups]
      .sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime(),
      )
      .slice(0, 5);

    return {
      totalInvoices: invoices.length,
      totalPOs: purchaseOrders.length,
      totalValidations: validationGroups.length,
      validationPassed,
      validationFailed,
      validationPartial,
      invoicesAwaiting,
      invoicesUnmapped,
      posNotInvoiced,
      overduePOs,
      recentValidations,
    };
  }, [data]);

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
        <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Retry
        </Button>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your accounts payable processing pipeline.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* === Row 1: Document Counts === */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Invoices"
          value={analytics.totalInvoices}
          description="Invoices processed"
          icon={FileText}
          color="text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40"
          onClick={() => navigate("/invoices")}
        />
        <StatCard
          title="Total Purchase Orders"
          value={analytics.totalPOs}
          description="Purchase orders processed"
          icon={FileSpreadsheet}
          color="text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/40"
          onClick={() => navigate("/purchase-orders")}
        />
        <StatCard
          title="Total Validation Groups"
          value={analytics.totalValidations}
          description="Validation groups created"
          icon={ShieldCheck}
          color="text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/40"
          onClick={() => navigate("/validation")}
        />
      </div>

      {/* === Row 2: Validation Charts === */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pie Chart */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Validation Status Overview</CardTitle>
            <CardDescription>
              Distribution of validation results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MiniPie
              data={[
                {
                  label: "Passed",
                  value: analytics.validationPassed,
                  color: "#10b981",
                  textColor: "text-emerald-600",
                },
                {
                  label: "Failed",
                  value: analytics.validationFailed,
                  color: "#ef4444",
                  textColor: "text-red-600",
                },
                {
                  label: "Partial",
                  value: analytics.validationPartial,
                  color: "#f59e0b",
                  textColor: "text-amber-600",
                },
              ]}
            />
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Validation Metrics</CardTitle>
            <CardDescription>
              Successful vs failed vs partial validations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MiniBarChart
              data={[
                {
                  label: "Passed",
                  value: analytics.validationPassed,
                  color: "bg-emerald-500",
                },
                {
                  label: "Failed",
                  value: analytics.validationFailed,
                  color: "bg-red-500",
                },
                {
                  label: "Partial",
                  value: analytics.validationPartial,
                  color: "bg-amber-500",
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {/* === Row 3: Processing Insights === */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Awaiting Validation"
          value={analytics.invoicesAwaiting.length}
          description="Invoices pending review"
          icon={Clock}
          color="text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40"
        />
        <StatCard
          title="Unmapped Invoices"
          value={analytics.invoicesUnmapped.length}
          description="Without PO mapping"
          icon={AlertTriangle}
          color="text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/40"
        />
        <StatCard
          title="POs Not Invoiced"
          value={analytics.posNotInvoiced.length}
          description="No linked invoice"
          icon={FileSpreadsheet}
          color="text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-950/40"
        />
        <StatCard
          title="Overdue POs"
          value={analytics.overduePOs.length}
          description="Past due date, no invoice"
          icon={AlertCircle}
          color="text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/40"
        />
      </div>

      {/* === Row 4: Overdue PO Alerts === */}
      {analytics.overduePOs.length > 0 && (
        <Card className="border shadow-sm border-red-200 dark:border-red-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Overdue PO Alerts
            </CardTitle>
            <CardDescription>
              Purchase orders past their due date with no linked invoice
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y bg-red-50/50 dark:bg-red-950/20">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      PO #
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Vendor
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Due Date
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.overduePOs.slice(0, 10).map((po) => (
                    <tr
                      key={po.id}
                      role="button"
                      tabIndex={0}
                      className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/purchase-orders/${po.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/purchase-orders/${po.id}`);
                        }
                      }}
                    >
                      <td className="px-4 py-2.5 font-medium">
                        {po.po_number || "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        Vendor #{po.vendor_id}
                      </td>
                      <td className="px-4 py-2.5 text-red-600 dark:text-red-400">
                        {po.po_date
                          ? new Date(po.po_date).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {fmtNum(po.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* === Row 5: Recent Validation Activity === */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Validation Activity</CardTitle>
              <CardDescription>
                Latest validation groups
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/validation")}
            >
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {analytics.recentValidations.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
              No validation activity yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y bg-muted/50">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Group
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">
                      Invoices
                    </th>
                    <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">
                      POs
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentValidations.map((g) => {
                    const bucket = validationBucket(g.status);
                    const badgeVariant =
                      bucket === "passed"
                        ? "success"
                        : bucket === "failed"
                          ? "destructive"
                          : "warning";
                    return (
                      <tr
                        key={g.id}
                        role="button"
                        tabIndex={0}
                        className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => navigate(`/validation/${g.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigate(`/validation/${g.id}`);
                          }
                        }}
                      >
                        <td className="px-4 py-2.5 font-medium">
                          #{g.id}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant={badgeVariant as "success" | "destructive" | "warning"}>
                            {g.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {g.invoice_count}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {g.po_count}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {g.created_at
                            ? new Date(g.created_at).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
