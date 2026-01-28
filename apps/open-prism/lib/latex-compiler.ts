import { parse, HtmlGenerator } from "latex.js";

export async function compileLatex(latex: string): Promise<string> {
  const generator = new HtmlGenerator({ hyphenate: false });

  const doc = parse(latex, { generator }).htmlDocument();

  // Get the full HTML including styles
  return doc.documentElement.outerHTML;
}
