import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBudget, formatMAD } from "@/lib/budget-store";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { AppShell } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Trash2, Pencil, Wallet, AlertCircle, Bell, CheckCircle2, TrendingUp, TrendingDown, Sun, Moon, Eye, ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SavingsGoalModal } from "@/components/SavingsGoalModal";
import { ExpiryWarningBanner } from "@/components/ExpiryWarningBanner";
import { BudgetWarningBanners } from "@/components/BudgetWarningBanners";
import { useTheme } from "@/hooks/use-theme";
import { generateCoachAdvice, formatCoachText, type CoachCategory, type CoachPriority } from "@/lib/coach";

type DynCategory = { id: string; name: string; budget: number };

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

const COACH_STYLES: Record<CoachPriority, { iconBg: string; cardBg: string; titleColor: string }> = {
  critical: {
    iconBg: "linear-gradient(135deg,#E53935,#FF6B6B)",
    cardBg: "linear-gradient(135deg,#FFF5F5,#FFE5E5)",
    titleColor: "#7F1D1D",
  },
  warning: {
    iconBg: "linear-gradient(135deg,#F59E0B,#FBBF24)",
    cardBg: "linear-gradient(135deg,#FFFBEB,#FEF3C7)",
    titleColor: "#8A5A00",
  },
  positive: {
    iconBg: "linear-gradient(135deg,#1FAF8B,#4CD4B0)",
    cardBg: "linear-gradient(135deg,#F4FBF8,#E8F5F0)",
    titleColor: "#0F766E",
  },
};

