"use client";

import { useState } from "react";

import { SettingHeader } from "@/components/dashboard/setting-header";
import { UsageOverview } from "@/components/dashboard/usage/usage-overview";
import { UsageByModel } from "@/components/dashboard/usage/usage-by-model";
import { UsageChart } from "@/components/dashboard/usage/usage-chart";
import { UsageHeatmap } from "@/components/dashboard/usage/usage-heatmap";
import { RecentUsage } from "@/components/dashboard/usage/recent-usage";
import { cn } from "@/lib/utils";
import { type UsageTimeRange } from "@/lib/ai/utils";

const timeRangeOptions: { value: UsageTimeRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
];

export default function UsagePage() {
  const [timeRange, setTimeRange] = useState<UsageTimeRange>("month");

  return (
    <div className="flex flex-1 flex-col gap-10 px-4 py-8 md:px-8">
      <div className="flex w-full max-w-3xl flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SettingHeader title="Usage" />
            <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1">
              {timeRangeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTimeRange(option.value)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm transition-colors",
                    timeRange === option.value
                      ? "bg-background font-medium text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <UsageOverview timeRange={timeRange} />

        <UsageByModel timeRange={timeRange} />

        <UsageChart timeRange={timeRange} />

        <UsageHeatmap />

        <RecentUsage />
      </div>
    </div>
  );
}
