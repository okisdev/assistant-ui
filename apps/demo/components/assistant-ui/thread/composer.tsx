"use client";

import { useState, type FC } from "react";
import {
  AssistantIf,
  ComposerPrimitive,
  ThreadPrimitive,
  useAssistantState,
} from "@assistant-ui/react";
import {
  ArrowRight,
  LoaderIcon,
  SquareIcon,
  UploadIcon,
  PenLine,
  GraduationCap,
  Lightbulb,
} from "lucide-react";

import {
  ComposerAddAttachment,
  ComposerAttachments,
} from "@/components/assistant-ui/attachment";
import {
  ModelSelector,
  ReasoningToggle,
} from "@/components/assistant-ui/model-selector";
import { Button } from "@/components/ui/button";

const SUGGESTION_CATEGORIES = [
  {
    id: "write",
    label: "Write",
    icon: PenLine,
    suggestions: [
      { prompt: "Write a professional email" },
      { prompt: "Draft a blog post" },
      { prompt: "Create a cover letter" },
      { prompt: "Compose a thank you note" },
    ],
  },
  {
    id: "learn",
    label: "Learn",
    icon: GraduationCap,
    suggestions: [
      { prompt: "Explain quantum computing in simple terms" },
      { prompt: "How does machine learning work" },
      { prompt: "Teach me about blockchain technology" },
      { prompt: "What is the theory of relativity" },
    ],
  },
  {
    id: "create",
    label: "Create",
    icon: Lightbulb,
    suggestions: [
      { prompt: "Generate a creative project idea" },
      { prompt: "Design a workout routine for beginners" },
      { prompt: "Plan a weekend travel itinerary" },
      { prompt: "Create a meal plan for the week" },
    ],
  },
] as const;

type CategoryId = (typeof SUGGESTION_CATEGORIES)[number]["id"];

type ComposerProps = {
  placeholder?: string;
};

export const Composer: FC<ComposerProps> = ({
  placeholder = "Ask anything...",
}) => {
  const hasUploadingAttachments = useAssistantState(({ composer }) =>
    composer.attachments.some((a) => a.status.type === "running"),
  );

  return (
    <div className="flex w-full flex-col gap-3">
      <ComposerPrimitive.Root className="group/composer w-full rounded-2xl bg-muted/50">
        <ComposerPrimitive.AttachmentDropzone className="group/dropzone relative flex w-full flex-col px-4 py-4 outline-none">
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-accent/50 opacity-0 transition-opacity duration-200 group-data-[dragging=true]/dropzone:opacity-100">
            <div className="flex flex-col items-center gap-2 text-accent-foreground">
              <UploadIcon className="size-8" />
              <span className="font-medium text-sm">Drop files here</span>
            </div>
          </div>
          <ComposerAttachments />
          <div className="flex items-end gap-3">
            <ComposerAddAttachment />
            <ComposerPrimitive.Input
              placeholder={placeholder}
              className="peer max-h-40 flex-1 resize-none overflow-y-auto bg-transparent py-1.5 text-base outline-none placeholder:text-muted-foreground"
              rows={1}
              autoFocus
            />
            <AssistantIf condition={({ thread }) => !thread.isRunning}>
              <ComposerPrimitive.Send
                asChild
                disabled={hasUploadingAttachments}
              >
                <Button
                  size="icon"
                  className="shrink-0 rounded-full"
                  disabled={hasUploadingAttachments}
                >
                  {hasUploadingAttachments ? (
                    <LoaderIcon className="size-4 animate-spin" />
                  ) : (
                    <ArrowRight className="size-4" />
                  )}
                </Button>
              </ComposerPrimitive.Send>
            </AssistantIf>
            <AssistantIf condition={({ thread }) => thread.isRunning}>
              <ComposerPrimitive.Cancel asChild>
                <Button size="icon" className="shrink-0 rounded-full">
                  <SquareIcon className="size-3 fill-current" />
                </Button>
              </ComposerPrimitive.Cancel>
            </AssistantIf>
          </div>
          <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-200 ease-out group-focus-within/composer:grid-rows-[1fr] group-focus-within/composer:opacity-100 group-has-[textarea:not(:placeholder-shown)]/composer:grid-rows-[1fr] group-has-data-[state=open]/composer:grid-rows-[1fr] group-has-[textarea:not(:placeholder-shown)]/composer:opacity-100 group-has-data-[state=open]/composer:opacity-100">
            <div className="overflow-hidden">
              <div className="flex items-center gap-2 pt-3">
                <ModelSelector />
                <ReasoningToggle />
              </div>
            </div>
          </div>
        </ComposerPrimitive.AttachmentDropzone>
      </ComposerPrimitive.Root>
      <CategorySuggestions />
    </div>
  );
};

const CategorySuggestions: FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(
    null,
  );
  const isEmpty = useAssistantState(({ thread }) => thread.isEmpty);
  const isRunning = useAssistantState(({ thread }) => thread.isRunning);

  if (!isEmpty || isRunning) return null;

  const selectedCategoryData = selectedCategory
    ? SUGGESTION_CATEGORIES.find((c) => c.id === selectedCategory)
    : null;

  const handleCategoryClick = (categoryId: CategoryId) => {
    setSelectedCategory((prev) => (prev === categoryId ? null : categoryId));
  };

  const handleSuggestionClick = () => {
    setSelectedCategory(null);
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap justify-center gap-2">
        {SUGGESTION_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => handleCategoryClick(category.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
                isSelected
                  ? "bg-muted text-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" />
              <span>{category.label}</span>
            </button>
          );
        })}
      </div>

      {selectedCategoryData && (
        <div className="fade-in slide-in-from-top-2 absolute inset-x-0 top-full z-10 mt-2 flex animate-in flex-col gap-1 rounded-xl bg-background/95 fill-mode-both p-2 shadow-lg backdrop-blur-sm">
          {selectedCategoryData.suggestions.map((suggestion, index) => (
            <ThreadPrimitive.Suggestion
              key={suggestion.prompt}
              prompt={suggestion.prompt}
              className="fade-in slide-in-from-top-1 animate-in cursor-pointer rounded-lg fill-mode-both px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
              style={{ animationDelay: `${index * 30}ms` }}
              onClick={handleSuggestionClick}
            >
              {suggestion.prompt}
            </ThreadPrimitive.Suggestion>
          ))}
        </div>
      )}
    </div>
  );
};
