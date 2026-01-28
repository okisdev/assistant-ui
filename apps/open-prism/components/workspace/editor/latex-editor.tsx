"use client";

import { useEffect, useRef } from "react";
import { EditorState, Prec } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  insertNewlineAndIndent,
} from "@codemirror/commands";
import { syntaxHighlighting } from "@codemirror/language";
import { oneDark, oneDarkHighlightStyle } from "@codemirror/theme-one-dark";
import { latex } from "codemirror-lang-latex";
import { ImageIcon } from "lucide-react";
import { useDocumentStore, type ProjectFile } from "@/stores/document-store";
import { compileLatex, type CompileResource } from "@/lib/latex-compiler";
import { EditorToolbar } from "./editor-toolbar";
import { AIDrawer } from "./ai-drawer";

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
    };
  });
}

function getActiveFileContent(): string {
  const state = useDocumentStore.getState();
  const activeFile = state.files.find((f) => f.id === state.activeFileId);
  return activeFile?.content ?? "";
}

export function LatexEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const files = useDocumentStore((s) => s.files);
  const activeFileId = useDocumentStore((s) => s.activeFileId);
  const setContent = useDocumentStore((s) => s.setContent);
  const setCursorPosition = useDocumentStore((s) => s.setCursorPosition);
  const isCompiling = useDocumentStore((s) => s.isCompiling);
  const setIsCompiling = useDocumentStore((s) => s.setIsCompiling);
  const setPdfData = useDocumentStore((s) => s.setPdfData);
  const setCompileError = useDocumentStore((s) => s.setCompileError);

  const activeFile = files.find((f) => f.id === activeFileId);
  const isTexFile = activeFile?.type === "tex";
  const activeFileContent = activeFile?.content;

  const compileRef = useRef<() => void>(() => {});

  compileRef.current = async () => {
    if (isCompiling) return;
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: We intentionally recreate the editor when activeFileId changes
  useEffect(() => {
    if (!containerRef.current || !isTexFile) return;

    const currentContent = getActiveFileContent();

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        setContent(update.state.doc.toString());
      }
      if (update.selectionSet) {
        setCursorPosition(update.state.selection.main.head);
      }
    });

    const compileKeymap = Prec.highest(
      keymap.of([
        {
          key: "Enter",
          run: () => {
            compileRef.current();
            return true;
          },
        },
        {
          key: "Shift-Enter",
          run: insertNewlineAndIndent,
        },
      ]),
    );

    const state = EditorState.create({
      doc: currentContent,
      extensions: [
        compileKeymap,
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        latex(),
        oneDark,
        syntaxHighlighting(oneDarkHighlightStyle),
        updateListener,
        EditorView.lineWrapping,
        EditorView.theme({
          "&": {
            height: "100%",
            fontSize: "14px",
          },
          ".cm-scroller": {
            overflow: "auto",
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [activeFileId, isTexFile, setContent, setCursorPosition]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !isTexFile) return;

    const content = activeFileContent ?? "";
    const currentContent = view.state.doc.toString();
    if (currentContent !== content) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: content,
        },
      });
    }
  }, [activeFileContent, isTexFile]);

  if (!isTexFile) {
    return (
      <div className="flex h-full flex-col bg-background">
        <EditorToolbar editorView={viewRef} />
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/30 p-8">
            <ImageIcon className="mb-4 size-16 text-muted-foreground/50" />
            <h2 className="mb-2 font-medium text-lg text-muted-foreground">
              {activeFile?.name}
            </h2>
            <p className="text-center text-muted-foreground text-sm">
              Image files cannot be edited. View them in the preview panel.
            </p>
          </div>
          <AIDrawer />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <EditorToolbar editorView={viewRef} />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div ref={containerRef} className="absolute inset-0" />
        <AIDrawer />
      </div>
    </div>
  );
}
