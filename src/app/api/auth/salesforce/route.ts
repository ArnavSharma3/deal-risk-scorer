import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { getSalesforceAuthUrl, hasSalesforceCredentials } from "@/lib/salesforce";

export const dynamic = "force-dynamic";

const OAUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 600,
  path: "/",
};

/** PKCE code_verifier: 43–128 URL-safe characters (RFC 7636). */
function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

/** S256 code_challenge = BASE64URL(SHA256(code_verifier)). */
function generateCodeChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export async function GET(request: NextRequest) {
  if (!hasSalesforceCredentials()) {
    return NextResponse.redirect(new URL("/api/auth/demo", request.url));
  }

  try {
    const state = randomBytes(16).toString("hex");
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const authUrl = getSalesforceAuthUrl(state, codeChallenge);

    const response = NextResponse.redirect(authUrl);
    response.cookies.set("oauth_state", state, OAUTH_COOKIE_OPTIONS);
    response.cookies.set("oauth_code_verifier", codeVerifier, OAUTH_COOKIE_OPTIONS);
    return response;
  } catch (error) {
    console.error("Salesforce OAuth start error:", error);
    return NextResponse.redirect(
      new URL("/login?error=oauth_failed", request.url)
    );
  }
}
