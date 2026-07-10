import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { hasSalesforceCredentials } from "@/lib/salesforce";

const SESSION_COOKIE = "drs_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: { userId, token, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    }
    return null;
  }

  return session.user;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    cookieStore.delete(SESSION_COOKIE);
  }
}

/**
 * Demo mode is only forced when DEMO_MODE=true AND Salesforce credentials
 * are missing/placeholder. When real Connected App credentials are present,
 * Salesforce OAuth takes precedence over the global demo flag.
 */
export function isDemoMode(): boolean {
  if (hasSalesforceCredentials()) {
    return false;
  }
  return process.env.DEMO_MODE === "true" || !process.env.SALESFORCE_CLIENT_ID;
}
