import { NavLink, Outlet } from "react-router-dom";
import { FolderOpen, Home, PlusCircle, Shield, User, FlaskConical } from "lucide-react";
import Brand from "@/components/Brand";
import { useAuth } from "@/auth/AuthProvider";
import { OfflineBanner } from "@/components/system/ConnectionStates";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/home", label: "Home", icon: Home, end: true },
  { to: "/cases/new", label: "New Case", icon: PlusCircle, primary: true },
  { to: "/cases", label: "Cases", icon: FolderOpen, end: true },
  { to: "/products", label: "Products", icon: FlaskConical },
  { to: "/account", label: "Account", icon: User },
];

/** Operational shell: bottom navigation on phones, a left rail from tablet up. */
export default function AppShell() {
  const { isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <OfflineBanner />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Brand to="/home" subdued />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {isAdmin && (
              <NavLink to="/admin" className="sm-btn-secondary h-10 min-h-[44px] px-3 text-sm">
                <Shield aria-hidden className="h-4 w-4" /> Admin
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1200px]">
        {/* Left rail — tablet and desktop */}
        <aside className="sticky top-0 hidden h-screen w-[220px] flex-none border-r border-border bg-surface px-3 py-4 md:block">
          <div className="px-2">
            <Brand to="/home" />
          </div>
          <nav aria-label="Main" className="mt-6 space-y-1">
            {NAV.map(({ to, label, icon: Icon, end, primary }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-[44px] items-center gap-3 rounded-[var(--radius)] px-3 text-[15px] font-medium",
                    primary
                      ? "bg-primary text-primary-foreground hover:bg-primary/92"
                      : isActive
                        ? "bg-secondary text-navy"
                        : "text-foreground hover:bg-muted",
                  )
                }
              >
                <Icon aria-hidden className="h-5 w-5" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-6 space-y-2 border-t border-border px-1 pt-4">
            <LanguageSwitcher />
            {isAdmin && (
              <NavLink to="/admin" className="sm-btn-secondary h-11 min-h-[44px] w-full text-sm">
                <Shield aria-hidden className="h-4 w-4" /> Administration
              </NavLink>
            )}
          </div>
        </aside>

        <main id="main" className="min-w-0 flex-1 px-4 pb-28 pt-4 md:px-6 md:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Bottom navigation — phones */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="mx-auto flex max-w-md items-end justify-between px-2 py-1.5">
          {NAV.map(({ to, label, icon: Icon, end, primary }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-[var(--radius)] px-1 py-1.5 text-[11px] font-medium",
                    primary
                      ? "bg-primary text-primary-foreground"
                      : isActive
                        ? "text-primary"
                        : "text-muted-foreground",
                  )
                }
              >
                <Icon aria-hidden className="h-5 w-5" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
