import type { AssistantRuntime, Tool } from "@assistant-ui/react";
import { ResumableStateManager } from "@assistant-ui/react/resumable";
import {
  DefaultChatTransport,
  type HttpChatTransportInitOptions,
  type JSONSchema7,
  type UIMessage,
} from "ai";
import z from "zod";

const toAISDKTools = (tools: Record<string, Tool>) => {
  return Object.fromEntries(
    Object.entries(tools).map(([name, tool]) => [
      name,
      {
        ...(tool.description ? { description: tool.description } : undefined),
        parameters: (tool.parameters instanceof z.ZodType
          ? z.toJSONSchema(tool.parameters)
          : tool.parameters) as JSONSchema7,
      },
    ]),
  );
};

const getEnabledTools = (tools: Record<string, Tool>) => {
  return Object.fromEntries(
    Object.entries(tools).filter(
      ([, tool]) => !tool.disabled && tool.type !== "backend",
    ),
  );
};

export interface ResumableChatTransportOptions<
  UI_MESSAGE extends UIMessage = UIMessage,
> extends HttpChatTransportInitOptions<UI_MESSAGE> {
  /**
   * Custom state manager for storing resumable state.
   * Defaults to using localStorage.
   */
  stateManager?: ResumableStateManager<UI_MESSAGE>;
}

/**
 * Chat transport with built-in support for resumable streams.
 * Automatically saves stream ID and messages for resumption on page refresh.
 *
 * @example
 * ```typescript
 * const transport = new ResumableChatTransport({
 *   api: '/api/chat',
 * });
 *
 * const runtime = useChatRuntime({
 *   transport,
 * });
 * ```
 */
export class ResumableChatTransport<
  UI_MESSAGE extends UIMessage = UIMessage,
> extends DefaultChatTransport<UI_MESSAGE> {
  private runtime: AssistantRuntime | undefined;
  private stateManager: ResumableStateManager<UI_MESSAGE>;

  constructor(initOptions?: ResumableChatTransportOptions<UI_MESSAGE>) {
    const stateManager =
      initOptions?.stateManager ?? new ResumableStateManager<UI_MESSAGE>();

    super({
      ...initOptions,
      fetch: async (url, options) => {
        // Save messages before sending
        try {
          if (options?.body) {
            const body = JSON.parse(options.body as string);
            if (body.messages) {
              stateManager.setMessages(body.messages as UI_MESSAGE[]);
            }
          }
        } catch {
          // Ignore parse errors
        }

        // Make the request
        const fetchFn = initOptions?.fetch ?? globalThis.fetch;
        const response = await fetchFn(url, options);

        // Save stream ID from response header
        const streamId = response.headers.get("X-Stream-Id");
        if (streamId) {
          stateManager.setStreamId(streamId);
        }

        // Wrap response to clear state when stream completes
        const originalBody = response.body;
        if (originalBody) {
          const transformStream = new TransformStream<Uint8Array, Uint8Array>({
            transform(chunk, controller) {
              controller.enqueue(chunk);
            },
            flush() {
              // Stream completed successfully, clear resumable state
              stateManager.clearAll();
            },
          });

          return new Response(originalBody.pipeThrough(transformStream), {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        }

        return response;
      },
      prepareSendMessagesRequest: async (options) => {
        const context = this.runtime?.thread.getModelContext();
        const id =
          (await this.runtime?.threads.mainItem.initialize())?.remoteId ??
          options.id;

        const optionsEx = {
          ...options,
          body: {
            callSettings: context?.callSettings,
            system: context?.system,
            tools: toAISDKTools(getEnabledTools(context?.tools ?? {})),
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

    this.stateManager = stateManager;
  }

  /**
   * Set the runtime for this transport.
   * @internal
   */
  setRuntime(runtime: AssistantRuntime) {
    this.runtime = runtime;
  }

  /**
   * Get the state manager for this transport.
   */
  getStateManager(): ResumableStateManager<UI_MESSAGE> {
    return this.stateManager;
  }
}
