import { createFileRoute, Link } from "@tanstack/react-router";
import { useLang } from "@/i18n/use-lang";
import { LangSwitcher } from "@/i18n/LangSwitcher";
import { ArrowLeft, ArrowRight, MessageCircle, Mail, Clock } from "lucide-react";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

const WHATSAPP = "https://wa.me/212644411059";
const EMAIL = "mailto:contact@jibirahti.com";

type Lang = "fr" | "ar";
const C: Record<Lang, {
  title: string; subtitle: string; desc: string;
  whatsappLabel: string; emailLabel: string;
  availTitle: string; availDesc: string;
  activationTitle: string; activationDesc: string;
  supportTitle: string; supportDesc: string;
  backHome: string; privacyLink: string; termsLink: string; contactLink: string;
  rights: string;
}> = {
  fr: {
    title: "Nous contacter",
    subtitle: "Nous sommes là pour vous aider.",
    desc: "Pour les codes d'activation, l'assistance technique ou toute autre question, contactez-nous directement via WhatsApp ou par email.",
    whatsappLabel: "WhatsApp: +212 644411059",
    emailLabel: "contact@jibirahti.com",
    availTitle: "Disponibilité",
    availDesc: "Nous répondons généralement dans les 24 heures. La méthode la plus rapide reste WhatsApp.",
    activationTitle: "Codes d'activation",
    activationDesc: "Pour obtenir votre code d'activation après la période d'essai, contactez-nous sur WhatsApp. Nous vous envoyons votre code dès confirmation du paiement.",
    supportTitle: "Support technique",
    supportDesc: "Pour tout problème technique, bug ou question sur l'utilisation de l'application, décrivez votre problème par message WhatsApp ou email.",
    backHome: "Retour à l'accueil",
    privacyLink: "Confidentialité",
    termsLink: "Conditions",
    contactLink: "Contact",
    rights: "Tous droits réservés.",
  },
  ar: {
    title: "اتصل بنا",
    subtitle: "نحن هنا للمساعدة.",
    desc: "للحصول على رموز التفعيل، الدعم التقني أو أي استفسار، تواصل معنا مباشرة عبر واتساب أو البريد الإلكتروني.",
    whatsappLabel: "واتساب: 212644411059+",
    emailLabel: "contact@jibirahti.com",
    availTitle: "وقت الاستجابة",
    availDesc: "نرد عادةً في غضون 24 ساعة. أسرع طريقة هي واتساب.",
    activationTitle: "رموز التفعيل",
    activationDesc: "للحصول على رمز التفعيل بعد فترة التجربة، تواصل معنا على واتساب. نرسل الرمز فور تأكيد الدفع.",
    supportTitle: "الدعم التقني",
    supportDesc: "لأي مشكلة تقنية أو خلل أو سؤال حول استخدام التطبيق، اشرح مشكلتك عبر واتساب أو البريد الإلكتروني.",
    backHome: "العودة إلى الصفحة الرئيسية",
    privacyLink: "الخصوصية",
    termsLink: "الشروط",
    contactLink: "اتصل بنا",
    rights: "جميع الحقوق محفوظة.",
  },
};

function ContactPage() {
  const { lang, setLang } = useLang();
  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const font = isAr ? "'Cairo', sans-serif" : "'Poppins', sans-serif";
  const t = C[isAr ? "ar" : "fr"];
  const BackArrow = isAr ? ArrowRight : ArrowLeft;

  return (
    <div dir={dir} style={{ fontFamily: font }} className="min-h-screen bg-background text-foreground">

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-border/30 backdrop-blur-xl"
        style={{ background: "rgba(245,251,249,0.92)" }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/icon-192.png" alt="JIBI RAHTI" className="h-7 w-7 rounded-lg shadow-sm" />
            <span className="text-sm font-extrabold tracking-tight">
              <span style={{ color: "#0F766E" }}>JIBI </span>
              <span style={{ color: "#F59E0B" }}>RAHTI</span>
            </span>
          </Link>
          <LangSwitcher lang={lang} setLang={setLang} />
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 pb-16">

        {/* Back */}
        <Link to="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <BackArrow className="h-3.5 w-3.5" />
          {t.backHome}
        </Link>

        {/* Page header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center shadow-sm"
            style={{ background: "linear-gradient(135deg,#0F8B7E,#4CD4B0)" }}>
            <MessageCircle className="h-6 w-6 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground leading-tight">{t.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
          </div>
        </div>

        {/* Intro */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-6 px-1">{t.desc}</p>

        {/* Primary contact buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2.5 rounded-2xl px-5 py-4 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "#25D366" }}>
            <MessageCircle className="h-5 w-5 shrink-0" />
            {t.whatsappLabel}
          </a>
          <a href={EMAIL}
            className="flex-1 flex items-center justify-center gap-2.5 rounded-2xl border-2 border-primary px-5 py-4 text-sm font-bold text-primary hover:bg-primary/5 active:scale-[0.98] transition-all"
            style={{ background: "rgba(255,255,255,0.8)" }}>
            <Mail className="h-5 w-5 shrink-0" />
            {t.emailLabel}
          </a>
        </div>

        {/* Info cards */}
        <div className="space-y-3">
          {/* Availability */}
          <div className="rounded-2xl p-5 border border-border/40 shadow-sm flex gap-4 items-start"
            style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(10px)" }}>
            <div className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(20,184,166,0.1)" }}>
              <Clock className="h-4.5 w-4.5 h-[18px] w-[18px]" style={{ color: "#0F766E" }} strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground mb-1">{t.availTitle}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{t.availDesc}</p>
            </div>
          </div>

          {/* Activation codes */}
          <div className="rounded-2xl p-5 border border-border/40 shadow-sm flex gap-4 items-start"
            style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(10px)" }}>
            <div className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(245,158,11,0.1)" }}>
              <MessageCircle className="h-[18px] w-[18px]" style={{ color: "#D97706" }} strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground mb-1">{t.activationTitle}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{t.activationDesc}</p>
            </div>
          </div>

          {/* Technical support */}
          <div className="rounded-2xl p-5 border border-border/40 shadow-sm flex gap-4 items-start"
            style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(10px)" }}>
            <div className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(37,99,235,0.08)" }}>
              <Mail className="h-[18px] w-[18px]" style={{ color: "#2563EB" }} strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground mb-1">{t.supportTitle}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{t.supportDesc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Page footer */}
      <footer className="border-t border-border/30 px-4 py-6"
        style={{ background: "linear-gradient(135deg,#0F1F1E 0%,#162524 100%)" }}>
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-3">
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link to="/privacy" className="text-xs text-white/50 hover:text-white/80 transition-colors">{t.privacyLink}</Link>
            <span className="text-white/20 text-xs">·</span>
            <Link to="/terms" className="text-xs text-white/50 hover:text-white/80 transition-colors">{t.termsLink}</Link>
            <span className="text-white/20 text-xs">·</span>
            <Link to="/contact" className="text-xs text-white/80 font-semibold">{t.contactLink}</Link>
          </div>
          <p className="text-xs text-white/30">© {new Date().getFullYear()} JIBI RAHTI — {t.rights}</p>
        </div>
      </footer>
    </div>
  );
}
