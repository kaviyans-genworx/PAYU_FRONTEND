import sys

def rewrite():
    try:
        with open('frontend/src/features/validation/components/ValidationFlowPage.tsx', 'r') as f:
            content = f.read()

        # 1. IMPORTS
        old_imports_1 = """import {
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
  NodeToolbar,
  getBezierPath,
  BaseEdge,
  Handle,
  type EdgeProps,
} from "@xyflow/react";"""
        new_imports_1 = """import {
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
} from "@xyflow/react";"""
        if old_imports_1 in content:
            content = content.replace(old_imports_1, new_imports_1)
            
        old_imports_2 = """import {
  ArrowLeft,
  FileText,
  FileSpreadsheet,
  Lock,
  Unlock,
  RefreshCw,
  ExternalLink,
  GitCompare,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";"""
        new_imports_2 = """import {
  ArrowLeft,
  FileText,
  FileSpreadsheet,
  Lock,
  Unlock,
  RefreshCw,
  ExternalLink,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";"""
        if old_imports_2 in content:
            content = content.replace(old_imports_2, new_imports_2)

        # 2. COMPARE STATE INTERFACE
        old_compare_state = """/* ── Compare Selection Context ────────────────────────────── */

interface CompareState {
  mode: "idle" | "selecting" | "viewing";
  selectedInvoices: Set<number>;
  selectedPOs: Set<number>;
}"""
        if old_compare_state in content:
            content = content.replace(old_compare_state, "")

        # 3. NODE COMPONENTS
        # InvoiceNode
        old_inv_node_props = """data: FlowInvoiceBrief & {
    items: EnrichedItem[];
    highlighted: boolean;
    onCompare: (id: number) => void;
    compareMode: boolean;
    compareSelected: boolean;
  };"""
        new_inv_node_props = """data: FlowInvoiceBrief & {
    items: EnrichedItem[];
    highlighted: boolean;
  };"""
        content = content.replace(old_inv_node_props, new_inv_node_props)

        old_inv_toolbar = """<NodeToolbar
        isVisible={data.highlighted && !data.compareMode}
        position={Position.Top}
        className="flex gap-1.5"
      >
        <Button
          size="sm"
          className="h-7 shadow-xl bg-blue-600 hover:bg-blue-700 text-white rounded-full px-3 font-semibold text-[11px]"
          onClick={() => navigate(`/invoices/${data.id}`)}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          View Full
        </Button>
        <Button
          size="sm"
          className="h-7 shadow-xl bg-slate-700 hover:bg-slate-800 text-white rounded-full px-3 font-semibold text-[11px]"
          onClick={() => data.onCompare(data.id)}
        >
          <GitCompare className="h-3 w-3 mr-1" />
          Compare
        </Button>
      </NodeToolbar>"""
        content = content.replace(old_inv_toolbar, "")

        old_inv_border = """          ${data.compareSelected
            ? "border-blue-400 ring-4 ring-blue-300/60 shadow-2xl z-30"
            : data.highlighted
            ? "border-blue-500 ring-4 ring-blue-200/50 shadow-2xl z-30"
            : "border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:shadow-xl z-10"
          }"""
        new_inv_border = """          ${data.highlighted
            ? "border-blue-500 ring-4 ring-blue-200/50 shadow-2xl z-30"
            : "border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:shadow-xl z-10"
          }"""
        content = content.replace(old_inv_border, new_inv_border)

        # PONode
        old_po_node_props = """data: FlowPOBrief & {
    items: EnrichedItem[];
    highlighted: boolean;
    onCompare: (id: number) => void;
    compareMode: boolean;
    compareSelected: boolean;
  };"""
        new_po_node_props = """data: FlowPOBrief & {
    items: EnrichedItem[];
    highlighted: boolean;
  };"""
        content = content.replace(old_po_node_props, new_po_node_props)

        old_po_toolbar = """<NodeToolbar
        isVisible={data.highlighted && !data.compareMode}
        position={Position.Top}
        className="flex gap-1.5"
      >
        <Button
          size="sm"
          className="h-7 shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-3 font-semibold text-[11px]"
          onClick={() => navigate(`/purchase-orders/${data.id}`)}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          View Full
        </Button>
        <Button
          size="sm"
          className="h-7 shadow-xl bg-slate-700 hover:bg-slate-800 text-white rounded-full px-3 font-semibold text-[11px]"
          onClick={() => data.onCompare(data.id)}
        >
          <GitCompare className="h-3 w-3 mr-1" />
          Compare
        </Button>
      </NodeToolbar>"""
        content = content.replace(old_po_toolbar, "")

        old_po_border = """          ${data.compareSelected
            ? "border-indigo-400 ring-4 ring-indigo-300/60 shadow-2xl z-30"
            : data.highlighted
            ? "border-indigo-500 ring-4 ring-indigo-200/50 shadow-2xl z-30"
            : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:shadow-xl z-10"
          }"""
        new_po_border = """          ${data.highlighted
            ? "border-indigo-500 ring-4 ring-indigo-200/50 shadow-2xl z-30"
            : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:shadow-xl z-10"
          }"""
        content = content.replace(old_po_border, new_po_border)

        # 4. ItemDetailSidebar to DetailsSidebar
        # We need to find the bounds of ItemDetailSidebar and replace it.
        import re
        sidebar_replacement = '''/* ── Details Sidebar ──────────────────────────── */

function DetailsSidebar({
  selectedItemInfo,
  selectedDocument,
  flowData,
  onClose,
}: {
  selectedItemInfo: { pair: MappedItemPair | null, item: EnrichedItem, matchStatus: MatchStatus } | null;
  selectedDocument: { type: "inv" | "po", id: number } | null;
  flowData: FlowDataOut;
  onClose: () => void;
}) {
  if (!selectedItemInfo && !selectedDocument) return null;

  // Render Document Detail
  if (selectedDocument) {
    const isInv = selectedDocument.type === "inv";
    const docData: any = isInv 
      ? flowData.invoices.find(d => d.id === selectedDocument.id)
      : flowData.pos.find(d => d.id === selectedDocument.id);
      
    if (!docData) return null;

    return (
      <div className="absolute inset-y-0 right-0 w-[400px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            {isInv ? <FileText className="h-4 w-4 text-blue-500" /> : <FileSpreadsheet className="h-4 w-4 text-indigo-500" />}
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{isInv ? "Invoice Details" : "PO Details"}</span>
              <p className="text-[9px] uppercase tracking-wider font-semibold text-slate-500">
                {isInv ? docData.invoice_number || `INV-${docData.id}` : docData.po_number || `PO-${docData.id}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Document Preview */}
          {docData.file_url ? (
            <div className="w-full h-80 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 shadow-inner p-1">
               <iframe src={`${docData.file_url}#toolbar=0&navpanes=0`} className="w-[110%] h-[110%] scale-[0.9] origin-top-left border-0 rounded-lg pointer-events-auto" title="Document Preview" />
            </div>
          ) : (
            <div className="w-full h-40 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
               No Preview Available
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Metadata</h3>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
               <div className="grid grid-cols-2 px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                 <span className="text-[10px] font-semibold text-slate-500 uppercase">Vendor</span>
                 <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200 text-right truncate" title={docData.vendor_name || "Unknown"}>{docData.vendor_name || "Unknown"}</span>
               </div>
               <div className="grid grid-cols-2 px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                 <span className="text-[10px] font-semibold text-slate-500 uppercase">Currency</span>
                 <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200 text-right">{docData.currency || "---"}</span>
               </div>
               <div className="grid grid-cols-2 px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                 <span className="text-[10px] font-semibold text-slate-500 uppercase">Subtotal</span>
                 <span className="text-[11px] font-mono text-slate-800 dark:text-slate-200 text-right">{fmtNum(docData.subtotal)}</span>
               </div>
               <div className="grid grid-cols-2 px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                 <span className="text-[10px] font-semibold text-slate-500 uppercase">Tax</span>
                 <span className="text-[11px] font-mono text-slate-800 dark:text-slate-200 text-right">{fmtNum(docData.tax_amount)}</span>
               </div>
               <div className="grid grid-cols-2 px-3 py-2 bg-slate-100/50 dark:bg-slate-800/80">
                 <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">Total Amount</span>
                 <span className="text-[12px] font-mono font-bold text-blue-600 dark:text-blue-400 text-right">{fmtNum(docData.total_amount)}</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
}'''
        
        content = re.sub(r'/\* ── Detail Sidebar \(Item Level\) ──────────────────────────── \*/[\s\S]*?function FlowCanvas', sidebar_replacement + '\n\nfunction FlowCanvas', content)

        # 5. FlowCanvas Props & map logic
        old_fc_props = """function FlowCanvas({
  flowData,
  resultsData,
  compareState,
  onStartCompare,
  onToggleInvoiceCompare,
  onTogglePOCompare,
}: {
  flowData: FlowDataOut;
  resultsData: ValidationResultsOut;
  compareState: CompareState;
  onStartCompare: (inv?: number, po?: number) => void;
  onToggleInvoiceCompare: (id: number) => void;
  onTogglePOCompare: (id: number) => void;
}) {"""
        new_fc_props = """function FlowCanvas({
  flowData,
  resultsData,
}: {
  flowData: FlowDataOut;
  resultsData: ValidationResultsOut;
}) {"""
        content = content.replace(old_fc_props, new_fc_props)

        old_state_1 = """  const [selectedItem, setSelectedItem] = useState<string | null>(null);"""
        new_state_1 = """  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<{type: "inv" | "po", id: number} | null>(null);"""
        content = content.replace(old_state_1, new_state_1)

        # Replace mapping logic
        import re
        new_map_logic = '''const { docItemsMap, itemEdges, pairsList } = useMemo(() => {
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
  }, [flowData, resultsData]);'''
        content = re.sub(r'const \{ docItemsMap, itemEdges, pairsList \} = useMemo\(\(\) => \{[\s\S]*?\}, \[flowData, resultsData\]\);', new_map_logic, content)

        # Remove handleNodeCompare
        content = re.sub(r'  // Handle "Compare" click on a node[\s\S]*?\[onStartCompare\]\n  \);\n', '', content)

        # Update initializeLayout to remove compareMode and onCompare
        # First node push
        content = re.sub(r'compareMode: compareState\.mode === "selecting",\n\s*compareSelected: compareState\.selectedInvoices\.has\(inv\.id\),\n\s*onCompare: \(nodeId: number\) => handleNodeCompare\("inv", nodeId\),', '', content)
        content = re.sub(r'compareMode: compareState\.mode === "selecting",\n\s*compareSelected: compareState\.selectedPOs\.has\(po\.id\),\n\s*onCompare: \(nodeId: number\) => handleNodeCompare\("po", nodeId\),', '', content)
        
        # Dependency array for initializeLayout
        content = content.replace(", compareState, handleNodeCompare", "")

        # Update useEffect for setNodes
        content = re.sub(r'          items: newItems,\n\s*compareMode: compareState\.mode === "selecting",\n\s*compareSelected:[\s\S]*?\(id: number\) => handleNodeCompare\("po", id\),\n\s*\},', '          items: newItems,\n          },', content)
        # Fix array 
        content = content.replace("[compareState, selectedItem, docItemsMap, handleNodeCompare, setNodes, setEdges]", "[selectedItem, docItemsMap, setNodes, setEdges]")

        # Replace onNodeClick
        old_on_node_click = """  const onNodeClick: NodeMouseHandler = useCallback(
    (_e, node) => {
      // Unselect item details
      setSelectedItem(null);

      if (compareState.mode === "selecting") {
        if (node.type === "invoiceNode") onToggleInvoiceCompare((node.data as any).id);
        else onTogglePOCompare((node.data as any).id);
        return;
      }
      setCenter(node.position.x + 128, node.position.y + 160, { zoom: 1.1, duration: 500 });
    },
    [compareState.mode, setCenter, onToggleInvoiceCompare, onTogglePOCompare]
  );"""
        new_on_node_click = """  const onNodeClick: NodeMouseHandler = useCallback(
    (_e, node) => {
      // Unselect item details
      setSelectedItem(null);
      const isInv = node.type === "invoiceNode";
      setSelectedDocument({ type: isInv ? "inv" : "po", id: (node.data as any).id });
      setCenter(node.position.x + 128, node.position.y + 160, { zoom: 1.1, duration: 500 });
    },
    [setCenter]
  );"""
        content = content.replace(old_on_node_click, new_on_node_click)

        # Update DetailSidebar call in FlowCanvas
        old_sidebar_tag = """      {/* Detail Sidebar overlay */}
      <ItemDetailSidebar selectedItemInfo={selectedItemInfo} onClose={() => setSelectedItem(null)} />
    </>"""
        new_sidebar_tag = """      {/* Details Sidebar overlay */}
      <DetailsSidebar
        selectedItemInfo={selectedItemInfo}
        selectedDocument={selectedDocument}
        flowData={flowData}
        onClose={() => { setSelectedItem(null); setSelectedDocument(null); }}
      />
    </>"""
        content = content.replace(old_sidebar_tag, new_sidebar_tag)
        
        # Remove CompareState logic from main component
        content = re.sub(r'/\* ── Main Component ───────────────────────────────────────── \*/[\s\S]*?const \[compareState, setCompareState\] = useState<CompareState>\(\{[^\}]*\}\);\n', '/* ── Main Component ───────────────────────────────────────── */\n\nexport function ValidationFlowPage() {\n  const { groupId } = useParams<{ groupId: string }>();\n  const navigate = useNavigate();\n\n  const [flowData, setFlowData] = useState<FlowDataOut | null>(null);\n  const [resultsData, setResultsData] = useState<ValidationResultsOut | null>(null);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState<string | null>(null);\n', content)
        
        # Remove Compare state handlers
        content = re.sub(r'  /\* Compare state handlers \*/[\s\S]*?const handleBackToSelection = useCallback\(\(\) => setCompareState\(\(prev\) => \(\{ \.\.\.prev, mode: "selecting" \}\)\), \[\]\);\n', '', content)
        
        # Remove the Compare button
        content = re.sub(r'        \{compareState\.mode === "idle" && \(\n\s*<Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white" onClick=\{\(\) => handleStartCompare\(\)\}>\n\s*<GitCompare className="h-3\.5 w-3\.5 mr-1\.5" \/> Compare Docs\n\s*<\/Button>\n\s*\)\}', '', content)

        # Clean props sent to FlowCanvas
        old_fc_props_mount = """        <ReactFlowProvider>
          <FlowCanvas
            flowData={flowData}
            resultsData={resultsData}
            compareState={compareState}
            onStartCompare={handleStartCompare}
            onToggleInvoiceCompare={handleToggleInvoice}
            onTogglePOCompare={handleTogglePO}
          />
        </ReactFlowProvider>"""
        new_fc_props_mount = """        <ReactFlowProvider>
          <FlowCanvas
            flowData={flowData}
            resultsData={resultsData}
          />
        </ReactFlowProvider>"""
        content = content.replace(old_fc_props_mount, new_fc_props_mount)

        # Remove the rest of the file (CompareSelectionPanel and DocumentViewer)
        # by slicing content up to the closing ReactFlowProvider and padding the end
        match = re.search(r'</ReactFlowProvider>', content)
        if match:
            idx = match.end()
            content = content[:idx] + "\n      </div>\n    </div>\n  );\n}\n"

        with open('frontend/src/features/validation/components/ValidationFlowPage.tsx', 'w') as f:
            f.write(content)
        print("Successfully rewrote ValidationFlowPage.tsx")
    except Exception as e:
        print("Error:", e)

rewrite()
