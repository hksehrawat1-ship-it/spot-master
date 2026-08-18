import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import logo from "@/assets/gilm-logo.png";
import { useAuth } from "@/auth/AuthProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function MobileShell() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  // Hide chrome on lesson player for immersive view
  const immersive = /^\/courses\/[^/]+\/lesson\//.test(location.pathname);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background shadow-elevated">
      {!immersive && (
        <header className="sticky top-0 z-40 flex items-start justify-between border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-md">
          <NavLink to="/stain-master" className="flex items-center gap-2">
            <img src={logo} alt="Stain Master logo" className="h-9 w-9 object-contain" />
            <div className="leading-tight">
              <p className="text-[15px] font-bold text-primary">{t("brand.name")}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t("brand.tagline")}
              </p>
            </div>
          </NavLink>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {isAdmin && (
              <NavLink
                to="/admin"
                className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
              >
                <Shield className="h-3.5 w-3.5" /> {t("nav.admin")}
              </NavLink>
            )}
          </div>
        </header>
      )}

      <main className={immersive ? "flex-1" : "flex-1"}>
        <Outlet />
      </main>
    </div>
  );
}
