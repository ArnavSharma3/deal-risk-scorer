import { Connection } from "jsforce";
import type {
  SalesforceActivity,
  SalesforceContact,
  SalesforceOpportunity,
} from "@/lib/types";

export type SalesforceTokens = {
  access_token: string;
  refresh_token: string;
  instance_url: string;
  id: string;
};

function getOAuthConfig() {
  const clientId = process.env.SALESFORCE_CLIENT_ID?.trim();
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.SALESFORCE_CALLBACK_URL?.trim();
  const loginUrl =
    process.env.SALESFORCE_LOGIN_URL?.trim() || "https://login.salesforce.com";

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Salesforce OAuth is not configured. Set SALESFORCE_CLIENT_ID, SALESFORCE_CLIENT_SECRET, and SALESFORCE_CALLBACK_URL."
    );
  }

  return { clientId, clientSecret, redirectUri, loginUrl };
}

export function hasSalesforceCredentials(): boolean {
  const clientId = process.env.SALESFORCE_CLIENT_ID?.trim();
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.SALESFORCE_CALLBACK_URL?.trim();

  if (!clientId || !clientSecret || !redirectUri) return false;

  const placeholders = new Set([
    "your_consumer_key_here",
    "your_consumer_secret_here",
    "",
  ]);

  return !placeholders.has(clientId) && !placeholders.has(clientSecret);
}

export function getSalesforceAuthUrl(state: string): string {
  const { clientId, redirectUri, loginUrl } = getOAuthConfig();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "api refresh_token",
    state,
  });

  return `${loginUrl}/services/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string
): Promise<SalesforceTokens> {
  const { clientId, clientSecret, redirectUri, loginUrl } = getOAuthConfig();

  const response = await fetch(`${loginUrl}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Salesforce token exchange failed: ${error}`);
  }

  return response.json() as Promise<SalesforceTokens>;
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<Pick<SalesforceTokens, "access_token" | "instance_url" | "id"> & {
  refresh_token?: string;
}> {
  const { clientId, clientSecret, loginUrl } = getOAuthConfig();

  const response = await fetch(`${loginUrl}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Salesforce token refresh failed: ${error}`);
  }

  return response.json();
}

export function createConnection(
  accessToken: string,
  instanceUrl: string
): Connection {
  return new Connection({
    accessToken,
    instanceUrl,
  });
}

export async function getUserInfo(
  accessToken: string,
  instanceUrl: string,
  identityUrl?: string
): Promise<{ email: string; name: string; userId: string }> {
  // Prefer the identity endpoint returned by the token response when available.
  if (identityUrl) {
    const response = await fetch(identityUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.ok) {
      const identity = (await response.json()) as {
        user_id: string;
        email?: string;
        display_name?: string;
        username?: string;
      };

      if (identity.email || identity.display_name || identity.username) {
        return {
          email: identity.email || identity.username || "",
          name: identity.display_name || identity.username || "Salesforce User",
          userId: identity.user_id,
        };
      }
    }
  }

  const conn = createConnection(accessToken, instanceUrl);
  const identity = await conn.identity();
  const user = await conn
    .sobject("User")
    .findOne({ Id: identity.user_id }, "Email, Name");

  const userRecord = user as unknown as { Email: string; Name: string };

  return {
    email: userRecord.Email,
    name: userRecord.Name,
    userId: identity.user_id,
  };
}

export async function fetchOpenOpportunities(
  conn: Connection
): Promise<SalesforceOpportunity[]> {
  const result = await conn.query<SalesforceOpportunity>(`
    SELECT Id, Name, Amount, StageName, CloseDate, OwnerId, Owner.Name,
           LastActivityDate, LastStageChangeDate
    FROM Opportunity
    WHERE IsClosed = false
    ORDER BY CloseDate ASC
    LIMIT 500
  `);
  return result.records;
}

export async function fetchOpportunityActivities(
  conn: Connection,
  opportunityId: string
): Promise<SalesforceActivity[]> {
  const tasks = await conn.query<SalesforceActivity>(`
    SELECT Id, Subject, ActivityDate, Type, WhatId
    FROM Task
    WHERE WhatId = '${opportunityId}'
    ORDER BY ActivityDate DESC
    LIMIT 50
  `);

  const events = await conn.query<SalesforceActivity>(`
    SELECT Id, Subject, ActivityDate, Type, WhatId
    FROM Event
    WHERE WhatId = '${opportunityId}'
    ORDER BY ActivityDate DESC
    LIMIT 50
  `);

  return [...tasks.records, ...events.records];
}

export async function fetchOpportunityContacts(
  conn: Connection,
  opportunityId: string
): Promise<SalesforceContact[]> {
  const result = await conn.query<{ Contact: SalesforceContact }>(`
    SELECT Contact.Id, Contact.Name, Contact.Email, Contact.LastActivityDate
    FROM OpportunityContactRole
    WHERE OpportunityId = '${opportunityId}'
  `);
  return result.records.map((r) => r.Contact);
}

export class SalesforceApiError extends Error {
  constructor(
    message: string,
    public code: "QUOTA" | "TIMEOUT" | "AUTH" | "UNKNOWN"
  ) {
    super(message);
    this.name = "SalesforceApiError";
  }
}

export function classifySalesforceError(error: unknown): SalesforceApiError {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("REQUEST_LIMIT_EXCEEDED") || message.includes("rate limit")) {
    return new SalesforceApiError(
      "Salesforce API rate limit exceeded. Please try again in a few minutes.",
      "QUOTA"
    );
  }
  if (message.includes("ETIMEDOUT") || message.includes("timeout")) {
    return new SalesforceApiError(
      "Salesforce API request timed out. Please retry the sync.",
      "TIMEOUT"
    );
  }
  if (
    message.includes("INVALID_SESSION") ||
    message.includes("expired") ||
    message.includes("token refresh failed") ||
    message.includes("authentication failure")
  ) {
    return new SalesforceApiError(
      "Salesforce session expired. Please reconnect your account.",
      "AUTH"
    );
  }
  return new SalesforceApiError(message, "UNKNOWN");
}
