import { create } from "zustand";
import { persist } from "zustand/middleware";

const DEFAULT_CONTENT = `\\documentclass{article}

\\title{My Document}
\\author{Author Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}

Welcome to Open-Prism! This is a LaTeX writing workspace with AI assistance.

Start editing this document or ask the AI assistant for help with:
\\begin{itemize}
  \\item Writing mathematical equations
  \\item Structuring your document
  \\item LaTeX syntax and commands
  \\item Citation formatting
\\end{itemize}

\\section{Mathematics Example}

Here's an example of the quadratic formula:
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

And inline math like $E = mc^2$ works too.

\\end{document}
`;

interface DocumentState {
  fileName: string;
  content: string;
  cursorPosition: number;
  isThreadOpen: boolean;
  pdfData: Uint8Array | null;
  compileError: string | null;
  isCompiling: boolean;
  setFileName: (name: string) => void;
  setContent: (content: string) => void;
  setCursorPosition: (position: number) => void;
  setThreadOpen: (open: boolean) => void;
  setPdfData: (data: Uint8Array | null) => void;
  setCompileError: (error: string | null) => void;
  setIsCompiling: (isCompiling: boolean) => void;
  insertAtCursor: (text: string) => void;
  replaceSelection: (start: number, end: number, text: string) => void;
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      fileName: "document.tex",
      content: DEFAULT_CONTENT,
      cursorPosition: 0,
      isThreadOpen: false,
      pdfData: null,
      compileError: null,
      isCompiling: false,

      setFileName: (name) => set({ fileName: name }),

      setThreadOpen: (open) => set({ isThreadOpen: open }),

      setPdfData: (data) => set({ pdfData: data, compileError: null }),

      setCompileError: (error) => set({ compileError: error, pdfData: null }),

      setIsCompiling: (isCompiling) => set({ isCompiling }),

      setContent: (content) => set({ content }),

      setCursorPosition: (position) => set({ cursorPosition: position }),

      insertAtCursor: (text) => {
        const { content, cursorPosition } = get();
        const newContent =
          content.slice(0, cursorPosition) +
          text +
          content.slice(cursorPosition);
        set({
          content: newContent,
          cursorPosition: cursorPosition + text.length,
        });
      },

      replaceSelection: (start, end, text) => {
        const { content } = get();
        const newContent = content.slice(0, start) + text + content.slice(end);
        set({
          content: newContent,
          cursorPosition: start + text.length,
        });
      },
    }),
    {
      name: "open-prism-document",
      partialize: (state) => ({
        fileName: state.fileName,
        content: state.content,
        cursorPosition: state.cursorPosition,
      }),
    },
  ),
);
