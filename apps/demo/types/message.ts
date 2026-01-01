export type MessageUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  reasoningTokens?: number;
};

export type MessageTiming = {
  streamStartTime?: number;
  timeToFirstChunk?: number;
  timeToFirstToken?: number;
  totalStreamTime?: number;
  totalChunks?: number;
  estimatedTokens?: number;
  tokensPerSecond?: number;
  largestChunkGap?: number;
  usage?: MessageUsage;
};
