import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDealsForUser, sortDeals, filterDeals } from "@/lib/deals";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sortField = (searchParams.get("sort") || "risk") as "risk" | "value" | "closeDate";
  const sortDir = (searchParams.get("dir") || "desc") as "asc" | "desc";
  const search = searchParams.get("search") || "";
  const rep = searchParams.get("rep") || "all";
  const riskLevel = searchParams.get("riskLevel") || "all";
  const minValue = searchParams.get("minValue")
    ? parseFloat(searchParams.get("minValue")!)
    : null;
  const maxValue = searchParams.get("maxValue")
    ? parseFloat(searchParams.get("maxValue")!)
    : null;
  const closeDateFrom = searchParams.get("closeDateFrom");
  const closeDateTo = searchParams.get("closeDateTo");

  let deals = await getDealsForUser(user.id);
  deals = filterDeals(deals, {
    search,
    rep,
    riskLevel,
    minValue,
    maxValue,
    closeDateFrom,
    closeDateTo,
  });
  deals = sortDeals(deals, sortField, sortDir);

  const reps = Array.from(
    new Set((await getDealsForUser(user.id)).map((d) => d.ownerName))
  ).sort();

  return NextResponse.json({ deals, reps, total: deals.length });
}
