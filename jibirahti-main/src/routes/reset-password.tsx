import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/i18n/use-lang";
import { LangSwitcher } from "@/i18n/LangSwitcher";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Wallet } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { lang, setLang, t, te } = useLang();
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let settled = false;
    const settle = (next: "ready" | "invalid") => {
      if (!settled) {
        settled = true;
        setStatus(next);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") settle("ready");
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) settle("ready");
    });

    const timeout = setTimeout(() => settle("invalid"), 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error(t("passwordMismatch"));
      return;
    }
    if (password.length < 6) {
      toast.error(t("passwordTooShort"));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(te(error.message));
      setLoading(false);
      return;
    }
    toast.success(t("passwordUpdated"));
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const logoHeader = (
    <div className="text-center mb-6">
      <div
        className="inline-flex h-16 w-16 items-center justify-center rounded-2xl shadow-elegant mb-4"
        style={{ background: "linear-gradient(135deg,#0F8B7E,#4CD4B0)" }}
      >
        <Wallet className="h-8 w-8 text-white" strokeWidth={1.8} />
      </div>
      <h1 className="text-2xl font-extrabold">
        <span style={{ color: "#0F766E" }}>JIBI </span>
        <span style={{ color: "#F59E0B" }}>RAHTI</span>
      </h1>
      <p className="text-sm text-muted-foreground mt-1">{t("resetSubtitle")}</p>
    </div>
  );

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div
        className="min-h-screen bg-background flex flex-col items-center justify-center px-4"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        <div className="w-full max-w-sm">
          {logoHeader}
          <div className="flex justify-center mb-6">
            <LangSwitcher lang={lang} setLang={setLang} />
          </div>
          <Card className="p-6 glass border-border/40 shadow-elegant text-center space-y-3">
            <p className="font-semibold text-foreground">{t("invalidLinkTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("invalidLinkDesc")}</p>
            <Link to="/forgot-password">
              <Button
                className="w-full mt-2 font-bold"
                style={{ background: "linear-gradient(135deg,#0F8B7E,#1FAF8B)" }}
              >
                {t("newRequest")}
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center px-4"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div
        aria-hidden
        className="pointer-events-none fixed -top-32 -right-24 h-80 w-80 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, #4CD4B0 0%, transparent 70%)" }}
      />

      <div className="w-full max-w-sm">
        {logoHeader}

        <div className="flex justify-center mb-6">
          <LangSwitcher lang={lang} setLang={setLang} />
        </div>

        <Card className="p-6 glass border-border/40 shadow-elegant">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password" className="mb-1 block">{t("newPasswordLabel")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  autoComplete="new-password"
                  className="pe-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirm" className="mb-1 block">{t("confirmPasswordLabel")}</Label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder={t("passwordPlaceholder")}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="pe-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowConfirm((v) => !v)}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full font-bold"
              disabled={loading}
              style={{ background: "linear-gradient(135deg,#0F8B7E,#1FAF8B)" }}
            >
              {loading ? t("changePasswordLoading") : t("changePasswordBtn")}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
