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

// Which warning threshold applies (null = no warning needed).
// Once the user dismisses the 7-day banner, it stays dismissed until
// the threshold drops to 3, then again until it drops to 1.
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

  // Pick the date that matters for the current status
  const expiresAt =
    effectiveStatus === "active" ? subscriptionExpiresAt
    : effectiveStatus === "trial" ? trialExpiresAt
    : null;

  const days = expiresAt ? daysUntil(expiresAt) : Infinity;
  const threshold = warningThreshold(days);

  // A unique key per (expiresAt × threshold) so dismissal resets automatically
  // when the threshold drops (e.g. user dismissed at 7, sees new banner at 3).
  const warningKey = threshold !== null && expiresAt ? `${expiresAt}|${threshold}` : null;

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

  const message =
    days <= 1
      ? t("expiryWarnTomorrow")
      : t("expiryWarnDays").replace("{days}", String(days));

  // Escalating urgency colour
  const bg =
    threshold === 1 ? "#dc2626"   // red
    : threshold === 3 ? "#f97316" // orange
    : "#f59e0b";                  // amber

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
