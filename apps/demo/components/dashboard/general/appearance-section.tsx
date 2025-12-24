"use client";

import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { SettingHeader } from "@/components/dashboard/setting-header";

type ThemeValue = "system" | "light" | "dark";

function ThemePreview({ value }: { value: ThemeValue }) {
  if (value === "system") {
    return (
      <div className="flex size-full overflow-hidden rounded-md">
        <div className="flex w-1/2 flex-col gap-1.5 bg-white p-2">
          <div className="h-1.5 w-6 rounded-full bg-neutral-200" />
          <div className="h-1.5 w-8 rounded-full bg-neutral-300" />
          <div className="mt-auto h-2 w-full rounded bg-neutral-100" />
        </div>
        <div className="flex w-1/2 flex-col gap-1.5 bg-neutral-900 p-2">
          <div className="h-1.5 w-6 rounded-full bg-neutral-700" />
          <div className="h-1.5 w-8 rounded-full bg-neutral-600" />
          <div className="mt-auto h-2 w-full rounded bg-neutral-800" />
        </div>
      </div>
    );
  }

  if (value === "light") {
    return (
      <div className="flex size-full flex-col gap-1.5 rounded-md bg-white p-2">
        <div className="h-1.5 w-6 rounded-full bg-neutral-200" />
        <div className="h-1.5 w-10 rounded-full bg-neutral-300" />
        <div className="h-1.5 w-8 rounded-full bg-neutral-200" />
        <div className="mt-auto h-2 w-full rounded bg-neutral-100" />
      </div>
    );
  }

  return (
    <div className="flex size-full flex-col gap-1.5 rounded-md bg-neutral-900 p-2">
      <div className="h-1.5 w-6 rounded-full bg-neutral-700" />
      <div className="h-1.5 w-10 rounded-full bg-neutral-600" />
      <div className="h-1.5 w-8 rounded-full bg-neutral-700" />
      <div className="mt-auto h-2 w-full rounded bg-neutral-800" />
    </div>
  );
}

function ThemeOption({
  value,
  label,
  selected,
  onSelect,
}: {
  value: ThemeValue;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl p-3 transition-all duration-200",
        selected ? "bg-muted" : "hover:bg-muted",
      )}
    >
      <div className="h-16 w-24 overflow-hidden rounded-lg shadow-sm">
        <ThemePreview value={value} />
      </div>
      <span
        className={cn(
          "text-sm transition-colors duration-200",
          selected ? "font-medium text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </button>
  );
}

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  const themeOptions: { value: ThemeValue; label: string }[] = [
    { value: "system", label: "System" },
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <SettingHeader title="Appearance" />

      <div className="flex gap-4">
        {themeOptions.map((option) => (
          <ThemeOption
            key={option.value}
            value={option.value}
            label={option.label}
            selected={theme === option.value}
            onSelect={() => setTheme(option.value)}
          />
        ))}
      </div>
    </div>
  );
}
