/**
 * Reusable Playwright fixtures for assistant-ui chat E2E tests.
 */
import {
  test as base,
  expect,
  type Page,
  type Locator,
} from "@playwright/test";
import { resetMockCounters } from "../mocks/streams";

export class ChatPage {
  readonly page: Page;
  readonly composerInput: Locator;
  readonly sendButton: Locator;
  readonly welcomeRoot: Locator;
  readonly threadRoot: Locator;

  constructor(page: Page) {
    this.page = page;
    this.composerInput = page.locator(".aui-composer-input");
    this.sendButton = page.locator(".aui-composer-send");
    this.welcomeRoot = page.locator(".aui-thread-welcome-root");
    this.threadRoot = page.locator(".aui-thread-root");
  }

  /** Navigate to the app and wait for it to load */
  async goto(path = "/") {
    await this.page.goto(path);
    await this.threadRoot.waitFor({ state: "visible" });
  }

  /** Type a message and send it */
  async sendMessage(text: string) {
    await this.composerInput.fill(text);
    await expect(this.composerInput).toHaveValue(text);
    await this.sendButton.click();
  }

  /** Get all user messages */
  getUserMessages(): Locator {
    return this.page.locator(".aui-user-message-content");
  }

  /** Get all assistant messages */
  getAssistantMessages(): Locator {
    return this.page.locator(".aui-assistant-message-content");
  }

  /** Get the last assistant message */
  getLastAssistantMessage(): Locator {
    return this.page.locator(".aui-assistant-message-content").last();
  }

  /** Get the last user message */
  getLastUserMessage(): Locator {
    return this.page.locator(".aui-user-message-content").last();
  }

  /** Wait for an assistant message to appear and contain specific text */
  async waitForAssistantMessage(text: string, timeout = 10_000) {
    await expect(this.getLastAssistantMessage()).toContainText(text, {
      timeout,
    });
  }

  /** Assert welcome screen is visible (no messages) */
  async assertWelcomeVisible() {
    await expect(this.welcomeRoot).toBeVisible();
  }

  /** Assert welcome screen is NOT visible (messages exist) */
  async assertWelcomeHidden() {
    await expect(this.welcomeRoot).not.toBeVisible();
  }

  /** Assert the composer input is empty */
  async assertComposerEmpty() {
    await expect(this.composerInput).toHaveValue("");
  }

  /** Assert message count */
  async assertMessageCount(userCount: number, assistantCount: number) {
    await expect(this.getUserMessages()).toHaveCount(userCount);
    await expect(this.getAssistantMessages()).toHaveCount(assistantCount);
  }
}

export const test = base.extend<{ chat: ChatPage }>({
  chat: async ({ page }, use) => {
    resetMockCounters();
    const chat = new ChatPage(page);
    await use(chat);
  },
});

export { expect } from "@playwright/test";
