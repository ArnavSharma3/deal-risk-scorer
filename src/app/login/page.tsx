"use client";

import { useSearchParams } from "next/navigation";
import { Shield, Cloud } from "lucide-react";
import { Suspense } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    invalid_oauth: "OAuth state mismatch. Please try logging in again.",
    oauth_failed: "Salesforce authentication failed. Please try again.",
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Deal Risk Scorer</h1>
          <p className="mt-2 text-slate-300">
            Real-time pipeline risk intelligence for Salesforce teams
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-8 backdrop-blur">
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {errorMessages[error] || "An error occurred. Please try again."}
            </div>
          )}

          <div className="space-y-4">
            <a
              href="/api/auth/salesforce"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              <Cloud className="h-5 w-5" />
              Connect with Salesforce
            </a>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-transparent px-2 text-slate-400">or try the demo</span>
              </div>
            </div>

            <a
              href="/api/auth/demo"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600 px-4 py-3 text-sm font-semibold text-slate-200 transition-all hover:border-slate-500 hover:bg-slate-700/50"
            >
              Enter Demo Mode
            </a>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            Read-only access. No data is written back to Salesforce.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Risk Scores", desc: "0–100 scale" },
            { label: "AI Insights", desc: "Plain English" },
            { label: "Actions", desc: "Rescue deals" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-slate-800/30 p-3">
              <p className="text-sm font-medium text-slate-300">{item.label}</p>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
          Loading...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
