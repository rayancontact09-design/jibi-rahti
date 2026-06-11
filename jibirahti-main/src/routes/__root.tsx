import { Outlet, Link, createRootRoute } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth";
import { BudgetProvider } from "@/lib/budget-store";
import { Toaster } from "@/components/ui/sonner";
import { useLang } from "@/i18n/use-lang";
import { InstallPrompt } from "@/components/InstallPrompt";

function NotFoundComponent() {
  const { t } = useLang();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{t("notFoundTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("notFoundDesc")}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  return (
    <AuthProvider>
      <BudgetProvider>
        <Outlet />
        <Toaster />
        <InstallPrompt />
      </BudgetProvider>
    </AuthProvider>
  );
}
