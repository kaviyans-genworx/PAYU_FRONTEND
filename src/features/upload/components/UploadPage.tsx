import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { checkBackgroundExtractionStatus, extractPurchaseOrder, resetUpload } from "../slices/uploadSlice";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Upload,
  FileSpreadsheet,
  X,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Info,
} from "lucide-react";

const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg"];

/* Cycling status messages shown during extraction */
const EXTRACTION_STEPS = [
  "Validating file…",
  "Building extraction prompt…",
  "Extracting PO fields with Gemini OCR…",
  "Normalizing identifiers…",
  "Validating extracted data…",
  "Determining review status…",
  "Storing document…",
  "Finalizing…",
];

const STEP_STORAGE_KEY = "payu_extraction_step";

/** Clear persisted animation step (call on completion or error). */
export function clearExtractionStep() {
  localStorage.removeItem(STEP_STORAGE_KEY);
}

function ExtractionLoader() {
  const [stepIndex, setStepIndex] = useState(() => {
    const saved = localStorage.getItem(STEP_STORAGE_KEY);
    return saved ? Math.min(Number(saved), EXTRACTION_STEPS.length - 1) : 0;
  });

  useEffect(() => {
    localStorage.setItem(STEP_STORAGE_KEY, String(stepIndex));
  }, [stepIndex]);

  useEffect(() => {
    const delays = [1000, 1000, 23000, 1000, 2000, 4000, 4000, 4000];
    if (stepIndex >= EXTRACTION_STEPS.length - 1) return;
    const timeout = setTimeout(() => {
      setStepIndex((prev) => Math.min(prev + 1, EXTRACTION_STEPS.length - 1));
    }, delays[stepIndex] ?? 3000);
    return () => clearTimeout(timeout);
  }, [stepIndex]);

  return (
    <div className="rounded-xl border bg-card p-8 shadow-sm flex flex-col items-center gap-6">
      {/* Pulsing icon */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        <div className="relative flex items-center justify-center h-16 w-16 rounded-full bg-primary/10">
          <FileSpreadsheet className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* Status text */}
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-foreground">
          {EXTRACTION_STEPS[stepIndex]}
        </p>
        <p className="text-xs text-muted-foreground">
          This may take a moment
        </p>
      </div>

      {/* Progress bar animation */}
      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
          style={{
            width: `${Math.min(((stepIndex + 1) / EXTRACTION_STEPS.length) * 100, 95)}%`,
          }}
        />
      </div>

      {/* Step counter */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Step {stepIndex + 1} of {EXTRACTION_STEPS.length}
      </div>
    </div>
  );
}

export function UploadPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, info, result, jobId } = useAppSelector((s) => s.upload);

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    setDuplicateError(null);
    setBackendError(null);
    const resultAction = await dispatch(extractPurchaseOrder({ file }));
    if (extractPurchaseOrder.fulfilled.match(resultAction)) {
      const payload = resultAction.payload;

      if (payload.status_code && payload.status_code !== 200) {
        if (payload.status_code === 409) {
          setDuplicateError(payload.message ?? "This purchase order already exists.");
        } else {
          // 👇 This handles WRONG DOCUMENT TYPE + other backend errors
          dispatch(resetUpload());
          clearExtractionStep();
          setBackendError(payload.message || "Extraction failed");
        }
        return;
      }

      const poId = payload.stored_record?.id;
      const poNumber = payload.stored_record?.po_number;
      if (poId != null && poNumber) {
        navigate(`/review?poId=${poId}&poNumber=${encodeURIComponent(poNumber)}`);
      } else if (poId != null) {
        navigate(`/review?poId=${poId}`);
      } else {
        navigate("/purchase-orders");
      }
    }
  };

  const handleReset = () => {
    setFile(null);
    setDuplicateError(null);
    setBackendError(null);
    dispatch(resetUpload());
    clearExtractionStep();
    if (inputRef.current) inputRef.current.value = "";
  };

  useEffect(() => {
    if (!jobId || loading || !info || error || result) return;

    let isDisposed = false;
    let isChecking = false;

    const runStatusCheck = async () => {
      if (isDisposed || isChecking) return;
      isChecking = true;
      await dispatch(checkBackgroundExtractionStatus({ jobId }));
      isChecking = false;
    };

    runStatusCheck();
    const interval = setInterval(runStatusCheck, 5000);

    return () => {
      isDisposed = true;
      clearInterval(interval);
    };
  }, [dispatch, error, info, jobId, loading, result]);

  /* ---- Loading state: show extraction animation ---- */
  if (loading) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center pt-12">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Processing Purchase Order</h1>
        <p className="text-muted-foreground mb-8 text-center">
          Please wait while we extract and validate your purchase order.
        </p>
        {file && (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3 mb-8 w-full">
            <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
        )}
        {info && (
          <div className="mt-1 mb-6 flex items-start gap-3 rounded-lg border border-blue-400/50 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 w-full">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Processing in Background</p>
              <p className="text-sm text-blue-800/80 dark:text-blue-300/80 mt-0.5">{info}</p>
            </div>
          </div>
        )}
        <div className="w-full">
          <ExtractionLoader />
        </div>
      </div>
    );
  }

  /* ---- Default: upload form ---- */
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Purchase Order</h1>
        <p className="text-muted-foreground mt-1">
          Upload only purchase order documents to extract structured PO data.
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload PO File
          </CardTitle>
          <CardDescription>Supported formats: PDF, PNG, JPEG</CardDescription>
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
              <p className="text-sm font-medium text-foreground">Drag & drop your PO file here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {file && (
            <div className="mt-4 flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
              <FileSpreadsheet className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
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

          <div className="mt-5 flex gap-3">
            <Button onClick={handleSubmit} disabled={!file || loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Extract PO Data
                </>
              )}
            </Button>
            {(file || result) && (
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            )}
          </div>

          {duplicateError && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-400/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Duplicate Purchase Order</p>
                <p className="text-sm text-amber-700 dark:text-amber-500 mt-0.5">{duplicateError}</p>
              </div>
            </div>
          )}

          {backendError && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Extraction Failed</p>
                <p className="text-sm text-destructive/80 mt-0.5">{backendError}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/50 shadow-sm bg-destructive/5">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Extraction Failed</p>
              <p className="text-sm mt-1 text-destructive/80">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {info && (
        <Card className="border-blue-400/50 shadow-sm bg-blue-50/50 dark:bg-blue-950/30">
          <CardContent className="flex items-start gap-3 pt-6">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Processing in Background</p>
              <p className="text-sm mt-1 text-blue-800/80 dark:text-blue-300/80 leading-relaxed">{info}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

