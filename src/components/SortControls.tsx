"use client";

import { ArrowUpDown } from "lucide-react";
import type { SortField, SortDirection } from "@/lib/types";

interface SortControlsProps {
  sortField: SortField;
  sortDir: SortDirection;
  onSortChange: (field: SortField, dir: SortDirection) => void;
}

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: "risk", label: "Risk Score" },
  { field: "value", label: "Deal Value" },
  { field: "closeDate", label: "Close Date" },
];

export default function SortControls({
  sortField,
  sortDir,
  onSortChange,
}: SortControlsProps) {
  return (
    <div className="sort-controls flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1 text-sm font-medium text-slate-600">
        <ArrowUpDown className="h-4 w-4" />
        Sort by:
      </span>
      {SORT_OPTIONS.map((opt) => (
        <button
          key={opt.field}
          onClick={() => {
            if (sortField === opt.field) {
              onSortChange(opt.field, sortDir === "desc" ? "asc" : "desc");
            } else {
              onSortChange(opt.field, opt.field === "risk" ? "desc" : "asc");
            }
          }}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            sortField === opt.field
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
          aria-pressed={sortField === opt.field}
        >
          {opt.label}
          {sortField === opt.field && (
            <span className="ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>
          )}
        </button>
      ))}
    </div>
  );
}
