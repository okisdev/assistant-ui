import { useCallback, useLayoutEffect, useRef } from "react";
import type { IndicatorPosition } from "../types";

const DRAG_THRESHOLD = 5;
const MARGIN = 24;

type DragState = "idle" | "press" | "drag" | "drag-end";

interface Point {
  x: number;
  y: number;
}

interface VelocitySample {
  position: Point;
  timestamp: number;
}

interface UseDragOptions {
  initialPosition: IndicatorPosition;
  onPositionChange: (position: IndicatorPosition) => void;
  onClick: () => void;
}

interface UseDragResult {
  position: IndicatorPosition;
  setPosition: (position: IndicatorPosition) => void;
  handlers: {
    onPointerDown: (e: React.PointerEvent) => void;
  };
  ref: React.RefObject<HTMLDivElement | null>;
}

function getCornerCoords(position: IndicatorPosition): Point {
  if (typeof window === "undefined") return { x: 0, y: 0 };

  const { innerWidth: vw, innerHeight: vh } = window;
  const scrollbarWidth = vw - document.documentElement.clientWidth;
  const isRight = position.includes("right");
  const isBottom = position.includes("bottom");

  return {
    x: isRight ? vw - scrollbarWidth - MARGIN : MARGIN,
    y: isBottom ? vh - MARGIN : MARGIN,
  };
}

function calculateVelocity(history: VelocitySample[]): Point {
  if (history.length < 2) return { x: 0, y: 0 };

  const oldest = history[0]!;
  const latest = history[history.length - 1]!;
  const timeDelta = latest.timestamp - oldest.timestamp;

  if (timeDelta === 0) return { x: 0, y: 0 };

  return {
    x: ((latest.position.x - oldest.position.x) / timeDelta) * 1000,
    y: ((latest.position.y - oldest.position.y) / timeDelta) * 1000,
  };
}

function project(velocity: number, decelerationRate = 0.999): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

export function useDrag({
  initialPosition,
  onPositionChange,
  onClick,
}: UseDragOptions): UseDragResult {
  const ref = useRef<HTMLDivElement>(null);
  const positionRef = useRef<IndicatorPosition>(initialPosition);

  const stateRef = useRef<DragState>("idle");
  const originRef = useRef<Point>({ x: 0, y: 0 });
  const translationRef = useRef<Point>({ x: 0, y: 0 });
  const velocitiesRef = useRef<VelocitySample[]>([]);
  const lastTimestampRef = useRef(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  const setTranslate = useCallback((point: Point) => {
    if (ref.current) {
      translationRef.current = point;
      ref.current.style.translate = `${point.x}px ${point.y}px`;
    }
  }, []);

  const getNearestCorner = useCallback(
    (point: Point): { corner: IndicatorPosition; translation: Point } => {
      const currentCorner = positionRef.current;
      const basePosition = getCornerCoords(currentCorner);

      const corners: IndicatorPosition[] = [
        "top-left",
        "top-right",
        "bottom-left",
        "bottom-right",
      ];

      let nearest = currentCorner;
      let minDistance = Infinity;
      let nearestTranslation: Point = { x: 0, y: 0 };

      for (const corner of corners) {
        const cornerPos = getCornerCoords(corner);
        const relativePos = {
          x: cornerPos.x - basePosition.x,
          y: cornerPos.y - basePosition.y,
        };
        const distance = Math.sqrt(
          (point.x - relativePos.x) ** 2 + (point.y - relativePos.y) ** 2,
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearest = corner;
          nearestTranslation = relativePos;
        }
      }

      return { corner: nearest, translation: nearestTranslation };
    },
    [],
  );

  const animate = useCallback(
    (target: { corner: IndicatorPosition; translation: Point }) => {
      const el = ref.current;
      if (!el) return;

      const onTransitionEnd = (e: TransitionEvent) => {
        if (e.propertyName === "translate") {
          el.style.transition = "";
          el.style.removeProperty("translate");
          el.removeEventListener("transitionend", onTransitionEnd);
          translationRef.current = { x: 0, y: 0 };
          positionRef.current = target.corner;
          onPositionChange(target.corner);
          stateRef.current = "idle";
        }
      };

      // Spring animation timing
      el.style.transition = "translate 400ms cubic-bezier(0.34, 1.56, 0.64, 1)";
      el.addEventListener("transitionend", onTransitionEnd);
      setTranslate(target.translation);
    },
    [onPositionChange, setTranslate],
  );

  const cleanup = useCallback(() => {
    stateRef.current =
      stateRef.current === "drag" ? "drag-end" : stateRef.current;
    cleanupRef.current?.();
    cleanupRef.current = null;
    velocitiesRef.current = [];
    ref.current?.classList.remove("aui-devtools-grabbing");
  }, []);

  const handleClick = useCallback((e: MouseEvent) => {
    if (stateRef.current === "drag-end") {
      e.preventDefault();
      e.stopPropagation();
      stateRef.current = "idle";
      ref.current?.removeEventListener("click", handleClick);
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (stateRef.current === "press") {
        const dx = e.clientX - originRef.current.x;
        const dy = e.clientY - originRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance >= DRAG_THRESHOLD) {
          stateRef.current = "drag";
          ref.current?.setPointerCapture(e.pointerId);
          ref.current?.classList.add("aui-devtools-grabbing");
        }
      }

      if (stateRef.current !== "drag") return;

      const currentPosition = { x: e.clientX, y: e.clientY };
      const dx = currentPosition.x - originRef.current.x;
      const dy = currentPosition.y - originRef.current.y;
      originRef.current = currentPosition;

      const newTranslation = {
        x: translationRef.current.x + dx,
        y: translationRef.current.y + dy,
      };
      setTranslate(newTranslation);

      // Sample velocity at most every 10ms
      const now = Date.now();
      if (now - lastTimestampRef.current >= 10) {
        velocitiesRef.current = [
          ...velocitiesRef.current.slice(-5),
          { position: currentPosition, timestamp: now },
        ];
        lastTimestampRef.current = now;
      }
    },
    [setTranslate],
  );

  const handlePointerUp = useCallback(() => {
    const translation = translationRef.current;
    const velocity = calculateVelocity(velocitiesRef.current);

    cleanup();

    const distance = Math.sqrt(
      translation.x * translation.x + translation.y * translation.y,
    );
    if (distance === 0) {
      ref.current?.style.removeProperty("translate");
      return;
    }

    // Project position based on velocity
    const projectedPosition = {
      x: translation.x + project(velocity.x),
      y: translation.y + project(velocity.y),
    };

    const nearestCorner = getNearestCorner(projectedPosition);
    animate(nearestCorner);
  }, [animate, cleanup, getNearestCorner]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      if (stateRef.current !== "idle") return;

      originRef.current = { x: e.clientX, y: e.clientY };
      stateRef.current = "press";

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);

      cleanupRef.current = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      ref.current?.addEventListener("click", handleClick);
    },
    [handlePointerMove, handlePointerUp, handleClick],
  );

  // Handle click (when not dragging)
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onClickHandler = () => {
      if (stateRef.current === "idle") {
        onClick();
      }
    };

    el.addEventListener("click", onClickHandler);
    return () => el.removeEventListener("click", onClickHandler);
  }, [onClick]);

  const setPosition = useCallback((pos: IndicatorPosition) => {
    positionRef.current = pos;
    // Force re-render by updating a dummy state or trigger position change
  }, []);

  return {
    position: positionRef.current,
    setPosition,
    handlers: { onPointerDown: handlePointerDown },
    ref,
  };
}
