import { AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import type { AssistantRuntime } from "@assistant-ui/react";
import type { HttpChatTransportInitOptions, UIMessage } from "ai";

export class ModelChatTransport<
  UI_MESSAGE extends UIMessage = UIMessage,
> extends AssistantChatTransport<UI_MESSAGE> {
  private runtimeRef: AssistantRuntime | undefined;
  private _reasoningEnabled = true;

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
}
