import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { TargetRect } from "./use-target-rect";
import type { ResolvedPlacement } from "./use-card-placement";

interface TutorialArrowProps {
  placement: ResolvedPlacement;
  cardPos: { top: number; left: number };
  cardSize: { width: number; height: number };
  targetRect: TargetRect;
  /** Opt-in stronger emphasis: the arrow bounces gently towards the target. */
  animated?: boolean;
}

const ARROW_SIZE = 10;
const EDGE_INSET = 16;

/**
 * Small rotated-square "pointer" glued to the edge of the card facing the
 * target, visually connecting the two. Its offset along that edge tracks
 * the target's center so it keeps pointing at the highlighted element even
 * when the card had to be clamped/shifted to stay on-screen.
 */
export function TutorialArrow({ placement, cardPos, cardSize, targetRect, animated = false }: TutorialArrowProps) {
  if (placement === "center") return null;

  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;
  const half = ARROW_SIZE / 2;

  const style: CSSProperties = {
    position: "fixed",
    width: ARROW_SIZE,
    height: ARROW_SIZE,
  };

  if (placement === "bottom" || placement === "top") {
    const clampedX = Math.min(
      Math.max(targetCenterX, cardPos.left + EDGE_INSET),
      cardPos.left + cardSize.width - EDGE_INSET,
    );
    style.left = clampedX - half;
    style.top = placement === "bottom" ? cardPos.top - half : cardPos.top + cardSize.height - half;
  } else {
    const clampedY = Math.min(
      Math.max(targetCenterY, cardPos.top + EDGE_INSET),
      cardPos.top + cardSize.height - EDGE_INSET,
    );
    style.top = clampedY - half;
    style.left = placement === "right" ? cardPos.left - half : cardPos.left + cardSize.width - half;
  }

  return (
    <div
      aria-hidden
      className={cn(
        "fixed z-[202] rotate-45 bg-card border border-border shadow-sm transition-[top,left] duration-300 ease-out animate-in fade-in",
        animated && "animate-bounce",
      )}
      style={style}
    />
  );
}
