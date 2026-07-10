"use client";

import { getRiskColor, getRiskLabel, getConfidenceLabel } from "@/lib/scoring";
import type { RiskLevel, ScoreConfidence } from "@/lib/types";
import { HelpCircle } from "lucide-react";

interface RiskBadgeProps {
  score: number | null;
  level: RiskLevel;
  confidence?: ScoreConfidence | null;
  showTooltip?: boolean;
}

export default function RiskBadge({
  score,
  level,
  confidence = null,
  showTooltip = false,
}: RiskBadgeProps) {
  const colorClass = getRiskColor(level);
  const label = getRiskLabel(level);
  const confidenceLabel = getConfidenceLabel(confidence);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white ${colorClass}`}
          aria-label={`${label}${score !== null ? `: ${score} out of 100` : ""}${confidenceLabel ? `, ${confidenceLabel}` : ""}`}
        >
          {score !== null ? `${score}` : "—"}
          <span className="font-medium opacity-90">{label}</span>
        </span>
        {showTooltip && level === "unknown" && (
          <span
            title="Missing Stage, Amount, or Close Date — required to calculate a risk score"
            className="text-slate-400"
          >
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </div>
      {score !== null && confidence && (
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          {confidence} confidence
        </span>
      )}
    </div>
  );
}
