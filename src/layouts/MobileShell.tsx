import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, BookOpen, GraduationCap, User, Shield } from "lucide-react";
import logo from "@/assets/gilm-logo.png";
import { useApp, ADMIN_EMAIL } from "@/store/useApp";

const tabs = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/learning", label: "Learning", icon: GraduationCap },
  { to: "/account", label: "Account", icon: User },
];

export default function MobileShell() {
  const { user } = useApp();
  const location = useLocation();
  const isAdmin = user?.email === ADMIN_EMAIL;

  // Hide chrome on lesson player for immersive view
  const immersive = /^\/courses\/[^/]+\/lesson\//.test(location.pathname);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background shadow-elevated">
      {!immersive && (
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-md">
          <NavLink to="/" className="flex items-center gap-2">
            <img src={logo} alt="GILM logo" className="h-9 w-9 object-contain" />
            <div className="leading-tight">
              <p className="text-[15px] font-bold text-primary">GILM</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Laundry Academy
              </p>
            </div>
          </NavLink>
          {isAdmin && (
            <NavLink
              to="/admin"
              className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
            >
              <Shield className="h-3.5 w-3.5" /> Admin
            </NavLink>
          )}
        </header>
      )}

      <main className={immersive ? "flex-1" : "flex-1 safe-bottom"}>
        <Outlet />
      </main>

      {!immersive && (
        <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-border/60 bg-background/95 backdrop-blur-md">
          <ul className="grid grid-cols-4 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5">
            {tabs.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.4]" : ""}`} />
                      {label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
