import { describe, it, expect, vi } from "vitest";
import { ExternalStoreThreadRuntimeCore } from "../legacy-runtime/runtime-cores/external-store/ExternalStoreThreadRuntimeCore";
import type { ExternalStoreAdapter } from "../legacy-runtime/runtime-cores/external-store/ExternalStoreAdapter";
import type { ThreadMessage } from "../types/AssistantTypes";
import type { ThreadMessageLike } from "../legacy-runtime/runtime-cores/external-store/ThreadMessageLike";

const makeMessage = (
  id: string,
  role: "user" | "assistant",
  text: string,
): ThreadMessage => ({
  id,
  role,
  createdAt: new Date(),
  content: [{ type: "text", text }],
  status: role === "assistant" ? { type: "complete" } : undefined,
  metadata: { steps: [], custom: {} },
});

const createRuntime = (store: ExternalStoreAdapter<any>) => {
  return new ExternalStoreThreadRuntimeCore(
    { getModelContext: () => ({ tools: {} }) },
    store,
  );
};

describe("ExternalStoreThreadRuntimeCore messageTree", () => {
  describe("linear tree", () => {
    it("displays messages in order", () => {
      const m1 = makeMessage("1", "user", "hello");
      const m2 = makeMessage("2", "assistant", "hi");

      const runtime = createRuntime({
        messageTree: {
          messages: [
            { message: m1, parentId: null },
            { message: m2, parentId: "1" },
          ],
        },
        onNew: vi.fn(),
      });

      expect(runtime.messages).toHaveLength(2);
      expect(runtime.messages[0]!.id).toBe("1");
      expect(runtime.messages[1]!.id).toBe("2");
    });
  });

  describe("branching tree", () => {
    it("uses headId to select active branch", () => {
      const m1 = makeMessage("1", "user", "hello");
      const m2a = makeMessage("2a", "assistant", "response A");
      const m2b = makeMessage("2b", "assistant", "response B");

      const runtime = createRuntime({
        messageTree: {
          messages: [
            { message: m1, parentId: null },
            { message: m2a, parentId: "1" },
            { message: m2b, parentId: "1" },
          ],
          headId: "2b",
        },
        onNew: vi.fn(),
      });

      expect(runtime.messages).toHaveLength(2);
      expect(runtime.messages[0]!.id).toBe("1");
      expect(runtime.messages[1]!.id).toBe("2b");
    });

    it("defaults to last message when headId is not specified", () => {
      const m1 = makeMessage("1", "user", "hello");
      const m2a = makeMessage("2a", "assistant", "response A");
      const m2b = makeMessage("2b", "assistant", "response B");

      const runtime = createRuntime({
        messageTree: {
          messages: [
            { message: m1, parentId: null },
            { message: m2a, parentId: "1" },
            { message: m2b, parentId: "1" },
          ],
        },
        onNew: vi.fn(),
      });

      // Without headId, switchToBranch uses the last added message
      expect(runtime.messages).toHaveLength(2);
      expect(runtime.messages[1]!.id).toBe("2b");
    });

    it("switchToBranch triggers setMessages", () => {
      const m1 = makeMessage("1", "user", "hello");
      const m2a = makeMessage("2a", "assistant", "response A");
      const m2b = makeMessage("2b", "assistant", "response B");

      const setMessages = vi.fn();
      const runtime = createRuntime({
        messageTree: {
          messages: [
            { message: m1, parentId: null },
            { message: m2a, parentId: "1" },
            { message: m2b, parentId: "1" },
          ],
          headId: "2a",
        },
        setMessages,
        onNew: vi.fn(),
      });

      expect(runtime.messages[1]!.id).toBe("2a");

      runtime.switchToBranch("2b");
      expect(setMessages).toHaveBeenCalled();
      const passedMessages = setMessages.mock.calls[0]![0];
      expect(passedMessages).toHaveLength(2);
      expect(passedMessages[1].id).toBe("2b");
    });

    it("preserves branches when updating tree", () => {
      const m1 = makeMessage("1", "user", "hello");
      const m2a = makeMessage("2a", "assistant", "response A");
      const m2b = makeMessage("2b", "assistant", "response B");

      const treeMessages = [
        { message: m1, parentId: null as string | null },
        { message: m2a, parentId: "1" as string | null },
        { message: m2b, parentId: "1" as string | null },
      ];

      const baseStore: ExternalStoreAdapter<ThreadMessage> = {
        messageTree: {
          messages: treeMessages,
          headId: "2a",
        },
        setMessages: vi.fn(),
        onNew: vi.fn(),
      };

      const runtime = createRuntime(baseStore);
      expect(runtime.messages[1]!.id).toBe("2a");

      // Add a new user message on branch A — branches should still be intact
      const m3 = makeMessage("3", "user", "follow up");
      const updatedTreeMessages = [
        ...treeMessages,
        { message: m3, parentId: "2a" as string | null },
      ];
      runtime.__internal_setAdapter({
        ...baseStore,
        messageTree: {
          messages: updatedTreeMessages,
          headId: "3",
        },
      });

      expect(runtime.messages).toHaveLength(3);
      expect(runtime.messages[2]!.id).toBe("3");

      // switchToBranch calls setMessages — simulate consumer reacting
      // by providing the tree again with the new headId
      runtime.switchToBranch("2b");

      // After switchToBranch, simulate consumer updating the tree headId
      runtime.__internal_setAdapter({
        ...baseStore,
        messageTree: {
          messages: updatedTreeMessages,
          headId: "2b",
        },
      });

      expect(runtime.messages[1]!.id).toBe("2b");
    });
  });

  describe("message deletion from tree", () => {
    it("removes messages no longer in the tree", () => {
      const m1 = makeMessage("1", "user", "hello");
      const m2 = makeMessage("2", "assistant", "hi");
      const m3 = makeMessage("3", "user", "more");

      const baseStore: ExternalStoreAdapter<ThreadMessage> = {
        messageTree: {
          messages: [
            { message: m1, parentId: null },
            { message: m2, parentId: "1" },
            { message: m3, parentId: "2" },
          ],
        },
        onNew: vi.fn(),
      };

      const runtime = createRuntime(baseStore);
      expect(runtime.messages).toHaveLength(3);

      // Remove m3 from the tree
      runtime.__internal_setAdapter({
        ...baseStore,
        messageTree: {
          messages: [
            { message: m1, parentId: null },
            { message: m2, parentId: "1" },
          ],
        },
      });

      expect(runtime.messages).toHaveLength(2);
    });
  });

  describe("convertMessage integration", () => {
    type CustomMsg = { id: string; role: "user" | "assistant"; text: string };

    const convertMessage = (m: CustomMsg): ThreadMessageLike => ({
      id: m.id,
      role: m.role,
      content: [{ type: "text", text: m.text }],
    });

    it("converts custom messages in a tree", () => {
      const runtime = createRuntime({
        messageTree: {
          messages: [
            {
              message: { id: "1", role: "user", text: "hello" },
              parentId: null,
            },
            {
              message: { id: "2", role: "assistant", text: "hi" },
              parentId: "1",
            },
          ],
        },
        convertMessage,
        onNew: vi.fn(),
      } as ExternalStoreAdapter<CustomMsg>);

      expect(runtime.messages).toHaveLength(2);
      expect(runtime.messages[0]!.content[0]).toEqual({
        type: "text",
        text: "hello",
      });
    });
  });

  describe("streaming / optimistic message", () => {
    it("adds optimistic assistant message when isRunning and last message is user", () => {
      const m1 = makeMessage("1", "user", "hello");

      const runtime = createRuntime({
        messageTree: {
          messages: [{ message: m1, parentId: null }],
        },
        isRunning: true,
        onNew: vi.fn(),
      });

      // Should have 2 messages: user + optimistic assistant
      expect(runtime.messages).toHaveLength(2);
      expect(runtime.messages[0]!.id).toBe("1");
      expect(runtime.messages[1]!.role).toBe("assistant");
    });

    it("does not add optimistic message when last message is assistant", () => {
      const m1 = makeMessage("1", "user", "hello");
      const m2 = makeMessage("2", "assistant", "hi");

      const runtime = createRuntime({
        messageTree: {
          messages: [
            { message: m1, parentId: null },
            { message: m2, parentId: "1" },
          ],
        },
        isRunning: true,
        onNew: vi.fn(),
      });

      expect(runtime.messages).toHaveLength(2);
      expect(runtime.messages[1]!.id).toBe("2");
    });
  });

  describe("early return on unchanged", () => {
    it("skips processing when tree and isRunning are unchanged", () => {
      const tree = {
        messages: [
          {
            message: makeMessage("1", "user", "hello"),
            parentId: null as string | null,
          },
        ],
      };

      const store: ExternalStoreAdapter<ThreadMessage> = {
        messageTree: tree,
        onNew: vi.fn(),
      };

      const runtime = createRuntime(store);

      // Same reference — should early return
      const spy = vi.fn();
      runtime.subscribe(spy);
      spy.mockClear();

      runtime.__internal_setAdapter({ ...store, messageTree: tree });

      // Should still notify subscribers (early return path calls _notifySubscribers)
      expect(spy).toHaveBeenCalled();
    });
  });
});
