import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "./supabase";
import { useAuth } from "./auth";
import { tr, getLang, applyLangToDOM, type Lang } from "@/i18n/translations";
import { type AccountStatus } from "@/i18n/format-time";

export type Category = "food" | "transport" | "bills" | "other";
export const CATEGORIES: Category[] = ["food", "transport", "bills", "other"];

export type Expense = {
  id: string;
  amount: number;
  category: string; // display name; legacy enum for old expenses
  category_id?: string; // FK → categories.id
  date: string; // ISO date
  note?: string;
};

export type AdditionalIncome = {
  id: string;
  amount: number;
  note?: string;
  incomeDate: string; // "YYYY-MM-DD"
};

export type Budgets = Record<Category, number>;

export type { Lang };
export type { AccountStatus };

export type SavingsGoal = {
  name: string;
  target: number;
  targetDate?: string; // ISO
  monthlyPct: number; // 0-100
  image?: string; // data URL
};

type State = {
  lang: Lang;
  accountStatus: AccountStatus;
  trialExpiresAt: string | null;
  subscriptionExpiresAt: string | null;
  income: number;
  expenses: Expense[];
  budgets: Budgets;
  savings: number;
  incomeDay?: number;
  lastResetMonth?: string; // "YYYY-MM"
  savingsGoal?: SavingsGoal;
  additionalIncomes: AdditionalIncome[];
};

const DEFAULT: State = {
  lang: "fr",
  accountStatus: "trial",
  trialExpiresAt: null,
  subscriptionExpiresAt: null,
  income: 0,
  expenses: [],
  budgets: { food: 0, transport: 0, bills: 0, other: 0 },
  savings: 0,
  incomeDay: undefined,
  lastResetMonth: undefined,
  savingsGoal: undefined,
  additionalIncomes: [],
};

