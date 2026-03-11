import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/hooks/useAppStore";
import { resetUpload } from "@/features/upload";
import {
  fetchPendingReviews,
  addReviewItem,
  removeReviewItem,
} from "../slices/reviewSlice";
import { reviewService } from "../services/reviewService";
import type { ExtractionResult } from "@/features/upload/services/extractionService";
import type { VendorSearchResult, POSearchResult } from "@/types/documents";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  ArrowLeft,
  Send,
  Plus,
  Trash2,
  FileText,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Eye,
  Search,
} from "lucide-react";

interface LineItemForm {
  line_number: number;
  item_code: string;
  item_description: string;
  quantity: string;
  unit_price: string;
  total_price: string;
}

/* ------------------------------------------------------------------ */
/*  Single document review form (rendered per tab)                    */
/* ------------------------------------------------------------------ */

function DocumentReviewForm({
  item,
  onSubmitted,
}: {
  item: ExtractionResult;
  onSubmitted: () => void;
}) {
  const isInvoice = item.document_type === "invoice";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractedData = (item.extracted_data ?? {}) as Record<string, any>;
  const score = item.score;
  const fileUrl = item.file_url;
  const storedRecord = item.stored_record!;

  const [form, setForm] = useState(() => ({
    invoice_number: String(extractedData.invoice_number ?? ""),
    po_number: String(extractedData.po_number ?? ""),
    reference_po_number: String(extractedData.reference_po_number ?? ""),
    vendor_name: String(extractedData.vendor_name ?? ""),
    vendor_email: String(extractedData.vendor_email ?? ""),
    vendor_phone: String(extractedData.vendor_phone ?? ""),
    vendor_address: String(extractedData.vendor_address ?? ""),
    vendor_tax_id: String(extractedData.vendor_tax_id ?? ""),
    currency: String(extractedData.currency ?? "USD"),
    due_date: String(extractedData.due_date ?? ""),
    po_date: String(extractedData.po_date ?? ""),
    subtotal: String(extractedData.subtotal ?? "0"),
    tax_amount: String(extractedData.tax_amount ?? "0"),
    discount_amount: String(extractedData.discount_amount ?? "0"),
    total_amount: String(extractedData.total_amount ?? "0"),
  }));

  const [lineItems, setLineItems] = useState<LineItemForm[]>(() =>
    ((extractedData.line_items as unknown[]) ?? []).map(
      (raw: unknown, idx: number) => {
        const li = raw as Record<string, unknown>;
        return {
          line_number: Number(li.line_number ?? idx + 1),
          item_code: String(li.item_code ?? ""),
          item_description: String(li.item_description ?? ""),
          quantity: String(li.quantity ?? ""),
          unit_price: String(li.unit_price ?? ""),
          total_price: String(li.total_price ?? ""),
        };
      },
    ),
  );

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Vendor search state ──
  const [vendorQuery, setVendorQuery] = useState(String(extractedData.vendor_name ?? ""));
  const [vendorResults, setVendorResults] = useState<VendorSearchResult[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<VendorSearchResult | null>(null);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const vendorRef = useRef<HTMLDivElement>(null);

  // ── PO search state ──
  const [poQuery, setPoQuery] = useState(String(extractedData.reference_po_number ?? ""));
  const [poResults, setPoResults] = useState<POSearchResult[]>([]);
  const [selectedPO, setSelectedPO] = useState<POSearchResult | null>(null);
  const [showPODropdown, setShowPODropdown] = useState(false);
  const poRef = useRef<HTMLDivElement>(null);

  // Debounced vendor search
  const vendorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleVendorSearch = useCallback((query: string) => {
    setVendorQuery(query);
    setSelectedVendor(null);
    if (vendorTimerRef.current) clearTimeout(vendorTimerRef.current);
    if (query.trim().length < 1) {
      setVendorResults([]);
      setShowVendorDropdown(false);
      return;
    }
    vendorTimerRef.current = setTimeout(async () => {
      const results = await reviewService.searchVendors(query.trim());
      setVendorResults(results);
      setShowVendorDropdown(results.length > 0);
    }, 300);
  }, []);

  // Debounced PO search
  const poTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlePOSearch = useCallback((query: string) => {
    setPoQuery(query);
    setSelectedPO(null);
    if (poTimerRef.current) clearTimeout(poTimerRef.current);
    if (query.trim().length < 1) {
      setPoResults([]);
      setShowPODropdown(false);
      return;
    }
    poTimerRef.current = setTimeout(async () => {
      const results = await reviewService.searchPurchaseOrders(query.trim());
      setPoResults(results);
      setShowPODropdown(results.length > 0);
    }, 300);
  }, []);

  // Select a vendor
  const selectVendor = (v: VendorSearchResult) => {
    setSelectedVendor(v);
    setVendorQuery(v.vendor_name ?? "");
    setShowVendorDropdown(false);
    setForm((prev) => ({
      ...prev,
      vendor_name: v.vendor_name ?? "",
      vendor_email: v.vendor_email ?? "",
      vendor_phone: v.vendor_phone ?? "",
      vendor_address: v.vendor_address ?? "",
      vendor_tax_id: v.gst_number ?? "",
    }));
  };

  // Select a PO — also auto-fill vendor from PO
  const selectPO = (po: POSearchResult) => {
    setSelectedPO(po);
    setPoQuery(po.po_number);
    setShowPODropdown(false);
    setForm((prev) => ({ ...prev, reference_po_number: po.po_number }));
    if (po.vendor) {
      selectVendor(po.vendor);
    }
  };

  // Auto-search vendor on mount if extracted vendor_name exists
  useEffect(() => {
    if (isInvoice && extractedData.vendor_name) {
      reviewService.searchVendors(String(extractedData.vendor_name)).then((results) => {
        if (results.length === 1) {
          selectVendor(results[0]);
        } else if (results.length > 1) {
          const exact = results.find(
            (v) => v.vendor_name?.toLowerCase() === String(extractedData.vendor_name).toLowerCase()
          );
          if (exact) selectVendor(exact);
        }
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (vendorRef.current && !vendorRef.current.contains(e.target as Node))
        setShowVendorDropdown(false);
      if (poRef.current && !poRef.current.contains(e.target as Node))
        setShowPODropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateLineItem = (
    index: number,
    field: keyof LineItemForm,
    value: string | number,
  ) =>
    setLineItems((prev) =>
      prev.map((li, i) => (i === index ? { ...li, [field]: value } : li)),
    );

  const addLineItem = () =>
    setLineItems((prev) => [
      ...prev,
      {
        line_number: prev.length + 1,
        item_code: "",
        item_description: "",
        quantity: "",
        unit_price: "",
        total_price: "",
      },
    ]);

  const removeLineItem = (index: number) =>
    setLineItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const items = lineItems.map((li) => ({
        line_number: li.line_number,
        item_code: li.item_code || undefined,
        item_description: li.item_description || undefined,
        quantity: li.quantity ? Number(li.quantity) : undefined,
        unit_price: li.unit_price ? Number(li.unit_price) : undefined,
        total_price: li.total_price ? Number(li.total_price) : undefined,
      }));

      if (isInvoice) {
        if (!form.reference_po_number.trim()) {
          setSubmitError("Reference PO Number is required for invoices.");
          setSubmitting(false);
          return;
        }
        await reviewService.submitInvoiceReview(storedRecord.id, {
          invoice_number: form.invoice_number || undefined,
          reference_po_number: form.reference_po_number,
          vendor_name: form.vendor_name || undefined,
          vendor_email: form.vendor_email || undefined,
          vendor_phone: form.vendor_phone || undefined,
          vendor_address: form.vendor_address || undefined,
          vendor_tax_id: form.vendor_tax_id || undefined,
          currency: form.currency || undefined,
          due_date: form.due_date || undefined,
          subtotal: form.subtotal ? Number(form.subtotal) : undefined,
          tax_amount: form.tax_amount ? Number(form.tax_amount) : undefined,
          discount_amount: form.discount_amount
            ? Number(form.discount_amount)
            : undefined,
          total_amount: form.total_amount
            ? Number(form.total_amount)
            : undefined,
          line_items: items,
        });
      } else {
        await reviewService.submitPOReview(storedRecord.id, {
          po_number: form.po_number || undefined,
          vendor_name: form.vendor_name || undefined,
          vendor_email: form.vendor_email || undefined,
          vendor_phone: form.vendor_phone || undefined,
          vendor_address: form.vendor_address || undefined,
          vendor_tax_id: form.vendor_tax_id || undefined,
          currency: form.currency || undefined,
          po_date: form.po_date || undefined,
          subtotal: form.subtotal ? Number(form.subtotal) : undefined,
          tax_amount: form.tax_amount ? Number(form.tax_amount) : undefined,
          discount_amount: form.discount_amount
            ? Number(form.discount_amount)
            : undefined,
          total_amount: form.total_amount
            ? Number(form.total_amount)
            : undefined,
          line_items: items,
        });
      }

      onSubmitted();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { detail?: string } };
        message?: string;
      };
      setSubmitError(
        axiosErr.response?.data?.detail ??
          axiosErr.message ??
          "Submission failed",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isPdf = fileUrl?.toLowerCase().includes(".pdf") ?? false;

  return (
    <div className="space-y-4">
      {score && (
        <div className="flex items-center gap-2 justify-end">
          <span
            className={`text-lg font-bold ${
              score.requires_review ? "text-amber-600" : "text-emerald-600"
            }`}
          >
            {score.percentage}%
          </span>
          <Badge variant={score.requires_review ? "warning" : "success"}>
            {score.requires_review ? "Review Required" : "Good Quality"}
          </Badge>
        </div>
      )}

      {submitError && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">
              Submission Failed
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {submitError}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT: Document Preview */}
        <div className="lg:w-3/5 min-w-0">
          <div className="lg:sticky lg:top-4">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Document Preview
                  </CardTitle>
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Open full size
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {fileUrl ? (
                  isPdf ? (
                    <iframe
                      src={fileUrl}
                      className="w-full rounded-lg border"
                      style={{
                        height: "calc(100vh - 200px)",
                        minHeight: 600,
                      }}
                      title="Document Preview"
                    />
                  ) : (
                    <div
                      className="flex items-center justify-center rounded-lg border bg-muted/30 p-3 overflow-auto"
                      style={{
                        height: "calc(100vh - 200px)",
                        minHeight: 600,
                      }}
                    >
                      <img
                        src={fileUrl}
                        alt="Document Preview"
                        className="max-w-full h-auto rounded-lg object-contain"
                        style={{
                          maxHeight: "calc(100vh - 240px)",
                          minHeight: 500,
                        }}
                      />
                    </div>
                  )
                ) : (
                  <div
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 text-muted-foreground"
                    style={{
                      height: "calc(100vh - 200px)",
                      minHeight: 600,
                    }}
                  >
                    <FileText className="h-12 w-12 mb-3 opacity-40" />
                    <p className="text-sm">No document preview available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT: Editable Form */}
        <div className="lg:w-2/5 space-y-5 pb-8 min-w-0">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                {isInvoice ? (
                  <FileText className="h-4 w-4" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                Document Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isInvoice ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="invoice_number">Invoice Number</Label>
                    <Input
                      id="invoice_number"
                      value={form.invoice_number}
                      onChange={(e) =>
                        updateField("invoice_number", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1.5" ref={poRef}>
                    <Label htmlFor="reference_po_number">
                      Reference PO Number{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reference_po_number"
                        value={poQuery}
                        onChange={(e) => handlePOSearch(e.target.value)}
                        onFocus={() => {
                          if (poResults.length > 0) setShowPODropdown(true);
                        }}
                        placeholder="Search PO number…"
                        className={`pl-8 ${
                          !form.reference_po_number.trim()
                            ? "border-amber-400"
                            : ""
                        }`}
                      />
                      {showPODropdown && poResults.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {poResults.map((po) => (
                            <button
                              key={po.id}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex justify-between items-center"
                              onClick={() => selectPO(po)}
                            >
                              <span className="font-medium">{po.po_number}</span>
                              <span className="text-xs text-muted-foreground">
                                {po.vendor?.vendor_name ?? ""}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedPO && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Linked to PO: {selectedPO.po_number}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="currency">Currency</Label>
                      <Input
                        id="currency"
                        value={form.currency}
                        onChange={(e) =>
                          updateField("currency", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="due_date">Due Date</Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={form.due_date}
                        onChange={(e) =>
                          updateField("due_date", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="po_number">PO Number</Label>
                    <Input
                      id="po_number"
                      value={form.po_number}
                      onChange={(e) =>
                        updateField("po_number", e.target.value)
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="currency">Currency</Label>
                      <Input
                        id="currency"
                        value={form.currency}
                        onChange={(e) =>
                          updateField("currency", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="po_date">PO Date</Label>
                      <Input
                        id="po_date"
                        type="date"
                        value={form.po_date}
                        onChange={(e) =>
                          updateField("po_date", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Vendor Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isInvoice ? (
                <>
                  <div className="space-y-1.5" ref={vendorRef}>
                    <Label htmlFor="vendor_name">Vendor Name</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="vendor_name"
                        value={vendorQuery}
                        onChange={(e) => handleVendorSearch(e.target.value)}
                        onFocus={() => {
                          if (vendorResults.length > 0) setShowVendorDropdown(true);
                        }}
                        placeholder="Search vendor…"
                        className="pl-8"
                      />
                      {showVendorDropdown && vendorResults.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {vendorResults.map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50"
                              onClick={() => selectVendor(v)}
                            >
                              <span className="font-medium">{v.vendor_name}</span>
                              {v.vendor_email && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  {v.vendor_email}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedVendor && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Selected: {selectedVendor.vendor_name}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="vendor_email">Email</Label>
                      <Input
                        id="vendor_email"
                        type="email"
                        value={form.vendor_email}
                        readOnly
                        className="bg-muted/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="vendor_phone">Phone</Label>
                      <Input
                        id="vendor_phone"
                        value={form.vendor_phone}
                        readOnly
                        className="bg-muted/30"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="vendor_address">Address</Label>
                    <Input
                      id="vendor_address"
                      value={form.vendor_address}
                      readOnly
                      className="bg-muted/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="vendor_tax_id">Tax / GST ID</Label>
                    <Input
                      id="vendor_tax_id"
                      value={form.vendor_tax_id}
                      readOnly
                      className="bg-muted/30"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="vendor_name">Vendor Name</Label>
                    <Input
                      id="vendor_name"
                      value={form.vendor_name}
                      onChange={(e) =>
                        updateField("vendor_name", e.target.value)
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="vendor_email">Email</Label>
                      <Input
                        id="vendor_email"
                        type="email"
                        value={form.vendor_email}
                        onChange={(e) =>
                          updateField("vendor_email", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="vendor_phone">Phone</Label>
                      <Input
                        id="vendor_phone"
                        value={form.vendor_phone}
                        onChange={(e) =>
                          updateField("vendor_phone", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="vendor_address">Address</Label>
                    <Input
                      id="vendor_address"
                      value={form.vendor_address}
                      onChange={(e) =>
                        updateField("vendor_address", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="vendor_tax_id">Tax / GST ID</Label>
                    <Input
                      id="vendor_tax_id"
                      value={form.vendor_tax_id}
                      onChange={(e) =>
                        updateField("vendor_tax_id", e.target.value)
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Line Items
                  <span className="ml-2 text-xs font-normal normal-case">
                    ({lineItems.length})
                  </span>
                </CardTitle>
                <Button variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Row
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y bg-muted/50">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground w-12">
                        #
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground w-24">
                        Code
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                        Description
                      </th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground w-20">
                        Qty
                      </th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground w-24">
                        Unit Price
                      </th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground w-24">
                        Total
                      </th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((li, idx) => (
                      <tr
                        key={idx}
                        className="border-b last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-3 py-1.5 text-muted-foreground tabular-nums">
                          {li.line_number}
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            value={li.item_code}
                            onChange={(e) =>
                              updateLineItem(idx, "item_code", e.target.value)
                            }
                            className="h-8 text-xs font-mono"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            value={li.item_description}
                            onChange={(e) =>
                              updateLineItem(
                                idx,
                                "item_description",
                                e.target.value,
                              )
                            }
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            type="number"
                            value={li.quantity}
                            onChange={(e) =>
                              updateLineItem(idx, "quantity", e.target.value)
                            }
                            className="h-8 text-xs text-right"
                            step="any"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            type="number"
                            value={li.unit_price}
                            onChange={(e) =>
                              updateLineItem(
                                idx,
                                "unit_price",
                                e.target.value,
                              )
                            }
                            className="h-8 text-xs text-right"
                            step="any"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            type="number"
                            value={li.total_price}
                            onChange={(e) =>
                              updateLineItem(
                                idx,
                                "total_price",
                                e.target.value,
                              )
                            }
                            className="h-8 text-xs text-right"
                            step="any"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <button
                            onClick={() => removeLineItem(idx)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="Remove row"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {lineItems.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center py-6 text-sm text-muted-foreground"
                        >
                          No line items. Click "Add Row" to add one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="subtotal">Subtotal</Label>
                  <Input
                    id="subtotal"
                    type="number"
                    value={form.subtotal}
                    onChange={(e) => updateField("subtotal", e.target.value)}
                    step="any"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tax_amount">Tax Amount</Label>
                  <Input
                    id="tax_amount"
                    type="number"
                    value={form.tax_amount}
                    onChange={(e) => updateField("tax_amount", e.target.value)}
                    step="any"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="discount_amount">Discount</Label>
                  <Input
                    id="discount_amount"
                    type="number"
                    value={form.discount_amount}
                    onChange={(e) =>
                      updateField("discount_amount", e.target.value)
                    }
                    step="any"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="total_amount">Total Amount</Label>
                  <Input
                    id="total_amount"
                    type="number"
                    value={form.total_amount}
                    onChange={(e) =>
                      updateField("total_amount", e.target.value)
                    }
                    step="any"
                    className="font-semibold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {score?.breakdown && score.breakdown.length > 0 && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Quality Score Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {score.breakdown.map((entry) => (
                    <div
                      key={entry.field}
                      className="flex items-center justify-between px-4 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {entry.actual_score === entry.max_score ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                        )}
                        <span className="text-foreground">{entry.field}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {entry.reason}
                        </span>
                        <span className="text-xs font-medium tabular-nums w-10 text-right">
                          {entry.actual_score}/{entry.max_score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <LoadingSpinner
                    size={16}
                    className="text-primary-foreground"
                  />
                  Submitting…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Review
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab label helper                                                  */
/* ------------------------------------------------------------------ */

function tabLabel(item: ExtractionResult): string {
  if (item.document_type === "invoice") {
    const num = item.extracted_data?.invoice_number;
    return num ? `INV ${num}` : `Invoice #${item.stored_record?.id}`;
  }
  const num = item.extracted_data?.po_number;
  return num ? `PO ${num}` : `PO #${item.stored_record?.id}`;
}

/* ------------------------------------------------------------------ */
/*  Main review page with tabs                                        */
/* ------------------------------------------------------------------ */

export function ReviewPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, loading, fetched } = useAppSelector((s) => s.review);
  const uploadResult = useAppSelector((s) => s.upload.result);

  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!fetched) {
      dispatch(fetchPendingReviews());
    }
  }, [dispatch, fetched]);

  useEffect(() => {
    if (uploadResult?.stored_record && !uploadResult.duplicate) {
      dispatch(addReviewItem(uploadResult));
    }
  }, [uploadResult, dispatch]);

  useEffect(() => {
    if (activeIdx >= items.length && items.length > 0) {
      setActiveIdx(items.length - 1);
    }
  }, [items.length, activeIdx]);

  const handleSubmitted = (item: ExtractionResult) => {
    dispatch(
      removeReviewItem({
        id: item.stored_record!.id,
        document_type: item.document_type,
      }),
    );
    dispatch(resetUpload());

    if (items.length <= 1) {
      navigate("/dashboard");
    }
  };

  if (loading && !fetched) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <LoadingSpinner size={32} />
        <p className="text-muted-foreground text-sm">
          Loading pending reviews…
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <CheckCircle2 className="h-12 w-12 text-emerald-500 opacity-60" />
        <p className="text-muted-foreground">
          No documents pending verification.
        </p>
        <Button variant="outline" onClick={() => navigate("/upload")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Upload a Document
        </Button>
      </div>
    );
  }

  const activeItem = items[activeIdx] ?? items[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/upload")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Human Verification
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {items.length} document{items.length !== 1 ? "s" : ""} pending
            review
          </p>
        </div>
      </div>

      {items.length > 1 && (
        <div className="flex gap-1 overflow-x-auto border-b pb-px">
          {items.map((item, idx) => {
            const isActive = idx === activeIdx;
            const isInv = item.document_type === "invoice";
            return (
              <button
                key={`${item.document_type}-${item.stored_record?.id}`}
                onClick={() => setActiveIdx(idx)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg border border-b-0 transition-colors ${
                  isActive
                    ? "bg-background text-foreground border-border -mb-px"
                    : "bg-muted/50 text-muted-foreground border-transparent hover:text-foreground hover:bg-muted"
                }`}
              >
                {isInv ? (
                  <FileText className="h-3.5 w-3.5" />
                ) : (
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                )}
                {tabLabel(item)}
              </button>
            );
          })}
        </div>
      )}

      <DocumentReviewForm
        key={`${activeItem.document_type}-${activeItem.stored_record?.id}`}
        item={activeItem}
        onSubmitted={() => handleSubmitted(activeItem)}
      />
    </div>
  );
}
