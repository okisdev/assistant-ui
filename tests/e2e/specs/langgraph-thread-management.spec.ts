import { test as base, expect } from "../fixtures/chat";
import { ThreadListPage } from "../fixtures/thread-list";
import {
  createLangGraphTextStream,
  resetLangGraphCounters,
} from "../mocks/langgraph-streams";
import {
  mockLangGraphAPI,
  resetLangGraphMocks,
} from "../mocks/langgraph-handlers";

/** Extended test fixture with thread list support */
const test = base.extend<{ threadList: ThreadListPage }>({
  threadList: async ({ page }, use) => {
    const threadList = new ThreadListPage(page);
    await use(threadList);
  },
});

test.beforeEach(async () => {
  resetLangGraphCounters();
  resetLangGraphMocks();
});

test.describe("Thread Management (LangGraph)", () => {
  test("should display thread list on load", async ({ chat, threadList }) => {
    await mockLangGraphAPI(chat.page);
    await chat.goto();
    await threadList.assertVisible();
  });

  test("should show thread item after sending message", async ({
    chat,
    threadList,
  }) => {
    await mockLangGraphAPI(chat.page);
    await chat.goto();
    await threadList.assertVisible();

    // Before sending: thread is "new" and not listed
    await threadList.assertThreadCount(0);

    // Send a message to initialize the thread
    await chat.sendMessage("Hello");
    await chat.waitForAssistantMessage("Hello from LangGraph!");

    // After sending: thread is initialized and appears in the list
    await threadList.assertThreadCount(1, 10000);
  });

  test("should create new thread via button", async ({ chat, threadList }) => {
    await mockLangGraphAPI(chat.page);
    await chat.goto();

    // Send a message to initialize the first thread
    await chat.sendMessage("Hello in thread 1");
    await chat.waitForAssistantMessage("Hello from LangGraph!");
    await threadList.assertThreadCount(1, 10000);

    // Create new thread
    await threadList.createNewThread();

    // Should show welcome state (empty thread)
    await chat.assertWelcomeVisible();

    // Thread list should still have 1 item (old thread; new one is uninitialized)
    await threadList.assertThreadCount(1);
  });

  test("should switch between threads", async ({ chat, threadList }) => {
    await mockLangGraphAPI(chat.page, {
      streamSequence: [
        createLangGraphTextStream("Response in thread 1"),
        createLangGraphTextStream("Response in thread 2"),
      ],
    });
    await chat.goto();

    // Send message in first thread
    await chat.sendMessage("Message in thread 1");
    await chat.waitForAssistantMessage("Response in thread 1");

    // Create new thread
    await threadList.createNewThread();
    await chat.assertWelcomeVisible();

    // Send message in second thread
    await chat.sendMessage("Message in thread 2");
    await chat.waitForAssistantMessage("Response in thread 2");

    // Both threads should now be in the list
    await threadList.assertThreadCount(2, 10000);

    // Switch back to first thread
    await threadList.switchToThread(1);

    // Should show the first thread's messages
    await chat.waitForAssistantMessage("Response in thread 1");
  });

  test("should show new thread button", async ({ chat, threadList }) => {
    await mockLangGraphAPI(chat.page);
    await chat.goto();
    await expect(threadList.newThreadButton).toBeVisible();
  });

  test("should hide welcome after sending message", async ({ chat }) => {
    await mockLangGraphAPI(chat.page);
    await chat.goto();
    await chat.assertWelcomeVisible();

    await chat.sendMessage("Hello");
    await chat.assertWelcomeHidden();
    await chat.waitForAssistantMessage("Hello from LangGraph!");
  });
});
