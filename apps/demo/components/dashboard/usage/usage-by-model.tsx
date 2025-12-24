"use client";

import { useMemo } from "react";
import { Bot } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts";

import { api } from "@/utils/trpc/client";
import { getModelById } from "@/lib/ai/models";
import { formatCost, formatTokens, type UsageTimeRange } from "@/lib/ai/utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  totalTokens: {
    label: "Tokens",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function ModelBarSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      <div className="h-48 w-full animate-pulse rounded bg-muted/50" />
    </div>
  );
}

export function UsageByModel({ timeRange }: { timeRange: UsageTimeRange }) {
  const { data, isLoading } = api.usage.getByModel.useQuery({ timeRange });

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.slice(0, 8).map((item) => {
      const model = getModelById(item.modelId);
      return {
        modelId: item.modelId,
        modelName: model?.name ?? item.modelId.split("/").pop() ?? item.modelId,
        totalTokens: item.totalTokens,
        requestCount: item.requestCount,
        estimatedCost: item.estimatedCost,
      };
    });
  }, [data]);

  if (isLoading) {
    return <ModelBarSkeleton />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg bg-muted/50 py-8">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted/50">
          <Bot className="size-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm">No model usage yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-medium text-sm">Usage by Model</h3>
      <ChartContainer config={chartConfig} className="h-48 w-full">
        <BarChart
          accessibilityLayer
          data={chartData}
          layout="vertical"
          margin={{ left: 0, right: 12 }}
        >
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatTokens(value)}
          />
          <YAxis
            type="category"
            dataKey="modelName"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={100}
            tickFormatter={(value) =>
              value.length > 12 ? `${value.slice(0, 12)}...` : value
            }
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel
                hideIndicator
                formatter={(_, __, item) => {
                  const data = item.payload as {
                    modelName: string;
                    totalTokens: number;
                    requestCount: number;
                    estimatedCost: number;
                  };
                  return (
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{data.modelName}</span>
                      <div className="flex flex-col gap-0.5 text-muted-foreground">
                        <span>{formatTokens(data.totalTokens)} tokens</span>
                        <span>{data.requestCount} requests</span>
                        <span>{formatCost(data.estimatedCost)}</span>
                      </div>
                    </div>
                  );
                }}
              />
            }
          />
          <Bar dataKey="totalTokens" radius={4}>
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
