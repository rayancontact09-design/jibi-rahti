import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBudget } from "@/lib/budget-store";

export function ActivationCodeInput() {
  const { t, lang, refreshProfile } = useBudget();
  const [codeInput, setCodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleRedeem = async () => {
    const trimmed = codeInput.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setResult(null);

    const { data, error } = await supabase.rpc("redeem_activation_code", { p_code: trimmed });

    if (error) {
      setResult({ success: false, message: t("codeErrNotFound") });
    } else if (!data?.success) {
      const errorMap: Record<string, string> = {
        code_not_found: t("codeErrNotFound"),
        code_revoked: t("codeErrRevoked"),
        code_exhausted: t("codeErrExhausted"),
        already_redeemed: t("codeErrAlreadyRedeemed"),
      };
      setResult({ success: false, message: errorMap[data.error] ?? t("codeErrNotFound") });
    } else {
      const expDate = new Date(data.expires_at).toLocaleDateString(
        lang === "ar" ? "ar-MA" : "fr-FR",
        { day: "numeric", month: "long", year: "numeric" }
      );
      setResult({ success: true, message: t("codeSuccess").replace("{date}", expDate) });
      setTimeout(() => refreshProfile(), 1500);
    }

    setLoading(false);
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex gap-2">
        <Input
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
          placeholder={t("codePlaceholder")}
          className="font-mono text-sm"
          disabled={loading}
          maxLength={19}
          onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
        />
        <Button
          type="button"
          className="shrink-0"
          disabled={loading || !codeInput.trim()}
          onClick={handleRedeem}
        >
          {loading ? t("redeemLoading") : t("redeemCode")}
        </Button>
      </div>
      {result && (
        <p className={`text-xs font-medium ${result.success ? "text-emerald-600" : "text-destructive"}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}
