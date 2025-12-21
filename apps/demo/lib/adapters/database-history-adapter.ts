import type {
  ThreadHistoryAdapter,
  ExportedMessageRepository,
  ThreadMessage,
  GenericThreadHistoryAdapter,
  MessageFormatAdapter,
  MessageFormatItem,
  MessageFormatRepository,
  MessageStorageEntry,
} from "@assistant-ui/react";

type ExportedMessageRepositoryItem =
  ExportedMessageRepository["messages"][number];

type MessageRow = {
  id: string;
  chatId: string;
  parentId: string | null;
  role: string | null;
  format: string;
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
    format: string;
    content: unknown;
    status: unknown;
    metadata: unknown;
  }) => Promise<void>;
};

class FormattedHistoryAdapter<TMessage, TStorageFormat>
  implements GenericThreadHistoryAdapter<TMessage>
{
  constructor(
    private parent: DatabaseHistoryAdapter,
    private formatAdapter: MessageFormatAdapter<TMessage, TStorageFormat>,
  ) {}

  async append(item: MessageFormatItem<TMessage>): Promise<void> {
    const encoded = this.formatAdapter.encode(item);
    const messageId = this.formatAdapter.getId(item.message);

    await this.parent._appendWithFormat(
      item.parentId,
      messageId,
      this.formatAdapter.format,
      encoded,
    );
  }

  async load(): Promise<MessageFormatRepository<TMessage>> {
    return this.parent._loadWithFormat(
      this.formatAdapter.format,
      (message: MessageStorageEntry<TStorageFormat>) =>
        this.formatAdapter.decode(message),
    );
  }
}

export class DatabaseHistoryAdapter implements ThreadHistoryAdapter {
  constructor(
    private chatId: string,
    private db: DbOperations,
  ) {}

  withFormat<TMessage, TStorageFormat>(
    formatAdapter: MessageFormatAdapter<TMessage, TStorageFormat>,
  ): GenericThreadHistoryAdapter<TMessage> {
    return new FormattedHistoryAdapter(this, formatAdapter);
  }

  async _appendWithFormat<T>(
    parentId: string | null,
    messageId: string,
    format: string,
    content: T,
  ): Promise<void> {
    await this.db.createMessage({
      id: messageId,
      chatId: this.chatId,
      parentId,
      role: "", // role will be extracted from content
      format,
      content,
      status: undefined,
      metadata: undefined,
    });
  }

  async _loadWithFormat<TMessage, TStorageFormat>(
    format: string,
    decoder: (
      message: MessageStorageEntry<TStorageFormat>,
    ) => MessageFormatItem<TMessage>,
  ): Promise<MessageFormatRepository<TMessage>> {
    const messages = await this.db.getMessages(this.chatId);

    return {
      messages: messages
        .filter((m) => m.format === format)
        .map((m) =>
          decoder({
            id: m.id,
            parent_id: m.parentId,
            format: m.format,
            content: m.content as TStorageFormat,
          }),
        ),
    };
  }

  async load(): Promise<ExportedMessageRepository> {
    const messages = await this.db.getMessages(this.chatId);

    return {
      messages: messages
        .filter((m) => m.format === "aui/v0" || !m.format)
        .map((m) => ({
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
      format: "aui/v0",
      content: msg.content,
      status: msg.status,
      metadata: msg.metadata,
    });
  }
}
