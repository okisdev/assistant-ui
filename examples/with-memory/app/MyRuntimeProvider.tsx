"use client";

import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type ThreadMessageLike,
  type AppendMessage,
} from "@assistant-ui/react";
import { useState, useCallback } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const generateId = () => Math.random().toString(36).substring(2, 9);

const convertMessage = (message: ThreadMessageLike): ThreadMessageLike => {
  return message;
};

const getMessageText = (message: ThreadMessageLike): string => {
  const content = message.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .filter((c): c is { type: "text"; text: string } => c.type === "text")
    .map((c) => c.text)
    .join("");
};

export function MyRuntimeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isRunning, setIsRunning] = useState(false);
  const [messages, setMessages] = useState<readonly ThreadMessageLike[]>([]);

  const onNew = useCallback(
    async (message: AppendMessage) => {
      if (message.content.length !== 1 || message.content[0]?.type !== "text")
        throw new Error("Only text content is supported");

      const userText = message.content[0].text;

      // Add user message
      const userMessage: ThreadMessageLike = {
        id: generateId(),
        role: "user",
        content: [{ type: "text", text: userText }],
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // Create placeholder for assistant message
      setIsRunning(true);
      const assistantId = generateId();
      const assistantMessage: ThreadMessageLike = {
        id: assistantId,
        role: "assistant",
        content: [{ type: "text", text: "" }],
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        // Convert messages to OpenAI format
        const chatMessages: ChatMessage[] = updatedMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: getMessageText(m),
        }));

        // Call OpenAI API
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: chatMessages }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        // Stream the response
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;

          // Update assistant message with streamed content
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: [{ type: "text" as const, text: fullContent }],
                  }
                : m,
            ),
          );
        }
      } catch (error) {
        console.error("Chat error:", error);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: [
                    {
                      type: "text" as const,
                      text: "Sorry, an error occurred. Please try again.",
                    },
                  ],
                }
              : m,
          ),
        );
      } finally {
        setIsRunning(false);
      }
    },
    [messages],
  );

  const runtime = useExternalStoreRuntime({
    isRunning,
    messages,
    onNew,
    convertMessage,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
