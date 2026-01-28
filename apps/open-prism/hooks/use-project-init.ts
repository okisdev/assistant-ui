"use client";

import { useEffect } from "react";
import { useDocumentStore } from "@/stores/document-store";

const DEFAULT_IMAGE_FILE = {
  name: "hand-write.jpg",
  path: "/hand-write.jpg",
};

export function useProjectInit() {
  const files = useDocumentStore((s) => s.files);
  const addFile = useDocumentStore((s) => s.addFile);
  const initialized = useDocumentStore((s) => s.initialized);
  const setInitialized = useDocumentStore((s) => s.setInitialized);

  useEffect(() => {
    if (initialized) return;

    const hasImage = files.some(
      (f) => f.type === "image" && f.name === DEFAULT_IMAGE_FILE.name,
    );

    if (!hasImage) {
      fetch(DEFAULT_IMAGE_FILE.path)
        .then((res) => res.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.onload = () => {
            addFile({
              name: DEFAULT_IMAGE_FILE.name,
              type: "image",
              dataUrl: reader.result as string,
            });
            setInitialized();
          };
          reader.readAsDataURL(blob);
        })
        .catch((err) => {
          console.error("Failed to load default image:", err);
          setInitialized();
        });
    } else {
      setInitialized();
    }
  }, [files, addFile, initialized, setInitialized]);
}
