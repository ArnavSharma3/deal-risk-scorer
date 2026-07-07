import { NextResponse } from "next/server";
import { getOrCreateDemoUser, seedDemoData } from "@/lib/seed";
import { createSession } from "@/lib/auth";
import { trackEvent } from "@/lib/deals";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getOrCreateDemoUser();
  await seedDemoData(user.id);
  await createSession(user.id);
  await trackEvent(user.id, "user_login", { method: "demo" });

  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}
