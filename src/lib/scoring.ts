import { differenceInDays } from "date-fns";
import type { RiskFactors } from "@/lib/types";

const STAGE_NORMS: Record<string, number> = {
  Prospecting: 14,
  Qualification: 21,
  "Needs Analysis": 28,
  "Value Proposition": 21,
  "Id. Decision Makers": 14,
  "Perception Analysis": 14,
  "Proposal/Price Quote": 21,
  "Negotiation/Review": 14,
  Proposal: 21,
  Negotiation: 14,
  Discovery: 21,
  Demo: 14,
  "Closed Won": 0,
  "Closed Lost": 0,
};

const WEIGHTS = {
  activity: 0.3,
  stageVelocity: 0.25,
  stakeholder: 0.25,
  engagementRecency: 0.2,
};

interface ScoringInput {
  lastActivityDate: Date | null;
  stageEnteredAt: Date | null;
  stage: string;
  activities: { type: string; date: Date }[];
  stakeholders: { engagementCount: number; lastEngagementDate: Date | null }[];
}

export function hasEnoughData(input: ScoringInput): boolean {
  const hasActivity = input.lastActivityDate !== null || input.activities.length > 0;
  const hasStage = Boolean(input.stage);
  return hasActivity && hasStage;
}

function scoreActivityDays(daysSince: number): number {
  if (daysSince <= 3) return 10;
  if (daysSince <= 7) return 25;
  if (daysSince <= 14) return 45;
  if (daysSince <= 21) return 65;
  if (daysSince <= 30) return 80;
  return 95;
}

function scoreStageVelocity(daysInStage: number, normDays: number): number {
  const ratio = daysInStage / normDays;
  if (ratio <= 0.75) return 15;
  if (ratio <= 1.0) return 35;
  if (ratio <= 1.5) return 60;
  if (ratio <= 2.0) return 80;
  return 95;
}

function scoreStakeholders(
  stakeholders: { engagementCount: number; lastEngagementDate: Date | null }[]
): number {
  if (stakeholders.length === 0) return 90;
  const now = new Date();
  const avgEngagement =
    stakeholders.reduce((sum, s) => sum + s.engagementCount, 0) / stakeholders.length;
  const recentCount = stakeholders.filter((s) => {
    if (!s.lastEngagementDate) return false;
    return differenceInDays(now, s.lastEngagementDate) <= 14;
  }).length;
  const coverageRatio = recentCount / stakeholders.length;

  let score = 50;
  if (stakeholders.length >= 3) score -= 15;
  else if (stakeholders.length >= 2) score -= 5;
  else score += 20;

  if (avgEngagement >= 5) score -= 20;
  else if (avgEngagement >= 2) score -= 5;
  else score += 25;

  if (coverageRatio >= 0.75) score -= 15;
  else if (coverageRatio >= 0.5) score -= 5;
  else score += 20;

  return Math.max(10, Math.min(95, score));
}

function scoreEngagementRecency(
  activities: { type: string; date: Date }[]
): number {
  const now = new Date();
  const meaningful = activities.filter((a) =>
    ["EMAIL", "MEETING", "CALL"].includes(a.type)
  );
  if (meaningful.length === 0) return 85;

  const recentEmail = meaningful
    .filter((a) => a.type === "EMAIL")
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
  const recentMeeting = meaningful
    .filter((a) => a.type === "MEETING" || a.type === "CALL")
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

  let score = 0;
  let factors = 0;

  if (recentEmail) {
    const days = differenceInDays(now, recentEmail.date);
    score += days <= 3 ? 10 : days <= 7 ? 30 : days <= 14 ? 55 : days <= 21 ? 75 : 90;
    factors++;
  } else {
    score += 80;
    factors++;
  }

  if (recentMeeting) {
    const days = differenceInDays(now, recentMeeting.date);
    score += days <= 7 ? 10 : days <= 14 ? 35 : days <= 21 ? 60 : days <= 30 ? 80 : 95;
    factors++;
  } else {
    score += 75;
    factors++;
  }

  return Math.round(score / factors);
}

export function calculateRiskScore(input: ScoringInput): {
  score: number;
  factors: RiskFactors;
} {
  const now = new Date();
  const daysSinceActivity = input.lastActivityDate
    ? differenceInDays(now, input.lastActivityDate)
    : 30;

  const daysInStage = input.stageEnteredAt
    ? differenceInDays(now, input.stageEnteredAt)
    : 14;

  const normDays = STAGE_NORMS[input.stage] ?? 21;

  const activityScore = scoreActivityDays(daysSinceActivity);
  const stageVelocityScore = scoreStageVelocity(daysInStage, normDays);
  const stakeholderScore = scoreStakeholders(input.stakeholders);
  const engagementRecencyScore = scoreEngagementRecency(input.activities);

  const rawScore =
    activityScore * WEIGHTS.activity +
    stageVelocityScore * WEIGHTS.stageVelocity +
    stakeholderScore * WEIGHTS.stakeholder +
    engagementRecencyScore * WEIGHTS.engagementRecency;

  const score = Math.round(Math.max(0, Math.min(100, rawScore)));

  return {
    score,
    factors: {
      daysSinceActivity,
      activityScore,
      stageVelocityScore,
      stakeholderScore,
      engagementRecencyScore,
      weights: WEIGHTS,
    },
  };
}

export function getRiskLevel(score: number | null, status: string): "low" | "medium" | "high" | "unknown" {
  if (status === "NOT_ENOUGH_DATA" || score === null) return "unknown";
  if (score < 40) return "low";
  if (score < 70) return "medium";
  return "high";
}

export function getRiskColor(level: string): string {
  switch (level) {
    case "low":
      return "bg-emerald-500";
    case "medium":
      return "bg-amber-500";
    case "high":
      return "bg-red-600";
    default:
      return "bg-slate-400";
  }
}

export function getRiskBorderColor(level: string): string {
  switch (level) {
    case "low":
      return "border-emerald-500";
    case "medium":
      return "border-amber-500";
    case "high":
      return "border-red-600";
    default:
      return "border-slate-400";
  }
}

export function getRiskLabel(level: string): string {
  switch (level) {
    case "low":
      return "Low Risk";
    case "medium":
      return "Medium Risk";
    case "high":
      return "High Risk";
    default:
      return "Insufficient Data";
  }
}
