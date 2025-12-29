"use client";

import { useMemo, useRef, useEffect } from "react";
import { Activity } from "lucide-react";

import { api } from "@/utils/trpc/client";
import { cn } from "@/lib/utils";
import { formatTokens } from "@/lib/ai/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type HeatmapData = {
  date: string;
  totalTokens: number;
  requestCount: number;
};

const CELL_SIZE = 11;
const CELL_GAP = 3;
const CELL_WITH_GAP = CELL_SIZE + CELL_GAP;
const DAY_LABEL_WIDTH = 32;

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayString(): string {
  return toLocalDateString(new Date());
}

function generateDateRange(): string[] {
  const dates: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(toLocalDateString(date));
  }

  return dates;
}

function getIntensityLevel(tokens: number, maxTokens: number): number {
  if (tokens === 0) return 0;
  if (maxTokens === 0) return 0;
  const ratio = tokens / maxTokens;
  if (ratio < 0.25) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 0.75) return 3;
  return 4;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year!, month! - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function HeatmapSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-muted/50 p-4">
      <div className="h-5 w-48 animate-pulse rounded bg-muted" />
      <div className="h-[98px] w-full animate-pulse rounded bg-muted" />
    </div>
  );
}

const INTENSITY_CLASSES = {
  0: "bg-muted",
  1: "bg-emerald-400/40 dark:bg-emerald-500/30",
  2: "bg-emerald-400/60 dark:bg-emerald-500/50",
  3: "bg-emerald-500/80 dark:bg-emerald-500/70",
  4: "bg-emerald-500 dark:bg-emerald-500",
} as const;

export function UsageHeatmap() {
  const { data, isLoading } = api.usage.getHeatmap.useQuery();
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    dataMap,
    maxTokens,
    weeks,
    monthLabels,
    todayString,
    totalTokens,
    activeDays,
  } = useMemo(() => {
    const dateRange = generateDateRange();
    const dataMap = new Map<string, HeatmapData>();
    const todayString = getTodayString();

    let totalTokens = 0;
    let activeDays = 0;

    if (data) {
      for (const item of data) {
        dataMap.set(item.date, item);
        totalTokens += item.totalTokens;
        if (item.totalTokens > 0) activeDays++;
      }
    }

    const maxTokens = data ? Math.max(...data.map((d) => d.totalTokens), 1) : 1;

    const weeks: string[][] = [];
    let currentWeek: string[] = [];

    const firstDateParts = dateRange[0]!.split("-").map(Number);
    const firstDate = new Date(
      firstDateParts[0]!,
      firstDateParts[1]! - 1,
      firstDateParts[2],
    );
    const firstDayOfWeek = firstDate.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push("");
    }

    for (const date of dateRange) {
      currentWeek.push(date);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    const monthLabels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const firstValidDate = week.find((d) => d !== "");
      if (firstValidDate) {
        const parts = firstValidDate.split("-").map(Number);
        const date = new Date(parts[0]!, parts[1]! - 1, parts[2]);
        const month = date.getMonth();
        if (month !== lastMonth) {
          monthLabels.push({
            label: date.toLocaleDateString("en-US", { month: "short" }),
            weekIndex,
          });
          lastMonth = month;
        }
      }
    });

    return {
      dataMap,
      maxTokens,
      weeks,
      monthLabels,
      todayString,
      totalTokens,
      activeDays,
    };
  }, [data]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [weeks]);

  if (isLoading) {
    return <HeatmapSkeleton />;
  }

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <div className="flex flex-col gap-4 rounded-lg bg-muted/50 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-medium text-sm">
          {totalTokens > 0 ? (
            <>
              <span className="text-foreground">
                {formatTokens(totalTokens)}
              </span>
              <span className="text-muted-foreground"> in the last year</span>
            </>
          ) : (
            <span className="text-muted-foreground">
              No activity in the last year
            </span>
          )}
        </h3>
        {activeDays > 0 && (
          <p className="text-muted-foreground text-xs">
            {activeDays} active {activeDays === 1 ? "day" : "days"}
          </p>
        )}
      </div>

      {!data || data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <Activity className="size-5 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">
            Start chatting to see your activity
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex">
            <div
              className="flex shrink-0 flex-col"
              style={{ width: `${DAY_LABEL_WIDTH}px`, paddingTop: "16px" }}
            >
              {dayLabels.map((label, i) => (
                <div
                  key={i}
                  className="flex items-center pr-2 text-[10px] text-muted-foreground"
                  style={{ height: `${CELL_WITH_GAP}px` }}
                >
                  {label}
                </div>
              ))}
            </div>

            <div
              ref={scrollRef}
              className="scrollbar-none flex-1 overflow-x-auto pr-0.5 pb-0.5"
            >
              <div className="ml-auto inline-flex flex-col items-end">
                <div className="mb-1 flex h-3.5 self-stretch">
                  {monthLabels.map((month, index) => {
                    const nextMonth = monthLabels[index + 1];
                    const width = nextMonth
                      ? (nextMonth.weekIndex - month.weekIndex) * CELL_WITH_GAP
                      : (weeks.length - month.weekIndex) * CELL_WITH_GAP;

                    const minWidthForLabel = CELL_WITH_GAP * 3;
                    const showLabel = width >= minWidthForLabel;

                    return (
                      <div
                        key={`${month.label}-${index}`}
                        className="text-[10px] text-muted-foreground"
                        style={{
                          width: `${width}px`,
                          marginLeft:
                            index === 0
                              ? `${month.weekIndex * CELL_WITH_GAP}px`
                              : 0,
                        }}
                      >
                        {showLabel ? month.label : null}
                      </div>
                    );
                  })}
                </div>

                <div className="flex" style={{ gap: `${CELL_GAP}px` }}>
                  {weeks.map((week, weekIndex) => (
                    <div
                      key={weekIndex}
                      className="flex flex-col"
                      style={{ gap: `${CELL_GAP}px` }}
                    >
                      {week.map((date, dayIndex) => {
                        if (!date) {
                          return (
                            <div
                              key={`empty-${dayIndex}`}
                              style={{
                                width: `${CELL_SIZE}px`,
                                height: `${CELL_SIZE}px`,
                              }}
                            />
                          );
                        }

                        const dayData = dataMap.get(date);
                        const level = getIntensityLevel(
                          dayData?.totalTokens ?? 0,
                          maxTokens,
                        ) as keyof typeof INTENSITY_CLASSES;
                        const isToday = date === todayString;

                        return (
                          <Tooltip key={date}>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "rounded-[3px] outline-1 outline-offset-0 transition-all",
                                  INTENSITY_CLASSES[level],
                                  isToday
                                    ? "outline outline-foreground/40"
                                    : "hover:outline hover:outline-foreground/20",
                                )}
                                style={{
                                  width: `${CELL_SIZE}px`,
                                  height: `${CELL_SIZE}px`,
                                }}
                              />
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="flex flex-col gap-0.5 bg-foreground px-2 py-1.5"
                            >
                              <p className="font-medium text-background text-xs">
                                {dayData && dayData.totalTokens > 0
                                  ? `${formatTokens(dayData.totalTokens)} · ${dayData.requestCount} ${dayData.requestCount === 1 ? "request" : "requests"}`
                                  : "No activity"}
                              </p>
                              <p className="text-[10px] text-background/70">
                                {formatDate(date)}
                                {isToday && " (Today)"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
            <span>Less</span>
            {([0, 1, 2, 3, 4] as const).map((level) => (
              <div
                key={level}
                className={cn("rounded-[3px]", INTENSITY_CLASSES[level])}
                style={{ width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px` }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      )}
    </div>
  );
}
