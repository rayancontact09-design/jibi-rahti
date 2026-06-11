import type { Lang } from "./translations";

export function LangSwitcher({
  lang,
  setLang,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-xl bg-accent/40 p-0.5">
      {(["fr", "ar"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={`px-3 py-1 rounded-[10px] text-xs font-bold transition-all ${
            lang === l
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {l === "fr" ? "FR" : "AR"}
        </button>
      ))}
    </div>
  );
}
