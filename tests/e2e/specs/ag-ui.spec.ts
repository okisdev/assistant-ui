import { test, expect } from "../fixtures/chat";
import {
  createAgUiTextStream,
  createAgUiToolCallStream,
  resetAgUiCounters,
} from "../mocks/ag-ui-streams";
import { mockAgUiAPI } from "../mocks/ag-ui-handlers";

test.beforeEach(async () => {
  resetAgUiCounters();
});

test.describe("AG-UI Integration", () => {
  test("should load with empty thread and show welcome", async ({ chat }) => {
    await mockAgUiAPI(chat.page);
    await chat.goto();
    await chat.assertWelcomeVisible();
  });

  test("should send a message and display response", async ({ chat }) => {
    await mockAgUiAPI(chat.page);
    await chat.goto();

    await chat.sendMessage("Hello");
    await chat.waitForAssistantMessage("Hello from AG-UI!");

    const userMsgs = await chat.getUserMessages();
    const assistantMsgs = await chat.getAssistantMessages();
    expect(userMsgs).toHaveLength(1);
    expect(assistantMsgs).toHaveLength(1);
    expect(userMsgs[0]).toContain("Hello");
    expect(assistantMsgs[0]).toContain("Hello from AG-UI!");
  });

  test("should handle streaming text", async ({ chat }) => {
    await mockAgUiAPI(chat.page, {
      streamBody: createAgUiTextStream(
        "The quick brown fox jumps over the lazy dog",
      ),
    });
    await chat.goto();

    await chat.sendMessage("Tell me a sentence");
    await chat.waitForAssistantMessage("The quick brown fox");

    const msgs = await chat.getAssistantMessages();
    expect(msgs[0]).toContain("The quick brown fox jumps over the lazy dog");
  });

  test("should handle multiple message exchanges", async ({ chat }) => {
    await mockAgUiAPI(chat.page, {
      streamSequence: [
        createAgUiTextStream("First response"),
        createAgUiTextStream("Second response"),
      ],
    });
    await chat.goto();

    await chat.sendMessage("First");
    await chat.waitForAssistantMessage("First response");

    await chat.sendMessage("Second");
    await chat.waitForAssistantMessage("Second response");

    await chat.assertMessageCount({ user: 2, assistant: 2 });
  });

  test("should display tool call with follow-up text", async ({ chat }) => {
    await mockAgUiAPI(chat.page, {
      streamBody: createAgUiToolCallStream(
        "lookup",
        { query: "test" },
        "Found 3 results",
        "I found 3 results for your query.",
      ),
    });
    await chat.goto();

    await chat.sendMessage("Search for test");
    await chat.waitForAssistantMessage("I found 3 results for your query.");
  });

  test("should clear composer after sending", async ({ chat }) => {
    await mockAgUiAPI(chat.page);
    await chat.goto();

    await chat.sendMessage("Test message");
    await chat.waitForAssistantMessage("Hello from AG-UI!");

    const composerValue = await chat.page
      .locator(".aui-composer-input")
      .inputValue();
    expect(composerValue).toBe("");
  });
});
