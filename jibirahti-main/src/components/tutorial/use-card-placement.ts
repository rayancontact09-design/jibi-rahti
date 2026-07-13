import type { TargetRect } from "./use-target-rect";

export type ResolvedPlacement = "top" | "bottom" | "left" | "right" | "center";

export interface CardPosition {
  top: number;
  left: number;
  placement: ResolvedPlacement;
}

const GAP = 16;
const VIEWPORT_MARGIN = 16;

/**
 * Computes where the tutorial card should sit relative to the target rect,
 * flipping to the opposite side when the preferred side doesn't have room,
 * then clamping the result so the card always stays fully on-screen (mobile
 * and desktop alike). Falls back to a centered position when there is no
 * target rect (no target step, or the target hasn't been located yet).
 */
export function computeCardPosition(
  rect: TargetRect | null,
  cardSize: { width: number; height: number },
  preferred: ResolvedPlacement = "bottom",
): CardPosition {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (!rect) {
    return {
      top: Math.max(vh / 2 - cardSize.height / 2, VIEWPORT_MARGIN),
      left: Math.max(vw / 2 - cardSize.width / 2, VIEWPORT_MARGIN),
      placement: "center",
    };
  }

  const spaceAbove = rect.top;
  const spaceBelow = vh - rect.top - rect.height;
  const spaceLeft = rect.left;
  const spaceRight = vw - rect.left - rect.width;

  let placement = preferred;
  if (placement === "bottom" && spaceBelow < cardSize.height + GAP && spaceAbove > spaceBelow) {
    placement = "top";
  } else if (placement === "top" && spaceAbove < cardSize.height + GAP && spaceBelow > spaceAbove) {
    placement = "bottom";
  } else if (placement === "right" && spaceRight < cardSize.width + GAP && spaceLeft > spaceRight) {
    placement = "left";
  } else if (placement === "left" && spaceLeft < cardSize.width + GAP && spaceRight > spaceLeft) {
    placement = "right";
  }

  let top: number;
  let left: number;

  switch (placement) {
    case "top":
      top = rect.top - cardSize.height - GAP;
      left = rect.left + rect.width / 2 - cardSize.width / 2;
      break;
    case "left":
      top = rect.top + rect.height / 2 - cardSize.height / 2;
      left = rect.left - cardSize.width - GAP;
      break;
    case "right":
      top = rect.top + rect.height / 2 - cardSize.height / 2;
      left = rect.left + rect.width + GAP;
      break;
    case "bottom":
    default:
      top = rect.top + rect.height + GAP;
      left = rect.left + rect.width / 2 - cardSize.width / 2;
      break;
  }

  top = Math.min(Math.max(top, VIEWPORT_MARGIN), Math.max(vh - cardSize.height - VIEWPORT_MARGIN, VIEWPORT_MARGIN));
  left = Math.min(Math.max(left, VIEWPORT_MARGIN), Math.max(vw - cardSize.width - VIEWPORT_MARGIN, VIEWPORT_MARGIN));

  return { top, left, placement };
}
