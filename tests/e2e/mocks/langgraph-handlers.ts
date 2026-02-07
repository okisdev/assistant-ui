/**
 * Playwright route handlers for mocking LangGraph API endpoints.
 *
 * The LangGraph example proxies all API calls through Next.js:
 *   Browser → /api/threads/* → Next.js API route → LangGraph backend
 *
 * We intercept at the browser level, so the Next.js API route never runs.
 */
import type { Page, Route } from "@playwright/test";
import {
  createThreadResponse,
  createThreadStateResponse,
  createLangGraphTextStream,
} from "./langgraph-streams";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
};

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

interface LangGraphMockConfig {
  /** Stream body to return for POST /threads/{id}/runs/stream */
  streamBody?: string;
  /** Sequence of stream bodies (one per request) */
  streamSequence?: string[];
  /** Thread state for GET /threads/{id}/state */
  threadStates?: Record<string, string>;
  /** Default empty thread state */
  defaultThreadState?: string;
}

let threadCounter = 0;

/**
 * Set up all LangGraph API mocks for a page.
 * Call this BEFORE navigating to the page.
 */
export async function mockLangGraphAPI(
  page: Page,
  config: LangGraphMockConfig = {},
): Promise<void> {
  const {
    streamBody = createLangGraphTextStream("Hello from LangGraph!"),
    streamSequence,
    threadStates = {},
    defaultThreadState = createThreadStateResponse(),
  } = config;

  let streamCallIndex = 0;

  // Mock thread creation: POST /api/threads
  await page.route("**/api/threads", (route: Route) => {
    if (route.request().method() === "POST") {
      const threadId = `thread_mock_${++threadCounter}`;
      route.fulfill({
        status: 200,
        headers: JSON_HEADERS,
        body: createThreadResponse(threadId),
      });
    } else {
      route.continue();
    }
  });

  // Mock thread state: GET /api/threads/{id}/state
  await page.route("**/api/threads/*/state", (route: Route) => {
    if (route.request().method() === "GET") {
      const url = route.request().url();
      const threadIdMatch = url.match(/\/threads\/([^/]+)\/state/);
      const threadId = threadIdMatch?.[1] ?? "";
      const state = threadStates[threadId] ?? defaultThreadState;
      route.fulfill({
        status: 200,
        headers: JSON_HEADERS,
        body: state,
      });
    } else {
      route.continue();
    }
  });

  // Mock streaming: POST /api/threads/{id}/runs/stream
  await page.route("**/api/threads/*/runs/stream", (route: Route) => {
    let body: string;
    if (streamSequence) {
      body =
        streamSequence[streamCallIndex] ??
        streamSequence[streamSequence.length - 1]!;
      streamCallIndex++;
    } else {
      body = streamBody;
    }
    route.fulfill({
      status: 200,
      headers: SSE_HEADERS,
      body,
    });
  });

  // Mock thread metadata: GET /api/threads/{id}
  await page.route(/\/api\/threads\/[^/]+$/, (route: Route) => {
    if (route.request().method() === "GET") {
      const url = route.request().url();
      const threadIdMatch = url.match(/\/threads\/([^/]+)$/);
      const threadId = threadIdMatch?.[1] ?? "thread_mock_unknown";
      route.fulfill({
        status: 200,
        headers: JSON_HEADERS,
        body: createThreadResponse(threadId),
      });
    } else {
      route.continue();
    }
  });
}

/** Reset mock state between tests */
export function resetLangGraphMocks(): void {
  threadCounter = 0;
}
