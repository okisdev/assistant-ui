import { AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import type { AssistantRuntime, Tool } from "@assistant-ui/react";
import type { HttpChatTransportInitOptions, JSONSchema7, UIMessage } from "ai";
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

/**
 * Custom chat transport that extends AssistantChatTransport to include
 * the model field from config.modelName in the request body.
 *
 * This transport allows the frontend to specify which AI model to use
 * for each request via the model context.
 */
export class ModelChatTransport<
  UI_MESSAGE extends UIMessage = UIMessage,
> extends AssistantChatTransport<UI_MESSAGE> {
  private runtimeRef: AssistantRuntime | undefined;

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
            callSettings: context?.callSettings,
            system: context?.system,
            tools: toAISDKTools(getEnabledTools(context?.tools ?? {})),
            // Include model from config.modelName
            model: context?.config?.modelName,
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

  override setRuntime(runtime: AssistantRuntime) {
    this.runtimeRef = runtime;
    super.setRuntime(runtime);
  }
}
