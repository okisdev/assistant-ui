import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useEffect, useRef, useState } from "react";

// Test the load effect logic in isolation
// This mirrors the behavior in useLangGraphRuntimeImpl

const useLoadEffect = ({
  load,
  externalId,
}: {
  load:
    | ((
        threadId: string,
      ) => Promise<{ messages: unknown[]; interrupts?: unknown[] }>)
    | undefined;
  externalId: string | undefined;
}) => {
  const [messages, setMessages] = useState<unknown[]>([]);
  const [interrupt, setInterrupt] = useState<unknown>(undefined);

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    const loadFn = loadRef.current;
    if (!loadFn || externalId == null) return;

    let cancelled = false;

    setMessages([]);
    setInterrupt(undefined);

    loadFn(externalId)
      .then(({ messages, interrupts }) => {
        if (cancelled) return;
        setMessages(messages);
        setInterrupt(interrupts?.[0]);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("[LangGraph] Failed to load thread:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [externalId]);

  return { messages, interrupt };
};

describe("useLangGraphRuntime load effect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not call load when externalId is undefined", async () => {
    const loadMock = vi.fn().mockResolvedValue({
      messages: [{ type: "human", content: "Hello" }],
      interrupts: [],
    });

    renderHook(() =>
      useLoadEffect({
        load: loadMock,
        externalId: undefined,
      }),
    );

    // Wait a tick to ensure effect has run
    await Promise.resolve();

    expect(loadMock).not.toHaveBeenCalled();
  });

  it("should call load when externalId is provided", async () => {
    const loadMock = vi.fn().mockResolvedValue({
      messages: [{ type: "human", content: "Hello" }],
      interrupts: [],
    });

    renderHook(() =>
      useLoadEffect({
        load: loadMock,
        externalId: "thread-123",
      }),
    );

    await waitFor(() => {
      expect(loadMock).toHaveBeenCalledWith("thread-123");
    });
  });

  it("should call load again when externalId changes", async () => {
    const loadMock = vi.fn().mockResolvedValue({
      messages: [{ type: "human", content: "Hello" }],
      interrupts: [],
    });

    const { rerender } = renderHook(
      ({ externalId }) =>
        useLoadEffect({
          load: loadMock,
          externalId,
        }),
      { initialProps: { externalId: "thread-123" } },
    );

    await waitFor(() => {
      expect(loadMock).toHaveBeenCalledWith("thread-123");
    });

    loadMock.mockClear();

    // Switch to another thread
    rerender({ externalId: "thread-456" });

    await waitFor(() => {
      expect(loadMock).toHaveBeenCalledWith("thread-456");
    });
  });

  it("should update messages and interrupt after load", async () => {
    const loadMock = vi.fn().mockResolvedValue({
      messages: [
        { type: "human", content: "Hello" },
        { type: "ai", content: "Hi there!" },
      ],
      interrupts: [{ value: "test-interrupt" }],
    });

    const { result } = renderHook(() =>
      useLoadEffect({
        load: loadMock,
        externalId: "thread-123",
      }),
    );

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
      expect(result.current.interrupt).toEqual({ value: "test-interrupt" });
    });
  });

  it("should clear messages before loading new thread", async () => {
    let resolveFirst: (value: unknown) => void;
    const firstLoadPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    const loadMock = vi.fn().mockReturnValue(firstLoadPromise);

    const { result, rerender } = renderHook(
      ({ externalId }) =>
        useLoadEffect({
          load: loadMock,
          externalId,
        }),
      { initialProps: { externalId: "thread-123" } },
    );

    // Resolve first load
    resolveFirst!({
      messages: [{ type: "human", content: "First thread" }],
      interrupts: [],
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
    });

    // Switch to new thread - messages should be cleared immediately
    loadMock.mockResolvedValue({
      messages: [{ type: "human", content: "Second thread" }],
      interrupts: [],
    });

    rerender({ externalId: "thread-456" });

    // Messages should be cleared immediately when switching
    expect(result.current.messages).toHaveLength(0);

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toEqual({
        type: "human",
        content: "Second thread",
      });
    });
  });

  it("should handle load errors gracefully", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const loadError = new Error("Failed to load thread");
    const loadMock = vi.fn().mockRejectedValue(loadError);

    renderHook(() =>
      useLoadEffect({
        load: loadMock,
        externalId: "thread-error",
      }),
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[LangGraph] Failed to load thread:",
        loadError,
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it("should cancel pending load when externalId changes", async () => {
    let resolveFirst: (value: unknown) => void;
    const firstLoadPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    const loadMock = vi
      .fn()
      .mockReturnValueOnce(firstLoadPromise)
      .mockResolvedValueOnce({
        messages: [{ type: "human", content: "Second thread" }],
        interrupts: [],
      });

    const { result, rerender } = renderHook(
      ({ externalId }) =>
        useLoadEffect({
          load: loadMock,
          externalId,
        }),
      { initialProps: { externalId: "thread-123" } },
    );

    // Switch thread before first load completes
    rerender({ externalId: "thread-456" });

    // Now resolve first load - it should be cancelled
    resolveFirst!({
      messages: [
        { type: "human", content: "First thread - should be ignored" },
      ],
      interrupts: [],
    });

    // Wait for second load to complete
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
    });

    // Should have second thread's messages, not first
    expect(result.current.messages[0]).toEqual({
      type: "human",
      content: "Second thread",
    });
  });
});
