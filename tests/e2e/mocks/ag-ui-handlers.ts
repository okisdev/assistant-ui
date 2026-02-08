/**
 * Playwright route handlers for mocking the AG-UI agent endpoint.
 *
 * The with-ag-ui example uses HttpAgent from @ag-ui/client which sends
 * POST requests to an external URL (default: http://localhost:8000/agent).
 * We intercept these at the browser level via page.route().
 *
 * The response uses SSE format: data: {json}\n\n
 */
import type { Page, Route } from "@playwright/test";
import { createAgUiTextStream } from "./ag-ui-streams";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
};

interface AgUiMockConfig {
  /** Stream body to return */
  streamBody?: string;
  /** Sequence of stream bodies (one per request) */
  streamSequence?: string[];
}

/**
 * Set up AG-UI agent mocks for a page.
 * Intercepts POST requests to localhost:8000/agent.
 */
export async function mockAgUiAPI(
  page: Page,
  config: AgUiMockConfig = {},
): Promise<void> {
  const {
    streamBody = createAgUiTextStream("Hello from AG-UI!"),
    streamSequence,
  } = config;

  let callIndex = 0;

  // Intercept the AG-UI agent endpoint
  await page.route("**/agent", (route: Route) => {
    if (route.request().method() === "POST") {
      let body: string;
      if (streamSequence) {
        body =
          streamSequence[callIndex] ??
          streamSequence[streamSequence.length - 1]!;
        callIndex++;
      } else {
        body = streamBody;
      }
      route.fulfill({
        status: 200,
        headers: SSE_HEADERS,
        body,
      });
    } else {
      route.continue();
    }
  });
}
