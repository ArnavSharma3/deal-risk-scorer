"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message: string;
  code?: string;
  onRetry?: () => void;
  retryable?: boolean;
}

export default function ErrorState({
  title = "Something went wrong",
  message,
  code,
  onRetry,
  retryable = true,
}: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border-2 border-red-200 bg-red-50 p-8 text-center"
      role="alert"
    >
      <AlertTriangle className="mb-4 h-12 w-12 text-red-600" aria-hidden="true" />
      <h3 className="mb-2 text-lg font-semibold text-red-900">{title}</h3>
      <p className="mb-1 max-w-md text-sm text-red-800">{message}</p>
      {code && (
        <p className="mb-4 text-xs text-red-600">Error code: {code}</p>
      )}
      {retryable && onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          <RefreshCw className="h-4 w-4" />
          Retry Sync
        </button>
      )}
    </div>
  );
}
