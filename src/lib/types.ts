export type SortField = "risk" | "value" | "closeDate";
export type SortDirection = "asc" | "desc";
export type RiskLevel = "low" | "medium" | "high" | "unknown";

export interface RiskFactors {
  daysSinceActivity: number;
  activityScore: number;
  stageVelocityScore: number;
  stakeholderScore: number;
  engagementRecencyScore: number;
  weights: {
    activity: number;
    stageVelocity: number;
    stakeholder: number;
    engagementRecency: number;
  };
}

export interface DealWithScore {
  id: string;
  name: string;
  amount: number;
  stage: string;
  closeDate: string;
  ownerName: string;
  lastActivityDate: string | null;
  riskScore: number | null;
  riskLevel: RiskLevel;
  status: "SCORED" | "NOT_ENOUGH_DATA";
  explanation: string | null;
  recommendations: string[];
  factors: RiskFactors | null;
  activityCount: number;
  stakeholderCount: number;
}

export interface ScoreHistoryPoint {
  date: string;
  score: number | null;
  status: "SCORED" | "NOT_ENOUGH_DATA";
}

export interface DashboardFilters {
  search: string;
  rep: string;
  riskLevel: RiskLevel | "all";
  minValue: number | null;
  maxValue: number | null;
  closeDateFrom: string | null;
  closeDateTo: string | null;
}

export interface SalesforceOpportunity {
  Id: string;
  Name: string;
  Amount: number;
  StageName: string;
  CloseDate: string;
  OwnerId: string;
  Owner: { Name: string };
  LastActivityDate?: string;
  LastStageChangeDate?: string;
}

export interface SalesforceActivity {
  Id: string;
  Subject?: string;
  ActivityDate?: string;
  Type?: string;
  WhatId?: string;
}

export interface SalesforceContact {
  Id: string;
  Name: string;
  Email?: string;
  LastActivityDate?: string;
}
