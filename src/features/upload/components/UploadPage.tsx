import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { extractDocument, resetUpload } from "../slices/uploadSlice";
import { addReviewItem } from "@/features/review/slices/reviewSlice";
import { extractionService } from "../services/extractionService";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Hash,
  Calendar,
  DollarSign,
  Package,
  Mail,
  Phone,
  MapPin,
  CreditCard,
} from "lucide-react";
import { ExtractionProgress } from "./ExtractionProgress";

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];

/* ---- tiny helper components ---- */

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: unknown;
}) {
  const display =
    value === null || value === undefined || value === ""
      ? "—"
      : String(value);
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground break-words">
          {display}
        </p>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: unknown }) {
  const num =
    value !== null && value !== undefined ? Number(value) : null;
  const display =
    num !== null && !isNaN(num)
      ? num.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "—";
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{display}</span>
    </div>
  );
}

/* ---- main component ---- */

export function UploadPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, result } = useAppSelector((s) => s.upload);

  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<"invoice" | "po">("invoice");
  const [dragOver, setDragOver] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const PROGRESS_KEY = "payu_extraction_in_progress";

  useEffect(() => {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw || loading) return;

    setRecovering(true);
    let attempts = 0;

    const poll = setInterval(async () => {
      attempts++;
      try {
        const data = await extractionService.getPendingReviews();
        const all = [...data.invoices, ...data.purchase_orders];
        if (all.length > 0) {
          clearInterval(poll);
          localStorage.removeItem(PROGRESS_KEY);
          all.forEach((item) => dispatch(addReviewItem(item)));
          setRecovering(false);
          navigate("/review");
          return;
        }
      } catch { /* ignore */ }

      if (attempts >= 40) {
        clearInterval(poll);
        localStorage.removeItem(PROGRESS_KEY);
        setRecovering(false);
      }
    }, 3000);

    return () => clearInterval(poll);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFile = useCallback((f: File | null) => {
    if (f && ACCEPTED_TYPES.includes(f.type)) {
      setFile(f);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      handleFile(dropped ?? null);
    },
    [handleFile],
  );

  const handleSubmit = async () => {
    if (!file) return;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ docType }));
    const resultAction = await dispatch(extractDocument({ file, docType }));
    localStorage.removeItem(PROGRESS_KEY);
    if (extractDocument.fulfilled.match(resultAction)) {
      const payload = resultAction.payload;
      if (!payload.duplicate) {
        dispatch(addReviewItem(payload));
        navigate("/review");
      }
    }
  };

  const handleReset = () => {
    setFile(null);
    dispatch(resetUpload());
    if (inputRef.current) inputRef.current.value = "";
  };

  /* ---- data accessors (safe for both invoice & PO shapes) ---- */
  const d = (result?.extracted_data ?? {}) as Record<string, unknown>;
  const lineItems = (d.line_items ?? []) as Record<string, unknown>[];
  const isInvoice = result?.document_type === "invoice";
  const isDuplicate = !!result?.duplicate;
  const currency = (d.currency as string) ?? "USD";

  /* ---- Recovery: extraction was in progress before refresh ---- */
  if (recovering) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center pt-12">
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          Resuming Extraction
        </h1>
        <p className="text-muted-foreground mb-8 text-center">
          An extraction was in progress. Waiting for results…
        </p>
        <div className="w-full">
          <ExtractionProgress isActive />
        </div>
      </div>
    );
  }

  /* ---- Extraction takeover: hide all upload controls ---- */
  if (loading) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center pt-12">
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          Processing Document
        </h1>
        <p className="text-muted-foreground mb-8 text-center">
          Please wait while we extract and structure your document data.
        </p>
        {file && (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3 mb-8 w-full">
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        )}
        <div className="w-full">
          <ExtractionProgress isActive />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Document</h1>
        <p className="text-muted-foreground mt-1">
          Upload a purchase order or invoice to extract structured data.
        </p>
      </div>

      {/* Document type selector */}
      <div className="flex gap-3">
        <Button
          variant={docType === "invoice" ? "default" : "outline"}
          onClick={() => setDocType("invoice")}
          aria-pressed={docType === "invoice"}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Invoice
        </Button>
        <Button
          variant={docType === "po" ? "default" : "outline"}
          onClick={() => setDocType("po")}
          aria-pressed={docType === "po"}
          className="gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Purchase Order
        </Button>
      </div>

      {/* Dropzone */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload File
          </CardTitle>
          <CardDescription>
            Supported formats: PDF, PNG, JPEG, WebP
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 cursor-pointer transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 bg-muted/50 hover:border-primary/40"
            }`}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Drag & drop your file here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or click to browse
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* Selected file chip */}
          {file && (
            <div className="mt-4 flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-5 flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!file || loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Extract Data
                </>
              )}
            </Button>
            {(file || result) && (
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive/50 shadow-sm">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">
                Extraction Failed
              </p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============ RESULTS ============ */}
      {result && (
        <div className="space-y-6">
          {/* Duplicate warning banner */}
          {isDuplicate && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-400/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                  Duplicate Document
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-500 mt-0.5">
                  {result.message}
                </p>
              </div>
            </div>
          )}

          {/* Success header */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {isDuplicate ? (
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  )}
                  {isInvoice ? "Invoice" : "Purchase Order"} Details
                </CardTitle>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    isDuplicate
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400"
                  }`}
                >
                  {isDuplicate ? "Already Exists" : "Extracted Successfully"}
                </span>
              </div>
              <CardDescription>
                {isInvoice ? "Invoice" : "PO"} #{" "}
                <span className="font-semibold text-foreground">
                  {isInvoice
                    ? (d.invoice_number as string) ?? "—"
                    : (d.po_number as string) ?? "—"}
                </span>
                {typeof d.status === "string" && d.status && (
                  <>
                    {" "}
                    &middot; Status:{" "}
                    <span className="font-semibold uppercase text-foreground">
                      {d.status}
                    </span>
                  </>
                )}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Two‑column grid: Document Info + Vendor Info */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Document Info */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Document Info
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                <InfoRow
                  icon={Hash}
                  label={isInvoice ? "Invoice Number" : "PO Number"}
                  value={isInvoice ? d.invoice_number : d.po_number}
                />
                {isInvoice && Array.isArray(d.po_references) && (d.po_references as string[]).length > 0 && (
                  <InfoRow
                    icon={FileSpreadsheet}
                    label="PO References"
                    value={(d.po_references as string[]).join(", ")}
                  />
                )}
                <InfoRow
                  icon={Calendar}
                  label={isInvoice ? "Due Date" : "PO Date"}
                  value={isInvoice ? d.due_date : d.po_date}
                />
                <InfoRow icon={DollarSign} label="Currency" value={currency} />
              </CardContent>
            </Card>

            {/* Vendor Info */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Vendor Info
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                <InfoRow
                  icon={Building2}
                  label="Vendor Name"
                  value={d.vendor_name}
                />
                <InfoRow
                  icon={Mail}
                  label="Email"
                  value={d.vendor_email}
                />
                <InfoRow
                  icon={Phone}
                  label="Phone"
                  value={d.vendor_phone}
                />
                <InfoRow
                  icon={MapPin}
                  label="Address"
                  value={d.vendor_address}
                />
                <InfoRow
                  icon={CreditCard}
                  label="Tax / GST ID"
                  value={d.vendor_tax_id}
                />
              </CardContent>
            </Card>
          </div>

          {/* Line Items */}
          {lineItems.length > 0 && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Line Items
                  <span className="ml-auto text-xs font-normal normal-case text-muted-foreground">
                    {lineItems.length} item{lineItems.length > 1 ? "s" : ""}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y bg-muted/50">
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground w-12">
                          #
                        </th>
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                          Code
                        </th>
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">
                          Description
                        </th>
                        <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                          Qty
                        </th>
                        <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                          Unit Price
                        </th>
                        <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item, idx) => (
                        <tr
                          key={idx}
                          className={`border-b last:border-0 ${idx % 2 !== 0 ? "bg-muted/20" : ""}`}
                        >
                          <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                            {(item.line_number as number) ?? idx + 1}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs">
                            {(item.item_code as string) ?? "—"}
                          </td>
                          <td className="px-4 py-2.5 max-w-[240px] truncate">
                            {(item.item_description as string) ?? "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            {item.quantity != null ? Number(item.quantity) : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            {item.unit_price != null
                              ? Number(item.unit_price).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                            {item.total_price != null
                              ? Number(item.total_price).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
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

          {/* Financial Summary */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-sm ml-auto divide-y">
                <SummaryItem label="Subtotal" value={d.subtotal} />
                <SummaryItem label="Tax" value={d.tax_amount} />
                <SummaryItem label="Discount" value={d.discount_amount} />
                <div className="flex justify-between items-center py-2 mt-1">
                  <span className="text-sm font-semibold">Total ({currency})</span>
                  <span className="text-base font-bold tabular-nums">
                    {d.total_amount != null
                      ? Number(d.total_amount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
