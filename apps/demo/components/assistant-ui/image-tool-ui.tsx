"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon, Loader2, Download, ExternalLink } from "lucide-react";
import { makeAssistantToolUI } from "@assistant-ui/react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getImageModelById, type ImageModelId } from "@/lib/ai/models";
import { cn } from "@/lib/utils";

type ImageArgs = {
  prompt: string;
  model?: ImageModelId;
};

type ImageResult = {
  url: string;
  prompt: string;
  model: ImageModelId;
};

export const ImageToolUI = makeAssistantToolUI<ImageArgs, ImageResult>({
  toolName: "generate_image",
  render: function ImageToolRender({ args, result, status }) {
    const [isLoaded, setIsLoaded] = useState(false);
    const isLoading = status.type === "running";
    const prompt = result?.prompt ?? args.prompt ?? "";
    const imageUrl = result?.url;
    const modelId = result?.model ?? args.model ?? "dall-e-2";
    const modelDef = getImageModelById(modelId);

    const handleDownload = async () => {
      if (!imageUrl) return;

      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `generated-image-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Failed to download image:", error);
      }
    };

    if (isLoading) {
      return (
        <div className="my-4">
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-medium text-sm">Generating image...</span>
              <span className="line-clamp-1 text-muted-foreground text-xs">
                {prompt}
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (!imageUrl) {
      return null;
    }

    return (
      <div className="my-4">
        <div className="group relative max-w-sm overflow-hidden rounded-xl bg-muted/30">
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="relative block w-full cursor-pointer overflow-hidden"
              >
                <div
                  className={cn(
                    "relative aspect-square w-full",
                    !isLoaded && "animate-pulse bg-muted",
                  )}
                >
                  <Image
                    src={imageUrl}
                    alt={prompt}
                    fill
                    unoptimized
                    className={cn(
                      "object-cover transition-opacity duration-300",
                      isLoaded ? "opacity-100" : "opacity-0",
                    )}
                    onLoad={() => setIsLoaded(true)}
                  />
                  {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="size-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl p-2">
              <DialogTitle className="sr-only">Generated Image</DialogTitle>
              <div className="relative">
                <Image
                  src={imageUrl}
                  alt={prompt}
                  width={1024}
                  height={1024}
                  unoptimized
                  className="h-auto w-full rounded-lg"
                />
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex items-center justify-between gap-2 p-3">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="line-clamp-2 text-muted-foreground text-xs">
                {prompt}
              </p>
              {modelDef && (
                <span className="text-muted-foreground/60 text-xs">
                  {modelDef.name}
                </span>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={handleDownload}
                title="Download image"
              >
                <Download className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                asChild
                title="Open in new tab"
              >
                <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  },
});
