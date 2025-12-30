import type {
  ThreadHistoryAdapter,
  ExportedMessageRepository,
  GenericThreadHistoryAdapter,
  MessageFormatAdapter,
  MessageFormatItem,
  MessageFormatRepository,
  MessageStorageEntry,
  ThreadMessage,
} from "@assistant-ui/react";
import type { UIMessage } from "ai";
import type { ChatMessage } from "@/lib/database/types";

export type DbReadOperations = {
  getMessages: (chatId: string) => Promise<ChatMessage[]>;
};

class ReadOnlyFormattedAdapter<TMessage, TStorageFormat>
  implements GenericThreadHistoryAdapter<TMessage>
{
  constructor(
    private parent: ReadOnlyHistoryAdapter,
    private formatAdapter: MessageFormatAdapter<TMessage, TStorageFormat>,
  ) {}

  async append(_item: MessageFormatItem<TMessage>): Promise<void> {}

  async load(): Promise<MessageFormatRepository<TMessage>> {
    return this.parent._loadWithFormat(
      this.formatAdapter.format,
      (message: MessageStorageEntry<TStorageFormat>) =>
        this.formatAdapter.decode(message),
    );
  }
}

type AISDKStorageFormat = Omit<UIMessage, "id">;

const aiSDKFormatAdapter: MessageFormatAdapter<UIMessage, AISDKStorageFormat> =
  {
    format: "ai-sdk/v5",

    encode({ message: { id, ...message } }): AISDKStorageFormat {
      return message;
    },

    decode(
      stored: MessageStorageEntry<AISDKStorageFormat>,
    ): MessageFormatItem<UIMessage> {
      return {
        parentId: stored.parent_id,
        message: {
          id: stored.id,
          ...stored.content,
        },
      };
    },

    getId(message: UIMessage): string {
      return message.id;
    },
  };

export class ReadOnlyHistoryAdapter implements ThreadHistoryAdapter {
  constructor(
    private chatId: string,
    private db: DbReadOperations,
    private overrideFormatAdapter?: MessageFormatAdapter<
      UIMessage,
      AISDKStorageFormat
    >,
  ) {}

  withFormat<TMessage, TStorageFormat>(
    formatAdapter: MessageFormatAdapter<TMessage, TStorageFormat>,
  ): GenericThreadHistoryAdapter<TMessage> {
    const adapter = this.overrideFormatAdapter ?? formatAdapter;
    return new ReadOnlyFormattedAdapter(
      this,
      adapter as MessageFormatAdapter<TMessage, TStorageFormat>,
    );
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

  async append(): Promise<void> {}
}

export class ReadOnlyHistoryAdapterWithAISDKFormat extends ReadOnlyHistoryAdapter {
  constructor(chatId: string, db: DbReadOperations) {
    super(chatId, db, aiSDKFormatAdapter);
  }
}
