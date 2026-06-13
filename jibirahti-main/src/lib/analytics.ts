const MEASUREMENT_ID = "G-9BZH43CTN3";

// Events are only sent in production builds.
// In development the gtag function is defined (from index.html) but never called.
const isProd = import.meta.env.PROD;

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

function send(event: string, params?: Record<string, unknown>) {
  if (!isProd || typeof window.gtag !== "function") return;
  window.gtag("event", event, params);
}

// Called on every route change by the router subscription in main.tsx.
export function trackPageView(path: string) {
  if (!isProd || typeof window.gtag !== "function") return;
  window.gtag("config", MEASUREMENT_ID, { page_path: path });
}

export function trackSignup() {
  send("user_signup");
}

export function trackLogin() {
  send("user_login");
}

export function trackExpenseAdded() {
  send("expense_added");
}

export function trackSavingsGoalCreated() {
  send("savings_goal_created");
}

export function trackAppInstallClicked() {
  send("app_install_clicked");
}
