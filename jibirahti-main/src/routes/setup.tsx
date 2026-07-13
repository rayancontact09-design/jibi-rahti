import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useBudget, type Currency, type Lang } from "@/lib/budget-store";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { tr, applyLangToDOM } from "@/i18n/translations";

export const Route = createFileRoute("/setup")({
  component: SetupPage,
});

const LANG_OPTIONS: { value: Lang; flag: string; nativeLabel: string }[] = [
  { value: "ar", flag: "🇦🇪", nativeLabel: "العربية" },
  { value: "fr", flag: "🇫🇷", nativeLabel: "Français" },
  { value: "en", flag: "🇬🇧", nativeLabel: "English" },
];

const CURRENCY_OPTIONS: { value: Currency; flag: string; label: string }[] = [
  { value: "MAD", flag: "🇲🇦", label: "MAD — Dirham" },
  { value: "EUR", flag: "🇪🇺", label: "EUR — Euro" },
  { value: "USD", flag: "🇺🇸", label: "USD — Dollar" },
];

function SetupPage() {
  const { user } = useAuth();
  const { setLang, setCurrency } = useBudget();
  const navigate = useNavigate();

  const [selectedLang, setSelectedLang] = useState<Lang | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [saving, setSaving] = useState(false);

  // Guard: redirect existing users who land here without the setup flag
  useEffect(() => {
    if (!sessionStorage.getItem("jibi_setup_needed")) {
      navigate({ to: "/dashboard" });
    }
  }, [navigate]);

  const setupNeeded = sessionStorage.getItem("jibi_setup_needed");
  if (!setupNeeded) return null;

  const uiLang: Lang = selectedLang ?? "fr";
  const rtl = uiLang === "ar";
  const font = uiLang === "ar" ? "'Cairo', sans-serif" : "'Poppins', sans-serif";
  const canContinue = selectedLang !== null && selectedCurrency !== null;

  const handleLangSelect = (lang: Lang) => {
    setSelectedLang(lang);
    applyLangToDOM(lang);
  };

  const handleContinue = async () => {
    if (!canContinue || saving) return;
    setSaving(true);

    if (user?.id) {
      const { error } = await supabase
        .from("profiles")
        .upsert(
          { id: user.id, lang: selectedLang, currency: selectedCurrency },
          { onConflict: "id" }
        );
      if (error) console.error("[jibi] setup upsert:", error.message);
    }

    // Update live context state immediately
    setLang(selectedLang!);
    setCurrency(selectedCurrency!);

    sessionStorage.removeItem("jibi_setup_needed");
    navigate({ to: "/dashboard" });
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-[#F8FAFB]"
      style={{ fontFamily: font, direction: rtl ? "rtl" : "ltr" }}
    >
      {/* ── Hero gradient header ────────────────────────────────────────── */}
      <div
        className="relative flex flex-col items-center justify-center px-6 py-16 overflow-hidden animate-in fade-in duration-700"
        style={{
          background: "linear-gradient(160deg, #0A7A6E 0%, #0F8B7E 40%, #1FAF8B 75%, #4CD4B0 100%)",
          minHeight: "440px",
        }}
      >
        {/* Soft blurred lights — depth, no distracting decoration */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-20 h-80 w-80 rounded-full opacity-30 blur-3xl animate-float-slow"
          style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-16 h-72 w-72 rounded-full opacity-20 blur-3xl animate-float-slow"
          style={{ background: "radial-gradient(circle, #4CD4B0 0%, transparent 70%)", animationDelay: "2.5s" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full opacity-[0.08] blur-3xl"
          style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }}
        />

        {/* Logo + title */}
        <div className="relative flex flex-col items-center text-center">
          <div
            className="h-24 w-24 rounded-4xl flex items-center justify-center shadow-elegant mb-8 ring-1 ring-white/25 animate-float-slow"
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(20px) saturate(160%)",
              WebkitBackdropFilter: "blur(20px) saturate(160%)",
            }}
          >
            <img src="/icon-192.png" alt="JIBI RAHTI" className="h-14 w-14 rounded-2xl object-contain" />
          </div>

          <h1
            className="text-3xl font-extrabold text-white leading-tight tracking-tight"
            style={{ fontFamily: font, textShadow: "0 2px 16px rgba(0,0,0,0.18)" }}
          >
            {tr(uiLang, "setupTitle")}
          </h1>
          <p
            className="text-white/80 text-[15px] mt-3.5 max-w-[520px] leading-relaxed"
            style={{ fontFamily: font }}
          >
            {tr(uiLang, "setupDesc")}
          </p>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center w-full px-4 -mt-8 pb-10 gap-4">
        {/* Progress dots */}
        <div className="flex items-center gap-2 mb-1">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${selectedLang ? "w-8 bg-[#0F8B7E]" : "w-5 bg-gray-300"}`}
          />
          <div
            className={`h-2 rounded-full transition-all duration-300 ${selectedCurrency ? "w-8 bg-[#0F8B7E]" : "w-5 bg-gray-300"}`}
          />
        </div>

        {/* ── Language card ── */}
        <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_4px_28px_-8px_rgba(15,139,126,0.18)] p-5">
          <p className="text-[13px] font-bold text-[#0F766E] mb-3.5 uppercase tracking-wide"
            style={{ fontFamily: font }}>
            {tr(uiLang, "setupLangSection")}
          </p>

          <div className="space-y-2.5">
            {LANG_OPTIONS.map((opt) => {
              const active = selectedLang === opt.value;
              const itemFont = opt.value === "ar" ? "'Cairo', sans-serif" : "'Poppins', sans-serif";
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleLangSelect(opt.value)}
                  className={`
                    w-full flex items-center gap-3.5 rounded-2xl p-4 text-left transition-all
                    active:scale-[0.975] border-2 outline-none
                    ${active
                      ? "border-[#0F8B7E] bg-gradient-to-r from-[#F0FBF9] to-[#E8F7F3] shadow-[0_2px_12px_-4px_rgba(15,139,126,0.25)]"
                      : "border-transparent bg-[#F6F8FA] hover:bg-[#EEF6F3] hover:border-[#C8EBE4]"
                    }
                    ${rtl ? "flex-row-reverse text-right" : "text-left"}
                  `}
                  style={{ fontFamily: itemFont }}
                >
                  <span className="text-[26px] leading-none shrink-0">{opt.flag}</span>
                  <span
                    className={`flex-1 text-[15px] font-semibold ${active ? "text-[#0F766E]" : "text-[#1c2e2c]"}`}
                    style={{ fontFamily: itemFont }}
                  >
                    {opt.nativeLabel}
                  </span>
                  {active && (
                    <CheckCircle2 className="h-5 w-5 text-[#0F8B7E] shrink-0" strokeWidth={2.2} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Currency card ── */}
        <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_4px_28px_-8px_rgba(15,139,126,0.18)] p-5">
          <p className="text-[13px] font-bold text-[#0F766E] mb-3.5 uppercase tracking-wide"
            style={{ fontFamily: font }}>
            {tr(uiLang, "setupCurrencySection")}
          </p>

          <div className="space-y-2.5">
            {CURRENCY_OPTIONS.map((opt) => {
              const active = selectedCurrency === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedCurrency(opt.value)}
                  className={`
                    w-full flex items-center gap-3.5 rounded-2xl p-4 transition-all
                    active:scale-[0.975] border-2 outline-none
                    ${active
                      ? "border-[#0F8B7E] bg-gradient-to-r from-[#F0FBF9] to-[#E8F7F3] shadow-[0_2px_12px_-4px_rgba(15,139,126,0.25)]"
                      : "border-transparent bg-[#F6F8FA] hover:bg-[#EEF6F3] hover:border-[#C8EBE4]"
                    }
                    ${rtl ? "flex-row-reverse text-right" : "text-left"}
                  `}
                  style={{ fontFamily: font }}
                >
                  <span className="text-[26px] leading-none shrink-0">{opt.flag}</span>
                  <span
                    className={`flex-1 text-[15px] font-semibold ${active ? "text-[#0F766E]" : "text-[#1c2e2c]"}`}
                    style={{ fontFamily: font }}
                  >
                    {opt.label}
                  </span>
                  {active && (
                    <CheckCircle2 className="h-5 w-5 text-[#0F8B7E] shrink-0" strokeWidth={2.2} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Continue button ── */}
        <div className="w-full max-w-md mt-1">
          <Button
            onClick={handleContinue}
            disabled={!canContinue || saving}
            className="w-full h-[54px] rounded-2xl text-white font-bold text-[15px] border-0 transition-all duration-300
              disabled:opacity-35 disabled:shadow-none disabled:cursor-not-allowed"
            style={{
              background: canContinue
                ? "linear-gradient(135deg, #0F8B7E 0%, #1FAF8B 60%, #4CD4B0 100%)"
                : "#C8D8D6",
              boxShadow: canContinue
                ? "0 8px 28px -6px rgba(15,139,126,0.55)"
                : "none",
              fontFamily: font,
            }}
          >
            {saving ? tr(uiLang, "setupContinueLoading") : tr(uiLang, "setupContinueBtn")}
          </Button>
        </div>
      </div>
    </div>
  );
}
