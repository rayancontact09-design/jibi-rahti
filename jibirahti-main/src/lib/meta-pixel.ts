// ─────────────────────────────────────────────────────────────────────────────
// Meta Pixel — centralized tracking
//
// The Pixel base code (init) lives in index.html.
// This file owns every fbq() call so they can be found, changed or removed
// in one place.
//
// Events are only sent in production builds; calls in development are no-ops.
// ─────────────────────────────────────────────────────────────────────────────

const PIXEL_ID = "27460616073605258";
const isProd = import.meta.env.PROD;

declare global {
  interface Window {
    fbq: (method: string, event: string, params?: Record<string, unknown>) => void;
    _fbq: unknown;
  }
}

function fbq(method: "track" | "trackCustom", event: string, params?: Record<string, unknown>) {
  if (!isProd || typeof window.fbq !== "function") return;
  if (params) {
    window.fbq(method, event, params);
  } else {
    window.fbq(method, event);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * PageView — fired on every route change (and initial load) via the TanStack
 * Router "onResolved" subscription in main.tsx.
 * Do NOT call fbq('track','PageView') in index.html — it would double-count.
 */
export function pixelPageView() {
  fbq("track", "PageView");
}

/** Standard Meta event — fires after a successful account creation. */
export function pixelCompleteRegistration() {
  fbq("track", "CompleteRegistration");
}

/**
 * Custom event — "Login" is not in Meta's standard event catalogue.
 * It is registered as a custom event in Events Manager.
 */
export function pixelLogin() {
  fbq("trackCustom", "Login");
}

/**
 * Standard Meta event — fires when the 2-hour free trial begins,
 * i.e. immediately after account creation.
 */
export function pixelStartTrial() {
  fbq("track", "StartTrial", { predicted_ltv: 0, currency: "MAD" });
}

/**
 * Standard Meta event — fires after a successful activation-code redemption.
 * Value is omitted because the price is not available in the API response;
 * it can be configured in Meta Events Manager.
 */
export function pixelPurchase() {
  fbq("track", "Purchase", { currency: "MAD", value: 0 });
}

/** Standard Meta event — fires when the Landing Page first renders. */
export function pixelViewContent() {
  fbq("track", "ViewContent", {
    content_name: "Landing Page",
    content_ids: [PIXEL_ID],
    content_type: "website",
  });
}
