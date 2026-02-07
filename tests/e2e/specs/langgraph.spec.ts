import { test, expect } from "../fixtures/chat";
import {
  createLangGraphTextStream,
  createLangGraphToolCallStream,
  resetLangGraphCounters,
} from "../mocks/langgraph-streams";
import {
  mockLangGraphAPI,
  resetLangGraphMocks,
} from "../mocks/langgraph-handlers";

test.beforeEach(async () => {
  resetLangGraphCounters();
  resetLangGraphMocks();
});

test.describe("LangGraph Integration", () => {
  test("should load with empty thread and show welcome", async ({ chat }) => {
    await mockLangGraphAPI(chat.page);
    await chat.goto();
    await chat.assertWelcomeVisible();
    await chat.assertComposerEmpty();
  });

  test("should send a message and display response", async ({ chat }) => {
    const responseText = "Hello! I'm a LangGraph assistant.";
    await mockLangGraphAPI(chat.page, {
      streamBody: createLangGraphTextStream(responseText),
    });
    await chat.goto();

    await chat.sendMessage("Hi there");
    await expect(chat.getLastUserMessage()).toContainText("Hi there");
    await chat.waitForAssistantMessage(responseText);
    await chat.assertMessageCount(1, 1);
  });

  test("should handle multiple message exchanges", async ({ chat }) => {
    await mockLangGraphAPI(chat.page, {
      streamSequence: [
        createLangGraphTextStream("First LangGraph response."),
        createLangGraphTextStream("Second LangGraph response."),
      ],
    });
    await chat.goto();

    await chat.sendMessage("Message 1");
    await chat.waitForAssistantMessage("First LangGraph response.");
    await chat.assertMessageCount(1, 1);

    await chat.sendMessage("Message 2");
    await chat.waitForAssistantMessage("Second LangGraph response.");
    await chat.assertMessageCount(2, 2);
  });

  test("should display tool call with follow-up text", async ({ chat }) => {
    const stream = createLangGraphToolCallStream(
      "get_stock_price",
      { symbol: "AAPL" },
      JSON.stringify({ price: 150.25, currency: "USD" }),
      "Apple stock is currently at $150.25 USD.",
    );
    await mockLangGraphAPI(chat.page, { streamBody: stream });
    await chat.goto();

    await chat.sendMessage("What is the Apple stock price?");
    await chat.waitForAssistantMessage(
      "Apple stock is currently at $150.25 USD.",
    );
  });

  test("should clear composer after sending", async ({ chat }) => {
    await mockLangGraphAPI(chat.page);
    await chat.goto();

    await chat.sendMessage("Test message");
    await chat.assertComposerEmpty();
  });
});
