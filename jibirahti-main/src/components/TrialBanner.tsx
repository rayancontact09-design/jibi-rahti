import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useBudget } from "@/lib/budget-store";
import { formatTimeRemaining } from "@/i18n/format-time";

export function TrialBanner({ trialExpiresAt }: { trialExpiresAt: string }) {
  const { t, lang } = useBudget();
  const [now, setNow] = useState(() => new Date());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  if (dismissed) return null;

  const remaining = formatTimeRemaining(trialExpiresAt, lang, now);
  const msg = t("trialBannerMsg").replace("{time}", remaining);

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-between gap-2 bg-amber-500 text-white text-xs py-2 px-4 font-medium">
      <span className="flex-1 text-center">{msg}</span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
        aria-label="Fermer"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
