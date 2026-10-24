import React from "react";
import { PhoenixStage } from "@/lib/types";
import { Check, Loader2 } from "lucide-react";

interface WorkflowStepperProps {
  currentStage: PhoenixStage;
}

const STAGES: { id: PhoenixStage; name: string; number: number }[] = [
  { id: "stage_1_discover", name: "Discover", number: 1 },
  { id: "stage_2_inspect", name: "Inspect", number: 2 },
  { id: "stage_3_diagnose", name: "Diagnose", number: 3 },
  { id: "stage_4_generate_patch", name: "Patch", number: 4 },
  { id: "stage_5_verify", name: "Verify", number: 5 },
  { id: "stage_6_retry", name: "Retry", number: 6 },
  { id: "stage_7_report", name: "Report", number: 7 },
  { id: "stage_8_prepare_contribution", name: "Prepare", number: 8 },
];

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ currentStage }) => {
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);
  const isCompleted = currentStage === "completed";

  return (
    <div className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[680px]">
        {STAGES.map((stage, idx) => {
          const isPast = isCompleted || (currentIndex !== -1 && idx < currentIndex);
          const isCurrent = !isCompleted && stage.id === currentStage;

          let badgeStyle = "bg-zinc-900 border-zinc-800 text-zinc-500";
          let textStyle = "text-zinc-500";

          if (isPast) {
            badgeStyle = "bg-emerald-950/80 border-emerald-500/50 text-emerald-400";
            textStyle = "text-zinc-300";
          } else if (isCurrent) {
            badgeStyle = "bg-cyan-950 border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/20";
            textStyle = "text-cyan-300 font-semibold";
          }

          return (
            <div key={stage.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-mono transition-all ${badgeStyle}`}
                >
                  {isPast ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : isCurrent ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  ) : (
                    stage.number
                  )}
                </div>
                <span className={`text-xs ${textStyle} whitespace-nowrap`}>{stage.name}</span>
              </div>
              {idx < STAGES.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition-all ${
                    isPast ? "bg-emerald-500/40" : "bg-zinc-800"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
