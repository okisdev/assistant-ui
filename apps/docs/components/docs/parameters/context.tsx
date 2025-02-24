import { ParametersTableProps } from "../ParametersTable";

export const AssistantActionsState: ParametersTableProps = {
  type: "AssistantActionsState",
  parameters: [
    {
      name: "switchToThread",
      type: "(threadId: string | null) => void",
      description: "Switch to a new thread.",
      required: true,
    },
    {
      name: "getRuntime",
      type: "() => AssistantRuntime",
      description: "Get the current runtime.",
      required: true,
    },
  ],
};

export const AssistantModelConfigState: ParametersTableProps = {
  type: "AssistantModelConfigState",
  parameters: [
    {
      name: "getModelConfig",
      type: "() => ModelConfig",
      description: "Gets the current model config.",
      required: true,
      children: [
        {
          type: "ModelConfig",
          parameters: [
            {
              name: "system",
              type: "string",
              description: "The system prompt.",
            },
            {
              name: "tools",
              type: "Record<string, Tool<any, any>>",
              description: "The tools available to the model.",
              children: [
                {
                  type: "Tool<TArgs, TResult>",
                  parameters: [
                    {
                      name: "description",
                      type: "string",
                      description: "The tool description.",
                    },
                    {
                      name: "parameters",
                      type: "z.ZodType<TArgs>",
                      description: "The tool parameters.",
                    },
                    {
                      name: "execute",
                      type: "(args: TArgs) => Promise<TResult>",
                      description: "The tool execution function.",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "registerModelConfigProvider",
      type: "(provider: ModelConfigProvider) => Unsubscribe",
      description:
        "Registers a model config provider to update the model config.",
      required: true,
    },
  ],
};

export const AssistantToolUIsState: ParametersTableProps = {
  type: "AssistantToolUIsState",
  parameters: [
    {
      name: "getToolUI",
      type: "(toolName: string) => ToolCallContentPartProps",
      description: "Gets the current tool UI for a given tool name.",
      required: true,
      children: [
        {
          type: "ToolCallContentPartProps<TArgs, TResult>",
          parameters: [
            {
              name: "part",
              type: "ToolCallContentPart<TArgs, TResult>",
              description: "The tool call content part.",
            },
            {
              name: "status",
              type: "ContentPartStatus",
              description: "The tool call status.",
            },
            {
              name: "addResult",
              type: "(result: TResult) => void",
              description: "Adds a result to the tool call.",
            },
          ],
        },
      ],
    },
    {
      name: "setToolUI",
      type: "(toolName: string, render: ToolCallContentPartComponent) => Unsubscribe",
      description: "Sets the tool UI.",
      required: true,
    },
  ],
};

export const AssistantContextValue: ParametersTableProps = {
  type: "AssistantContextValue",
  parameters: [
    {
      name: "useAssistantActions",
      type: "ReadonlyStore<AssistantActionsState>",
      required: true,
      description: "Provides functions to perform actions on the assistant.",
    },
    {
      name: "useModelConfig",
      type: "ReadonlyStore<AssistantModelConfigState>",
      required: true,
      description: "Configuration of the model (system prompt, tools, etc.)",
    },
    {
      name: "useToolUIs",
      type: "ReadonlyStore<AssistantToolUIsState>",
      required: true,
      description: "Tool UIs to render on tool calls.",
      children: [],
    },
  ],
};

export const ThreadContextValue: ParametersTableProps = {
  type: "ThreadContextValue",
  parameters: [
    {
      name: "useThread",
      type: "ReadonlyStore<ThreadState>",
      required: true,
      description: "Provides functions to perform actions on the thread.",
    },
    {
      name: "useThreadMessages",
      type: "ReadonlyStore<ThreadMessagesState>",
      required: true,
      description: "Provides functions to perform actions on the thread.",
    },
    {
      name: "useThreadActions",
      type: "ReadonlyStore<ThreadActionsState>",
      required: true,
      description: "Provides functions to perform actions on the thread.",
    },
    {
      name: "useThreadRuntime",
      type: "ReadonlyStore<ThreadRuntimeState>",
      required: true,
      description: "Get the current runtime.",
    },
    {
      name: "useComposer",
      type: "ReadonlyStore<ComposerState>",
      required: true,
      description: "Provides functions to perform actions on the composer.",
    },
    {
      name: "useViewport",
      type: "ReadonlyStore<ThreadViewportState>",
      required: true,
      description: "Provides functions to perform actions on the viewport.",
    },
  ],
};

export const ThreadState: ParametersTableProps = {
  type: "ThreadState",
  parameters: [
    {
      name: "isRunning",
      type: "boolean",
      required: true,
      description: "Whether the thread is running.",
    },
  ],
};

export const ThreadMessagesState: ParametersTableProps = {
  type: "ThreadMessagesState",
  parameters: [
    {
      name: "messages",
      type: "readonly ThreadMessage[]",
      required: true,
      description: "The messages in the thread.",
    },
  ],
};

export const ThreadActionsState: ParametersTableProps = {
  type: "ThreadActionsState",
  parameters: [
    {
      name: "getBranches",
      type: "(messageId: string) => readonly string[]",
      required: true,
      description: "A function to get the branches for a message.",
    },
    {
      name: "switchToBranch",
      type: "(branchId: string) => void",
      required: true,
      description: "A function to switch to a branch.",
    },
    {
      name: "append",
      type: "(message: AppendMessage) => void",
      required: true,
      description: "A function to append a message to the thread.",
    },
    {
      name: "startRun",
      type: "(parentId: string | null) => void",
      required: true,
      description: "A function to start a run.",
    },
    {
      name: "cancelRun",
      type: "() => void",
      required: true,
      description: "A function to cancel a run.",
    },
    {
      name: "addToolResult",
      type: "(options: AddToolResultOptions) => void",
      required: true,
      description: "A function to add a tool result.",
    },
  ],
};

export const BaseComposerState: ParametersTableProps = {
  type: "BaseComposerState",
  parameters: [
    {
      name: "value",
      type: "string",
      required: true,
      description: "The current value of the composer.",
    },
    {
      name: "setValue",
      type: "(value: string) => void",
      required: true,
      description: "A function to set the value of the composer.",
    },
  ],
};

export const ComposerState: ParametersTableProps = {
  type: "ComposerState",
  parameters: [
    ...BaseComposerState.parameters,
    {
      name: "canCancel",
      type: "true",
      required: true,
      description: "Whether the composer can be canceled.",
    },
    {
      name: "isEditing",
      type: "true",
      required: true,
      description: "Whether the composer is in edit mode.",
    },
    {
      name: "send",
      type: "() => void",
      required: true,
      description: "A function to send the message.",
    },
    {
      name: "cancel",
      type: "() => void",
      required: true,
      description: "A function to cancel the run.",
    },
    {
      name: "focus",
      type: "() => void",
      required: true,
      description: "A function to focus the composer.",
    },
    {
      name: "onFocus",
      type: "(listener: () => void) => Unsubscribe",
      required: true,
      description: "A function to subscribe to focus events.",
    },
  ],
};

export const EditComposerState: ParametersTableProps = {
  type: "EditComposerState",
  parameters: [
    ...BaseComposerState.parameters,
    {
      name: "canCancel",
      type: "boolean",
      required: true,
      description: "Whether the composer can be canceled.",
    },
    {
      name: "isEditing",
      type: "boolean",
      required: true,
      description: "Whether the composer is in edit mode.",
    },
    {
      name: "edit",
      type: "() => void",
      required: true,
      description: "A function to enter edit mode.",
    },
    {
      name: "send",
      type: "() => void",
      required: true,
      description: "A function to send the message.",
    },
    {
      name: "cancel",
      type: "() => void",
      required: true,
      description: "A function to exit the edit mode.",
    },
  ],
};

export const ThreadViewportState: ParametersTableProps = {
  type: "ThreadViewportState",
  parameters: [
    {
      name: "isAtBottom",
      type: "boolean",
      required: true,
      description: "Whether the thread is at the bottom.",
    },
    {
      name: "scrollToBottom",
      type: "() => void",
      required: true,
      description: "A function to scroll to the bottom.",
    },
    {
      name: "onScrollToBottom",
      type: "(callback: () => void) => Unsubscribe",
      required: true,
      description: "A function to subscribe to scroll to bottom events.",
    },
  ],
};

export const ContentPartState: ParametersTableProps = {
  type: "ContentPartState",
  parameters: [
    {
      name: "part",
      type: "Readonly<ContentPartState>",
      required: true,
      description: "The current content part.",
    },
    {
      name: "status",
      type: "MessageStatus",
      required: true,
      description: "The current content part status.",
      children: [
        {
          type: "MessageStatus",
          parameters: [
            {
              name: "type",
              type: "'running' | 'requires-action' | 'complete' | 'incomplete'",
              required: true,
              description: "The status.",
            },
            {
              name: "finish-reason",
              type: "'stop' | 'cancelled' | 'length' | 'content-filter' | 'tool-calls' | 'other' | 'unknown'",
              required: false,
              description: "The finish reason if the status is 'incomplete'.",
            },
            {
              name: "error",
              type: "unknown",
              required: false,
              description: "The error object if the status is 'error'.",
            },
          ],
        },
      ],
    },
  ],
};

export const MessageState: ParametersTableProps = {
  type: "MessageState",
  parameters: [
    {
      name: "message",
      type: "Readonly<ThreadMessage>",
      required: true,
      description: "The current message.",
    },
    {
      name: "parentId",
      type: "string | null",
      required: true,
      description: "The parent message id.",
    },
    {
      name: "branches",
      type: "readonly string[]",
      required: true,
      description: "The branches for the message.",
    },
    {
      name: "isLast",
      type: "boolean",
      required: true,
      description: "Whether the message is the last in the thread.",
    },
  ],
};

export const MessageUtilsState: ParametersTableProps = {
  type: "MessageUtilsState",
  parameters: [
    {
      name: "isCopied",
      type: "boolean",
      required: true,
      description: "Whether the message is copied.",
    },
    {
      name: "setIsCopied",
      type: "(value: boolean) => void",
      required: true,
      description: "A function to set the is copied.",
    },
    {
      name: "isHovering",
      type: "boolean",
      required: true,
      description: "Whether the message is being hovered.",
    },
    {
      name: "setIsHovering",
      type: "(value: boolean) => void",
      required: true,
      description: "A function to set the is hovering.",
    },
  ],
};
