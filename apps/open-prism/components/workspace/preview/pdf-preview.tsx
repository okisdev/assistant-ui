"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import {
  FileTextIcon,
  AlertCircleIcon,
  LoaderIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RefreshCwIcon,
  MinusIcon,
  PlusIcon,
} from "lucide-react";
import { useDocumentStore, type ProjectFile } from "@/stores/document-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { compileLatex, type CompileResource } from "@/lib/latex-compiler";

const ZOOM_OPTIONS = [
  { value: "0.5", label: "50%" },
  { value: "0.75", label: "75%" },
  { value: "1", label: "100%" },
  { value: "1.25", label: "125%" },
  { value: "1.5", label: "150%" },
  { value: "2", label: "200%" },
  { value: "3", label: "300%" },
  { value: "4", label: "400%" },
];

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

function gatherResources(files: ProjectFile[]): CompileResource[] {
  return files.map((f) => {
    if (f.type === "tex") {
      return {
        path: f.name,
        content: f.content ?? "",
        main: f.name === "document.tex",
      };
    }
    const dataUrl = f.dataUrl ?? "";
    const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
    return {
      path: f.name,
      content: base64,
      encoding: "base64",
    };
  });
}

export function PdfPreview() {
  const pdfData = useDocumentStore((s) => s.pdfData);
  const compileError = useDocumentStore((s) => s.compileError);
  const isCompiling = useDocumentStore((s) => s.isCompiling);
  const setPdfData = useDocumentStore((s) => s.setPdfData);
  const setCompileError = useDocumentStore((s) => s.setCompileError);
  const setIsCompiling = useDocumentStore((s) => s.setIsCompiling);

  const [pdfError, setPdfError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>("1");
  const [scale, setScale] = useState<number>(1.0);
  const hasInitialCompile = useRef(false);
  const initialized = useDocumentStore((s) => s.initialized);

  useEffect(() => {
    if (hasInitialCompile.current) return;
    if (!initialized) return;
    if (pdfData || isCompiling || compileError) return;

    hasInitialCompile.current = true;

    const compile = async () => {
      setIsCompiling(true);
      try {
        const currentFiles = useDocumentStore.getState().files;
        const resources = gatherResources(currentFiles);
        const data = await compileLatex(resources);
        setPdfData(data);
      } catch (error) {
        setCompileError(
          error instanceof Error ? error.message : "Compilation failed",
        );
      } finally {
        setIsCompiling(false);
      }
    };
    compile();
  }, [
    initialized,
    pdfData,
    isCompiling,
    compileError,
    setIsCompiling,
    setPdfData,
    setCompileError,
  ]);

  const goToPrevPage = () => {
    const newPage = Math.max(1, pageNumber - 1);
    setPageNumber(newPage);
    setPageInput(String(newPage));
  };
  const goToNextPage = () => {
    const newPage = Math.min(numPages, pageNumber + 1);
    setPageNumber(newPage);
    setPageInput(String(newPage));
  };
  const zoomIn = () => setScale((s) => Math.min(4, s + 0.1));
  const zoomOut = () => setScale((s) => Math.max(0.25, s - 0.1));

  const handlePageInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const parsed = Number.parseInt(pageInput, 10);
      if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= numPages) {
        setPageNumber(parsed);
        setPageInput(String(parsed));
      } else {
        setPageInput(String(pageNumber));
      }
      (e.target as HTMLInputElement).blur();
    }
  };

  const handlePageInputBlur = () => {
    const parsed = Number.parseInt(pageInput, 10);
    if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= numPages) {
      setPageNumber(parsed);
      setPageInput(String(parsed));
    } else {
      setPageInput(String(pageNumber));
    }
  };

  const handleLoadSuccess = (pages: number) => {
    setNumPages(pages);
    setPageNumber(1);
    setPageInput("1");
  };

  const handleScaleChange = (newScale: number) => {
    setScale(newScale);
  };

  const handleCompile = async () => {
    if (isCompiling) return;
    setIsCompiling(true);
    setPdfError(null);
    try {
      const currentFiles = useDocumentStore.getState().files;
      const resources = gatherResources(currentFiles);
      const data = await compileLatex(resources);
      setPdfData(data);
    } catch (error) {
      setCompileError(
        error instanceof Error ? error.message : "Compilation failed",
      );
    } finally {
      setIsCompiling(false);
    }
  };

  const renderContent = () => {
    if (compileError) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center bg-muted/30 p-8">
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
        <div className="flex flex-1 flex-col items-center justify-center bg-muted/30 p-8">
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
        <div className="flex flex-1 flex-col items-center justify-center bg-muted/30 p-8">
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

    return (
      <PdfViewer
        data={pdfData}
        scale={scale}
        pageNumber={pageNumber}
        onError={setPdfError}
        onLoadSuccess={handleLoadSuccess}
        onScaleChange={handleScaleChange}
      />
    );
  };

  return (
    <div className="flex h-full flex-col bg-muted/50">
      <div className="flex h-9 items-center justify-between border-border border-b bg-background px-2">
        <div className="flex items-center gap-1.5">
          {isCompiling && (
            <>
              <LoaderIcon className="size-3.5 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground text-xs">
                Compiling...
              </span>
            </>
          )}
          {!isCompiling && pdfData && (
            <>
              <span className="text-muted-foreground text-xs">Ready</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={handleCompile}
              >
                <RefreshCwIcon className="size-3.5" />
              </Button>
            </>
          )}
          {!isCompiling && compileError && (
            <>
              <span className="text-destructive text-xs">Error</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={handleCompile}
              >
                <RefreshCwIcon className="size-3.5" />
              </Button>
            </>
          )}
        </div>

        {pdfData && (
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
            >
              <ChevronLeftIcon className="size-3.5" />
            </Button>
            <Input
              type="text"
              inputMode="numeric"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={handlePageInputKeyDown}
              onBlur={handlePageInputBlur}
              className="h-6 w-8 px-1 text-center text-xs"
            />
            <span className="text-muted-foreground text-xs">/ {numPages}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
            >
              <ChevronRightIcon className="size-3.5" />
            </Button>
            <div className="mx-0.5 h-4 w-px bg-border" />
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={zoomOut}
              disabled={scale <= 0.25}
            >
              <MinusIcon className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={zoomIn}
              disabled={scale >= 4}
            >
              <PlusIcon className="size-3.5" />
            </Button>
            <Select
              value={scale.toString()}
              onValueChange={(v) => setScale(Number(v))}
            >
              <SelectTrigger size="sm" className="h-6! w-auto text-xs">
                <SelectValue>{Math.round(scale * 100)}%</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ZOOM_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {renderContent()}
    </div>
  );
}
