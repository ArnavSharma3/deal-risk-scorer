"use client";

import { Search, Filter } from "lucide-react";
import type { RiskLevel } from "@/lib/types";

interface DealFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  rep: string;
  onRepChange: (value: string) => void;
  riskLevel: RiskLevel | "all";
  onRiskLevelChange: (value: RiskLevel | "all") => void;
  minValue: string;
  onMinValueChange: (value: string) => void;
  maxValue: string;
  onMaxValueChange: (value: string) => void;
  closeDateFrom: string;
  onCloseDateFromChange: (value: string) => void;
  closeDateTo: string;
  onCloseDateToChange: (value: string) => void;
  reps: string[];
}

export default function DealFilters({
  search,
  onSearchChange,
  rep,
  onRepChange,
  riskLevel,
  onRiskLevelChange,
  minValue,
  onMinValueChange,
  maxValue,
  onMaxValueChange,
  closeDateFrom,
  onCloseDateFromChange,
  closeDateTo,
  onCloseDateToChange,
  reps,
}: DealFiltersProps) {
  return (
    <div className="filters-panel rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Filter className="h-4 w-4" />
        Filters
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search deals..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Search deals"
          />
        </div>

        <select
          value={rep}
          onChange={(e) => onRepChange(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Filter by rep"
        >
          <option value="all">All Reps</option>
          {reps.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={riskLevel}
          onChange={(e) => onRiskLevelChange(e.target.value as RiskLevel | "all")}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Filter by risk level"
        >
          <option value="all">All Risk Levels</option>
          <option value="high">High Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="low">Low Risk</option>
          <option value="unknown">Insufficient Data</option>
        </select>

        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min $"
            value={minValue}
            onChange={(e) => onMinValueChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Minimum deal value"
          />
          <input
            type="number"
            placeholder="Max $"
            value={maxValue}
            onChange={(e) => onMaxValueChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Maximum deal value"
          />
        </div>

        <input
          type="date"
          value={closeDateFrom}
          onChange={(e) => onCloseDateFromChange(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Close date from"
        />
        <input
          type="date"
          value={closeDateTo}
          onChange={(e) => onCloseDateToChange(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Close date to"
        />
      </div>
    </div>
  );
}
