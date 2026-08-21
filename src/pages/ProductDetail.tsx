/**
 * Product detail — reads the canonical tables only.
 * Shows identity, versions, document evidence, safety data and approved guidance.
 * Missing information is stated honestly and never inferred.
 */

import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useCatalogProduct, useProductEvidence } from "@/hooks/useProductCatalog";
import { DOCUMENT_ROLE_LABEL, STATUS_LABEL, UNKNOWN_STATES } from "@/lib/productCatalog";
import type { DocumentRole } from "@/lib/productCatalog";
import { ArrowLeft, FileText, ShieldAlert } from "lucide-react";

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border py-1.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value?.trim() ? value : UNKNOWN_STATES.notDisclosed}</span>
    </div>
  );
}

export default function ProductDetail() {
  const { productRef } = useParams();
  const { can } = useAuth();
  const isProfessional = can("products.manage") || can("content.draft.edit") || can("safety.override.request");
  const isMaintainer = can("products.manage") || can("content.draft.edit");

  const product = useCatalogProduct(productRef);
  const p = product.data;
  const evidence = useProductEvidence(p?.id);

  const guidance = useQuery({
    queryKey: ["product-guidance", p?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_guidance_mappings")
        .select(
          "id, mapping_ref, decision, country, approval_status, evidence_level, source_section, mandatory_hidden_test, stain_records:stain_record_id ( stable_id, canonical_name )",
        )
        .eq("product_id", p!.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!p?.id,
  });

  const audit = useQuery({
    queryKey: ["product-audit", p?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_audit_log")
        .select("id, action, field_key, previous_value, new_value, reason, created_at, safety_critical")
        .eq("product_id", p!.id)
        .order("created_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!p?.id && isMaintainer,
  });

  if (product.isLoading) return <p className="p-4 text-sm text-muted-foreground">Loading product record…</p>;

  if (!p) {
    return (
      <div className="space-y-3 p-4">
        <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Product library
        </Link>
        <Card className="p-4 text-sm">
          This product record is not available to your access level, or it does not exist.
        </Card>
      </div>
    );
  }

  const v = p.currentVersion;

  return (
    <div className="space-y-4 p-4 pb-24">
      <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Product library
      </Link>

      <Card className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold">{p.name}</h1>
            <p className="text-xs text-muted-foreground">
              {p.productRef} · {p.companyName}
            </p>
          </div>
          <Badge variant={p.approved ? "default" : "secondary"}>
            {p.approved ? "Approved" : STATUS_LABEL[p.status] ?? p.status}
          </Badge>
        </div>
        {!p.approved && (
          <p className="flex items-start gap-1 text-xs text-amber-600">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            This record is not approved. It is shown as an identity record only; no dilution, contact time or
            procedure is published.
          </p>
        )}
        <Row label="Product code" value={p.productCode} />
        <Row label="Brand" value={p.brand} />
        <Row label="Company verification" value={STATUS_LABEL[p.companyVerification] ?? p.companyVerification} />
        <Row label="Kits" value={p.kits.map((k) => k.name).join(", ") || UNKNOWN_STATES.notApplicable} />
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Current version</p>
        {!v ? (
          <p className="text-sm text-muted-foreground">No version record exists yet ({UNKNOWN_STATES.pendingDocument}).</p>
        ) : (
          <>
            <Row label="Version reference" value={v.version_ref} />
            <Row label="Country / market" value={v.country} />
            <Row label="Label version" value={v.label_version} />
            <Row label="SDS version" value={v.sds_version} />
            <Row label="TDS version" value={v.tds_version} />
            <Row label="Approval" value={STATUS_LABEL[v.approval_status] ?? v.approval_status} />
            <Row label="Verification" value={STATUS_LABEL[v.verification_status] ?? v.verification_status} />
            {v.provisional && (
              <p className="text-xs text-amber-600">Provisional record — created during structural migration.</p>
            )}
          </>
        )}
        {p.versions.length > 1 && (
          <p className="text-xs text-muted-foreground">
            {p.versions.length} versions on record. Approved versions are immutable; changes create a new version.
          </p>
        )}
      </Card>

      <Card className="space-y-2 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4" /> Document evidence
        </p>
        {(evidence.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No document is linked to this product yet. Guidance cannot be approved without a document reference.
          </p>
        ) : (
          <ul className="space-y-2 text-xs">
            {(evidence.data ?? []).map((d: any) => (
              <li key={d.id} className="rounded-md border border-border p-2">
                <p className="font-medium">{d.source_documents?.document_title ?? "Document not readable"}</p>
                <p className="text-muted-foreground">
                  {DOCUMENT_ROLE_LABEL[d.document_role as DocumentRole] ?? d.document_role} ·{" "}
                  {STATUS_LABEL[d.verification_status] ?? d.verification_status}
                </p>
                {d.source_section && <p className="text-muted-foreground">Section: {d.source_section}</p>}
                {d.notes && <p className="mt-1 text-muted-foreground">{d.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {isProfessional && (
        <Card className="space-y-2 p-4">
          <p className="text-sm font-semibold">Safety information on record</p>
          <Row label="Documented warnings" value={p.safetyWarnings} />
          <Row label="PPE" value={p.ppe} />
          <p className="text-xs text-muted-foreground">
            Safety values are shown exactly as documented. Where a value is missing it is reported as not disclosed,
            never inferred from a similar product.
          </p>
        </Card>
      )}

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Approved stain guidance</p>
        {(guidance.data ?? []).filter((g: any) => ["approved", "published"].includes(g.approval_status)).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No approved product-to-stain guidance exists for this product. The stain library remains fully usable
            without it.
          </p>
        ) : (
          <ul className="space-y-1 text-xs">
            {(guidance.data ?? [])
              .filter((g: any) => ["approved", "published"].includes(g.approval_status))
              .map((g: any) => (
                <li key={g.id} className="rounded-md border border-border p-2">
                  <span className="font-medium">{g.stain_records?.canonical_name}</span>{" "}
                  <span className="text-muted-foreground">({g.stain_records?.stable_id})</span>
                  <p className="text-muted-foreground">
                    {g.decision} · {g.country} · evidence {g.evidence_level}
                    {g.mandatory_hidden_test ? " · hidden test required" : ""}
                  </p>
                </li>
              ))}
          </ul>
        )}
        {isMaintainer && (guidance.data ?? []).some((g: any) => !["approved", "published"].includes(g.approval_status)) && (
          <p className="text-xs text-amber-600">
            {(guidance.data ?? []).filter((g: any) => !["approved", "published"].includes(g.approval_status)).length}{" "}
            unapproved mapping draft(s) exist and are not shown to users.
          </p>
        )}
      </Card>

      {isMaintainer && (
        <Card className="space-y-2 p-4">
          <p className="text-sm font-semibold">Change history</p>
          {(audit.data ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">No recorded changes.</p>
          ) : (
            <ul className="space-y-1 text-[11px]">
              {(audit.data ?? []).map((a: any) => (
                <li key={a.id} className="border-b border-border pb-1">
                  <span className="font-medium">{a.action}</span>
                  {a.field_key ? ` · ${a.field_key}` : ""}
                  {a.safety_critical ? " · safety-critical" : ""} — {a.reason}
                  <span className="block text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
