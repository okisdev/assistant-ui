"use client";

import { RefObject } from "react";
import type { EditorView } from "@codemirror/view";
import {
  BoldIcon,
  ItalicIcon,
  ListIcon,
  Heading1Icon,
  Heading2Icon,
  CodeIcon,
  FunctionSquareIcon,
  PlayIcon,
} from "lucide-react";
import { TooltipIconButton } from "@/components/ui/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { useDocumentStore } from "@/stores/document-store";

interface EditorToolbarProps {
  editorView: RefObject<EditorView | null>;
}

export function EditorToolbar({ editorView }: EditorToolbarProps) {
  const fileName = useDocumentStore((s) => s.fileName);

  const insertText = (before: string, after: string = "") => {
    const view = editorView.current;
    if (!view) return;

    const { from, to } = view.state.selection.main;
    const selectedText = view.state.sliceDoc(from, to);

    view.dispatch({
      changes: {
        from,
        to,
        insert: before + selectedText + after,
      },
      selection: {
        anchor: from + before.length,
        head: from + before.length + selectedText.length,
      },
    });
    view.focus();
  };

  const wrapSelection = (wrapper: string) => {
    insertText(wrapper, wrapper);
  };

  const handleCompile = () => {
    // TODO: Implement LaTeX compilation
    console.log("Compile triggered");
  };

  return (
    <div className="flex items-center gap-1 border-border border-b bg-muted/30 px-2 py-1">
      <span className="mr-2 font-medium text-muted-foreground text-sm">
        {fileName}
      </span>
      <Button
        size="sm"
        variant="default"
        className="mr-2 h-7 gap-1.5 px-3"
        onClick={handleCompile}
      >
        <PlayIcon className="size-3.5" />
        Compile
      </Button>
      <div className="mx-2 h-4 w-px bg-border" />
      <TooltipIconButton
        tooltip="Bold (\\textbf)"
        onClick={() => insertText("\\textbf{", "}")}
      >
        <BoldIcon className="size-4" />
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="Italic (\\textit)"
        onClick={() => insertText("\\textit{", "}")}
      >
        <ItalicIcon className="size-4" />
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="Code (\\texttt)"
        onClick={() => insertText("\\texttt{", "}")}
      >
        <CodeIcon className="size-4" />
      </TooltipIconButton>
      <div className="mx-2 h-4 w-px bg-border" />
      <TooltipIconButton
        tooltip="Section"
        onClick={() => insertText("\\section{", "}")}
      >
        <Heading1Icon className="size-4" />
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="Subsection"
        onClick={() => insertText("\\subsection{", "}")}
      >
        <Heading2Icon className="size-4" />
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="List item"
        onClick={() => insertText("\\item ")}
      >
        <ListIcon className="size-4" />
      </TooltipIconButton>
      <div className="mx-2 h-4 w-px bg-border" />
      <TooltipIconButton
        tooltip="Inline math ($...$)"
        onClick={() => wrapSelection("$")}
      >
        <FunctionSquareIcon className="size-4" />
      </TooltipIconButton>
      <TooltipIconButton
        tooltip="Display math (\\[...\\])"
        onClick={() => insertText("\\[\n  ", "\n\\]")}
      >
        <span className="font-mono text-xs">∫</span>
      </TooltipIconButton>
    </div>
  );
}
