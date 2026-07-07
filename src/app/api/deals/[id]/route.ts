import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDealWithScore, getDealHistory } from "@/lib/deals";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deal = await prisma.deal.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      activities: { orderBy: { date: "desc" }, take: 10 },
      stakeholders: true,
      riskScores: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const history = await getDealHistory(deal.id);

  return NextResponse.json({
    deal: formatDealWithScore(deal),
    history,
    activities: deal.activities,
    stakeholders: deal.stakeholders,
  });
}
