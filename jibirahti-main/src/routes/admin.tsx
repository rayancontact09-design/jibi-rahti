import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useBudget } from "@/lib/budget-store";
import { AppShell } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Check, Copy, Key, RefreshCw, Search, Shield } from "lucide-react";
import { toast } from "sonner";

const ADMIN_EMAIL = "rayan.contact09@gmail.com";

type LastGenerated = {
  code: string;
  customerName: string;
  customerPhone: string;
  duration: 1 | 3 | 6 | 12;
  maxDevices: 1 | 3 | 5;
};

type CodeRow = {
  id: string;
  code: string;
  duration_months: number;
  max_devices: number;
  used_count: number;
  is_revoked: boolean;
  is_archived: boolean;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
};

type CodeCardProps = {
  c: CodeRow;
  statusFilter: string;
  acting: string | null;
  onRevoke: (c: CodeRow) => void;
  onArchive: (c: CodeRow) => void;
  onRestore: (c: CodeRow) => void;
  onDelete: (c: CodeRow) => void;
};

function CodeCard({ c, statusFilter, acting, onRevoke, onArchive, onRestore, onDelete }: CodeCardProps) {
  const { t, lang } = useBudget();

  console.log(`[CodeCard] code=${c.code} customer_name="${c.customer_name}" customer_phone="${c.customer_phone}"`);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(lang === "ar" ? "ar-MA" : lang === "en" ? "en-US" : "fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });

  const badge = c.is_revoked
    ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">{t("codeRevokedLabel")}</span>
    : c.used_count >= c.max_devices
    ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-600">{t("codeExhaustedLabel")}</span>
    : <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">{t("codeActiveLabel")}</span>;

  return (
    <Card className="p-3">
      <div className="mb-2">
        <p className="text-sm font-semibold leading-snug">
          {c.customer_name || "Client inconnu"}
        </p>
        {c.customer_phone
          ? <p className="text-xs text-muted-foreground">{c.customer_phone}</p>
          : <p className="text-xs text-muted-foreground/40 italic">—</p>
        }
      </div>
      <p className="font-mono text-sm font-bold tracking-wide text-primary mb-2">{c.code}</p>
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs text-muted-foreground">
          {t(`month${c.duration_months}`)} · {c.used_count}/{c.max_devices} · {fmtDate(c.created_at)}
        </p>
        {badge}
      </div>
      <div className="flex justify-end gap-1.5">
        {statusFilter === "trash" ? (
          <>
            <Button type="button" size="sm" variant="outline"
              className="h-6 px-2 text-[11px] border-emerald-300 text-emerald-700 hover:bg-emerald-50 shrink-0"
              disabled={acting === c.id} onClick={() => onRestore(c)}>
              {t("restoreCode")}
            </Button>
            <Button type="button" size="sm" variant="outline"
              className="h-6 px-2 text-[11px] border-red-300 text-red-600 hover:bg-red-50 shrink-0"
              disabled={acting === c.id} onClick={() => onDelete(c)}>
              {t("deleteCode")}
            </Button>
          </>
        ) : (
          <>
            <Button type="button" size="sm" variant="outline"
              className="h-6 px-2 text-[11px] shrink-0"
              disabled={acting === c.id} onClick={() => onArchive(c)}>
              {t("archiveCode")}
            </Button>
            {!c.is_revoked && (
              <Button type="button" size="sm" variant="outline"
                className="h-6 px-2 text-[11px] border-red-300 text-red-600 hover:bg-red-50 shrink-0"
                disabled={acting === c.id} onClick={() => onRevoke(c)}>
                {t("revokeCode")}
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { user } = useAuth();
  const { t, lang } = useBudget();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const [duration, setDuration] = useState<1 | 3 | 6 | 12>(1);
  const [maxDevices, setMaxDevices] = useState<1 | 3 | 5>(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "exhausted" | "revoked" | "trash">("all");
  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<LastGenerated | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CodeRow | null>(null);

  console.log("lastGenerated", lastGenerated);
  console.log("codes raw", codes);
  const _debugItem = codes.find((c) => c.code === "JIBI-D6F8-058F-ECE0");
  if (_debugItem) console.log("codes[] item JIBI-D6F8-058F-ECE0:", JSON.stringify(_debugItem));

  const fetchCodes = async () => {
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase.rpc("admin_list_codes");
    if (error) {
      console.error("[admin] fetch codes:", error.message);
      setFetchError(error.message);
    } else {
      console.log("[admin] typeof data:", typeof data, "isArray:", Array.isArray(data));
      console.log("[admin] raw data:", JSON.stringify(data));

      // Resolve the actual code rows regardless of how PostgREST packages the response.
      // Three known shapes for RETURNS jsonb functions:
      //   A — direct array:            [{id, customer_name, …}, …]
      //   B — scalar-wrapped:          [{admin_list_codes: [{id, customer_name, …}, …]}]
      //   C — double-nested array:     [[{id, customer_name, …}, …]]
      let rows: CodeRow[] = [];
      if (Array.isArray(data) && data.length > 0) {
        const first = (data as any[])[0];
        if (Array.isArray(first)) {
          // Shape C
          rows = first as CodeRow[];
        } else if (first && typeof first === "object" && "admin_list_codes" in first) {
          // Shape B
          rows = (first as any).admin_list_codes ?? [];
        } else {
          // Shape A
          rows = data as CodeRow[];
        }
      }

      console.log("[admin] rows.length:", rows.length);
      rows.forEach((r, i) =>
        console.log(`[admin] row[${i}]: code=${r.code} is_archived=${r.is_archived} customer_name="${r.customer_name}"`)
      );
      setCodes(rows);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchCodes();
    else setLoading(false);
  }, [isAdmin]);

  const generateCode = async () => {
    setGenerating(true);
    const snapshotName = customerName.trim();
    const snapshotPhone = customerPhone.trim();
    const { data, error } = await supabase.rpc("admin_create_code", {
      p_duration: duration,
      p_max_devices: maxDevices,
      p_customer_name: snapshotName || null,
      p_customer_phone: snapshotPhone || null,
    });
    if (error || !data?.success) {
      toast.error(error?.message ?? data?.error ?? t("errorGeneric"));
    } else {
      setLastGenerated({
        code: data.code as string,
        customerName: snapshotName,
        customerPhone: snapshotPhone,
        duration,
        maxDevices,
      });
      setCustomerName("");
      setCustomerPhone("");
      await fetchCodes();
    }
    setGenerating(false);
  };

  const revokeCode = async (codeRow: CodeRow) => {
    setActing(codeRow.id);
    const { data, error } = await supabase.rpc("admin_revoke_code", { p_code_id: codeRow.id });
    if (error || !data?.success) {
      toast.error(error?.message ?? data?.error ?? t("errorGeneric"));
    } else {
      toast.success(t("codeRevokedToast").replace("{code}", codeRow.code));
      await fetchCodes();
    }
    setActing(null);
  };

  const archiveCode = async (codeRow: CodeRow) => {
    setActing(codeRow.id);
    const { data, error } = await supabase.rpc("admin_archive_code", { p_code_id: codeRow.id });
    if (error || !data?.success) {
      toast.error(error?.message ?? data?.error ?? t("errorGeneric"));
    } else {
      await fetchCodes();
    }
    setActing(null);
  };

  const restoreCode = async (codeRow: CodeRow) => {
    setActing(codeRow.id);
    const { data, error } = await supabase.rpc("admin_restore_code", { p_code_id: codeRow.id });
    if (error || !data?.success) {
      toast.error(error?.message ?? data?.error ?? t("errorGeneric"));
    } else {
      await fetchCodes();
    }
    setActing(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const codeRow = deleteTarget;
    setDeleteTarget(null);
    setActing(codeRow.id);
    const { data, error } = await supabase.rpc("admin_delete_code", { p_code_id: codeRow.id });
    if (error || !data?.success) {
      toast.error(error?.message ?? data?.error ?? t("errorGeneric"));
    } else {
      toast.success(t("codeDeletedToast").replace("{code}", codeRow.code));
      await fetchCodes();
    }
    setActing(null);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAdmin) {
    return (
      <AppShell hideNav>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
          <Shield className="h-16 w-16 text-destructive opacity-40" />
          <h1 className="text-2xl font-bold">{t("accessDenied")}</h1>
          <p className="text-muted-foreground text-sm">{t("accessDeniedMsg")}</p>
        </div>
      </AppShell>
    );
  }

  const q = search.trim().toLowerCase();
  const filteredCodes = codes
    .filter((c) => {
      const archived = c.is_archived === true;
      if (statusFilter === "trash")     return archived;
      if (archived)                     return false;
      if (statusFilter === "active")    return !c.is_revoked && c.used_count < c.max_devices;
      if (statusFilter === "exhausted") return !c.is_revoked && c.used_count >= c.max_devices;
      if (statusFilter === "revoked")   return c.is_revoked;
      return true;
    })
    .filter((c) =>
      !q ||
      c.code.toLowerCase().includes(q) ||
      (c.customer_name ?? "").toLowerCase().includes(q) ||
      (c.customer_phone ?? "").toLowerCase().includes(q)
    );

  const nonArchived = codes.filter((c) => c.is_archived !== true);
  const stats = {
    total:     nonArchived.length,
    active:    nonArchived.filter((c) => !c.is_revoked && c.used_count < c.max_devices).length,
    exhausted: nonArchived.filter((c) => !c.is_revoked && c.used_count >= c.max_devices).length,
    revoked:   nonArchived.filter((c) => c.is_revoked).length,
  };

  const DURATIONS: (1 | 3 | 6 | 12)[] = [1, 3, 6, 12];
  const DEVICES: (1 | 3 | 5)[] = [1, 3, 5];

  return (
    <AppShell hideNav>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">{t("adminTitle")}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label={t("totalCodes")} value={stats.total} color="text-primary" />
        <StatCard label={t("activeCodes")} value={stats.active} color="text-emerald-600" />
        <StatCard label={t("exhaustedCodes")} value={stats.exhausted} color="text-orange-500" />
        <StatCard label={t("revokedCodes")} value={stats.revoked} color="text-red-500" />
      </div>

      {/* Generate code */}
      <Card className="p-4 mb-4">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Key className="h-4 w-4 text-primary" />
          {t("generateCode")}
        </h2>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">
              {t("customerName")} <span className="text-destructive">*</span>
            </label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={t("customerName")}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">
              {t("customerPhone")} <span className="text-destructive">*</span>
            </label>
            <Input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder={t("customerPhone")}
              type="tel"
            />
          </div>
        </div>

        <p className="text-xs font-medium text-foreground mb-1.5">{t("codeDuration")}</p>
        <div className="flex flex-wrap gap-2 mb-4" dir="ltr">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDuration(d)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                duration === d
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {t(`month${d}`)}
            </button>
          ))}
        </div>

        <p className="text-xs font-medium text-foreground mb-1.5">{t("codeMaxDevices")}</p>
        <div className="flex gap-2 mb-5" dir="ltr">
          {DEVICES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setMaxDevices(d)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                maxDevices === d
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {t(`device${d}`)}
            </button>
          ))}
        </div>

        <Button
          type="button"
          className="w-full"
          onClick={generateCode}
          disabled={generating || !customerName.trim() || !customerPhone.trim()}
        >
          {generating ? "…" : t("generate")}
        </Button>

      </Card>

      {/* Search + Refresh */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 h-9 w-9 p-0"
          onClick={fetchCodes}
          disabled={loading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Status filters */}
      <div className="flex gap-1.5 mb-3 flex-wrap" dir="ltr">
        {(["all", "active", "exhausted", "revoked", "trash"] as const).map((f) => {
          const label = f === "all" ? t("filterAll") : f === "active" ? t("activeCodes") : f === "exhausted" ? t("exhaustedCodes") : f === "revoked" ? t("revokedCodes") : t("filterTrash");
          const active = statusFilter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Fetch error */}
      {fetchError && (
        <Card className="p-4 mb-3 border-destructive/40 bg-destructive/5">
          <p className="text-xs font-semibold text-destructive mb-1">{t("loadErrorTitle")}</p>
          <p className="text-xs text-muted-foreground font-mono break-all">{fetchError}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {t("loadErrorHint")}
          </p>
        </Card>
      )}

      {/* Last generated — summary card */}
      {lastGenerated && (
        <Card className="p-4 mb-4 border-emerald-300 bg-emerald-50">
          <div className="mb-3">
            <p className="font-bold text-emerald-900">{lastGenerated.customerName}</p>
            <p className="text-sm text-emerald-700">{lastGenerated.customerPhone}</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              {t(`month${lastGenerated.duration}`)} · {t(`device${lastGenerated.maxDevices}`)}
            </p>
          </div>
          <div className="rounded-lg bg-white border border-emerald-200 px-3 py-2.5 mb-3">
            <p className="font-mono text-base font-bold tracking-widest text-emerald-900 text-center">
              {lastGenerated.code}
            </p>
          </div>
          <Button
            type="button"
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => copyToClipboard(lastGenerated.code)}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? t("codeCopied") : t("copyCode")}
          </Button>
        </Card>
      )}

      {/* Codes list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : filteredCodes.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">
          {search.trim() ? t("noResults") : t("noExpenses")}
        </p>
      ) : (
        <div className="space-y-2">
          {filteredCodes.map((c) => (
            <CodeCard
              key={c.id}
              c={c}
              statusFilter={statusFilter}
              acting={acting}
              onRevoke={revokeCode}
              onArchive={archiveCode}
              onRestore={restoreCode}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">
              {t("deleteDialogDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              {t("deleteCode")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="p-4 flex flex-col items-center justify-center text-center">
      <p className={`text-2xl font-bold leading-none ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </Card>
  );
}
