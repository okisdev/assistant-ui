import type { NormalizedTool } from "./utils/toolNormalization";

// Core types for DevTools UI
export type TabType = "state" | "events" | "context";
export type IndicatorPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";
export type ViewMode = "raw" | "preview";

// Types used by serialization utility
export interface SerializedModelContext {
  system?: string;
  tools?: NormalizedTool[];
  callSettings?: Record<string, unknown>;
  config?: Record<string, unknown>;
}
