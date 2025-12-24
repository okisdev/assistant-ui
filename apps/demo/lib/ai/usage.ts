import { database } from "@/lib/database";
import { usage } from "@/lib/database/schema";
import { calculateCost } from "./utils";

export type FinishReason =
  | "stop"
  | "length"
  | "content-filter"
  | "tool-calls"
  | "error"
  | "other"
  | "unknown";

export type RecordUsageParams = {
  userId: string;
  chatId: string | null;
  messageId?: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens?: number;
  totalTokens: number;
  finishReason?: FinishReason;
};

export async function recordUsage(params: RecordUsageParams): Promise<void> {
  const {
    userId,
    chatId,
    messageId,
    modelId,
    inputTokens,
    outputTokens,
    reasoningTokens,
    totalTokens,
    finishReason,
  } = params;

  const estimatedCost = calculateCost(modelId, inputTokens, outputTokens);

  await database.insert(usage).values({
    id: crypto.randomUUID(),
    userId,
    chatId,
    messageId,
    modelId,
    inputTokens,
    outputTokens,
    reasoningTokens: reasoningTokens ?? null,
    totalTokens,
    estimatedCost,
    finishReason: finishReason ?? null,
  });
}
