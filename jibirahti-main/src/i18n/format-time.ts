import type { Lang } from "./translations";

export type AccountStatus = "trial" | "active" | "expired";

export function computeAccountStatus(
  dbStatus: string | null | undefined,
  trialExpiresAt: string | null | undefined,
  subscriptionExpiresAt: string | null | undefined,
  now: Date = new Date()
): AccountStatus {
  // A valid subscription date is authoritative regardless of dbStatus.
  // Handles the case where subscription_expires_at was set but account_status
  // was not yet updated (trigger race, partial write, etc.).
  if (subscriptionExpiresAt && new Date(subscriptionExpiresAt) > now) {
    return "active";
  }

  const status = dbStatus ?? "trial";
  if (status === "expired") return "expired";
  if (status === "active") {
    // dbStatus is active but subscription is absent or past
    if (subscriptionExpiresAt) return "expired"; // expired subscription
    return "active";                             // active with no expiry (e.g. admin)
  }
  // trial — null trial_expires_at means trigger didn't fire yet; keep as "trial"
  if (trialExpiresAt && now >= new Date(trialExpiresAt)) return "expired";
  return "trial";
}

export function formatTimeRemaining(expiresAt: string, lang: Lang, now: Date = new Date()): string {
  const diff = new Date(expiresAt).getTime() - now.getTime();
  if (diff <= 0) return lang === "ar" ? "منتهي" : lang === "en" ? "Expired" : "Expiré";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 48) {
    const days = Math.floor(hours / 24);
    return lang === "ar"
      ? `${days} يوم`
      : lang === "en"
        ? `${days} day${days > 1 ? "s" : ""}`
        : `${days} jour${days > 1 ? "s" : ""}`;
  }
  if (hours > 0) {
    return lang === "ar"
      ? `${hours} ساعة و ${minutes} دقيقة`
      : lang === "en"
        ? `${hours}h ${minutes}min`
        : `${hours}h ${minutes}min`;
  }
  return lang === "ar" ? `${minutes} دقيقة` : `${minutes} min`;
}
