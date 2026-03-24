import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { validationService } from "@/features/validation/services/validationService";
import { paymentService } from "../services/paymentService";
import type { ValidationResultsOut } from "@/types/documents";
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
  ShieldCheck,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
  Hash,
} from "lucide-react";

function fmtNum(val?: number | null): string {
  if (val == null) return "—";
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusBadge(status?: string | null) {
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

function matchBadge(status?: string | null) {
  if (!status) return { variant: "secondary" as const, label: "—" };
  switch (status.toUpperCase()) {
    case "FULL_MATCH":
    case "MATCHED":
      return { variant: "success" as const, label: status.replace(/_/g, " ") };
    case "MISMATCH":
    case "NO_MATCH":
      return { variant: "destructive" as const, label: status.replace(/_/g, " ") };
    default:
      return { variant: "warning" as const, label: status.replace(/_/g, " ") };
  }
}

export function AcceptancePage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ValidationResultsOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    validationService
      .getGroupResults(Number(groupId))
      .then(setData)
      .catch((err) => setError(err?.response?.data?.detail || "Failed to load validation results."))
      .finally(() => setLoading(false));
  }, [groupId]);

  const handleAccept = async () => {
    if (!groupId) return;
    setAccepting(true);
    try {
      await paymentService.acceptForPayment(Number(groupId));
      setAccepted(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to accept for payment.");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
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

  const vs = statusBadge(data.validation_status);
  const ms = matchBadge(data.match_status);

  if (accepted) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate("/validation")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Validation
        </Button>
        <Card className="border shadow-sm bg-white dark:bg-card">
          <CardContent className="py-12 text-center space-y-4">
            <div className="flex items-center justify-center">
              <div className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Accepted for Payment</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Validation Group #{groupId} has been successfully accepted for payment.
              You can view it on the Payments page.
            </p>
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button variant="outline" onClick={() => navigate("/validation")}>
                Back to Validation
              </Button>
              <Button onClick={() => navigate("/payments")}>
                Go to Payments
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accept for Payment</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review and accept Validation Group #{groupId} for payment
          </p>
        </div>
      </div>

      {/* Validation Summary */}
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
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Validation</p>
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

      {/* Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Invoices */}
        <Card className="border shadow-sm bg-white dark:bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-blue-500" />
              Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.invoices.map((inv) => (
              <div
                key={inv.id}
                className="rounded-lg border bg-blue-50/30 dark:bg-blue-950/10 border-blue-200/60 dark:border-blue-800/40 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900/50 shrink-0">
                      <Hash className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {inv.invoice_number || `Invoice #${inv.id}`}
                      </p>
                      {inv.vendor_name && (
                        <p className="text-xs text-muted-foreground truncate">{inv.vendor_name}</p>
                      )}
                    </div>
                  </div>
                  {inv.total_amount != null && (
                    <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {fmtNum(inv.total_amount)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* POs */}
        <Card className="border shadow-sm bg-white dark:bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="h-4 w-4 text-indigo-500" />
              Purchase Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.pos.map((po) => (
              <div
                key={po.id}
                className="rounded-lg border bg-indigo-50/30 dark:bg-indigo-950/10 border-indigo-200/60 dark:border-indigo-800/40 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 shrink-0">
                      <Hash className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {po.po_number || `PO #${po.id}`}
                      </p>
                      {po.vendor_name && (
                        <p className="text-xs text-muted-foreground truncate">{po.vendor_name}</p>
                      )}
                    </div>
                  </div>
                  {po.total_amount != null && (
                    <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {fmtNum(po.total_amount)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Discrepancies warning (if mismatch) */}
      {data.discrepancies.length > 0 && (
        <Card className="border border-amber-200 dark:border-amber-800 shadow-sm bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  {data.discrepancies.length} Discrepanc{data.discrepancies.length !== 1 ? "ies" : "y"} Found
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  This validation group has mismatches. By accepting for payment, you confirm that you have reviewed
                  the discrepancies and approve payment despite any differences.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Action button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button
          onClick={handleAccept}
          disabled={accepting}
          className="gap-2"
        >
          {accepting ? (
            <>
              <LoadingSpinner size={16} />
              Accepting...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Confirm Acceptance
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
