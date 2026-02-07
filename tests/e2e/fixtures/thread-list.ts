/**
 * ThreadList Page Object for assistant-ui E2E tests.
 */
import { type Page, type Locator, expect } from "@playwright/test";

export class ThreadListPage {
  readonly page: Page;
  readonly threadListRoot: Locator;
  readonly newThreadButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.threadListRoot = page.locator(".aui-thread-list-root");
    this.newThreadButton = page.locator(".aui-thread-list-new");
  }

  /** Get all thread list items */
  getItems(): Locator {
    return this.page.locator(".aui-thread-list-item");
  }

  /** Get a thread item by index */
  getItemByIndex(index: number): Locator {
    return this.getItems().nth(index);
  }

  /** Get the currently active thread item */
  getActiveItem(): Locator {
    return this.page.locator('.aui-thread-list-item[data-active="true"]');
  }

  /** Get thread item titles */
  getItemTriggers(): Locator {
    return this.page.locator(".aui-thread-list-item-trigger");
  }

  /** Click "New Thread" button */
  async createNewThread() {
    await this.newThreadButton.click();
  }

  /** Click on a thread item to switch to it */
  async switchToThread(index: number) {
    await this.getItemByIndex(index)
      .locator(".aui-thread-list-item-trigger")
      .click();
  }

  /** Assert thread count */
  async assertThreadCount(count: number, timeout = 5000) {
    await expect(this.getItems()).toHaveCount(count, { timeout });
  }

  /** Assert an active thread exists */
  async assertHasActiveThread() {
    await expect(this.getActiveItem()).toBeVisible();
  }

  /** Assert thread list is visible */
  async assertVisible() {
    await expect(this.threadListRoot).toBeVisible();
  }

  /** Get all thread titles as text */
  async getThreadTitles(): Promise<string[]> {
    return this.getItemTriggers().allTextContents();
  }
}
