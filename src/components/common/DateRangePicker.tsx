import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Preset = "today" | "week" | "month" | "custom";

interface DateRangePickerProps {
  fromDate: Date;
  toDate: Date;
  onFromDateChange: (date: Date) => void;
  onToDateChange: (date: Date) => void;
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getPresetLabel(from: Date, to: Date): Preset {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fromNorm = new Date(from);
  fromNorm.setHours(0, 0, 0, 0);
  const toNorm = new Date(to);
  toNorm.setHours(0, 0, 0, 0);

  if (fromNorm.getTime() === today.getTime() && toNorm.getTime() === today.getTime()) {
    return "today";
  }

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  if (fromNorm.getTime() === weekStart.getTime() && toNorm.getTime() === today.getTime()) {
    return "week";
  }

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  if (fromNorm.getTime() === monthStart.getTime() && toNorm.getTime() === today.getTime()) {
    return "month";
  }

  return "custom";
}

export function DateRangePicker({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
}: DateRangePickerProps) {
  const activePreset = getPresetLabel(fromDate, toDate);

  const applyPreset = (preset: Preset) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (preset) {
      case "today":
        onFromDateChange(new Date(today));
        onToDateChange(new Date(today));
        break;
      case "week": {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        onFromDateChange(weekStart);
        onToDateChange(new Date(today));
        break;
      }
      case "month": {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        onFromDateChange(monthStart);
        onToDateChange(new Date(today));
        break;
      }
      default:
        break;
    }
  };

  const presets: { key: Preset; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Preset buttons */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
        {presets.map((p) => (
          <Button
            key={p.key}
            variant={activePreset === p.key ? "default" : "ghost"}
            size="sm"
            className={`rounded-lg text-xs h-7 px-3 ${
              activePreset === p.key ? "" : "text-muted-foreground"
            }`}
            onClick={() => applyPreset(p.key)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Date inputs */}
      <div className="flex items-center gap-2">
        <div className="relative flex items-center">
          <CalendarIcon className="absolute left-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="date"
            className="flex h-9 w-[140px] rounded-xl border border-input bg-background px-3 py-1 pl-9 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            value={toLocalDateString(fromDate)}
            max={toLocalDateString(toDate)}
            onChange={(e) => {
              if (e.target.value) {
                onFromDateChange(parseLocalDate(e.target.value));
              }
            }}
          />
        </div>
        <span className="text-muted-foreground text-sm font-medium select-none">to</span>
        <div className="relative flex items-center">
          <CalendarIcon className="absolute left-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="date"
            className="flex h-9 w-[140px] rounded-xl border border-input bg-background px-3 py-1 pl-9 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            value={toLocalDateString(toDate)}
            min={toLocalDateString(fromDate)}
            onChange={(e) => {
              if (e.target.value) {
                onToDateChange(parseLocalDate(e.target.value));
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
