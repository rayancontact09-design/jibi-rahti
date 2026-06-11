import { useMemo, useRef, useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useBudget, formatMAD } from "@/lib/budget-store";
import { Target, Calendar, Sparkles, Upload, TrendingUp, Clock } from "lucide-react";

export function SavingsGoalModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t, lang, income, savings, savingsGoal, setSavingsGoal, setSavings } = useBudget();
  const arFont = lang === "ar" ? "'Cairo', sans-serif" : "'Poppins', sans-serif";
  const rtl = lang === "ar";

  const [name, setName] = useState(savingsGoal?.name ?? "");
  const [target, setTarget] = useState<number>(savingsGoal?.target ?? 0);
  const [date, setDate] = useState(savingsGoal?.targetDate ?? "");
  const [pct, setPct] = useState<number>(
    savingsGoal?.monthlyPct ?? (income > 0 ? Math.min(50, Math.round((savings / income) * 100)) : 10),
  );
  const [image, setImage] = useState<string | undefined>(savingsGoal?.image);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(savingsGoal?.name ?? "");
      setTarget(savingsGoal?.target ?? 0);
      setDate(savingsGoal?.targetDate ?? "");
      setPct(savingsGoal?.monthlyPct ?? (income > 0 ? Math.min(50, Math.round((savings / income) * 100)) : 10));
      setImage(savingsGoal?.image);
    }
  }, [open]);

  const monthlyAmount = useMemo(() => Math.round((income * pct) / 100), [income, pct]);
  const remaining = Math.max(0, target - savings);
  const monthsNeeded = monthlyAmount > 0 ? Math.ceil(remaining / monthlyAmount) : 0;
  const progressPct = target > 0 ? Math.min(100, Math.round((savings / target) * 100)) : 0;

  const advice = useMemo(() => {
    if (!target || !income) return t("aiAdvice");
    if (pct < 5) return t("aiAdviceSlow");
    if (pct > 30) return t("aiAdviceFast");
    return t("aiAdviceText")
      .replace("{pct}", String(pct))
      .replace("{months}", String(monthsNeeded || "—"));
  }, [pct, monthsNeeded, target, income, t]);

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleSave = () => {
    setSavingsGoal({ name, target, targetDate: date || undefined, monthlyPct: pct, image });
    if (monthlyAmount > 0) setSavings(monthlyAmount);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={rtl ? "rtl" : "ltr"}
        className="max-w-md p-0 border-0 rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(15,139,126,0.55)] bg-white text-[#1c2e2c] max-h-[92vh] overflow-y-auto"
        style={{ fontFamily: arFont }}
      >
        {/* Hero header */}
        <div
          className="relative px-6 pt-7 pb-10"
          style={{ background: "linear-gradient(135deg,#0F8B7E 0%,#1FAF8B 50%,#4CD4B0 100%)" }}
        >
          <div
            className="absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-30"
            style={{ background: "radial-gradient(circle,#fff 0%,transparent 70%)" }}
          />
          <div
            className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle,#fff 0%,transparent 70%)" }}
          />
          <div className="relative flex flex-col items-center text-center">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative h-24 w-24 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl active:scale-95 transition overflow-hidden"
            >
              {image ? (
                <img src={image} alt="goal" className="h-full w-full object-cover" />
              ) : (
                <Target className="h-12 w-12 text-white" strokeWidth={1.6} />
              )}
              <span className="absolute bottom-1 right-1 h-7 w-7 rounded-full bg-white text-[#0F8B7E] flex items-center justify-center shadow-md">
                <Upload className="h-3.5 w-3.5" />
              </span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
            <h2 className="mt-4 text-xl font-bold text-white">{t("savingsGoalTitle")}</h2>
            <p className="text-xs text-white/85 mt-1">{t("editSavingsGoal")}</p>
          </div>
        </div>

        <div className="px-5 pt-5 pb-6 space-y-4 -mt-4 bg-white text-[#1c2e2c] rounded-t-3xl relative min-w-0 overflow-hidden">
          {/* Goal name */}
          <div>
            <label className="text-xs font-semibold text-[#0F766E] mb-1.5 block">{t("goalName")}</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("goalNamePh")}
              className="rounded-2xl h-11 border-[#D1FAE5] bg-[#F4FBF8] text-[#1c2e2c] placeholder:text-[#6b7f7d] focus-visible:ring-[#1FAF8B]"
              style={{ textAlign: rtl ? "right" : "left", fontFamily: arFont }}
            />
          </div>

          {/* Target amount */}
          <div>
            <label className="text-xs font-semibold text-[#0F766E] mb-1.5 block">{t("targetAmount")}</label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                value={target || ""}
                onChange={(e) => setTarget(parseFloat(e.target.value) || 0)}
                className="rounded-2xl h-11 border-[#D1FAE5] bg-[#F4FBF8] text-[#1c2e2c] placeholder:text-[#6b7f7d] focus-visible:ring-[#1FAF8B] pr-14 min-w-0"
                style={{ textAlign: rtl ? "right" : "left" }}
              />
              <span className={`absolute top-1/2 -translate-y-1/2 text-xs font-bold text-[#0F8B7E] ${rtl ? "left-3" : "right-3"}`}>
                {t("currency")}
              </span>
            </div>
          </div>

          {/* Target date */}
          <div>
            <label className="text-xs font-semibold text-[#0F766E] mb-1.5 block flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {t("targetDate")}
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-2xl h-11 border-[#D1FAE5] bg-[#F4FBF8] text-[#1c2e2c] placeholder:text-[#6b7f7d] focus-visible:ring-[#1FAF8B]"
            />
          </div>

          {/* Monthly % slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#0F766E]">{t("monthlyPercent")}</label>
              <span className="text-sm font-bold text-[#0F8B7E]">{pct}%</span>
            </div>
            <Slider
              value={[pct]}
              onValueChange={(v) => setPct(v[0])}
              min={0}
              max={100}
              step={1}
              className="[&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:border-[#0F8B7E] [&_[role=slider]]:bg-white [&>span:first-child]:bg-[#D1FAE5] [&>span:first-child>span]:bg-gradient-to-r [&>span:first-child>span]:from-[#0F8B7E] [&>span:first-child>span]:to-[#4CD4B0]"
            />
            <p className="text-[11px] text-muted-foreground mt-2">
              ≈ {formatMAD(monthlyAmount, lang)} / {lang === "ar" ? "شهرياً" : "mois"}
            </p>
          </div>

          {/* AI advice */}
          <div
            className="rounded-2xl p-4 border border-[#D1FAE5]"
            style={{ background: "linear-gradient(135deg,#F4FBF8,#ECFDF5)" }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-7 w-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1FAF8B,#4CD4B0)" }}>
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <p className="text-xs font-bold text-[#0F766E]">{t("aiAdvice")}</p>
            </div>
            <p className="text-[12px] leading-relaxed text-[#065F46]">{advice}</p>
          </div>

          {/* Progress preview */}
          <div className="rounded-2xl p-4 bg-[#F4FBF8] border border-[#D1FAE5]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[#0F766E]">{t("progressPreview")}</p>
              <span className="text-sm font-bold text-[#0F8B7E]">{progressPct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-white overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%`, background: "linear-gradient(90deg,#0F8B7E,#4CD4B0)" }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="rounded-xl bg-white p-2.5">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  {t("remainingAmount")}
                </div>
                <p className="text-sm font-bold text-[#0F766E] mt-0.5">{formatMAD(remaining, lang)}</p>
              </div>
              <div className="rounded-xl bg-white p-2.5">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {t("estimatedTime")}
                </div>
                <p className="text-sm font-bold text-[#0F766E] mt-0.5">
                  {monthsNeeded > 0 ? `${monthsNeeded} ${t("months")}` : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-2xl h-12 border-[#D1FAE5] text-[#0F766E]"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="flex-1 rounded-2xl h-12 text-white font-bold border-0 shadow-[0_8px_24px_-6px_rgba(15,139,126,0.6)] hover:shadow-[0_10px_30px_-6px_rgba(15,139,126,0.8)] transition-all"
              style={{ background: "linear-gradient(135deg,#0F8B7E,#1FAF8B,#4CD4B0)" }}
            >
              {t("saveGoal")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}