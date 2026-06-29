import { createFileRoute, Link } from "@tanstack/react-router";
import { useLang } from "@/i18n/use-lang";
import { LangSwitcher } from "@/i18n/LangSwitcher";
import { ArrowLeft, ArrowRight, MessageCircle, Mail, ScrollText } from "lucide-react";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

const WHATSAPP = "https://wa.me/212644411059";
const EMAIL = "mailto:contact@jibirahti.com";

type Lang = "fr" | "ar" | "en";
const C: Record<Lang, {
  title: string; subtitle: string; updated: string;
  sections: { title: string; body: string }[];
  contactTitle: string; contactDesc: string;
  backHome: string; privacyLink: string; termsLink: string; contactLink: string;
  rights: string;
}> = {
  fr: {
    title: "Conditions d'Utilisation",
    subtitle: "En utilisant JIBI RAHTI, vous acceptez ces conditions.",
    updated: "Dernière mise à jour : juin 2025",
    sections: [
      {
        title: "À propos de l'application",
        body: "JIBI RAHTI est une application de gestion budgétaire et de suivi des dépenses personnelles. Elle est destinée à un usage individuel et personnel.",
      },
      {
        title: "Responsabilité de l'utilisateur",
        body: "Vous êtes seul responsable de l'exactitude des informations que vous saisissez dans l'application. JIBI RAHTI ne peut être tenu responsable des erreurs de saisie ou des décisions financières prises sur la base des données affichées.",
      },
      {
        title: "Codes d'activation",
        body: "Les codes d'activation sont strictement personnels et nominatifs. Il est interdit de les partager, de les céder ou de les revendre. Tout abus sera sanctionné par la suspension du compte.",
      },
      {
        title: "Service fourni tel quel",
        body: "L'application est fournie « telle quelle » sans garantie de disponibilité continue. Nous nous réservons le droit de modifier, suspendre ou interrompre le service à tout moment, avec ou sans préavis.",
      },
      {
        title: "Suspension de compte",
        body: "Tout abus, fraude, tentative d'accès non autorisé ou violation des présentes conditions peut entraîner la suspension immédiate et définitive du compte, sans remboursement.",
      },
    ],
    contactTitle: "Questions sur les conditions ?",
    contactDesc: "Pour toute question relative aux conditions d'utilisation, contactez-nous directement via WhatsApp ou par email.",
    backHome: "Retour à l'accueil",
    privacyLink: "Confidentialité",
    termsLink: "Conditions",
    contactLink: "Contact",
    rights: "Tous droits réservés.",
  },
  ar: {
    title: "شروط الاستخدام",
    subtitle: "باستخدامك لجيبي راحتي، فإنك توافق على هذه الشروط.",
    updated: "آخر تحديث: يونيو 2025",
    sections: [
      {
        title: "عن التطبيق",
        body: "جيبي راحتي هو تطبيق لإدارة الميزانية الشخصية وتتبع النفقات. مخصص للاستخدام الفردي الشخصي.",
      },
      {
        title: "مسؤولية المستخدم",
        body: "أنت وحدك المسؤول عن دقة المعلومات التي تدخلها في التطبيق. لا تتحمل جيبي راحتي المسؤولية عن أخطاء الإدخال أو القرارات المالية المتخذة بناءً على البيانات المعروضة.",
      },
      {
        title: "رموز التفعيل",
        body: "رموز التفعيل شخصية للغاية وغير قابلة للتحويل. يُحظر مشاركتها أو التنازل عنها أو إعادة بيعها. سيُعاقب على أي إساءة بتعليق الحساب.",
      },
      {
        title: "الخدمة كما هي",
        body: "يُقدَّم التطبيق «كما هو» دون ضمان التوفر المستمر. نحتفظ بالحق في تعديل الخدمة أو تعليقها أو إيقافها في أي وقت، مع إشعار مسبق أو بدونه.",
      },
      {
        title: "تعليق الحساب",
        body: "أي إساءة أو احتيال أو محاولة وصول غير مصرح بها أو انتهاك لهذه الشروط قد تؤدي إلى تعليق الحساب فوراً ونهائياً، دون استرداد.",
      },
    ],
    contactTitle: "أسئلة حول الشروط؟",
    contactDesc: "لأي استفسار يتعلق بشروط الاستخدام، تواصل معنا مباشرة عبر واتساب أو البريد الإلكتروني.",
    backHome: "العودة إلى الصفحة الرئيسية",
    privacyLink: "الخصوصية",
    termsLink: "الشروط",
    contactLink: "اتصل بنا",
    rights: "جميع الحقوق محفوظة.",
  },
  en: {
    title: "Terms of Use",
    subtitle: "By using JIBI RAHTI, you agree to these terms.",
    updated: "Last updated: June 2025",
    sections: [
      {
        title: "About the app",
        body: "JIBI RAHTI is a personal budget management and expense tracking app. It is intended for individual, personal use.",
      },
      {
        title: "User responsibility",
        body: "You are solely responsible for the accuracy of the information you enter into the app. JIBI RAHTI cannot be held liable for data-entry errors or financial decisions made based on the displayed data.",
      },
      {
        title: "Activation codes",
        body: "Activation codes are strictly personal and non-transferable. Sharing, transferring, or reselling them is prohibited. Any abuse will result in account suspension.",
      },
      {
        title: "Service provided as is",
        body: "The app is provided \"as is\" without guarantee of continuous availability. We reserve the right to modify, suspend, or discontinue the service at any time, with or without notice.",
      },
      {
        title: "Account suspension",
        body: "Any abuse, fraud, unauthorized access attempt, or violation of these terms may result in immediate and permanent account suspension, without refund.",
      },
    ],
    contactTitle: "Questions about the terms?",
    contactDesc: "For any question regarding the terms of use, contact us directly via WhatsApp or email.",
    backHome: "Back to home",
    privacyLink: "Privacy",
    termsLink: "Terms",
    contactLink: "Contact",
    rights: "All rights reserved.",
  },
};

