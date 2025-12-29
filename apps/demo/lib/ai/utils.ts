import { getModelPricing } from "./models";

export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = getModelPricing(modelId);

  const inputCost =
    (inputTokens / 1_000_000) * (pricing.input ?? 0) * 1_000_000;
  const outputCost =
    (outputTokens / 1_000_000) * (pricing.output ?? 0) * 1_000_000;

  return Math.round(inputCost + outputCost);
}

export function formatCost(microdollars: number): string {
  const dollars = microdollars / 1_000_000;

  if (dollars < 0.01) {
    return `$${dollars.toFixed(4)}`;
  }
  if (dollars < 1) {
    return `$${dollars.toFixed(3)}`;
  }
  return `$${dollars.toFixed(2)}`;
}

export function formatTokens(tokens: number): string {
  if (tokens === 0) return "0";
  if (tokens < 1000) return tokens.toString();
  if (tokens < 1_000_000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1_000_000).toFixed(2)}M`;
}

export function formatTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export type UsageTimeRange = "today" | "week" | "month" | "all";
