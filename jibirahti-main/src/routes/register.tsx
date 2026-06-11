import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/i18n/use-lang";
import { LangSwitcher } from "@/i18n/LangSwitcher";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Wallet } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { lang, setLang, t, te } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate({ to: "/dashboard" });
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

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
    const { data: signUpData, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast.error(te(error.message));
    } else {
      if (signUpData.user) {
        const now = new Date();
        await supabase.from("profiles").upsert(
          {
            id: signUpData.user.id,
            account_status: "trial",
            trial_started_at: now.toISOString(),
            trial_expires_at: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
          },
          { onConflict: "id", ignoreDuplicates: true }
        );
      }
      toast.success(t("accountCreated"));
      navigate({ to: "/dashboard" });
    }
    setLoading(false);
  };

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
        {/* Logo */}
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
          <p className="text-sm text-muted-foreground mt-1">{t("registerSubtitle")}</p>
        </div>

        {/* Lang switcher */}
        <div className="flex justify-center mb-6">
          <LangSwitcher lang={lang} setLang={setLang} />
        </div>

        <Card className="p-6 glass border-border/40 shadow-elegant">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="password" className="mb-1 block">{t("password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
              {loading ? t("registerLoading") : t("registerBtn")}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            {t("alreadyAccount")}{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              {t("signInLink")}
            </Link>
          </p>
        </Card>

        <p className="text-center mt-4">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {t("backToHome")}
          </Link>
        </p>
      </div>
    </div>
  );
}
