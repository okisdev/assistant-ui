import type { IndicatorPosition } from "../types";

const STORAGE_KEY = "assistant-ui-devtools-position";
const DEFAULT_POSITION: IndicatorPosition = "bottom-right";
const VALID_POSITIONS = new Set<string>([
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
]);

export function loadPosition(): IndicatorPosition {
  if (typeof localStorage === "undefined") return DEFAULT_POSITION;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_POSITIONS.has(stored)) {
      return stored as IndicatorPosition;
    }
  } catch {
    // localStorage access can throw in some contexts
  }

  return DEFAULT_POSITION;
}

export function savePosition(position: IndicatorPosition): void {
  if (typeof localStorage === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, position);
  } catch {
    // localStorage access can throw in some contexts
  }
}
