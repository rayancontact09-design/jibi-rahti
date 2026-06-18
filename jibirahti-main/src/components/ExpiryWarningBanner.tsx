import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useBudget } from "@/lib/budget-store";
import { useAuth } from "@/lib/auth";
import { computeAccountStatus } from "@/i18n/format-time";

const ADMIN_EMAIL = "rayan.contact09@gmail.com";
const STORAGE_KEY = "jibi-expiry-warn-dismissed";

// Whole days until the ISO date string, rounded up.
function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

// Whole minutes until the ISO date string, rounded up.
function minutesUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 60_000);
}

// Subscription warning threshold (days-based — monthly/yearly plans only).
function warningThreshold(days: number): 7 | 3 | 1 | null {
  if (days <= 1) return 1;
  if (days <= 3) return 3;
  if (days <= 7) return 7;
  return null;
}

export function ExpiryWarningBanner() {
  const { t, lang, accountStatus, trialExpiresAt, subscriptionExpiresAt } = useBudget();
  const { user } = useAuth();

  const isAdmin = user?.email === ADMIN_EMAIL;
  const effectiveStatus = computeAccountStatus(
    accountStatus, trialExpiresAt, subscriptionExpiresAt
  );
  const isTrial = effectiveStatus === "trial";

  // Pick the date that matters for the current status
  const expiresAt =
    effectiveStatus === "active" ? subscriptionExpiresAt
    : isTrial ? trialExpiresAt
    : null;

  // Trials are now only 2 hours long — day-based thresholds don't apply here.
  // Warn by minutes instead, only in the final 30 minutes of the trial.
  // Subscriptions (monthly/yearly) keep the original day-based 7/3/1 cadence.
  const minutesLeft = isTrial && expiresAt ? minutesUntil(expiresAt) : null;
  const trialWarning = minutesLeft !== null && minutesLeft > 0 && minutesLeft <= 30;

  const days = !isTrial && expiresAt ? daysUntil(expiresAt) : Infinity;
  const threshold = !isTrial ? warningThreshold(days) : null;

  // A unique key per (expiresAt × threshold) so dismissal resets automatically
  // when the threshold drops (e.g. user dismissed at 7, sees new banner at 3).
  const warningKey = isTrial
    ? (trialWarning && expiresAt ? `${expiresAt}|trial` : null)
    : (threshold !== null && expiresAt ? `${expiresAt}|${threshold}` : null);

  const [dismissedKey, setDismissedKey] = useState<string | null>(() => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  });

  // Never show when: admin, no warning needed, already expired, or dismissed
  if (isAdmin || !warningKey || effectiveStatus === "expired" || dismissedKey === warningKey) {
    return null;
  }

  const handleDismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, warningKey); } catch {}
    setDismissedKey(warningKey);
  };

  const message = isTrial
    ? t("expiryWarnTrialMinutes").replace("{minutes}", String(minutesLeft))
    : days <= 1
      ? t("expiryWarnTomorrow")
      : t("expiryWarnDays").replace("{days}", String(days));

  // Escalating urgency colour
  const bg =
    isTrial ? "#dc2626"            // red — trial countdown is always urgent
    : threshold === 1 ? "#dc2626"  // red
    : threshold === 3 ? "#f97316"  // orange
    : "#f59e0b";                   // amber

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 mb-4 text-white text-sm font-medium shadow-sm"
      style={{ background: bg, direction: lang === "ar" ? "rtl" : "ltr" }}
    >
      <div className="flex items-center gap-2 flex-1">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>{message}</span>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 hover:opacity-70 transition-opacity"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
