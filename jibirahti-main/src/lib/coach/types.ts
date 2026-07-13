import type { LucideIcon } from "lucide-react";

/**
 * Rule-based, offline financial coach. No external AI/API calls — every
 * piece of advice is derived purely from data already available in the app
 * (budgets, expenses, income, savings). Adding a new tip is just adding a
 * new `CoachRule` to `rules.ts`; nothing else needs to change.
 */

export type CoachPriority = "critical" | "warning" | "positive";

export interface CoachAdvice {
  /** Unique within a single generation run (used as the React list key). */
  id: string;
  priority: CoachPriority;
  icon: LucideIcon;
  /** i18n key for the card title. */
  titleKey: string;
  /** i18n key for the explanation, may contain {token} placeholders. */
  descriptionKey: string;
  /** i18n key for the recommended action, may contain {token} placeholders. */
  actionKey: string;
  /** Values substituted into descriptionKey/actionKey's {token} placeholders. */
  params?: Record<string, string>;
}

export interface CoachCategory {
  id: string;
  name: string;
  budget: number;
  spent: number;
}

/** Plain, UI-agnostic snapshot of the user's financial state this month. */
export interface CoachContext {
  categories: CoachCategory[];
  effectiveIncome: number;
  balance: number;
  totalExpenses: number;
  /** Total expenses for the previous calendar month, for trend detection. */
  prevMonthExpenses: number;
  effectiveSavings: number;
  savingsUsed: boolean;
  savingsDepleted: boolean;
  hasSavingsGoal: boolean;
}

/** A rule inspects the context and optionally returns one or more tips. */
export type CoachRule = (ctx: CoachContext) => CoachAdvice | CoachAdvice[] | null;
