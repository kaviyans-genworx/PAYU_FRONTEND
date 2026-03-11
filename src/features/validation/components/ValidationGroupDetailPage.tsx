import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { validationService } from "../services/validationService";
import type { ValidationResultsOut, DiscrepancyOut, MergedItem } from "@/types/documents";
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
  AlertCircle,
  FileText,
  FileSpreadsheet,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  ArrowRightLeft,
} from "lucide-react";

/* ─── Helpers ──────────────────────────────────────────────── */

function validationStatusBadge(status?: string | null) {
  if (!status) return { variant: "secondary" as const, label: "PENDING" };
  switch (status.toUpperCase()) {
    case "PASSED":
    case "VALIDATED":
      return { variant: "success" as const, label: status.toUpperCase() };
    case "FAILED":
      return { variant: "destructive" as const, label: "FAILED" };
    default:
      return { variant: "warning" as const, label: status.toUpperCase() };
  }
}

function matchStatusBadge(status?: string | null) {
  if (!status) return { variant: "secondary" as const, label: "—" };
  switch (status.toUpperCase()) {
    case "FULL_MATCH":
    case "MATCHED":
      return { variant: "success" as const, label: status.replace(/_/g, " ") };
    case "MATCH_ISSUES":
    case "PARTIAL_MATCH":
      return { variant: "warning" as const, label: status.replace(/_/g, " ") };
    case "NO_MATCH":
    case "MISMATCH":
      return { variant: "destructive" as const, label: status.replace(/_/g, " ") };
    default:
      return { variant: "secondary" as const, label: status.replace(/_/g, " ") };
  }
}

function severityConfig(severity: string) {
  switch (severity.toUpperCase()) {
    case "CRITICAL":
      return {
        color: "text-red-700 dark:text-red-400",
        bg: "bg-red-50 dark:bg-red-950/30",
        border: "border-red-200 dark:border-red-800",
        badge: "destructive" as const,
        icon: XCircle,
      };
    case "HIGH":
      return {
        color: "text-orange-700 dark:text-orange-400",
        bg: "bg-orange-50 dark:bg-orange-950/30",
        border: "border-orange-200 dark:border-orange-800",
        badge: "destructive" as const,
        icon: AlertCircle,
      };
    case "MEDIUM":
      return {
        color: "text-amber-700 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-950/30",
        border: "border-amber-200 dark:border-amber-800",
        badge: "warning" as const,
        icon: AlertTriangle,
      };
    default:
      return {
        color: "text-gray-600 dark:text-gray-400",
        bg: "bg-gray-50 dark:bg-gray-900/30",
        border: "border-gray-200 dark:border-gray-700",
        badge: "secondary" as const,
        icon: Info,
      };
  }
}

