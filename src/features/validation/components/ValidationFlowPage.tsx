import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeMouseHandler,
  Position,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  getBezierPath,
  BaseEdge,
  Handle,
  type EdgeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { validationService } from "../services/validationService";
import type {
  FlowDataOut,
  FlowInvoiceBrief,
  FlowPOBrief,
  ValidationResultsOut,
  MappedItemPair,
} from "@/types/documents";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  ArrowLeft,
  FileText,
  FileSpreadsheet,
  Lock,
  Unlock,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

/* ── Helpers ──────────────────────────────────────────────── */

function fmtNum(val?: number | null): string {
  if (val == null) return "—";
  return val.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type MatchStatus = "full_match" | "mismatch" | "unmatched";

function deriveMatchStatus(pair: MappedItemPair): MatchStatus {
  const qtyMatch =
    pair.invoice_quantity == null ||
    pair.po_quantity == null ||
    pair.invoice_quantity === pair.po_quantity;
  const priceMatch =
    pair.invoice_unit_price == null ||
    pair.po_unit_price == null ||
    pair.invoice_unit_price === pair.po_unit_price;
  const totalMatch =
    pair.invoice_total_price == null ||
    pair.po_total_price == null ||
    pair.invoice_total_price === pair.po_total_price;

  if (qtyMatch && priceMatch && totalMatch) return "full_match";
  return "mismatch";
}

const STATUS_CONFIG: Record<MatchStatus, { color: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
  full_match: { color: "#10b981", bg: "bg-emerald-50/50 dark:bg-emerald-950/20", border: "border-emerald-300", icon: CheckCircle2 },
  mismatch: { color: "#f59e0b", bg: "bg-amber-50/50 dark:bg-amber-950/20", border: "border-amber-300", icon: AlertTriangle },
  unmatched: { color: "#ef4444", bg: "bg-red-50/50 dark:bg-red-950/20", border: "border-red-300", icon: XCircle },
};

/* ── Item Types ───────────────────────────────────────────── */

interface EnrichedItem {
  id: string;          // handle id
  sourceId: number;    // invoice_id or po_id
  docType: "invoice" | "po";
  item_code?: string;
  item_description?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  matchStatus: MatchStatus;
  pairIndex?: number;
  // For clicking to show detail sidebar
  onClick?: () => void;
  isSelected?: boolean;
}

/* ── Custom Animated Edge for Item-to-Item ────────────────── */

function ItemLinkedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isHighlighted = (data as any)?.highlighted;
  const color = (data as any)?.edgeColor ?? "#94a3b8";
  const dashed = (data as any)?.isMismatch;

  return (
    <>
      {isHighlighted && (
        <path
          d={edgePath}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeOpacity={0.2}
          style={{ pointerEvents: "none", transition: "all 0.3s ease" }}
        />
      )}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: isHighlighted ? color : (data as any)?.baseColor ?? "#cbd5e1",
          strokeWidth: isHighlighted ? 3 : 2,
          strokeDasharray: dashed ? "5, 5" : "none",
          transition: "all 0.3s ease",
        }}
      />
    </>
  );
}

const edgeTypes = {
  itemLinkedEdge: ItemLinkedEdge,
};

/* ── Node Common - Line Item Card ─────────────────────────── */

