"use client";

import { SampleFrame } from "./sample-frame";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ExternalLinkIcon } from "lucide-react";
import { FC } from "react";

// Mock sources for demonstration
const mockSources = [
  {
    id: "src-1",
    url: "https://openai.com/research/gpt-4",
    title: "GPT-4 Technical Report",
    snippet:
      "GPT-4 is a large multimodal model capable of processing image and text inputs...",
  },
  {
    id: "src-2",
    url: "https://www.anthropic.com/research",
    title: "Constitutional AI: Harmlessness from AI Feedback",
    snippet:
      "We propose a method for training AI systems to be harmless and honest...",
  },
];

// Inline citation link component for demo
const CitationLinkDemo: FC<{ index: number }> = ({ index }) => {
  const source = mockSources[index - 1];
  if (!source) return <sup>[{index}]</sup>;

  let hostname = "";
  try {
    hostname = new URL(source.url).hostname;
  } catch {
    hostname = source.url;
  }

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <sup className="cursor-pointer font-medium text-primary hover:underline">
          [{index}]
        </sup>
      </HoverCardTrigger>
      <HoverCardContent side="top" align="center" className="w-80">
        <div className="flex flex-col gap-2">
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-medium text-sm hover:underline"
          >
            <span className="line-clamp-1">{source.title}</span>
            <ExternalLinkIcon className="size-3 shrink-0" />
          </a>
          {source.snippet && (
            <p className="line-clamp-3 text-muted-foreground text-xs">
              {source.snippet}
            </p>
          )}
          <span className="text-muted-foreground/60 text-xs">{hostname}</span>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

// Source list item for demo
const SourceListItemDemo: FC<{
  source: (typeof mockSources)[0];
  index: number;
}> = ({ source, index }) => {
  let hostname = "";
  try {
    hostname = new URL(source.url).hostname;
  } catch {
    hostname = source.url;
  }

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex cursor-default select-none items-start gap-2.5 rounded-lg px-3 py-2 text-muted-foreground text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted font-medium text-xs">
        {index}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="line-clamp-1 font-medium text-foreground group-hover:text-accent-foreground">
          {source.title}
        </span>
        {source.snippet && (
          <span className="line-clamp-2 text-xs opacity-80">
            {source.snippet}
          </span>
        )}
        <span className="text-xs opacity-60">{hostname}</span>
      </div>
      <ExternalLinkIcon className="mt-0.5 size-3.5 shrink-0 opacity-50" />
    </a>
  );
};

export const CitationSample = () => {
  return (
    <SampleFrame
      sampleText="Citation Preview"
      description="Hover over the citation numbers to see source previews"
      className="h-auto"
    >
      <div className="rounded-lg border bg-background p-6">
        {/* Message content with inline citations */}
        <div className="space-y-4">
          <p className="text-foreground leading-7">
            Recent advances in large language models have shown remarkable
            capabilities in natural language understanding and generation
            <CitationLinkDemo index={1} />. These models are trained on vast
            amounts of text data and can perform a wide variety of tasks
            <CitationLinkDemo index={2} />.
          </p>

          {/* Source list */}
          <div className="mt-6 flex flex-col gap-2">
            <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Sources
            </span>
            {mockSources.map((source, i) => (
              <SourceListItemDemo
                key={source.id}
                source={source}
                index={i + 1}
              />
            ))}
          </div>
        </div>
      </div>
    </SampleFrame>
  );
};
