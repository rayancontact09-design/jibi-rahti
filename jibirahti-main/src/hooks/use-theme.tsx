import { useEffect, useState } from "react";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = (typeof localStorage !== "undefined" && localStorage.getItem("jr-theme")) as
      | "light"
      | "dark"
      | null;
    const initial =
      stored ??
      (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
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