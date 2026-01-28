declare module "latex.js" {
  export interface HtmlGeneratorOptions {
    hyphenate?: boolean;
  }

  export class HtmlGenerator {
    constructor(options?: HtmlGeneratorOptions);
  }

  export interface ParseResult {
    htmlDocument(): Document;
    domFragment(): DocumentFragment;
  }

  export interface ParseOptions {
    generator: HtmlGenerator;
  }

  export function parse(latex: string, options: ParseOptions): ParseResult;
}