function DashboardPage() {
  const {
    t,
    lang,
    currency,
    income,
    effectiveIncome,
    totalExpenses,
    balance,
    expenses,
    removeExpense,
    savingsGoal,
    effectiveSavings,
    savingsUsed,
    savingsDepleted,
    balanceStatus,
  } = useBudget();

  const { user } = useAuth();
  const [dynCategories, setDynCategories] = useState<DynCategory[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("categories")
      .select("id, name, budget")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => { if (data) setDynCategories(data as DynCategory[]); });
  }, [user?.id]);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [allOpen, setAllOpen] = useState(false);
  const [allFilterDate, setAllFilterDate] = useState("");
  const [allFilterCat, setAllFilterCat] = useState<"all" | string>("all");
  const [goalOpen, setGoalOpen] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();

  const grouped = useMemo(() => {
    const list = filterDate
      ? expenses.filter((e) => e.date === filterDate)
      : expenses;
    const sorted = [...list].sort((a, b) => (a.date < b.date ? 1 : -1));
    const map = new Map<string, typeof sorted>();
    sorted.forEach((e) => {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    });
    return Array.from(map.entries());
  }, [expenses, filterDate]);

  const allFiltered = useMemo(() => {
    let list = expenses;
    if (allFilterCat !== "all") list = list.filter((e) => e.category_id === allFilterCat);
    if (allFilterDate) list = list.filter((e) => e.date === allFilterDate);
    return [...list].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [expenses, allFilterCat, allFilterDate]);

  const spentByCatId = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const obj: Record<string, number> = {};
    expenses
      .filter((e) => e.date.startsWith(ym) && e.category_id)
      .forEach((e) => { obj[e.category_id!] = (obj[e.category_id!] ?? 0) + e.amount; });
    return obj;
  }, [expenses]);

  const catNameById = useMemo(() => {
    const m: Record<string, string> = {};
    dynCategories.forEach((c) => { m[c.id] = c.name; });
    return m;
  }, [dynCategories]);

  const prevMonthExpenses = useMemo(() => {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevYm = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
    return expenses.filter((e) => e.date.startsWith(prevYm)).reduce((s, e) => s + e.amount, 0);
  }, [expenses]);

  // Financial coach: up to 3 personalized tips derived entirely from data
  // already in the app (no external AI call) — see src/lib/coach/rules.ts.
  const coachAdvice = useMemo(() => {
    const categories: CoachCategory[] = dynCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      budget: cat.budget,
      spent: spentByCatId[cat.id] ?? 0,
    }));
    return generateCoachAdvice({
      categories,
      effectiveIncome,
      balance,
      totalExpenses,
      prevMonthExpenses,
      effectiveSavings,
      savingsUsed,
      savingsDepleted,
      hasSavingsGoal: Boolean(savingsGoal),
    });
  }, [
    dynCategories, spentByCatId, effectiveIncome, balance, totalExpenses,
    prevMonthExpenses, effectiveSavings, savingsUsed, savingsDepleted, savingsGoal,
  ]);

  type AlertLevel = 1 | 2 | 3;
  type CategoryAlert = { id: string; name: string; level: AlertLevel; pct: number };
  const categoryAlerts: CategoryAlert[] = dynCategories.map((cat) => {
    const max = cat.budget;
    if (!max || max <= 0) return null;
    const spent = spentByCatId[cat.id] ?? 0;
    const pct = (spent / max) * 100;
    let level: AlertLevel | 0 = 0;
    if (pct >= 80 && pct < 100) level = 1;
    else if (pct >= 100 && spent <= max) level = 2;
    else if (spent > max) level = 3;
    if (!level) return null;
    return { id: cat.id, name: cat.name, level: level as AlertLevel, pct };
  })
    .filter((x): x is CategoryAlert => x !== null)
    .sort((a, b) => b.level - a.level);

  // "Économie du jour" — budget restant du mois ÷ jours restants avant la fin
  // du mois. Recalculé automatiquement à chaque changement de `balance`
  // (donc après chaque dépense, puisque `balance` en dépend dans budget-store).
  const dailySavingTarget = useMemo(() => {
    if (balance <= 0) return 0;
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(1, daysInMonth - now.getDate() + 1);
    return balance / daysRemaining;
  }, [balance]);

  const balanceGradient =
    balanceStatus === "positive"
      ? "from-primary to-primary/80"
      : balanceStatus === "zero"
        ? "from-orange-500 to-orange-400"
        : "from-red-600 to-red-500";
  void balanceGradient;

  const prevPctRef = useRef<Record<string, number> | null>(null);
  useEffect(() => {
    const current: Record<string, number> = {};
    dynCategories.forEach((cat) => {
      current[cat.id] = cat.budget > 0 ? ((spentByCatId[cat.id] ?? 0) / cat.budget) * 100 : 0;
    });
    const prev = prevPctRef.current;
    if (prev) {
      const crossed80 = dynCategories.some((cat) => current[cat.id] >= 80 && (prev[cat.id] ?? 0) < 80);
      const crossed100 = dynCategories.some((cat) => current[cat.id] >= 100 && (prev[cat.id] ?? 0) < 100);
      if (crossed100 && typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate?.([60, 40, 120]); } catch {}
      } else if (crossed80 && typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate?.(40); } catch {}
      }
      if (crossed80 || crossed100) {
        try {
          const AC = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AC();
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          o.frequency.value = 880;
          g.gain.value = 0.08;
          o.connect(g).connect(ctx.destination);
          const now = ctx.currentTime;
          g.gain.setValueAtTime(0.08, now);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
          o.start(now);
          o.stop(now + 0.26);
          setTimeout(() => ctx.close(), 400);
        } catch {}
      }
    }
    prevPctRef.current = current;
  }, [dynCategories, spentByCatId]);

  return (
    <AppShell>
      {(() => {
        const arFont = lang === "ar" ? "'Cairo', sans-serif" : "'Poppins', sans-serif";
        const alertCount = categoryAlerts.length + (balanceStatus === "negative" ? 1 : 0) + (savingsUsed ? 1 : 0);
        const isHealthy = balanceStatus === "positive" && !savingsUsed && !savingsDepleted;
        return (
          <>
            <header className={`mb-5 flex items-center justify-between ${lang === "ar" ? "flex-row-reverse" : ""}`}>
              <div className={lang === "ar" ? "text-right" : "text-left"}>
                <h1 className="text-2xl font-bold leading-tight" style={{ fontFamily: arFont, color: "#0F766E" }}>
                  {lang === "ar" ? (
                    <>
                      <span style={{ color: "#0F766E" }}>جيبي </span>
                      <span style={{ color: "#F59E0B" }}>راحتي</span>
                    </>
                  ) : (
                    <>
                      <span style={{ color: "#0F766E" }}>JIBI </span>
                      <span style={{ color: "#F59E0B" }}>RAHTI</span>
                    </>
                  )}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: arFont }}>
                  {t("dashboard")}
                </p>
              </div>
              <div className={`flex items-center gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
                <button
                  onClick={toggleTheme}
                  className="h-10 w-10 rounded-full glass shadow-card flex items-center justify-center active:scale-90 hover:scale-105 transition-all"
                  aria-label="toggle theme"
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5 text-[#F59E0B]" />
                  ) : (
                    <Moon className="h-5 w-5 text-primary" />
                  )}
                </button>
                <button
                  className="relative h-10 w-10 rounded-full glass shadow-card flex items-center justify-center active:scale-90 hover:scale-105 transition-all"
                  aria-label="notifications"
                >
                  <Bell className="h-5 w-5 text-primary" />
                  {alertCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F59E0B] text-white text-[10px] font-bold flex items-center justify-center shadow ring-2 ring-background animate-pulse">
                      {alertCount}
                    </span>
                  )}
                </button>
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shadow-elegant gradient-primary"
                  style={{ fontFamily: arFont }}
                >
                  {lang === "ar" ? "ج" : "J"}
                </div>
              </div>
            </header>

            <ExpiryWarningBanner />
            <BudgetWarningBanners categories={dynCategories} spentByCatId={spentByCatId} />

            {isHealthy && income > 0 && (
              <Card
                className={`mb-4 rounded-2xl border-0 p-4 flex items-center gap-3 shadow-sm animate-fade-in ${lang === "ar" ? "flex-row-reverse" : ""}`}
                style={{ background: "linear-gradient(135deg,#ECFDF5,#D1FAE5)" }}
              >
                <div
                  className="h-11 w-11 rounded-2xl flex items-center justify-center shadow-md shrink-0"
                  style={{ background: "linear-gradient(135deg,#1FAF8B,#4CD4B0)" }}
                >
                  <CheckCircle2 className="h-6 w-6 text-white" strokeWidth={2.2} />
                </div>
                <div className={`flex-1 ${lang === "ar" ? "text-right" : "text-left"}`}>
                  <p className="text-sm font-bold text-[#065F46]" style={{ fontFamily: arFont }}>
                    {t("dashGreatJobTitle")}
                  </p>
                  <p className="text-[11px] text-[#047857]/80 mt-0.5" style={{ fontFamily: arFont }}>
                    {t("dashGreatJobDesc")}
                  </p>
                </div>
              </Card>
            )}

            <Card
              className="relative overflow-hidden p-6 mb-4 text-white border-0 rounded-[28px] shadow-elegant transition-all duration-500 animate-count-up"
              style={{
                background:
                  balanceStatus === "positive"
                    ? "linear-gradient(135deg,#0F8B7E 0%,#1FAF8B 50%,#4CD4B0 100%)"
                    : balanceStatus === "zero"
                      ? "linear-gradient(135deg,#D97706,#F59E0B,#FBBF24)"
                      : "linear-gradient(135deg,#B91C1C,#E53935,#FF6B6B)",
              }}
            >
              <div
                className="absolute -top-20 -right-16 h-56 w-56 rounded-full opacity-25 animate-float-slow"
                style={{ background: "radial-gradient(circle,#fff 0%,transparent 70%)" }}
              />
              <div
                className="absolute -bottom-24 -left-12 h-48 w-48 rounded-full opacity-15 animate-float-slow"
                style={{ background: "radial-gradient(circle,#fff 0%,transparent 70%)", animationDelay: "1.5s" }}
              />
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />
              <div className={`relative flex items-start justify-between ${lang === "ar" ? "flex-row-reverse" : ""}`}>
                <div className={lang === "ar" ? "text-right" : "text-left"}>
                  <p className="text-[11px] uppercase tracking-[0.18em] opacity-80 font-semibold" style={{ fontFamily: arFont }}>{t("balance")}</p>
                  <p className="text-4xl font-extrabold mt-2 tracking-tight drop-shadow-sm" style={{ fontFamily: arFont }}>
                    {formatMAD(Math.max(0, balance), lang, currency)}
                  </p>
                  <div className={`mt-2 inline-flex items-center gap-1 text-[11px] bg-white/15 backdrop-blur px-2.5 py-1 rounded-full ${lang === "ar" ? "flex-row-reverse" : ""}`}>
                    <Eye className="h-3 w-3" />
                    <span style={{ fontFamily: arFont }}>
                      {income > 0 ? `${Math.max(0, Math.round((balance / income) * 100))}%` : "—"}
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg ring-1 ring-white/30">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className={`relative grid grid-cols-2 gap-3 mt-6`}>
                <div className="rounded-2xl bg-white/15 backdrop-blur-md px-3 py-3 ring-1 ring-white/20 hover:bg-white/20 transition">
                  <div className={`flex items-center gap-1.5 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
                    <div className="h-5 w-5 rounded-full bg-white/25 flex items-center justify-center">
                      <TrendingUp className="h-3 w-3" />
                    </div>
                    <p className="text-[11px] opacity-90 font-medium" style={{ fontFamily: arFont }}>{t("income")}</p>
                  </div>
                  <p className={`font-bold mt-1 text-sm ${lang === "ar" ? "text-right" : "text-left"}`} style={{ fontFamily: arFont }}>
                    {formatMAD(income, lang, currency)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/15 backdrop-blur-md px-3 py-3 ring-1 ring-white/20 hover:bg-white/20 transition">
                  <div className={`flex items-center gap-1.5 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
                    <div className="h-5 w-5 rounded-full bg-white/25 flex items-center justify-center">
                      <TrendingDown className="h-3 w-3" />
                    </div>
                    <p className="text-[11px] opacity-90 font-medium" style={{ fontFamily: arFont }}>{t("totalExpenses")}</p>
                  </div>
                  <p className={`font-bold mt-1 text-sm ${lang === "ar" ? "text-right" : "text-left"}`} style={{ fontFamily: arFont }}>
                    {formatMAD(totalExpenses, lang, currency)}
                  </p>
                </div>
              </div>
            </Card>

            {income > 0 && coachAdvice.length > 0 && (
              <div className="mb-4">
                {coachAdvice.map((advice) => {
                  const styles = COACH_STYLES[advice.priority];
                  const Icon = advice.icon;
                  return (
                    <Card
                      key={advice.id}
                      className={`relative overflow-hidden mb-3 rounded-3xl border-0 p-4 shadow-card glass animate-fade-in ${lang === "ar" ? "text-right" : "text-left"}`}
                      style={{ background: styles.cardBg }}
                    >
                      <div
                        aria-hidden
                        className="absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-30 blur-2xl"
                        style={{ background: "radial-gradient(circle, #4CD4B0 0%, transparent 70%)" }}
                      />
                      <div className={`relative flex items-start gap-3 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
                        <div
                          className="h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center shadow-elegant"
                          style={{ background: styles.iconBg }}
                        >
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className={`flex items-center gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
                            <p className="text-sm font-bold" style={{ fontFamily: arFont, color: styles.titleColor }}>
                              {t(advice.titleKey)}
                            </p>
                            <span className="text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">AI</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed" style={{ fontFamily: arFont }}>
                            {formatCoachText(t(advice.descriptionKey), advice.params)}
                          </p>
                          <p className="text-xs font-semibold mt-2" style={{ fontFamily: arFont, color: styles.titleColor }}>
                            💡 {formatCoachText(t(advice.actionKey), advice.params)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                <Link
                  to="/report"
                  className={`inline-flex items-center gap-1 text-xs font-semibold text-primary group ${lang === "ar" ? "flex-row-reverse" : ""}`}
                >
                  <span style={{ fontFamily: arFont }}>{t("fullAnalysisLink")}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            )}

            {income > 0 && (
              <Card
                className={`relative overflow-hidden mb-4 rounded-3xl border-0 p-4 shadow-card animate-fade-in ${lang === "ar" ? "text-right" : "text-left"}`}
                style={{
                  background: balance > 0
                    ? "linear-gradient(135deg,#FFFBEB,#FEF3C7)"
                    : "linear-gradient(135deg,#FFF5F5,#FFE5E5)",
                }}
              >
                <p
                  className="text-sm font-bold"
                  style={{ fontFamily: arFont, color: balance > 0 ? "#92400E" : "#7F1D1D" }}
                >
                  💡 {t("dailySavingTitle")}
                </p>
                <p
                  className="text-xs mt-1.5 leading-relaxed"
                  style={{ fontFamily: arFont, color: balance > 0 ? "#78350F" : "#7F1D1D" }}
                >
                  {balance > 0
                    ? t("dailySavingMessage").replace("{amount}", formatMAD(dailySavingTarget, lang, currency))
                    : t("dailySavingOverBudget")}
                </p>
              </Card>
            )}
          </>
        );
      })()}

      {(balanceStatus === "negative" || savingsUsed || savingsDepleted) && (
        <div className="space-y-2 mb-4 animate-fade-in">
          {balanceStatus === "negative" && (
            <Card
              className="p-3 border-2 text-sm font-medium"
              style={{ background: "#FDECEC", borderColor: "#E53935", color: "#9B1C1C", fontFamily: lang === "ar" ? "'Cairo', sans-serif" : undefined }}
            >
              {t("budgetExceededMsg")}
            </Card>
          )}
          {savingsUsed && !savingsDepleted && (
            <Card
              className="p-3 border-2 text-sm font-medium"
              style={{ background: "#FFF4E0", borderColor: "#F6A21A", color: "#8A5A00", fontFamily: lang === "ar" ? "'Cairo', sans-serif" : undefined }}
            >
              {t("savingsUsedMsg")}
            </Card>
          )}
          {savingsDepleted && (
            <Card
              className="p-3 border-2 text-sm font-bold animate-pulse"
              style={{ background: "linear-gradient(135deg,#FDECEC,#FFD7D7)", borderColor: "#E53935", color: "#7F1D1D", fontFamily: lang === "ar" ? "'Cairo', sans-serif" : undefined }}
            >
              {t("savingsDepletedMsg")}
            </Card>
          )}
        </div>
      )}

      {(() => {
        const displaySavings = Math.max(0, effectiveSavings);
        const pct = income > 0 ? Math.min(100, Math.max(0, Math.round((displaySavings / income) * 100))) : 0;
        const danger = savingsUsed || savingsDepleted;
        const accent = danger ? "#E53935" : "#0F8B7E";
        const accentDark = danger ? "#B71C1C" : "#0F766E";
        const cardBg = danger
          ? "linear-gradient(135deg, #FFF5F5 0%, #FFE5E5 100%)"
          : "linear-gradient(135deg, #F4FBF8 0%, #E8F5F0 100%)";
        const walletBg = danger
          ? "linear-gradient(135deg, #E53935, #FF6B6B)"
          : "linear-gradient(135deg, #0F8B7E, #34D399)";
        const barBg = danger
          ? "linear-gradient(90deg, #E53935, #FF6B6B)"
          : "linear-gradient(90deg, #0F8B7E, #34D399)";
        const glow = danger ? "#FF6B6B" : "#34D399";
        return (
          <Card
            className={`mb-4 overflow-hidden rounded-[20px] shadow-[0_8px_24px_-12px_rgba(15,139,126,0.35)] transition-all duration-500 ${danger ? "border-2" : "border-0"}`}
            style={{ background: cardBg, borderColor: danger ? "#FCA5A5" : undefined }}
          >
            <div className={`p-5 flex items-center gap-4 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
              <div className={`flex-1 ${lang === "ar" ? "text-right" : "text-left"}`}>
                <div className={`flex items-center gap-1.5 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
                  {danger && <AlertCircle className="h-4 w-4" style={{ color: accent }} />}
                  <p className="text-sm font-semibold" style={{ color: accent, fontFamily: lang === "ar" ? "'Cairo', sans-serif" : undefined }}>
                    {t("monthlySavings")}
                  </p>
                </div>
                <p className="text-2xl font-bold mt-1" style={{ color: accentDark, fontFamily: lang === "ar" ? "'Cairo', sans-serif" : undefined }}>
                  {formatMAD(displaySavings, lang, currency)}
                </p>
                <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: lang === "ar" ? "'Cairo', sans-serif" : undefined }}>
                  {lang === "ar" ? `تم ادخار ${pct}% ${t("savedFromIncome")}` : `${pct}% ${t("savedFromIncome")}`}
                </p>

                <div className={`flex items-center gap-2 mt-3 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
                  <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: barBg }}
                    />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: accent }}>{pct}%</span>
                </div>

                {savingsUsed && (
                  <p
                    className={`text-xs mt-2 font-medium ${lang === "ar" ? "text-right" : "text-left"}`}
                    style={{ color: accent, fontFamily: lang === "ar" ? "'Cairo', sans-serif" : undefined }}
                  >
                    {t("savingsUsedWarning")}
                  </p>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGoalOpen(true)}
                  className="rounded-full border-2 gap-2 mt-4"
                  style={{ borderColor: accent, color: accent }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span style={{ fontFamily: lang === "ar" ? "'Cairo', sans-serif" : undefined }}>
                    {t("editSavingsGoal")}
                  </span>
                </Button>
              </div>

              <div className="relative shrink-0">
                <div
                  className="absolute inset-0 rounded-full blur-2xl opacity-50"
                  style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 70%)` }}
                />
                <div
                  className="relative h-20 w-20 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: walletBg }}
                >
                  <Wallet className="h-10 w-10 text-white" strokeWidth={1.8} />
                  <div
                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md"
                    style={{ background: "linear-gradient(135deg, #F6A21A, #F59E0B)" }}
                  >
                    ₵
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })()}

      {categoryAlerts.length > 0 && (
        <div className={`space-y-2 mb-3 ${lang === "ar" ? "text-right" : "text-left"}`}>
          {categoryAlerts.map(({ id, name, level, pct }) => {
            const styles =
              level === 1
                ? { bg: "#FFF4E0", border: "#F6A21A", icon: "#F6A21A", text: "#8A5A00" }
                : level === 2
                  ? { bg: "#FFF7ED", border: "#F97316", icon: "#F97316", text: "#7C2D12" }
                  : { bg: "linear-gradient(135deg,#FDECEC,#FFD7D7)", border: "#E53935", icon: "#E53935", text: "#7F1D1D" };
            const msg =
              level === 1
                ? t("alert80Msg")
                : level === 2
                  ? t("alert100Msg")
                  : t("alertCriticalMsg");
            return (
              <Card
                key={id}
                className={`rounded-2xl border p-3 flex items-center gap-3 shadow-sm animate-fade-in ${level === 3 ? "animate-pulse" : ""} ${lang === "ar" ? "flex-row-reverse" : ""}`}
                style={{ background: styles.bg, borderColor: styles.border }}
              >
                <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: styles.icon }} />
                <div className="flex-1">
                  <p className="text-xs font-bold mb-0.5" style={{ color: styles.icon, fontFamily: lang === "ar" ? "'Cairo', sans-serif" : undefined }}>
                    {name}
                  </p>
                  <p
                    className="text-sm font-medium leading-snug"
                    style={{ color: styles.text, fontFamily: lang === "ar" ? "'Cairo', sans-serif" : undefined }}
                  >
                    {msg}
                  </p>
                  <p className="text-xs mt-0.5 font-semibold" style={{ color: styles.icon }}>
                    {Math.round(pct)}%
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <h2 className={`text-sm font-bold mt-6 mb-3 flex items-center gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`} style={{ fontFamily: lang === "ar" ? "'Cairo', sans-serif" : undefined }}>
        <span className="h-1 w-6 rounded-full gradient-primary" />
        {t("budgetPerCategory")}
      </h2>
      <div className="space-y-2.5 mb-6">
        {dynCategories.map((cat) => {
          const spent = spentByCatId[cat.id] ?? 0;
          const max = cat.budget;
          const pct = max > 0 ? Math.min(100, (spent / max) * 100) : 0;
          const rawPct = max > 0 ? (spent / max) * 100 : 0;
          const indicatorColor = rawPct > 100 ? "bg-destructive" : rawPct >= 100 ? "bg-orange-500" : rawPct >= 80 ? "bg-warning" : "bg-success";
          return (
            <Card
              key={cat.id}
              className="p-3.5 cursor-pointer rounded-2xl border-border/40 glass shadow-card hover:scale-[1.01] hover:shadow-elegant transition-all duration-300"
              onClick={() => setAllOpen(true)}
            >
              <div className={`flex justify-between text-sm mb-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
                <span className="font-semibold" style={{ fontFamily: lang === "ar" ? "'Cairo', sans-serif" : undefined }}>{cat.name}</span>
                <span className="text-muted-foreground text-xs">
                  {formatMAD(spent, lang, currency)} {max > 0 && `${t("of")} ${formatMAD(max, lang, currency)}`}
                </span>
              </div>
              {max > 0 && <Progress value={pct} className="h-2" indicatorClassName={indicatorColor} />}
            </Card>
          );
        })}
      </div>

      <h2 className={`text-sm font-bold mb-3 flex items-center gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`} style={{ fontFamily: lang === "ar" ? "'Cairo', sans-serif" : undefined }}>
        <span className="h-1 w-6 rounded-full gradient-primary" />
        {t("recentExpenses")}
      </h2>
      {expenses.length === 0 ? (
        <Card className="p-6 rounded-2xl glass border-border/40 text-center text-sm text-muted-foreground">
          {t("noExpenses")}
        </Card>
      ) : (
        <ul className="space-y-2">
          {expenses.slice(0, 10).map((e) => (
            <li key={e.id}>
              <Card className={`p-3 flex items-center gap-3 rounded-2xl glass border-border/40 shadow-card hover:shadow-elegant transition-all ${lang === "ar" ? "flex-row-reverse" : ""}`}>
                <div className="h-10 w-10 rounded-xl gradient-soft flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-sm" style={{ fontFamily: lang === "ar" ? "'Cairo', sans-serif" : undefined }}>
                    {((e.category_id ? (catNameById[e.category_id] ?? e.category) : t(e.category)) || "?").charAt(0)}
                  </span>
                </div>
                <div className={`flex-1 ${lang === "ar" ? "text-right" : "text-left"}`}>
                  <p className="font-semibold text-sm" style={{ fontFamily: lang === "ar" ? "'Cairo', sans-serif" : undefined }}>
                    {e.category_id ? (catNameById[e.category_id] ?? e.category) : t(e.category)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {e.date}{e.note ? ` · ${e.note}` : ""}
                  </p>
                </div>
                <p className="font-bold text-sm text-primary" style={{ fontFamily: lang === "ar" ? "'Cairo', sans-serif" : undefined }}>
                  −{formatMAD(e.amount, lang, currency)}
                </p>
                <Button variant="ghost" size="icon" onClick={() => setHistoryOpen(true)} aria-label={t("history")}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={historyOpen} onOpenChange={(o) => { setHistoryOpen(o); if (!o) setConfirmId(null); }}>
        <SheetContent side="bottom" className="h-[85vh] flex flex-col">
          <SheetHeader>
            <SheetTitle>{t("history")}</SheetTitle>
          </SheetHeader>
          <div className="flex items-end gap-2 mt-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">{t("filterByDate")}</label>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            {filterDate && (
              <Button variant="outline" size="sm" onClick={() => setFilterDate("")}>
                {t("clear")}
              </Button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto mt-4 space-y-4 pb-4">
            {grouped.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t("noExpenses")}</p>
            ) : (
              grouped.map(([date, items]) => (
                <div key={date}>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">{date}</p>
                  <ul className="space-y-2">
                    {items.map((e) => (
                      <li key={e.id}>
                        <Card className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <p className="font-medium">
                                {e.category_id ? (catNameById[e.category_id] ?? e.category) : t(e.category)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {e.date}{e.note ? ` · ${e.note}` : ""}
                              </p>
                            </div>
                            <p className="font-semibold">{formatMAD(e.amount, lang, currency)}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setConfirmId(confirmId === e.id ? null : e.id)}
                              aria-label={t("delete")}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          {confirmId === e.id && (
                            <div className="flex gap-2 mt-3">
                              <Button
                                variant="destructive"
                                size="sm"
                                className="flex-1"
                                onClick={() => { removeExpense(e.id); setConfirmId(null); }}
                              >
                                {t("delete")}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => setConfirmId(null)}
                              >
                                {t("clear")}
                              </Button>
                            </div>
                          )}
                        </Card>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={allOpen} onOpenChange={setAllOpen}>
        <SheetContent side="bottom" className="h-[85vh] flex flex-col">
          <SheetHeader>
            <SheetTitle>{t("allExpenses")}</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div>
              <label className="text-xs text-muted-foreground">{t("filterByCategory")}</label>
              <select
                value={allFilterCat}
                onChange={(e) => setAllFilterCat(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm"
              >
                <option value="all">{t("allCategories")}</option>
                {dynCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{t("filterByDate")}</label>
              <Input
                type="date"
                value={allFilterDate}
                onChange={(e) => setAllFilterDate(e.target.value)}
              />
            </div>
          </div>
          {(allFilterDate || allFilterCat !== "all") && (
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setAllFilterDate(""); setAllFilterCat("all"); }}
              >
                {t("clear")}
              </Button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto mt-4 space-y-2 pb-4">
            {allFiltered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t("noExpenses")}</p>
            ) : (
              allFiltered.map((e) => (
                <Card key={e.id} className="p-3 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium">
                      {e.category_id ? (catNameById[e.category_id] ?? e.category) : t(e.category)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {e.date}{e.note ? ` · ${e.note}` : ""}
                    </p>
                  </div>
                  <p className="font-semibold">{formatMAD(e.amount, lang, currency)}</p>
                </Card>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
      <SavingsGoalModal open={goalOpen} onOpenChange={setGoalOpen} />
    </AppShell>
  );
}
