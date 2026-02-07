import { test, expect } from "../fixtures/chat";
import {
  createTextStream,
  createToolCallStream,
  createStreamingTextResponse,
} from "../mocks/streams";
import {
  mockChatRoute,
  mockChatRouteSequence,
  mockChatRouteError,
} from "../mocks/handlers";

test.describe("AI SDK Integration", () => {
  test("should display welcome state on initial load", async ({ chat }) => {
    await mockChatRoute(chat.page, createTextStream("Hello!"));
    await chat.goto();
    await chat.assertWelcomeVisible();
    await chat.assertComposerEmpty();
  });

  test("should send a message and display response", async ({ chat }) => {
    const responseText = "Hello! How can I help you today?";
    await mockChatRoute(chat.page, createTextStream(responseText));
    await chat.goto();

    await chat.sendMessage("Hi there");

    // User message should appear
    await expect(chat.getLastUserMessage()).toContainText("Hi there");

    // Welcome should be hidden
    await chat.assertWelcomeHidden();

    // Assistant response should appear
    await chat.waitForAssistantMessage(responseText);
    await chat.assertMessageCount(1, 1);
  });

  test("should handle streaming text response", async ({ chat }) => {
    const chunks = ["The ", "quick ", "brown ", "fox ", "jumps."];
    await mockChatRoute(chat.page, createStreamingTextResponse(chunks));
    await chat.goto();

    await chat.sendMessage("Tell me something");
    await chat.waitForAssistantMessage("The quick brown fox jumps.");
  });

  test("should handle multiple message exchanges", async ({ chat }) => {
    const responses = [
      createTextStream("First response from assistant."),
      createTextStream("Second response from assistant."),
      createTextStream("Third response from assistant."),
    ];
    await mockChatRouteSequence(chat.page, responses);
    await chat.goto();

    // First exchange
    await chat.sendMessage("Message 1");
    await chat.waitForAssistantMessage("First response from assistant.");
    await chat.assertMessageCount(1, 1);

    // Second exchange
    await chat.sendMessage("Message 2");
    await chat.waitForAssistantMessage("Second response from assistant.");
    await chat.assertMessageCount(2, 2);

    // Third exchange
    await chat.sendMessage("Message 3");
    await chat.waitForAssistantMessage("Third response from assistant.");
    await chat.assertMessageCount(3, 3);
  });

  test("should display tool call results", async ({ chat }) => {
    const stream = createToolCallStream(
      "get_current_weather",
      { city: "San Francisco" },
      { temperature: 72, condition: "sunny" },
      "The weather in San Francisco is 72°F and sunny.",
    );
    await mockChatRoute(chat.page, stream);
    await chat.goto();

    await chat.sendMessage("What's the weather in SF?");
    await chat.waitForAssistantMessage(
      "The weather in San Francisco is 72°F and sunny.",
    );
  });

  test("should clear composer after sending message", async ({ chat }) => {
    await mockChatRoute(chat.page, createTextStream("Response"));
    await chat.goto();

    await chat.sendMessage("Test message");
    await chat.assertComposerEmpty();
  });

  test("should handle API error gracefully", async ({ chat }) => {
    await mockChatRouteError(chat.page, 500, "Internal Server Error");
    await chat.goto();

    await chat.sendMessage("This should fail");

    // The user message should still appear
    await expect(chat.getLastUserMessage()).toContainText("This should fail");
  });
});
