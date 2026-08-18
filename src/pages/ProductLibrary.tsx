/** STEP 7 — professional product library (summary cards only, never actionable instructions). */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/store/useProducts";
import { useAuth } from "@/auth/AuthProvider";
import {
  currentVersion, documentsFor, evaluateScorecard, detectConflicts, filterProducts,
  productCard, OVERALL_LABEL,
} from "@/lib/productEngine";
import type { LibraryFilters } from "@/lib/productEngine";
import { ArrowLeft, FlaskConical, ShieldAlert } from "lucide-react";

const chip = (active: boolean) =>
  `rounded-full border px-3 py-1 text-xs font-medium transition ${
    active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted/40 text-muted-foreground"
  }`;

export default function ProductLibrary() {
  const store = useProducts();
  const { user, isAdmin } = useAuth();
  const isProfessional = isAdmin;

  const products = useMemo(() => store.products(), [store.productOverrides, store.customProducts]);
  const companies = useMemo(() => store.companies(), [store.companyOverrides, store.customCompanies]);
  const kits = useMemo(() => store.kits(), [store.kitOverrides, store.customKits]);
  const documents = useMemo(() => store.documents(), [store.documentOverrides, store.customDocuments]);

  const [filters, setFilters] = useState<LibraryFilters>({ activeOnly: true });

  const cardFor = useMemo(() => {
    const cache = new Map<string, ReturnType<typeof evaluateScorecard>>();
    return (p: typeof products[number]) => {
      if (!cache.has(p.key)) {
        const v = currentVersion(p);
        const docs = documentsFor(p, documents);
        cache.set(p.key, evaluateScorecard(p, v, docs, companies.find((c) => c.key === p.companyKey), detectConflicts(p, v, docs)));
      }
      return cache.get(p.key)!;
    };
  }, [products, companies, documents]);

  const visible = filterProducts(products, filters, cardFor);

  const set = (patch: Partial<LibraryFilters>) => setFilters((f) => ({ ...f, ...patch }));

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
              {visible.length} of {products.length} products · identity records only until documentation is verified
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <Input
          placeholder="Search product, code or ID"
          value={filters.query ?? ""}
          onChange={(e) => set({ query: e.target.value })}
        />

        <div className="flex flex-wrap gap-2">
          <button className={chip(!filters.companyKey)} onClick={() => set({ companyKey: undefined })}>All companies</button>
          {companies.map((c) => (
            <button key={c.key} className={chip(filters.companyKey === c.key)} onClick={() => set({ companyKey: c.key })}>
              {c.displayName}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button className={chip(!filters.kitKey)} onClick={() => set({ kitKey: undefined })}>All kits</button>
          {kits.map((k) => (
            <button key={k.key} className={chip(filters.kitKey === k.key)} onClick={() => set({ kitKey: k.key })}>
              {k.kitDisplayName}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button className={chip(!!filters.activeOnly)} onClick={() => set({ activeOnly: !filters.activeOnly })}>Active only</button>
          <button className={chip(filters.documentCompleteness === "incomplete")}
            onClick={() => set({ documentCompleteness: filters.documentCompleteness === "incomplete" ? undefined : "incomplete" })}>
            Documentation incomplete
          </button>
          <button className={chip(!!filters.needsReviewOnly)} onClick={() => set({ needsReviewOnly: !filters.needsReviewOnly })}>
            Needs review
          </button>
          <button className={chip(!!filters.safetyWarningOnly)} onClick={() => set({ safetyWarningOnly: !filters.safetyWarningOnly })}>
            Safety warning
          </button>
          <button className={chip(filters.country === "IN")} onClick={() => set({ country: filters.country === "IN" ? undefined : "IN" })}>
            India
          </button>
        </div>

        {!isProfessional && (
          <Card className="border-amber-500/40 bg-amber-500/5 p-3 text-xs text-muted-foreground">
            These products are intended for trained professionals. Procedures, dilutions, neutralisation and
            hazardous-component handling are not shown here.
          </Card>
        )}

        <div className="space-y-3">
          {visible.map((p) => {
            const card = cardFor(p);
            const view = productCard(p, companies.find((c) => c.key === p.companyKey), card);
            return (
              <Link key={p.key} to={`/products/${p.key}`}>
                <Card className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{view.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {view.productId} · {view.company}
                      </p>
                    </div>
                    <Badge variant={card.overall === "fully_verified" ? "default" : "secondary"}>
                      {OVERALL_LABEL[card.overall]}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-0.5">Code {view.productCode}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5">Country {view.country}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5">Pack {view.packSize}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5">Docs {view.documentCompleteness}</span>
                    {view.kits.map((k) => (
                      <span key={k} className="rounded-full bg-muted px-2 py-0.5">{k}</span>
                    ))}
                  </div>
                  <p className="flex items-start gap-1 text-xs text-destructive">
                    <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {view.mainSafetyWarning}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Last reviewed: {view.lastReviewed}</p>
                </Card>
              </Link>
            );
          })}
          {!visible.length && <p className="text-sm text-muted-foreground">No products match these filters.</p>}
        </div>

        {isProfessional && (
          <Button asChild variant="outline" className="w-full rounded-full">
            <Link to="/admin/products">Open product administration</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
