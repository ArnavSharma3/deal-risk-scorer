"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "./Header";
import DealCard from "./DealCard";
import DealFilters from "./DealFilters";
import SortControls from "./SortControls";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";
import EmptyState from "./EmptyState";
import OnboardingTour from "./OnboardingTour";
import type { DealWithScore, SortField, SortDirection, RiskLevel, ScoreHistoryPoint } from "@/lib/types";
import { AlertTriangle, TrendingDown, DollarSign, BarChart3 } from "lucide-react";

interface DashboardProps {
  user: {
    id: string;
    name: string;
    onboardingComplete: boolean;
  };
}

export default function Dashboard({ user }: DashboardProps) {
  const router = useRouter();
  const [deals, setDeals] = useState<DealWithScore[]>([]);
  const [reps, setReps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string; retryable?: boolean } | null>(null);
  const [histories, setHistories] = useState<Record<string, ScoreHistoryPoint[]>>({});

  const [sortField, setSortField] = useState<SortField>("risk");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [search, setSearch] = useState("");
  const [rep, setRep] = useState("all");
  const [riskLevel, setRiskLevel] = useState<RiskLevel | "all">("all");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [closeDateFrom, setCloseDateFrom] = useState("");
  const [closeDateTo, setCloseDateTo] = useState("");

  const [showTour, setShowTour] = useState(!user.onboardingComplete);
  const [tourReady, setTourReady] = useState(false);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams({
      sort: sortField,
      dir: sortDir,
      search,
      rep,
      riskLevel,
    });
    if (minValue) params.set("minValue", minValue);
    if (maxValue) params.set("maxValue", maxValue);
    if (closeDateFrom) params.set("closeDateFrom", closeDateFrom);
    if (closeDateTo) params.set("closeDateTo", closeDateTo);
    return params.toString();
  }, [sortField, sortDir, search, rep, riskLevel, minValue, maxValue, closeDateFrom, closeDateTo]);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/deals?${buildQuery()}`);
      if (!res.ok) throw new Error("Failed to load deals");
      const data = await res.json();
      setDeals(data.deals);
      setReps(data.reps);
    } catch {
      setError({ message: "Failed to load deals. Please try again.", retryable: true });
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError({
          message: data.error || "Sync failed",
          code: data.code,
          retryable: data.retryable,
        });
        return;
      }
      await fetchDeals();
      trackEvent("crm_sync_success");
    } catch {
      setError({
        message: "Unable to connect to Salesforce. Check your connection and try again.",
        retryable: true,
      });
    } finally {
      setSyncing(false);
    }
  }, [fetchDeals]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleExpand = async (dealId: string) => {
    trackEvent("deal_card_expand", { dealId });
    if (histories[dealId]) return;
    try {
      const res = await fetch(`/api/deals/${dealId}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistories((prev) => ({ ...prev, [dealId]: data.history }));
      }
    } catch {
      // History is optional
    }
  };

  const handleRecommendationClick = (dealId: string, index: number) => {
    trackEvent("recommendation_click", { dealId, index });
  };

  const trackEvent = (eventType: string, metadata?: Record<string, unknown>) => {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType, metadata }),
    }).catch(() => {});
  };

  const handleTourComplete = async () => {
    setShowTour(false);
    await fetch("/api/analytics", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboardingComplete: true }),
    });
    trackEvent("onboarding_complete");
  };

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  useEffect(() => {
    if (!loading && deals.length > 0 && !user.onboardingComplete) {
      setTourReady(true);
    }
  }, [loading, deals, user.onboardingComplete]);

  const highRiskDeals = deals.filter((d) => d.riskLevel === "high");
  const totalPipeline = deals.reduce((sum, d) => sum + d.amount, 0);
  const atRiskValue = highRiskDeals.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        userName={user.name}
        onSync={handleSync}
        onLogout={handleLogout}
        syncing={syncing}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Summary stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <BarChart3 className="h-4 w-4" />
              Open Deals
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900">{deals.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <DollarSign className="h-4 w-4" />
              Pipeline Value
            </div>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              ${(totalPipeline / 1000000).toFixed(1)}M
            </p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4" />
              At-Risk Value
            </div>
            <p className="mt-1 text-2xl font-bold text-red-700">
              ${(atRiskValue / 1000000).toFixed(1)}M
              <span className="ml-2 text-sm font-normal text-red-500">
                ({highRiskDeals.length} deals)
              </span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorState
              title="CRM Sync Error"
              message={error.message}
              code={error.code}
              onRetry={handleSync}
              retryable={error.retryable}
            />
          </div>
        )}

        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <SortControls
            sortField={sortField}
            sortDir={sortDir}
            onSortChange={(field, dir) => {
              setSortField(field);
              setSortDir(dir);
              trackEvent("dashboard_sort", { field, dir });
            }}
          />
          {highRiskDeals.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-red-600">
              <TrendingDown className="h-4 w-4" />
              {highRiskDeals.length} high-risk deal{highRiskDeals.length !== 1 ? "s" : ""} need attention
            </div>
          )}
        </div>

        <div className="mb-6">
          <DealFilters
            search={search}
            onSearchChange={(v) => { setSearch(v); trackEvent("dashboard_filter", { type: "search" }); }}
            rep={rep}
            onRepChange={setRep}
            riskLevel={riskLevel}
            onRiskLevelChange={setRiskLevel}
            minValue={minValue}
            onMinValueChange={setMinValue}
            maxValue={maxValue}
            onMaxValueChange={setMaxValue}
            closeDateFrom={closeDateFrom}
            onCloseDateFromChange={setCloseDateFrom}
            closeDateTo={closeDateTo}
            onCloseDateToChange={setCloseDateTo}
            reps={reps}
          />
        </div>

        {loading ? (
          <LoadingState />
        ) : deals.length === 0 ? (
          <EmptyState onSync={handleSync} />
        ) : (
          <div className="deal-grid grid gap-4 md:grid-cols-2">
            {deals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                history={histories[deal.id]}
                onExpand={handleExpand}
                onRecommendationClick={handleRecommendationClick}
              />
            ))}
          </div>
        )}
      </main>

      {tourReady && (
        <OnboardingTour run={showTour} onComplete={handleTourComplete} />
      )}
    </div>
  );
}
