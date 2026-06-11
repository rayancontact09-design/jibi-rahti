import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLang } from "@/i18n/use-lang";
import { LangSwitcher } from "@/i18n/LangSwitcher";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { KeyRound, Wallet } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { lang, setLang, t, te } = useLang();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(te(error.message));
    } else {
      setSent(true);
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
          <p className="text-sm text-muted-foreground mt-1">{t("forgotSubtitle")}</p>
        </div>

        {/* Lang switcher */}
        <div className="flex justify-center mb-6">
          <LangSwitcher lang={lang} setLang={setLang} />
        </div>

        <Card className="p-6 glass border-border/40 shadow-elegant">
          {sent ? (
            <div className="text-center py-4 space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 mx-auto">
                <KeyRound className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="font-semibold text-foreground">{t("emailSentTitle")}</p>
              <p className="text-sm text-muted-foreground">
                {t("emailSentDesc")} <strong>{email}</strong>. {t("checkInbox")}
              </p>
              <Link to="/login" className="block mt-4 text-sm text-primary font-semibold hover:underline">
                {t("backToLogin")}
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">{t("forgotDesc")}</p>
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
                <Button
                  type="submit"
                  className="w-full font-bold"
                  disabled={loading}
                  style={{ background: "linear-gradient(135deg,#0F8B7E,#1FAF8B)" }}
                >
                  {loading ? t("sendLoading") : t("sendLink")}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-5">
                <Link to="/login" className="text-primary font-semibold hover:underline">
                  {t("backToLogin")}
                </Link>
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
