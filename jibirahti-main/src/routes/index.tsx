import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/i18n/use-lang";
import { LangSwitcher } from "@/i18n/LangSwitcher";
import {
  TrendingUp, PiggyBank, FileText, Bell, Smartphone,
  Receipt, ChevronDown, ChevronUp, MessageCircle, Check, Shield, User,
} from "lucide-react";
import { trackAppInstallClicked } from "@/lib/analytics";
import { WHATSAPP_ACTIVATION_URL } from "@/lib/whatsapp";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

// ── Bilingual content ──────────────────────────────────────────────────────────

type Lang = "fr" | "ar";

const T: Record<Lang, Record<string, string>> = {
  fr: {
    navFeatures: "Fonctionnalités",
    navHow: "Comment ça marche",
    navPricing: "Abonnement",
    navFaq: "FAQ",
    navLogin: "Se connecter",
    heroLine1: "Gérez votre budget",
    heroLine2: "simplement et intelligemment",
    heroDesc:
      "JIBI RAHTI vous aide à suivre vos dépenses, épargner intelligemment et atteindre vos objectifs financiers — directement depuis votre téléphone.",
    heroCta1: "Commencer gratuitement",
    heroCta2: "Installer l'application",
    heroNote: "✨ Essai gratuit de 2 heures pour découvrir l'application",
    heroBadge: "Disponible gratuitement maintenant",
    trialBadge: "✨ Essai gratuit de 2 heures pour découvrir l'application",
    priceMonthlyLabel: "Abonnement mensuel",
    priceMonthlyValue: "💰 30 DH / mois",
    priceYearlyLabel: "Abonnement annuel",
    priceYearlyValue: "💰 200 DH / an",
    whatsappActivationFast: "Activation rapide via WhatsApp",
    featTitle: "Tout ce dont vous avez besoin",
    featSub: "Des outils simples et puissants pour maîtriser vos finances personnelles",
    f1t: "Gestion des dépenses",
    f1d: "Enregistrez et catégorisez chaque dépense en quelques secondes.",
    f2t: "Revenus supplémentaires",
    f2d: "Ajoutez plusieurs sources de revenus pour un suivi précis.",
    f3t: "Épargne et objectifs",
    f3d: "Définissez vos objectifs et suivez votre progression chaque mois.",
    f4t: "Rapports PDF",
    f4d: "Exportez des rapports détaillés et partagez-les en un seul clic.",
    f5t: "Notifications intelligentes",
    f5d: "Alertes budget dépassé et rappels d'expiration en temps réel.",
    f6t: "Application installable",
    f6d: "Installez JIBI RAHTI sur votre téléphone comme une vraie application.",
    howTitle: "Comment ça marche ?",
    howSub: "Commencez à gérer vos finances en 4 étapes simples",
    h1t: "Créer un compte",
    h1d: "Inscrivez-vous gratuitement en moins d'une minute.",
    h2t: "Essai gratuit de 2 heures",
    h2d: "Explorez toutes les fonctionnalités sans engagement ni carte bancaire.",
    h3t: "Activer avec un code",
    h3d: "Obtenez votre code d'activation via WhatsApp et activez votre compte.",
    h4t: "Suivre son budget",
    h4d: "Gérez vos finances, atteignez vos objectifs et épargnez intelligemment.",
    planTitle: "Un abonnement simple et transparent",
    planSub: "Aucune carte bancaire requise pour commencer votre essai gratuit",
    p1t: "Essai gratuit",
    p1d: "2 heures pour tester toutes les fonctionnalités sans engagement.",
    p2t: "Activation par code",
    p2d: "Recevez votre code d'activation unique via WhatsApp après paiement.",
    p3t: "Renouvellement facile",
    p3d: "Renouvelez votre abonnement (30 DH/mois ou 200 DH/an) directement via WhatsApp.",
    ctaWhatsapp: "Contacter sur WhatsApp",
    planCta: "Commencer l'essai gratuit",
    planCtaSub: "2 heures gratuites, puis contactez-nous via WhatsApp",
    faqTitle: "Questions fréquentes",
    faqSub: "Tout ce que vous devez savoir avant de commencer",
    q1q: "Comment installer l'application sur mon téléphone ?",
    q1a: "Ouvrez le site dans Chrome (Android) ou Safari (iPhone). Vous verrez apparaître une bannière « Ajouter à l'écran d'accueil » ou cliquez sur le bouton « Installer l'application ». L'application s'installera comme une application native.",
    q2q: "Comment obtenir un code d'activation ?",
    q2a: "Après votre essai gratuit de 2 heures, contactez-nous sur WhatsApp au +212 644411059 pour activer votre abonnement (30 DH/mois ou 200 DH/an). Nous vous enverrons votre code d'activation après confirmation du paiement.",
    q3q: "Comment exporter mon rapport en PDF ?",
    q3a: "Dans la section Rapport, appuyez sur le bouton « Exporter PDF ». Le rapport est généré avec toutes vos données du mois et téléchargé directement sur votre appareil.",
    q4q: "Mes données financières sont-elles sécurisées ?",
    q4a: "Oui, absolument. Toutes vos données sont chiffrées et stockées de manière sécurisée dans le cloud via Supabase. Vous pouvez accéder à vos données depuis n'importe quel appareil.",
    q5q: "L'application fonctionne-t-elle sans connexion internet ?",
    q5a: "JIBI RAHTI est une Progressive Web App (PWA). Vous pouvez consulter vos données enregistrées hors ligne. La synchronisation avec le cloud s'effectue automatiquement à la reconnexion.",
    footerTagline: "Gérez votre budget en toute sérénité.",
    footerRights: "Tous droits réservés.",
  },
  ar: {
    navFeatures: "المميزات",
    navHow: "كيف يعمل",
    navPricing: "الاشتراك",
    navFaq: "الأسئلة",
    navLogin: "تسجيل الدخول",
    heroLine1: "أدِّر ميزانيتك",
    heroLine2: "ببساطة وذكاء",
    heroDesc:
      "جيبي راحتي يساعدك على تتبع نفقاتك، الادخار بذكاء وتحقيق أهدافك المالية — مباشرة من هاتفك.",
    heroCta1: "ابدأ مجاناً",
    heroCta2: "تثبيت التطبيق",
    heroNote: "✨ تجربة مجانية لمدة ساعتين لاكتشاف التطبيق",
    heroBadge: "متاح الآن مجاناً",
    trialBadge: "✨ تجربة مجانية لمدة ساعتين لاكتشاف التطبيق",
    priceMonthlyLabel: "اشتراك شهري",
    priceMonthlyValue: "💰 30 درهم / شهرياً",
    priceYearlyLabel: "اشتراك سنوي",
    priceYearlyValue: "💰 200 درهم / سنوياً",
    whatsappActivationFast: "تفعيل سريع عبر واتساب",
    featTitle: "كل ما تحتاجه",
    featSub: "أدوات بسيطة وقوية للتحكم الكامل في أموالك الشخصية",
    f1t: "إدارة النفقات",
    f1d: "سجّل وصنّف كل نفقة في ثوانٍ معدودة.",
    f2t: "دخل إضافي",
    f2d: "أضف مصادر دخل متعددة لتتبع دقيق وشامل.",
    f3t: "الادخار والأهداف",
    f3d: "حدد أهدافك المالية وتابع تقدمك شهراً بشهر.",
    f4t: "تقارير PDF",
    f4d: "صدّر تقارير مفصلة وشاركها بنقرة واحدة.",
    f5t: "إشعارات ذكية",
    f5d: "تنبيهات تجاوز الميزانية وتذكيرات انتهاء الاشتراك.",
    f6t: "تطبيق قابل للتثبيت",
    f6d: "ثبّت جيبي راحتي على هاتفك كتطبيق أصيل.",
    howTitle: "كيف يعمل؟",
    howSub: "ابدأ في إدارة أموالك في 4 خطوات بسيطة",
    h1t: "إنشاء حساب",
    h1d: "سجّل مجاناً في أقل من دقيقة واحدة.",
    h2t: "تجربة مجانية لمدة ساعتين",
    h2d: "استكشف جميع الميزات دون التزام أو بطاقة بنكية.",
    h3t: "التفعيل برمز",
    h3d: "احصل على رمز التفعيل عبر واتساب وفعّل حسابك.",
    h4t: "تتبع الميزانية",
    h4d: "أدر أموالك، حقق أهدافك وادخر بذكاء.",
    planTitle: "اشتراك بسيط وشفاف",
    planSub: "لا حاجة لبطاقة بنكية لبدء تجربتك المجانية",
    p1t: "تجربة مجانية",
    p1d: "ساعتان كاملتان لاختبار جميع الميزات دون أي التزام.",
    p2t: "التفعيل برمز",
    p2d: "استلم رمز التفعيل الخاص بك عبر واتساب بعد الدفع.",
    p3t: "تجديد سهل",
    p3d: "جدّد اشتراكك (30 درهم/شهرياً أو 200 درهم/سنوياً) مباشرة عبر واتساب.",
    ctaWhatsapp: "تواصل عبر واتساب",
    planCta: "ابدأ التجربة المجانية",
    planCtaSub: "ساعتان مجانتان، ثم تواصل معنا عبر واتساب",
    faqTitle: "الأسئلة الشائعة",
    faqSub: "كل ما تحتاج معرفته قبل البدء",
    q1q: "كيف أثبّت التطبيق على هاتفي؟",
    q1a: "افتح الموقع في Chrome (أندرويد) أو Safari (آيفون). ستظهر بانر «إضافة إلى الشاشة الرئيسية» أو انقر على زر «تثبيت التطبيق». سيُثبَّت التطبيق كتطبيق أصيل.",
    q2q: "كيف أحصل على رمز التفعيل؟",
    q2a: "بعد انتهاء تجربتك المجانية لمدة ساعتين، تواصل معنا على واتساب 212644411059+ لتفعيل اشتراكك (30 درهم/شهرياً أو 200 درهم/سنوياً). سنرسل لك رمز التفعيل بعد تأكيد الدفع.",
    q3q: "كيف أصدّر تقريري بصيغة PDF؟",
    q3a: "في قسم التقرير، انقر على زر «تصدير PDF». يتم إنشاء التقرير بجميع بيانات الشهر وتنزيله مباشرة على جهازك.",
    q4q: "هل بياناتي المالية آمنة؟",
    q4a: "نعم، تماماً. جميع بياناتك مشفرة ومحفوظة بأمان في السحابة عبر Supabase. يمكنك الوصول إليها من أي جهاز.",
    q5q: "هل يعمل التطبيق بدون اتصال إنترنت؟",
    q5a: "جيبي راحتي هو تطبيق ويب تقدمي (PWA). يمكنك عرض بياناتك المحفوظة بدون إنترنت، وتتم المزامنة تلقائياً عند إعادة الاتصال.",
    footerTagline: "أدِّر ميزانيتك بكل راحة.",
    footerRights: "جميع الحقوق محفوظة.",
  },
};

