"use client";

import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type ThreadMessageLike,
  type AppendMessage,
} from "@assistant-ui/react";
import { useState, useCallback } from "react";
import { memoryStore } from "@/lib/memoryStore";

type ChatMessage = {
  role: "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
};

type StreamChunk =
  | { type: "text"; content: string }
  | { type: "tool_call"; id: string; name: string; arguments: string }
  | { type: "done" };

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

const formatMemoriesAsSystemPrompt = (): string => {
  const memories = memoryStore.getMemories();

  const basePrompt = `You are a helpful assistant with the ability to remember information about the user.

When the user shares personal information, preferences, or anything they might want you to remember, use the save_memory tool to store it. This includes:
- Their name or personal details
- Preferences and interests
- Goals or projects
- Important context

Be proactive about saving memories - if the user mentions something significant, save it without being asked.`;

  if (memories.length === 0) {
    return basePrompt;
  }

  const lines = memories.map((m) => {
    const category = m.category ? `[${m.category}] ` : "";
    return `- ${category}${m.content}`;
  });

  return `${basePrompt}

## User Memories
Important information about the user from previous conversations:
${lines.join("\n")}

Use this information to personalize your responses.`;
};

const executeTool = (
  name: string,
  args: string,
): { success: boolean; message: string; memoryId?: string } => {
  if (name === "save_memory") {
    try {
      const parsed = JSON.parse(args);
      const memory = memoryStore.addMemory({
        content: parsed.content,
        ...(parsed.category && { category: parsed.category }),
      });
      return {
        success: true,
        message: `Memory saved: "${parsed.content}"`,
        memoryId: memory.id,
      };
    } catch (e) {
      return { success: false, message: `Failed to save memory: ${e}` };
    }
  }
  return { success: false, message: `Unknown tool: ${name}` };
};

export function MyRuntimeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isRunning, setIsRunning] = useState(false);
  const [messages, setMessages] = useState<readonly ThreadMessageLike[]>([]);

  const callAPI = useCallback(
    async (
      chatMessages: ChatMessage[],
      system: string,
    ): Promise<{
      text: string;
      toolCalls: Array<{ id: string; name: string; arguments: string }>;
    }> => {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatMessages, system }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let text = "";
      const toolCalls: Array<{ id: string; name: string; arguments: string }> =
        [];
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const chunk: StreamChunk = JSON.parse(line);
            if (chunk.type === "text") {
              text += chunk.content;
            } else if (chunk.type === "tool_call") {
              toolCalls.push({
                id: chunk.id,
                name: chunk.name,
                arguments: chunk.arguments,
              });
            }
          } catch {
            // ignore
          }
        }
      }

      return { text, toolCalls };
    },
    [],
  );

  const onNew = useCallback(
    async (message: AppendMessage) => {
      if (message.content.length !== 1 || message.content[0]?.type !== "text")
        throw new Error("Only text content is supported");

      const userText = message.content[0].text;

      const userMessage: ThreadMessageLike = {
        id: generateId(),
        role: "user",
        content: [{ type: "text", text: userText }],
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      setIsRunning(true);
      const assistantId = generateId();
      const assistantMessage: ThreadMessageLike = {
        id: assistantId,
        role: "assistant",
        content: [{ type: "text", text: "" }],
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        let chatMessages: ChatMessage[] = updatedMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: getMessageText(m),
        }));

        const system = formatMemoriesAsSystemPrompt();
        let fullText = "";
        let iteration = 0;
        const maxIterations = 5;

        while (iteration < maxIterations) {
          iteration++;

          const { text, toolCalls } = await callAPI(chatMessages, system);

          fullText += text;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: [{ type: "text" as const, text: fullText }],
                  }
                : m,
            ),
          );

          if (toolCalls.length === 0) {
            break;
          }

          const toolResults: Array<{
            role: "tool";
            content: string;
            tool_call_id: string;
          }> = [];

          for (const toolCall of toolCalls) {
            const result = executeTool(toolCall.name, toolCall.arguments);
            toolResults.push({
              role: "tool",
              content: JSON.stringify(result),
              tool_call_id: toolCall.id,
            });
          }

          chatMessages = [
            ...chatMessages,
            {
              role: "assistant",
              content: fullText || "",
              tool_calls: toolCalls.map((tc) => ({
                id: tc.id,
                type: "function" as const,
                function: { name: tc.name, arguments: tc.arguments },
              })),
            },
            ...toolResults,
          ];

          fullText = "";
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
    [messages, callAPI],
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
