import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Search,
  GraduationCap,
  Sparkles,
  User,
  Award,
  PlayCircle,
  Globe,
  ChevronRight,
  Mic,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { courses } from "@/data/courses";
import CourseCard from "@/components/CourseCard";
import CertificatesSection from "@/components/CertificatesSection";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// Google brand colors
const G_BLUE = "hsl(217 89% 51%)";
const G_RED = "hsl(4 90% 58%)";
const G_YELLOW = "hsl(45 100% 50%)";
const G_GREEN = "hsl(137 53% 43%)";

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const quickActions = [
    {
      label: t("nav.courses"),
      icon: GraduationCap,
      tint: G_BLUE,
      bg: "hsl(217 89% 96%)",
      to: "/courses",
    },
    {
      label: t("nav.stains"),
      icon: Sparkles,
      tint: G_GREEN,
      bg: "hsl(137 53% 95%)",
      to: "/stain-master",
    },
    {
      label: t("nav.learning"),
      icon: PlayCircle,
      tint: G_YELLOW,
      bg: "hsl(45 100% 94%)",
      to: "/learning",
    },
    {
      label: t("nav.account"),
      icon: User,
      tint: G_RED,
      bg: "hsl(4 90% 96%)",
      to: "/account",
    },
  ];

  return (
    <div className="space-y-6 bg-background pb-6">
      {/* Brand wordmark — Google-style multi-color */}
      <section className="px-5 pt-6 text-center">
        <h1 className="font-medium tracking-tight" style={{ fontSize: 44, lineHeight: 1 }}>
          <span style={{ color: G_BLUE }}>G</span>
          <span style={{ color: G_RED }}>I</span>
          <span style={{ color: G_YELLOW }}>L</span>
          <span style={{ color: G_BLUE }}>M</span>
        </h1>
        <p className="mt-2 text-[13px] text-muted-foreground">{t("brand.tagline")}</p>
      </section>

      {/* Search pill — Google search style */}
      <section className="px-5">
        <button
          onClick={() => navigate("/courses")}
          className="group flex h-12 w-full items-center gap-3 rounded-full border border-border bg-card px-5 text-left shadow-soft transition-shadow hover:shadow-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Search className="h-5 w-5 text-muted-foreground" />
          <span className="flex-1 text-sm text-muted-foreground">
            {t("courses.searchPlaceholder")}
          </span>
          <Mic className="h-5 w-5" style={{ color: G_BLUE }} />
        </button>
      </section>

      {/* Quick actions — colored circle chips */}
      <section className="px-5">
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((a) => (
            <Link
              key={a.label}
              to={a.to}
              className="group flex flex-col items-center gap-1.5 rounded-2xl p-2 transition-colors hover:bg-muted active:scale-95"
            >
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full transition-transform group-hover:scale-105"
                style={{ backgroundColor: a.bg }}
              >
                <a.icon className="h-6 w-6" style={{ color: a.tint }} strokeWidth={2.2} />
              </span>
              <span className="text-[11px] font-medium text-foreground">{a.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Hero card — clean Material */}
      <section className="px-5">
        <div
          className="relative overflow-hidden rounded-3xl p-6 text-white shadow-elevated"
          style={{
            background:
              "linear-gradient(135deg, hsl(217 89% 51%) 0%, hsl(217 89% 58%) 50%, hsl(199 89% 60%) 100%)",
          }}
        >
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-black/15 blur-2xl" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-medium backdrop-blur">
              <Sparkles className="h-3 w-3" /> {t("home.badge")}
            </span>
            <h2 className="mt-3 text-[26px] font-medium leading-tight tracking-tight">
              {t("home.heroTitle")}
            </h2>
            <p className="mt-2 text-[13px] text-white/90">{t("home.heroSubtitle")}</p>
            <Link
              to="/courses"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-foreground shadow-soft transition-shadow hover:shadow-elevated active:scale-95"
              style={{ color: G_BLUE }}
            >
              {t("home.browseCourses")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats — minimal Google chip row */}
      <section className="px-5">
        <div className="flex items-stretch justify-between gap-2 rounded-2xl border border-border bg-card p-4 shadow-soft">
          <Stat label={t("home.stats.courses")} value="20+" color={G_BLUE} />
          <div className="w-px bg-border" />
          <Stat label={t("home.stats.students")} value="3.3k" color={G_GREEN} />
          <div className="w-px bg-border" />
          <Stat label={t("home.stats.certified")} value="1.8k" color={G_YELLOW} />
        </div>
      </section>

      {/* Language */}
      <section className="mx-5 rounded-2xl border border-border bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: "hsl(217 89% 96%)" }}
          >
            <Globe className="h-5 w-5" style={{ color: G_BLUE }} />
          </span>
          <div>
            <h2 className="text-[15px] font-medium text-foreground">
              {t("home.languageTitle")}
            </h2>
            <p className="text-[11px] text-muted-foreground">{t("home.languageSubtitle")}</p>
          </div>
        </div>
        <LanguageSwitcher variant="full" />
      </section>

      {/* Featured */}
      <section className="px-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[18px] font-medium tracking-tight text-foreground">
            {t("home.featured")}
          </h2>
          <Link
            to="/courses"
            className="inline-flex items-center gap-0.5 text-[13px] font-medium"
            style={{ color: G_BLUE }}
          >
            {t("home.seeAll")} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {courses.slice(0, 3).map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </section>

      {/* Certificates */}
      <CertificatesSection />

      {/* Why GILM — Material list */}
      <section className="mx-5 rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h3 className="text-[16px] font-medium tracking-tight text-foreground">
          {t("home.whyTitle")}
        </h3>
        <ul className="mt-4 space-y-3 text-sm">
          <Why icon={PlayCircle} text={t("home.why1")} bg="hsl(217 89% 96%)" tint={G_BLUE} />
          <Why icon={Award} text={t("home.why2")} bg="hsl(137 53% 95%)" tint={G_GREEN} />
          <Why icon={Sparkles} text={t("home.why3")} bg="hsl(45 100% 94%)" tint="hsl(45 100% 38%)" />
        </ul>
      </section>

      {/* Footer note */}
      <p className="px-5 text-center text-[11px] text-muted-foreground">
        © GILM · Global Institute of Laundry Management
      </p>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex-1 text-center">
      <p className="text-2xl font-medium tracking-tight" style={{ color }}>
        {value}
      </p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function Why({
  icon: Icon,
  text,
  bg,
  tint,
}: {
  icon: any;
  text: string;
  bg: string;
  tint: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full"
        style={{ backgroundColor: bg }}
      >
        <Icon className="h-[18px] w-[18px]" style={{ color: tint }} strokeWidth={2.2} />
      </span>
      <span className="pt-1.5 text-[14px] text-foreground/90">{text}</span>
    </li>
  );
}
