"use client";

import { type FC, type ReactNode } from "react";

import { cn } from "@/lib/utils";

function parseCodeBlocks(text: string): string[] {
  const segments: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const openMatch = remaining.match(/^(`{3,})(\w*)\n/m);

    if (!openMatch || openMatch.index === undefined) {
      segments.push(remaining);
      break;
    }

    if (openMatch.index > 0) {
      segments.push(remaining.slice(0, openMatch.index));
    }

    const fenceLength = openMatch[1].length;
    const language = openMatch[2];
    const contentStart = openMatch.index + openMatch[0].length;
    const afterOpen = remaining.slice(contentStart);

    let pos = 0;
    let depth = 1;
    let closeIndex = -1;

    const lines = afterOpen.split("\n");
    for (let i = 0; i < lines.length && depth > 0; i++) {
      const line = lines[i];
      const fenceMatch = line.match(/^(`{3,})(\w*)$/);

      if (fenceMatch) {
        const matchedLength = fenceMatch[1].length;
        const hasLang = fenceMatch[2] && fenceMatch[2].length > 0;

        if (hasLang) {
          depth++;
        } else if (matchedLength >= fenceLength) {
          depth--;
          if (depth === 0) {
            closeIndex = pos;
            break;
          }
        }
      }

      pos += line.length + 1;
    }

    if (closeIndex >= 0) {
      const code = afterOpen.slice(0, closeIndex);
      const fullBlock = `\`\`\`${language}\n${code}\`\`\``;
      segments.push(fullBlock);
      const afterClose = afterOpen.slice(closeIndex);
      const closingLineEnd = afterClose.indexOf("\n");
      remaining =
        closingLineEnd >= 0 ? afterClose.slice(closingLineEnd + 1) : "";
    } else {
      segments.push(remaining.slice(openMatch.index, contentStart));
      remaining = afterOpen;
    }
  }

  return segments.filter((s) => s.length > 0);
}

export const SimpleMarkdown: FC<{ text: string }> = ({ text }) => {
  const segments = parseCodeBlocks(text);

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      {segments.map((segment, index) => {
        if (segment.startsWith("```")) {
          const match = segment.match(/^```(\w*)\n([\s\S]*)```$/);
          if (match) {
            const [, language, code] = match;
            return (
              <div key={index} className="my-4 overflow-hidden rounded-xl">
                {language && (
                  <div className="bg-muted px-4 py-2.5 text-[13px] text-muted-foreground">
                    {language}
                  </div>
                )}
                <pre
                  className={cn(
                    "overflow-x-auto bg-[#1e1e1e] p-4 text-[13px] text-white leading-relaxed",
                    !language && "rounded-xl",
                  )}
                >
                  <code>{code?.trimEnd()}</code>
                </pre>
              </div>
            );
          }
        }

        return <TextBlock key={index} text={segment} />;
      })}
    </div>
  );
};

function HeaderTag({
  level,
  children,
}: {
  level: number;
  children: ReactNode;
}) {
  const className = cn(
    level === 1 && "mb-4 font-semibold text-2xl tracking-tight",
    level === 2 && "mt-8 mb-4 font-semibold text-xl tracking-tight first:mt-0",
    level === 3 && "mt-6 mb-3 font-semibold text-lg tracking-tight first:mt-0",
    level >= 4 && "mt-5 mb-2 font-medium first:mt-0",
  );

  switch (level) {
    case 1:
      return <h1 className={className}>{children}</h1>;
    case 2:
      return <h2 className={className}>{children}</h2>;
    case 3:
      return <h3 className={className}>{children}</h3>;
    case 4:
      return <h4 className={className}>{children}</h4>;
    case 5:
      return <h5 className={className}>{children}</h5>;
    case 6:
      return <h6 className={className}>{children}</h6>;
    default:
      return <p className={className}>{children}</p>;
  }
}

const TextBlock: FC<{ text: string }> = ({ text }) => {
  const paragraphs = text.split(/\n\n+/);

  return (
    <>
      {paragraphs.map((paragraph, pIndex) => {
        const trimmed = paragraph.trim();
        if (!trimmed) return null;

        const headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/m);
        if (headerMatch) {
          const level = headerMatch[1].length;
          const content = headerMatch[2];
          return (
            <HeaderTag key={pIndex} level={level}>
              <InlineText text={content} />
            </HeaderTag>
          );
        }

        if (trimmed.match(/^[-*]\s/m)) {
          const items = trimmed.split(/\n/).filter((line) => line.trim());
          return (
            <ul key={pIndex} className="my-4 ml-6 list-disc [&>li]:mt-1.5">
              {items.map((item, iIndex) => (
                <li key={iIndex}>
                  <InlineText text={item.replace(/^[-*]\s+/, "")} />
                </li>
              ))}
            </ul>
          );
        }

        if (trimmed.match(/^\d+\.\s/m)) {
          const items = trimmed.split(/\n/).filter((line) => line.trim());
          return (
            <ol key={pIndex} className="my-4 ml-6 list-decimal [&>li]:mt-1.5">
              {items.map((item, iIndex) => (
                <li key={iIndex}>
                  <InlineText text={item.replace(/^\d+\.\s+/, "")} />
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={pIndex} className="my-4 leading-7 first:mt-0 last:mb-0">
            <InlineText text={trimmed} />
          </p>
        );
      })}
    </>
  );
};

const InlineText: FC<{ text: string }> = ({ text }) => {
  const parts: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const codeMatch = remaining.match(/`([^`]+)`/);
    if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) {
        parts.push(remaining.slice(0, codeMatch.index));
      }
      parts.push(
        <code
          key={key++}
          className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[13px]"
        >
          {codeMatch[1]}
        </code>,
      );
      remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
      continue;
    }

    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(remaining.slice(0, boldMatch.index));
      }
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    const italicMatch = remaining.match(/\*([^*]+)\*/);
    if (italicMatch && italicMatch.index !== undefined) {
      if (italicMatch.index > 0) {
        parts.push(remaining.slice(0, italicMatch.index));
      }
      parts.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
      continue;
    }

    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch && linkMatch.index !== undefined) {
      if (linkMatch.index > 0) {
        parts.push(remaining.slice(0, linkMatch.index));
      }
      parts.push(
        <a
          key={key++}
          href={linkMatch[2]}
          className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-foreground/80"
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkMatch[1]}
        </a>,
      );
      remaining = remaining.slice(linkMatch.index + linkMatch[0].length);
      continue;
    }

    parts.push(remaining);
    break;
  }

  return <>{parts}</>;
};
