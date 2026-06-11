import { Key } from "lucide-react";
import { useBudget } from "@/lib/budget-store";
import { useAuth } from "@/lib/auth";
import { ActivationCodeInput } from "@/components/ActivationCodeInput";

export function ExpiredScreen() {
  const { t } = useBudget();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-sm w-full space-y-6">
        <div
          className="inline-flex h-20 w-20 items-center justify-center rounded-2xl mx-auto text-4xl"
          style={{ background: "linear-gradient(135deg,#F59E0B,#EF4444)" }}
        >
          ⏰
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t("trialExpiredTitle")}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{t("trialExpiredMsg")}</p>
        </div>
        <div className="bg-card border rounded-xl p-4 text-left space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Key className="h-4 w-4 text-primary" />
            {t("activationCodeTitle")}
          </div>
          <ActivationCodeInput />
        </div>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("whatsappNoCode")}</p>
          <a
            href="https://wa.me/212644411059"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-sm font-semibold py-3 px-4 transition-colors"
          >
            💬 {t("whatsappGetCode")}
          </a>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("logout")}
        </button>
      </div>
    </div>
  );
}
