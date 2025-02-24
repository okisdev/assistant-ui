import { useCallback } from "react";
import { useMessageContext } from "../../context/react/MessageContext";
import { useCombinedStore } from "../../utils/combined/useCombinedStore";
import { getMessageText } from "../../utils/getMessageText";

export type UseActionBarCopyProps = {
  copiedDuration?: number | undefined;
};

export const useActionBarCopy = ({
  copiedDuration = 3000,
}: UseActionBarCopyProps = {}) => {
  const { useMessage, useMessageUtils, useEditComposer } = useMessageContext();

  const hasCopyableContent = useCombinedStore(
    [useMessage, useEditComposer],
    (m, c) => {
      return (
        !c.isEditing &&
        m.message.content.some((c) => c.type === "text" && c.text.length > 0)
      );
    },
  );

  const callback = useCallback(() => {
    const { message } = useMessage.getState();
    const { setIsCopied } = useMessageUtils.getState();
    const { isEditing, value: composerValue } = useEditComposer.getState();

    const valueToCopy = isEditing ? composerValue : getMessageText(message);

    navigator.clipboard.writeText(valueToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), copiedDuration);
    });
  }, [useMessage, useMessageUtils, useEditComposer, copiedDuration]);

  if (!hasCopyableContent) return null;
  return callback;
};
