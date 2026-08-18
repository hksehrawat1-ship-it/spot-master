import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Brand from "@/components/Brand";
import { OfflineBanner } from "@/components/system/ConnectionStates";

const SECTIONS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#working-levels", label: "Working levels" },
  { href: "/#supported-kits", label: "Supported kits" },
  { href: "/#pricing", label: "Pricing" },
];

const LEGAL = [
  { to: "/legal/about", label: "About Stain Master" },
  { to: "/legal/contact", label: "Contact" },
  { to: "/legal/privacy", label: "Privacy Policy" },
  { to: "/legal/terms", label: "Terms of Use" },
  { to: "/legal/refund", label: "Refund Policy" },
  { to: "/legal/safety", label: "Safety Disclaimer" },
  { to: "/legal/countries", label: "Supported countries" },
  { to: "/install", label: "Install Stain Master" },
];

export default function PublicShell() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <OfflineBanner />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <div className="sm-container flex h-16 items-center justify-between gap-4">
          <Brand />

          <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
            {SECTIONS.map((s) => (
              <a key={s.href} href={s.href} className="text-sm font-medium text-foreground hover:text-primary">
                {s.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <NavLink to="/sign-in" className="sm-btn-ghost h-11 min-h-[44px] text-sm">
              Sign in
            </NavLink>
            <NavLink to="/register" className="sm-btn-primary h-11 min-h-[44px] text-sm">
              Start Stain Master
            </NavLink>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius)] border border-border lg:hidden"
            aria-expanded={open}
            aria-controls="public-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X aria-hidden className="h-5 w-5" /> : <Menu aria-hidden className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div id="public-menu" className="border-t border-border bg-surface lg:hidden">
            <nav aria-label="Main" className="sm-container flex flex-col py-3">
              {SECTIONS.map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  onClick={() => setOpen(false)}
                  className="min-h-[44px] py-2.5 text-base font-medium"
                >
                  {s.label}
                </a>
              ))}
              <Link to="/sign-in" onClick={() => setOpen(false)} className="min-h-[44px] py-2.5 text-base font-medium">
                Sign in
              </Link>
              <Link to="/register" onClick={() => setOpen(false)} className="sm-btn-primary mt-2">
                Start Stain Master
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="sm-container grid gap-8 py-10 md:grid-cols-3">
          <div>
            <Brand />
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Spot with confidence. Protect every garment. Safety-first spotting guidance for dry cleaners and
              wet-cleaning professionals.
            </p>
          </div>
          <nav aria-label="Footer" className="md:col-span-2">
            <ul className="grid grid-cols-2 gap-y-2 text-sm">
              {LEGAL.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="inline-block py-1 text-foreground hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="border-t border-border">
          <div className="sm-container py-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Stain Master. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
