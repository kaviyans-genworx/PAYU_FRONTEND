import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, FileUp, ScanSearch, Layers, Database, Sparkles } from "lucide-react";

interface Step {
  label: string;
  icon: React.ElementType;
}

const STEPS: Step[] = [
  { label: "Uploading document…", icon: FileUp },
  { label: "Document received", icon: CheckCircle2 },
  { label: "Starting extraction…", icon: ScanSearch },
  { label: "Analyzing content…", icon: ScanSearch },
  { label: "Extracting fields…", icon: Layers },
  { label: "Structuring data…", icon: Database },
  { label: "Validating results…", icon: Sparkles },
];

// Delays (ms) between each step appearing
const STEP_DELAYS = [0, 1200, 2400, 4000, 6500, 9000, 12000];

export function ExtractionProgress({ isActive }: { isActive: boolean }) {
  const [visibleSteps, setVisibleSteps] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setVisibleSteps(0);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    STEP_DELAYS.forEach((delay, idx) => {
      const t = setTimeout(() => setVisibleSteps(idx + 1), delay);
      timers.push(t);
    });

    return () => timers.forEach(clearTimeout);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">
        Extraction Progress
      </h3>
      <div className="relative space-y-0">
        {STEPS.map((step, idx) => {
          const isVisible = idx < visibleSteps;
          const isCurrent = idx === visibleSteps - 1;
          const isCompleted = idx < visibleSteps - 1;
          const Icon = step.icon;

          return (
            <div key={idx} className="flex items-start gap-3 relative">
              {/* Vertical connector line */}
              {idx < STEPS.length - 1 && (
                <div
                  className={`absolute left-[15px] top-[30px] w-0.5 h-[calc(100%-6px)] transition-colors duration-500 ${
                    isCompleted ? "bg-emerald-400" : "bg-border"
                  }`}
                />
              )}

              {/* Icon circle */}
              <div
                className={`relative z-10 flex items-center justify-center h-[30px] w-[30px] rounded-full shrink-0 transition-all duration-500 ${
                  isVisible
                    ? isCompleted
                      ? "bg-emerald-100 dark:bg-emerald-900/40"
                      : isCurrent
                        ? "bg-primary/10"
                        : "bg-muted"
                    : "bg-muted opacity-0"
                }`}
                style={{
                  transform: isVisible ? "scale(1)" : "scale(0.5)",
                  transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : isCurrent ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                ) : (
                  <Icon className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {/* Label */}
              <div
                className={`pt-1 pb-4 transition-all duration-500 ${
                  isVisible
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-3"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    isCompleted
                      ? "text-emerald-700 dark:text-emerald-400"
                      : isCurrent
                        ? "text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </p>
                {isCurrent && (
                  <p className="text-xs text-muted-foreground mt-0.5 animate-pulse">
                    Processing…
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
