"use client";

import type { FC, ReactNode } from "react";
import {
  ModelSelector,
  ReasoningToggle,
} from "@/components/assistant-ui/model-selector";

type ComposerFooterProps = {
  children?: ReactNode;
};

export const ComposerFooter: FC<ComposerFooterProps> = ({ children }) => {
  return (
    <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-200 ease-out group-focus-within/composer:grid-rows-[1fr] group-focus-within/composer:opacity-100 group-has-[[data-slot=select-trigger][data-state=open]]/composer:grid-rows-[1fr] group-has-[textarea:not(:placeholder-shown)]/composer:grid-rows-[1fr] group-has-[[data-slot=select-trigger][data-state=open]]/composer:opacity-100 group-has-[textarea:not(:placeholder-shown)]/composer:opacity-100">
      <div className="overflow-hidden">
        <div className="flex items-center gap-2 pt-3">
          <ModelSelector />
          <ReasoningToggle />
          {children}
        </div>
      </div>
    </div>
  );
};
