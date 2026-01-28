"use client";

import { useEffect, useRef } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
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
import { useDocumentStore } from "@/stores/document-store";
import { compileLatex } from "@/lib/latex-compiler";
import { EditorToolbar } from "./editor-toolbar";
import { AIDrawer } from "./ai-drawer";

export function LatexEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const initialContentRef = useRef<string | null>(null);
  const content = useDocumentStore((s) => s.content);
  const setContent = useDocumentStore((s) => s.setContent);
  const setCursorPosition = useDocumentStore((s) => s.setCursorPosition);
  const isCompiling = useDocumentStore((s) => s.isCompiling);
  const setIsCompiling = useDocumentStore((s) => s.setIsCompiling);
  const setPdfData = useDocumentStore((s) => s.setPdfData);
  const setCompileError = useDocumentStore((s) => s.setCompileError);

  const compileRef = useRef<() => void>(() => {});

  compileRef.current = async () => {
    if (isCompiling) return;
    setIsCompiling(true);
    try {
      const currentContent = viewRef.current?.state.doc.toString() ?? content;
      const data = await compileLatex(currentContent);
      setPdfData(data);
    } catch (error) {
      setCompileError(
        error instanceof Error ? error.message : "Compilation failed",
      );
    } finally {
      setIsCompiling(false);
    }
  };

  if (initialContentRef.current === null) {
    initialContentRef.current = content;
  }

  useEffect(() => {
    if (!containerRef.current) return;

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
      doc: initialContentRef.current ?? "",
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
  }, [setContent, setCursorPosition]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

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
  }, [content]);

  return (
    <div className="flex h-full flex-col bg-background">
      <EditorToolbar editorView={viewRef} />
      <PanelGroup direction="vertical" className="flex-1">
        <Panel defaultSize={70} minSize={30}>
          <div ref={containerRef} className="h-full overflow-hidden" />
        </Panel>
        <PanelResizeHandle className="h-px bg-border transition-colors hover:bg-ring" />
        <Panel defaultSize={30} minSize={15}>
          <AIDrawer />
        </Panel>
      </PanelGroup>
    </div>
  );
}
