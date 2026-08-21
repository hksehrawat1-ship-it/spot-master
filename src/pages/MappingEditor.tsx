/**
 * Guidance-mapping editor — canonical `product_guidance_mappings` only.
 * A mapping cannot be created without: exact stain record, product version, decision,
 * country, evidence level, source document, source section, stop conditions and a review note.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { useCatalogProducts, useSourceDocuments } from "@/hooks/useProductCatalog";
import {
  EVIDENCE_LEVELS,
  MAPPING_DECISIONS,
  useApproveGuidanceMapping,
  useCreateGuidanceMapping,
  useGuidanceMappings,
  useStainSearch,
  validateMappingInput,
} from "@/hooks/useGuidanceMappings";
import { ArrowLeft, PencilRuler, ShieldAlert } from "lucide-react";

const chip = (active: boolean) =>
  `rounded-full border px-3 py-1 text-xs font-medium transition ${
    active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted/40 text-muted-foreground"
  }`;

const STOP_CONDITIONS = [
  "hidden_test_failed",
  "colour_bleeding_observed",
  "existing_damage_present",
  "previous_chemical_unknown",
  "fibre_unidentified",
];

export default function MappingEditor() {
  const { can } = useAuth();
  const isReviewer = can("content.technical.approve") || can("products.manage") || can("content.draft.edit");

  const products = useCatalogProducts();
  const documents = useSourceDocuments();
  const mappings = useGuidanceMappings({ includeDrafts: true });
  const create = useCreateGuidanceMapping();
  const approve = useApproveGuidanceMapping();

  const [productId, setProductId] = useState<string>("");
  const [versionId, setVersionId] = useState<string>("");
  const [stainQuery, setStainQuery] = useState("");
  const [stain, setStain] = useState<{ id: string; stable_id: string; canonical_name: string } | null>(null);
  const [decision, setDecision] = useState<string>("not_assessed");
  const [country, setCountry] = useState("IN");
  const [evidenceLevel, setEvidenceLevel] = useState<string>("none");
  const [documentId, setDocumentId] = useState("");
  const [section, setSection] = useState("");
  const [note, setNote] = useState("");
  const [stops, setStops] = useState<string[]>([]);
  const [approvalReason, setApprovalReason] = useState("");

  const stainResults = useStainSearch(stainQuery);
  const product = useMemo(() => (products.data ?? []).find((p) => p.id === productId), [products.data, productId]);

  if (!isReviewer) {
    return (
      <div className="space-y-3 p-4 pb-24">
        <Link to="/stain-master" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Stain Master
        </Link>
        <Card className="space-y-1 border-amber-500/40 p-4">
          <div className="flex items-center gap-2 text-amber-600">
            <ShieldAlert className="h-4 w-4" />
            <p className="text-sm font-semibold">Reviewer access only</p>
          </div>
          <p className="text-sm">Guidance mappings can only be created or changed by an authorised technical reviewer.</p>
        </Card>
      </div>
    );
  }

  const draft = {
    productId,
    productVersionId: versionId,
    stainRecordId: stain?.id ?? "",
    stainStableId: stain?.stable_id ?? "",
    decision,
    country,
    evidenceLevel,
    sourceDocumentId: documentId,
    sourceSection: section,
    reviewNote: note,
    stopConditions: stops,
    approvalStatus: "draft" as const,
  };
  const missing = validateMappingInput(draft);

  const submit = async () => {
    const res = await create.mutateAsync(draft);
    toast[res.ok ? "success" : "error"](res.message);
    if (res.ok) {
      setStain(null);
      setStainQuery("");
      setNote("");
      setSection("");
      setStops([]);
      setDecision("not_assessed");
      setEvidenceLevel("none");
    }
  };

  return (
    <div className="pb-24">
      <div className="space-y-2 bg-gradient-to-br from-primary/15 to-accent/10 p-4">
        <Link to="/admin/mapping-matrix" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Mapping matrix
        </Link>
        <div className="flex items-center gap-2">
          <PencilRuler className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Guidance-mapping editor</h1>
            <p className="text-xs text-muted-foreground">
              One product version, one exact stain record, one country, one cited document.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <Card className="space-y-3 p-4">
          <p className="text-sm font-semibold">Product</p>
          <div className="flex flex-wrap gap-2">
            {(products.data ?? []).slice(0, 60).map((p) => (
              <button
                key={p.id}
                className={chip(p.id === productId)}
                onClick={() => {
                  setProductId(p.id);
                  setVersionId(p.currentVersion?.id ?? "");
                }}
              >
                {p.name}
              </button>
            ))}
          </div>

          {product && (
            <>
              <p className="text-sm font-semibold">Product version</p>
              <div className="flex flex-wrap gap-2">
                {product.versions.map((v) => (
                  <button key={v.id} className={chip(v.id === versionId)} onClick={() => setVersionId(v.id)}>
                    {v.version_ref} · {v.country} · {v.approval_status}
                  </button>
                ))}
                {product.versions.length === 0 && (
                  <p className="text-xs text-muted-foreground">This product has no version record yet.</p>
                )}
              </div>
            </>
          )}
        </Card>

        <Card className="space-y-3 p-4">
          <p className="text-sm font-semibold">Exact stain record</p>
          <Input
            placeholder="Search the stain library (minimum 2 characters)"
            value={stainQuery}
            onChange={(e) => setStainQuery(e.target.value)}
          />
          {stain && (
            <p className="text-xs">
              Selected: <span className="font-medium">{stain.canonical_name}</span> ({stain.stable_id})
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {(stainResults.data ?? []).map((s: any) => (
              <button
                key={s.id}
                className={chip(stain?.id === s.id)}
                onClick={() => setStain({ id: s.id, stable_id: s.stable_id, canonical_name: s.canonical_name })}
              >
                {s.canonical_name}
              </button>
            ))}
          </div>
        </Card>

        <Card className="space-y-3 p-4">
          <p className="text-sm font-semibold">Decision</p>
          <div className="flex flex-wrap gap-2">
            {MAPPING_DECISIONS.map((d) => (
              <button key={d} className={chip(d === decision)} onClick={() => setDecision(d)}>
                {d.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          <p className="text-sm font-semibold">Evidence level</p>
          <div className="flex flex-wrap gap-2">
            {EVIDENCE_LEVELS.map((e) => (
              <button key={e} className={chip(e === evidenceLevel)} onClick={() => setEvidenceLevel(e)}>
                {e.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          <p className="text-sm font-semibold">Mandatory stop conditions</p>
          <div className="flex flex-wrap gap-2">
            {STOP_CONDITIONS.map((s) => (
              <button
                key={s}
                className={chip(stops.includes(s))}
                onClick={() => setStops((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))}
              >
                {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          <p className="text-sm font-semibold">Country</p>
          <Input value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} className="max-w-40" />

          <p className="text-sm font-semibold">Source document</p>
          <div className="flex flex-wrap gap-2">
            {(documents.data ?? []).map((d: any) => (
              <button key={d.id} className={chip(d.id === documentId)} onClick={() => setDocumentId(d.id)}>
                {d.document_title}
              </button>
            ))}
          </div>

          <p className="text-sm font-semibold">Source section</p>
          <Input value={section} onChange={(e) => setSection(e.target.value)} placeholder="Page, table or section reference" />

          <p className="text-sm font-semibold">Review note</p>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why this mapping is justified by the cited source." />

          {missing.length > 0 && (
            <p className="text-xs text-destructive">Incomplete: {missing.join(", ")}. A partial mapping cannot be saved.</p>
          )}
          <Button size="sm" disabled={missing.length > 0 || create.isPending} onClick={submit}>
            Save draft mapping
          </Button>
        </Card>

        <Card className="space-y-2 p-4">
          <p className="text-sm font-semibold">Existing mappings</p>
          <Textarea
            value={approvalReason}
            onChange={(e) => setApprovalReason(e.target.value)}
            placeholder="Approval reason (required to approve a mapping)."
          />
          {(mappings.data ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">No guidance mappings exist yet.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {(mappings.data ?? []).map((m) => (
                <li key={m.id} className="space-y-1 rounded-md border border-border p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{m.stain_records?.canonical_name ?? m.stain_record_id}</span>
                    <Badge variant="outline">{m.approval_status}</Badge>
                  </div>
                  <p className="text-muted-foreground">
                    {m.professional_products?.display_name ?? m.professional_products?.product_name} ·{" "}
                    {m.product_versions?.version_ref} · {m.country} · {m.decision}
                  </p>
                  {!["approved", "published"].includes(m.approval_status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={approve.isPending}
                      onClick={async () => {
                        if (approvalReason.trim().length < 10) return toast.error("A written approval reason is required.");
                        const res = await approve.mutateAsync({ id: m.id, target: "approved", reason: approvalReason.trim() });
                        if (res.ok) toast.success("Mapping approved.");
                        else toast.error(res.blockers[0] ?? "Approval refused by the publication gate.");
                      }}
                    >
                      Approve
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
