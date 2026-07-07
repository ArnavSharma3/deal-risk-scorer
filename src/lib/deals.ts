import { prisma } from "@/lib/prisma";
import {
  calculateRiskScore,
  getRiskLevel,
  hasEnoughData,
} from "@/lib/scoring";
import { generateExplanationAndRecommendations } from "@/lib/claude";
import type { DealWithScore, RiskFactors } from "@/lib/types";
import { differenceInDays } from "date-fns";

export async function scoreDeal(dealId: string) {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      activities: true,
      stakeholders: true,
    },
  });

  if (!deal) return null;

  const input = {
    lastActivityDate: deal.lastActivityDate,
    stageEnteredAt: deal.stageEnteredAt,
    stage: deal.stage,
    activities: deal.activities.map((a) => ({
      type: a.type,
      date: a.date,
    })),
    stakeholders: deal.stakeholders.map((s) => ({
      engagementCount: s.engagementCount,
      lastEngagementDate: s.lastEngagementDate,
    })),
  };

  if (!hasEnoughData(input)) {
    return prisma.riskScore.create({
      data: {
        dealId,
        status: "NOT_ENOUGH_DATA",
        explanation:
          "Insufficient CRM data to calculate a reliable risk score. Ensure activity logging and contact roles are up to date in Salesforce.",
        recommendations: [
          "Log recent calls, emails, and meetings in Salesforce",
          "Add contact roles to the opportunity",
          "Update the opportunity stage and close date",
        ],
      },
    });
  }

  const { score, factors } = calculateRiskScore(input);

  let explanation: string | null = null;
  let recommendations: string[] = [];

  if (score >= 40) {
    const aiResult = await generateExplanationAndRecommendations({
      dealName: deal.name,
      amount: deal.amount,
      stage: deal.stage,
      closeDate: deal.closeDate.toISOString().split("T")[0],
      score,
      factors,
      ownerName: deal.ownerName,
      daysSinceActivity: factors.daysSinceActivity,
      stakeholderCount: deal.stakeholders.length,
    });
    explanation = aiResult.explanation;
    recommendations = aiResult.recommendations;
  } else {
    explanation = `This deal is tracking well with a low risk score of ${score}/100. Activity levels, stage progression, and stakeholder engagement are within healthy ranges.`;
    recommendations = [
      "Maintain regular cadence with key stakeholders",
      "Confirm mutual close plan and next milestones",
      "Update forecast category to reflect current confidence",
    ];
  }

  return prisma.riskScore.create({
    data: {
      dealId,
      score,
      status: "SCORED",
      explanation,
      recommendations,
      factors: factors as object,
    },
  });
}

export async function scoreAllDeals(userId: string) {
  const deals = await prisma.deal.findMany({
    where: { userId },
    select: { id: true },
  });

  const results = [];
  for (const deal of deals) {
    const result = await scoreDeal(deal.id);
    if (result) results.push(result);
  }
  return results;
}

export function formatDealWithScore(
  deal: {
    id: string;
    name: string;
    amount: number;
    stage: string;
    closeDate: Date;
    ownerName: string;
    lastActivityDate: Date | null;
    activities: unknown[];
    stakeholders: unknown[];
    riskScores: {
      score: number | null;
      status: string;
      explanation: string | null;
      recommendations: unknown;
      factors: unknown;
      createdAt: Date;
    }[];
  }
): DealWithScore {
  const latestScore = deal.riskScores[0] ?? null;
  const score = latestScore?.score ?? null;
  const status = (latestScore?.status ?? "NOT_ENOUGH_DATA") as
    | "SCORED"
    | "NOT_ENOUGH_DATA";

  return {
    id: deal.id,
    name: deal.name,
    amount: deal.amount,
    stage: deal.stage,
    closeDate: deal.closeDate.toISOString(),
    ownerName: deal.ownerName,
    lastActivityDate: deal.lastActivityDate?.toISOString() ?? null,
    riskScore: score,
    riskLevel: getRiskLevel(score, status),
    status,
    explanation: latestScore?.explanation ?? null,
    recommendations: Array.isArray(latestScore?.recommendations)
      ? (latestScore.recommendations as string[])
      : [],
    factors: latestScore?.factors as RiskFactors | null,
    activityCount: deal.activities.length,
    stakeholderCount: deal.stakeholders.length,
  };
}

export async function getDealsForUser(userId: string): Promise<DealWithScore[]> {
  const deals = await prisma.deal.findMany({
    where: { userId },
    include: {
      activities: true,
      stakeholders: true,
      riskScores: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { closeDate: "asc" },
  });

  return deals.map(formatDealWithScore);
}

export async function getDealHistory(dealId: string) {
  const scores = await prisma.riskScore.findMany({
    where: { dealId },
    orderBy: { createdAt: "asc" },
  });

  return scores.map((s) => ({
    date: s.createdAt.toISOString(),
    score: s.score,
    status: s.status as "SCORED" | "NOT_ENOUGH_DATA",
  }));
}

export async function trackEvent(
  userId: string | null,
  eventType: string,
  metadata?: Record<string, unknown>
) {
  return prisma.analyticsEvent.create({
    data: {
      userId,
      eventType,
      metadata: (metadata ?? {}) as object,
    },
  });
}

export function sortDeals(
  deals: DealWithScore[],
  field: "risk" | "value" | "closeDate",
  direction: "asc" | "desc"
): DealWithScore[] {
  const sorted = [...deals].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case "risk":
        cmp = (a.riskScore ?? -1) - (b.riskScore ?? -1);
        break;
      case "value":
        cmp = a.amount - b.amount;
        break;
      case "closeDate":
        cmp = new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime();
        break;
    }
    return direction === "desc" ? -cmp : cmp;
  });
  return sorted;
}

export function filterDeals(
  deals: DealWithScore[],
  filters: {
    search?: string;
    rep?: string;
    riskLevel?: string;
    minValue?: number | null;
    maxValue?: number | null;
    closeDateFrom?: string | null;
    closeDateTo?: string | null;
  }
): DealWithScore[] {
  return deals.filter((deal) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !deal.name.toLowerCase().includes(q) &&
        !deal.ownerName.toLowerCase().includes(q) &&
        !deal.stage.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (filters.rep && filters.rep !== "all" && deal.ownerName !== filters.rep) {
      return false;
    }
    if (filters.riskLevel && filters.riskLevel !== "all") {
      if (deal.riskLevel !== filters.riskLevel) return false;
    }
    if (filters.minValue != null && deal.amount < filters.minValue) return false;
    if (filters.maxValue != null && deal.amount > filters.maxValue) return false;
    if (filters.closeDateFrom) {
      if (new Date(deal.closeDate) < new Date(filters.closeDateFrom)) return false;
    }
    if (filters.closeDateTo) {
      if (new Date(deal.closeDate) > new Date(filters.closeDateTo)) return false;
    }
    return true;
  });
}

export function getUniqueReps(deals: DealWithScore[]): string[] {
  return Array.from(new Set(deals.map((d) => d.ownerName))).sort();
}

export function getDaysSinceActivity(date: string | null): number | null {
  if (!date) return null;
  return differenceInDays(new Date(), new Date(date));
}
