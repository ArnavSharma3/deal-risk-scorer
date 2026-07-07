import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSalesforceAuthUrl } from "@/lib/salesforce";
import { isDemoMode } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (isDemoMode()) {
    return NextResponse.redirect(new URL("/api/auth/demo", request.url));
  }

  const state = randomBytes(16).toString("hex");
  const response = NextResponse.redirect(getSalesforceAuthUrl(state));
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
