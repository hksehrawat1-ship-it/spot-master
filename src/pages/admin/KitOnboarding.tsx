/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Kit onboarding workflow — the single, repeatable path for adding any spotting-kit company.
 * Step order is enforced by the data itself: a later step cannot complete before the earlier one.
 * Adding a new company is content work only; nothing here is hardcoded to a manufacturer.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { useCatalogCompanies, useCatalogKits, useCatalogProducts, useSourceDocuments } from "@/hooks/useProductCatalog";
import { useGuidanceMappings } from "@/hooks/useGuidanceMappings";
import { recordProductAudit } from "@/lib/productCatalog";
import { ArrowLeft, CheckCircle2, Circle, ShieldAlert } from "lucide-react";

type Step = { key: string; title: string; detail: string; done: boolean; count: string };

export default function KitOnboarding() {
  const { can } = useAuth();
  const isMaintainer = can("products.manage") || can("content.draft.edit");

  const companies = useCatalogCompanies();
  const kits = useCatalogKits();
  const products = useCatalogProducts();
  const documents = useSourceDocuments();
  const mappings = useGuidanceMappings({ includeDrafts: true });

  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [batchName, setBatchName] = useState("");
  const [rawRows, setRawRows] = useState("");

  const staging = useQuery({
    queryKey: ["import-staging"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("import_staging_rows")
        .select("id, batch_id, entity_kind, row_number, payload, duplicate_of, validation_errors, missing_fields, staging_status")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const scoped = useMemo(() => {
    const cid = companyFilter || null;
    const kitRows = (kits.data ?? []).filter((k) => !cid || k.company_id === cid);
    const productRows = (products.data ?? []).filter((p) => !cid || p.companyId === cid);
    const docRows = (documents.data ?? []).filter((d: any) => !cid || d.company_id === cid);
    const mapRows = (mappings.data ?? []).filter(
      (m) => !cid || productRows.some((p) => p.id === m.product_id),
    );
    return { kitRows, productRows, docRows, mapRows };
  }, [companyFilter, kits.data, products.data, documents.data, mappings.data]);

  const versionsWithDocs = scoped.productRows.filter((p) => !!p.currentVersion).length;

  const steps: Step[] = [
    {
      key: "company",
      title: "1. Company",
      detail: "Register the manufacturer or distributor, with its verification state.",
      done: (companies.data ?? []).length > 0,
      count: `${(companies.data ?? []).length} on record`,
    },
    {
      key: "kit",
      title: "2. Kit",
      detail: "Record the kit, its claimed product count and its intended market.",
      done: scoped.kitRows.length > 0,
      count: `${scoped.kitRows.length} kit(s)`,
    },
    {
      key: "documents",
      title: "3. Source documents",
      detail: "Upload or reference the label, TDS, SDS or spotting chart, and state the issuer.",
      done: scoped.docRows.length > 0,
      count: `${scoped.docRows.length} document(s)`,
    },
    {
      key: "products",
      title: "4. Products",
      detail: "Create one product identity record per bottle, linked to the kit.",
      done: scoped.productRows.length > 0,
      count: `${scoped.productRows.length} product(s)`,
    },
    {
      key: "versions",
      title: "5. Versions",
      detail: "Each product needs a country- and label-specific version before approval.",
      done: versionsWithDocs === scoped.productRows.length && scoped.productRows.length > 0,
      count: `${versionsWithDocs}/${scoped.productRows.length} versioned`,
    },
    {
      key: "approval",
      title: "6. Technical approval",
      detail: "Server-side gate: documents, safety data and a written reason are required.",
      done: scoped.productRows.some((p) => p.approved),
      count: `${scoped.productRows.filter((p) => p.approved).length} approved`,
    },
    {
      key: "mapping",
      title: "7. Stain guidance mapping",
      detail: "Only after approval may a product be mapped to an exact stain record.",
      done: scoped.mapRows.some((m) => ["approved", "published"].includes(m.approval_status)),
      count: `${scoped.mapRows.length} mapping(s)`,
    },
  ];

  if (!isMaintainer) {
    return (
      <div className="space-y-3 p-4 pb-24">
        <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Product library
        </Link>
        <Card className="space-y-1 border-amber-500/40 p-4">
          <div className="flex items-center gap-2 text-amber-600">
            <ShieldAlert className="h-4 w-4" />
            <p className="text-sm font-semibold">Maintainer access only</p>
          </div>
          <p className="text-sm">Kit onboarding is restricted to authorised content maintainers.</p>
        </Card>
      </div>
    );
  }

  const stageBatch = async () => {
    const lines = rawRows.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!batchName.trim() || lines.length === 0) return toast.error("A batch name and at least one row are required.");

    const { data: batch, error: batchError } = await supabase
      .from("import_batches")
      .insert({ batch_name: batchName.trim(), status: "staged", validation_status: "pending_review" })
      .select("id")
      .single();
    if (batchError || !batch) return toast.error(batchError?.message ?? "Batch could not be created.");

    const existingNames = new Set((products.data ?? []).map((p) => p.name.toLowerCase()));
    const rows = lines.map((line, i) => {
      const [name, code, country, doc] = line.split("|").map((s) => (s ?? "").trim());
      const missing: string[] = [];
      if (!name) missing.push("product_name");
      if (!country) missing.push("country");
      if (!doc) missing.push("source_document");
      return {
        batch_id: batch.id,
        entity_kind: "product",
        row_number: i + 1,
        payload: { product_name: name, product_code: code || null, country: country || null, source_document: doc || null },
        duplicate_of: existingNames.has(name.toLowerCase()) ? name : null,
        validation_errors: [],
        missing_fields: missing,
        staging_status: missing.length || existingNames.has(name.toLowerCase()) ? "needs_review" : "staged",
      };
    });

    const { error } = await supabase.from("import_staging_rows").insert(rows);
    if (error) return toast.error(error.message);
    await recordProductAudit({
      entityTable: "import_batches",
      entityId: batch.id,
      action: "stage_import_batch",
      newValue: `${rows.length} rows`,
      reason: `Batch import staged: ${batchName.trim()}. Rows remain unpublished until each is reviewed.`,
    });
    toast.success(`${rows.length} row(s) staged for review. Nothing was published.`);
    setRawRows("");
    setBatchName("");
    void staging.refetch();
  };

  return (
    <div className="pb-24">
      <div className="space-y-2 bg-gradient-to-br from-primary/15 to-accent/10 p-4">
        <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Product library
        </Link>
        <h1 className="text-xl font-bold">Kit onboarding</h1>
        <p className="text-xs text-muted-foreground">
          The same seven steps apply to every company. No manufacturer is treated as a special case.
        </p>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            className={`rounded-full border px-3 py-1 text-xs font-medium ${!companyFilter ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted/40 text-muted-foreground"}`}
            onClick={() => setCompanyFilter("")}
          >
            All companies
          </button>
          {(companies.data ?? []).map((c) => (
            <button
              key={c.id}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${companyFilter === c.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted/40 text-muted-foreground"}`}
              onClick={() => setCompanyFilter(c.id)}
            >
              {c.company_name}
            </button>
          ))}
        </div>

        <ol className="space-y-2">
          {steps.map((s) => (
            <li key={s.key}>
              <Card className="flex items-start gap-3 p-3">
                {s.done ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.detail}</p>
                  <p className="text-[11px] text-muted-foreground">{s.count}</p>
                </div>
              </Card>
            </li>
          ))}
        </ol>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/admin/products">Product approval queue</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/admin/mapping-editor">Guidance mapping editor</Link>
          </Button>
        </div>

        <Card className="space-y-2 p-4">
          <p className="text-sm font-semibold">Batch import (staging only)</p>
          <p className="text-xs text-muted-foreground">
            One row per line: product name | product code | country | source document. Rows are parsed into a review
            queue. Nothing becomes a live product or approved guidance from an import.
          </p>
          <Input placeholder="Batch name" value={batchName} onChange={(e) => setBatchName(e.target.value)} />
          <Textarea
            rows={5}
            value={rawRows}
            onChange={(e) => setRawRows(e.target.value)}
            placeholder="Prespot X | SZ-001 | IN | Seitz spotting chart 2024"
          />
          <Button size="sm" onClick={stageBatch}>Stage rows for review</Button>
        </Card>

        <Card className="space-y-2 p-4">
          <p className="text-sm font-semibold">Staged rows awaiting review</p>
          {(staging.data ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">No staged rows.</p>
          ) : (
            <ul className="space-y-1 text-xs">
              {(staging.data ?? []).map((r: any) => (
                <li key={r.id} className="flex items-start justify-between gap-2 border-b border-border pb-1">
                  <span>
                    #{r.row_number} {r.payload?.product_name ?? "(no name)"}
                    {r.duplicate_of ? ` · possible duplicate of ${r.duplicate_of}` : ""}
                    {r.missing_fields?.length ? ` · missing: ${r.missing_fields.join(", ")}` : ""}
                  </span>
                  <Badge variant="outline">{r.staging_status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
