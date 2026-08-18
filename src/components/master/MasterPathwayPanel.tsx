import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChipGroup, FieldRow, PanelSection } from "@/components/master/MasterControls";
import {
  INSPECTION_RESULTS,
  MASTER_STAGES,
  NOT_VERIFIED,
  NO_BEST_PRODUCT_NOTE,
  NO_UNIVERSAL_SEQUENCE_NOTE,
  OPERATOR_OBSERVATION_LABEL,
  STAGES_ARE_NOT_A_SEQUENCE,
  UNKNOWN_PRODUCT,
} from "@/data/masterSpotter";
import { COMPONENT_LABEL, type ComponentKey } from "@/data/taxonomy";
import {
  applyInspection,
  buildMasterCard,
  compareAcrossBrands,
  eligibleMasterProducts,
  eligibleStages,
  simplifiedJobCard,
  type MasterInstructionCard,
} from "@/lib/masterEngine";
import { buildComponentPlan, type ProductTransition, type VerifiedProduct } from "@/lib/professionalEngine";
import type { Classified } from "@/lib/dataSource";
import { useMaster } from "@/store/useMaster";

type Props = {
  products: Classified<VerifiedProduct>[];
  transitions: ProductTransition[];
  card: MasterInstructionCard;
};

/** Centre panel / "Pathway" tab — stage control, product card, checkpoint and ledger. */
export default function MasterPathwayPanel({ products, transitions, card }: Props) {
  const { current, view, setActiveStage, setActiveComponent, addLedgerEntry, patch } = useMaster();
  const [entry, setEntry] = useState({ amount: "", temperature: "", contactTime: "", mechanicalAction: "", notes: "" });
  const [observation, setObservation] = useState("");

  const plan = useMemo(() => buildComponentPlan(current), [current]);
  const stages = useMemo(() => eligibleStages(current, plan), [current, plan]);
  const stageMeta = MASTER_STAGES.find((s) => s.key === current.activeStage);
  const eligible = useMemo(
    () =>
      eligibleMasterProducts(products, {
        kits: current.selectedKits.length ? current.selectedKits : [current.kit],
        inventory: current.inventory,
        component: current.activeComponent,
        stageNumber: stageMeta?.number,
      }),
    [products, current, stageMeta],
  );
  const comparison = useMemo(
    () => compareAcrossBrands(products, current, { component: current.activeComponent, stageNumber: stageMeta?.number }),
    [products, current, stageMeta],
  );
  const job = simplifiedJobCard(card);
  const componentKeys = plan.entries.map((e) => e.component);

  const recordAction = (productName: string) => {
    addLedgerEntry({
      stageKey: current.activeStage,
      stageNumber: stageMeta?.number ?? null,
      componentKey: current.activeComponent ?? null,
      productId: card.product?.productId ?? null,
      productName,
      manufacturer: card.product?.companyName ?? null,
      amount: entry.amount || null,
      dilution: card.product?.dilution ?? null,
      temperature: entry.temperature || null,
      contactTime: entry.contactTime || null,
      mechanicalAction: entry.mechanicalAction || null,
      steamUsed: false,
      vacuumUsed: false,
      spottingBoardUsed: false,
      rinsePerformed: false,
      neutralizationPerformed: false,
      operatorObservation: false,
      notes: entry.notes || null,
    });
    setEntry({ amount: "", temperature: "", contactTime: "", mechanicalAction: "", notes: "" });
  };

  return (
    <div className="space-y-4">
      <PanelSection title="Treatment stages" description={STAGES_ARE_NOT_A_SEQUENCE}>
        <div className="space-y-1.5">
          {stages.map((s) => (
            <button
              key={s.key}
              type="button"
              aria-pressed={current.activeStage === s.key}
              disabled={!s.eligible}
              onClick={() => setActiveStage(s.key)}
              className={`min-h-[44px] w-full rounded-lg border p-2.5 text-left text-sm transition-colors ${
                current.activeStage === s.key ? "border-primary bg-primary/5 font-semibold" : "border-border bg-card"
              } ${s.eligible ? "" : "cursor-not-allowed opacity-55"}`}
            >
              <span className="block">{s.number}. {s.label}</span>
              {!s.eligible && <span className="block text-xs text-muted-foreground">{s.reason}</span>}
            </button>
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Component being treated" description={NO_UNIVERSAL_SEQUENCE_NOTE}>
        <ChipGroup
          label="Active component"
          options={componentKeys.map((k) => COMPONENT_LABEL[k])}
          value={current.activeComponent ? COMPONENT_LABEL[current.activeComponent] : undefined}
          onChange={(label) => {
            const key = componentKeys.find((k) => COMPONENT_LABEL[k] === label);
            setActiveComponent(key as ComponentKey | undefined);
          }}
        />
        <ol className="mt-3 space-y-1.5">
          {card.componentMap.filter((m) => m.present || m.state === "not_removable").map((m) => (
            <li key={m.key} className="rounded-lg border border-border bg-card p-2.5 text-xs">
              <span className="font-semibold">{m.label}</span>
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] uppercase">{m.state.replace(/_/g, " ")}</span>
              <span className="mt-1 block text-muted-foreground">{m.reason}</span>
            </li>
          ))}
        </ol>
      </PanelSection>

      <PanelSection
        title={view === "technical" ? "Treatment instruction card" : "Job card"}
        description={card.statusMessage}
        tone={card.status === "proceed" ? "default" : card.status === "test_required" ? "warning" : "danger"}
      >
        {view === "technical" ? (
          <div className="space-y-3">
            <FieldRow label="Current treatment stage" value={card.stage ? `${card.stage.number}. ${card.stage.label}` : NOT_VERIFIED} />
            <FieldRow label="Product and manufacturer" value={card.product ? `${card.product.productName} — ${card.product.companyName || NOT_VERIFIED}` : NOT_VERIFIED} />
            <FieldRow label="Purpose in this case" value={card.purpose} />
            <FieldRow label="Eligibility status" value={card.eligibility} />
            <FieldRow label="Concealed-area test requirement" value={card.concealedTest} />
            {card.sections.map((s) => (
              <FieldRow key={s.label} label={s.label} value={s.value} verified={s.verified} />
            ))}
            <FieldRow label="Required PPE" value={card.ppe.join(", ")} />
            <FieldRow label="Prohibited combinations" value={card.prohibited.join("; ")} />
            <FieldRow label="Required rinse, flush or neutralization" value={card.rinseRequirement} />
            <FieldRow label="Inspection checkpoint" value={card.inspectionCheckpoint} />
            <FieldRow label="Maximum verified repetition" value={card.maximumRepetition} />
            {card.source.map((s) => (
              <FieldRow key={s.label} label={s.label} value={s.value} />
            ))}
            <div className="pt-1">
              <p className="text-xs font-semibold">Fabric and dye limitations</p>
              <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground">
                {card.limitations.map((l) => <li key={l}>{l}</li>)}
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <FieldRow label="Product" value={job.product} />
            <FieldRow label="Test" value={job.test} />
            <FieldRow label="Action" value={job.action} />
            <FieldRow label="Time" value={job.time} />
            <FieldRow label="Rinse/flush" value={job.rinse} />
            <FieldRow label="Check" value={job.check} />
            <FieldRow label="Next step" value={job.nextStep} />
            <p className="text-xs text-muted-foreground">Stop if: {job.stopConditions.join(", ")}.</p>
          </div>
        )}
      </PanelSection>

      <PanelSection title="Eligible products" description={NO_BEST_PRODUCT_NOTE}>
        {eligible.length === 0 ? (
          <p className="rounded-lg bg-muted p-3 text-xs">
            No verified product in the selected kits is approved for this component and stage.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {eligible.map((p) => (
              <li key={p.productId} className="rounded-lg border border-border bg-card p-2.5 text-xs">
                <span className="font-semibold">{p.productName}</span>
                <span className="block text-muted-foreground">
                  {p.companyName || NOT_VERIFIED} · {p.productKey} · stages {p.compatibleStages.join(", ") || NOT_VERIFIED}
                </span>
              </li>
            ))}
          </ul>
        )}
      </PanelSection>

      {comparison.length > 1 && (
        <PanelSection title="Cross-brand comparison" description="Verified fields only. Products are never ranked.">
          <div className="space-y-2">
            {comparison.map((row) => (
              <div key={row.product.productId} className="rounded-lg border border-border bg-card p-2.5">
                <p className="text-xs font-bold">{row.product.productName}</p>
                <p className="text-[11px] font-semibold text-primary">{row.outcomeLabel}</p>
                {row.fields.map((f) => (
                  <FieldRow key={f.label} label={f.label} value={f.value} />
                ))}
              </div>
            ))}
          </div>
        </PanelSection>
      )}

      <PanelSection title="Record this action in the chemistry ledger">
        <div className="space-y-2">
          <Input placeholder="Amount or application level" value={entry.amount} onChange={(e) => setEntry({ ...entry, amount: e.target.value })} aria-label="Amount or application level" />
          <Input placeholder="Temperature" value={entry.temperature} onChange={(e) => setEntry({ ...entry, temperature: e.target.value })} aria-label="Temperature" />
          <Input placeholder="Contact time" value={entry.contactTime} onChange={(e) => setEntry({ ...entry, contactTime: e.target.value })} aria-label="Contact time" />
          <Input placeholder="Mechanical action" value={entry.mechanicalAction} onChange={(e) => setEntry({ ...entry, mechanicalAction: e.target.value })} aria-label="Mechanical action" />
          <Textarea rows={2} placeholder="Notes" value={entry.notes} onChange={(e) => setEntry({ ...entry, notes: e.target.value })} aria-label="Ledger notes" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={card.status !== "proceed" || !card.product} onClick={() => card.product && recordAction(card.product.productName)}>
              Record verified application
            </Button>
            <Button size="sm" variant="outline" onClick={() => recordAction(UNKNOWN_PRODUCT)}>
              Record unknown product/action
            </Button>
          </div>
        </div>
      </PanelSection>

      <PanelSection title="Inspection checkpoint" description="Required after every treatment action. The next eligible action is recalculated afterwards.">
        <div className="flex flex-wrap gap-1.5">
          {INSPECTION_RESULTS.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => {
                const last = current.ledger.at(-1);
                if (last) useMaster.getState().updateLedgerEntry(last.id, { inspectionResult: r.key });
                const next = applyInspection(useMaster.getState().current, r.key);
                patch({ stopConditions: next.stopConditions });
              }}
              className={`min-h-[36px] rounded-full border px-3 text-xs font-medium ${
                r.stop ? "border-destructive/50 text-destructive" : "border-border text-muted-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Operator observation" description={OPERATOR_OBSERVATION_LABEL}>
        <div className="space-y-2">
          <Textarea rows={2} value={observation} onChange={(e) => setObservation(e.target.value)} aria-label="Operator observation" />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (!observation.trim()) return;
              addLedgerEntry({
                stageKey: current.activeStage,
                stageNumber: stageMeta?.number ?? null,
                componentKey: current.activeComponent ?? null,
                productName: "Operator observation",
                steamUsed: false,
                vacuumUsed: false,
                spottingBoardUsed: false,
                rinsePerformed: false,
                neutralizationPerformed: false,
                operatorObservation: true,
                notes: observation,
              });
              setObservation("");
            }}
          >
            Record observation (never published as guidance)
          </Button>
        </div>
      </PanelSection>

      <PanelSection title="Chemistry ledger" description="Chronological record of everything applied to this garment.">
        {current.ledger.length === 0 ? (
          <p className="text-xs text-muted-foreground">No treatment recorded yet for this case.</p>
        ) : (
          <ol className="space-y-1.5">
            {current.ledger.map((e) => (
              <li key={e.id} className="rounded-lg border border-border bg-card p-2.5 text-xs">
                <span className="font-semibold">{e.entryOrder}. {e.productName}</span>
                {e.operatorObservation && <span className="ml-2 text-[11px] font-semibold text-amber-600">{OPERATOR_OBSERVATION_LABEL}</span>}
                <span className="block text-muted-foreground">
                  {new Date(e.performedAt).toLocaleString()} · {e.contactTime ?? NOT_VERIFIED} · rinse {e.rinsePerformed ? "yes" : "no"} · neutralised {e.neutralizationPerformed ? "yes" : "no"}
                  {e.inspectionResult ? ` · ${INSPECTION_RESULTS.find((r) => r.key === e.inspectionResult)?.label}` : ""}
                </span>
                <div className="mt-1.5 flex gap-2">
                  <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => useMaster.getState().updateLedgerEntry(e.id, { rinsePerformed: true })}>
                    Mark rinsed
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => useMaster.getState().updateLedgerEntry(e.id, { neutralizationPerformed: true })}>
                    Mark neutralised
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </PanelSection>
    </div>
  );
}