type Ctx = State & {
  setLang: (l: Lang) => void;
  setIncome: (n: number) => void;
  setBudget: (c: Category, n: number) => void;
  setSavings: (n: number) => void;
  setIncomeDay: (d: number) => void;
  setSavingsGoal: (g: SavingsGoal) => void;
  addExpense: (e: Omit<Expense, "id">) => void;
  removeExpense: (id: string) => void;
  additionalIncomeThisMonth: number;
  effectiveIncome: number;
  addAdditionalIncome: (e: Omit<AdditionalIncome, "id">) => void;
  updateAdditionalIncome: (e: AdditionalIncome) => void;
  removeAdditionalIncome: (id: string) => void;
  totalExpenses: number;
  balance: number;
  effectiveSavings: number;
  savingsUsed: boolean;
  savingsDepleted: boolean;
  balanceStatus: "positive" | "zero" | "negative";
  t: (k: string) => string;
  dir: "ltr" | "rtl";
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const BudgetCtx = createContext<Ctx | null>(null);

async function loadUserData(userId: string, userEmail?: string | null): Promise<State> {
  const [profileRes, expensesRes, budgetsRes, goalsRes, additionalIncomeRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("expenses").select("*").eq("user_id", userId),
    supabase.from("budgets").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("savings_goals").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("additional_income").select("*").eq("user_id", userId).order("income_date", { ascending: false }),
  ]);

  if (profileRes.error) console.error("[jibi] profiles load:", profileRes.error.message);
  if (expensesRes.error) console.error("[jibi] expenses load:", expensesRes.error.message);
  if (budgetsRes.error) console.error("[jibi] budgets load:", budgetsRes.error.message);
  if (goalsRes.error) console.error("[jibi] savings_goals load:", goalsRes.error.message);

  let profile = profileRes.data;
  const budgets = budgetsRes.data;
  const goal = goalsRes.data;
  const expenseRows = expensesRes.data ?? [];

  // No profile row — create one (handles users who signed up before the trigger was added)
  if (!profile) {
    const now = new Date();
    const trialExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    await supabase.from("profiles").upsert(
      {
        id: userId,
        account_status: "trial",
        trial_started_at: now.toISOString(),
        trial_expires_at: trialExpiry.toISOString(),
      },
      { onConflict: "id", ignoreDuplicates: true }
    );
    const { data: created } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    profile = created;
  }

  // Fix 4: auto-repair when trigger failed to set trial dates on INSERT
  let trialExpiresAt: string | null = profile?.trial_expires_at ?? null;
  if (profile && profile.account_status === "trial" && !trialExpiresAt) {
    const repairedExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    supabase
      .from("profiles")
      .update({ trial_started_at: new Date().toISOString(), trial_expires_at: repairedExpiry })
      .eq("id", userId)
      .then(({ error }) => {
        if (error) console.error("[jibi] trial repair:", error.message);
      });
    trialExpiresAt = repairedExpiry;
  }

  // Revocation check — strips active status if the redeemed code has been revoked
  if (profile?.account_status === "active" && userEmail !== "rayan.contact09@gmail.com") {
    const { data: isRevoked } = await supabase.rpc("check_code_revocation", { p_user_id: userId });
    if (isRevoked === true) {
      const expiredAt = new Date(Date.now() - 1000).toISOString();
      await supabase
        .from("profiles")
        .update({ account_status: "expired", subscription_expires_at: expiredAt })
        .eq("id", userId);
      profile = { ...profile, account_status: "expired", subscription_expires_at: expiredAt };
    }
  }

  return {
    lang: (profile?.lang ?? getLang()) as Lang,
    accountStatus: ((profile?.account_status ?? "trial") as AccountStatus),
    trialExpiresAt,
    subscriptionExpiresAt: profile?.subscription_expires_at ?? null,
    income: Number(profile?.income ?? 0),
    savings: Number(profile?.savings ?? 0),
    incomeDay: profile?.income_day ?? undefined,
    lastResetMonth: profile?.last_reset_month ?? undefined,
    budgets: {
      food: Number(budgets?.food ?? 0),
      transport: Number(budgets?.transport ?? 0),
      bills: Number(budgets?.bills ?? 0),
      other: Number(budgets?.other ?? 0),
    },
    expenses: expenseRows.map((e: any) => ({
      id: e.id,
      amount: Number(e.amount),
      category: e.category as string,
      category_id: e.category_id ?? undefined,
      date: e.date,
      note: e.note ?? undefined,
    })),
    savingsGoal: goal
      ? {
          name: goal.name,
          target: Number(goal.target),
          targetDate: goal.target_date ?? undefined,
          monthlyPct: Number(goal.monthly_pct),
          image: goal.image ?? undefined,
        }
      : undefined,
    additionalIncomes: (additionalIncomeRes.data ?? []).map((r: any) => ({
      id: r.id,
      amount: Number(r.amount),
      note: r.note ?? undefined,
      incomeDate: r.income_date,
    })),
  };
}