function LineItemNodeCard({ item }: { item: EnrichedItem }) {
  const cfg = STATUS_CONFIG[item.matchStatus];
  const Icon = cfg.icon;
  const isTarget = item.docType === "po";

  return (
    <div
      onClick={(e) => {
        // Stop prop so we don't trigger node select if handled
        if (item.onClick) {
          e.stopPropagation();
          item.onClick();
        }
      }}
      className={`
        relative mx-3 mb-2 p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all hover:shadow-md
        ${cfg.bg} ${item.isSelected ? `ring-2 ring-[${cfg.color}] shadow-md ${cfg.border}` : "border-slate-200 dark:border-slate-700"}
      `}
      style={{ borderLeftWidth: "4px", borderLeftColor: cfg.color }}
    >
      {/* Target Handle for PO on the LEFT */}
      {isTarget && (
        <Handle
          type="target"
          position={Position.Left}
          id={item.id}
          style={{ left: -10, top: "50%", background: cfg.color, width: 8, height: 8, border: "2px solid white" }}
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon className="h-3 w-3 shrink-0" style={{ color: cfg.color }} />
          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">
            {item.item_description || item.item_code || "—"}
          </p>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-500 font-mono">
            {fmtNum(item.quantity)} × {fmtNum(item.unit_price)}
          </span>
          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
            {fmtNum(item.total_price)}
          </span>
        </div>
      </div>

      {/* Source Handle for Invoice on the RIGHT */}
      {!isTarget && (
        <Handle
          type="source"
          position={Position.Right}
          id={item.id}
          style={{ right: -10, top: "50%", background: cfg.color, width: 8, height: 8, border: "2px solid white" }}
        />
      )}
    </div>
  );
}

/* ── Custom Node Components ───────────────────────────────── */

function InvoiceNode({
  data,
}: {
  data: FlowInvoiceBrief & {
    items: EnrichedItem[];
    highlighted: boolean;
  };
}) {
  return (
    <>
      <div
        className={`
          relative flex flex-col w-64 rounded-2xl border-2 shadow-md transition-all duration-300 bg-white dark:bg-slate-900 overflow-visible cursor-pointer
          ${data.highlighted
            ? "border-blue-500 ring-4 ring-blue-200/50 shadow-2xl z-30"
            : "border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:shadow-xl z-10"
          }
        `}
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-sky-400 flex-shrink-0 rounded-t-xl" />

        {/* Doc Header */}
        <div className="relative h-24 overflow-hidden bg-gradient-to-b from-slate-50 to-blue-50/30 flex items-center justify-center pointer-events-none group rounded-t-xl">
          <FileText className="h-8 w-8 text-blue-300 opacity-50" />
          <div className="absolute inset-x-0 bottom-0 px-3 py-2 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-900">
            <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100 truncate">
              {data.invoice_number || `INV-${data.id}`}
            </p>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-bold">
              {data.currency} {fmtNum(data.total_amount)}
            </p>
          </div>
        </div>

        {/* Line Items Container */}
        <div className="py-3 bg-white dark:bg-slate-900 rounded-b-xl max-h-[400px] overflow-y-auto w-full custom-scrollbar">
          <p className="px-3 pb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Line Items</p>
          {data.items.map((item) => (
            <LineItemNodeCard key={item.id} item={item} />
          ))}
          {data.items.length === 0 && (
            <p className="text-center text-xs text-slate-400 py-4">No items</p>
          )}
        </div>
      </div>
    </>
  );
}

function PONode({
  data,
}: {
  data: FlowPOBrief & {
    items: EnrichedItem[];
    highlighted: boolean;
  };
}) {
  return (
    <>
      <div
        className={`
          relative flex flex-col w-64 rounded-2xl border-2 shadow-md transition-all duration-300 bg-white dark:bg-slate-900 overflow-visible cursor-pointer
          ${data.highlighted
            ? "border-indigo-500 ring-4 ring-indigo-200/50 shadow-2xl z-30"
            : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:shadow-xl z-10"
          }
        `}
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-violet-400 flex-shrink-0 rounded-t-xl" />

        {/* Doc Header */}
        <div className="relative h-24 overflow-hidden bg-gradient-to-b from-slate-50 to-indigo-50/30 flex items-center justify-center pointer-events-none group rounded-t-xl">
          <FileSpreadsheet className="h-8 w-8 text-indigo-300 opacity-50" />
          <div className="absolute inset-x-0 bottom-0 px-3 py-2 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-900">
            <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100 truncate">
              {data.po_number || `PO-${data.id}`}
            </p>
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold">
              {data.currency} {fmtNum(data.total_amount)}
            </p>
          </div>
        </div>

        {/* Line Items Container */}
        <div className="py-3 bg-white dark:bg-slate-900 rounded-b-xl max-h-[400px] overflow-y-auto w-full custom-scrollbar">
          <p className="px-3 pb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Line Items</p>
          {data.items.map((item) => (
            <LineItemNodeCard key={item.id} item={item} />
          ))}
          {data.items.length === 0 && (
            <p className="text-center text-xs text-slate-400 py-4">No items</p>
          )}
        </div>
      </div>
    </>
  );
}

const nodeTypes = {
  invoiceNode: InvoiceNode,
  poNode: PONode,
};


/* ── Details Sidebar ──────────────────────────── */

function DetailsSidebar({
  selectedItemInfo,
  selectedDocument,
  onClose,
}: {
  selectedItemInfo: { pair: MappedItemPair | null, item: EnrichedItem, matchStatus: MatchStatus } | null;
  selectedDocument: { type: "inv" | "po", id: number } | null;
  onClose: () => void;
}) {
  if (!selectedItemInfo && !selectedDocument) return null;

  // Render Document Detail (if we still fall back, but we moved it to modal)
  if (selectedDocument) return null; // handled by DocumentDetailModal now

  // Render Item Detail
  const { pair, item, matchStatus } = selectedItemInfo!;
  const cfg = STATUS_CONFIG[matchStatus];
  const Icon = cfg.icon;

  const fields: { label: string; invVal: string; poVal: string; hasMismatch: boolean }[] = [];

  if (pair) {
    const qtyMismatch = pair.invoice_quantity !== pair.po_quantity;
    const priceMismatch = pair.invoice_unit_price !== pair.po_unit_price;
    const totalMismatch = pair.invoice_total_price !== pair.po_total_price;

    fields.push({ label: "Item Code", invVal: pair.invoice_item_code || "—", poVal: pair.po_item_code || "—", hasMismatch: false });
    fields.push({ label: "Description", invVal: pair.invoice_item_description || "—", poVal: pair.po_item_description || "—", hasMismatch: false });
    fields.push({ label: "Quantity", invVal: fmtNum(pair.invoice_quantity), poVal: fmtNum(pair.po_quantity), hasMismatch: qtyMismatch });
    fields.push({ label: "Unit Price", invVal: fmtNum(pair.invoice_unit_price), poVal: fmtNum(pair.po_unit_price), hasMismatch: priceMismatch });
    fields.push({ label: "Total Price", invVal: fmtNum(pair.invoice_total_price), poVal: fmtNum(pair.po_total_price), hasMismatch: totalMismatch });
  } else {
    // Unmatched item
    const isInv = item.docType === "invoice";
    fields.push({ label: "Item Code", invVal: isInv ? (item.item_code || "—") : "—", poVal: !isInv ? (item.item_code || "—") : "—", hasMismatch: false });
    fields.push({ label: "Description", invVal: isInv ? (item.item_description || "—") : "—", poVal: !isInv ? (item.item_description || "—") : "—", hasMismatch: false });
    fields.push({ label: "Quantity", invVal: isInv ? fmtNum(item.quantity) : "—", poVal: !isInv ? fmtNum(item.quantity) : "—", hasMismatch: false });
    fields.push({ label: "Unit Price", invVal: isInv ? fmtNum(item.unit_price) : "—", poVal: !isInv ? fmtNum(item.unit_price) : "—", hasMismatch: false });
    fields.push({ label: "Total Price", invVal: isInv ? fmtNum(item.total_price) : "—", poVal: !isInv ? fmtNum(item.total_price) : "—", hasMismatch: false });
  }

  return (
    <div className="absolute inset-y-0 right-0 w-[400px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: cfg.color }} />
          <div>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Item Details</span>
            <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: cfg.color }}>
              {matchStatus.replace("_", " ")}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <div className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">Field</div>
            <div className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider text-blue-500 text-center">Invoice</div>
            <div className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider text-indigo-500 text-center">PO</div>
          </div>
          {fields.map((f) => (
            <div key={f.label} className={`grid grid-cols-3 border-b border-slate-100 dark:border-slate-800 last:border-0 ${f.hasMismatch ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}`}>
              <div className="px-2 py-2 text-[10px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                {f.hasMismatch && <AlertTriangle className="h-2.5 w-2.5 text-amber-500" />} {f.label}
              </div>
              <div className={`px-2 py-2 text-[10px] font-mono text-center ${f.hasMismatch ? "text-amber-700 font-semibold" : "text-slate-700"}`}>{f.invVal}</div>
              <div className={`px-2 py-2 text-[10px] font-mono text-center ${f.hasMismatch ? "text-amber-700 font-semibold" : "text-slate-700"}`}>{f.poVal}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Document Full Modal ──────────────────────────────────── */

function DocumentDetailModal({
  selectedDocument,
  flowData,
  onClose,
}: {
  selectedDocument: { type: "inv" | "po", id: number } | null;
  flowData: FlowDataOut;
  onClose: () => void;
}) {
  if (!selectedDocument) return null;

  const isInv = selectedDocument.type === "inv";
  const docData: any = isInv 
    ? flowData.invoices.find(d => d.id === selectedDocument.id)
    : flowData.pos.find(d => d.id === selectedDocument.id);

  if (!docData) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 animate-in fade-in duration-200 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-6xl h-full flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isInv ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300" : "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300"}`}>
               {isInv ? <FileText className="h-5 w-5" /> : <FileSpreadsheet className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">
                {isInv ? docData.invoice_number || `Invoice #${docData.id}` : docData.po_number || `Purchase Order #${docData.id}`}
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                {docData.vendor_name || "Unknown Vendor"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right mr-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Amount</p>
              <p className="font-mono text-lg font-bold text-slate-800 dark:text-slate-100">{docData.currency} {fmtNum(docData.total_amount)}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-sm">
              <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>
        
        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-100 dark:bg-black/20">
          
          {/* Main Document Preview (90% width focus ideally, so flex-grow) */}
          <div className="flex-[3] flex flex-col p-4">
            <div className="flex-1 w-full bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden shadow-inner border border-slate-300 dark:border-slate-700 relative flex items-center justify-center">
              {docData.file_url ? (
                <iframe src={`${docData.file_url}#toolbar=1&navpanes=0`} className="w-full h-full border-0 block" title="Document Preview" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  {isInv ? <FileText className="h-16 w-16 mb-4 opacity-50" /> : <FileSpreadsheet className="h-16 w-16 mb-4 opacity-50" />}
                  <p className="text-sm font-medium">No Document Preview Available</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Metadata Sidebar Panel (smaller percentage) */}
          <div className="flex-1 max-w-[350px] p-4 pl-0 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 space-y-6">
              
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Document Details</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2">
                    <dt className="text-xs font-semibold text-slate-500">Status</dt>
                    <dd className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">{docData.status || "—"}</dd>
                  </div>
                  <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2">
                    <dt className="text-xs font-semibold text-slate-500">Date</dt>
                    <dd className="text-xs font-medium text-slate-800 dark:text-slate-200">{isInv ? docData.due_date || "—" : docData.po_date || "—"}</dd>
                  </div>
                  <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2">
                    <dt className="text-xs font-semibold text-slate-500">Currency</dt>
                    <dd className="text-xs font-medium text-slate-800 dark:text-slate-200">{docData.currency || "—"}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Financials</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2">
                    <dt className="text-xs font-semibold text-slate-500">Subtotal</dt>
                    <dd className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200">{fmtNum(docData.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2">
                    <dt className="text-xs font-semibold text-slate-500">Tax Amount</dt>
                    <dd className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200">{fmtNum(docData.tax_amount)}</dd>
                  </div>
                  <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2">
                    <dt className="text-xs font-semibold text-slate-500">Discount</dt>
                    <dd className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200">{fmtNum(docData.discount_amount)}</dd>
                  </div>
                  <div className="flex justify-between items-end pt-2">
                    <dt className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Total Amount</dt>
                    <dd className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">{fmtNum(docData.total_amount)}</dd>
                  </div>
                </dl>
              </div>
              
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

function FlowCanvas({
  flowData,
  resultsData,
}: {
  flowData: FlowDataOut;
  resultsData: ValidationResultsOut;
}) {
  const FLOW_EXTENT: [[number, number], [number, number]] = [[-1000, -1000], [2000, 2000]];

  const { setCenter } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isLayoutLocked, setIsLayoutLocked] = useState(false);
  const [loadingLayout, setLoadingLayout] = useState(true);

  const highlightedEdgeIds = useRef<Set<string>>(new Set());

  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<{type: "inv" | "po", id: number} | null>(null);

  const { docItemsMap, itemEdges, pairsList } = useMemo(() => {
    const map: Record<string, EnrichedItem[]> = {};
    const edgesArr: Edge[] = [];
    const pairs = resultsData.mapped_items || [];

    // Initialize map
    flowData.invoices.forEach(inv => map[`inv-${inv.id}`] = []);
    flowData.pos.forEach(po => map[`po-${po.id}`] = []);

    // Helper to add onClick
    const mkClick = (idStr: string) => () => {
       setSelectedItem((prev) => (prev === idStr ? null : idStr));
       setSelectedDocument(null);
    };

    const matchedInvItemIds = new Set(pairs.map(p => p.invoice_item_id));
    const matchedPoItemIds = new Set(pairs.map(p => p.po_item_id));

    // 1. Process mapped pairs
    pairs.forEach((pair, pairIndex) => {
      const status = deriveMatchStatus(pair);
      const invHandleId = `inv-item-${pair.invoice_item_id}`;
      const poHandleId = `po-item-${pair.po_item_id}`;

      // Push Invoice Item
      if (map[`inv-${pair.invoice_id}`]) {
        map[`inv-${pair.invoice_id}`].push({
          id: invHandleId,
          sourceId: pair.invoice_id,
          docType: "invoice",
          item_code: pair.invoice_item_code,
          item_description: pair.invoice_item_description,
          quantity: pair.invoice_quantity,
          unit_price: pair.invoice_unit_price,
          total_price: pair.invoice_total_price,
          matchStatus: status,
          pairIndex,
          onClick: mkClick(invHandleId),
        });
      }

      // Push PO Item
      if (map[`po-${pair.po_id}`]) {
        map[`po-${pair.po_id}`].push({
          id: poHandleId,
          sourceId: pair.po_id,
          docType: "po",
          item_code: pair.po_item_code,
          item_description: pair.po_item_description,
          quantity: pair.po_quantity,
          unit_price: pair.po_unit_price,
          total_price: pair.po_total_price,
          matchStatus: status,
          pairIndex,
          onClick: mkClick(poHandleId),
        });
      }

      // Create Edge connecting the handles
      if (map[`inv-${pair.invoice_id}`] && map[`po-${pair.po_id}`]) {
        const edgeId = `edge:item:${invHandleId}:${poHandleId}`;
        edgesArr.push({
          id: edgeId,
          source: `inv-${pair.invoice_id}`, // Note: the node ID
          target: `po-${pair.po_id}`,
          sourceHandle: invHandleId,        // The specific handle inside node
          targetHandle: poHandleId,
          type: "itemLinkedEdge",
          animated: false,
          data: {
            highlighted: false,
            edgeColor: STATUS_CONFIG[status].color,
            baseColor: status === "full_match" ? "#6ee7b7" : "#fcd34d", // lighter versions for base
            isMismatch: status === "mismatch",
            pairIndex,
          },
        });
      }
    });

    // 2. Process unmatched
    flowData.invoices.forEach(inv => {
      (inv.line_items || []).forEach(it => {
        if (!matchedInvItemIds.has(it.id)) {
          const id = `inv-item-${it.id}`;
          map[`inv-${inv.id}`].push({
            id,
            sourceId: inv.id,
            docType: "invoice",
            item_code: it.item_code,
            item_description: it.item_description,
            quantity: it.quantity,
            unit_price: it.unit_price,
            total_price: it.total_price,
            matchStatus: "unmatched",
            onClick: mkClick(id),
          });
        }
      });
    });

    flowData.pos.forEach(po => {
      (po.line_items || []).forEach(it => {
        if (!matchedPoItemIds.has(it.id)) {
          const id = `po-item-${it.id}`;
          map[`po-${po.id}`].push({
            id,
            sourceId: po.id,
            docType: "po",
            item_code: it.item_code,
            item_description: it.item_description,
            quantity: it.quantity,
            unit_price: it.unit_price,
            total_price: it.total_price,
            matchStatus: "unmatched",
            onClick: mkClick(id),
          });
        }
      });
    });

    return { docItemsMap: map, itemEdges: edgesArr, pairsList: pairs };
  }, [flowData, resultsData]);

  const initializeLayout = useCallback(
    (forceReset = false) => {
      setLoadingLayout(true);
      const STORAGE_KEY = `flow-layout-${flowData.group_id}`;
      const savedRaw = localStorage.getItem(STORAGE_KEY);
      const savedLayout = savedRaw && !forceReset ? JSON.parse(savedRaw) : null;

      if (savedLayout?.isLocked !== undefined && !forceReset) setIsLayoutLocked(savedLayout.isLocked);
      else if (forceReset) setIsLayoutLocked(false);

      const savedPositions = new Map<string, { x: number; y: number }>(savedLayout?.nodes?.map((n: any) => [n.id, n.position]) || []);

      const invCount = flowData.invoices.length;
      const poCount = flowData.pos.length;
      const maxCount = Math.max(invCount, poCount, 1);

      const X_INVOICE = 80;
      const X_PO = 680; // wider gap to fit the handles/edges better
      const Y_SPACING = 550; // taller gap because nodes are taller now
      const Y_START = 40;

      const invYStart = Y_START + ((maxCount - invCount) * Y_SPACING) / 2;
      const poYStart = Y_START + ((maxCount - poCount) * Y_SPACING) / 2;

      const initNodes: Node[] = [];

      flowData.invoices.forEach((inv, i) => {
        const id = `inv-${inv.id}`;
        const pos = savedPositions.get(id) || { x: X_INVOICE, y: invYStart + i * Y_SPACING };
        initNodes.push({
          id,
          type: "invoiceNode",
          position: pos,
          data: {
            ...inv,
            items: docItemsMap[id] || [],
            highlighted: false,
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
      });

      flowData.pos.forEach((po, i) => {
        const id = `po-${po.id}`;
        const pos = savedPositions.get(id) || { x: X_PO, y: poYStart + i * Y_SPACING };
        initNodes.push({
          id,
          type: "poNode",
          position: pos,
          data: {
            ...po,
            items: docItemsMap[id] || [],
            highlighted: false,
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
      });

      setNodes(initNodes);
      setEdges(itemEdges);
      setLoadingLayout(false);
    },
    [flowData, docItemsMap, itemEdges, setNodes, setEdges]
  );

  useEffect(() => {
    initializeLayout(false);
  }, [initializeLayout]);

  // Sync selected item into node data
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        const newItems = ((n.data as any).items as EnrichedItem[]).map((it) => ({
          ...it,
          isSelected: it.id === selectedItem,
        }));
        
        return {
          ...n,
          data: {
            ...n.data,
            items: newItems,
          },
        };
      })
    );

    // highlight edges for the selected item if it belongs to a pair
    setEdges((eds) => 
      eds.map((e) => {
        const edgePairIdx = (e.data as any).pairIndex;
        let isHl = false;
        if (selectedItem) {
           const match = Object.values(docItemsMap).flat().find(i => i.id === selectedItem);
           if (match && match.pairIndex === edgePairIdx) isHl = true;
        }

        return {
          ...e,
          animated: isHl,
          data: {
            ...e.data,
            highlighted: isHl,
          },
          style: {
            ...e.style,
            strokeWidth: isHl ? 3 : 2,
            opacity: selectedItem ? (isHl ? 1 : 0.15) : 1, // dim others if something is selected
          }
        };
      })
    );
  }, [selectedItem, docItemsMap, setNodes, setEdges]);

  // Detail sidebar data
  const selectedItemInfo = useMemo(() => {
    if (!selectedItem) return null;
    const item = Object.values(docItemsMap).flat().find((i) => i.id === selectedItem);
    if (!item) return null;
    return {
      item,
      pair: item.pairIndex !== undefined ? pairsList[item.pairIndex] : null,
      matchStatus: item.matchStatus,
    };
  }, [selectedItem, docItemsMap, pairsList]);


  const saveLayout = useCallback(
    (lockedState: boolean, currentNodes: Node[]) => {
      const STORAGE_KEY = `flow-layout-${flowData.group_id}`;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          isLocked: lockedState,
          nodes: currentNodes.map((n) => ({ id: n.id, position: n.position })),
        })
      );
    },
    [flowData.group_id]
  );

  const handleToggleLock = () => {
    const newLock = !isLayoutLocked;
    setIsLayoutLocked(newLock);
    saveLayout(newLock, nodes);
  };

  const handleResetLayout = () => {
    const STORAGE_KEY = `flow-layout-${flowData.group_id}`;
    localStorage.removeItem(STORAGE_KEY);
    highlightedEdgeIds.current = new Set();
    setSelectedItem(null);
    setSelectedDocument(null);
    initializeLayout(true);
  };

  const onNodeClick: NodeMouseHandler = useCallback(
    (_e, node) => {
      setSelectedItem(null);
      const isInv = node.type === "invoiceNode";
      setSelectedDocument({ type: isInv ? "inv" : "po", id: (node.data as any).id });
      setCenter(node.position.x + 128, node.position.y + 160, { zoom: 1.1, duration: 500 });
    },
    [setCenter]
  );

  const onPaneClick = useCallback(() => {
    setSelectedItem(null);
    setSelectedDocument(null);
  }, []);

  const handleNodeDragStop = useCallback(
    (_e: React.MouseEvent, _node: Node, currentNodes: Node[]) => {
      if (!isLayoutLocked) saveLayout(false, currentNodes);
    },
    [isLayoutLocked, saveLayout]
  );

  if (loadingLayout)
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size={32} />
      </div>
    );

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDragStop={handleNodeDragStop}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.35 }}
        minZoom={0.2}
        maxZoom={1.6}
        nodeExtent={FLOW_EXTENT}
        translateExtent={FLOW_EXTENT}
        nodesDraggable={!isLayoutLocked}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#cbd5e1" gap={24} size={1} />
        <Controls showInteractive={false} className="!bg-white !border !shadow-lg !rounded-xl" />
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(node) => (node.type === "invoiceNode" ? "#3b82f6" : "#6366f1")}
          maskColor="rgba(0,0,0,0.06)"
          className="!bg-white/90 !border !rounded-xl !shadow-lg"
          pannable
          zoomable
        />

        {/* Legend */}
        <Panel position="top-left" className="!m-4">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-3 space-y-2 pointer-events-none min-w-[140px]">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Match Legend</p>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Full Match</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Quantity/Price Diff</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">No Match</span>
            </div>
          </div>
        </Panel>

        {/* Layout controls */}
        <Panel position="top-right" className="!m-4">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg flex items-center p-1.5 gap-1">
            <Button
              variant={isLayoutLocked ? "default" : "secondary"}
              size="sm"
              className={`h-8 px-3 text-xs w-36 justify-start font-semibold ${isLayoutLocked ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
              onClick={handleToggleLock}
            >
              {isLayoutLocked ? <Lock className="h-3.5 w-3.5 mr-1.5" /> : <Unlock className="h-3.5 w-3.5 mr-1.5" />}
              {isLayoutLocked ? "Layout Locked" : "Save Layout"}
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 text-muted-foreground border-transparent hover:border-border" onClick={handleResetLayout} title="Reset to Auto Layout">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Panel>
      </ReactFlow>
      
      {/* Details Sidebar overlay */}
      <DetailsSidebar
        selectedItemInfo={selectedItemInfo}
        selectedDocument={selectedDocument}
        onClose={() => { setSelectedItem(null); setSelectedDocument(null); }}
      />
      
      {/* Modal Overlay for Full Document Details */}
      <DocumentDetailModal
        selectedDocument={selectedDocument}
        flowData={flowData}
        onClose={() => setSelectedDocument(null)}
      />
    </>
  );
}

/* ── Main Component ───────────────────────────────────────── */

export function ValidationFlowPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  const [flowData, setFlowData] = useState<FlowDataOut | null>(null);
  const [resultsData, setResultsData] = useState<ValidationResultsOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) return;
    const doFetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const [flow, results] = await Promise.all([
          validationService.getFlowData(Number(groupId)),
          validationService.getGroupResults(Number(groupId)),
        ]);
        setFlowData(flow);
        setResultsData(results);
      } catch (err: unknown) {
        const msg = (err as any).response?.data?.detail ?? (err instanceof Error ? err.message : "Failed to load flow data");
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    void doFetch();
  }, [groupId]);

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size={32} /></div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!flowData || !resultsData) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white dark:bg-card flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Line-Item Mapping — Group #{flowData.group_id}</h1>
            <p className="text-xs text-muted-foreground">
              {flowData.invoices.length} Invoices · {flowData.pos.length} POs · {resultsData.mapped_items?.length || 0} valid matches
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 relative bg-slate-50 overflow-hidden">
        <ReactFlowProvider>
          <FlowCanvas
            flowData={flowData}
            resultsData={resultsData}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
}