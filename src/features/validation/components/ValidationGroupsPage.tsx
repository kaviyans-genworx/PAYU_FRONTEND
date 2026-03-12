import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { validationService } from "../services/validationService";
import type { ValidationGroupSummary } from "@/types/documents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Pagination } from "@/components/common/Pagination";
import { usePagination } from "@/hooks/usePagination";
import {
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Eye,
  LayoutList,
  LayoutGrid,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

type ViewMode = "table" | "card";

function statusVariant(
  status: string,
): "success" | "warning" | "destructive" | "secondary" {
  switch (status.toLowerCase()) {
    case "passed":
    case "validated":
    case "matched":
      return "success";
    case "issues":
    case "partial":
    case "warning":
    case "pending":
      return "warning";
    case "failed":
    case "error":
    case "mismatched":
      return "destructive";
    default:
      return "secondary";
  }
}

type BucketKey = "passed" | "issues" | "failed";

function getBucket(status: string): BucketKey {
  switch (status.toLowerCase()) {
    case "passed":
    case "validated":
    case "matched":
      return "passed";
    case "failed":
    case "error":
    case "mismatched":
      return "failed";
    case "issues":
    case "partial":
    case "warning":
    case "pending":
    default:
      return "issues";
  }
}

const bucketConfig: Record<
  BucketKey,
  {
    label: string;
    icon: typeof CheckCircle2;
    borderColor: string;
    bgColor: string;
    headerBg: string;
    iconColor: string;
    textColor: string;
    cardBorder: string;
    cardBg: string;
  }
> = {
  failed: {
    label: "Failed",
    icon: XCircle,
    borderColor: "border-error-border",
    bgColor: "bg-error-bg-subtle",
    headerBg: "bg-error-bg",
    iconColor: "text-error-fg",
    textColor: "text-error-fg",
    cardBorder: "border-error-border",
    cardBg: "bg-error-bg-subtle",
  },
  issues: {
    label: "Issues",
    icon: AlertTriangle,
    borderColor: "border-warning-border",
    bgColor: "bg-warning-bg-subtle",
    headerBg: "bg-warning-bg",
    iconColor: "text-warning-fg",
    textColor: "text-warning-fg",
    cardBorder: "border-warning-border",
    cardBg: "bg-warning-bg-subtle",
  },
  passed: {
    label: "Passed",
    icon: CheckCircle2,
    borderColor: "border-success-border",
    bgColor: "bg-success-bg-subtle",
    headerBg: "bg-success-bg",
    iconColor: "text-success-fg",
    textColor: "text-success-fg",
    cardBorder: "border-success-border",
    cardBg: "bg-success-bg-subtle",
  },
};

// ─── Per-column card list with independent pagination ─────────
function BucketColumn({
  bucket,
  items,
  navigate,
}: {
  bucket: BucketKey;
  items: ValidationGroupSummary[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const config = bucketConfig[bucket];
  const Icon = config.icon;
  const pagination = usePagination(items, 6);

  return (
    <div
      className={`flex flex-col rounded-xl border ${config.borderColor} ${config.bgColor} overflow-hidden`}
    >
      {/* Column header */}
      <div
        className={`flex items-center gap-2 px-4 py-3 ${config.headerBg} border-b ${config.borderColor}`}
      >
        <Icon className={`h-4.5 w-4.5 ${config.iconColor}`} />
        <span className={`text-sm font-semibold ${config.textColor}`}>
          {config.label}
        </span>
        <span
          className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.textColor} ${config.bgColor} border ${config.borderColor}`}
        >
          {items.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-2.5 min-h-[200px]">
        {pagination.paginatedItems.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground py-8">
            No validations
          </div>
        ) : (
          pagination.paginatedItems.map((g) => (
            <Card
              key={g.id}
              className={`border ${config.cardBorder} ${config.cardBg} hover:shadow-md transition-all cursor-pointer group`}
              onClick={() => navigate(`/validation/${g.id}`)}
            >
              <CardHeader className="pb-1.5 pt-3 px-3.5">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold leading-snug">
                    Group #{g.id}
                  </CardTitle>
                  <Badge
                    variant={statusVariant(g.status)}
                    className="shrink-0 text-[10px] px-1.5"
                  >
                    {g.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-3.5 pb-3 pt-0">
                <CardDescription className="text-xs leading-relaxed mb-1.5">
                  {g.invoice_count} invoice
                  {g.invoice_count !== 1 ? "s" : ""} &middot; {g.po_count}{" "}
                  purchase order
                  {g.po_count !== 1 ? "s" : ""}
                </CardDescription>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {g.created_at
                      ? new Date(g.created_at).toLocaleDateString()
                      : "—"}
                  </span>
                  <span className="text-[11px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                    <Eye className="h-3 w-3" />
                    View
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Per-column pagination */}
      {items.length > 0 && (
        <div className={`border-t ${config.borderColor}`}>
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
            onNextPage={pagination.nextPage}
            onPrevPage={pagination.prevPage}
            onGoToPage={pagination.goToPage}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export function ValidationGroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<ValidationGroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const savedLayout = localStorage.getItem("validation_current_layout");
    if (savedLayout === "card") return "card";
    return "table";
  });

  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("validation_current_layout", mode);
  };

  const tablePagination = usePagination(groups, 10);

  // Bucket groups for Card View
  const buckets = useMemo(() => {
    const b: Record<BucketKey, ValidationGroupSummary[]> = {
      passed: [],
      issues: [],
      failed: [],
    };
    for (const g of groups) {
      b[getBucket(g.status)].push(g);
    }
    return b;
  }, [groups]);

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await validationService.listGroups();
      setGroups(data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail ??
        (err instanceof Error
          ? err.message
          : "Failed to load validation groups");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchGroups();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Validation Groups
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Review grouped invoices and purchase orders for manual comparison.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border bg-muted/50 p-0.5" role="radiogroup" aria-label="View mode">
            <button
              onClick={() => handleSetViewMode("table")}
              role="radio"
              aria-checked={viewMode === "table"}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === "table"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Table view"
            >
              <LayoutList className="h-3.5 w-3.5" />
              Table
            </button>
            <button
              onClick={() => handleSetViewMode("card")}
              role="radio"
              aria-checked={viewMode === "card"}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === "card"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Card view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Cards
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={fetchGroups}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size={32} />
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <ShieldCheck className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-lg font-medium">No validation groups yet</p>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Validation groups are created automatically after documents are uploaded and reviewed.
            </p>
            <Button className="mt-2 gap-2" onClick={() => navigate("/upload")}>
              Upload Documents
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        /* ──────────── TABLE VIEW ──────────── */
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Showing {tablePagination.startIndex + 1}–
              {tablePagination.endIndex} of {tablePagination.totalItems} group
              {tablePagination.totalItems > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y bg-muted/50">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Group ID
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">
                      Invoice Count
                    </th>
                    <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">
                      PO Count
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                      Created At
                    </th>
                    <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">
                      View
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tablePagination.paginatedItems.map((g) => (
                    <tr
                      key={g.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">{g.id}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(g.status)}>
                          {g.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {g.invoice_count}
                      </td>
                      <td className="px-4 py-3 text-center">{g.po_count}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {g.created_at
                          ? new Date(g.created_at).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/validation/${g.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={tablePagination.currentPage}
              totalPages={tablePagination.totalPages}
              totalItems={tablePagination.totalItems}
              startIndex={tablePagination.startIndex}
              endIndex={tablePagination.endIndex}
              hasNextPage={tablePagination.hasNextPage}
              hasPrevPage={tablePagination.hasPrevPage}
              onNextPage={tablePagination.nextPage}
              onPrevPage={tablePagination.prevPage}
              onGoToPage={tablePagination.goToPage}
            />
          </CardContent>
        </Card>
      ) : (
        /* ──────────── CARD VIEW — 3-column layout ──────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <BucketColumn
            bucket="failed"
            items={buckets.failed}
            navigate={navigate}
          />
          <BucketColumn
            bucket="issues"
            items={buckets.issues}
            navigate={navigate}
          />
          <BucketColumn
            bucket="passed"
            items={buckets.passed}
            navigate={navigate}
          />
        </div>
      )}
    </div>
  );
}
