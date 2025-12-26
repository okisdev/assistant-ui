"use client";

import type { FC } from "react";
import { useState } from "react";
import { ThreadPrimitive, useAssistantState } from "@assistant-ui/react";
import { PenLine, GraduationCap, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

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

export const ComposerSuggestions: FC = () => {
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
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
                isSelected
                  ? "bg-muted text-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
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
