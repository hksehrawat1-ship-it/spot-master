import { Link } from "react-router-dom";
import { ArrowRight, Award, PlayCircle, Globe, Search, GraduationCap, Sparkles, Droplet } from "lucide-react";
import { useTranslation } from "react-i18next";
import CertificatesSection from "@/components/CertificatesSection";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import logo from "@/assets/gilm-logo.png";

// Google brand colors
const G = {
  blue: "hsl(217 89% 51%)",
  red: "hsl(4 90% 58%)",
  yellow: "hsl(45 100% 51%)",
  green: "hsl(142 71% 35%)",
};

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="space-y-5 px-4 pb-8 pt-5">
      {/* Top bar — Google-style logo + brand */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="GILM" className="h-8 w-8 object-contain" />
          <span className="text-[18px] font-medium tracking-tight text-foreground">
            GILM <span className="text-muted-foreground">Academy</span>
          </span>
        </div>
        <Link
          to="/account"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground transition-colors hover:bg-[hsl(217_89%_95%)] hover:text-[hsl(217_89%_38%)]"
        >
          G
        </Link>
      </header>

      {/* Google-style hero with multicolor wordmark */}
      <section className="pt-4 text-center">
        <h1 className="font-sans text-[40px] font-normal leading-[1.05] tracking-tight">
          <span style={{ color: G.blue }}>L</span>
          <span style={{ color: G.red }}>e</span>
          <span style={{ color: G.yellow }}>a</span>
          <span style={{ color: G.blue }}>r</span>
          <span style={{ color: G.green }}>n</span>
          <span className="text-foreground"> Laundry</span>
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-[13px] text-muted-foreground">
          {t("home.heroSubtitle")}
        </p>

        {/* Google search-style CTA */}
        <Link
          to="/courses"
          className="mt-5 flex h-12 w-full items-center gap-3 rounded-full border border-border bg-card px-5 text-left text-[14px] text-muted-foreground shadow-soft transition-all hover:border-[hsl(217_89%_51%)] hover:shadow-elevated"
        >
          <Search className="h-[18px] w-[18px] flex-none text-muted-foreground" />
          <span className="flex-1 truncate">{t("courses.searchPlaceholder")}</span>
          <span className="flex-none text-[12px] font-medium text-[hsl(217_89%_51%)]">
            Browse →
          </span>
        </Link>

        {/* Two action buttons — Google "I'm feeling lucky" style */}
        <div className="mt-3 flex justify-center gap-2">
          <Link
            to="/courses"
            className="rounded-md bg-secondary px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-[hsl(0_0%_92%)] hover:shadow-soft"
          >
            {t("home.browseCourses")}
          </Link>
          <Link
            to="/stain-master"
            className="rounded-md bg-secondary px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-[hsl(0_0%_92%)] hover:shadow-soft"
          >
            Stain Master
          </Link>
        </div>
      </section>

      {/* Quick app tiles — Google apps grid style */}
      <section className="grid grid-cols-4 gap-2 pt-4">
        <AppTile
          to="/courses"
          icon={GraduationCap}
          label="Courses"
          color={G.blue}
        />
        <AppTile
          to="/stain-master"
          icon={Droplet}
          label="Stains"
          color={G.red}
        />
        <AppTile
          to="/learning"
          icon={PlayCircle}
          label="Learning"
          color={G.yellow}
        />
        <AppTile
          to="/account"
          icon={Award}
          label="Certs"
          color={G.green}
        />
      </section>

      {/* Stats — clean Google card */}
      <section className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-3">
        <Stat label={t("home.stats.courses")} value="20+" color={G.blue} />
        <Stat label={t("home.stats.students")} value="3.3k" color={G.red} />
        <Stat label={t("home.stats.certified")} value="1.8k" color={G.green} />
      </section>

      {/* Language picker */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: "hsl(217 89% 95%)", color: G.blue }}
          >
            <Globe className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h2 className="text-[14px] font-medium text-foreground">
              {t("home.languageTitle")}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {t("home.languageSubtitle")}
            </p>
          </div>
        </div>
        <LanguageSwitcher variant="full" />
      </section>

      {/* Certificates */}
      <CertificatesSection />

      {/* Why — Google list style */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-[16px] font-medium text-foreground">
          {t("home.whyTitle")}
        </h3>
        <ul className="mt-4 space-y-3 text-[13px]">
          <Why icon={PlayCircle} text={t("home.why1")} color={G.blue} bg="hsl(217 89% 95%)" />
          <Why icon={Award} text={t("home.why2")} color={G.red} bg="hsl(4 90% 95%)" />
          <Why icon={Sparkles} text={t("home.why3")} color={G.green} bg="hsl(142 71% 92%)" />
        </ul>
      </section>
    </div>
  );
}

function AppTile({
  to,
  icon: Icon,
  label,
  color,
}: {
  to: string;
  icon: any;
  label: string;
  color: string;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-center gap-2 rounded-2xl p-3 transition-colors hover:bg-secondary"
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-105"
        style={{ background: `${color}`, color: "white" }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-[11px] font-medium text-foreground">{label}</span>
    </Link>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="text-center">
      <p className="text-xl font-medium" style={{ color }}>
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function Why({
  icon: Icon,
  text,
  color,
  bg,
}: {
  icon: any;
  text: string;
  color: string;
  bg: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full"
        style={{ background: bg, color }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-foreground/85">{text}</span>
    </li>
  );
}
