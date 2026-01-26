import type { AppendMessage, PendingAttachment } from "../../../types";
import type { AttachmentAdapter } from "../adapters/attachment";
import type { DictationAdapter } from "../adapters/speech/SpeechAdapterTypes";
import type { ThreadComposerRuntimeCore } from "../core/ComposerRuntimeCore";
import type { ThreadRuntimeCore } from "../core/ThreadRuntimeCore";
import { BaseComposerRuntimeCore } from "./BaseComposerRuntimeCore";

export class DefaultThreadComposerRuntimeCore
  extends BaseComposerRuntimeCore
  implements ThreadComposerRuntimeCore
{
  private _canCancel = false;
  public get canCancel() {
    return this._canCancel;
  }

  public override get attachments(): readonly PendingAttachment[] {
    return super.attachments as readonly PendingAttachment[];
  }

  protected getAttachmentAdapter() {
    return this.runtime.adapters?.attachments;
  }

  protected getDictationAdapter() {
    return this.runtime.adapters?.dictation;
  }

  constructor(
    private runtime: Omit<ThreadRuntimeCore, "composer"> & {
      adapters?:
        | {
            attachments?: AttachmentAdapter | undefined;
            dictation?: DictationAdapter | undefined;
          }
        | undefined;
      _isRunning?(): boolean;
      enqueue?(message: AppendMessage): void;
    },
  ) {
    super();
    this.connect();
  }

  public connect() {
    return this.runtime.subscribe(() => {
      if (this.canCancel !== this.runtime.capabilities.cancel) {
        this._canCancel = this.runtime.capabilities.cancel;
        this._notifySubscribers();
      }
    });
  }

  public async handleSend(
    message: Omit<AppendMessage, "parentId" | "sourceId">,
  ) {
    const parentId = this.runtime.messages.at(-1)?.id ?? null;
    const fullMessage: AppendMessage = {
      ...(message as AppendMessage),
      parentId,
      sourceId: null,
    };

    // If running and enqueue is available, queue the message
    if (this.runtime._isRunning?.() && this.runtime.enqueue) {
      this.runtime.enqueue(fullMessage);
    } else {
      this.runtime.append(fullMessage);
    }
  }

  public async handleCancel() {
    this.runtime.cancelRun();
  }
}
