import { createFileRoute, Link } from "@tanstack/react-router";
import { useLang } from "@/i18n/use-lang";
import { LangSwitcher } from "@/i18n/LangSwitcher";
import { ArrowLeft, ArrowRight, MessageCircle, Mail, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

const WHATSAPP = "https://wa.me/212644411059";
const EMAIL = "mailto:contact@jibirahti.com";

type Lang = "fr" | "ar";
const C: Record<Lang, {
  title: string; subtitle: string; updated: string;
  sections: { title: string; body: string }[];
  contactTitle: string; contactDesc: string;
  backHome: string; privacyLink: string; termsLink: string; contactLink: string;
  rights: string;
}> = {
  fr: {
    title: "Politique de Confidentialité",
    subtitle: "Votre vie privée est notre priorité.",
    updated: "Dernière mise à jour : juin 2025",
    sections: [
      {
        title: "Données stockées",
        body: "JIBI RAHTI utilise Supabase pour stocker vos informations de compte (email, préférences de langue, paramètres) de manière sécurisée et chiffrée dans le cloud.",
      },
      {
        title: "Vos données vous appartiennent",
        body: "Vos données financières — revenus, dépenses, épargne et rapports — vous appartiennent exclusivement. Nous n'y accédons pas, ne les analysons pas et ne les partageons pas.",
      },
      {
        title: "Utilisation des données",
        body: "Vos données sont utilisées uniquement pour vous fournir les fonctionnalités de gestion de budget, de suivi des dépenses et de génération de rapports au sein de l'application.",
      },
      {
        title: "Nous ne vendons pas vos données",
        body: "JIBI RAHTI ne vend, ne loue et ne partage jamais vos données personnelles ou financières avec des tiers, des annonceurs ou des partenaires commerciaux.",
      },
      {
        title: "Suppression de compte",
        body: "Vous pouvez demander la suppression complète de votre compte et de toutes vos données à tout moment en nous contactant via WhatsApp ou par email.",
      },
    ],
    contactTitle: "Nous contacter",
    contactDesc: "Pour toute question relative à votre vie privée ou pour demander la suppression de vos données, contactez-nous directement.",
    backHome: "Retour à l'accueil",
    privacyLink: "Confidentialité",
    termsLink: "Conditions",
    contactLink: "Contact",
    rights: "Tous droits réservés.",
  },
  ar: {
    title: "سياسة الخصوصية",
    subtitle: "خصوصيتك أولويتنا.",
    updated: "آخر تحديث: يونيو 2025",
    sections: [
      {
        title: "البيانات المخزنة",
        body: "تستخدم جيبي راحتي Supabase لتخزين معلومات حسابك (البريد الإلكتروني، تفضيلات اللغة، الإعدادات) بشكل آمن ومشفر في السحابة.",
      },
      {
        title: "بياناتك ملكك",
        body: "بياناتك المالية — الدخل، النفقات، المدخرات والتقارير — تخصك حصرياً. لا نصل إليها ولا نحللها ولا نشاركها.",
      },
      {
        title: "استخدام البيانات",
        body: "تُستخدم بياناتك فقط لتزويدك بميزات إدارة الميزانية وتتبع النفقات وإنشاء التقارير داخل التطبيق.",
      },
      {
        title: "لا نبيع بياناتك",
        body: "لا تبيع جيبي راحتي ولا تؤجر ولا تشارك بياناتك الشخصية أو المالية مع أي طرف ثالث أو معلن أو شريك تجاري.",
      },
      {
        title: "حذف الحساب",
        body: "يمكنك طلب الحذف الكامل لحسابك وجميع بياناتك في أي وقت عبر التواصل معنا على واتساب أو البريد الإلكتروني.",
      },
    ],
    contactTitle: "تواصل معنا",
    contactDesc: "لأي استفسار يتعلق بخصوصيتك أو لطلب حذف بياناتك، تواصل معنا مباشرة.",
    backHome: "العودة إلى الصفحة الرئيسية",
    privacyLink: "الخصوصية",
    termsLink: "الشروط",
    contactLink: "اتصل بنا",
    rights: "جميع الحقوق محفوظة.",
  },
};

function PrivacyPage() {
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
            <ShieldCheck className="h-6 w-6 text-white" strokeWidth={1.8} />
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
            <Link to="/privacy" className="text-xs text-white/80 font-semibold">{t.privacyLink}</Link>
            <span className="text-white/20 text-xs">·</span>
            <Link to="/terms" className="text-xs text-white/50 hover:text-white/80 transition-colors">{t.termsLink}</Link>
            <span className="text-white/20 text-xs">·</span>
            <Link to="/contact" className="text-xs text-white/50 hover:text-white/80 transition-colors">{t.contactLink}</Link>
          </div>
          <p className="text-xs text-white/30">© {new Date().getFullYear()} JIBI RAHTI — {t.rights}</p>
        </div>
      </footer>
    </div>
  );
}
