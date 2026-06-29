import { useEffect, useState } from "react";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = (typeof localStorage !== "undefined" && localStorage.getItem("jr-theme")) as
      | "light"
      | "dark"
      | null;
    // Default is always "light" on first launch — never inherit the OS/browser
    // prefers-color-scheme setting. Dark mode only applies once the user has
    // explicitly toggled it, and that explicit choice is what gets restored here.
    const initial = stored === "dark" ? "dark" : "light";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      try { localStorage.setItem("jr-theme", next); } catch {}
      return next;
    });
  };

  return { theme, toggle };
}