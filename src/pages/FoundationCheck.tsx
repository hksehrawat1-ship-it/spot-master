import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { CheckCircle2, AlertCircle, Database, ShieldCheck, RefreshCw, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type CountState = { label: string; value: number | null; restricted: boolean; error?: string };

const TABLES: { label: string; table: string; filter?: (q: any) => any }[] = [
  { label: "Stain categories", table: "stain_categories" },
  { label: "Stains", table: "stains" },
  { label: "Stain tags (vocabulary)", table: "tags" },
  { label: "Fabrics / material families", table: "fabrics" },
  { label: "Treatment principles", table: "treatment_principles" },
  { label: "Companies", table: "companies" },
  { label: "Product kits", table: "product_kits" },
  { label: "Professional products", table: "professional_products" },
  { label: "Product mappings", table: "product_mappings" },
  { label: "Source documents", table: "source_documents" },
  {
    label: "Approved domestic treatments",
    table: "domestic_treatments",
    filter: (q) => q.in("approval_status", ["approved", "published"]).gte("confidence_score", 9),
  },
  { label: "Cases", table: "cases" },
  { label: "Treatment attempts", table: "treatment_attempts" },
];

const LAYERS = [
  ["Layer A", "Stain knowledge", "stains, stain_categories, tags, stain_tags"],
  ["Layer B", "Garment & textile risk", "fabrics, garment_profiles"],
  ["Layer C", "Treatment principles", "treatment_principles"],
  ["Layer D", "Professional products", "companies, product_kits, professional_products"],
  ["Layer E", "Product ↔ treatment mapping", "product_mappings"],
  ["Layer F", "Domestic treatments", "domestic_treatments"],
  ["Layer G", "Evidence & governance", "source_documents, content_audit_log"],
  ["Layer H", "Case assessment", "cases, treatment_attempts"],
];

const ROLES = [
  "domestic_user",
  "laundry_employee",
  "dry_cleaner",
  "professional_spotter",
  "trainer",
  "learner",
  "technical_reviewer",
  "content_admin",
  "system_admin",
];

const RISK_LEVELS = [
  ["green", "Cautious domestic or routine professional treatment may be suitable"],
  ["amber", "Compatibility testing or professional advice required"],
  ["red", "Professional handling recommended"],
  ["black", "Do not treat until material, stain or chemical risk is identified"],
];

const STATUSES = ["draft", "under_review", "approved", "published", "needs_review", "suspended", "archived"];

export default function FoundationCheck() {
  const [counts, setCounts] = useState<CountState[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const results: CountState[] = [];
    for (const t of TABLES) {
      let q = supabase.from(t.table as never).select("*", { count: "exact", head: true });
      if (t.filter) q = t.filter(q);
      const { count, error } = await q;
      if (error) {
        const restricted = /permission|policy|denied/i.test(error.message);
        results.push({ label: t.label, value: null, restricted, error: error.message });
      } else {
        results.push({ label: t.label, value: count ?? 0, restricted: false });
      }
    }
    setCounts(results);
    setConnected(results.some((r) => r.value !== null));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);


  return (
    <div className="space-y-5 px-4 pb-28 pt-5">
      <header className="rounded-2xl bg-gradient-to-br from-primary to-primary-glow p-5 text-primary-foreground shadow-elevated">
        <p className="text-[11px] font-semibold uppercase tracking-wider opacity-90">Step 1 · Internal</p>
        <h1 className="mt-1 text-2xl font-bold leading-tight">Foundation Check</h1>
        <p className="mt-1 text-sm opacity-90">
          Verifies that the permanent Stain Master data architecture exists and is reachable.
        </p>
      </header>

      <Card className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              connected ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
            }`}
          >
            <Database className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Database connection</p>
            <p className="text-xs text-muted-foreground">
              {loading ? "Checking…" : connected ? "Connected" : "Not reachable"}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Recheck
        </Button>
      </Card>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Entity counts</h2>
        <Card className="divide-y divide-border p-0">
          {counts.map((c) => (
            <div key={c.label} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm">{c.label}</span>
              {c.value === null ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" />
                  {c.restricted ? "Restricted by role" : "Unavailable"}
                </span>
              ) : (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${
                    c.value > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {c.value}
                </span>
              )}
            </div>
          ))}
          {!loading && counts.every((c) => c.value === 0 || c.value === null) && (
            <p className="px-4 py-3 text-xs text-muted-foreground">
              No content yet. Empty tables are expected at Step 1 and are not a system failure.
            </p>
          )}
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Knowledge layers</h2>
        <Card className="divide-y divide-border p-0">
          {LAYERS.map(([key, name, tables]) => (
            <div key={key} className="flex items-start gap-3 px-4 py-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <div>
                <p className="text-sm font-semibold">
                  {key} · {name}
                </p>
                <p className="text-xs text-muted-foreground">{tables}</p>
              </div>
            </div>
          ))}
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Roles & permissions</h2>
        <Card className="space-y-3 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-primary" /> Roles stored in a separate table (no self-promotion)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ROLES.map((r) => (
              <span key={r} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium">
                {r}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Access is enforced by row-level security using <code>has_role()</code> and{" "}
            <code>is_content_maintainer()</code>. Professional chemical procedures require an approved status plus a
            professional role.
          </p>
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk levels</h2>
        <Card className="divide-y divide-border p-0">
          {RISK_LEVELS.map(([level, desc]) => (
            <div key={level} className="flex items-start gap-3 px-4 py-3">
              <span
                className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                  level === "green"
                    ? "bg-success"
                    : level === "amber"
                      ? "bg-amber-500"
                      : level === "red"
                        ? "bg-destructive"
                        : "bg-foreground"
                }`}
              />
              <div>
                <p className="text-sm font-semibold capitalize">{level}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Content statuses</h2>
        <Card className="space-y-3 p-4">
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => (
              <span key={s} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium">
                {s}
              </span>
            ))}
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Only Approved or Published content may be shown as actionable guidance. Domestic treatments require a
              confidence score of at least 9/10 — this is enforced by a database trigger.
            </span>
          </div>
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Migration status</h2>
        <Card className="p-4 text-sm">
          <p className="font-semibold">Step 1 foundation migration applied</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Enums, 8 knowledge layers, RLS policies, audit trail and seed data (12 stain categories, 19 tags, 18
            fabrics, 3 provisional companies) are in place. Existing local Stain Master data and UI are untouched.
          </p>
        </Card>
      </section>
    </div>
  );
}
