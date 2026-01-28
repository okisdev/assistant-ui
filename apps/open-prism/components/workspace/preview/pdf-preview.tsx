"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { FileTextIcon, AlertCircleIcon, LoaderIcon } from "lucide-react";
import { useDocumentStore } from "@/stores/document-store";

const PdfViewer = dynamic(
  () => import("./pdf-viewer").then((mod) => mod.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <LoaderIcon className="size-6 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

export function PdfPreview() {
  const pdfData = useDocumentStore((s) => s.pdfData);
  const compileError = useDocumentStore((s) => s.compileError);
  const isCompiling = useDocumentStore((s) => s.isCompiling);
  const [pdfError, setPdfError] = useState<string | null>(null);

  if (isCompiling) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-muted/30 p-8">
        <LoaderIcon className="mb-4 size-10 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground text-sm">Compiling...</p>
      </div>
    );
  }

  if (compileError) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-muted/30 p-8">
        <AlertCircleIcon className="mb-4 size-12 text-destructive" />
        <h2 className="mb-2 font-medium text-destructive text-lg">
          Compilation Error
        </h2>
        <p className="max-w-md text-center text-muted-foreground text-sm">
          {compileError}
        </p>
      </div>
    );
  }

  if (!pdfData) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-muted/30 p-8">
        <FileTextIcon className="mb-4 size-16 text-muted-foreground/50" />
        <h2 className="mb-2 font-medium text-lg text-muted-foreground">
          PDF Preview
        </h2>
        <p className="text-center text-muted-foreground text-sm">
          Click &quot;Compile&quot; to preview your document
        </p>
      </div>
    );
  }

  if (pdfError) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-muted/30 p-8">
        <AlertCircleIcon className="mb-4 size-12 text-destructive" />
        <h2 className="mb-2 font-medium text-destructive text-lg">
          PDF Load Error
        </h2>
        <p className="max-w-md text-center text-muted-foreground text-sm">
          {pdfError}
        </p>
      </div>
    );
  }

  return <PdfViewer data={pdfData} onError={setPdfError} />;
}
