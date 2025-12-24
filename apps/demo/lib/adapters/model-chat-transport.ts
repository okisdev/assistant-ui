import { AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import type { AssistantRuntime } from "@assistant-ui/react";
import type { HttpChatTransportInitOptions, UIMessage } from "ai";
import type { MessageTiming } from "@/lib/types/timing";

export class ModelChatTransport<
  UI_MESSAGE extends UIMessage = UIMessage,
> extends AssistantChatTransport<UI_MESSAGE> {
  private runtimeRef: AssistantRuntime | undefined;
  private _reasoningEnabled = true;
  private _timings: Record<string, MessageTiming> = {};
  private _timingListeners: Set<() => void> = new Set();

  constructor(initOptions?: HttpChatTransportInitOptions<UI_MESSAGE>) {
    super({
      ...initOptions,
      prepareSendMessagesRequest: async (options) => {
        const context = this.runtimeRef?.thread.getModelContext();
        const id =
          (await this.runtimeRef?.threads.mainItem.initialize())?.remoteId ??
          options.id;

        const optionsEx = {
          ...options,
          body: {
            model: context?.config?.modelName,
            reasoningEnabled: this._reasoningEnabled,
            ...options?.body,
          },
        };
        const preparedRequest =
          await initOptions?.prepareSendMessagesRequest?.(optionsEx);

        return {
          ...preparedRequest,
          body: preparedRequest?.body ?? {
            ...optionsEx.body,
            id,
            messages: options.messages,
            trigger: options.trigger,
            messageId: options.messageId,
            metadata: options.requestMetadata,
          },
        };
      },
    });
  }

  get reasoningEnabled(): boolean {
    return this._reasoningEnabled;
  }

  set reasoningEnabled(value: boolean) {
    this._reasoningEnabled = value;
  }

  override setRuntime(runtime: AssistantRuntime) {
    this.runtimeRef = runtime;
    super.setRuntime(runtime);
  }

  get timings(): Record<string, MessageTiming> {
    return this._timings;
  }

  setTimings(timings: Record<string, MessageTiming>): void {
    this._timings = timings;
    this._notifyTimingListeners();
  }

  getTimingForMessage(messageId: string): MessageTiming | undefined {
    return this._timings[messageId];
  }

  subscribeToTimings(listener: () => void): () => void {
    this._timingListeners.add(listener);
    return () => {
      this._timingListeners.delete(listener);
    };
  }

  private _notifyTimingListeners(): void {
    for (const listener of this._timingListeners) {
      listener();
    }
  }
}
