import type { ThreadMessage } from "@assistant-ui/react";

export type ExportedMessageRepositoryItem = {
  message: ThreadMessage;
  parentId: string | null;
};

export type ExportedMessageRepository = {
  headId?: string | null;
  messages: ExportedMessageRepositoryItem[];
};

export type ThreadHistoryAdapter = {
  load(): Promise<ExportedMessageRepository & { unstable_resume?: boolean }>;
  append(item: ExportedMessageRepositoryItem): Promise<void>;
};

type MessageRow = {
  id: string;
  chatId: string;
  parentId: string | null;
  role: string;
  content: unknown;
  status: unknown;
  metadata: unknown;
  createdAt: Date;
};

export type DbOperations = {
  getMessages: (chatId: string) => Promise<MessageRow[]>;
  createMessage: (data: {
    id: string;
    chatId: string;
    parentId: string | null;
    role: string;
    content: unknown;
    status: unknown;
    metadata: unknown;
  }) => Promise<void>;
};

export class DatabaseHistoryAdapter implements ThreadHistoryAdapter {
  constructor(
    private chatId: string,
    private db: DbOperations,
  ) {}

  async load(): Promise<ExportedMessageRepository> {
    const messages = await this.db.getMessages(this.chatId);

    return {
      messages: messages.map((m) => ({
        parentId: m.parentId,
        message: {
          id: m.id,
          role: m.role as "user" | "assistant" | "system",
          content: m.content as ThreadMessage["content"],
          status: m.status as ThreadMessage["status"],
          metadata: m.metadata as ThreadMessage["metadata"],
          createdAt: m.createdAt,
        } as ThreadMessage,
      })),
    };
  }

  async append(item: ExportedMessageRepositoryItem): Promise<void> {
    const { message: msg, parentId } = item;

    await this.db.createMessage({
      id: msg.id,
      chatId: this.chatId,
      parentId,
      role: msg.role,
      content: msg.content,
      status: msg.status,
      metadata: msg.metadata,
    });
  }
}
