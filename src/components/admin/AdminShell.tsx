import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import {
  ADMIN_MODE_HINT, ADMIN_MODE_LABEL, ADMIN_PRINCIPLE, ADMIN_SECTION_META,
  MORE_SECTIONS, PRIMARY_SECTIONS,
} from "@/data/adminWorkspace";
import type { AdminSection } from "@/data/adminWorkspace";
import { globalSearch, modesForRoles, sectionsForUser } from "@/lib/adminEngine";
import { currentAdminUser, useAdmin } from "@/store/useAdmin";
import { useGovernance } from "@/store/useGovernance";

type Props = { section: AdminSection; title: string; children: React.ReactNode };

/** One coherent administration workspace: mode switch, navigation, global search. */
export default function AdminShell({ section, title, children }: Props) {
  const admin = useAdmin();
  const user = useAdmin(currentAdminUser);
  const gov = useGovernance();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [showMore, setShowMore] = useState(false);

  const allowed = useMemo(() => sectionsForUser(user), [user]);
  const modes = useMemo(() => modesForRoles(user.roles), [user]);

  const hits = useMemo(
    () =>
      query.trim().length < 2
        ? []
        : globalSearch(
            query,
            {
              records: gov.records, documents: gov.documents, users: admin.users,
              organizations: admin.organizations, inventory: admin.inventory,
              training: admin.training, audit: gov.audit.map((a) => ({ id: a.id, at: a.at, action: a.action, recordId: a.recordId, user: a.user })),
            },
            {},
            user,
          ).slice(0, 8),
    [query, gov.records, gov.documents, gov.audit, admin, user],
  );

  const navFor = (keys: readonly AdminSection[]) =>
    keys.filter((k) => allowed.includes(k) || k === "dashboard");

  return (
    <div className="space-y-4 px-4 py-5">
      <header className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-[11px] uppercase tracking-wider text-primary">Administration</p>
        <h1 className="font-serif text-xl font-bold">{title}</h1>
        <p className="mt-1 text-xs text-muted-foreground">{ADMIN_PRINCIPLE}</p>

        <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="admin-mode">
          Mode
        </label>
        <select
          id="admin-mode"
          value={admin.mode}
          onChange={(e) => admin.setMode(e.target.value as typeof admin.mode)}
          className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        >
          {modes.map((m) => (
            <option key={m} value={m}>{ADMIN_MODE_LABEL[m]}</option>
          ))}
        </select>
        <p className="mt-1 text-[11px] text-muted-foreground">{ADMIN_MODE_HINT[admin.mode]}</p>

        <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="admin-user">
          Acting as
        </label>
        <select
          id="admin-user"
          value={admin.currentUserId}
          onChange={(e) => admin.setCurrentUser(e.target.value)}
          className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        >
          {admin.users.map((u) => (
            <option key={u.userId} value={u.userId}>{u.name}</option>
          ))}
        </select>
      </header>

      <div className="relative">
        <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search records, documents, users, organizations…"
          aria-label="Global administration search"
          maxLength={120}
          className="w-full rounded-xl border border-input bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        {hits.length > 0 && (
          <ul className="mt-2 space-y-1 rounded-xl border border-border bg-card p-2">
            {hits.map((h) => (
              <li key={`${h.entity}-${h.id}`}>
                <button
                  onClick={() => { setQuery(""); navigate(h.route); }}
                  className="w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-secondary"
                >
                  <span className="font-semibold">{h.title}</span>
                  <span className="block text-[11px] text-muted-foreground">{h.id} · {h.subtitle}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <nav aria-label="Administration sections" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {navFor(PRIMARY_SECTIONS).map((key) => (
          <Link
            key={key}
            to={ADMIN_SECTION_META[key].route}
            aria-current={key === section ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              key === section ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {ADMIN_SECTION_META[key].label}
          </Link>
        ))}
        <button
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          className="whitespace-nowrap rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold"
        >
          More
        </button>
      </nav>

      {showMore && (
        <ul className="grid grid-cols-2 gap-2">
          {navFor(MORE_SECTIONS).map((key) => (
            <li key={key}>
              <Link to={ADMIN_SECTION_META[key].route} className="block rounded-xl border border-border bg-card p-3">
                <span className="text-sm font-semibold">{ADMIN_SECTION_META[key].label}</span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">{ADMIN_SECTION_META[key].description}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!allowed.includes(section) && section !== "dashboard" ? (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Your current role does not have access to {ADMIN_SECTION_META[section].label}. Ask a system administrator for access.
        </p>
      ) : (
        children
      )}
    </div>
  );
}
