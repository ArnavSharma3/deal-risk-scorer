import { Connection } from "jsforce";
import type {
  SalesforceAccount,
  SalesforceActivity,
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

export function getSalesforceAuthUrl(
  state: string,
  codeChallenge: string
): string {
  const { clientId, redirectUri, loginUrl } = getOAuthConfig();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "api refresh_token",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `${loginUrl}/services/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
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
      code_verifier: codeVerifier,
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
  // User: Id, Name, Email only
  const user = await conn
    .sobject("User")
    .findOne({ Id: identity.user_id }, ["Id", "Name", "Email"]);

  const userRecord = user as unknown as { Id: string; Email: string; Name: string };

  return {
    email: userRecord.Email,
    name: userRecord.Name,
    userId: identity.user_id,
  };
}

/**
 * Only SELECT fields guaranteed on standard DE orgs:
 * Id, Name, StageName, Amount, CloseDate, OwnerId, AccountId,
 * Probability, LastModifiedDate, CreatedDate, Description
 */
export async function fetchOpenOpportunities(
  conn: Connection
): Promise<SalesforceOpportunity[]> {
  const result = await conn.query<SalesforceOpportunity>(`
    SELECT Id, Name, StageName, Amount, CloseDate, OwnerId, AccountId,
           Probability, LastModifiedDate, CreatedDate, Description
    FROM Opportunity
    WHERE IsClosed = false
    ORDER BY CloseDate ASC
    LIMIT 500
  `);

  const ownerIds = Array.from(
    new Set(
      result.records.map((r) => r.OwnerId).filter((id): id is string => Boolean(id))
    )
  );

  const ownerNameById = new Map<string, string>();
  if (ownerIds.length > 0) {
    // User: Id, Name, Email only
    const owners = (await conn
      .sobject("User")
      .find({ Id: ownerIds }, ["Id", "Name", "Email"])) as Array<{
      Id: string;
      Name: string;
    }>;
    for (const owner of owners) {
      ownerNameById.set(owner.Id, owner.Name);
    }
  }

  return result.records.map((opp) => ({
    ...opp,
    Owner: { Name: ownerNameById.get(opp.OwnerId) || "Unknown" },
  }));
}

/**
 * Task: Id, Subject, ActivityDate, WhatId, Status, OwnerId, CreatedDate, Description
 * Event: Id, Subject, ActivityDate, WhatId, OwnerId, CreatedDate, StartDateTime, EndDateTime
 */
export async function fetchOpportunityActivities(
  conn: Connection,
  opportunityId: string
): Promise<SalesforceActivity[]> {
  const taskFields = [
    "Id",
    "Subject",
    "ActivityDate",
    "WhatId",
    "Status",
    "OwnerId",
    "CreatedDate",
    "Description",
  ];
  const eventFields = [
    "Id",
    "Subject",
    "ActivityDate",
    "WhatId",
    "OwnerId",
    "CreatedDate",
    "StartDateTime",
    "EndDateTime",
  ];

  const [tasks, events] = await Promise.all([
    conn
      .sobject("Task")
      .find({ WhatId: opportunityId }, taskFields)
      .sort("ActivityDate", "DESC")
      .limit(50),
    conn
      .sobject("Event")
      .find({ WhatId: opportunityId }, eventFields)
      .sort("ActivityDate", "DESC")
      .limit(50),
  ]);

  return [
    ...(tasks as SalesforceActivity[]),
    ...(events as SalesforceActivity[]),
  ];
}

/**
 * Contact / OpportunityContactRole are not in the safe-field allowlist.
 * Use Account (Id, Name, Industry, Type) linked via Opportunity.AccountId.
 */
export async function fetchOpportunityAccount(
  conn: Connection,
  accountId: string | null | undefined
): Promise<SalesforceAccount | null> {
  if (!accountId) return null;

  const account = await conn
    .sobject("Account")
    .findOne({ Id: accountId }, ["Id", "Name", "Industry", "Type"]);

  return (account as SalesforceAccount | null) ?? null;
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
