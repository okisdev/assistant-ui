import { AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import type { AssistantRuntime, AssistantApi } from "@assistant-ui/react";
import type { HttpChatTransportInitOptions, UIMessage } from "ai";
import type { MessageTiming } from "@/types/message";
import type { ComposerMode } from "@/contexts/composer-state-provider";
import { debug } from "@/lib/debug";

export class ModelChatTransport<
  UI_MESSAGE extends UIMessage = UIMessage,
> extends AssistantChatTransport<UI_MESSAGE> {
  private runtimeRef: AssistantRuntime | undefined;
  private _assistantApi: AssistantApi | undefined;
  private _reasoningEnabled = true;
  private _composerMode: ComposerMode = "default";
  private _selectedAppIds: string[] = [];
  private _isIncognito = false;
  private _onComposerModeReset: (() => void) | null = null;
  private _timings: Record<string, MessageTiming> = {};
  private _timingListeners: Set<() => void> = new Set();

  constructor(initOptions?: HttpChatTransportInitOptions<UI_MESSAGE>) {
    super({
      ...initOptions,
      prepareSendMessagesRequest: async (options) => {
        const context = this.runtimeRef?.thread.getModelContext();

        const initResult = await this._assistantApi
          ?.threadListItem()
          .initialize();
        const id = initResult?.remoteId ?? options.id;

        debug.transport("prepareSendMessagesRequest", {
          optionsId: options.id,
          initResultRemoteId: initResult?.remoteId,
          finalId: id,
        });

        const optionsEx = {
          ...options,
          body: {
            model: context?.config?.modelName,
            reasoningEnabled: this._reasoningEnabled,
            composerMode: this._composerMode,
            selectedAppIds: this._selectedAppIds,
            isIncognito: this._isIncognito,
            ...options?.body,
          },
        };

        if (this._composerMode !== "default") {
          this._composerMode = "default";
          this._onComposerModeReset?.();
        }
        const preparedRequest =
          await initOptions?.prepareSendMessagesRequest?.(optionsEx);

        const { tools: _tools, ...bodyWithoutTools } = (preparedRequest?.body ??
          optionsEx.body) as Record<string, unknown>;

        return {
          ...preparedRequest,
          body: {
            ...bodyWithoutTools,
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

  get composerMode(): ComposerMode {
    return this._composerMode;
  }

  set composerMode(value: ComposerMode) {
    this._composerMode = value;
  }

  get selectedAppIds(): string[] {
    return this._selectedAppIds;
  }

  set selectedAppIds(value: string[]) {
    this._selectedAppIds = value;
  }

  get isIncognito(): boolean {
    return this._isIncognito;
  }

  set isIncognito(value: boolean) {
    this._isIncognito = value;
  }

  setOnComposerModeReset(callback: (() => void) | null): void {
    this._onComposerModeReset = callback;
  }

  setAssistantApi(api: AssistantApi): void {
    this._assistantApi = api;
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
