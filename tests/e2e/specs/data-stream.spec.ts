import { test, expect } from "../fixtures/chat";
import {
  createDataStreamTextStream,
  createDataStreamToolCallStream,
  resetDataStreamCounters,
} from "../mocks/data-stream-streams";
import { mockDataStreamAPI } from "../mocks/data-stream-handlers";

test.beforeEach(async () => {
  resetDataStreamCounters();
});

test.describe("DataStream Integration (assistant-transport)", () => {
  test("should load with empty thread and show welcome", async ({ chat }) => {
    await mockDataStreamAPI(chat.page);
    await chat.goto();
    await chat.assertWelcomeVisible();
  });

  test("should send a message and display response", async ({ chat }) => {
    await mockDataStreamAPI(chat.page);
    await chat.goto();

    await chat.sendMessage("Hello");
    await chat.waitForAssistantMessage("Hello from DataStream!");

    await chat.assertMessageCount(1, 1);
    await expect(chat.getUserMessages().nth(0)).toContainText("Hello");
    await expect(chat.getAssistantMessages().nth(0)).toContainText(
      "Hello from DataStream!",
    );
  });

  test("should handle streaming text word by word", async ({ chat }) => {
    await mockDataStreamAPI(chat.page, {
      createStream: () =>
        createDataStreamTextStream(
          "The quick brown fox jumps over the lazy dog",
        ),
    });
    await chat.goto();

    await chat.sendMessage("Tell me a sentence");
    await chat.waitForAssistantMessage("The quick brown fox");

    await expect(chat.getAssistantMessages().nth(0)).toContainText(
      "The quick brown fox jumps over the lazy dog",
    );
  });

  test("should handle multiple message exchanges", async ({ chat }) => {
    await mockDataStreamAPI(chat.page, {
      createStreamSequence: [
        () => createDataStreamTextStream("First response"),
        () => createDataStreamTextStream("Second response"),
      ],
    });
    await chat.goto();

    await chat.sendMessage("First");
    await chat.waitForAssistantMessage("First response");

    await chat.sendMessage("Second");
    await chat.waitForAssistantMessage("Second response");

    await chat.assertMessageCount(2, 2);
  });

  test("should display tool call with follow-up text", async ({ chat }) => {
    await mockDataStreamAPI(chat.page, {
      createStream: () =>
        createDataStreamToolCallStream(
          "get_weather",
          { location: "NYC" },
          { temp: 72, condition: "sunny" },
          "The weather in NYC is 72°F and sunny.",
        ),
    });
    await chat.goto();

    await chat.sendMessage("What's the weather in NYC?");
    await chat.waitForAssistantMessage("The weather in NYC is 72°F and sunny.");
  });

  test("should clear composer after sending", async ({ chat }) => {
    await mockDataStreamAPI(chat.page);
    await chat.goto();

    await chat.sendMessage("Test message");
    await chat.waitForAssistantMessage("Hello from DataStream!");
    await chat.assertComposerEmpty();
  });
});
