import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createConnection,
  fetchOpenOpportunities,
  fetchOpportunityActivities,
  fetchOpportunityContacts,
  classifySalesforceError,
} from "@/lib/salesforce";
import { scoreAllDeals, trackEvent } from "@/lib/deals";
import { isDemoMode } from "@/lib/auth";
import { seedDemoData } from "@/lib/seed";

export const dynamic = "force-dynamic";

function mapActivityType(type?: string): "EMAIL" | "MEETING" | "CALL" | "TASK" | "OTHER" {
  const t = (type || "").toLowerCase();
  if (t.includes("email")) return "EMAIL";
  if (t.includes("meeting") || t.includes("event")) return "MEETING";
  if (t.includes("call")) return "CALL";
  if (t.includes("task")) return "TASK";
  return "OTHER";
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (isDemoMode()) {
      await seedDemoData(user.id);
      await scoreAllDeals(user.id);
      await trackEvent(user.id, "crm_sync", { mode: "demo", success: true });
      return NextResponse.json({ success: true, mode: "demo", synced: true });
    }

    if (!user.accessToken || !user.instanceUrl) {
      return NextResponse.json(
        {
          error: "Salesforce not connected",
          code: "AUTH",
          message: "Please reconnect your Salesforce account.",
        },
        { status: 400 }
      );
    }

    const conn = createConnection(user.accessToken, user.instanceUrl);
    const opportunities = await fetchOpenOpportunities(conn);

    let synced = 0;
    for (const opp of opportunities) {
      const deal = await prisma.deal.upsert({
        where: {
          salesforceId_userId: {
            salesforceId: opp.Id,
            userId: user.id,
          },
        },
        update: {
          name: opp.Name,
          amount: opp.Amount || 0,
          stage: opp.StageName,
          closeDate: new Date(opp.CloseDate),
          ownerName: opp.Owner?.Name || "Unknown",
          ownerId: opp.OwnerId,
          lastActivityDate: opp.LastActivityDate
            ? new Date(opp.LastActivityDate)
            : null,
          stageEnteredAt: opp.LastStageChangeDate
            ? new Date(opp.LastStageChangeDate)
            : null,
        },
        create: {
          salesforceId: opp.Id,
          name: opp.Name,
          amount: opp.Amount || 0,
          stage: opp.StageName,
          closeDate: new Date(opp.CloseDate),
          ownerName: opp.Owner?.Name || "Unknown",
          ownerId: opp.OwnerId,
          lastActivityDate: opp.LastActivityDate
            ? new Date(opp.LastActivityDate)
            : null,
          stageEnteredAt: opp.LastStageChangeDate
            ? new Date(opp.LastStageChangeDate)
            : null,
          userId: user.id,
        },
      });

      await prisma.activity.deleteMany({ where: { dealId: deal.id } });
      await prisma.stakeholder.deleteMany({ where: { dealId: deal.id } });

      const [activities, contacts] = await Promise.all([
        fetchOpportunityActivities(conn, opp.Id),
        fetchOpportunityContacts(conn, opp.Id),
      ]);

      if (activities.length > 0) {
        await prisma.activity.createMany({
          data: activities
            .filter((a) => a.ActivityDate)
            .map((a) => ({
              dealId: deal.id,
              type: mapActivityType(a.Type || a.Subject),
              subject: a.Subject || null,
              date: new Date(a.ActivityDate!),
            })),
        });
      }

      if (contacts.length > 0) {
        await prisma.stakeholder.createMany({
          data: contacts.map((c) => ({
            dealId: deal.id,
            name: c.Name,
            email: c.Email || null,
            lastEngagementDate: c.LastActivityDate
              ? new Date(c.LastActivityDate)
              : null,
            engagementCount: c.LastActivityDate ? 1 : 0,
          })),
        });
      }

      synced++;
    }

    await scoreAllDeals(user.id);
    await trackEvent(user.id, "crm_sync", { mode: "salesforce", synced });

    return NextResponse.json({ success: true, synced });
  } catch (error) {
    const sfError = classifySalesforceError(error);
    await trackEvent(user?.id ?? null, "crm_sync_error", {
      code: sfError.code,
      message: sfError.message,
    });

    return NextResponse.json(
      {
        error: sfError.message,
        code: sfError.code,
        retryable: sfError.code === "QUOTA" || sfError.code === "TIMEOUT",
      },
      { status: 502 }
    );
  }
}
