import { Link } from "react-router-dom";
import { ArrowRight, FlaskConical, Layers, PlusCircle, Search, ShieldCheck } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { useEntitlement } from "@/hooks/useEntitlement";
import { LoadingState } from "@/components/system/StatusStates";
import StatusNotice, { StatusPill } from "@/components/system/StatusNotice";
import { CATEGORY_CARDS } from "@/data/stainCategoriesUi";
import { InstallCard } from "@/components/system/ConnectionStates";

const LEVEL_LABEL: Record<string, string> = {
  retail: "Retail Spotting",
  professional: "Professional Spotting",
  master: "Master Spotter",
};

const LEVEL_ROUTE: Record<string, string> = {
  retail: "/retail-spotting",
  professional: "/professional-spotting",
  master: "/master-spotter",
};

/** Personalised daily starting point for the signed-in operator. */
export default function Workspace() {
  const { user } = useAuth();
  const { profile, loading } = useProfile();
  const { state: access, accessEndsAt } = useEntitlement();

  if (loading) return <LoadingState label="Loading your workspace…" />;

  const level = profile?.working_level ?? "retail";
  const firstName = (profile?.full_name ?? user?.email ?? "there").split(" ")[0];
  const kits = profile?.preferred_kits ?? [];

  return (
    <div className="space-y-6">
      <header>
        <p className="sm-eyebrow">Your workspace</p>
        <h1 className="mt-1">Good day, {firstName}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusPill tone="info" label={LEVEL_LABEL[level]} />
          {kits.slice(0, 3).map((k) => (
            <StatusPill key={k} tone="proceed" label={k} />
          ))}
          <Link to="/preferences" className="text-sm text-primary underline">
            Change level & products
          </Link>

        </div>
      </header>

      {access === "expired" && (
        <StatusNotice tone="caution" title="Your professional access has ended">
          Renew to continue seeing verified treatment guidance.{" "}
          <Link to="/checkout" className="text-primary underline">
            Renew access
          </Link>
        </StatusNotice>
      )}
      {access === "none" && (
        <StatusNotice tone="info" title="Professional access is not active on this account">
          You can browse categories now.{" "}
          <Link to="/checkout" className="text-primary underline">
            Activate access
          </Link>{" "}
          to open full verified treatment guidance.
        </StatusNotice>
      )}
      {access === "active" && accessEndsAt && (
        <p className="text-sm text-muted-foreground">
          Access is active until {new Date(accessEndsAt).toLocaleDateString()}.
        </p>
      )}
      {access === "unavailable" && (
        <StatusNotice tone="stop" title="We could not confirm your access">
          Reconnect before starting a new chemical stage.
        </StatusNotice>
      )}

      <section aria-labelledby="start" className="grid gap-3 sm:grid-cols-3">
        <h2 id="start" className="sr-only">
          Start work
        </h2>
        <Link to="/cases/new" className="sm-action-card">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary">
            <PlusCircle aria-hidden className="h-5 w-5" />
          </span>
          <span className="mt-3 block font-semibold text-navy">Start a new case</span>
          <span className="mt-1 block text-sm text-muted-foreground">Stain, garment, safety test, guidance.</span>
        </Link>
        <Link to="/stain-master" className="sm-action-card">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary">
            <Search aria-hidden className="h-5 w-5" />
          </span>
          <span className="mt-3 block font-semibold text-navy">Search a stain</span>
          <span className="mt-1 block text-sm text-muted-foreground">Find a stain record by name.</span>
        </Link>
        <Link to={LEVEL_ROUTE[level]} className="sm-action-card">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary">
            <Layers aria-hidden className="h-5 w-5" />
          </span>
          <span className="mt-3 block font-semibold text-navy">Continue in {LEVEL_LABEL[level]}</span>
          <span className="mt-1 block text-sm text-muted-foreground">Open your working level.</span>
        </Link>
      </section>

      <section aria-labelledby="categories">
        <div className="flex items-end justify-between">
          <h2 id="categories">Stain categories</h2>
          <Link to="/stain-categories" className="text-sm text-primary underline">
            View all
          </Link>
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORY_CARDS.slice(0, 6).map(({ key, title, technicalName, examples, icon: Icon }) => (
            <li key={key}>
              <Link to={`/stain-categories/${key}`} className="sm-action-card block h-full">
                <span className="flex items-start gap-3">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-secondary text-primary">
                    <Icon aria-hidden className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-navy">{title}</span>
                    <span className="block text-xs text-muted-foreground">{technicalName}</span>
                    <span className="mt-1.5 block text-sm text-muted-foreground">{examples.join(" · ")}</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="tools" className="grid gap-3 sm:grid-cols-2">
        <h2 id="tools" className="sr-only">
          Tools
        </h2>
        <Link to="/products" className="sm-action-card">
          <span className="flex items-center gap-3 font-semibold text-navy">
            <FlaskConical aria-hidden className="h-5 w-5 text-primary" /> Product library
            <ArrowRight aria-hidden className="ml-auto h-4 w-4" />
          </span>
        </Link>
        <Link to="/fabric-check" className="sm-action-card">
          <span className="flex items-center gap-3 font-semibold text-navy">
            <ShieldCheck aria-hidden className="h-5 w-5 text-primary" /> Fabric safety check
            <ArrowRight aria-hidden className="ml-auto h-4 w-4" />
          </span>
        </Link>
      </section>

      <InstallCard />
    </div>
  );
}