function TermsPage() {
  const { lang, setLang } = useLang();
  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const font = isAr ? "'Cairo', sans-serif" : "'Poppins', sans-serif";
  const t = C[lang];
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
            <ScrollText className="h-6 w-6 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground leading-tight">{t.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{t.updated}</p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {t.sections.map((s, i) => (
            <div key={i}
              className="rounded-2xl p-5 border border-border/40 shadow-sm"
              style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(10px)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-5 w-5 rounded-full text-[10px] font-extrabold text-white flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg,#0F8B7E,#4CD4B0)" }}>
                  {i + 1}
                </span>
                <h2 className="text-sm font-bold text-foreground">{s.title}</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        {/* Contact block */}
        <div className="mt-8 rounded-2xl p-6 border border-border/40 shadow-sm text-center"
          style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(10px)" }}>
          <h3 className="text-sm font-bold text-foreground mb-2">{t.contactTitle}</h3>
          <p className="text-xs text-muted-foreground mb-5 max-w-sm mx-auto">{t.contactDesc}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: "#25D366" }}>
              <MessageCircle className="h-4 w-4" />
              WhatsApp: +212 644411059
            </a>
            <a href={EMAIL}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-primary px-5 py-2.5 text-sm font-bold text-primary hover:bg-primary/5 active:scale-[0.98] transition-all">
              <Mail className="h-4 w-4" />
              contact@jibirahti.com
            </a>
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
            <Link to="/terms" className="text-xs text-white/80 font-semibold">{t.termsLink}</Link>
            <span className="text-white/20 text-xs">·</span>
            <Link to="/contact" className="text-xs text-white/50 hover:text-white/80 transition-colors">{t.contactLink}</Link>
          </div>
          <p className="text-xs text-white/30">© {new Date().getFullYear()} JIBI RAHTI — {t.rights}</p>
        </div>
      </footer>
    </div>
  );
}
