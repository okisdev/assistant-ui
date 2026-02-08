/**
 * Playwright route handlers for mocking the assistant-transport API.
 *
 * The with-assistant-transport example sends POST requests to an external URL
 * (default: http://localhost:8010/assistant). We intercept these at the browser
 * level via page.route().
 *
 * The response uses the DataStream format (line-based: {type}:{json}\n).
 *
 * The handler accumulates LangChain messages across requests and prepends
 * an aui-state operation to each response with the full conversation history.
 * This is required because useAssistantTransportRuntime ignores all chunks
 * where unstable_state hasn't changed.
 */
import type { Page, Route } from "@playwright/test";
import {
  type DataStreamResult,
  createDataStreamTextStream,
  stateUpdateLine,
} from "./data-stream-streams";

const STREAM_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "x-vercel-ai-data-stream": "v1",
};

/** Extract user message text from the assistant-transport request body */
function extractUserText(postData: string | null): string {
  try {
    const data = JSON.parse(postData || "{}");
    const parts = data.commands?.[0]?.message?.parts;
    if (Array.isArray(parts)) {
      return parts
        .filter((p: { type: string }) => p.type === "text")
        .map((p: { text: string }) => p.text)
        .join("\n");
    }
  } catch {
    // ignore parse errors
  }
  return "";
}

interface DataStreamMockConfig {
  /** Factory that creates a DataStreamResult for each request */
  createStream?: () => DataStreamResult;
  /** Sequence of factories (one per request) */
  createStreamSequence?: (() => DataStreamResult)[];
}

/**
 * Set up assistant-transport API mocks for a page.
 * Intercepts POST requests to localhost:8010/assistant.
 *
 * The handler automatically:
 * 1. Extracts the user's message from the request body
 * 2. Calls the stream factory to get the response body + LangChain messages
 * 3. Accumulates all messages in history
 * 4. Prepends an aui-state operation with the full history
 */
export async function mockDataStreamAPI(
  page: Page,
  config: DataStreamMockConfig = {},
): Promise<void> {
  const { createStream, createStreamSequence } = config;

  const messageHistory: unknown[] = [];
  let callIndex = 0;

  const defaultFactory = () =>
    createDataStreamTextStream("Hello from DataStream!");

  // Intercept the assistant-transport endpoint
  await page.route("**/assistant", (route: Route) => {
    if (route.request().method() === "POST") {
      const userText = extractUserText(route.request().postData());

      // Get stream result from factory
      let result: DataStreamResult;
      if (createStreamSequence) {
        const factory =
          createStreamSequence[callIndex] ??
          createStreamSequence[createStreamSequence.length - 1]!;
        result = factory();
        callIndex++;
      } else if (createStream) {
        result = createStream();
      } else {
        result = defaultFactory();
      }

      // Add user message + AI messages to cumulative history
      messageHistory.push({
        type: "human",
        content: [{ type: "text", text: userText }],
      });
      messageHistory.push(...result.langChainMessages);

      // Prepend aui-state with full history, then the stream body
      const body = stateUpdateLine([...messageHistory]) + result.body;

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
