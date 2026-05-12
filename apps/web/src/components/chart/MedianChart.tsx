"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { dailyMedianSeries } from "@/lib/median";
import type { SubmissionRecord } from "@/hooks/usePriceFeed";

interface MedianChartProps {
  submissions: SubmissionRecord[];
}

export function MedianChart({ submissions }: MedianChartProps) {
  const observations = submissions
    .filter((s) => s.finalized && s.accepted)
    .map((s) => ({
      priceCents: Number(s.priceCents),
      timestampSeconds: Number(s.timestamp),
    }));
  const series = dailyMedianSeries(observations);

  if (series.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-input p-6 text-center text-xs text-muted-foreground">
        No accepted submissions in the last 30 days yet.
      </p>
    );
  }

  const data = series.map((s) => ({
    date: new Date(s.day * 86_400_000).toLocaleDateString(),
    price: s.median / 100,
    sampleSize: s.sampleSize,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
          <XAxis dataKey="date" fontSize={11} />
          <YAxis fontSize={11} />
          <Tooltip
            formatter={(value: number) => value.toFixed(2)}
            labelStyle={{ fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
