/**
 * Playwright route handlers for mocking the assistant-transport API.
 *
 * The with-assistant-transport example sends POST requests to an external URL
 * (default: http://localhost:8010/assistant). We intercept these at the browser
 * level via page.route().
 *
 * The response uses the DataStream format (line-based: {type}:{json}\n).
 */
import type { Page, Route } from "@playwright/test";
import { createDataStreamTextStream } from "./data-stream-streams";

const STREAM_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "x-vercel-ai-data-stream": "v1",
};

interface DataStreamMockConfig {
  /** Stream body to return */
  streamBody?: string;
  /** Sequence of stream bodies (one per request) */
  streamSequence?: string[];
}

/**
 * Set up assistant-transport API mocks for a page.
 * Intercepts POST requests to localhost:8010/assistant.
 */
export async function mockDataStreamAPI(
  page: Page,
  config: DataStreamMockConfig = {},
): Promise<void> {
  const {
    streamBody = createDataStreamTextStream("Hello from DataStream!"),
    streamSequence,
  } = config;

  let callIndex = 0;

  // Intercept the assistant-transport endpoint
  await page.route("**/assistant", (route: Route) => {
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
        headers: STREAM_HEADERS,
        body,
      });
    } else {
      route.continue();
    }
  });
}
