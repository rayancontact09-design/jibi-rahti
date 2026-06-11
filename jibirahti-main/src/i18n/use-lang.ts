import { useState, useEffect } from "react";
import { getLang, applyLangToDOM, tr, translateError } from "./translations";
import type { Lang } from "./translations";

export type { Lang };

export function useLang() {
  const [lang, setLangState] = useState<Lang>(getLang);

  useEffect(() => {
    applyLangToDOM(lang);
  }, [lang]);

  return {
    lang,
    setLang: setLangState,
    t: (key: string) => tr(lang, key),
    te: (msg: string) => translateError(msg, lang),
    dir: (lang === "ar" ? "rtl" : "ltr") as "rtl" | "ltr",
  };
}
