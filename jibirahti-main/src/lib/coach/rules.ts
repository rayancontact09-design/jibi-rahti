import { AlertTriangle, AlertCircle, ThumbsUp, PiggyBank, TrendingUp, TrendingDown } from "lucide-react";
import type { CoachAdvice, CoachRule } from "./types";

const pctOf = (spent: number, budget: number) => (budget > 0 ? (spent / budget) * 100 : 0);

/** Any category that has exceeded its budget (>100%) → one critical alert per category. */
export const categoryOverBudgetRule: CoachRule = (ctx) => {
  const advice: CoachAdvice[] = [];
  for (const cat of ctx.categories) {
    if (cat.budget <= 0) continue;
    const pct = pctOf(cat.spent, cat.budget);
    if (pct > 100) {
      advice.push({
        id: `category-critical-${cat.id}`,
        priority: "critical",
        icon: AlertTriangle,
        titleKey: "coachCategoryCriticalTitle",
        descriptionKey: "coachCategoryCriticalDesc",
        actionKey: "coachCategoryCriticalAction",
        params: { cat: cat.name, pct: String(Math.round(pct)) },
      });
    }
  }
  return advice.length > 0 ? advice : null;
};

/** Category between 90% and 100% of its budget → warning, one per category. */
export const categoryNearLimitRule: CoachRule = (ctx) => {
  const advice: CoachAdvice[] = [];
  for (const cat of ctx.categories) {
    if (cat.budget <= 0) continue;
    const pct = pctOf(cat.spent, cat.budget);
    if (pct >= 90 && pct <= 100) {
      advice.push({
        id: `category-warning-${cat.id}`,
        priority: "warning",
        icon: AlertTriangle,
        titleKey: "coachCategoryWarningTitle",
        descriptionKey: "coachCategoryWarningDesc",
        actionKey: "coachCategoryWarningAction",
        params: { cat: cat.name, pct: String(Math.round(pct)) },
      });
    }
  }
  return advice.length > 0 ? advice : null;
};

/** Category comfortably under budget (<30% used, with actual spending) → encouragement. */
export const categoryEncouragementRule: CoachRule = (ctx) => {
  const advice: CoachAdvice[] = [];
  for (const cat of ctx.categories) {
    if (cat.budget <= 0 || cat.spent <= 0) continue;
    const pct = pctOf(cat.spent, cat.budget);
    if (pct < 30) {
      advice.push({
        id: `category-good-${cat.id}`,
        priority: "positive",
        icon: ThumbsUp,
        titleKey: "coachCategoryGoodTitle",
        descriptionKey: "coachCategoryGoodDesc",
        actionKey: "coachCategoryGoodAction",
        params: { cat: cat.name, pct: String(Math.round(pct)) },
      });
    }
  }
  return advice.length > 0 ? advice : null;
};

/** Savings goal is on track this month (nothing eating into it). */
export const savingsOnTrackRule: CoachRule = (ctx) => {
  if (!ctx.hasSavingsGoal) return null;
  if (ctx.savingsUsed || ctx.savingsDepleted || ctx.effectiveSavings <= 0) return null;
  return {
    id: "savings-on-track",
    priority: "positive",
    icon: PiggyBank,
    titleKey: "coachSavingsGoodTitle",
    descriptionKey: "coachSavingsGoodDesc",
    actionKey: "coachSavingsGoodAction",
  };
};

/** Overspending is eating into (or has wiped out) the planned savings. */
export const savingsCompromisedRule: CoachRule = (ctx) => {
  if (!ctx.savingsUsed && !ctx.savingsDepleted) return null;
  return {
    id: "savings-compromised",
    priority: ctx.savingsDepleted ? "critical" : "warning",
    icon: AlertCircle,
    titleKey: "coachSavingsBadTitle",
    descriptionKey: "coachSavingsBadDesc",
    actionKey: "coachSavingsBadAction",
  };
};

/** Healthy remaining income margin (≥30% of income still unspent) this month. */
export const incomeComfortableRule: CoachRule = (ctx) => {
  if (ctx.effectiveIncome <= 0 || ctx.balance <= 0) return null;
  const pct = (ctx.balance / ctx.effectiveIncome) * 100;
  if (pct < 30) return null;
  return {
    id: "income-comfortable",
    priority: "positive",
    icon: TrendingUp,
    titleKey: "coachIncomeGoodTitle",
    descriptionKey: "coachIncomeGoodDesc",
    actionKey: "coachIncomeGoodAction",
    params: { pct: String(Math.round(pct)) },
  };
};

/** Expenses rising fast (≥20%) compared to last month. */
export const expensesRisingRule: CoachRule = (ctx) => {
  if (ctx.prevMonthExpenses <= 0) return null;
  const pct = ((ctx.totalExpenses - ctx.prevMonthExpenses) / ctx.prevMonthExpenses) * 100;
  if (pct < 20) return null;
  return {
    id: "expenses-rising",
    priority: "warning",
    icon: TrendingDown,
    titleKey: "coachExpensesRisingTitle",
    descriptionKey: "coachExpensesRisingDesc",
    actionKey: "coachExpensesRisingAction",
    params: { pct: String(Math.round(pct)) },
  };
};

/**
 * Ordered list of rules the engine evaluates every time advice is
 * generated. To add a new tip: write a new `CoachRule` (above, or in its
 * own file) and push it into this array — no other file needs to change.
 */
export const COACH_RULES: CoachRule[] = [
  categoryOverBudgetRule,
  savingsCompromisedRule,
  categoryNearLimitRule,
  expensesRisingRule,
  categoryEncouragementRule,
  savingsOnTrackRule,
  incomeComfortableRule,
];
