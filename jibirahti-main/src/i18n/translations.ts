import { translations } from "./use-lang";

export type Lang = "fr" | "ar" | "en";

export const LANG_KEY = "jibi_lang";

export function getLang(): Lang {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v === "ar" || v === "fr" || v === "en") return v;
  } catch {}
  return "fr";
}

export function applyLangToDOM(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  } catch {}
}

// Maps Supabase/auth error substrings to localized messages
const AUTH_ERRORS: Array<{ match: string; fr: string; ar: string; en: string }> = [
  {
    match: "invalid login credentials",
    fr: "Identifiants incorrects",
    ar: "بيانات تسجيل الدخول غير صحيحة",
    en: "Incorrect credentials",
  },
  {
    match: "email rate limit exceeded",
    fr: "Limite d'envoi d'emails atteinte",
    ar: "تم تجاوز الحد المسموح لإرسال الرسائل",
    en: "Email sending limit reached",
  },
  {
    match: "auth session missing",
    fr: "Session d'authentification introuvable",
    ar: "جلسة المصادقة غير متوفرة",
    en: "Authentication session not found",
  },
  {
    match: "user already registered",
    fr: "Cet email est déjà utilisé",
    ar: "هذا البريد الإلكتروني مستخدم بالفعل",
    en: "This email is already in use",
  },
  {
    match: "email already in use",
    fr: "Cet email est déjà utilisé",
    ar: "هذا البريد الإلكتروني مستخدم بالفعل",
    en: "This email is already in use",
  },
  {
    match: "email already registered",
    fr: "Cet email est déjà utilisé",
    ar: "هذا البريد الإلكتروني مستخدم بالفعل",
    en: "This email is already in use",
  },
  {
    match: "password should be at least 6",
    fr: "Le mot de passe doit contenir au moins 6 caractères",
    ar: "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل",
    en: "The password must be at least 6 characters",
  },
  {
    match: "unable to validate email",
    fr: "Format d'email invalide",
    ar: "صيغة البريد الإلكتروني غير صالحة",
    en: "Invalid email format",
  },
  {
    match: "email not confirmed",
    fr: "Email non confirmé. Vérifiez votre boîte de réception.",
    ar: "لم يتم تأكيد البريد الإلكتروني. تحقق من صندوق الوارد.",
    en: "Email not confirmed. Check your inbox.",
  },
  {
    match: "for security purposes",
    fr: "Pour des raisons de sécurité, veuillez réessayer plus tard.",
    ar: "لأسباب أمنية، يرجى المحاولة لاحقاً.",
    en: "For security reasons, please try again later.",
  },
  {
    match: "token has expired",
    fr: "Ce lien a expiré. Demandez un nouveau lien.",
    ar: "انتهت صلاحية هذا الرابط. اطلب رابطاً جديداً.",
    en: "This link has expired. Request a new one.",
  },
];

export function translateError(msg: string, lang: Lang): string {
  const lower = msg.toLowerCase();
  const found = AUTH_ERRORS.find((e) => lower.includes(e.match));
  return found ? found[lang] : msg;
}

export function tr(lang: Lang, key: string): string {
  return translations[lang][key] ?? translations.fr[key] ?? key;
}