// ── Main landing page ──────────────────────────────────────────────────────────

function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { lang, setLang } = useLang();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const font = isAr ? "'Cairo', sans-serif" : "'Poppins', sans-serif";
  const C = T[isAr ? "ar" : "fr"];

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  const handleInstall = async () => {
    trackAppInstallClicked();
    const evt = window.__pwaPrompt;
    if (evt) await evt.prompt();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const features = [
    { icon: Receipt,    title: C.f1t, desc: C.f1d, color: "#0F766E" },
    { icon: TrendingUp, title: C.f2t, desc: C.f2d, color: "#059669" },
    { icon: PiggyBank,  title: C.f3t, desc: C.f3d, color: "#0D9488" },
    { icon: FileText,   title: C.f4t, desc: C.f4d, color: "#7C3AED" },
    { icon: Bell,       title: C.f5t, desc: C.f5d, color: "#D97706" },
    { icon: Smartphone, title: C.f6t, desc: C.f6d, color: "#2563EB" },
  ];

  const steps = [
    { n: "1", title: C.h1t, desc: C.h1d, icon: User },
    { n: "2", title: C.h2t, desc: C.h2d, icon: Shield },
    { n: "3", title: C.h3t, desc: C.h3d, icon: MessageCircle },
    { n: "4", title: C.h4t, desc: C.h4d, icon: TrendingUp },
  ];

  const plans = [
    { icon: Shield,        title: C.p1t, desc: C.p1d },
    { icon: MessageCircle, title: C.p2t, desc: C.p2d },
    { icon: Check,         title: C.p3t, desc: C.p3d },
  ];

  const faqs = [
    { q: C.q1q, a: C.q1a },
    { q: C.q2q, a: C.q2a },
    { q: C.q3q, a: C.q3a },
    { q: C.q4q, a: C.q4a },
    { q: C.q5q, a: C.q5a },
  ];

  return (
    <div dir={dir} style={{ fontFamily: font }} className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <style>{`
        html { scroll-behavior: smooth; }
        .section-anchor { scroll-margin-top: 72px; }
      `}</style>

      {/* Ambient blobs */}
      <div aria-hidden className="pointer-events-none fixed -top-32 -right-28 h-96 w-96 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, #4CD4B0 0%, transparent 70%)" }} />
      <div aria-hidden className="pointer-events-none fixed top-1/2 -left-28 h-80 w-80 rounded-full opacity-15 blur-3xl"
        style={{ background: "radial-gradient(circle, #1FAF8B 0%, transparent 70%)" }} />
      <div aria-hidden className="pointer-events-none fixed bottom-0 right-1/3 h-64 w-64 rounded-full opacity-10 blur-3xl"
        style={{ background: "radial-gradient(circle, #F59E0B 0%, transparent 70%)" }} />

      {/* ── Sticky Nav ───────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 w-full border-b border-border/30 backdrop-blur-xl"
        style={{ background: "rgba(245,251,249,0.85)" }}>
        <div className="max-w-5xl mx-auto px-4 h-[60px] flex items-center justify-between gap-4">

          {/* Official logo */}
          <a href="#hero" className="flex items-center gap-2 shrink-0">
            <img src="/icon-192.png" alt="JIBI RAHTI" className="h-8 w-8 rounded-xl shadow-sm" />
            <span className="text-base font-extrabold tracking-tight">
              <span style={{ color: "#0F766E" }}>JIBI </span>
              <span style={{ color: "#F59E0B" }}>RAHTI</span>
            </span>
          </a>

          {/* Desktop section links */}
          <div className="hidden md:flex items-center gap-5 text-sm font-medium text-muted-foreground">
            {[
              { href: "#features", label: C.navFeatures },
              { href: "#how",      label: C.navHow },
              { href: "#pricing",  label: C.navPricing },
              { href: "#faq",      label: C.navFaq },
            ].map((link) => (
              <a key={link.href} href={link.href} className="hover:text-foreground transition-colors">
                {link.label}
              </a>
            ))}
          </div>

          {/* Language switcher only */}
          <LangSwitcher lang={lang} setLang={setLang} />
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section id="hero" className="section-anchor relative px-4 pt-14 pb-16 max-w-2xl mx-auto text-center">

        {/* Official logo + name + availability badge */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <img
            src="/icon-192.png"
            alt="JIBI RAHTI"
            className="h-20 w-20 rounded-3xl shadow-elegant"
          />
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="text-2xl font-extrabold tracking-tight">
              <span style={{ color: "#0F766E" }}>JIBI </span>
              <span style={{ color: "#F59E0B" }}>RAHTI</span>
            </span>
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border"
              style={{ background: "rgba(20,184,166,0.08)", borderColor: "rgba(20,184,166,0.25)", color: "#0F766E" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-[#14b8a6] animate-pulse" />
              {C.heroBadge}
            </div>
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] mb-4">
          <span style={{ color: "#0F766E" }}>{C.heroLine1}</span>
          <br />
          <span className="text-foreground">{C.heroLine2}</span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg mx-auto">
          {C.heroDesc}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-5">
          <Link to="/register"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-bold text-white shadow-elegant transition-all hover:opacity-90 hover:shadow-lg active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg,#0F8B7E 0%,#1FAF8B 50%,#4CD4B0 100%)" }}>
            {C.heroCta1}
          </Link>
          <button type="button" onClick={handleInstall}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border-2 border-primary px-7 py-3.5 text-sm font-bold text-primary hover:bg-primary/5 active:scale-[0.98] transition-all">
            <Smartphone className="h-4 w-4 shrink-0" />
            {C.heroCta2}
          </button>
        </div>

        <p className="text-sm font-bold mb-1" style={{ color: "#0F766E" }}>{C.priceMonthlyValue}</p>
        <p className="text-xs text-muted-foreground">{C.heroNote}</p>

        <div className="flex items-center justify-center gap-5 mt-8 flex-wrap">
          {[
            { icon: Shield,     label: isAr ? "بيانات مشفرة"     : "Données chiffrées" },
            { icon: Check,      label: isAr ? "بدون إعلانات"      : "Sans publicités" },
            { icon: Smartphone, label: isAr ? "يعمل بدون إنترنت" : "Mode hors-ligne" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="h-3.5 w-3.5 text-primary" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="section-anchor px-4 py-16"
        style={{ background: "linear-gradient(180deg,#f5fbf9 0%,#edfaf7 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3" style={{ color: "#0F766E" }}>{C.featTitle}</h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">{C.featSub}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title}
                className="flex gap-4 rounded-2xl p-5 border border-border/40 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(10px)" }}>
                <div className="h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center shadow-sm"
                  style={{ background: `${color}18` }}>
                  <Icon className="h-5 w-5" style={{ color }} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section id="how" className="section-anchor px-4 py-16"
        style={{ background: "linear-gradient(180deg,#edfaf7 0%,#f5fbf9 100%)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3" style={{ color: "#0F766E" }}>{C.howTitle}</h2>
            <p className="text-muted-foreground text-sm sm:text-base">{C.howSub}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {steps.map(({ n, title, desc, icon: Icon }, i) => (
              <div key={n}
                className="relative flex gap-4 rounded-2xl p-5 border border-border/40 shadow-sm"
                style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(10px)" }}>
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <div className="h-10 w-10 rounded-2xl flex items-center justify-center font-extrabold text-white text-sm shadow-sm"
                    style={{ background: "linear-gradient(135deg,#0F8B7E,#4CD4B0)" }}>
                    {n}
                  </div>
                  <Icon className="h-3.5 w-3.5 text-primary/60" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
                {i % 2 === 0 && (
                  <div className={`absolute top-1/2 ${isAr ? "-left-3" : "-right-3"} hidden sm:block w-6 h-px bg-border`} />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link to="/register"
              className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold text-white shadow-elegant transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg,#0F8B7E,#4CD4B0)" }}>
              {C.heroCta1}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Subscription ─────────────────────────────────────────────────── */}
      <section id="pricing" className="section-anchor px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">{C.planTitle}</h2>
            <p className="text-muted-foreground text-sm sm:text-base">{C.planSub}</p>
          </div>

          {/* Price cards — monthly / yearly */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {[
              { label: C.priceMonthlyLabel, value: C.priceMonthlyValue },
              { label: C.priceYearlyLabel, value: C.priceYearlyValue },
            ].map(({ label, value }) => (
              <div key={label}
                className="flex flex-col items-center text-center rounded-2xl p-6 border border-border/40 shadow-sm"
                style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(10px)" }}>
                <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
                <p className="text-2xl font-extrabold" style={{ color: "#0F766E" }}>{value}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs font-semibold mb-8" style={{ color: "#0F766E" }}>
            {C.trialBadge}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {plans.map(({ icon: Icon, title, desc }) => (
              <div key={title}
                className="flex flex-col items-center text-center rounded-2xl p-6 border border-border/40 shadow-sm"
                style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(10px)" }}>
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center mb-3 shadow-sm"
                  style={{ background: "rgba(20,184,166,0.1)" }}>
                  <Icon className="h-6 w-6" style={{ color: "#0F766E" }} strokeWidth={1.8} />
                </div>
                <p className="text-sm font-bold text-foreground mb-2">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl p-7 text-center shadow-elegant"
            style={{ background: "linear-gradient(135deg,#0F8B7E 0%,#1FAF8B 50%,#34D399 100%)" }}>
            <h3 className="text-lg font-extrabold text-white mb-2">
              {isAr ? "هل أنت مستعد؟" : "Prêt à commencer ?"}
            </h3>
            <p className="text-white/80 text-sm mb-5">{C.planCtaSub}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold transition-all hover:bg-white/90 active:scale-[0.98]"
                style={{ color: "#0F766E" }}>
                {C.planCta}
              </Link>
              <a href={WHATSAPP_ACTIVATION_URL}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/50 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 active:scale-[0.98] transition-all">
                <MessageCircle className="h-4 w-4 shrink-0" />
                {C.ctaWhatsapp}
              </a>
            </div>
            <div className="flex flex-col items-center gap-1 mt-5">
              <p className="text-white text-sm font-bold">{C.priceMonthlyValue}</p>
              <p className="text-white/70 text-xs">{C.whatsappActivationFast}</p>
              <p className="text-white/70 text-xs">{C.trialBadge}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="section-anchor px-4 py-16"
        style={{ background: "linear-gradient(180deg,#f5fbf9 0%,#edfaf7 100%)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3" style={{ color: "#0F766E" }}>{C.faqTitle}</h2>
            <p className="text-muted-foreground text-sm sm:text-base">{C.faqSub}</p>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i}
                  className="rounded-2xl border border-border/40 overflow-hidden shadow-sm"
                  style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(10px)" }}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-primary/5 transition-colors"
                    style={{ direction: dir }}>
                    <span className="text-sm font-semibold text-foreground">{faq.q}</span>
                    <span className="shrink-0 text-primary">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center rounded-2xl p-6 border border-border/40"
            style={{ background: "rgba(255,255,255,0.6)" }}>
            <p className="text-sm font-semibold text-foreground mb-3">
              {isAr ? "لم تجد إجابتك؟" : "Vous avez d'autres questions ?"}
            </p>
            <a href="https://wa.me/212644411059"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: "#25D366" }}>
              <MessageCircle className="h-4 w-4" />
              WhatsApp: +212 644411059
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="px-4 py-10 border-t border-border/30"
        style={{ background: "linear-gradient(135deg,#0F1F1E 0%,#162524 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className={`flex flex-col ${isAr ? "items-end text-right" : "items-start text-left"}`}>
              <div className="flex items-center gap-2 mb-2">
                <img src="/icon-192.png" alt="JIBI RAHTI" className="h-8 w-8 rounded-xl" />
                <span className="text-base font-extrabold tracking-tight">
                  <span style={{ color: "#4CD4B0" }}>JIBI </span>
                  <span style={{ color: "#F59E0B" }}>RAHTI</span>
                </span>
              </div>
              <p className="text-xs text-white/50">{C.footerTagline}</p>
            </div>

            <div className="flex items-center gap-5">
              <a href="https://wa.me/212644411059"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors">
                <MessageCircle className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </a>
              <a href="mailto:contact@jibirahti.com"
                className="text-xs text-white/60 hover:text-white transition-colors">
                Email
              </a>
              <Link to="/login" className="text-xs text-white/60 hover:text-white transition-colors">
                {C.navLogin}
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-white/10 flex flex-col items-center gap-3">
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <Link to="/privacy" className="text-xs text-white/50 hover:text-white/70 transition-colors">
                {isAr ? "الخصوصية" : "Confidentialité"}
              </Link>
              <span className="text-white/20 text-xs">·</span>
              <Link to="/terms" className="text-xs text-white/50 hover:text-white/70 transition-colors">
                {isAr ? "الشروط" : "Conditions"}
              </Link>
              <span className="text-white/20 text-xs">·</span>
              <Link to="/contact" className="text-xs text-white/50 hover:text-white/70 transition-colors">
                {isAr ? "اتصل بنا" : "Contact"}
              </Link>
            </div>
            <p className="text-xs text-white/35">
              © {new Date().getFullYear()} JIBI RAHTI — {C.footerRights}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
