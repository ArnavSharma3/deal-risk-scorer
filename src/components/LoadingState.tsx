"use client";

import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = "Loading deals..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24" role="status">
      <Loader2 className="mb-4 h-10 w-10 animate-spin text-blue-600" aria-hidden="true" />
      <p className="text-sm font-medium text-slate-600">{message}</p>
      <span className="sr-only">{message}</span>
    </div>
  );
}
