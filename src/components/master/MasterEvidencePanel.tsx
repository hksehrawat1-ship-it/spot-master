import { Textarea } from "@/components/ui/textarea";
import { FieldRow, PanelSection } from "@/components/master/MasterControls";
import {
  EVIDENCE_KINDS,
  NOT_VERIFIED,
  REFERENCE_FIELDS,
  SUPERSEDED_WARNING,
} from "@/data/masterSpotter";
import type { MasterInstructionCard } from "@/lib/masterEngine";
import { useTechnicalReferences } from "@/hooks/useMasterCase";
import { useMaster } from "@/store/useMaster";

/** "Evidence" tab — diagnostic evidence workspace and approved technical references. */
export default function MasterEvidencePanel({ card }: { card: MasterInstructionCard }) {
  const { current, patchPath } = useMaster();
  const references = useTechnicalReferences(card.product?.productId ?? null);
  const ev = current.evidencePanel;

  const list = (key: "observed" | "supporting" | "contradicting" | "alternatives" | "sources", label: string, hint: string) => (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold" htmlFor={`ev-${key}`}>{label}</label>
      <Textarea
        id={`ev-${key}`}
        rows={2}
        placeholder={hint}
        value={ev[key].join("\n")}
        onChange={(e) => patchPath("evidencePanel", { [key]: e.target.value.split("\n").filter((s) => s.trim()) } as never)}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <PanelSection title="Diagnostic evidence" description="One item per line.">
        <div className="space-y-3">
          {list("observed", "Observed evidence", "What can actually be seen or measured")}
          {list("supporting", "Evidence supporting the primary diagnosis", "")}
          {list("contradicting", "Evidence contradicting the diagnosis", "")}
          {list("alternatives", "Plausible alternatives", "")}
          {list("sources", "Evidence sources", "Document, section or reviewed record")}
        </div>
      </PanelSection>

      <PanelSection title="Evidence classification">
        <ul className="space-y-1 text-xs">
          {EVIDENCE_KINDS.map((k) => (
            <li key={k.key} className="flex items-center justify-between rounded-lg border border-border p-2">
              <span>{k.label}</span>
              <span className={k.drivesGuidance ? "font-semibold text-primary" : "text-muted-foreground"}>
                {k.drivesGuidance ? "May drive guidance" : "Never drives guidance"}
              </span>
            </li>
          ))}
        </ul>
      </PanelSection>

      <PanelSection title="Technical references for the current instruction">
        {!card.product && <p className="text-xs text-muted-foreground">No verified product is selected, so no reference applies.</p>}
        {card.product && references.isLoading && <p className="text-xs text-muted-foreground">Loading approved references…</p>}
        {card.product && !references.isLoading && (references.data ?? []).length === 0 && (
          <p className="text-xs text-muted-foreground">
            No approved supporting document is loaded for this instruction. Follow the current product label or technical data sheet.
          </p>
        )}
        <div className="space-y-2">
          {(references.data ?? []).slice(0, 5).map((doc) => (
            <div key={doc.id} className="rounded-lg border border-border bg-card p-2.5">
              {REFERENCE_FIELDS.map((f) => {
                const map: Record<string, unknown> = {
                  sourceType: doc.document_type,
                  manufacturer: doc.manufacturer,
                  title: doc.title,
                  documentNumber: doc.document_number,
                  version: doc.version,
                  revisionDate: doc.revision_date,
                  section: doc.section,
                  language: doc.language,
                  country: doc.country,
                  extractionStatus: doc.extraction_status,
                  reviewer: doc.technical_reviewer,
                  reviewDate: doc.review_date,
                };
                return <FieldRow key={f.key} label={f.label} value={String(map[f.key] ?? NOT_VERIFIED)} />;
              })}
              {doc.superseded_by && <p className="mt-1 text-xs font-bold text-destructive">{SUPERSEDED_WARNING}</p>}
            </div>
          ))}
        </div>
      </PanelSection>
    </div>
  );
}
