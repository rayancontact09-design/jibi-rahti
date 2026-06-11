import { useMemo, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useBudget, formatMAD } from "@/lib/budget-store";

const STORAGE_KEY = "jibi-budget-warn-dismissed";

type DynCategory = { id: string; name: string; budget: number };

type Props = {
  categories: DynCategory[];
  spentByCatId: Record<string, number>;
};

type WarningLevel = "warn" | "full" | "over";

type Warning = {
  key: string;
  cat: DynCategory;
  pct: number;
  over: number;
  level: WarningLevel;
};

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveDismissed(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {}
}

export function BudgetWarningBanners({ categories, spentByCatId }: Props) {
  const { t, lang } = useBudget();
  const [dismissed, setDismissed] = useState<Set<string>>(loadDismissed);

  const warnings = useMemo<Warning[]>(() => {
    const result: Warning[] = [];
    for (const cat of categories) {
      if (cat.budget <= 0) continue;
      const spent = spentByCatId[cat.id] ?? 0;
      const pct = (spent / cat.budget) * 100;
      if (pct < 80) continue;
      const key = `${cat.id}-${cat.budget}-${Math.round(spent)}`;
      if (dismissed.has(key)) continue;
      if (pct > 100) {
        result.push({ key, cat, pct, over: spent - cat.budget, level: "over" });
      } else if (Math.round(pct) >= 100) {
        result.push({ key, cat, pct, over: 0, level: "full" });
      } else {
        result.push({ key, cat, pct, over: 0, level: "warn" });
      }
    }
    return result;
  }, [categories, spentByCatId, dismissed]);

  const dismiss = (key: string) => {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(key);
      saveDismissed(next);
      return next;
    });
  };

  if (warnings.length === 0) return null;

  return (
    <div className="space-y-2 mb-4" style={{ direction: lang === "ar" ? "rtl" : "ltr" }}>
      {warnings.map(w => {
        let bg: string;
        let message: string;

        if (w.level === "over") {
          bg = "#dc2626";
          message = t("budgetWarnOver")
            .replace("{category}", w.cat.name)
            .replace("{amount}", formatMAD(w.over, lang));
        } else if (w.level === "full") {
          bg = "#f97316";
          message = t("budgetWarnFull").replace("{category}", w.cat.name);
        } else {
          bg = "#f59e0b";
          message = t("budgetWarn80")
            .replace("{pct}", String(Math.round(w.pct)))
            .replace("{category}", w.cat.name);
        }

        return (
          <div
            key={w.key}
            className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-white text-sm font-medium shadow-sm"
            style={{ background: bg }}
          >
            <div className="flex items-center gap-2 flex-1">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{message}</span>
            </div>
            <button
              type="button"
              onClick={() => dismiss(w.key)}
              className="shrink-0 hover:opacity-70 transition-opacity"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
