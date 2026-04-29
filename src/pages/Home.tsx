import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Award, PlayCircle } from "lucide-react";
import { courses } from "@/data/courses";
import CourseCard from "@/components/CourseCard";
import logo from "@/assets/gilm-logo.png";

export default function Home() {
  return (
    <div className="space-y-7 pb-6">
      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden px-5 pb-8 pt-6 text-primary-foreground">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-primary-glow/40 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur">
            <Sparkles className="h-3 w-3" /> Learn from industry experts
          </span>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight">
            Master the craft of professional laundry
          </h1>
          <p className="mt-2 text-sm text-primary-foreground/85">
            India's premier online academy for laundry, linen and dry-cleaning professionals.
          </p>
          <Link
            to="/courses"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-background px-5 py-3 text-sm font-semibold text-primary shadow-elevated transition-transform active:scale-95"
          >
            Browse courses <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Stats / value */}
      <section className="-mt-12 mx-4 grid grid-cols-3 gap-2 rounded-2xl bg-card p-3 shadow-elevated">
        <Stat label="Courses" value="20+" />
        <Stat label="Students" value="3.3k" />
        <Stat label="Certified" value="1.8k" />
      </section>

      {/* Featured */}
      <section className="px-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold">Featured courses</h2>
          <Link to="/courses" className="text-xs font-semibold text-primary">
            See all
          </Link>
        </div>
        <div className="space-y-3">
          {courses.slice(0, 3).map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </section>

      {/* Why */}
      <section className="mx-4 rounded-2xl bg-secondary p-5">
        <img src={logo} alt="GILM" className="mx-auto h-14 w-14 object-contain" />
        <h3 className="mt-3 text-center font-serif text-lg font-bold text-primary">
          Why Global Institute of Laundry Management?
        </h3>
        <ul className="mt-4 space-y-3 text-sm">
          <Why icon={PlayCircle} text="Bite-sized HD video lessons, watch anywhere" />
          <Why icon={Award} text="Industry-recognised completion certificate" />
          <Why icon={Sparkles} text="Downloadable PDFs, checklists and templates" />
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
