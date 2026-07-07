import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { trackEvent } from "@/lib/deals";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  const body = await request.json();
  const { eventType, metadata } = body;

  if (!eventType) {
    return NextResponse.json({ error: "eventType required" }, { status: 400 });
  }

  await trackEvent(user?.id ?? null, eventType, metadata);
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  if (body.onboardingComplete) {
    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingComplete: true },
    });
  }

  return NextResponse.json({ success: true });
}
