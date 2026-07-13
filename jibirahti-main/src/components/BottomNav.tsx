import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Home, PlusCircle, Settings, FileBarChart2 } from "lucide-react";
import { useBudget } from "@/lib/budget-store";
import { useAuth } from "@/lib/auth";
import { computeAccountStatus } from "@/i18n/format-time";
import { TrialBanner } from "./TrialBanner";
import { ExpiredScreen } from "./ExpiredScreen";

export function BottomNav() {
  const { t } = useBudget();
  const { pathname } = useLocation();
  const items = [
    { to: "/dashboard", icon: Home, label: t("dashboard"), center: false, tutorialId: undefined },
    { to: "/add", icon: PlusCircle, label: t("addExpense"), center: true, tutorialId: "add-expense-btn" },
    { to: "/report", icon: FileBarChart2, label: t("reports"), center: false, tutorialId: undefined },
    { to: "/settings", icon: Settings, label: t("settings"), center: false, tutorialId: "settings-nav-btn" },
  ] as const;

  return (
    <nav
      className="fixed bottom-4 inset-x-0 z-40 px-4 pointer-events-none"
      style={{ fontFamily: "'Cairo', 'Poppins', sans-serif" }}
    >
      <div className="max-w-md mx-auto pointer-events-auto rounded-[28px] glass shadow-elegant px-2 py-2">
        <ul className="grid grid-cols-4">
          {items.map(({ to, icon: Icon, label, center, tutorialId }) => {
            const active = pathname === to;
            return (
              <li key={to} className="flex min-w-0">
                <Link
                  to={to}
                  data-tutorial-id={tutorialId}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl text-[10px] font-medium transition-all duration-300 active:scale-95 min-w-0 ${
                    !center && active
                      ? "text-primary bg-primary/10"
                      : !center
                      ? "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                      : active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {center ? (
                    <div
                      className={`h-12 w-12 shrink-0 rounded-full gradient-primary flex items-center justify-center shadow-[0_4px_20px_rgba(15,139,126,0.6)] transition-transform duration-300 ${
                        active ? "scale-105" : ""
                      }`}
                    >
                      <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                    </div>
                  ) : (
                    <Icon
                      className={`h-5 w-5 shrink-0 transition-transform duration-300 ${active ? "scale-110" : ""}`}
                    />
                  )}
                  <span className="leading-tight text-center w-full line-clamp-2 overflow-hidden">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

export function AppShell({ children, hideNav = false }: { children: React.ReactNode; hideNav?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const { loading: dataLoading, accountStatus, trialExpiresAt, subscriptionExpiresAt } = useBudget();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  if (authLoading || dataLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const isAdmin = user.email === "rayan.contact09@gmail.com";
  const effectiveStatus = isAdmin
    ? ("active" as const)
    : computeAccountStatus(accountStatus, trialExpiresAt, subscriptionExpiresAt, now);

  if (effectiveStatus === "expired") {
    return <ExpiredScreen />;
  }

  const showTrialBanner = !isAdmin && effectiveStatus === "trial" && trialExpiresAt !== null;

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden">
      {showTrialBanner && <TrialBanner trialExpiresAt={trialExpiresAt!} />}
      {/* Ambient gradient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-24 h-80 w-80 rounded-full opacity-40 blur-3xl animate-float-slow"
        style={{ background: "radial-gradient(circle, #4CD4B0 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -left-24 h-72 w-72 rounded-full opacity-25 blur-3xl animate-float-slow"
        style={{ background: "radial-gradient(circle, #1FAF8B 0%, transparent 70%)", animationDelay: "2s" }}
      />
      <main className={`relative max-w-md mx-auto px-4 ${hideNav ? "pb-8" : "pb-32"} ${showTrialBanner ? "pt-12" : "pt-6"}`}>{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
