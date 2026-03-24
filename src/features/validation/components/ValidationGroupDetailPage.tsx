import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { validationService } from "../services/validationService";
import type { ValidationResultsOut, DiscrepancyOut, MergedItem, MappedItemPair, InvoiceBrief, POBrief } from "@/types/documents";
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
  Link2,
  ArrowUp,
  ChevronDown,
  Users,
  Hash,
  Mail,
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

/* ─── Section 2: Unmatched Items ──────────────────────────── */

function UnmatchedItemsSection({
  invoiceItems,
  poItems,
  mappedItems,
}: {
  invoiceItems: MergedItem[];
  poItems: MergedItem[];
  mappedItems: MappedItemPair[];
}) {
  // Derive unmatched items: items from merged lists that don't appear in any mapped pair
  const matchedInvKeys = new Set(
    mappedItems.map((m) => `${m.invoice_item_code ?? ""}::${m.invoice_item_description ?? ""}`)
  );
  const matchedPoKeys = new Set(
    mappedItems.map((m) => `${m.po_item_code ?? ""}::${m.po_item_description ?? ""}`)
  );

  const unmatchedInv = invoiceItems.filter(
    (it) => !matchedInvKeys.has(`${it.item_code ?? ""}::${it.item_description ?? ""}`)
  );
  const unmatchedPo = poItems.filter(
    (it) => !matchedPoKeys.has(`${it.item_code ?? ""}::${it.item_description ?? ""}`)
  );

  if (unmatchedInv.length === 0 && unmatchedPo.length === 0) {
    return (
      <Card className="border shadow-sm bg-white dark:bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <XCircle className="h-4 w-4 text-muted-foreground" />
            Unmatched Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            <p className="text-sm font-medium">All items are matched — no unmatched items found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm bg-white dark:bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <XCircle className="h-4 w-4 text-red-500" />
          Unmatched Items
          <span className="ml-auto text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-0.5 rounded-full">
            {unmatchedInv.length + unmatchedPo.length} item{unmatchedInv.length + unmatchedPo.length !== 1 ? "s" : ""}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Unmatched Invoice Items */}
        {unmatchedInv.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <FileText className="h-4 w-4 text-blue-500" />
              Invoice Items Not Found in PO
              <span className="ml-auto text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full">
                {unmatchedInv.length}
              </span>
            </div>
            <div className="rounded-lg border border-red-200 dark:border-red-800/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-red-50/50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-800/50">
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Item</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">Qty</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">Unit Price</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {unmatchedInv.map((it, idx) => (
                    <tr key={idx} className="border-b last:border-0 hover:bg-red-50/30 dark:hover:bg-red-950/10 transition-colors">
                      <td className="px-4 py-2.5 font-medium">
                        <div className="flex items-center gap-1.5">
                          <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                          <span>{it.item_description || it.item_code || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">{fmtNum(it.quantity)}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{fmtNum(it.unit_price)}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{fmtNum(it.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Unmatched PO Items */}
        {unmatchedPo.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <FileSpreadsheet className="h-4 w-4 text-indigo-500" />
              PO Items Not Found in Invoice
              <span className="ml-auto text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full">
                {unmatchedPo.length}
              </span>
            </div>
            <div className="rounded-lg border border-red-200 dark:border-red-800/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-red-50/50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-800/50">
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Item</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">Qty</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">Unit Price</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {unmatchedPo.map((it, idx) => (
                    <tr key={idx} className="border-b last:border-0 hover:bg-red-50/30 dark:hover:bg-red-950/10 transition-colors">
                      <td className="px-4 py-2.5 font-medium">
                        <div className="flex items-center gap-1.5">
                          <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                          <span>{it.item_description || it.item_code || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono">{fmtNum(it.quantity)}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{fmtNum(it.unit_price)}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{fmtNum(it.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Section 2b: Mapped Item Pairs ──────────────────────── */

function MappedItemsTable({ mappedItems }: { mappedItems: MappedItemPair[] }) {
  if (mappedItems.length === 0) {
    return (
      <Card className="border shadow-sm bg-white dark:bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4 text-primary" />
            Matched Item Pairs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Info className="h-5 w-5" />
            <p className="text-sm">No item-level mappings available yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-sm bg-white dark:bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="h-4 w-4 text-primary" />
          Matched Item Pairs
          <span className="ml-auto text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-0.5 rounded-full">
            {mappedItems.length} pair{mappedItems.length !== 1 ? "s" : ""}
          </span>
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
                    Invoice Item
                  </span>
                </th>
                <th colSpan={4} className="text-center px-4 py-2.5 font-semibold text-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    PO Item
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
              {mappedItems.map((m) => {
                const qtyMismatch = m.invoice_quantity != null && m.po_quantity != null && m.invoice_quantity !== m.po_quantity;
                const priceMismatch = m.invoice_unit_price != null && m.po_unit_price != null && m.invoice_unit_price !== m.po_unit_price;
                const totalMismatch = m.invoice_total_price != null && m.po_total_price != null && m.invoice_total_price !== m.po_total_price;
                const allMatch = !qtyMismatch && !priceMismatch && !totalMismatch;

                return (
                  <tr
                    key={m.link_id}
                    className={`border-b last:border-0 transition-colors ${allMatch
                      ? "hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10"
                      : "bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/50"
                      }`}
                  >
                    {/* Invoice side */}
                    <td className="px-4 py-2.5 font-medium">
                      <div className="flex items-center gap-1.5">
                        {allMatch ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        )}
                        <span>{m.invoice_item_description || m.invoice_item_code || "—"}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-2.5 text-right font-mono ${qtyMismatch ? "text-amber-600 font-semibold bg-amber-50/50 dark:bg-amber-950/20" : ""}`}>
                      {fmtNum(m.invoice_quantity)}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-mono ${priceMismatch ? "text-red-600 font-semibold bg-red-50/50 dark:bg-red-950/20" : ""}`}>
                      {fmtNum(m.invoice_unit_price)}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-mono border-r ${totalMismatch ? "text-red-600 font-semibold bg-red-50/50 dark:bg-red-950/20" : ""}`}>
                      {fmtNum(m.invoice_total_price)}
                    </td>

                    {/* PO side */}
                    <td className="px-4 py-2.5 font-medium">
                      {m.po_item_description || m.po_item_code || "—"}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-mono ${qtyMismatch ? "text-amber-600 font-semibold bg-amber-50/50 dark:bg-amber-950/20" : ""}`}>
                      {fmtNum(m.po_quantity)}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-mono ${priceMismatch ? "text-red-600 font-semibold bg-red-50/50 dark:bg-red-950/20" : ""}`}>
                      {fmtNum(m.po_unit_price)}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-mono ${totalMismatch ? "text-red-600 font-semibold bg-red-50/50 dark:bg-red-950/20" : ""}`}>
                      {fmtNum(m.po_total_price)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t bg-muted/20 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Match</span>
          <span className="inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-500" /> Discrepancy</span>
          <span className="ml-auto">
            <span className="inline-block w-3 h-3 rounded-sm bg-amber-50 border border-amber-200 mr-1 align-middle" /> Qty mismatch
            <span className="inline-block w-3 h-3 rounded-sm bg-red-50 border border-red-200 ml-3 mr-1 align-middle" /> Price / Total mismatch
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Section 2c: Document Totals Comparison ─────────────── */

function DocumentTotalsCard({ data }: { data: ValidationResultsOut }) {
  // Aggregate financial fields across all invoices and POs
  const invSubtotal = data.invoices.reduce((s, inv) => s + (inv.subtotal ?? 0), 0);
  const invTax = data.invoices.reduce((s, inv) => s + (inv.tax_amount ?? 0), 0);
  const invDiscount = data.invoices.reduce((s, inv) => s + (inv.discount_amount ?? 0), 0);
  const invTotal = data.invoices.reduce((s, inv) => s + (inv.total_amount ?? 0), 0);

  const poSubtotal = data.pos.reduce((s, po) => s + (po.subtotal ?? 0), 0);
  const poTax = data.pos.reduce((s, po) => s + (po.tax_amount ?? 0), 0);
  const poDiscount = data.pos.reduce((s, po) => s + (po.discount_amount ?? 0), 0);
  const poTotal = data.pos.reduce((s, po) => s + (po.total_amount ?? 0), 0);

  // Determine which rows have data (show only if at least one side has a nonzero value)
  const hasSubtotal = invSubtotal !== 0 || poSubtotal !== 0;
  const hasTax = invTax !== 0 || poTax !== 0;
  const hasDiscount = invDiscount !== 0 || poDiscount !== 0;

  const rows: { label: string; invVal: number; poVal: number; isBold?: boolean }[] = [];
  if (hasSubtotal) rows.push({ label: "Subtotal", invVal: invSubtotal, poVal: poSubtotal });
  if (hasTax) rows.push({ label: "Tax", invVal: invTax, poVal: poTax });
  if (hasDiscount) rows.push({ label: "Discount", invVal: invDiscount, poVal: poDiscount });
  rows.push({ label: "Total", invVal: invTotal, poVal: poTotal, isBold: true });

  const totalMatch = Math.abs(invTotal - poTotal) < 0.01;

  return (
    <Card className="border shadow-sm bg-white dark:bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowRightLeft className="h-4 w-4 text-primary" />
          Financial Comparison
          {totalMatch ? (
            <Badge variant="success" className="ml-auto text-xs">MATCH</Badge>
          ) : (
            <Badge variant="destructive" className="ml-auto text-xs">MISMATCH</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y bg-muted/50">
                <th className="text-left px-5 py-2.5 font-semibold text-foreground w-[200px]"></th>
                <th className="text-right px-5 py-2.5 font-semibold text-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    Invoices ({data.invoices.length})
                  </span>
                </th>
                <th className="text-right px-5 py-2.5 font-semibold text-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    POs ({data.pos.length})
                  </span>
                </th>
                <th className="text-right px-5 py-2.5 font-semibold text-foreground w-[140px]">Difference</th>
                <th className="text-center px-4 py-2.5 font-semibold text-foreground w-[80px]">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const diff = row.invVal - row.poVal;
                const match = Math.abs(diff) < 0.01;
                return (
                  <tr
                    key={row.label}
                    className={`border-b last:border-0 transition-colors ${row.isBold
                      ? match
                        ? "bg-emerald-50/40 dark:bg-emerald-950/10"
                        : "bg-red-50/40 dark:bg-red-950/10"
                      : "hover:bg-muted/30"
                      }`}
                  >
                    <td className={`px-5 py-3 ${row.isBold ? "font-bold text-foreground" : "font-medium text-muted-foreground"}`}>
                      {row.label}
                    </td>
                    <td className={`px-5 py-3 text-right font-mono ${row.isBold ? "font-bold text-base" : ""}`}>
                      {fmtNum(row.invVal)}
                    </td>
                    <td className={`px-5 py-3 text-right font-mono ${row.isBold ? "font-bold text-base" : ""}`}>
                      {fmtNum(row.poVal)}
                    </td>
                    <td className={`px-5 py-3 text-right font-mono ${match ? "text-muted-foreground" : "text-red-600 dark:text-red-400 font-semibold"
                      }`}>
                      {match ? "—" : (diff > 0 ? "+" : "") + fmtNum(diff)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {match ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Section: Document Mapping (Invoice ↔ PO) ───────────── */

function DocumentMappingCard({
  invoices,
  pos,
}: {
  invoices: InvoiceBrief[];
  pos: POBrief[];
}) {
  return (
    <Card className="border shadow-sm bg-white dark:bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-primary" />
          Documents in This Validation
          <span className="ml-auto text-sm font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-0.5 rounded-full">
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} &middot; {pos.length} PO{pos.length !== 1 ? "s" : ""}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Invoices */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <FileText className="h-4 w-4 text-blue-500" />
              Invoices
            </div>
            <div className="space-y-2">
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoices in this group.</p>
              ) : (
                invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="rounded-lg border bg-blue-50/30 dark:bg-blue-950/10 border-blue-200/60 dark:border-blue-800/40 p-3 transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
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
                ))
              )}
            </div>
          </div>

          {/* POs */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <FileSpreadsheet className="h-4 w-4 text-indigo-500" />
              Purchase Orders
            </div>
            <div className="space-y-2">
              {pos.length === 0 ? (
                <p className="text-sm text-muted-foreground">No purchase orders in this group.</p>
              ) : (
                pos.map((po) => (
                  <div
                    key={po.id}
                    className="rounded-lg border bg-indigo-50/30 dark:bg-indigo-950/10 border-indigo-200/60 dark:border-indigo-800/40 p-3 transition-colors hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20"
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
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Section 3: Discrepancy List ─────────────────────────── */

function DiscrepancyList({ discrepancies }: { discrepancies: DiscrepancyOut[] }) {
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());

  const toggleExpand = (index: number) => {
    setExpandedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

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
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Discrepancies
          <span className="ml-auto text-sm font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-0.5 rounded-full">
            {discrepancies.length} issue{discrepancies.length !== 1 ? "s" : ""}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {discrepancies.map((d, idx) => {
          const cfg = severityConfig(d.severity);
          const Icon = cfg.icon;
          const isExpanded = expandedIndices.has(idx);

          return (
            <div
              key={idx}
              className={`rounded-xl border ${cfg.border} overflow-hidden bg-white dark:bg-card transition-all duration-200 ${isExpanded ? 'shadow-md ring-1 ring-black/5 dark:ring-white/10' : 'hover:shadow-sm'}`}
            >
              {/* Summary Header (Always Visible) */}
              <div
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer transition-colors ${cfg.bg} hover:bg-black/[0.02] dark:hover:bg-white/[0.02]`}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                aria-controls={`discrepancy-panel-${idx}`}
                onClick={() => toggleExpand(idx)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleExpand(idx);
                  }
                }}
              >
                <div className="flex items-center gap-3 shrink-0">
                  <div className={`p-2 rounded-full bg-white dark:bg-black/20 shadow-sm ${cfg.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant={cfg.badge} className="px-2 py-0.5 text-xs uppercase tracking-wider font-semibold">
                    {d.severity}
                  </Badge>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-1">
                    <span className={`text-base font-bold tracking-tight ${cfg.color}`}>
                      {d.discrepancy_type.replace(/_/g, " ")}
                    </span>
                    <p className="text-sm text-muted-foreground truncate" title={d.message}>
                      {d.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 mt-2 sm:mt-0">
                  <div className="flex items-center gap-4 text-sm whitespace-nowrap hidden lg:flex">
                    {d.invoice_value && (
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-muted-foreground font-semibold">Invoice</span>
                        <span className="font-mono font-medium">{d.invoice_value}</span>
                      </div>
                    )}
                    {d.po_value && (
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-muted-foreground font-semibold">PO</span>
                        <span className="font-mono font-medium">{d.po_value}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20" height="20"
                      viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className={`text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Expanded Details Section */}
              <div
                id={`discrepancy-panel-${idx}`}
                className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 border-t border-border/50' : 'grid-rows-[0fr] opacity-0'}`}
              >
                <div className="overflow-hidden">
                  <div className="p-4 sm:p-5 space-y-6">

                    {/* Message (Full Text) */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Error Details</h4>
                      <p className="text-sm font-medium leading-relaxed text-foreground">
                        {d.message}
                      </p>
                    </div>

                    {/* Side-by-side Comparison */}
                    {(d.invoice_value || d.po_value) && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Value Comparison</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Invoice Card */}
                          <div className="rounded-lg border bg-slate-50/50 dark:bg-slate-900/20 p-4 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-slate-400/50"></div>
                            <div className="flex items-center gap-2 mb-2 text-slate-600 dark:text-slate-400">
                              <FileText className="h-4 w-4" />
                              <span className="text-xs font-bold uppercase tracking-wide">Invoice Record</span>
                            </div>
                            <div className="font-mono text-lg font-semibold tracking-tight break-all">
                              {d.invoice_value || "—"}
                            </div>
                          </div>

                          {/* PO Card */}
                          <div className="rounded-lg border bg-slate-50/50 dark:bg-slate-900/20 p-4 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-slate-400/50"></div>
                            <div className="flex items-center gap-2 mb-2 text-slate-600 dark:text-slate-400">
                              <FileSpreadsheet className="h-4 w-4" />
                              <span className="text-xs font-bold uppercase tracking-wide">PO Record</span>
                            </div>
                            <div className="font-mono text-lg font-semibold tracking-tight break-all">
                              {d.po_value || "—"}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Explanation — Collapsible */}
                    {d.ai_explanation && (
                      <div className="space-y-2">
                        <details className="group rounded-lg bg-blue-50/40 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/30 overflow-hidden">
                          <summary className="flex items-center gap-1.5 cursor-pointer p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors select-none list-none [&::-webkit-details-marker]:hidden">
                            <Lightbulb className="h-3.5 w-3.5 text-blue-500" />
                            AI Analysis & Suggestion
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14" height="14"
                              viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                              className="ml-auto transition-transform duration-200 group-open:rotate-180"
                            >
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </summary>
                          <div className="px-4 pb-4">
                            <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed whitespace-pre-wrap">
                              {d.ai_explanation}
                            </p>
                          </div>
                        </details>
                      </div>
                    )}

                  </div>
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
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Track scroll position for back-to-top button
  const handleScroll = useCallback(() => {
    // The scrollable container is the <main> element
    const main = document.getElementById("main-content");
    if (main) {
      setShowBackToTop(main.scrollTop > 400);
    }
  }, []);

  useEffect(() => {
    const main = document.getElementById("main-content");
    if (main) {
      main.addEventListener("scroll", handleScroll, { passive: true });
      return () => main.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const scrollToTop = () => {
    const main = document.getElementById("main-content");
    main?.scrollTo({ top: 0, behavior: "smooth" });
  };

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
    <div className="space-y-6 max-w-7xl mx-auto relative">
      {/* Header */}
      <div className="flex items-center gap-4" id="vd-top">
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
        <div className="ml-auto flex items-center gap-2">
          {!data.accepted_for_payment && (
            <Button
              variant="outline"
              onClick={() => navigate(`/acceptance/${data.group_id}`)}
            >
              <CheckCircle2 className="h-4 w-4" />
              Accept for Payment
            </Button>
          )}
          <Button onClick={() => navigate(`/validation/${data.group_id}/send-mail`)}>
            <Mail className="h-4 w-4" />
            Send Mail
          </Button>
        </div>
      </div>

      {/* Section quick-nav */}
      <nav aria-label="Page sections" className="flex flex-wrap gap-2">
        {[
          { id: "vd-summary", label: "Summary" },
          { id: "vd-documents", label: "Documents" },
          { id: "vd-totals", label: "Financials" },
          { id: "vd-mapped", label: "Matched Pairs" },
          { id: "vd-unmatched", label: "Unmatched" },
          { id: "vd-discrepancies", label: "Discrepancies" },
          { id: "vd-suggestions", label: "AI Suggestions" },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ChevronDown className="h-3 w-3" />
            {s.label}
          </button>
        ))}
      </nav>

      {/* Section 1 — Validation Summary */}
      <div id="vd-summary">
        <ValidationSummaryCard data={data} />
      </div>

      {/* Section — Documents in this Validation */}
      <div id="vd-documents">
        <DocumentMappingCard invoices={data.invoices} pos={data.pos} />
      </div>

      {/* Section — Financial Comparison */}
      <div id="vd-totals">
        <DocumentTotalsCard data={data} />
      </div>

      {/* Section — Matched Item Pairs */}
      <div id="vd-mapped">
        <MappedItemsTable mappedItems={data.mapped_items ?? []} />
      </div>

      {/* Section — Unmatched Items */}
      <div id="vd-unmatched">
        <UnmatchedItemsSection
          invoiceItems={data.merged_invoice_items}
          poItems={data.merged_po_items}
          mappedItems={data.mapped_items ?? []}
        />
      </div>

      {/* Section — Discrepancies */}
      <div id="vd-discrepancies">
        <DiscrepancyList discrepancies={data.discrepancies} />
      </div>

      {/* Section — AI Suggestions */}
      <div id="vd-suggestions">
        <AISuggestionsCard
          summary={data.ai_summary}
          suggestions={data.ai_suggestions}
        />
      </div>

      {/* Back to top floating button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-40 flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-200 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${showBackToTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        aria-label="Back to top"
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </div>
  );
}
