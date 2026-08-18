/** STEP 8 — reviewer tool for creating, justifying and approving product-to-stage mappings. */

import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useMappings } from "@/store/useMappings";
import { useProducts } from "@/store/useProducts";
import { useAuth } from "@/auth/AuthProvider";
import { TREATMENT_STAGES } from "@/data/treatmentStages";
import {
  DECISION_LABEL, MAPPING_DECISIONS, MAPPING_STATUSES, MAPPING_STATUS_LABEL,
  MAPPING_EVIDENCE_LEVELS, EVIDENCE_LEVEL_LABEL,
} from "@/data/productMappings";
import type { MappingDecision, MappingEvidenceLevel, MappingStatus } from "@/data/productMappings";
import { validateMapping, REVIEW_TRIGGERS, REVIEW_TRIGGER_LABEL } from "@/lib/mappingEngine";
import type { ReviewTrigger } from "@/lib/mappingEngine";
import { ArrowLeft, PencilRuler, ShieldAlert } from "lucide-react";

const chip = (active: boolean) =>
  `rounded-full border px-3 py-1 text-xs font-medium transition ${
    active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted/40 text-muted-foreground"
  }`;

export default function MappingEditor() {
  const store = useMappings();
  const productStore = useProducts();
  const { user, isAdmin } = useAuth();
  const by = user?.email ?? "reviewer";
  const isReviewer = isAdmin;

  const [params, setParams] = useSearchParams();
  const mappings = useMemo(() => store.mappings(), [store.mappingOverrides, store.customMappings]);
  const products = useMemo(() => productStore.products(), [productStore.productOverrides, productStore.customProducts]);

  const activeId = params.get("mapping") ?? mappings[0]?.mappingId;
  const mapping = mappings.find((m) => m.mappingId === activeId);

  const [justification, setJustification] = useState("");
  const [trigger, setTrigger] = useState<ReviewTrigger>(REVIEW_TRIGGERS[0]);

  if (!isReviewer) {
    return (
      <div className="p-4 space-y-3 pb-24">
        <Link to="/stain-master" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Stain Master
        </Link>
        <Card className="p-4 border-amber-500/40 space-y-1">
          <div className="flex items-center gap-2 text-amber-600">
            <ShieldAlert className="h-4 w-4" /><p className="font-semibold text-sm">Reviewer access only</p>
          </div>
          <p className="text-sm">Mapping records can only be created or changed by an authorised technical reviewer.</p>
        </Card>
      </div>
    );
  }

  const issues = mapping ? validateMapping(mapping) : [];

  const update = (patch: Parameters<typeof store.updateMapping>[1]) => {
    if (!mapping) return;
    const res = store.updateMapping(mapping.mappingId, patch, { by, justification });
    toast[res.ok ? "success" : "error"](res.message);
    if (res.ok) setJustification("");
  };

  const setStatus = (status: MappingStatus) => {
    if (!mapping) return;
    const res = store.setStatus(mapping.mappingId, status, { by, justification });
    toast[res.ok ? "success" : "error"](res.message);
    if (res.ok) setJustification("");
  };

  return (
    <div className="pb-24">
      <div className="bg-gradient-to-br from-primary/15 to-accent/10 p-4 space-y-2">
        <Link to="/admin/mapping-matrix" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Mapping matrix
        </Link>
        <div className="flex items-center gap-2">
          <PencilRuler className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Product-mapping editor</h1>
            <p className="text-xs text-muted-foreground">
              Every mapping is tied to one product version, one country and recorded evidence.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              const product = products[0];
              if (!product) return toast.error("No products available.");
              const created = store.createMapping(
                { productKey: product.key, productVersionKey: product.currentVersionKey, companyKey: product.companyKey },
                by,
              );
              setParams({ mapping: created.mappingId });
              toast.success(`Draft ${created.mappingId} created.`);
            }}
          >
            New draft mapping
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {mappings.slice(0, 40).map((m) => (
            <button key={m.mappingId} className={chip(m.mappingId === activeId)} onClick={() => setParams({ mapping: m.mappingId })}>
              {m.mappingId}
            </button>
          ))}
        </div>

        {!mapping ? (
          <p className="text-sm text-muted-foreground">Select a mapping to edit.</p>
        ) : (
          <>
            <Card className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{products.find((p) => p.key === mapping.productKey)?.displayName ?? mapping.productKey}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {mapping.mappingId} · version {mapping.version} · {mapping.productVersionKey}
                  </p>
                </div>
                <Badge variant="outline">{MAPPING_STATUS_LABEL[mapping.status]}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Stage {mapping.stageNumber} — {TREATMENT_STAGES.find((s) => s.stageNumber === mapping.stageNumber)?.name}
              </p>
              {mapping.manufacturerClaim && (
                <p className="text-xs">Manufacturer claim: {mapping.manufacturerClaim}</p>
              )}
            </Card>

            <Card className="p-4 space-y-3">
              <p className="text-sm font-semibold">Stage</p>
              <div className="flex flex-wrap gap-2">
                {TREATMENT_STAGES.filter((s) => s.actionable).map((s) => (
                  <button key={s.stageId} className={chip(s.stageNumber === mapping.stageNumber)} onClick={() => update({ stageNumber: s.stageNumber })}>
                    {s.stageNumber}
                  </button>
                ))}
              </div>

              <p className="text-sm font-semibold">Decision</p>
              <div className="flex flex-wrap gap-2">
                {MAPPING_DECISIONS.map((d: MappingDecision) => (
                  <button key={d} className={chip(d === mapping.decision)} onClick={() => update({ decision: d })}>
                    {DECISION_LABEL[d]}
                  </button>
                ))}
              </div>

              <p className="text-sm font-semibold">Evidence level</p>
              <div className="flex flex-wrap gap-2">
                {MAPPING_EVIDENCE_LEVELS.map((e: MappingEvidenceLevel) => (
                  <button key={e} className={chip(e === mapping.evidenceLevel)} onClick={() => update({ evidenceLevel: e })}>
                    {EVIDENCE_LEVEL_LABEL[e]}
                  </button>
                ))}
              </div>

              <p className="text-sm font-semibold">Country</p>
              <Input
                defaultValue={mapping.country}
                onBlur={(e) => e.target.value !== mapping.country && update({ country: e.target.value })}
                className="max-w-40"
              />

              <p className="text-sm font-semibold">Reviewer notes</p>
              <Textarea
                defaultValue={mapping.notes ?? ""}
                onBlur={(e) => e.target.value !== (mapping.notes ?? "") && update({ notes: e.target.value })}
              />
            </Card>

            <Card className="p-4 space-y-2">
              <p className="text-sm font-semibold">Justification (required for safety-critical changes)</p>
              <Textarea value={justification} onChange={(e) => setJustification(e.target.value)}
                placeholder="Cite the document, version and reason for this change." />
              <div className="flex flex-wrap gap-2">
                {MAPPING_STATUSES.map((s: MappingStatus) => (
                  <Button key={s} size="sm" variant={s === mapping.status ? "default" : "outline"} onClick={() => setStatus(s)}>
                    {MAPPING_STATUS_LABEL[s]}
                  </Button>
                ))}
              </div>
            </Card>

            <Card className={`p-4 space-y-2 ${issues.some((i) => i.severity === "error") ? "border-destructive/50" : ""}`}>
              <p className="text-sm font-semibold">Validation</p>
              {issues.length === 0 ? (
                <p className="text-sm text-muted-foreground">No blocking issues.</p>
              ) : (
                <ul className="list-disc pl-5 text-xs space-y-1">
                  {issues.map((i) => (
                    <li key={i.field + i.message} className={i.severity === "error" ? "text-destructive" : "text-muted-foreground"}>
                      <span className="font-medium capitalize">{i.field.replace(/_/g, " ")}: </span>{i.message}
                    </li>
                  ))}
                </ul>
              )}
              {mapping.flags.length > 0 && (
                <ul className="list-disc pl-5 text-[11px] text-muted-foreground space-y-0.5">
                  {mapping.flags.map((f) => <li key={f}>{f}</li>)}
                </ul>
              )}
            </Card>
          </>
        )}

        <Card className="p-4 space-y-2">
          <p className="text-sm font-semibold">Review trigger</p>
          <div className="flex flex-wrap gap-2">
            {REVIEW_TRIGGERS.map((t) => (
              <button key={t} className={chip(t === trigger)} onClick={() => setTrigger(t)}>
                {REVIEW_TRIGGER_LABEL[t]}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const n = store.triggerReview(trigger, mapping ? { productKey: mapping.productKey } : {}, by);
              toast.success(`${n} mapping(s) returned to review. Previous versions are retained.`);
            }}
          >
            Apply trigger to this product's mappings
          </Button>
        </Card>

        <Card className="p-4 space-y-2">
          <p className="text-sm font-semibold">Change history</p>
          {store.audit.length === 0 ? (
            <p className="text-xs text-muted-foreground">No changes recorded yet.</p>
          ) : (
            <ul className="space-y-1 text-[11px]">
              {store.audit.slice(0, 20).map((a) => (
                <li key={a.id} className="flex justify-between gap-2 border-b border-border pb-1">
                  <span>
                    {a.mappingId} · {a.action}{a.safetyCritical ? " · safety-critical" : ""} — {a.justification}
                  </span>
                  <span className="text-muted-foreground">{new Date(a.at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
