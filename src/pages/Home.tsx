import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Award, PlayCircle, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { courses } from "@/data/courses";
import CourseCard from "@/components/CourseCard";
import CertificatesSection from "@/components/CertificatesSection";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import logo from "@/assets/gilm-logo.png";

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="space-y-7 pb-6">
      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden px-5 pb-8 pt-6 text-primary-foreground">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-primary-glow/40 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur">
            <Sparkles className="h-3 w-3" /> {t("home.badge")}
          </span>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight">
            {t("home.heroTitle")}
          </h1>
          <p className="mt-2 text-sm text-primary-foreground/85">{t("home.heroSubtitle")}</p>
          <Link
            to="/courses"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-background px-5 py-3 text-sm font-semibold text-primary shadow-elevated transition-transform active:scale-95"
          >
            {t("home.browseCourses")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Stats / value */}
      <section className="-mt-12 mx-4 grid grid-cols-3 gap-2 rounded-2xl bg-card p-3 shadow-elevated">
        <Stat label={t("home.stats.courses")} value="20+" />
        <Stat label={t("home.stats.students")} value="3.3k" />
        <Stat label={t("home.stats.certified")} value="1.8k" />
      </section>

      {/* Language picker */}
      <section className="mx-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Globe className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-serif text-base font-bold">{t("home.languageTitle")}</h2>
            <p className="text-[11px] text-muted-foreground">{t("home.languageSubtitle")}</p>
          </div>
        </div>
        <LanguageSwitcher variant="full" />
      </section>

      {/* Featured */}
      <section className="px-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold">{t("home.featured")}</h2>
          <Link to="/courses" className="text-xs font-semibold text-primary">
            {t("home.seeAll")}
          </Link>
        </div>
        <div className="space-y-3">
          {courses.slice(0, 3).map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </section>

      {/* My Certificates */}
      <CertificatesSection />

      {/* Why */}
      <section className="mx-4 rounded-2xl bg-secondary p-5">
        <img src={logo} alt="GILM" className="mx-auto h-14 w-14 object-contain" />
        <h3 className="mt-3 text-center font-serif text-lg font-bold text-primary">
          {t("home.whyTitle")}
        </h3>
        <ul className="mt-4 space-y-3 text-sm">
          <Why icon={PlayCircle} text={t("home.why1")} />
          <Why icon={Award} text={t("home.why2")} />
          <Why icon={Sparkles} text={t("home.why3")} />
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="font-serif text-xl font-bold text-primary">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function Why({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-foreground/85">{text}</span>
    </li>
  );
}