function fmtNum(val?: number | null): string {
  if (val == null) return "—";
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ─── Section 1: Validation Summary Card ──────────────────── */

function ValidationSummaryCard({ data }: { data: ValidationResultsOut }) {
  const vs = validationStatusBadge(data.validation_status);
  const ms = matchStatusBadge(data.match_status);

  return (
    <Card className="border shadow-sm bg-white dark:bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Validation Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Group</p>
            <p className="text-xl font-bold">#{data.group_id}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
            <Badge variant={vs.variant} className="text-xs">{vs.label}</Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Match Status</p>
            <Badge variant={ms.variant} className="text-xs">{ms.label}</Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Documents</p>
            <p className="text-sm">
              <span className="font-semibold">{data.invoices.length}</span>
              <span className="text-muted-foreground"> invoice{data.invoices.length !== 1 ? "s" : ""}</span>
              <span className="text-muted-foreground mx-1">&middot;</span>
              <span className="font-semibold">{data.pos.length}</span>
              <span className="text-muted-foreground"> PO{data.pos.length !== 1 ? "s" : ""}</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Section 2: Item Comparison Table ────────────────────── */

function ItemComparisonTable({
  invoiceItems,
  poItems,
}: {
  invoiceItems: MergedItem[];
  poItems: MergedItem[];
}) {
  const maxRows = Math.max(invoiceItems.length, poItems.length);

  return (
    <Card className="border shadow-sm bg-white dark:bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowRightLeft className="h-4 w-4 text-primary" />
          Invoice vs PO Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y bg-muted/50">
                <th colSpan={4} className="text-center px-4 py-2.5 font-semibold text-foreground border-r">
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Merged Invoice Items
                  </span>
                </th>
                <th colSpan={4} className="text-center px-4 py-2.5 font-semibold text-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Merged PO Items
                  </span>
                </th>
              </tr>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Item</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">Qty</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">Unit Price</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground border-r">Total</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Item</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">Qty</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">Unit Price</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {maxRows === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No line items to compare.
                  </td>
                </tr>
              ) : (
                Array.from({ length: maxRows }).map((_, i) => {
                  const inv = invoiceItems[i];
                  const po = poItems[i];

                  const sameItem = inv && po && (inv.item_code === po.item_code);
                  const qtyMismatch = sameItem && inv.quantity !== po.quantity;
                  const priceMismatch = sameItem && inv.unit_price !== po.unit_price;
                  const totalMismatch = sameItem && inv.total_price !== po.total_price;

                  // Row match indicator
                  const rowMatch = sameItem && !qtyMismatch && !priceMismatch && !totalMismatch;

                  return (
                    <tr
                      key={i}
                      className={`border-b last:border-0 transition-colors ${
                        rowMatch
                          ? "hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10"
                          : qtyMismatch || totalMismatch || priceMismatch
                            ? "bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/50"
                            : "hover:bg-muted/30"
                      }`}
                    >
                      {/* Indicator */}

                      {/* Invoice side */}
                      <td className="px-4 py-2.5 font-medium">
                        {inv ? (
                          <div className="flex items-center gap-1.5">
                            {sameItem && rowMatch && (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            )}
                            {sameItem && !rowMatch && (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            )}
                            {!sameItem && inv && po && (
                              <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                            )}
                            <span>{inv.item_description || inv.item_code || "—"}</span>
                          </div>
                        ) : ""}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-mono ${qtyMismatch ? "text-amber-600 font-semibold bg-amber-50/50 dark:bg-amber-950/20" : ""}`}>
                        {inv ? fmtNum(inv.quantity) : ""}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-mono ${priceMismatch ? "text-red-600 font-semibold bg-red-50/50 dark:bg-red-950/20" : ""}`}>
                        {inv ? fmtNum(inv.unit_price) : ""}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-mono border-r ${totalMismatch ? "text-red-600 font-semibold bg-red-50/50 dark:bg-red-950/20" : ""}`}>
                        {inv ? fmtNum(inv.total_price) : ""}
                      </td>

                      {/* PO side */}
                      <td className="px-4 py-2.5 font-medium">
                        {po ? po.item_description || po.item_code || "—" : ""}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-mono ${qtyMismatch ? "text-amber-600 font-semibold bg-amber-50/50 dark:bg-amber-950/20" : ""}`}>
                        {po ? fmtNum(po.quantity) : ""}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-mono ${priceMismatch ? "text-red-600 font-semibold bg-red-50/50 dark:bg-red-950/20" : ""}`}>
                        {po ? fmtNum(po.unit_price) : ""}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-mono ${totalMismatch ? "text-red-600 font-semibold bg-red-50/50 dark:bg-red-950/20" : ""}`}>
                        {po ? fmtNum(po.total_price) : ""}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t bg-muted/20 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Match</span>
          <span className="inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-500" /> Discrepancy</span>
          <span className="inline-flex items-center gap-1"><XCircle className="h-3 w-3 text-red-400" /> Unmatched</span>
          <span className="ml-auto">
            <span className="inline-block w-3 h-3 rounded-sm bg-amber-50 border border-amber-200 mr-1 align-middle" /> Qty mismatch
            <span className="inline-block w-3 h-3 rounded-sm bg-red-50 border border-red-200 ml-3 mr-1 align-middle" /> Price mismatch
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Section 3: Discrepancy List ─────────────────────────── */

function DiscrepancyList({ discrepancies }: { discrepancies: DiscrepancyOut[] }) {
  if (discrepancies.length === 0) {
    return (
      <Card className="border shadow-sm bg-white dark:bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            Discrepancies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            <p className="text-sm font-medium">No discrepancies found — all items match.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm bg-white dark:bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Discrepancies
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {discrepancies.length} issue{discrepancies.length !== 1 ? "s" : ""} found
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {discrepancies.map((d, idx) => {
          const cfg = severityConfig(d.severity);
          const Icon = cfg.icon;
          return (
            <div
              key={idx}
              className={`rounded-lg border ${cfg.border} ${cfg.bg} p-4 transition-all hover:shadow-sm`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`h-5 w-5 ${cfg.color} shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={cfg.badge} className="text-[10px] uppercase px-1.5">
                      {d.severity}
                    </Badge>
                    <span className={`text-sm font-semibold ${cfg.color}`}>
                      {d.discrepancy_type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm mt-1.5 text-foreground/80">{d.message}</p>
                  {d.ai_explanation && (
                    <div className="mt-2 rounded-md bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 p-2.5">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                          {d.ai_explanation}
                        </p>
                      </div>
                    </div>
                  )}
                  {(d.invoice_value || d.po_value) && (
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      {d.invoice_value && (
                        <span className="inline-flex items-center gap-1">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Invoice:</span>
                          <span className="font-mono font-semibold">{d.invoice_value}</span>
                        </span>
                      )}
                      {d.po_value && (
                        <span className="inline-flex items-center gap-1">
                          <FileSpreadsheet className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">PO:</span>
                          <span className="font-mono font-semibold">{d.po_value}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* ─── Section 4: AI Suggestions Card ─────────────────────── */

function AISuggestionsCard({
  summary,
  suggestions,
}: {
  summary?: string | null;
  suggestions: string[];
}) {
  return (
    <Card className="border shadow-sm bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-blue-800 dark:text-blue-300">
          <Lightbulb className="h-4 w-4" />
          AI Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary && (
          <div className="rounded-lg bg-white/70 dark:bg-card/50 border border-blue-100 dark:border-blue-900 p-3">
            <p className="text-sm text-foreground/80 leading-relaxed">{summary}</p>
          </div>
        )}
        {suggestions.length > 0 && (
          <ul className="space-y-2">
            {suggestions.map((s, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                  {idx + 1}
                </span>
                <span className="text-foreground/80 leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
        )}
        {!summary && suggestions.length === 0 && (
          <p className="text-sm text-muted-foreground">No suggestions available.</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Main Page ────────────────────────────────────────────── */

export function ValidationGroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ValidationResultsOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) return;
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await validationService.getGroupResults(Number(groupId));
        setData(results);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { detail?: string } } }).response?.data
            ?.detail ??
          (err instanceof Error ? err.message : "Failed to load validation results");
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    void fetchResults();
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

  if (!data) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/validation")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Validation Results
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Group #{data.group_id} — detailed validation report
          </p>
        </div>
      </div>

      {/* Section 1 — Validation Summary */}
      <ValidationSummaryCard data={data} />

      {/* Section 2 — Invoice vs PO Comparison */}
      <ItemComparisonTable
        invoiceItems={data.merged_invoice_items}
        poItems={data.merged_po_items}
      />

      {/* Section 3 — Discrepancies */}
      <DiscrepancyList discrepancies={data.discrepancies} />

      {/* Section 4 — AI Suggestions */}
      <AISuggestionsCard
        summary={data.ai_summary}
        suggestions={data.ai_suggestions}
      />
    </div>
  );
}
