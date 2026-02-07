import { test, expect } from "../fixtures/chat";

test.describe("External Store Integration", () => {
  test("should display welcome state on initial load", async ({ chat }) => {
    await chat.goto();
    await chat.assertWelcomeVisible();
    await chat.assertComposerEmpty();
  });

  test("should send a message and receive hardcoded response", async ({
    chat,
  }) => {
    await chat.goto();

    await chat.sendMessage("Hello");

    // User message should appear
    await expect(chat.getLastUserMessage()).toContainText("Hello");

    // Assistant responds with "Hello, world!" after ~1 second delay
    await chat.waitForAssistantMessage("Hello, world!", 5000);
    await chat.assertMessageCount(1, 1);
  });

  test("should handle multiple messages", async ({ chat }) => {
    await chat.goto();

    // First message
    await chat.sendMessage("First message");
    await chat.waitForAssistantMessage("Hello, world!", 5000);
    await chat.assertMessageCount(1, 1);

    // Second message
    await chat.sendMessage("Second message");
    // Wait for the new assistant message (should be 2 total now)
    await expect(chat.getAssistantMessages()).toHaveCount(2, { timeout: 5000 });
    await chat.assertMessageCount(2, 2);
  });

  test("should clear composer after sending", async ({ chat }) => {
    await chat.goto();

    await chat.sendMessage("Test");
    await chat.assertComposerEmpty();
  });

  test("should hide welcome after first message", async ({ chat }) => {
    await chat.goto();
    await chat.assertWelcomeVisible();

    await chat.sendMessage("Hello");
    await chat.assertWelcomeHidden();
  });

  test("should display messages in correct order", async ({ chat }) => {
    await chat.goto();

    await chat.sendMessage("First");
    await chat.waitForAssistantMessage("Hello, world!", 5000);

    await chat.sendMessage("Second");
    await expect(chat.getAssistantMessages()).toHaveCount(2, { timeout: 5000 });

    // Verify order: user messages should be "First" then "Second"
    const userMessages = chat.getUserMessages();
    await expect(userMessages.nth(0)).toContainText("First");
    await expect(userMessages.nth(1)).toContainText("Second");

    // All assistant messages should be "Hello, world!"
    const assistantMessages = chat.getAssistantMessages();
    await expect(assistantMessages.nth(0)).toContainText("Hello, world!");
    await expect(assistantMessages.nth(1)).toContainText("Hello, world!");
  });
});
