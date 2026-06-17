import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useBudget, Lang, formatMAD, type AdditionalIncome } from "@/lib/budget-store";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { AppShell } from "@/components/BottomNav";
import { ActivationCodeInput } from "@/components/ActivationCodeInput";
import { ExpiryWarningBanner } from "@/components/ExpiryWarningBanner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, CalendarDays, CheckCircle2, Crown, Key, LogOut, Mail, Pencil, Plus, Shield, Trash2, TrendingUp, User } from "lucide-react";
import { computeAccountStatus, formatTimeRemaining } from "@/i18n/format-time";
import { toast } from "sonner";
import { WHATSAPP_ACTIVATION_URL } from "@/lib/whatsapp";

type Category = {
  id: string;
  name: string;
  budget: number;
  created_at: string;
};

type ModalState = { open: false } | { open: true; mode: "add" } | { open: true; mode: "edit"; item: Category };

function CategorySection({
  userId,
  t,
  onAllocatedChange,
}: {
  userId: string;
  t: (k: string) => string;
  onAllocatedChange?: (total: number) => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [formName, setFormName] = useState("");
  const [formBudget, setFormBudget] = useState("0");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [budgetEdits, setBudgetEdits] = useState<Record<string, string>>({});

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, budget, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (!error && data) setCategories(data as Category[]);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const next: Record<string, string> = {};
    categories.forEach((c) => { next[c.id] = String(c.budget); });
    setBudgetEdits(next);
  }, [categories]);

  const onAllocatedChangeRef = useRef(onAllocatedChange);
  useEffect(() => { onAllocatedChangeRef.current = onAllocatedChange; });

  useEffect(() => {
    const total = Object.values(budgetEdits).reduce(
      (sum, v) => sum + Math.max(0, parseFloat(v) || 0),
      0
    );
    onAllocatedChangeRef.current?.(total);
  }, [budgetEdits]);

  const saveBudgetInline = async (cat: Category) => {
    const val = Math.max(0, parseFloat(budgetEdits[cat.id] ?? "0") || 0);
    if (val === cat.budget) return;
    const { error } = await supabase.from("categories").update({ budget: val }).eq("id", cat.id);
    if (error) { toast.error(error.message); return; }
    await fetchCategories();
  };

  const openAdd = () => {
    setFormName("");
    setFormBudget("0");
    setFormError(null);
    setModal({ open: true, mode: "add" });
  };

  const openEdit = (cat: Category) => {
    setFormName(cat.name);
    setFormBudget(budgetEdits[cat.id] ?? String(cat.budget));
    setFormError(null);
    setModal({ open: true, mode: "edit", item: cat });
  };

  const closeModal = () => setModal({ open: false });

  const save = async () => {
    const name = formName.trim();
    const budget = Math.max(0, parseFloat(formBudget) || 0);

    if (!name) { setFormError(t("categoryNameLabel") + " requis"); return; }

    const editId = modal.open && modal.mode === "edit" ? modal.item.id : null;
    const duplicate = categories.some(
      (c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== editId
    );
    if (duplicate) { setFormError(t("duplicateCategoryName")); return; }

    setSaving(true);
    setFormError(null);

    if (modal.open && modal.mode === "edit") {
      const { error } = await supabase.from("categories")
        .update({ name, budget })
        .eq("id", modal.item.id);
      if (error) { toast.error(error.message); }
      else { closeModal(); await fetchCategories(); }
    } else {
      const { error } = await supabase.from("categories")
        .insert({ user_id: userId, name, budget });
      if (error) { toast.error(error.message); }
      else { closeModal(); await fetchCategories(); }
    }

    setSaving(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("categories").delete().eq("id", deleteTarget.id);
    if (error) { toast.error(error.message); }
    else { setDeleteTarget(null); await fetchCategories(); }
    setDeleting(false);
  };

  return (
    <>
      {loading ? (
        <div className="py-2 flex justify-center">
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-3 mb-3">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2">
              <span className="text-sm font-medium flex-1 min-w-0 truncate">{cat.name}</span>
              <Input
                type="number"
                min="0"
                className="w-28 h-9 text-right"
                value={budgetEdits[cat.id] ?? String(cat.budget)}
                onChange={(e) => setBudgetEdits((prev) => ({ ...prev, [cat.id]: e.target.value }))}
                onBlur={() => saveBudgetInline(cat)}
              />
              <button
                type="button"
                className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                onClick={() => openEdit(cat)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                onClick={() => setDeleteTarget(cat)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full gap-2 text-xs h-8 border-dashed"
        onClick={openAdd}
      >
        <Plus className="h-3.5 w-3.5" />
        {t("addCategory")}
      </Button>

      {/* Add / Edit dialog */}
      <Dialog open={modal.open} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {modal.open && modal.mode === "edit" ? t("editCategory") : t("addCategory")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div>
              <Label htmlFor="cat-name" className="text-xs font-medium mb-1.5 block">
                {t("categoryNameLabel")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat-name"
                value={formName}
                onChange={(e) => { setFormName(e.target.value); setFormError(null); }}
                placeholder={t("categoryNamePh")}
                maxLength={100}
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="cat-budget" className="text-xs font-medium mb-1.5 block">
                {t("categoryBudgetLabel")}
              </Label>
              <Input
                id="cat-budget"
                type="number"
                min="0"
                step="any"
                value={formBudget}
                onChange={(e) => { setFormBudget(e.target.value); setFormError(null); }}
                placeholder="0"
              />
            </div>
            {formError && <p className="text-xs text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeModal}>{t("cancel")}</Button>
            <Button type="button" disabled={saving || !formName.trim()} onClick={save}>
              {saving ? "…" : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteCategoryTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-foreground">{deleteTarget?.name}</span>
              <br />
              {t("deleteCategoryDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "…" : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function AdditionalIncomeSection() {
  const {
    t, lang,
    additionalIncomes, additionalIncomeThisMonth,
    addAdditionalIncome, updateAdditionalIncome, removeAdditionalIncome,
  } = useBudget();

  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisMonth = additionalIncomes.filter((e) => e.incomeDate.startsWith(ym));

  type AIModal = { open: false } | { open: true; mode: "add" } | { open: true; mode: "edit"; item: AdditionalIncome };
  const [modal, setModal] = useState<AIModal>({ open: false });
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formNote, setFormNote] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdditionalIncome | null>(null);

  const openAdd = () => {
    setFormAmount("");
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormNote("");
    setModal({ open: true, mode: "add" });
  };

  const openEdit = (item: AdditionalIncome) => {
    setFormAmount(String(item.amount));
    setFormDate(item.incomeDate);
    setFormNote(item.note ?? "");
    setModal({ open: true, mode: "edit", item });
  };

  const closeModal = () => setModal({ open: false });

  const save = () => {
    const amount = parseFloat(formAmount);
    if (!amount || amount <= 0) return;
    if (modal.open && modal.mode === "edit") {
      updateAdditionalIncome({ id: modal.item.id, amount, note: formNote.trim() || undefined, incomeDate: formDate });
    } else {
      addAdditionalIncome({ amount, note: formNote.trim() || undefined, incomeDate: formDate });
    }
    closeModal();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">{t("additionalIncomeThisMonth")}</span>
        <span className="text-sm font-bold text-primary">{formatMAD(additionalIncomeThisMonth, lang)}</span>
      </div>

      {thisMonth.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-2 mb-3">{t("noAdditionalIncomeYet")}</p>
      ) : (
        <div className="space-y-2 mb-3">
          {thisMonth.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{formatMAD(item.amount, lang)}</p>
                <p className="text-xs text-muted-foreground">{item.incomeDate}{item.note ? ` · ${item.note}` : ""}</p>
              </div>
              <button type="button" className="text-muted-foreground hover:text-primary transition-colors shrink-0" onClick={() => openEdit(item)}>
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button type="button" className="text-muted-foreground hover:text-destructive transition-colors shrink-0" onClick={() => setDeleteTarget(item)}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" className="w-full gap-2 text-xs h-8 border-dashed" onClick={openAdd}>
        <Plus className="h-3.5 w-3.5" />
        {t("addAdditionalIncome")}
      </Button>

      <Dialog open={modal.open} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {modal.open && modal.mode === "edit" ? t("editAdditionalIncome") : t("addAdditionalIncome")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div>
              <Label htmlFor="ai-amount" className="text-xs font-medium mb-1.5 block">
                {t("amount")} <span className="text-destructive">*</span>
              </Label>
              <Input id="ai-amount" type="number" min="0" step="0.01" value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)} autoFocus />
            </div>
            <div>
              <Label htmlFor="ai-date" className="text-xs font-medium mb-1.5 block">
                {t("date")} <span className="text-destructive">*</span>
              </Label>
              <Input id="ai-date" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ai-note" className="text-xs font-medium mb-1.5 block">
                {t("note")}
              </Label>
              <Input id="ai-note" value={formNote} onChange={(e) => setFormNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeModal}>{t("cancel")}</Button>
            <Button type="button" disabled={!formAmount || parseFloat(formAmount) <= 0} onClick={save}>
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteAdditionalIncome")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteAdditionalIncomeDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteTarget) { removeAdditionalIncome(deleteTarget.id); setDeleteTarget(null); } }}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const {
    t, lang, setLang, income, setIncome,
    savings, setSavings, incomeDay, setIncomeDay,
    accountStatus, trialExpiresAt, subscriptionExpiresAt,
    effectiveIncome, additionalIncomeThisMonth,
  } = useBudget();
  const { signOut, user } = useAuth();
  const [totalAllocated, setTotalAllocated] = useState(0);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const isAdmin = user?.email === "rayan.contact09@gmail.com";
  const now = new Date();
  const effectiveStatus = isAdmin
    ? ("active" as const)
    : computeAccountStatus(accountStatus, trialExpiresAt, subscriptionExpiresAt, now);

  const displayTrialExpiry =
    trialExpiresAt ??
    (user?.created_at
      ? new Date(new Date(user.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : null);

  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(
        lang === "ar" ? "ar-MA" : "fr-FR",
        { day: "numeric", month: "long", year: "numeric" }
      )
    : null;
  const isVerified = Boolean(user?.email_confirmed_at);

  return (
    <AppShell>
      <h1 className="text-2xl font-bold mb-6">{t("settings")}</h1>

      <ExpiryWarningBanner />

      {/* Profile */}
      {user && (
        <Card className="p-4 mb-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            {t("myAccount")}
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground min-w-0 truncate">{user.email}</span>
            </div>
            {createdAt && (
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">{t("memberSince")} {createdAt}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2
                className={`h-4 w-4 flex-shrink-0 ${isVerified ? "text-emerald-500" : "text-muted-foreground"}`}
              />
              <span className={isVerified ? "text-emerald-600" : "text-muted-foreground"}>
                {isVerified ? t("accountVerified") : t("accountNotVerified")}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Account status */}
      <Card className="p-4 mb-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          {t("accountStatusTitle")}
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {effectiveStatus === "trial" && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                {t("trialStatus")}
              </span>
            )}
            {effectiveStatus === "active" && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                {t("activeStatus")}
              </span>
            )}
            {effectiveStatus === "expired" && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600">
                {t("expiredStatus")}
              </span>
            )}
          </div>
          {effectiveStatus === "trial" && displayTrialExpiry && (
            <p className="text-sm text-amber-700 font-medium">
              {t("trialTimeLeft").replace("{time}", formatTimeRemaining(displayTrialExpiry, lang))}
            </p>
          )}
          {effectiveStatus === "active" && subscriptionExpiresAt && (
            <p className="text-sm text-muted-foreground">
              {t("subscriptionExpiry")}:{" "}
              <span className="font-semibold">
                {new Date(subscriptionExpiresAt).toLocaleDateString(
                  lang === "ar" ? "ar-MA" : "fr-FR",
                  { day: "numeric", month: "long", year: "numeric" }
                )}
              </span>
            </p>
          )}
        </div>
      </Card>

      {/* Activation code — hidden for admin and active accounts */}
      {!isAdmin && effectiveStatus !== "active" && (
        <Card className="p-4 mb-4">
          <h2 className="font-semibold mb-1 flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            {t("activationCodeTitle")}
          </h2>
          <p className="text-xs text-muted-foreground mb-3">{t("activationCodeDesc")}</p>
          <ActivationCodeInput />
        </Card>
      )}

      {/* WhatsApp contact — for users who need an activation code */}
      {!isAdmin && effectiveStatus !== "active" && (
        <Card className="p-4 mb-4">
          <h2 className="font-semibold mb-1">💬 {t("whatsappContactTitle")}</h2>
          <p className="text-xs text-muted-foreground mb-3">{t("whatsappContactDesc")}</p>
          <a
            href={WHATSAPP_ACTIVATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-sm font-semibold py-2.5 px-4 transition-colors"
          >
            💬 {t("whatsappContactBtn")}
          </a>
        </Card>
      )}

      {/* Admin link — super admin only */}
      {isAdmin && (
        <Card className="p-4 mb-4">
          <Link to="/admin">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-primary text-primary hover:bg-primary/10"
            >
              <Crown className="h-4 w-4" />
              {t("admin")}
            </Button>
          </Link>
        </Card>
      )}

      <Card className="p-4 mb-4">
        <Label className="mb-2 block">{t("language")}</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["fr", "ar"] as Lang[]).map((l) => (
            <Button
              key={l}
              type="button"
              variant={lang === l ? "default" : "outline"}
              onClick={() => setLang(l)}
            >
              {l === "fr" ? "Français" : "العربية"}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="p-4 mb-4">
        <Label htmlFor="income">{t("monthlyIncome")}</Label>
        <Input
          id="income"
          type="number"
          min="0"
          value={income || ""}
          onChange={(e) => setIncome(parseFloat(e.target.value) || 0)}
        />
        <div className="mt-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-start gap-2 h-auto min-h-[2.25rem] whitespace-normal py-2 text-left leading-snug">
                <CalendarDays className="h-4 w-4 shrink-0" />
                {incomeDay ? t("incomeDayInfo").replace("{day}", String(incomeDay)) : t("incomeDay")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 pointer-events-auto" align="start">
              <div className="text-sm font-medium mb-2">{t("incomeDayChoose")}</div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((d) => (
                  <Button
                    key={d}
                    type="button"
                    size="sm"
                    variant={incomeDay === d ? "default" : "outline"}
                    className="h-8 w-8 p-0 text-xs"
                    onClick={() => setIncomeDay(d)}
                  >
                    {d}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </Card>

      <Card className="p-4 mb-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          {t("additionalIncome")}
        </h2>
        <AdditionalIncomeSection />
      </Card>

      <Card className="p-4 mb-4">
        <h2 className="font-semibold mb-3">{t("budgetPerCategory")}</h2>
        {user && (
          <CategorySection
            userId={user.id}
            t={t}
            onAllocatedChange={setTotalAllocated}
          />
        )}

        {/* Allocation summary */}
        {(() => {
          const remaining = effectiveIncome - totalAllocated - savings;
          const remainingColor =
            remaining > 0 ? "#10B981" : remaining === 0 ? "#F59E0B" : "#E53935";
          return (
            <div className="border-t border-border mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("monthlyIncome")}</span>
                <span className="font-medium">{formatMAD(income, lang)}</span>
              </div>
              {additionalIncomeThisMonth > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("additionalIncome")}</span>
                  <span className="font-medium text-emerald-600">+{formatMAD(additionalIncomeThisMonth, lang)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("totalAllocated")}</span>
                <span className="font-medium">{formatMAD(totalAllocated, lang)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("monthlySavings")}</span>
                <span className="font-medium">{formatMAD(savings, lang)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-border pt-2">
                <span>{t("remainingFreeBudget")}</span>
                <span style={{ color: remainingColor }}>{formatMAD(remaining, lang)}</span>
              </div>
              {remaining < 0 && (
                <div className="flex items-start gap-1.5 pt-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive">{t("budgetAndSavingsExceedIncome")}</p>
                </div>
              )}
            </div>
          );
        })()}

        <div className="border-t border-border mt-4 pt-4">
          <Label htmlFor="savings">{t("monthlySavings")}</Label>
          <Input
            id="savings"
            type="number"
            min="0"
            value={savings || ""}
            onChange={(e) => setSavings(parseFloat(e.target.value) || 0)}
          />
        </div>
      </Card>

      <Card className="p-4">
        <Button
          variant="outline"
          className="w-full gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          {t("logout")}
        </Button>
      </Card>
    </AppShell>
  );
}
