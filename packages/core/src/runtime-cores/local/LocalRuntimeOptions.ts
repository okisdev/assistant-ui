import type { ThreadHistoryAdapter } from "../adapters/thread-history/ThreadHistoryAdapter";
import type { AttachmentAdapter } from "../adapters/attachment/AttachmentAdapter";
import type { FeedbackAdapter } from "../adapters/feedback/FeedbackAdapter";
import type {
  SpeechSynthesisAdapter,
  DictationAdapter,
} from "../adapters/speech/SpeechAdapterTypes";
import type { ChatModelAdapter } from "./ChatModelAdapter";
import type { SuggestionAdapter } from "../adapters/suggestion/SuggestionAdapter";

export type LocalRuntimeOptionsBase = {
  maxSteps?: number | undefined;
  adapters: {
    chatModel: ChatModelAdapter;
    history?: ThreadHistoryAdapter | undefined;
    attachments?: AttachmentAdapter | undefined;
    speech?: SpeechSynthesisAdapter | undefined;
    dictation?: DictationAdapter | undefined;
    feedback?: FeedbackAdapter | undefined;
    suggestion?: SuggestionAdapter | undefined;
  };

  /**
   * Names of tools that are allowed to interrupt the run in order to wait for human/external approval.
   */
  unstable_humanToolNames?: string[] | undefined;
};
