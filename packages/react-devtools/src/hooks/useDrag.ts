import { useCallback, useRef, useState } from "react";
import type { IndicatorPosition } from "../types";

const DRAG_THRESHOLD = 5;
const SPRING_DURATION = 300;
const MARGIN = 20;
const INERTIA_FACTOR = 50;

type DragState = "idle" | "press" | "drag" | "animating";

interface UseDragOptions {
  initialPosition: IndicatorPosition;
  onPositionChange: (position: IndicatorPosition) => void;
  onClick: () => void;
}

interface UseDragResult {
  position: IndicatorPosition;
  setPosition: (position: IndicatorPosition) => void;
  dragState: DragState;
  offset: { x: number; y: number };
  handlers: {
    onPointerDown: (e: React.PointerEvent) => void;
  };
}

function getCornerCoords(position: IndicatorPosition): {
  x: number;
  y: number;
} {
  if (typeof window === "undefined") return { x: 0, y: 0 };

  const { innerWidth: vw, innerHeight: vh } = window;
  const isRight = position.includes("right");
  const isBottom = position.includes("bottom");

  return {
    x: isRight ? vw - MARGIN : MARGIN,
    y: isBottom ? vh - MARGIN : MARGIN,
  };
}

function findNearestCorner(
  x: number,
  y: number,
  velocity: { vx: number; vy: number },
): IndicatorPosition {
  if (typeof window === "undefined") return "bottom-right";

  const { innerWidth: vw, innerHeight: vh } = window;
  const targetX = x + velocity.vx * INERTIA_FACTOR;
  const targetY = y + velocity.vy * INERTIA_FACTOR;

  const isLeft = targetX < vw / 2;
  const isTop = targetY < vh / 2;

  if (isTop) return isLeft ? "top-left" : "top-right";
  return isLeft ? "bottom-left" : "bottom-right";
}

export function useDrag({
  initialPosition,
  onPositionChange,
  onClick,
}: UseDragOptions): UseDragResult {
  const [position, setPosition] = useState<IndicatorPosition>(initialPosition);
  const [dragState, setDragState] = useState<DragState>("idle");
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const dragRef = useRef({
    startPoint: null as { x: number; y: number } | null,
    startCorner: null as { x: number; y: number } | null,
    velocity: { vx: 0, vy: 0 },
    lastMove: null as { x: number; y: number; time: number } | null,
  });

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const { startPoint, startCorner, lastMove } = dragRef.current;
    if (!startPoint || !startCorner) return;

    const dx = e.clientX - startPoint.x;
    const dy = e.clientY - startPoint.y;

    const now = Date.now();
    if (lastMove) {
      const dt = (now - lastMove.time) / 1000;
      if (dt > 0) {
        dragRef.current.velocity = {
          vx: (e.clientX - lastMove.x) / dt / 1000,
          vy: (e.clientY - lastMove.y) / dt / 1000,
        };
      }
    }
    dragRef.current.lastMove = { x: e.clientX, y: e.clientY, time: now };

    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance >= DRAG_THRESHOLD) {
      setDragState("drag");
      setOffset({ x: dx, y: dy });
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);

    const { startCorner, velocity } = dragRef.current;

    setDragState((currentState) => {
      if (currentState === "press") {
        onClick();
        return "idle";
      }

      if (currentState !== "drag" || !startCorner) {
        return "idle";
      }

      setOffset((currentOffset) => {
        const currentX = startCorner.x + currentOffset.x;
        const currentY = startCorner.y + currentOffset.y;
        const newPosition = findNearestCorner(currentX, currentY, velocity);
        const newCorner = getCornerCoords(newPosition);

        setPosition(newPosition);
        onPositionChange(newPosition);

        setTimeout(() => {
          setOffset({ x: 0, y: 0 });
          setDragState("idle");
        }, SPRING_DURATION);

        // Return offset that maintains visual continuity during animation
        return {
          x: currentX - newCorner.x,
          y: currentY - newCorner.y,
        };
      });

      return "animating";
    });

    dragRef.current = {
      startPoint: null,
      startCorner: null,
      velocity: { vx: 0, vy: 0 },
      lastMove: null,
    };
  }, [handlePointerMove, onClick, onPositionChange]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (dragState === "animating") return;

      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      dragRef.current = {
        startPoint: { x: e.clientX, y: e.clientY },
        startCorner: getCornerCoords(position),
        velocity: { vx: 0, vy: 0 },
        lastMove: null,
      };

      setDragState("press");
      setOffset({ x: 0, y: 0 });

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    },
    [position, dragState, handlePointerMove, handlePointerUp],
  );

  return {
    position,
    setPosition,
    dragState,
    offset,
    handlers: { onPointerDown: handlePointerDown },
  };
}

export { SPRING_DURATION };
