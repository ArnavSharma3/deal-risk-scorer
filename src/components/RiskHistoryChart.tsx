"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import type { ScoreHistoryPoint } from "@/lib/types";

interface RiskHistoryChartProps {
  history: ScoreHistoryPoint[];
}

export default function RiskHistoryChart({ history }: RiskHistoryChartProps) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-slate-500">No historical score data available yet.</p>
    );
  }

  const data = history
    .filter((h) => h.status === "SCORED" && h.score !== null)
    .map((h) => ({
      date: format(new Date(h.date), "MMM d"),
      score: h.score,
    }));

  if (data.length === 0) {
    return (
      <p className="text-sm text-slate-500">Insufficient data for trend chart.</p>
    );
  }

  return (
    <div className="h-48 w-full" aria-label="Risk score history chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              fontSize: "12px",
            }}
          />
          <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "High", fontSize: 10 }} />
          <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Med", fontSize: 10 }} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 4, fill: "#2563eb" }}
            name="Risk Score"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
