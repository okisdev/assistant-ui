/**
 * Playwright route handlers for mocking LangGraph API endpoints.
 *
 * The LangGraph example uses two API layers:
 *   1. LangGraph SDK: Browser → /api/threads/* → LangGraph backend
 *   2. Assistant Cloud: Browser → /cloud/v1/threads → Cloud backend
 *
 * We intercept both at the browser level via page.route().
 * NEXT_PUBLIC_ASSISTANT_BASE_URL must be set to enable the cloud adapter.
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
let cloudThreadCounter = 0;

/**
 * Set up all LangGraph API mocks AND cloud API mocks for a page.
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

  // Inject process.env so the cloud adapter activates in Turbopack dev mode.
  // In Turbopack, `process` is not polyfilled in the browser, so the
  // `typeof process !== "undefined"` guard in cloud.tsx short-circuits.
  await page.addInitScript(() => {
    if (typeof globalThis.process === "undefined") {
      (globalThis as any).process = { env: {} };
    }
    (globalThis as any).process.env.NEXT_PUBLIC_ASSISTANT_BASE_URL =
      "http://localhost:3003/cloud";
  });

  // Track created cloud threads for list/get
  const cloudThreads: Array<{
    id: string;
    external_id: string | null;
    title: string;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
    last_message_at: string;
  }> = [];

  // ── Cloud API mocks (Assistant Cloud) ──────────────────────────

  // Mock JWT for anonymous auth: { header.payload.signature }
  // Payload: { "exp": 9999999999 } → expires far in the future
  const mockJwt =
    "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJleHAiOjk5OTk5OTk5OTl9.mock";

  // Mock auth endpoints (anonymous + refresh)
  await page.route("**/cloud/v1/auth/tokens/**", (route: Route) => {
    route.fulfill({
      status: 200,
      headers: JSON_HEADERS,
      body: JSON.stringify({
        access_token: mockJwt,
        refresh_token: {
          token: "mock_refresh_token",
          expires_at: new Date(Date.now() + 86400_000).toISOString(),
        },
      }),
    });
  });

  // Mock cloud thread list + create: /cloud/v1/threads
  await page.route("**/cloud/v1/threads", (route: Route) => {
    const method = route.request().method();
    if (method === "GET") {
      route.fulfill({
        status: 200,
        headers: JSON_HEADERS,
        body: JSON.stringify({ threads: cloudThreads }),
      });
    } else if (method === "POST") {
      const cloudId = `cloud_thread_${++cloudThreadCounter}`;
      let body: Record<string, unknown> = {};
      try {
        body = JSON.parse(route.request().postData() ?? "{}");
      } catch {
        // ignore parse errors
      }
      const thread = {
        id: cloudId,
        external_id: (body["external_id"] as string) ?? null,
        title: (body["title"] as string) ?? "",
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_message_at:
          (body["last_message_at"] as string) ?? new Date().toISOString(),
        project_id: "test_project",
        workspace_id: "test_workspace",
        metadata: null,
      };
      cloudThreads.push(thread);
      route.fulfill({
        status: 200,
        headers: JSON_HEADERS,
        body: JSON.stringify({ thread_id: cloudId }),
      });
    } else {
      route.continue();
    }
  });

  // Mock cloud thread get/update/delete: /cloud/v1/threads/{id}
  await page.route(/\/cloud\/v1\/threads\/[^/]+$/, (route: Route) => {
    const method = route.request().method();
    const url = route.request().url();
    const idMatch = url.match(/\/cloud\/v1\/threads\/([^/]+)$/);
    const threadId = idMatch?.[1] ? decodeURIComponent(idMatch[1]) : "";

    if (method === "GET") {
      const thread = cloudThreads.find((t) => t.id === threadId);
      if (thread) {
        route.fulfill({
          status: 200,
          headers: JSON_HEADERS,
          body: JSON.stringify(thread),
        });
      } else {
        route.fulfill({
          status: 404,
          headers: JSON_HEADERS,
          body: JSON.stringify({ error: "Thread not found" }),
        });
      }
    } else if (method === "PUT") {
      const thread = cloudThreads.find((t) => t.id === threadId);
      if (thread) {
        let body: Record<string, unknown> = {};
        try {
          body = JSON.parse(route.request().postData() ?? "{}");
        } catch {
          // ignore
        }
        if (body["title"] !== undefined) thread.title = body["title"] as string;
        if (body["is_archived"] !== undefined)
          thread.is_archived = body["is_archived"] as boolean;
        route.fulfill({
          status: 200,
          headers: JSON_HEADERS,
          body: JSON.stringify(thread),
        });
      } else {
        route.fulfill({ status: 404, headers: JSON_HEADERS, body: "{}" });
      }
    } else if (method === "DELETE") {
      const idx = cloudThreads.findIndex((t) => t.id === threadId);
      if (idx >= 0) cloudThreads.splice(idx, 1);
      route.fulfill({ status: 200, headers: JSON_HEADERS, body: "{}" });
    } else {
      route.continue();
    }
  });

  // Mock cloud runs/stream for title generation
  await page.route("**/cloud/v1/runs/stream", (route: Route) => {
    route.fulfill({
      status: 200,
      headers: SSE_HEADERS,
      body: "",
    });
  });

  // ── LangGraph SDK mocks ────────────────────────────────────────

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
  cloudThreadCounter = 0;
}
