/**
 * Playwright route handlers for mocking API endpoints.
 */
import type { Page, Route } from "@playwright/test";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
};

/** Mock the /api/chat endpoint with a pre-built SSE stream body */
export async function mockChatRoute(
  page: Page,
  streamBody: string,
): Promise<void> {
  await page.route("**/api/chat", (route: Route) => {
    route.fulfill({
      status: 200,
      headers: SSE_HEADERS,
      body: streamBody,
    });
  });
}

/** Mock the /api/chat endpoint with a sequence of responses (one per request) */
export async function mockChatRouteSequence(
  page: Page,
  responses: string[],
): Promise<void> {
  let callIndex = 0;
  await page.route("**/api/chat", (route: Route) => {
    const body = responses[callIndex] ?? responses[responses.length - 1]!;
    callIndex++;
    route.fulfill({
      status: 200,
      headers: SSE_HEADERS,
      body,
    });
  });
}

/** Mock the /api/chat endpoint to return an HTTP error */
export async function mockChatRouteError(
  page: Page,
  status = 500,
  message = "Internal Server Error",
): Promise<void> {
  await page.route("**/api/chat", (route: Route) => {
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ error: message }),
    });
  });
}
