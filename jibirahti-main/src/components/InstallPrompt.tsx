import { useEffect, useRef, useState } from "react";
import { Download, X } from "lucide-react";
import { useBudget } from "@/lib/budget-store";
import { trackAppInstallClicked } from "@/lib/analytics";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __pwaPrompt: BeforeInstallPromptEvent | null;
  }
}

const STORAGE_KEY = "pwa-installed";

function isAlreadyInstalled(): boolean {
  try {
    if (localStorage.getItem(STORAGE_KEY) === "true") return true;
  } catch {}
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if ((navigator as any).standalone === true) return true;
  return false;
}

function markInstalled() {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {}
}

export function InstallPrompt() {
  const { t } = useBudget();
  // installed = permanently hidden; starts from persisted flag or standalone check
  const [installed, setInstalled] = useState(() => isAlreadyInstalled());
  // prompt = deferred BeforeInstallPromptEvent; may be null (Chrome shows native icon instead)
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  // fallback message shown when no prompt is available and user clicks the button
  const [showFallback, setShowFallback] = useState(false);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Log visibility changes — NOT on every render
  useEffect(() => {
    console.log(`[PWA] button visible=${!installed} (installed=${installed}, prompt=${prompt !== null})`);
  }, [installed, prompt]);

  useEffect(() => {
    console.log("[PWA] mounted");

    if (isAlreadyInstalled()) {
      setInstalled(true);
      return;
    }

    // Consume the globally-captured prompt (may have fired before React mounted)
    if (window.__pwaPrompt) {
      console.log("[PWA] prompt found on window.__pwaPrompt (pre-mount capture)");
      setPrompt(window.__pwaPrompt);
    }

    // Listen for future beforeinstallprompt fires
    const onNative = (e: Event) => {
      e.preventDefault();
      console.log("[PWA] beforeinstallprompt received in component listener");
      const bip = e as BeforeInstallPromptEvent;
      window.__pwaPrompt = bip;
      setPrompt(bip);
      setShowFallback(false);
    };

    // Relay from the global index.html capture (fires after pwa-prompt-ready custom event)
    const onRelay = () => {
      if (window.__pwaPrompt) {
        console.log("[PWA] prompt found via pwa-prompt-ready relay");
        setPrompt(window.__pwaPrompt);
        setShowFallback(false);
      }
    };

    // Confirmed installation: appinstalled event
    const onInstalled = () => {
      console.log("[PWA] appinstalled event — marking installed");
      markInstalled();
      setInstalled(true);
      setPrompt(null);
      window.__pwaPrompt = null;
    };

    // Confirmed installation: display-mode changes to standalone (e.g. after add to home screen)
    const mq = window.matchMedia("(display-mode: standalone)");
    const onMqChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        console.log("[PWA] display-mode:standalone — marking installed");
        markInstalled();
        setInstalled(true);
      }
    };

    window.addEventListener("beforeinstallprompt", onNative);
    window.addEventListener("pwa-prompt-ready", onRelay);
    window.addEventListener("appinstalled", onInstalled);
    mq.addEventListener("change", onMqChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onNative);
      window.removeEventListener("pwa-prompt-ready", onRelay);
      window.removeEventListener("appinstalled", onInstalled);
      mq.removeEventListener("change", onMqChange);
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // App is installed — never render anything
  if (installed) return null;

  const handleInstall = async () => {
    console.log("[PWA] install clicked");
    trackAppInstallClicked();

    if (prompt) {
      // Native deferred prompt is available — trigger it directly
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      console.log(`[PWA] user choice: ${outcome}`);
      if (outcome === "accepted") {
        markInstalled();
        setInstalled(true);
        setPrompt(null);
        window.__pwaPrompt = null;
      }
    } else {
      // No deferred prompt — Chrome is showing its own install icon in the toolbar
      console.log("[PWA] no deferred prompt — showing toolbar fallback message");
      setShowFallback(true);
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
      fallbackTimer.current = setTimeout(() => setShowFallback(false), 5000);
    }
  };

  const dismissFallback = () => {
    setShowFallback(false);
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
  };

  return (
    <div
      className="fixed bottom-28 right-4 z-50 flex flex-col items-end gap-2"
      style={{ fontFamily: "'Cairo', 'Poppins', sans-serif" }}
    >
      {showFallback && (
        <div className="flex items-start gap-2 bg-background border rounded-xl shadow-lg px-4 py-3 text-sm text-foreground max-w-[240px] leading-snug animate-in fade-in slide-in-from-right-2 duration-200">
          <span className="flex-1">{t("installFallback")}</span>
          <button
            type="button"
            onClick={dismissFallback}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={handleInstall}
        className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold shadow-lg hover:bg-primary/90 active:scale-95 transition-all duration-200"
      >
        <Download className="h-4 w-4 shrink-0" />
        <span>{t("installApp")}</span>
      </button>
    </div>
  );
}
