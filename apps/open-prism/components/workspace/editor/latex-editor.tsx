"use client";

import { useEffect, useRef, useState, useMemo } from "react";
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
import { useDocumentStore, type ProjectFile } from "@/stores/document-store";
import { compileLatex, type CompileResource } from "@/lib/latex-compiler";
import { EditorToolbar } from "./editor-toolbar";
import { AIDrawer } from "./ai-drawer";
import { ImagePreview } from "./image-preview";
import { LatexTools } from "./latex-tools";

interface SectionInfo {
  level: number;
  content: string;
  line: number;
}

function parseSections(content: string): SectionInfo[] {
  const lines = content.split("\n");
  const sections: SectionInfo[] = [];
  const sectionRegex =
    /\\(part|chapter|section|subsection|subsubsection)\*?\s*\{[^}]*\}/;
  const levelMap: Record<string, number> = {
    part: 0,
    chapter: 1,
    section: 2,
    subsection: 3,
    subsubsection: 4,
  };

  lines.forEach((lineContent, index) => {
    const match = lineContent.match(sectionRegex);
    if (match) {
      sections.push({
        level: levelMap[match[1]] ?? 2,
        content: lineContent,
        line: index + 1,
      });
    }
  });

  return sections;
}

function getStickyLines(
  sections: SectionInfo[],
  currentLine: number,
): SectionInfo[] {
  const stack: SectionInfo[] = [];

  for (const section of sections) {
    if (section.line > currentLine) break;

    while (stack.length > 0 && stack[stack.length - 1].level >= section.level) {
      stack.pop();
    }
    stack.push(section);
  }

  return stack;
}

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
    let base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
    base64 = base64.replace(/\s/g, "");
    return {
      path: f.name,
      file: base64,
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
  const setSelectionRange = useDocumentStore((s) => s.setSelectionRange);
  const jumpToPosition = useDocumentStore((s) => s.jumpToPosition);
  const clearJumpRequest = useDocumentStore((s) => s.clearJumpRequest);
  const isCompiling = useDocumentStore((s) => s.isCompiling);
  const setIsCompiling = useDocumentStore((s) => s.setIsCompiling);
  const setPdfData = useDocumentStore((s) => s.setPdfData);
  const setCompileError = useDocumentStore((s) => s.setCompileError);

  const activeFile = files.find((f) => f.id === activeFileId);
  const isTexFile = activeFile?.type === "tex";
  const activeFileContent = activeFile?.content;

  const [imageScale, setImageScale] = useState(0.5);
  const [currentLine, setCurrentLine] = useState(1);
  const [gutterWidth, setGutterWidth] = useState(0);

  const sections = useMemo(
    () => parseSections(activeFileContent ?? ""),
    [activeFileContent],
  );

  const stickyLines = useMemo(
    () => getStickyLines(sections, currentLine),
    [sections, currentLine],
  );

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
        const { from, to, head } = update.state.selection.main;
        setCursorPosition(head);
        if (from !== to) {
          setSelectionRange({ start: from, end: to });
        } else {
          setSelectionRange(null);
        }
      }
    });

    const scrollListener = EditorView.domEventHandlers({
      scroll: (_, view) => {
        const scrollTop = view.scrollDOM.scrollTop;
        const lineBlock = view.lineBlockAtHeight(scrollTop);
        const lineNumber = view.state.doc.lineAt(lineBlock.from).number;
        setCurrentLine(lineNumber);

        const gutter = view.dom.querySelector(".cm-gutters");
        if (gutter) {
          setGutterWidth(gutter.getBoundingClientRect().width);
        }
      },
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
        scrollListener,
        EditorView.lineWrapping,
        EditorView.theme({
          "&": {
            height: "100%",
            fontSize: "14px",
          },
          ".cm-scroller": {
            overflow: "auto",
          },
          ".cm-gutters": {
            paddingRight: "4px",
          },
          ".cm-lineNumbers .cm-gutterElement": {
            paddingLeft: "8px",
            paddingRight: "4px",
          },
          ".cm-content": {
            paddingLeft: "8px",
            paddingRight: "12px",
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
  }, [
    activeFileId,
    isTexFile,
    setContent,
    setCursorPosition,
    setSelectionRange,
  ]);

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

  useEffect(() => {
    const view = viewRef.current;
    if (!view || jumpToPosition === null) return;

    view.dispatch({
      selection: { anchor: jumpToPosition },
      effects: EditorView.scrollIntoView(jumpToPosition, { y: "center" }),
    });
    view.focus();
    clearJumpRequest();
  }, [jumpToPosition, clearJumpRequest]);

  if (!isTexFile && activeFile) {
    return (
      <div className="flex h-full flex-col bg-background">
        <EditorToolbar
          editorView={viewRef}
          fileType="image"
          imageScale={imageScale}
          onImageScaleChange={setImageScale}
        />
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <ImagePreview file={activeFile} scale={imageScale} />
          <AIDrawer />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <EditorToolbar editorView={viewRef} />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {stickyLines.length > 0 && (
          <div className="absolute inset-x-0 top-0 z-10 border-border border-b bg-[#282c34] font-mono text-[14px] leading-[1.4] shadow-md">
            {stickyLines.map((section) => (
              <div
                key={section.line}
                className="flex cursor-pointer items-center hover:bg-white/5"
                onClick={() => {
                  const view = viewRef.current;
                  if (!view) return;
                  const line = view.state.doc.line(section.line);
                  view.dispatch({
                    selection: { anchor: line.from },
                    effects: EditorView.scrollIntoView(line.from, {
                      y: "start",
                    }),
                  });
                  view.focus();
                }}
              >
                <span
                  className="shrink-0 bg-[#282c34] py-px text-right text-[#636d83]"
                  style={{ width: gutterWidth ? gutterWidth - 8 : 32 }}
                >
                  {section.line}
                </span>
                <span className="py-px pl-[16px] text-[#abb2bf]">
                  {section.content}
                </span>
              </div>
            ))}
          </div>
        )}
        <div ref={containerRef} className="absolute inset-0" />
        <AIDrawer />
      </div>
      <LatexTools />
    </div>
  );
}
