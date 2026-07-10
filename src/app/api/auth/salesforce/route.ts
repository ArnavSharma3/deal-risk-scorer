import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSalesforceAuthUrl, hasSalesforceCredentials } from "@/lib/salesforce";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!hasSalesforceCredentials()) {
    return NextResponse.redirect(new URL("/api/auth/demo", request.url));
  }

  try {
    const state = randomBytes(16).toString("hex");
    const authUrl = getSalesforceAuthUrl(state);
    const response = NextResponse.redirect(authUrl);
    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Salesforce OAuth start error:", error);
    return NextResponse.redirect(
      new URL("/login?error=oauth_failed", request.url)
    );
  }
}
