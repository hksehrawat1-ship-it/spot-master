import { Link } from "react-router-dom";
import { LogOut, Award, BookOpen, Shield, ChevronRight, User as UserIcon } from "lucide-react";
import { useApp, ADMIN_EMAIL } from "@/store/useApp";
import { courses } from "@/data/courses";


export default function Account() {
  const { user, signOut, completed } = useApp();

  if (!user) {
    return (
      <div className="px-4 py-12 text-center">
        <UserIcon className="mx-auto h-12 w-12 text-primary/50" />
        <h1 className="mt-3 font-serif text-xl font-bold">You're signed out</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to access your courses & certificates.</p>
        <Link to="/sign-in" className="mt-5 inline-block rounded-full gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
          Sign in
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
    <div className="space-y-5 px-4 py-5">
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
          <Stat label="Lessons done" value={completedCount} />
          <Stat label="Certificates" value={certificates.length} />
        </div>
      </div>

      <div className="space-y-2">
        <Row to="/learning" icon={BookOpen} label="My courses" />
        {certificates.length > 0 && (
          <Row to={`/courses/${certificates[0].slug}/certificate`} icon={Award} label="My certificates" />
        )}
        {user.email === ADMIN_EMAIL && (
          <Row to="/admin" icon={Shield} label="Admin dashboard" />
        )}
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left text-sm font-semibold text-destructive shadow-soft"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
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
