"use client";

import { getRiskColor, getRiskLabel } from "@/lib/scoring";
import type { RiskLevel } from "@/lib/types";
import { HelpCircle } from "lucide-react";

interface RiskBadgeProps {
  score: number | null;
  level: RiskLevel;
  showTooltip?: boolean;
}

export default function RiskBadge({ score, level, showTooltip = false }: RiskBadgeProps) {
  const colorClass = getRiskColor(level);
  const label = getRiskLabel(level);

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white ${colorClass}`}
        aria-label={`${label}${score !== null ? `: ${score} out of 100` : ""}`}
      >
        {score !== null ? `${score}` : "—"}
        <span className="font-medium opacity-90">{label}</span>
      </span>
      {showTooltip && level === "unknown" && (
        <span title="Not enough CRM data to calculate a reliable risk score" className="text-slate-400">
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
    </div>
  );
}
