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
  AlertCircle,
  Clock,
  RefreshCw,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

/* ─── Helpers ──────────────────────────────────────────────── */

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
  iconBg,
  onClick,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  color: string;
  iconBg: string;
  onClick?: () => void;
}) {
  return (
    <Card
      className={`rounded-2xl shadow-md border-0 transition-all duration-200 ${
        onClick
          ? "cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
          : ""
      }`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground tracking-wide">
              {title}
            </p>
            <p className={`text-4xl font-extrabold tracking-tight ${color}`}>
              {value}
            </p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className={`rounded-xl p-3 ${iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
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

    const validationPassed = validationGroups.filter(
      (g) => validationBucket(g.status) === "passed",
    ).length;
    const validationFailed = validationGroups.filter(
      (g) => validationBucket(g.status) === "failed",
    ).length;
    const validationPartial = validationGroups.filter(
      (g) => validationBucket(g.status) === "partial",
    ).length;

    const invoicesAwaiting = invoices.filter((inv) =>
      ["PENDING", "REVIEW_REQUIRED"].includes(inv.status.toUpperCase()),
    );

    const invoiceVendorIds = new Set(
      invoices.map((inv) => inv.vendor_id).filter(Boolean),
    );
    const posNotInvoiced = purchaseOrders.filter(
      (po) => !invoiceVendorIds.has(po.vendor_id),
    );

    const recentValidations = [...validationGroups]
      .sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime(),
      )
      .slice(0, 8);

    return {
      totalInvoices: invoices.length,
      totalPOs: purchaseOrders.length,
      totalValidations: validationGroups.length,
      validationPassed,
      validationFailed,
      validationPartial,
      invoicesAwaiting,
      posNotInvoiced,
      recentValidations,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size={36} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 max-w-lg mx-auto py-16">
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 shadow-sm">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="rounded-xl">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!analytics) return null;

  /* ─── Pie Chart ─── */
  const totalValidationItems =
    analytics.validationPassed + analytics.validationFailed + analytics.validationPartial;
  const hasPieData = totalValidationItems > 0;

  const pieData = {
    labels: ["Passed", "Failed", "Partial"],
    datasets: [
      {
        data: [
          analytics.validationPassed,
          analytics.validationFailed,
          analytics.validationPartial,
        ],
        backgroundColor: ["#059669", "#dc2626", "#d97706"],
        hoverBackgroundColor: ["#047857", "#b91c1c", "#b45309"],
        borderWidth: 3,
        borderColor: "#ffffff",
        hoverOffset: 8,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 800,
    },
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          padding: 20,
          font: { size: 13, weight: 600 as const },
          color: "#64748b",
        },
      },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.9)",
        padding: 14,
        cornerRadius: 10,
        titleFont: { size: 14, weight: 700 as const },
        bodyFont: { size: 13 },
        callbacks: {
          label: (ctx: { label?: string; raw?: unknown }) => {
            const val = ctx.raw as number;
            const pct =
              totalValidationItems > 0
                ? ((val / totalValidationItems) * 100).toFixed(1)
                : "0";
            return ` ${ctx.label}: ${val} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Overview of your accounts payable processing pipeline.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          className="rounded-xl gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* ─── Row 1: Key Metrics ─── */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Invoices"
          value={analytics.totalInvoices}
          description="Invoices processed"
          icon={FileText}
          color="text-blue-700 dark:text-blue-400"
          iconBg="bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
          onClick={() => navigate("/invoices")}
        />
        <StatCard
          title="Total Purchase Orders"
          value={analytics.totalPOs}
          description="Purchase orders on file"
          icon={FileSpreadsheet}
          color="text-indigo-700 dark:text-indigo-400"
          iconBg="bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
          onClick={() => navigate("/purchase-orders")}
        />
        <StatCard
          title="Validation Groups"
          value={analytics.totalValidations}
          description="Validation groups created"
          icon={ShieldCheck}
          color="text-purple-700 dark:text-purple-400"
          iconBg="bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400"
          onClick={() => navigate("/validation")}
        />
      </div>

      {/* ─── Row 2: Pie Chart + Insight Cards ─── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pie Chart */}
        <Card className="rounded-2xl shadow-md border-0 lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Validation Overview</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Distribution of validation results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasPieData ? (
              <div className="h-64 flex items-center justify-center">
                <Pie data={pieData} options={pieOptions} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                No validation data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insight cards */}
        <div className="lg:col-span-2 grid gap-6 sm:grid-cols-2">
          <StatCard
            title="Awaiting Validation"
            value={analytics.invoicesAwaiting.length}
            description="Invoices pending review"
            icon={Clock}
            color="text-amber-700 dark:text-amber-400"
            iconBg="bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
          />
          <StatCard
            title="POs Not Invoiced"
            value={analytics.posNotInvoiced.length}
            description="No linked invoice yet"
            icon={FileSpreadsheet}
            color="text-slate-700 dark:text-slate-400"
            iconBg="bg-slate-100 text-slate-600 dark:bg-slate-950/50 dark:text-slate-400"
          />
        </div>
      </div>

      {/* ─── Row 3: Recent Validation Activity ─── */}
      <Card className="rounded-2xl shadow-md border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Recent Validation Activity</CardTitle>
              <CardDescription className="text-xs">
                Latest validation groups
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/validation")}
              className="rounded-xl gap-2"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {analytics.recentValidations.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              No validation activity yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y bg-muted/40">
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                      Group
                    </th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-center px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                      Invoices
                    </th>
                    <th className="text-center px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                      POs
                    </th>
                    <th className="text-left px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentValidations.map((g, idx) => {
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
                        className={`border-b last:border-0 cursor-pointer transition-colors hover:bg-primary/5 ${
                          idx % 2 === 1 ? "bg-muted/20" : ""
                        }`}
                        onClick={() => navigate(`/validation/${g.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigate(`/validation/${g.id}`);
                          }
                        }}
                      >
                        <td className="px-5 py-3.5 font-semibold">
                          #{g.id}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant={badgeVariant as "success" | "destructive" | "warning"}
                            className="rounded-full px-3 py-0.5 text-xs font-semibold"
                          >
                            {g.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-center tabular-nums">
                          {g.invoice_count}
                        </td>
                        <td className="px-5 py-3.5 text-center tabular-nums">
                          {g.po_count}
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">
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
