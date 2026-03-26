import * as React from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";

export interface POOption {
  id: number;
  po_number: string;
  vendor_name: string;
  total_amount: number;
  status: string;
}

interface POSelectorProps {
  options: POOption[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}

export function POSelector({ options, selectedIds, onChange, disabled }: POSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref]);

  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    const lowerSearch = search.toLowerCase();
    return options.filter(
      (o) =>
        o.po_number.toLowerCase().includes(lowerSearch) ||
        o.vendor_name.toLowerCase().includes(lowerSearch)
    );
  }, [options, search]);

  const toggleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeSelection = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    onChange(selectedIds.filter((x) => x !== id));
  };

  const selectedOptions = options.filter(o => selectedIds.includes(o.id));

  return (
    <div className="relative w-full" ref={ref}>
      <div 
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`flex min-h-12 w-full flex-wrap items-center justify-between gap-2 rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background hover:bg-background cursor-pointer transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex flex-wrap gap-1.5 items-center flex-1">
          {selectedOptions.length === 0 && <span className="text-muted-foreground py-0.5">Select Purchase Orders...</span>}
          {selectedOptions.map(sel => (
            <div key={sel.id} className="flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 px-2 py-1 text-xs text-primary-foreground font-medium">
              <span className="text-primary truncate max-w-[150px]">{sel.po_number} - {sel.vendor_name}</span>
              {!disabled && (
                <button type="button" onClick={(e) => removeSelection(e, sel.id)} className="hover:bg-primary/20 flex items-center justify-center h-4 w-4 rounded-full text-primary transition-colors">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
        <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
      </div>
      
      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border shadow-xl bg-card text-card-foreground outline-none animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center border-b px-3 bg-muted/30">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-muted-foreground" />
            <input
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground focus:outline-none"
              placeholder="Search PO number or vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-[250px] overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No purchase orders found.</p>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedIds.includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    onClick={() => toggleSelection(opt.id)}
                    className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none hover:bg-muted transition-colors ${isSelected ? 'bg-primary/5 text-primary font-medium' : 'text-foreground'}`}
                  >
                    <span className="absolute left-2.5 flex h-4 w-4 items-center justify-center">
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold tracking-tight">{opt.po_number}</span>
                      <span className="text-xs text-muted-foreground font-medium truncate max-w-[200px]">{opt.vendor_name} &bull; ${opt.total_amount?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
