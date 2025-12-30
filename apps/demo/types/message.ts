export type MessageTiming = {
  streamStartTime?: number;
  timeToFirstChunk?: number;
  timeToFirstToken?: number;
  totalStreamTime?: number;
  totalChunks?: number;
  tokensPerSecond?: number;
  largestChunkGap?: number;
};
