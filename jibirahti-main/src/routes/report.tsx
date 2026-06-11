import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/BottomNav";
import { BudgetWarningBanners } from "@/components/BudgetWarningBanners";
import { Card } from "@/components/ui/card";
import { useBudget, formatMAD } from "@/lib/budget-store";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  Printer, Copy, Share2, Download, TrendingUp, TrendingDown,
  Wallet, PiggyBank, Sparkles, BarChart3, Lightbulb, Activity, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/report")({
  component: ReportPage,
});

const CAT_PALETTE = ["#1FAF8B", "#34D399", "#0F766E", "#A7F3D0", "#F59E0B", "#60A5FA", "#C084FC", "#FB923C"];
const catColor = (i: number) => CAT_PALETTE[i % CAT_PALETTE.length];

type DynCategory = { id: string; name: string; budget: number };

function ReportPage() {
  const {
    t, lang, effectiveIncome, expenses, savings, effectiveSavings,
    totalExpenses, balance,
  } = useBudget();
  const { user } = useAuth();
  const reportRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [dynCategories, setDynCategories] = useState<DynCategory[]>([]);
  const arFont = lang === "ar" ? "'Cairo', sans-serif" : "'Poppins', sans-serif";
  const isAr = lang === "ar";

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("categories")
      .select("id, name, budget")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => { if (data) setDynCategories(data as DynCategory[]); });
  }, [user?.id]);

  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevYm = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;

  const spentByCatId = useMemo(() => {
    const obj: Record<string, number> = {};
    expenses
      .filter(e => e.date.startsWith(ym) && e.category_id)
      .forEach(e => { obj[e.category_id!] = (obj[e.category_id!] ?? 0) + e.amount; });
    return obj;
  }, [expenses, ym]);

  const prevTotal = useMemo(
    () => expenses.filter(e => e.date.startsWith(prevYm)).reduce((s, e) => s + e.amount, 0),
    [expenses, prevYm]
  );
  const prevSpentByCatId = useMemo(() => {
    const obj: Record<string, number> = {};
    expenses
      .filter(e => e.date.startsWith(prevYm) && e.category_id)
      .forEach(e => { obj[e.category_id!] = (obj[e.category_id!] ?? 0) + e.amount; });
    return obj;
  }, [expenses, prevYm]);

  const pureExpenses = totalExpenses - savings; // totalExpenses includes savings
  const remaining = Math.max(0, balance);
  const monthName = now.toLocaleDateString(isAr ? "ar-MA" : "fr-MA", { month: "long", year: "numeric" });

  // Health score
  const healthScore = useMemo(() => {
    if (effectiveIncome <= 0) return 0;
    const savingRate = Math.max(0, effectiveSavings) / effectiveIncome;
    const expenseRatio = Math.min(1, pureExpenses / effectiveIncome);
    const balanceFactor = balance >= 0 ? 1 : 0;
    let score = (savingRate * 50) + ((1 - expenseRatio) * 35) + (balanceFactor * 15);
    score = Math.max(0, Math.min(100, Math.round(score)));
    return score;
  }, [effectiveIncome, effectiveSavings, pureExpenses, balance]);

  const healthLabel =
    healthScore >= 80 ? t("excellent") : healthScore >= 60 ? t("good") : healthScore >= 40 ? t("average") : t("poor");
  const healthColor =
    healthScore >= 80 ? "#10B981" : healthScore >= 60 ? "#1FAF8B" : healthScore >= 40 ? "#F59E0B" : "#E53935";

  const catData = dynCategories.map((cat, i) => {
    const value = spentByCatId[cat.id] ?? 0;
    return {
      id: cat.id,
      name: cat.name,
      budget: cat.budget,
      color: catColor(i),
      value,
      pct: pureExpenses > 0 ? (value / pureExpenses) * 100 : 0,
      budgetPct: cat.budget > 0 ? Math.min(100, (value / cat.budget) * 100) : 0,
    };
  });
  const topCat = [...catData].sort((a, b) => b.value - a.value)[0];

  const insights: string[] = [];
  if (effectiveIncome > 0) {
    if (effectiveSavings / effectiveIncome >= 0.15) insights.push(t("insightSavingsGood"));
    else if (effectiveSavings / effectiveIncome < 0.05) insights.push(t("insightSavingsBad"));
    if (balance < 0) insights.push(t("insightOverspend"));
    if (topCat && topCat.pct > 40) insights.push(t("insightCategoryHigh").replace("{cat}", topCat.name));
  }

  const recommendations: string[] = [];
  if (topCat && topCat.value > 0) {
    recommendations.push(
      t("recReduceCategory").replace("{cat}", topCat.name).replace("{amt}", formatMAD(topCat.value * 0.1, lang))
    );
  }
  if (effectiveIncome > 0 && effectiveSavings / effectiveIncome < 0.2) recommendations.push(t("recIncreaseSavings"));
  if (dynCategories.some(cat => cat.budget === 0)) recommendations.push(t("recBudgetAll"));

  const diff = pureExpenses - prevTotal;
  const diffPct = prevTotal > 0 ? (diff / prevTotal) * 100 : 0;

  // Donut chart geometry
  const r = 56, c = 2 * Math.PI * r;
  let acc = 0;

  const handlePrint = () => window.print();

  const buildReportText = () => [
    `${t("monthlyReport")} — ${monthName}`,
    "",
    `${t("totalRevenue")}: ${formatMAD(effectiveIncome, lang)}`,
    `${t("totalExpenses")}: ${formatMAD(pureExpenses, lang)}`,
    `${t("monthlySavings")}: ${formatMAD(Math.max(0, effectiveSavings), lang)}`,
    `${t("balance")}: ${formatMAD(remaining, lang)}`,
    `${t("healthScore")}: ${healthScore}/100 (${healthLabel})`,
    "",
    t("expenseAnalytics") + ":",
    ...catData
      .filter(d => d.value > 0)
      .map(d => `  • ${d.name}: ${formatMAD(d.value, lang)} (${Math.round(d.pct)}%)`),
  ].join("\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildReportText());
    toast.success(t("copiedToClipboard"));
  };

  const handlePdf = async () => {
    console.log("STEP 1 - reportRef", reportRef.current);
    if (!reportRef.current) return;
    setBusy(true);

    // Strip every CSS color function html2canvas v1 cannot parse.
    // Two-level regex: oklch/oklab have no nested parens; color-mix may wrap
    // one level of var(...) or oklch(...) inside its arguments.
    const sanitiseCss = (css: string) =>
      css
        .replace(/oklch\([^)]+\)/g, "transparent")
        .replace(/oklab\([^)]+\)/g, "transparent")
        .replace(/color-mix\([^()]*(?:\([^()]*\)[^()]*)*\)/g, "transparent");

    // In production (built), CSS arrives via <link rel="stylesheet">.
    // Fetch those files now (synchronously before html2canvas) so the
    // sanitised text is ready for the onclone callback.
    const isExternalFont = (href: string) =>
      href.includes("fonts.googleapis.com") || href.includes("fonts.gstatic.com");
    const linkEls = Array.from(
      document.querySelectorAll<HTMLLinkElement>("link[rel='stylesheet']")
    ).filter(l => !isExternalFont(l.href));
    const cleanLinkCss = (
      await Promise.all(
        linkEls.map(l => fetch(l.href).then(r => r.text()).then(sanitiseCss).catch(() => ""))
      )
    ).join("\n");

    // Hex overrides re-applied after sanitisation so design-system colours
    // are restored (sanitisation may have turned some vars to "transparent").
    const hexOverrides = `
      :root {
        --background:#f5fbf9; --foreground:#1c2e2c;
        --card:#ffffff; --card-foreground:#1c2e2c;
        --primary:#14b8a6; --primary-foreground:#f0fefc;
        --secondary:#ecfaf7; --muted:#f0f9f7;
        --muted-foreground:#6b7f7d; --accent:#edfaf7;
        --destructive:#dc2626; --border:#e2eceb; --input:#e2eceb; --ring:#14b8a6;
        --success:#22c55e; --warning:#f59e0b;
        --chart-1:#f97316; --chart-2:#0d9488; --chart-3:#475569;
        --chart-4:#a3e635; --chart-5:#eab308;
        --glass-bg:rgba(255,255,255,0.75); --glass-border:rgba(255,255,255,0.6);
        --shadow-elegant:0 20px 50px -25px rgba(20,184,166,0.55);
        --shadow-card:0 8px 30px -12px rgba(15,118,110,0.18);
      }
      .text-balance-positive { color: #22c55e; }
      *, *::before, *::after {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
    `;

    try {
      console.log("STEP 2 - html2canvas start");
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"), import("jspdf"),
      ]);
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        onclone: (clonedDoc) => {
          // ── Dev mode: Vite injects CSS as <style> elements ──────────────────
          // Sanitise every inline <style> block so html2canvas never sees
          // oklch / oklab / color-mix in the stylesheet text it reads.
          clonedDoc.querySelectorAll("style").forEach(el => {
            if (el.textContent) el.textContent = sanitiseCss(el.textContent);
          });

          // ── Prod mode: CSS is a linked file ─────────────────────────────────
          // Remove the <link> tags and re-inject the pre-fetched sanitised CSS.
          clonedDoc.querySelectorAll<HTMLLinkElement>("link[rel='stylesheet']")
            .forEach(el => { if (!isExternalFont(el.href)) el.remove(); });
          if (cleanLinkCss) {
            const s = clonedDoc.createElement("style");
            s.textContent = cleanLinkCss;
            clonedDoc.head.appendChild(s);
          }

          // ── Hex overrides ────────────────────────────────────────────────────
          const ov = clonedDoc.createElement("style");
          ov.textContent = hexOverrides;
          clonedDoc.head.appendChild(ov);
        },
      });
      console.log("STEP 3 - html2canvas success", canvas.width, "x", canvas.height);
      const img = canvas.toDataURL("image/jpeg", 0.95);
      console.log("STEP 4 - canvas generated, dataURL length:", img.length);
      const pdf = new jsPDF("p", "mm", "a4");
      console.log("STEP 5 - jsPDF created");
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const iw = pw - 20;
      const ih = (canvas.height * iw) / canvas.width;
      const y = 10;
      if (ih <= ph - 20) {
        pdf.addImage(img, "JPEG", 10, y, iw, ih);
      } else {
        let position = 10;
        let heightLeft = ih;
        pdf.addImage(img, "JPEG", 10, position, iw, ih);
        heightLeft -= (ph - 20);
        while (heightLeft > 0) {
          pdf.addPage();
          position = 10 - (ih - heightLeft);
          pdf.addImage(img, "JPEG", 10, position, iw, ih);
          heightLeft -= ph;
        }
      }
      console.log("STEP 6 - save pdf");
      pdf.save(`jibi-rahti-${ym}.pdf`);
    } catch (err) {
      console.error("PDF EXPORT ERROR:", err);
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    const text = buildReportText();
    if (navigator.share) {
      try {
        await navigator.share({ title: `JIBI RAHTI — ${monthName}`, text });
      } catch (err: any) {
        if (err?.name === "AbortError") return; // user dismissed the sheet — not an error
        // navigator.share failed for another reason — fall back to clipboard
        try { await navigator.clipboard.writeText(text); } catch {}
        toast.success(t("copiedToClipboard"));
      }
    } else {
      // Desktop / unsupported browser — copy to clipboard
      await navigator.clipboard.writeText(text);
      toast.success(t("copiedToClipboard"));
    }
  };

  const SummaryCard = ({ icon: Icon, label, value, color, bg }: any) => (
    <div
      className="rounded-2xl p-4 border border-white/40 backdrop-blur shadow-sm"
      style={{ background: bg }}
    >
      <div className={`flex items-center justify-between ${isAr ? "flex-row-reverse" : ""}`}>
        <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white shadow"
          style={{ background: color }}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className={`text-[11px] mt-2 text-muted-foreground ${isAr ? "text-right" : ""}`} style={{ fontFamily: arFont }}>{label}</p>
      <p className={`text-base font-extrabold mt-0.5 ${isAr ? "text-right" : ""}`} style={{ fontFamily: arFont, color: "#0F766E" }}>{value}</p>
    </div>
  );

  return (
    <AppShell>
      <style>{`
        @media print {
          nav, .no-print { display: none !important; }
          body, html { background: white !important; }
          .report-root { box-shadow: none !important; }
        }
      `}</style>

      <header className={`mb-4 flex items-center justify-between ${isAr ? "flex-row-reverse" : ""}`}>
        <div className={isAr ? "text-right" : "text-left"}>
          <h1 className="text-xl font-extrabold" style={{ fontFamily: arFont, color: "#0F766E" }}>
            {t("monthlyReport")}
          </h1>
          <p className="text-xs text-muted-foreground capitalize" style={{ fontFamily: arFont }}>{monthName}</p>
        </div>
        <div className="h-10 w-10 rounded-2xl flex items-center justify-center text-white shadow-md"
          style={{ background: "linear-gradient(135deg,#1FAF8B,#4CD4B0)" }}>
          <BarChart3 className="h-5 w-5" />
        </div>
      </header>

      {/* Action buttons */}
      <div className="grid grid-cols-4 gap-2 mb-4 no-print">
        {[
          { icon: Printer, label: t("printReport"), onClick: handlePrint },
          { icon: Copy, label: t("copyReport"), onClick: handleCopy },
          { icon: Download, label: t("exportPdf"), onClick: handlePdf },
          { icon: Share2, label: t("shareReport"), onClick: handleShare },
        ].map(({ icon: Icon, label, onClick }, i) => (
          <button
            key={i}
            onClick={onClick}
            disabled={busy}
            className="rounded-2xl py-2.5 px-1 bg-white border border-border/50 shadow-sm hover:shadow active:scale-95 transition flex flex-col items-center gap-1 disabled:opacity-50"
          >
            <Icon className="h-4 w-4" style={{ color: "#0F766E" }} />
            <span className="text-[10px] font-semibold text-[#0F766E]" style={{ fontFamily: arFont }}>{label}</span>
          </button>
        ))}
      </div>

      <BudgetWarningBanners categories={dynCategories} spentByCatId={spentByCatId} />

      <div ref={reportRef} className="report-root space-y-4 bg-white rounded-3xl p-4">
        {/* Health Score */}
        <Card className="rounded-3xl border-0 p-5 overflow-hidden relative shadow-[0_10px_30px_-15px_rgba(31,175,139,0.5)]"
          style={{ background: "linear-gradient(135deg,#F4FBF8 0%,#E8F5F0 100%)" }}>
          <div className={`flex items-center gap-4 ${isAr ? "flex-row-reverse" : ""}`}>
            <div className="relative shrink-0">
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r={r} fill="none" stroke="#E5E7EB" strokeWidth="12" />
                <circle
                  cx="70" cy="70" r={r} fill="none"
                  stroke={healthColor} strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={c} strokeDashoffset={c - (c * healthScore) / 100}
                  transform="rotate(-90 70 70)"
                  style={{ transition: "stroke-dashoffset 1s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold" style={{ color: healthColor, fontFamily: arFont }}>{healthScore}</span>
                <span className="text-[10px] text-muted-foreground">/ 100</span>
              </div>
            </div>
            <div className={`flex-1 ${isAr ? "text-right" : "text-left"}`}>
              <div className={`flex items-center gap-1.5 ${isAr ? "flex-row-reverse" : ""}`}>
                <Activity className="h-4 w-4" style={{ color: healthColor }} />
                <p className="text-xs font-semibold" style={{ color: healthColor, fontFamily: arFont }}>{t("healthScore")}</p>
              </div>
              <p className="text-2xl font-extrabold mt-1" style={{ color: "#0F766E", fontFamily: arFont }}>{healthLabel}</p>
              <p className="text-[11px] text-muted-foreground mt-1" style={{ fontFamily: arFont }}>
                {isAr ? "تقييم شامل لوضعك المالي هذا الشهر" : "Évaluation globale de votre situation"}
              </p>
            </div>
          </div>
        </Card>

        {/* Financial summary */}
        <div>
          <h2 className={`text-sm font-bold mb-2 ${isAr ? "text-right" : ""}`} style={{ color: "#0F766E", fontFamily: arFont }}>
            {t("financialSummary")}
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            <SummaryCard icon={TrendingUp} label={t("totalRevenue")} value={formatMAD(effectiveIncome, lang)} color="#1FAF8B" bg="linear-gradient(135deg,#ECFDF5,#D1FAE5)" />
            <SummaryCard icon={TrendingDown} label={t("totalExpenses")} value={formatMAD(pureExpenses, lang)} color="#E53935" bg="linear-gradient(135deg,#FFF5F5,#FFE5E5)" />
            <SummaryCard icon={PiggyBank} label={t("monthlySavings")} value={formatMAD(Math.max(0, effectiveSavings), lang)} color="#0F8B7E" bg="linear-gradient(135deg,#F4FBF8,#E8F5F0)" />
            <SummaryCard icon={Wallet} label={t("balance")} value={formatMAD(remaining, lang)} color="#F59E0B" bg="linear-gradient(135deg,#FFFBEB,#FEF3C7)" />
          </div>
        </div>

        {/* Expense analytics */}
        <Card className="rounded-3xl border-0 p-5 shadow-sm" style={{ background: "linear-gradient(135deg,#FFFFFF,#F4FBF8)" }}>
          <h3 className={`text-sm font-bold mb-3 ${isAr ? "text-right" : ""}`} style={{ color: "#0F766E", fontFamily: arFont }}>
            {t("expenseAnalytics")}
          </h3>
          <div className={`flex items-center gap-4 ${isAr ? "flex-row-reverse" : ""}`}>
            <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
              <circle cx="70" cy="70" r={r} fill="none" stroke="#F1F5F9" strokeWidth="18" />
              {pureExpenses > 0 && catData.map(d => {
                if (d.value <= 0) return null;
                const len = (c * d.pct) / 100;
                const off = c - acc;
                acc += len;
                return (
                  <circle key={d.id} cx="70" cy="70" r={r} fill="none"
                    stroke={d.color} strokeWidth="18"
                    strokeDasharray={`${len} ${c - len}`}
                    strokeDashoffset={off}
                    transform="rotate(-90 70 70)" />
                );
              })}
              <text x="70" y="68" textAnchor="middle" fontSize="11" fill="#64748B" fontFamily={arFont}>{isAr ? "المجموع" : "Total"}</text>
              <text x="70" y="84" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0F766E">
                {Math.round(pureExpenses).toLocaleString()}
              </text>
            </svg>
            <div className="flex-1 space-y-2">
              {catData.map(d => (
                <div key={d.id} className={`${isAr ? "text-right" : ""}`}>
                  <div className={`flex items-center justify-between text-[11px] ${isAr ? "flex-row-reverse" : ""}`}>
                    <span className={`flex items-center gap-1.5 font-medium ${isAr ? "flex-row-reverse" : ""}`} style={{ fontFamily: arFont, color: "#0F766E" }}>
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-bold tabular-nums" style={{ color: "#0F766E" }}>{Math.round(d.pct)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mt-1">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${d.pct}%`, background: d.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Monthly comparison */}
        <Card className="rounded-3xl border-0 p-5 shadow-sm"
          style={{ background: "linear-gradient(135deg,#FFFFFF,#ECFDF5)" }}>
          <h3 className={`text-sm font-bold mb-3 ${isAr ? "text-right" : ""}`} style={{ color: "#0F766E", fontFamily: arFont }}>
            {t("monthlyComparison")}
          </h3>
          {prevTotal === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2" style={{ fontFamily: arFont }}>{t("noPreviousMonth")}</p>
          ) : (
            <>
              <div className={`flex items-center justify-between mb-3 ${isAr ? "flex-row-reverse" : ""}`}>
                <div className={isAr ? "text-right" : ""}>
                  <p className="text-[10px] text-muted-foreground" style={{ fontFamily: arFont }}>{t("vsLastMonth")}</p>
                  <p className="text-lg font-extrabold" style={{ fontFamily: arFont, color: diff <= 0 ? "#10B981" : "#E53935" }}>
                    {diff > 0 ? "+" : ""}{Math.round(diffPct)}%
                  </p>
                </div>
                {diff <= 0 ? <ArrowDownRight className="h-8 w-8 text-emerald-500" /> : <ArrowUpRight className="h-8 w-8 text-red-500" />}
              </div>
              <div className="space-y-2">
                {dynCategories.map((cat, i) => {
                  const cur = spentByCatId[cat.id] ?? 0;
                  const old = prevSpentByCatId[cat.id] ?? 0;
                  const max = Math.max(cur, old, 1);
                  return (
                    <div key={cat.id}>
                      <div className={`flex justify-between text-[11px] mb-1 ${isAr ? "flex-row-reverse" : ""}`}>
                        <span style={{ fontFamily: arFont, color: "#0F766E" }} className="font-medium">{cat.name}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {formatMAD(cur, lang)} / {formatMAD(old, lang)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(cur / max) * 100}%`, background: catColor(i) }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full opacity-50" style={{ width: `${(old / max) * 100}%`, background: "#94A3B8" }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        {/* AI Insights */}
        <Card className="rounded-3xl border-0 p-5 shadow-sm"
          style={{ background: "linear-gradient(135deg,#F0FDF4,#ECFDF5)" }}>
          <div className={`flex items-center gap-2 mb-3 ${isAr ? "flex-row-reverse" : ""}`}>
            <div className="h-8 w-8 rounded-xl flex items-center justify-center text-white shadow"
              style={{ background: "linear-gradient(135deg,#1FAF8B,#4CD4B0)" }}>
              <Sparkles className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold" style={{ color: "#0F766E", fontFamily: arFont }}>{t("aiInsights")}</h3>
          </div>
          {insights.length === 0 ? (
            <p className={`text-xs text-muted-foreground ${isAr ? "text-right" : ""}`} style={{ fontFamily: arFont }}>
              {isAr ? "لا توجد تنبيهات. وضعك المالي مستقر." : "Aucune alerte. Situation stable."}
            </p>
          ) : (
            <ul className="space-y-2">
              {insights.map((m, i) => (
                <li key={i} className={`text-[12px] leading-relaxed bg-white/70 backdrop-blur rounded-xl px-3 py-2 ${isAr ? "text-right" : ""}`}
                  style={{ fontFamily: arFont, color: "#065F46" }}>
                  {m}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Card className="rounded-3xl border-0 p-5 shadow-sm"
            style={{ background: "linear-gradient(135deg,#FFFBEB,#FEF3C7)" }}>
            <div className={`flex items-center gap-2 mb-3 ${isAr ? "flex-row-reverse" : ""}`}>
              <div className="h-8 w-8 rounded-xl flex items-center justify-center text-white shadow"
                style={{ background: "linear-gradient(135deg,#F59E0B,#FBBF24)" }}>
                <Lightbulb className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold" style={{ color: "#92400E", fontFamily: arFont }}>{t("smartRecommendations")}</h3>
            </div>
            <ul className="space-y-2">
              {recommendations.map((m, i) => (
                <li key={i} className={`text-[12px] leading-relaxed bg-white/70 backdrop-blur rounded-xl px-3 py-2 ${isAr ? "text-right" : ""}`}
                  style={{ fontFamily: arFont, color: "#78350F" }}>
                  {m}
                </li>
              ))}
            </ul>
          </Card>
        )}

        <p className="text-center text-[10px] text-muted-foreground pt-2" style={{ fontFamily: arFont }}>
          {isAr ? "جيبي راحتي" : "JIBI RAHTI"} · {monthName}
        </p>
      </div>
    </AppShell>
  );
}
