import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LogOut, Award, Shield, ChevronRight, User as UserIcon,
  FileText, Download, LifeBuoy, Mail, Phone, MessageCircle,
  GraduationCap, Calendar, Users, CheckCircle2,
} from "lucide-react";
import { useApp, GILM_CONTACT, PRACTICAL_SEATS_PER_MONTH } from "@/store/useApp";
import { useAuth } from "@/auth/AuthProvider";
import { courses, formatINR } from "@/data/courses";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Lock } from "lucide-react";

export default function Account() {
  const { user, signOut, completed } = useApp();
  const { t } = useTranslation();

  if (!user) {
    return (
      <div className="px-4 py-12 text-center">
        <UserIcon className="mx-auto h-12 w-12 text-primary/50" />
        <h1 className="mt-3 font-serif text-xl font-bold">{t("account.signedOut")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("account.signedOutSub")}</p>
        <Link to="/sign-in" className="mt-5 inline-block rounded-full gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
          {t("account.signIn")}
        </Link>
      </div>
    );
  }

  const completedCount = Object.values(completed).filter(Boolean).length;
  const certificates = courses.filter((c) => {
    const lessons = c.modules.flatMap((m) => m.lessons);
    return lessons.length > 0 && lessons.every((l) => completed[`${c.id}:${l.id}`]);
  });

  return (
    <div className="space-y-5 px-4 py-5 pb-8">
      {/* Profile header */}
      <div className="rounded-2xl gradient-primary p-5 text-primary-foreground shadow-elevated">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background/20 font-serif text-xl font-bold backdrop-blur">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-serif text-lg font-bold">{user.name}</p>
            <p className="text-xs text-primary-foreground/80">{user.email}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat label={t("account.lessonsDone")} value={completedCount} />
          <Stat label={t("account.certificates")} value={certificates.length} />
        </div>
      </div>

      {/* Quick links */}
      <div className="space-y-2">
        {certificates.length > 0 && (
          <Row to={`/courses/${certificates[0].slug}/certificate`} icon={Award} label={t("account.myCertificates")} />
        )}
        {isAdmin && (
          <Row to="/admin" icon={Shield} label={t("account.adminDashboard")} />
        )}
      </div>

      {/* Invoices */}
      <InvoicesSection />

      {/* Practical classes */}
      <PracticalClassesSection />

      {/* Help & contact */}
      <HelpSection />

      {/* Sign out */}
      <button
        onClick={signOut}
        className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left text-sm font-semibold text-destructive shadow-soft"
      >
        <LogOut className="h-4 w-4" /> {t("account.signOut")}
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-background/15 p-3 text-center backdrop-blur">
      <p className="font-serif text-xl font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-primary-foreground/80">{label}</p>
    </div>
  );
}

