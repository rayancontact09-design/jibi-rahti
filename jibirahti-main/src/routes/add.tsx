import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useBudget, formatMAD } from "@/lib/budget-store";
import { useAuth } from "@/lib/auth";
import { useTutorial } from "@/lib/tutorial";
import { supabase } from "@/lib/supabase";
import { AppShell } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trackExpenseAdded } from "@/lib/analytics";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export const Route = createFileRoute("/add")({
  component: AddPage,
});

type DynCategory = { id: string; name: string; budget: number };

function AddPage() {
  const { t, lang, currency, addExpense, expenses, balance } = useBudget();
  const { user } = useAuth();
  const { reportAction } = useTutorial();
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [categories, setCategories] = useState<DynCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("categories")
      .select("id, name, budget")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setCategories(data as DynCategory[]);
          setCategoryId(data[0].id);
        }
        setLoadingCats(false);
      });
  }, [user?.id]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!n || n <= 0) return;
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    addExpense({
      amount: n,
      category: cat.name,
      category_id: cat.id,
      date,
      note: note.trim() || undefined,
    });
    trackExpenseAdded();
    reportAction("expense-added");
    showExpenseToast(cat, n);
    navigate({ to: "/dashboard" });
  };

  // Enriched feedback after a successful save: category share of its
  // budget, what's left in that category, and the new global balance —
  // followed by dedicated alerts for "near limit", "over budget", and
  // "eating into planned savings", each only when it actually applies.
  // Every division is guarded: a category with no budget never renders a
  // percentage (0% or Infinity%) — it shows an explicit "no budget" note.
  const showExpenseToast = (cat: DynCategory, amount: number) => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const spentBefore = expenses
      .filter((x) => x.category_id === cat.id && x.date.startsWith(ym))
      .reduce((s, x) => s + x.amount, 0);
    const spentAfter = spentBefore + amount;
    const newBalance = balance - amount;
    const hasBudget = cat.budget > 0;
    const pct = hasBudget ? (spentAfter / cat.budget) * 100 : 0;

    const lines = [`${t("expenseGlobalBalanceLabel")}: ${formatMAD(newBalance, lang, currency)}`];
    if (hasBudget) {
      const remainingInCat = cat.budget - spentAfter;
      lines.unshift(
        `${t("expenseBudgetRemainingLabel")}: ${formatMAD(Math.max(0, remainingInCat), lang, currency)}`,
        `${t("expenseBudgetUsedLabel")}: ${Math.round(pct)}%`,
      );
    } else {
      lines.unshift(t("noCategoryBudgetDefined"));
    }

    toast.success(`${cat.name} — ${formatMAD(amount, lang, currency)}`, {
      description: (
        <div className="space-y-1.5">
          <p className="whitespace-pre-line">{lines.join("\n")}</p>
          {hasBudget && (
            <Progress
              value={Math.min(100, pct)}
              className="h-2"
              indicatorClassName={pct > 100 ? "bg-destructive" : pct >= 80 ? "bg-warning" : "bg-success"}
            />
          )}
        </div>
      ),
    });

    if (hasBudget && pct > 100) {
      const overAmount = spentAfter - cat.budget;
      toast.error(
        t("expenseOverBudgetToast")
          .replace("{cat}", cat.name)
          .replace("{amount}", formatMAD(overAmount, lang, currency))
          .replace("{pct}", String(Math.round(pct))),
      );
    } else if (hasBudget && pct > 90) {
      toast.warning(
        t("expenseNearLimitWarning").replace("{cat}", cat.name).replace("{pct}", String(Math.round(pct))),
      );
    }

    if (newBalance < 0) {
      toast.message(t("expenseSavingsImpactMsg"));
    }
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-6">{t("addExpense")}</h1>
      <Card className="p-4">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="amount">{t("amount")}</Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <Label>{t("category")}</Label>
            {loadingCats ? (
              <div className="h-9 rounded-md border border-input flex items-center px-3">
                <div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-1">{t("noCategoriesYet")}</p>
            ) : (
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <Label htmlFor="date">{t("date")}</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="note">{t("note")}</Label>
            <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loadingCats || !categoryId}
          >
            {t("save")}
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}
