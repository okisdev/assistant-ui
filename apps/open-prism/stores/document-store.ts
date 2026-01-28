import { create } from "zustand";
import { persist } from "zustand/middleware";

const DEFAULT_CONTENT = `\\documentclass{article}
\\usepackage{amsmath}
\\usepackage{amssymb}

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

\\begin{equation}
  x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
\\end{equation}

\\end{document}
`;

interface DocumentState {
  fileName: string;
  content: string;
  cursorPosition: number;
  setFileName: (name: string) => void;
  setContent: (content: string) => void;
  setCursorPosition: (position: number) => void;
  insertAtCursor: (text: string) => void;
  replaceSelection: (start: number, end: number, text: string) => void;
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      fileName: "document.tex",
      content: DEFAULT_CONTENT,
      cursorPosition: 0,

      setFileName: (name) => set({ fileName: name }),

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
    },
  ),
);
