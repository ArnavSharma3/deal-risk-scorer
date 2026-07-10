import { prisma } from "@/lib/prisma";
import { DEMO_DEALS } from "@/lib/demo-data";
import { scoreAllDeals } from "@/lib/deals";
import { subDays } from "date-fns";

export async function seedDemoData(userId: string) {
  const existing = await prisma.deal.count({ where: { userId } });
  if (existing > 0) return { created: 0 };

  let created = 0;
  for (const seed of DEMO_DEALS) {
    const deal = await prisma.deal.create({
      data: {
        name: seed.name,
        amount: seed.amount,
        stage: seed.stage,
        closeDate: seed.closeDate,
        ownerName: seed.ownerName,
        lastActivityDate: seed.lastActivityDate,
        stageEnteredAt: seed.stageEnteredAt,
        userId,
        salesforceId: `demo-${seed.name.toLowerCase().replace(/\s+/g, "-")}`,
        activities: {
          create: seed.activities.map((a) => ({
            type: a.type,
            subject: a.subject,
            date: a.date,
          })),
        },
        stakeholders: {
          create: seed.stakeholders.map((s) => ({
            name: s.name,
            email: s.email,
            lastEngagementDate: s.lastEngagementDate,
            engagementCount: s.engagementCount,
          })),
        },
      },
    });

    // Add historical scores for trend visualization
    const historicalScores = [30, 21, 14, 7, 0];
    for (const daysAgo of historicalScores) {
      const { calculateRiskScore, hasEnoughData } = await import("@/lib/scoring");
      const input = {
        lastActivityDate: subDays(seed.lastActivityDate, daysAgo > 0 ? daysAgo : 0),
        stageEnteredAt: subDays(seed.stageEnteredAt, daysAgo),
        stage: seed.stage,
        amount: seed.amount,
        closeDate: seed.closeDate,
        activities: seed.activities.map((a) => ({
          type: a.type,
          date: subDays(a.date, daysAgo),
        })),
        stakeholders: seed.stakeholders.map((s) => ({
          engagementCount: Math.max(1, s.engagementCount - Math.floor(daysAgo / 7)),
          lastEngagementDate: s.lastEngagementDate
            ? subDays(s.lastEngagementDate, daysAgo)
            : null,
        })),
      };

      if (hasEnoughData(input)) {
        const { score, factors } = calculateRiskScore(input);
        await prisma.riskScore.create({
          data: {
            dealId: deal.id,
            score,
            status: "SCORED",
            factors: factors as object,
            explanation: null,
            recommendations: [],
            createdAt: subDays(new Date(), daysAgo),
          },
        });
      }
    }

    created++;
  }

  await scoreAllDeals(userId);
  return { created };
}

export async function getOrCreateDemoUser() {
  let user = await prisma.user.findUnique({
    where: { email: "demo@salesforce-deal-risk.com" },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "demo@salesforce-deal-risk.com",
        name: "Demo Manager",
        role: "MANAGER",
        salesforceId: "demo-user",
      },
    });
  }

  return user;
}
