import { useEffect, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";

export interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export type TargetStatus = "idle" | "searching" | "found" | "missing";

const RETRY_INTERVAL_MS = 120;
const RETRY_TIMEOUT_MS = 4000;
const VIEWPORT_MARGIN = 24;

function readRect(el: Element): TargetRect {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function isComfortablyInView(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return (
    r.top >= VIEWPORT_MARGIN &&
    r.left >= VIEWPORT_MARGIN &&
    r.bottom <= window.innerHeight - VIEWPORT_MARGIN &&
    r.right <= window.innerWidth - VIEWPORT_MARGIN
  );
}

/**
 * Locates the DOM element carrying `data-tutorial-id="<targetId>"`, keeps
 * its bounding rect in sync (scroll/resize/DOM mutations), auto-scrolls it
 * into view when needed, and transparently re-resolves it whenever the
 * route changes (the previous element may have unmounted and a new one
 * with the same id may mount asynchronously on the new page).
 */
export function useTargetRect(targetId: string | null | undefined): {
  rect: TargetRect | null;
  status: TargetStatus;
} {
  const [rect, setRect] = useState<TargetRect | null>(null);
  const [status, setStatus] = useState<TargetStatus>("idle");
  const { pathname } = useLocation();
  const elementRef = useRef<Element | null>(null);

  useEffect(() => {
    elementRef.current = null;

    if (!targetId) {
      setRect(null);
      setStatus("idle");
      return;
    }

    setStatus("searching");
    setRect(null);

    let cancelled = false;
    let retryTimer: ReturnType<typeof setInterval> | null = null;
    // Separate from `settleTimer` (used for the post-scroll re-measure below):
    // this one only exists to declare defeat if nothing is ever found. It
    // must be cancelled the moment `attempt()` succeeds — on the very first
    // synchronous call or on any later retry — otherwise it fires anyway
    // and stomps a perfectly valid "found" status back to "missing".
    let giveUpTimer: ReturnType<typeof setTimeout> | null = null;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;

    const stopWatching = () => {
      if (retryTimer) clearInterval(retryTimer);
      if (giveUpTimer) clearTimeout(giveUpTimer);
      retryTimer = null;
      giveUpTimer = null;
    };

    const attempt = () => {
      const el = document.querySelector(`[data-tutorial-id="${targetId}"]`);
      if (!el) return false;

      elementRef.current = el;
      stopWatching();

      if (isComfortablyInView(el)) {
        setRect(readRect(el));
        setStatus("found");
      } else {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        settleTimer = setTimeout(() => {
          if (cancelled || !elementRef.current) return;
          setRect(readRect(elementRef.current));
          setStatus("found");
        }, 350);
      }
      return true;
    };

    if (!attempt()) {
      retryTimer = setInterval(attempt, RETRY_INTERVAL_MS);
      giveUpTimer = setTimeout(() => {
        stopWatching();
        if (!cancelled) setStatus("missing");
      }, RETRY_TIMEOUT_MS);
    }

    return () => {
      cancelled = true;
      stopWatching();
      if (settleTimer) clearTimeout(settleTimer);
    };
    // Re-resolve whenever the target id changes OR the route changes.
  }, [targetId, pathname]);

  useEffect(() => {
    if (status !== "found") return;

    const update = () => {
      if (elementRef.current) setRect(readRect(elementRef.current));
    };

    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    let ro: ResizeObserver | null = null;
    if (elementRef.current && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(update);
      ro.observe(elementRef.current);
    }

    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      ro?.disconnect();
    };
  }, [status]);

  return { rect, status };
}
