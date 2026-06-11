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
    { to: "/dashboard", icon: Home, label: t("dashboard"), center: false },
    { to: "/add", icon: PlusCircle, label: t("addExpense"), center: true },
    { to: "/report", icon: FileBarChart2, label: t("reports"), center: false },
    { to: "/settings", icon: Settings, label: t("settings"), center: false },
  ] as const;
  return (
    <nav
      className="fixed bottom-4 inset-x-0 z-40 px-4 pointer-events-none"
      style={{ fontFamily: "'Cairo', 'Poppins', sans-serif" }}
    >
      <div className="max-w-md mx-auto pointer-events-auto rounded-[28px] glass shadow-elegant px-2 py-2 transition-all relative">
        {/* Non-center nav items: Dashboard + Reports on left, Settings + invisible balance on right.
            A w-16 spacer in the center reserves room for the FAB.
            Math proof: spacer center = 8 + (W-80)/2 + 32 = W/2 for any W → always aligns with left-1/2. */}
        <ul className="flex items-center">
          {[items[0], items[2]].map(({ to, icon: Icon, label }) => {
            const active = pathname === to;
            return (
              <li key={to} className="flex flex-1">
                <Link
                  to={to}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 mx-1 py-2.5 rounded-2xl text-[11px] font-medium transition-all duration-300 active:scale-95 ${
                    active
                      ? "text-primary bg-primary/10 shadow-inner"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-transform ${active ? "scale-110" : ""}`} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
          {/* Spacer: reserves the FAB footprint so surrounding items don't overlap it */}
          <li className="w-16 shrink-0" aria-hidden="true" />
          {[items[3]].map(({ to, icon: Icon, label }) => {
            const active = pathname === to;
            return (
              <li key={to} className="flex flex-1">
                <Link
                  to={to}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 mx-1 py-2.5 rounded-2xl text-[11px] font-medium transition-all duration-300 active:scale-95 ${
                    active
                      ? "text-primary bg-primary/10 shadow-inner"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-transform ${active ? "scale-110" : ""}`} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
          {/* Invisible balance item: mirrors the left side's 2 flex-1 items so the spacer stays centered */}
          <li className="flex-1 pointer-events-none" aria-hidden="true" />
        </ul>

        {/* FAB: absolutely positioned at left-1/2 → guaranteed pixel-perfect center on every screen size */}
        {(() => {
          const { to, icon: Icon, label } = items[1];
          const active = pathname === to;
          return (
            <div className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-6 flex flex-col items-center gap-1 pointer-events-auto">
              <Link
                to={to}
                aria-label={label}
                className={`h-14 w-14 rounded-full gradient-primary text-white flex items-center justify-center shadow-elegant transition-transform duration-300 active:scale-90 hover:scale-110 ring-4 ring-background ${
                  active ? "ring-primary/30" : ""
                }`}
              >
                <Icon className="h-7 w-7" strokeWidth={2.2} />
              </Link>
              <span className={`text-[10px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
                {label}
              </span>
            </div>
          );
        })()}
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
