"use client";

import { useState } from "react";

import { UsageOverview } from "@/components/dashboard/usage/usage-overview";
import { UsageByModel } from "@/components/dashboard/usage/usage-by-model";
import { UsageChart } from "@/components/dashboard/usage/usage-chart";
import { UsageHeatmap } from "@/components/dashboard/usage/usage-heatmap";
import { RecentUsage } from "@/components/dashboard/usage/recent-usage";
import { cn } from "@/lib/utils";
import { type UsageTimeRange } from "@/lib/ai/utils";

const timeRangeOptions: { value: UsageTimeRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "all", label: "All" },
];

export default function UsagePage() {
  const [timeRange, setTimeRange] = useState<UsageTimeRange>("week");

  return (
    <div className="flex flex-1 flex-col gap-5 pt-4 pb-8 sm:gap-8 sm:py-8">
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h1 className="font-semibold text-xl tracking-tight">Usage</h1>
          <div className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:rounded-lg sm:bg-muted/50 sm:p-1">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTimeRange(option.value)}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors",
                  timeRange === option.value
                    ? "bg-muted font-medium text-foreground sm:bg-background sm:shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <UsageOverview timeRange={timeRange} />
      </div>

      <div className="grid gap-5 sm:gap-8 lg:grid-cols-2">
        <UsageChart timeRange={timeRange} />
        <UsageByModel timeRange={timeRange} />
      </div>

      <UsageHeatmap />

      <RecentUsage />
    </div>
  );
}
