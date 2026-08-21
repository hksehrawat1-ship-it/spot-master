/**
 * Professional product library — database-backed (canonical tables only).
 * Ordinary professional users see approved records. Maintainers additionally see drafts,
 * clearly labelled. Nothing is served from local storage or static seed data.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/auth/useAccess";
import { useCatalogCompanies, useCatalogKits, useCatalogProducts } from "@/hooks/useProductCatalog";
import { STATUS_LABEL, UNKNOWN_STATES } from "@/lib/productCatalog";
import { ArrowLeft, FlaskConical, ShieldAlert } from "lucide-react";

const chip = (active: boolean) =>
  `rounded-full border px-3 py-1 text-xs font-medium transition ${
    active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted/40 text-muted-foreground"
  }`;

export default function ProductLibrary() {
  const access = useAccess();
  const isMaintainer = access.productDrafts;

  const products = useCatalogProducts();
  const companies = useCatalogCompanies();
  const kits = useCatalogKits();

  const [query, setQuery] = useState("");
  const [companyId, setCompanyId] = useState<string | undefined>();
  const [kitId, setKitId] = useState<string | undefined>();
  const [country, setCountry] = useState<string | undefined>();
  const [draftsOnly, setDraftsOnly] = useState(false);

  const rows = products.data ?? [];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((p) => {
      if (companyId && p.companyId !== companyId) return false;
      if (kitId && !p.kits.some((k) => k.id === kitId)) return false;
      if (country && !(p.currentVersion?.country ?? "").toUpperCase().includes(country)) return false;
      if (draftsOnly && p.approved) return false;
      if (!q) return true;
      return [p.name, p.productRef, p.productCode ?? "", p.brand ?? "", p.companyName]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, query, companyId, kitId, country, draftsOnly]);

  const approvedCount = rows.filter((p) => p.approved).length;

  return (
    <div className="pb-24">
      <div className="bg-gradient-to-br from-primary/15 to-accent/10 p-4 space-y-2">
        <Link to="/stain-master" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Stain Master
        </Link>
        <div className="flex items-center gap-2">
          <FlaskConical className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Professional product library</h1>
            <p className="text-xs text-muted-foreground">
              {approvedCount} approved of {rows.length} readable records · identity records only until
              documentation is verified
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <Input placeholder="Search product, code or reference" value={query} onChange={(e) => setQuery(e.target.value)} />

        <div className="flex flex-wrap gap-2">
          <button className={chip(!companyId)} onClick={() => setCompanyId(undefined)}>All companies</button>
          {(companies.data ?? []).map((c) => (
            <button key={c.id} className={chip(companyId === c.id)} onClick={() => setCompanyId(c.id)}>
              {c.company_name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button className={chip(!kitId)} onClick={() => setKitId(undefined)}>All kits</button>
          {(kits.data ?? []).map((k) => (
            <button key={k.id} className={chip(kitId === k.id)} onClick={() => setKitId(k.id)}>
              {k.kit_name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button className={chip(country === "IN")} onClick={() => setCountry(country === "IN" ? undefined : "IN")}>
            India
          </button>
          {isMaintainer && (
            <button className={chip(draftsOnly)} onClick={() => setDraftsOnly((v) => !v)}>
              Unapproved only
            </button>
          )}
        </div>

        {products.isLoading && <p className="text-sm text-muted-foreground">Loading product records…</p>}
        {products.isError && (
          <Card className="border-destructive/40 p-3 text-sm">
            Product records could not be read. This is a permission or connection problem, not an empty library.
          </Card>
        )}

        {!products.isLoading && rows.length === 0 && (
          <Card className="border-amber-500/40 bg-amber-500/5 p-3 text-sm text-muted-foreground">
            No product records are readable for your access level. Product documentation is being prepared and
            nothing is shown until it is verified.
          </Card>
        )}

        <div className="space-y-3">
          {visible.map((p) => (
            <Link key={p.id} to={`/products/${p.productRef}`}>
              <Card className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.productRef} · {p.companyName}
                    </p>
                  </div>
                  <Badge variant={p.approved ? "default" : "secondary"}>
                    {p.approved ? "Approved" : STATUS_LABEL[p.status] ?? p.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    Code {p.productCode || UNKNOWN_STATES.notDisclosed}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    Version {p.currentVersion?.version_ref ?? UNKNOWN_STATES.pendingDocument}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    Country {p.currentVersion?.country ?? UNKNOWN_STATES.notDisclosed}
                  </span>
                  {p.kits.map((k) => (
                    <span key={k.id} className="rounded-full bg-muted px-2 py-0.5">{k.name}</span>
                  ))}
                </div>
                {!p.approved && (
                  <p className="flex items-start gap-1 text-xs text-amber-600">
                    <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Not approved for guidance. Documentation review is pending; no procedure is shown.
                  </p>
                )}
              </Card>
            </Link>
          ))}
          {rows.length > 0 && !visible.length && (
            <p className="text-sm text-muted-foreground">No products match these filters.</p>
          )}
        </div>

        {isMaintainer && (
          <div className="grid gap-2 sm:grid-cols-2">
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link to="/admin/products">Open product administration</Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link to="/admin/kit-onboarding">Kit onboarding workflow</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
