import re
import sys

def rewrite_file():
    with open('frontend/src/features/validation/components/ValidationFlowPage.tsx', 'r') as f:
        content = f.read()

    # 1. Imports
    content = re.sub(
        r'import \{[\s\S]*?\} from "@xyflow/react";',
        '''import {
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
} from "@xyflow/react";''',
        content
    )

    content = re.sub(
        r'import \{[\s\S]*?\} from "lucide-react";',
        '''import {
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
} from "lucide-react";''',
        content
    )

    # 2. Node definitions
    # Remove NodeToolbar from InvoiceNode and PONode
    content = re.sub(
        r'<NodeToolbar[\s\S]*?</NodeToolbar>',
        '',
        content
    )
    
    # Remove compare props from InvoiceNode
    content = re.sub(
        r'data: FlowInvoiceBrief & \{[\s\S]*?compareSelected: boolean;\n  \};',
        '''data: FlowInvoiceBrief & {
    items: EnrichedItem[];
    highlighted: boolean;
  };''',
        content
    )
    
    content = re.sub(
        r'data: FlowPOBrief & \{[\s\S]*?compareSelected: boolean;\n  \};',
        '''data: FlowPOBrief & {
    items: EnrichedItem[];
    highlighted: boolean;
  };''',
        content
    )

    # Update border colors for compareMode in InvoiceNode and PONode
    content = re.sub(
        r'\$\{data\.compareSelected[\s\S]*?: data\.highlighted',
        '${data.highlighted',
        content
    )
    # Remove compareMode references from nodesDraggable
    content = re.sub(r'nodesDraggable=\{!isLayoutLocked && compareState\.mode !== "selecting"\}', 'nodesDraggable={!isLayoutLocked}', content)

    # 3. FlowCanvas props and state
    content = re.sub(
        r'function FlowCanvas\(\{\n  flowData,\n  resultsData,\n  compareState,\n  onStartCompare,\n  onToggleInvoiceCompare,\n  onTogglePOCompare,\n\}: \{\n  flowData: FlowDataOut;\n  resultsData: ValidationResultsOut;\n  compareState: CompareState;\n  onStartCompare: \(.*?\) => void;\n  onToggleInvoiceCompare: \(.*?\) => void;\n  onTogglePOCompare: \(.*?\) => void;\n\}\)',
        '''function FlowCanvas({
  flowData,
  resultsData,
}: {
  flowData: FlowDataOut;
  resultsData: ValidationResultsOut;
})''',
        content
    )

    # Add selectedDocument state
    content = re.sub(
        r'const \[selectedItem, setSelectedItem\] = useState<string \| null>\(null\);',
        'const [selectedItem, setSelectedItem] = useState<string | null>(null);\n  const [selectedDocument, setSelectedDocument] = useState<{type: "inv" | "po", id: number} | null>(null);',
        content
    )

    # Replace the mapping logic inside useMemo
    new_usememo = '''const { docItemsMap, itemEdges, pairsList } = useMemo(() => {
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
    
    # Needs to match exactly from `const { docItemsMap, itemEdges, pairsList } = useMemo(() => {` inside FlowCanvas to `  }, [flowData, resultsData]);`
    content = re.sub(
        r'const \{ docItemsMap, itemEdges, pairsList \} = useMemo\(\(\) => \{[\s\S]*?\}, \[flowData, resultsData\]\);',
        new_usememo,
        content
    )

    # Remove handleNodeCompare
    content = re.sub(
        r'// Handle "Compare" click on a node[\s\S]*?\[onStartCompare\]\n  \);',
        '',
        content
    )

    # Remove compareState and handleNodeCompare dependencies from initializeLayout and node creation
    content = re.sub(r'compareMode: compareState\.mode === "selecting",\n\s*compareSelected: compareState\.selectedInvoices\.has\(inv\.id\),\n\s*onCompare: \(nodeId: number\) => handleNodeCompare\("inv", nodeId\),', '', content)
    content = re.sub(r'compareMode: compareState\.mode === "selecting",\n\s*compareSelected: compareState\.selectedPOs\.has\(po\.id\),\n\s*onCompare: \(nodeId: number\) => handleNodeCompare\("po", nodeId\),', '', content)
    content = re.sub(r', compareState, handleNodeCompare', '', content)

    # Update the useEffect block for nodes to remove compare Mode logic
    content = re.sub(
        r'return \{\n\s*\.\.\.n,\n\s*data: \{\n\s*\.\.\.n\.data,\n\s*items: newItems,\n\s*compareMode: compareState\.mode === "selecting",[\s\S]*?\},',
        '''return {
          ...n,
          data: {
            ...n.data,
            items: newItems,
          },''',
        content
    )
    content = re.sub(
        r'\s*\} \/\/\s*Update the useEffect block for nodes to remove compare Mode logic',
        '', content
    )
    # Also fix the dependency array for this useEffect
    content = re.sub(r'\[compareState, selectedItem, docItemsMap, handleNodeCompare, setNodes, setEdges\]', '[selectedItem, docItemsMap, setNodes, setEdges]', content)

    # Update onNodeClick
    on_node_click_replacement = '''const onNodeClick: NodeMouseHandler = useCallback(
    (_e, node) => {
      // Unselect item details
      setSelectedItem(null);
      const isInv = node.type === "invoiceNode";
      setSelectedDocument({ type: isInv ? "inv" : "po", id: (node.data as any).id });
      setCenter(node.position.x + 128, node.position.y + 160, { zoom: 1.1, duration: 500 });
    },
    [setCenter]
  );'''
  
    content = re.sub(
        r'const onNodeClick: NodeMouseHandler = useCallback\([\s\S]*?\[compareState\.mode, setCenter, onToggleInvoiceCompare, onTogglePOCompare\]\n  \);',
        on_node_click_replacement,
        content
    )

    # Sidebar rewrite
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
            <div className="w-full h-80 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 shadow-inner">
               <iframe src={`${docData.file_url}#toolbar=0&navpanes=0`} className="w-full h-full border-0" title="Document Preview" />
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
               <div className="grid grid-cols-2 px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/80">
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
    <div className="absolute inset-y-0 right-0 w-[350px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: cfg.color }} />
          <div>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Item Comparison</span>
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
        {/* Render document preview for item if pair exists or if single selected */}
        {(item.docType === "invoice" || pair) && (
             <div className="text-xs font-semibold mb-1 mt-2 text-slate-500 uppercase tracking-widest">Document Details shown for clicked item</div>
        )}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <div className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">Field</div>
            <div className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider text-blue-500 text-center">Invoice</div>
            <div className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider text-indigo-500 text-center">PO</div>
          </div>
          {fields.map((f) => (
            <div key={f.label} className={`grid grid-cols-3 border-b last:border-0 ${f.hasMismatch ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}`}>
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

    # Replace ItemDetailSidebar to EOF with DetailsSidebar
    content = re.sub(
        r'function ItemDetailSidebar\(\{[\s\S]*',
        sidebar_replacement,
        content
    )

    # Pass the new props to DetailsSidebar in FlowCanvas
    content = re.sub(
        r'<ItemDetailSidebar selectedItemInfo=\{selectedItemInfo\} onClose=\{\(\) => setSelectedItem\(null\)\} \/>',
        '<DetailsSidebar selectedItemInfo={selectedItemInfo} selectedDocument={selectedDocument} flowData={flowData} onClose={() => { setSelectedItem(null); setSelectedDocument(null); }} />',
        content
    )

    # Also we need to strip Main Component compare state logic
    content = re.sub(
        r'const \[compareState, setCompareState\] = useState<CompareState>\(\{[\s\S]*?\}\);\n',
        '',
        content
    )
    content = re.sub(
        r'/\* Compare state handlers \*/[\s\S]*?const handleBackToSelection = useCallback\(\(\) => setCompareState\(\(prev\) => \(\{ \.\.\.prev, mode: "selecting" \}\)\), \[\]\);',
        '',
        content
    )

    content = re.sub(
        r'\{compareState\.mode === "idle" && \(\n\s*<Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white" onClick=\{\(\) => handleStartCompare\(\)\}>\n\s*<GitCompare className="h-3\.5 w-3\.5 mr-1\.5" \/> Compare Docs\n\s*<\/Button>\n\s*\)\}',
        '',
        content
    )

    content = re.sub(
        r'<FlowCanvas\n\s*flowData=\{flowData\}\n\s*resultsData=\{resultsData\}\n\s*compareState=\{compareState\}\n\s*onStartCompare=\{handleStartCompare\}\n\s*onToggleInvoiceCompare=\{handleToggleInvoice\}\n\s*onTogglePOCompare=\{handleTogglePO\}\n\s*\/>',
        '<FlowCanvas flowData={flowData} resultsData={resultsData} />',
        content
    )

    content = re.sub(
        r'\{compareState\.mode === "selecting" && \([\s\S]*?\}\)\n\s*\}\n\s*<\/div>',
        '</div>',
        content
    )

    content += '\n}'

    # Remove interface CompareState
    content = re.sub(
        r'/\* ── Compare Selection Context ────────────────────────────── \*/\n\ninterface CompareState \{\n\s*mode: "idle" \| "selecting" \| "viewing";\n\s*selectedInvoices: Set<number>;\n\s*selectedPOs: Set<number>;\n\}\n',
        '',
        content
    )

    with open('frontend/src/features/validation/components/ValidationFlowPage.tsx', 'w') as f:
        f.write(content)

rewrite_file()
