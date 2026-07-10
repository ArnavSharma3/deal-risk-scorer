import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createConnection,
  fetchOpenOpportunities,
  fetchOpportunityActivities,
  fetchOpportunityContacts,
  classifySalesforceError,
  refreshAccessToken,
  hasSalesforceCredentials,
} from "@/lib/salesforce";
import { scoreAllDeals, trackEvent } from "@/lib/deals";
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

async function resolveSalesforceConnection(user: {
  id: string;
  accessToken: string | null;
  refreshToken: string | null;
  instanceUrl: string | null;
}) {
  if (!user.accessToken || !user.instanceUrl) {
    return null;
  }

  let conn = createConnection(user.accessToken, user.instanceUrl);

  try {
    // Lightweight probe — identity() fails fast on expired sessions.
    await conn.identity();
    return conn;
  } catch (error) {
    const classified = classifySalesforceError(error);
    if (classified.code !== "AUTH" || !user.refreshToken) {
      throw error;
    }

    const tokens = await refreshAccessToken(user.refreshToken);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        accessToken: tokens.access_token,
        instanceUrl: tokens.instance_url,
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
      },
    });

    conn = createConnection(updated.accessToken!, updated.instanceUrl!);
    return conn;
  }
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Demo users (no Salesforce tokens) get seeded data.
    // Users who completed OAuth always sync from Salesforce.
    const hasSalesforceSession = Boolean(user.accessToken && user.instanceUrl);
    if (!hasSalesforceSession && !hasSalesforceCredentials()) {
      await seedDemoData(user.id);
      await scoreAllDeals(user.id);
      await trackEvent(user.id, "crm_sync", { mode: "demo", success: true });
      return NextResponse.json({ success: true, mode: "demo", synced: true });
    }

    if (!hasSalesforceSession) {
      return NextResponse.json(
        {
          error: "Salesforce not connected",
          code: "AUTH",
          message: "Please reconnect your Salesforce account.",
        },
        { status: 400 }
      );
    }

    const conn = await resolveSalesforceConnection(user);
    if (!conn) {
      return NextResponse.json(
        {
          error: "Salesforce not connected",
          code: "AUTH",
          message: "Please reconnect your Salesforce account.",
        },
        { status: 400 }
      );
    }

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
          stageEnteredAt: opp.LastModifiedDate
            ? new Date(opp.LastModifiedDate)
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
          stageEnteredAt: opp.LastModifiedDate
            ? new Date(opp.LastModifiedDate)
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
