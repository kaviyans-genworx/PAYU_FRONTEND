import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { paymentService } from "../services/paymentService";
import type { PaymentDetail } from "@/types/documents";
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
  CreditCard,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
  Hash,
  Mail,
  MapPin,
  Phone,
  Building2,
  DollarSign,
} from "lucide-react";

function fmtNum(val?: number | null): string {
  if (val == null) return "—";
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PaymentDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    paymentService
      .getPaymentDetail(Number(groupId))
      .then((d) => {
        setData(d);
        if (d.payment_status === "COMPLETED") setPaid(true);
      })
      .catch((err) => setError(err?.response?.data?.detail || "Failed to load payment detail."))
      .finally(() => setLoading(false));
  }, [groupId]);

  const handlePay = async () => {
    if (!groupId) return;
    setPaying(true);
    try {
      await paymentService.processPayment(Number(groupId));
      setPaid(true);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to process payment.");
    } finally {
      setPaying(false);
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
        <Button variant="ghost" size="sm" onClick={() => navigate("/payments")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Payments
        </Button>
        <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isCompleted = paid || data.payment_status === "COMPLETED";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/payments")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Details</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Group #{data.group_id}
          </p>
        </div>
        <div className="ml-auto">
          <Badge
            variant={isCompleted ? "success" : "warning"}
            className="text-sm px-3 py-1 gap-1.5"
          >
            {isCompleted ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <CreditCard className="h-3.5 w-3.5" />
            )}
            {isCompleted ? "PAID" : "PENDING"}
          </Badge>
        </div>
      </div>

      {/* Success banner */}
      {isCompleted && (
        <Card className="border border-emerald-200 dark:border-emerald-800 shadow-sm bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  Payment Completed
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  A payment notification email has been sent to the vendor.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Amount card */}
      <Card className="border shadow-sm bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Amount</p>
              <p className="text-3xl font-bold tracking-tight">{fmtNum(data.total_amount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendor details */}
      {data.vendor && (
        <Card className="border shadow-sm bg-white dark:bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" />
              Vendor Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</p>
                <p className="text-sm font-semibold">{data.vendor.vendor_name || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</p>
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm">{data.vendor.vendor_email || "—"}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone</p>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm">{data.vendor.vendor_phone || "—"}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Address</p>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <p className="text-sm">{data.vendor.vendor_address || "—"}</p>
                </div>
              </div>
              {data.vendor.gst_number && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">GST Number</p>
                  <p className="text-sm font-mono">{data.vendor.gst_number}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Invoices */}
        <Card className="border shadow-sm bg-white dark:bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-blue-500" />
              Invoices ({data.invoices.length})
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
              Purchase Orders ({data.pos.length})
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

      {/* Match status */}
      <Card className="border shadow-sm bg-white dark:bg-card">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium text-muted-foreground">Match Status:</p>
            <Badge
              variant={
                data.match_status?.toUpperCase() === "MISMATCH" ||
                data.match_status?.toUpperCase() === "NO_MATCH"
                  ? "destructive"
                  : "success"
              }
              className="text-xs"
            >
              {data.match_status?.replace(/_/g, " ") || "—"}
            </Badge>
            <p className="text-sm font-medium text-muted-foreground ml-4">Validation:</p>
            <Badge variant="success" className="text-xs">
              {data.validation_status || "PASSED"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Action button */}
      {!isCompleted && (
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/payments")}>
            Back to Payments
          </Button>
          <Button
            onClick={handlePay}
            disabled={paying}
            className="gap-2"
          >
            {paying ? (
              <>
                <LoadingSpinner size={16} />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Mark as Paid
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
