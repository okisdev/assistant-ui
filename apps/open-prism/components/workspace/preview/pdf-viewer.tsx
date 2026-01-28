"use client";

import { useCallback, useMemo, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { LoaderIcon } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  data: Uint8Array;
  scale: number;
  pageNumber: number;
  onError?: (error: string) => void;
  onLoadSuccess?: (numPages: number, pageWidth: number) => void;
  onScaleChange?: (scale: number) => void;
}

export function PdfViewer({
  data,
  scale,
  pageNumber,
  onError,
  onLoadSuccess,
  onScaleChange,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasSetInitialScale = useRef(false);

  const file = useMemo(() => {
    const pdfData =
      data instanceof Uint8Array ? data : new Uint8Array(Object.values(data));
    hasSetInitialScale.current = false;
    return { data: pdfData.slice() };
  }, [data]);

  const handleLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      onLoadSuccess?.(numPages, 612);
    },
    [onLoadSuccess],
  );

  const handlePageLoadSuccess = useCallback(
    ({ width }: { width: number }) => {
      if (hasSetInitialScale.current) return;
      if (containerRef.current && onScaleChange) {
        hasSetInitialScale.current = true;
        const containerWidth = containerRef.current.clientWidth - 32;
        const fitScale = containerWidth / width;
        onScaleChange(Math.min(fitScale, 2));
      }
    },
    [onScaleChange],
  );

  const handleLoadError = useCallback(
    (error: Error) => {
      onError?.(error.message);
    },
    [onError],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onScaleChange) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.001;
        onScaleChange(Math.max(0.25, Math.min(4, scale + delta)));
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [scale, onScaleChange]);

  return (
    <div ref={containerRef} className="flex-1 overflow-auto">
      <div className="flex min-h-full justify-center p-4">
        <Document
          file={file}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadError}
          loading={
            <div className="flex items-center gap-2 text-muted-foreground">
              <LoaderIcon className="size-4 animate-spin" />
              Loading PDF...
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-lg"
            onLoadSuccess={handlePageLoadSuccess}
          />
        </Document>
      </div>
    </div>
  );
}
