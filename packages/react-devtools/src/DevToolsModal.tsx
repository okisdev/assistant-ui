"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { DevToolsFrame } from "./DevToolsFrame";
import {
  getStyles,
  ANIMATION_STYLES,
  getPositionStyles,
} from "./styles/DevToolsModal.styles";
import { useDrag } from "./hooks/useDrag";
import { loadPosition, savePosition } from "./utils/storage";

function isDarkMode(): boolean {
  if (typeof document === "undefined") return false;
  return (
    document.documentElement.classList.contains("dark") ||
    document.body.classList.contains("dark")
  );
}

function subscribeToThemeChanges(callback: () => void): () => void {
  if (typeof MutationObserver === "undefined") return () => {};

  const observer = new MutationObserver(callback);
  const observerOptions = { attributes: true, attributeFilter: ["class"] };

  observer.observe(document.documentElement, observerOptions);
  if (document.body !== document.documentElement) {
    observer.observe(document.body, observerOptions);
  }

  return () => observer.disconnect();
}

function DevToolsModalImpl(): React.ReactNode {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [buttonHover, setButtonHover] = useState(false);
  const [closeHover, setCloseHover] = useState(false);

  const darkMode = useSyncExternalStore(
    subscribeToThemeChanges,
    isDarkMode,
    () => false,
  );

  const styles = useMemo(() => getStyles(darkMode), [darkMode]);

  const { position, setPosition, handlers, ref } = useDrag({
    initialPosition: "bottom-right",
    onPositionChange: savePosition,
    onClick: () => setIsOpen(true),
  });

  useEffect(() => {
    setMounted(true);
    setPosition(loadPosition());
  }, [setPosition]);

  useEffect(() => {
    const styleId = "devtools-modal-animations";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent =
      ANIMATION_STYLES +
      `
      .aui-devtools-grabbing { cursor: grabbing !important; }
      .aui-devtools-grabbing * { cursor: grabbing !important; }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const containerStyle: React.CSSProperties = useMemo(
    () => ({
      ...styles.floatingContainer,
      ...getPositionStyles(position),
    }),
    [styles.floatingContainer, position],
  );

  if (!mounted) return null;

  return createPortal(
    <>
      <div ref={ref} style={containerStyle} {...handlers}>
        <button
          onMouseEnter={() => setButtonHover(true)}
          onMouseLeave={() => setButtonHover(false)}
          style={{
            ...styles.floatingButton,
            ...(buttonHover ? styles.floatingButtonHover : {}),
            cursor: "grab",
            touchAction: "none",
            userSelect: "none",
          }}
          aria-label="Open assistant-ui DevTools"
          title="Open assistant-ui DevTools"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: "20px", height: "20px", pointerEvents: "none" }}
          >
            <path
              d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <>
          <div style={styles.backdrop} onClick={() => setIsOpen(false)} />

          <div style={styles.modal} data-devtools-modal>
            <button
              onClick={() => setIsOpen(false)}
              onMouseEnter={() => setCloseHover(true)}
              onMouseLeave={() => setCloseHover(false)}
              style={{
                ...styles.dismissButton,
                ...(closeHover ? styles.dismissButtonHover : {}),
              }}
              aria-label="Close DevTools"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div style={styles.modalContent}>
              <DevToolsFrame
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  borderRadius: "12px",
                  backgroundColor: "transparent",
                }}
              />
            </div>
          </div>
        </>
      )}
    </>,
    document.body,
  );
}

export function DevToolsModal(): React.ReactNode {
  if (
    typeof process !== "undefined" &&
    process.env?.["NODE_ENV"] === "production"
  ) {
    return null;
  }

  return <DevToolsModalImpl />;
}