function Row({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm font-semibold">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

/* ---------------- Invoices ---------------- */

function InvoicesSection() {
  const { invoices } = useApp();

  return (
    <section className="rounded-2xl bg-card p-4 shadow-soft">
      <header className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FileText className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <h2 className="font-serif text-base font-bold">Invoices</h2>
          <p className="text-[11px] text-muted-foreground">All your course purchase receipts</p>
        </div>
      </header>

      {invoices.length === 0 ? (
        <p className="rounded-xl bg-secondary/60 px-3 py-4 text-center text-xs text-muted-foreground">
          No invoices yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {invoices.map((inv) => (
            <li key={inv.id} className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{inv.courseTitle}</p>
                <p className="text-[11px] text-muted-foreground">
                  {inv.id} · {new Date(inv.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
              <p className="text-sm font-bold text-primary">{formatINR(inv.amount)}</p>
              <button
                onClick={() => toast.success(`Invoice ${inv.id} downloaded`)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
                aria-label="Download invoice"
              >
                <Download className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------------- Practical Classes ---------------- */

const monthOptions = (() => {
  const out: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    out.push({ value, label });
  }
  return out;
})();

function PracticalClassesSection() {
  const { user, practicalBookings, bookPractical, purchases } = useApp();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(monthOptions[0].value);
  const [showBundleDialog, setShowBundleDialog] = useState(false);

  const hasBundle = useMemo(
    () => courses.every((c) => purchases[c.id]),
    [purchases]
  );

  const seatsTaken = useMemo(
    () => practicalBookings.filter((b) => b.month === month).length,
    [practicalBookings, month]
  );
  const seatsLeft = Math.max(0, PRACTICAL_SEATS_PER_MONTH - seatsTaken);
  const fillPct = Math.round((seatsTaken / PRACTICAL_SEATS_PER_MONTH) * 100);

  const alreadyBooked = !!user && practicalBookings.some(
    (b) => b.email === user.email && b.month === month
  );

  const handleRegister = () => {
    if (!user) return;
    if (!hasBundle) {
      setShowBundleDialog(true);
      return;
    }
    if (alreadyBooked) {
      toast.info("You are already registered for this month.");
      return;
    }
    if (seatsLeft <= 0) {
      toast.error("This month is fully booked. Please choose another.");
      return;
    }
    bookPractical({ email: user.email, name: user.name, month });
    toast.success(`Registered for ${monthOptions.find((m) => m.value === month)?.label} practical class!`);
  };

  return (
    <section className="rounded-2xl bg-card p-4 shadow-soft">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 text-left"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <GraduationCap className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <h2 className="font-serif text-base font-bold">Register for practical classes</h2>
          <p className="text-[11px] text-muted-foreground">In-person hands-on training (max 25 / month)</p>
        </div>
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {/* Month dropdown */}
          <label className="block">
            <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Calendar className="h-3 w-3" /> Choose month
            </span>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </label>

          {/* Seat availability */}
          <div className="rounded-xl bg-secondary/50 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold">
                <Users className="h-3.5 w-3.5 text-primary" /> Seat availability
              </span>
              <span className={`font-bold ${seatsLeft === 0 ? "text-destructive" : "text-emerald-600"}`}>
                {seatsLeft} / {PRACTICAL_SEATS_PER_MONTH} left
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-background">
              <div
                className={`h-full rounded-full transition-all ${fillPct >= 100 ? "bg-destructive" : "bg-emerald-500"}`}
                style={{ width: `${fillPct}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {seatsTaken} of {PRACTICAL_SEATS_PER_MONTH} seats booked
            </p>
          </div>

          {!hasBundle && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-[11px] text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <Lock className="mt-0.5 h-3.5 w-3.5 flex-none" />
              <p>
                Practical classes are exclusive to <strong>Laundry Mastery Bundle</strong> students
                (all 3 courses). Talk to customer care for more info.
              </p>
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={hasBundle && (alreadyBooked || seatsLeft === 0)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-elevated disabled:opacity-50"
          >
            {!hasBundle ? (
              <><Lock className="h-4 w-4" /> Bundle members only</>
            ) : alreadyBooked ? (
              <><CheckCircle2 className="h-4 w-4" /> Already registered</>
            ) : seatsLeft === 0 ? (
              "Fully booked"
            ) : (
              "Confirm registration"
            )}
          </button>
        </div>
      )}

      <AlertDialog open={showBundleDialog} onOpenChange={setShowBundleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Lock className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-center font-serif">
              Laundry Mastery Bundle required
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Practical classes are an exclusive perk for students who opted for the
              <strong className="text-foreground"> Laundry Mastery Bundle</strong> (access to all 3 courses).
              <br /><br />
              Talk to customer care for more info on upgrading.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <a
              href={`tel:${GILM_CONTACT.phone.replace(/\s/g, "")}`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold"
            >
              <Phone className="h-4 w-4" /> Call care
            </a>
            <AlertDialogAction onClick={() => setShowBundleDialog(false)}>
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

/* ---------------- Help ---------------- */

function HelpSection() {
  return (
    <section className="rounded-2xl bg-card p-4 shadow-soft">
      <header className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <LifeBuoy className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <h2 className="font-serif text-base font-bold">Help & support</h2>
          <p className="text-[11px] text-muted-foreground">We're here Mon–Sat, 10am–7pm</p>
        </div>
      </header>

      <div className="space-y-2">
        <ContactRow
          icon={Mail}
          label="Email support"
          value={GILM_CONTACT.email}
          href={`mailto:${GILM_CONTACT.email}`}
        />
        <ContactRow
          icon={Phone}
          label="GILM contact"
          value={GILM_CONTACT.phone}
          href={`tel:${GILM_CONTACT.phone.replace(/\s/g, "")}`}
        />
        <ContactRow
          icon={MessageCircle}
          label="WhatsApp"
          value={GILM_CONTACT.whatsapp}
          href={`https://wa.me/${GILM_CONTACT.whatsapp.replace(/[^0-9]/g, "")}`}
        />
      </div>
    </section>
  );
}

function ContactRow({
  icon: Icon, label, value, href,
}: { icon: any; label: string; value: string; href: string }) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3"
    >
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </a>
  );
}
