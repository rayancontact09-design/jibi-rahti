import { Fragment } from "react";
import { cn } from "@/lib/utils";
import type { TargetRect } from "./use-target-rect";

interface TutorialSpotlightProps {
  /** Rect the hole (blocking cutout) is carved around, or null to darken the whole screen (no target). */
  rect: TargetRect | null;
  /**
   * Rect the decorative glow ring is drawn around, if different from `rect`
   * — e.g. when `rect` was widened to a "safe area" (see TutorialStep.safeAreaId)
   * but the ring should still hug the actual target element. Defaults to `rect`.
   */
  highlightRect?: TargetRect | null;
  padding?: number;
  radius?: number;
  /** Opt-in stronger emphasis: pulsing highlight ring instead of the static one. */
  emphasize?: boolean;
}

const TRANSITION = "transition-[top,left,width,height] duration-300 ease-out";

/**
 * Dark backdrop that hides the app while carving a transparent, glowing
 * "hole" around the highlighted element. Built from four independent strips
 * around the target rect (instead of a single masked layer) so the hole is
 * never covered by anything — clicks and interactions on the real element
 * pass straight through, which is required for "action" steps.
 */
export function TutorialSpotlight({ rect, highlightRect, padding = 8, radius = 16, emphasize = false }: TutorialSpotlightProps) {
  if (!rect) {
    return (
      <div
        aria-hidden
        className="fixed inset-0 z-[200] bg-black/60 animate-in fade-in duration-300"
      />
    );
  }

  const top = Math.max(rect.top - padding, 0);
  const left = Math.max(rect.left - padding, 0);
  const width = rect.width + padding * 2;
  const height = rect.height + padding * 2;
  const right = left + width;
  const bottom = top + height;

  const ring = highlightRect ?? rect;
  const ringTop = Math.max(ring.top - padding, 0);
  const ringLeft = Math.max(ring.left - padding, 0);
  const ringWidth = ring.width + padding * 2;
  const ringHeight = ring.height + padding * 2;

  const strip = cn("fixed z-[200] bg-black/60 pointer-events-auto animate-in fade-in duration-300", TRANSITION);

  return (
    <Fragment>
      <div aria-hidden className={strip} style={{ top: 0, left: 0, width: "100vw", height: top }} />
      <div aria-hidden className={strip} style={{ top: bottom, left: 0, width: "100vw", height: `calc(100vh - ${bottom}px)` }} />
      <div aria-hidden className={strip} style={{ top, left: 0, width: left, height }} />
      <div aria-hidden className={strip} style={{ top, left: right, width: `calc(100vw - ${right}px)`, height }} />

      {/* Highlight ring around the target, purely decorative — no pointer events. */}
      <div
        aria-hidden
        className={cn(
          "fixed z-[201] pointer-events-none ring-2 ring-primary/80 shadow-[0_0_0_4px_rgba(20,184,166,0.25)] animate-in fade-in duration-300",
          emphasize && "animate-pulse",
          TRANSITION,
        )}
        style={{ top: ringTop, left: ringLeft, width: ringWidth, height: ringHeight, borderRadius: radius }}
      />
    </Fragment>
  );
}
