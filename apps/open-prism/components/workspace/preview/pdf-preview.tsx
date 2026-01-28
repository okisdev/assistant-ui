"use client";

import { FileTextIcon } from "lucide-react";

export function PdfPreview() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-muted/30 p-8">
      <FileTextIcon className="mb-4 size-16 text-muted-foreground/50" />
      <h2 className="mb-2 font-medium text-lg text-muted-foreground">
        PDF Preview
      </h2>
      <p className="text-center text-muted-foreground text-sm">
        Compile your document to preview
      </p>
    </div>
  );
}
