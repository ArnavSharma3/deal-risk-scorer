import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, getUserInfo } from "@/lib/salesforce";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { trackEvent } from "@/lib/deals";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = request.cookies.get("oauth_state")?.value;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_oauth", request.url)
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const userInfo = await getUserInfo(tokens.access_token, tokens.instance_url);

    const user = await prisma.user.upsert({
      where: { email: userInfo.email },
      update: {
        name: userInfo.name,
        salesforceId: userInfo.userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        instanceUrl: tokens.instance_url,
      },
      create: {
        email: userInfo.email,
        name: userInfo.name,
        salesforceId: userInfo.userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        instanceUrl: tokens.instance_url,
        role: "REP",
      },
    });

    await createSession(user.id);
    await trackEvent(user.id, "user_login", { method: "salesforce_oauth" });

    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete("oauth_state");
    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/login?error=oauth_failed", request.url)
    );
  }
}
