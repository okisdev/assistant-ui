import { test } from "@playwright/test";
import {
  createDataStreamTextStream,
  resetDataStreamCounters,
} from "../mocks/data-stream-streams";
import { mockDataStreamAPI } from "../mocks/data-stream-handlers";

test("debug data-stream", async ({ page }) => {
  resetDataStreamCounters();
  const allLogs: string[] = [];

  page.on("console", (msg) =>
    allLogs.push(`[console.${msg.type()}] ${msg.text()}`),
  );
  page.on("pageerror", (err) => allLogs.push(`[PAGE_ERROR] ${err.message}`));
  page.on("requestfailed", (req) =>
    allLogs.push(
      `[REQ_FAILED] ${req.method()} ${req.url()} - ${req.failure()?.errorText}`,
    ),
  );

  // Log ALL requests
  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (
      url.includes("assistant") ||
      url.includes("/api/") ||
      url.includes("8010")
    ) {
      allLogs.push(`[ROUTE] ${route.request().method()} ${url}`);
    }
    route.continue();
  });

  await mockDataStreamAPI(page, {
    streamBody: createDataStreamTextStream("Debug text response"),
  });

  await page.goto("http://localhost:3004");
  await page.locator(".aui-thread-root").waitFor({ state: "visible" });

  await page.locator(".aui-composer-input").fill("Hello");
  await page.locator(".aui-composer-send").click();
  await page.waitForTimeout(5000);

  console.log("=== ALL LOGS ===");
  for (const log of allLogs) console.log(log);

  const assistantMsgs = await page
    .locator(".aui-assistant-message-content")
    .count();
  console.log(`assistant messages: ${assistantMsgs}`);
});
