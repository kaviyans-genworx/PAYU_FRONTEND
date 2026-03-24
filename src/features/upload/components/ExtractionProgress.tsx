import { CheckCircle2, Clock3, Loader2 } from "lucide-react";

const STEP_LABELS: Record<string, string> = {
  validate_file: "Validating uploaded file",
  build_prompt: "Building extraction prompt",
  gemini_extraction: "Extracting PO fields",
  normalize_ids: "Normalizing PO identifiers",
  score_extraction: "Scoring extraction quality",
  generate_missing_ids: "Generating fallback IDs if needed",
  determine_status: "Determining review status",
  store_file: "Storing source file",
  store_document: "Saving extracted PO to database",
  format_response: "Preparing final response",
  completed: "Completed",
};

type StepState = "done" | "current" | "pending";

function stepLabel(step: string): string {
  return STEP_LABELS[step] ?? step.replaceAll("_", " ");
}

function statusIcon(state: StepState) {
  if (state === "done") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (state === "current") return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
  return <Clock3 className="h-4 w-4 text-muted-foreground" />;
}

interface ExtractionProgressProps {
  isActive: boolean;
  currentStep: string | null;
  steps: string[];
}

export function ExtractionProgress({ isActive, currentStep, steps }: ExtractionProgressProps) {
  if (!isActive) return null;

  const uniqueSteps = Array.from(new Set(steps));

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm" role="status" aria-live="polite" aria-label="Extraction progress">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        PO Extraction Progress
      </h3>
      <p className="text-xs text-muted-foreground mb-5">
        Processing your document.
      </p>

      {uniqueSteps.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Starting extraction...
        </div>
      ) : (
        <div className="space-y-3">
          {uniqueSteps.map((step, index) => {
            const state: StepState =
              step === currentStep
                ? "current"
                : currentStep && uniqueSteps.indexOf(currentStep) > index
                  ? "done"
                  : "pending";

            return (
              <div key={`${step}-${index}`} className="flex items-center gap-2 text-sm">
                {statusIcon(state)}
                <span className={state === "pending" ? "text-muted-foreground" : "text-foreground"}>
                  {stepLabel(step)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
