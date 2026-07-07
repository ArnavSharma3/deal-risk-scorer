"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  DollarSign,
  Calendar,
  User,
  Lightbulb,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import RiskBadge from "./RiskBadge";
import RiskHistoryChart from "./RiskHistoryChart";
import { getRiskBorderColor } from "@/lib/scoring";
import type { DealWithScore, ScoreHistoryPoint } from "@/lib/types";

interface DealCardProps {
  deal: DealWithScore;
  history?: ScoreHistoryPoint[];
  onExpand?: (dealId: string) => void;
  onRecommendationClick?: (dealId: string, index: number) => void;
}

export default function DealCard({
  deal,
  history = [],
  onExpand,
  onRecommendationClick,
}: DealCardProps) {
  const [expanded, setExpanded] = useState(false);
  const borderColor = getRiskBorderColor(deal.riskLevel);

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && onExpand) onExpand(deal.id);
  };

  return (
    <article
      className={`deal-card rounded-xl border-l-4 bg-white shadow-sm transition-shadow hover:shadow-md ${borderColor} border border-slate-200`}
      data-risk-level={deal.riskLevel}
    >
      <button
        onClick={handleToggle}
        className="w-full p-5 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-xl"
        aria-expanded={expanded}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-slate-900">
              {deal.name}
            </h3>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" aria-hidden="true" />
                ${deal.amount.toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                {format(new Date(deal.closeDate), "MMM d, yyyy")}
              </span>
              <span className="inline-flex items-center gap-1">
                <User className="h-3.5 w-3.5" aria-hidden="true" />
                {deal.ownerName}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{deal.stage}</p>
          </div>
          <div className="flex items-center gap-2">
            <RiskBadge
              score={deal.riskScore}
              level={deal.riskLevel}
              showTooltip
            />
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-400" />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4">
          {deal.status === "NOT_ENOUGH_DATA" ? (
            <div className="flex items-start gap-2 rounded-lg bg-slate-100 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
              <div>
                <p className="text-sm font-medium text-slate-700">Not Enough Data</p>
                <p className="mt-1 text-sm text-slate-600">{deal.explanation}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="explanation-section mb-4">
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  Risk Explanation
                </h4>
                <p className="text-sm leading-relaxed text-slate-700">
                  {deal.explanation}
                </p>
              </div>

              {deal.factors && (
                <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { label: "Activity Gap", value: deal.factors.activityScore },
                    { label: "Stage Velocity", value: deal.factors.stageVelocityScore },
                    { label: "Stakeholders", value: deal.factors.stakeholderScore },
                    { label: "Engagement", value: deal.factors.engagementRecencyScore },
                  ].map((f) => (
                    <div
                      key={f.label}
                      className="rounded-lg bg-slate-50 p-2 text-center"
                      title={`${f.label} risk component (0=low risk, 100=high risk)`}
                    >
                      <p className="text-xs text-slate-500">{f.label}</p>
                      <p
                        className={`text-lg font-bold ${
                          f.value >= 70
                            ? "text-red-600"
                            : f.value >= 40
                              ? "text-amber-600"
                              : "text-emerald-600"
                        }`}
                      >
                        {f.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="recommendations-section mb-4">
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  Recommended Next Actions
                </h4>
                <ul className="space-y-2">
                  {deal.recommendations.map((rec, i) => (
                    <li key={i}>
                      <button
                        onClick={() => onRecommendationClick?.(deal.id, i)}
                        className="flex w-full items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-left text-sm text-blue-900 transition-colors hover:bg-blue-100"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                        {rec}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                  <TrendingUp className="h-4 w-4 text-slate-600" />
                  Risk Score History
                </h4>
                <RiskHistoryChart history={history} />
              </div>
            </>
          )}
        </div>
      )}
    </article>
  );
}
