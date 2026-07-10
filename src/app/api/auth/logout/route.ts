import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  await destroySession();
  return NextResponse.json({ success: true });
}

export async function GET() {
  await destroySession();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.redirect(new URL("/login", appUrl));
}
