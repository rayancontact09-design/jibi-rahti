import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useBudget } from "@/lib/budget-store";
import { useAuth } from "@/lib/auth";
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

export const Route = createFileRoute("/add")({
  component: AddPage,
});

type DynCategory = { id: string; name: string };

function AddPage() {
  const { t, addExpense } = useBudget();
  const { user } = useAuth();
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
      .select("id, name")
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
    navigate({ to: "/dashboard" });
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
