"use client";

import { Inbox } from "lucide-react";

interface EmptyStateProps {
  onSync?: () => void;
}

export default function EmptyState({ onSync }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-center">
      <Inbox className="mb-4 h-12 w-12 text-slate-400" aria-hidden="true" />
      <h3 className="mb-2 text-lg font-semibold text-slate-900">No deals found</h3>
      <p className="mb-6 max-w-sm text-sm text-slate-600">
        Sync your Salesforce pipeline to see risk scores for your open opportunities.
      </p>
      {onSync && (
        <button
          onClick={onSync}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Sync Salesforce Data
        </button>
      )}
    </div>
  );
}
