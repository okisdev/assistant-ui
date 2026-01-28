"use client";

import { useEffect } from "react";
import { useAui } from "@assistant-ui/store";
import { useDocumentStore } from "@/stores/document-store";

export function useDocumentContext() {
  const aui = useAui();
  const fileName = useDocumentStore((s) => s.fileName);
  const content = useDocumentStore((s) => s.content);

  useEffect(() => {
    return aui.modelContext().register({
      getModelContext: () => ({
        system: `The user is currently editing a LaTeX document named "${fileName}".

Here is the current content of the document:
\`\`\`latex
${content}
\`\`\`

When helping the user, reference this document and provide relevant suggestions.`,
      }),
    });
  }, [aui, fileName, content]);
}
