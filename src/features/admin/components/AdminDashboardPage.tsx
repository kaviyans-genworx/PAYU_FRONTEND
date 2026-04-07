import { useEffect, useMemo, useState } from "react";
import { adminService } from "../services/adminService";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  FileText,
  FileSpreadsheet,
  ShieldCheck,
  Clock,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

/* ─── Metric Card ────────────────────────────────────────── */

function MetricCard({
  title,
  value,
  icon: Icon,
  color,
  iconBg,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  iconBg: string;
}) {
  return (
    <Card className="rounded-2xl shadow-md border-0 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground tracking-wide">
              {title}
            </p>
            <p className={`text-4xl font-extrabold tracking-tight ${color}`}>
              {value}
            </p>
          </div>
          <div className={`rounded-xl p-3 ${iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Admin Dashboard Page ───────────────────────────────── */

export function AdminDashboardPage() {
  const [fromDate, setFromDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d;
  });
  const [toDate, setToDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    total_invoices: number;
    total_purchase_orders: number;
    total_validations: number;
    total_pending_validation: number;
    total_unmatched_invoices: number;
  } | null>(null);
  const [points, setPoints] = useState<
    { date: string; invoices: number; validations: number }[]
  >([]);

  const fetchData = async (f: Date, t: Date) => {
    setLoading(true);
    setError(null);
    try {
      const fs = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
      const ts = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
      const [summaryData, trendData] = await Promise.all([
        adminService.getDashboardSummary(fs, ts),
        adminService.getDashboardTrends(fs, ts),
      ]);
      setSummary(summaryData);
      setPoints(
        trendData.points.map((p) => ({
          date: p.date,
          invoices: p.invoices,
          validations: p.validations,
        })),
      );
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail ?? (err instanceof Error ? err.message : "Failed to load dashboard");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData(fromDate, toDate);
  }, [fromDate, toDate]);

  const maxY = useMemo(
    () => Math.max(1, ...points.map((p) => Math.max(p.invoices, p.validations))),
    [points],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size={36} />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="space-y-4 max-w-lg mx-auto py-16">
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4 shadow-sm">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error || "Dashboard data unavailable"}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl gap-2"
          onClick={() => void fetchData(fromDate, toDate)}
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Global AP insights across invoices, POs, and validations.
          </p>
        </div>
        <DateRangePicker
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
        />
      </div>

      {/* ─── Metric Cards ─── */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Invoices"
          value={summary.total_invoices}
          icon={FileText}
          color="text-blue-700 dark:text-blue-400"
          iconBg="bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
        />
        <MetricCard
          title="Total Purchase Orders"
          value={summary.total_purchase_orders}
          icon={FileSpreadsheet}
          color="text-indigo-700 dark:text-indigo-400"
          iconBg="bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
        />
        <MetricCard
          title="Total Validations"
          value={summary.total_validations}
          icon={ShieldCheck}
          color="text-purple-700 dark:text-purple-400"
          iconBg="bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400"
        />
        <MetricCard
          title="Pending Validation"
          value={summary.total_pending_validation}
          icon={Clock}
          color="text-amber-700 dark:text-amber-400"
          iconBg="bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
        />
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-3 flex flex-col">
          <Card className="rounded-2xl shadow-md border-0 h-full flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">
                Daily Trend — Invoices vs Validations
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {points.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[160px] text-sm text-muted-foreground">
                  No trend data for the selected range.
                </div>
              ) : (
                <div className="overflow-x-auto h-full flex flex-col justify-end">
                  <div className="flex items-end gap-3 min-w-[500px] h-56 mt-4">
                    {points.map((point) => (
                      <div key={point.date} className="flex-1 flex flex-col items-center gap-1">
                        <div className="flex items-end gap-1 h-44 w-full justify-center">
                          <div
                            className="w-4 rounded-t-md bg-blue-500 transition-all duration-300"
                            style={{ height: `${(point.invoices / maxY) * 100}%`, minHeight: point.invoices > 0 ? "4px" : "0" }}
                            title={`Invoices: ${point.invoices}`}
                          />
                          <div
                            className="w-4 rounded-t-md bg-emerald-500 transition-all duration-300"
                            style={{ height: `${(point.validations / maxY) * 100}%`, minHeight: point.validations > 0 ? "4px" : "0" }}
                            title={`Validations: ${point.validations}`}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium truncate">
                          {new Date(point.date + "T00:00:00").toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center gap-5 text-xs text-muted-foreground pb-2">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" /> Invoices Extracted
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Validations Run
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
