import { ThreadMessage } from "../../types";

export class ThreadMessageConverter {
  private _cache = new WeakMap<object, ThreadMessage>();

  convertMessages<TMessage>(
    messages: readonly TMessage[],
    converter: (
      cache: ThreadMessage | undefined,
      message: TMessage,
      idx: number,
    ) => ThreadMessage,
  ): ThreadMessage[] {
    return messages.map((m, idx) => {
      const key = m as object;
      const cached = this._cache.get(key);
      const newMessage = converter(cached, m, idx);
      this._cache.set(key, newMessage);
      return newMessage;
    });
  }
}