export function BudgetProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState<State>(() => ({ ...DEFAULT, lang: getLang() }));
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_status, trial_expires_at, subscription_expires_at")
      .eq("id", userId)
      .maybeSingle();
    if (profile) {
      let accountStatus = (profile.account_status ?? "trial") as AccountStatus;
      let subscriptionExpiresAt = profile.subscription_expires_at ?? null;
      if (accountStatus === "active" && user?.email !== "rayan.contact09@gmail.com") {
        const { data: isRevoked } = await supabase.rpc("check_code_revocation", { p_user_id: userId });
        if (isRevoked === true) {
          const expiredAt = new Date(Date.now() - 1000).toISOString();
          await supabase
            .from("profiles")
            .update({ account_status: "expired", subscription_expires_at: expiredAt })
            .eq("id", userId);
          accountStatus = "expired";
          subscriptionExpiresAt = expiredAt;
        }
      }
      setState((s) => ({
        ...s,
        accountStatus,
        trialExpiresAt: profile.trial_expires_at ?? null,
        subscriptionExpiresAt,
      }));
    }
  }, [userId, user?.email]);

  // Load data when user changes
  useEffect(() => {
    if (!userId) {
      initialized.current = false;
      setState({ ...DEFAULT, lang: getLang() });
      setLoading(false);
      return;
    }
    initialized.current = false;
    setLoading(true);
    loadUserData(userId, user?.email)
      .then((data) => {
        // Mark ready BEFORE setState so the save effects that fire after
        // re-render see initialized=true and can persist user changes.
        // The initial load causes one extra harmless upsert of the same data.
        initialized.current = true;
        setState(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[jibi] loadUserData failed:", err);
        initialized.current = true;
        setLoading(false);
      });
  }, [userId]);

  // Periodically re-check revocation for active sessions (every 5 minutes)
  useEffect(() => {
    if (!userId) return;
    const timer = setInterval(() => refreshProfile(), 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [userId, refreshProfile]);

  // Sync lang/dir to document and persist to localStorage
  useEffect(() => {
    applyLangToDOM(state.lang);
  }, [state.lang]);

  // Debounced save — profile
  useEffect(() => {
    if (!userId || !initialized.current) return;
    const snap = {
      id: userId,
      email: user?.email ?? null,
      lang: state.lang,
      income: state.income,
      savings: state.savings,
      income_day: state.incomeDay ?? null,
      last_reset_month: state.lastResetMonth ?? null,
    };
    const timer = setTimeout(async () => {
      const { error } = await supabase.from("profiles").upsert(snap);
      if (error) console.error("[jibi] profiles upsert:", error.message, error);
    }, 800);
    return () => clearTimeout(timer);
  }, [userId, state.lang, state.income, state.savings, state.incomeDay, state.lastResetMonth]);

  // Debounced save — budgets
  useEffect(() => {
    if (!userId || !initialized.current) return;
    const snap = {
      user_id: userId,
      food: state.budgets.food,
      transport: state.budgets.transport,
      bills: state.budgets.bills,
      other: state.budgets.other,
    };
    const timer = setTimeout(async () => {
      const { error } = await supabase.from("budgets").upsert(snap);
      if (error) console.error("[jibi] budgets upsert:", error.message, error);
    }, 800);
    return () => clearTimeout(timer);
  }, [userId, state.budgets]);

  // Debounced save — savings goal
  useEffect(() => {
    if (!userId || !initialized.current || !state.savingsGoal) return;
    const snap = {
      user_id: userId,
      name: state.savingsGoal.name,
      target: state.savingsGoal.target,
      target_date: state.savingsGoal.targetDate ?? null,
      monthly_pct: state.savingsGoal.monthlyPct,
      image: state.savingsGoal.image ?? null,
    };
    const timer = setTimeout(async () => {
      const { error } = await supabase.from("savings_goals").upsert(snap);
      if (error) console.error("[jibi] savings_goals upsert:", error.message, error);
    }, 800);
    return () => clearTimeout(timer);
  }, [userId, state.savingsGoal]);

  // Monthly auto-reset on the configured income day
  useEffect(() => {
    if (loading) return;
    const { incomeDay, income, lastResetMonth } = state;
    if (!incomeDay || !income) return;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const effectiveDay = Math.min(incomeDay, lastDay);
    const ym = `${year}-${String(month + 1).padStart(2, "0")}`;
    if (now.getDate() >= effectiveDay && lastResetMonth !== ym) {
      const increase = income * 0.05;
      setState((s) => ({
        ...s,
        expenses: s.expenses.filter((e) => !e.date.startsWith(ym)),
        savings: (s.savings || 0) + increase,
        lastResetMonth: ym,
      }));
      if (userId) {
        supabase
          .from("expenses")
          .delete()
          .eq("user_id", userId)
          .gte("date", `${ym}-01`)
          .lte("date", `${ym}-31`);
      }
      toast.success(tr(state.lang, "monthlyResetDone"));
    }
  }, [loading, state.incomeDay, state.income, state.lastResetMonth, state.lang, userId]);

  const value = useMemo<Ctx>(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthExp = state.expenses.filter((e) => e.date.startsWith(ym));
    const totalExpenses = monthExp.reduce((s, e) => s + e.amount, 0);

    const savings = state.savings || 0;
    const totalWithSavings = totalExpenses + savings;
    const additionalIncomeThisMonth = state.additionalIncomes
      .filter((e) => e.incomeDate.startsWith(ym))
      .reduce((s, e) => s + e.amount, 0);
    const effectiveIncome = state.income + additionalIncomeThisMonth;
    const balance = effectiveIncome - totalWithSavings;
    const overflow = balance < 0 ? -balance : 0;
    const effectiveSavings = savings - overflow;
    const savingsUsed = overflow > 0 && savings > 0;
    const savingsDepleted = effectiveSavings < 0;
    const balanceStatus: "positive" | "zero" | "negative" =
      balance > 0 ? "positive" : balance === 0 ? "zero" : "negative";

    return {
      ...state,
      loading,
      setLang: (lang) => setState((s) => ({ ...s, lang })),
      setIncome: (income) => setState((s) => ({ ...s, income })),
      setBudget: (c, n) => setState((s) => ({ ...s, budgets: { ...s.budgets, [c]: n } })),
      setSavings: (savings) => setState((s) => ({ ...s, savings })),
      setIncomeDay: (incomeDay) => setState((s) => ({ ...s, incomeDay })),
      setSavingsGoal: (savingsGoal) => setState((s) => ({ ...s, savingsGoal })),
      addExpense: (e) => {
        const id = crypto.randomUUID();
        const newExp = { ...e, id };
        setState((s) => ({ ...s, expenses: [newExp, ...s.expenses] }));
        if (userId) {
          supabase
            .from("expenses")
            .insert({
              id,
              user_id: userId,
              amount: e.amount,
              category: e.category,
              category_id: e.category_id ?? null,
              date: e.date,
              note: e.note ?? null,
            })
            .then(({ error }) => {
              if (error) console.error("addExpense:", error.message);
            });
        }
      },
      removeExpense: (id) => {
        setState((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }));
        if (userId) {
          supabase
            .from("expenses")
            .delete()
            .eq("id", id)
            .then(({ error }) => {
              if (error) console.error("removeExpense:", error.message);
            });
        }
      },
      additionalIncomeThisMonth,
      effectiveIncome,
      addAdditionalIncome: (e) => {
        const id = crypto.randomUUID();
        setState((s) => ({ ...s, additionalIncomes: [{ ...e, id }, ...s.additionalIncomes] }));
        if (userId) {
          supabase.from("additional_income").insert({
            id, user_id: userId,
            amount: e.amount,
            note: e.note ?? null,
            income_date: e.incomeDate,
          }).then(({ error }) => {
            if (error) console.error("addAdditionalIncome:", error.message);
          });
        }
      },
      updateAdditionalIncome: (entry) => {
        setState((s) => ({
          ...s,
          additionalIncomes: s.additionalIncomes.map((e) => e.id === entry.id ? entry : e),
        }));
        if (userId) {
          supabase.from("additional_income").update({
            amount: entry.amount,
            note: entry.note ?? null,
            income_date: entry.incomeDate,
          }).eq("id", entry.id).then(({ error }) => {
            if (error) console.error("updateAdditionalIncome:", error.message);
          });
        }
      },
      removeAdditionalIncome: (id) => {
        setState((s) => ({ ...s, additionalIncomes: s.additionalIncomes.filter((e) => e.id !== id) }));
        if (userId) {
          supabase.from("additional_income").delete().eq("id", id)
            .then(({ error }) => {
              if (error) console.error("removeAdditionalIncome:", error.message);
            });
        }
      },
      totalExpenses: totalWithSavings,
      balance,
      effectiveSavings,
      savingsUsed,
      savingsDepleted,
      balanceStatus,
      t: (k) => tr(state.lang, k),
      dir: state.lang === "ar" ? "rtl" : "ltr",
      refreshProfile,
    };
  }, [state, loading, userId, refreshProfile]);

  return <BudgetCtx.Provider value={value}>{children}</BudgetCtx.Provider>;
}

export function useBudget() {
  const ctx = useContext(BudgetCtx);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
}

export function formatMAD(n: number, lang: Lang) {
  const s = n.toLocaleString(lang === "ar" ? "ar-MA" : "fr-MA", {
    maximumFractionDigits: 2,
  });
  return `${s} ${tr(lang, "currency")}`;
}
