"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { DevToolsFrame } from "./DevToolsFrame";
import {
  getStyles,
  ANIMATION_STYLES,
  getPositionStyles,
} from "./styles/DevToolsModal.styles";
import { useDrag, SPRING_DURATION } from "./hooks/useDrag";
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
  const [isOpen, setIsOpen] = useState(false);
  const [buttonHover, setButtonHover] = useState(false);
  const [closeHover, setCloseHover] = useState(false);

  const darkMode = useSyncExternalStore(
    subscribeToThemeChanges,
    isDarkMode,
    () => false,
  );

  const styles = useMemo(() => getStyles(darkMode), [darkMode]);

  const { position, dragState, offset, handlers } = useDrag({
    initialPosition: loadPosition(),
    onPositionChange: savePosition,
    onClick: () => setIsOpen(true),
  });

  const isAnimating = dragState === "animating";
  const isDragging = dragState === "drag" || isAnimating;

  useEffect(() => {
    if (typeof document === "undefined") return;

    const styleId = "devtools-modal-animations";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = ANIMATION_STYLES;
      document.head.appendChild(style);
    }

    return () => {
      const style = document.getElementById(styleId);
      if (style && !document.querySelector("[data-devtools-modal]")) {
        style.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const containerStyle = useMemo(
    () => ({
      ...styles.floatingContainer,
      ...getPositionStyles(position, offset, isAnimating),
      transition: isAnimating
        ? `transform ${SPRING_DURATION}ms cubic-bezier(0.34, 1.56, 0.64, 1)`
        : undefined,
    }),
    [styles.floatingContainer, position, offset, isAnimating],
  );

  return (
    <>
      <div style={containerStyle}>
        <button
          {...handlers}
          onMouseEnter={() => !isDragging && setButtonHover(true)}
          onMouseLeave={() => setButtonHover(false)}
          style={{
            ...styles.floatingButton,
            ...(buttonHover && !isDragging ? styles.floatingButtonHover : {}),
            cursor: isDragging ? "grabbing" : "grab",
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
    </>
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
