/** STEP 14 — record a treatment outcome: baseline, recorded practice, inspections and controlled result. */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, ClipboardList, ShieldAlert } from "lucide-react";
import {
  INSPECTION_OBSERVATIONS, OBSERVATION_LABEL, RECORD_TYPE_LABEL, OUTCOME_RECORD_TYPES,
  CLASSIFICATION_LABEL, COMPLIANCE_LABEL, EXPECTATION_LABEL, REPEAT_DECISION_LABEL,
  SEVERITY_LABEL, OUTCOME_TRIGGER_LABEL, MONITORING_ACTION_LABEL, RECORDED_PRACTICE_NOTE,
  FOLLOW_UP_INTERVAL_LABEL, FOLLOW_UP_INTERVALS, FOLLOW_UP_FINDINGS, FOLLOW_UP_FINDING_LABEL,
  FAILURE_REASONS, FAILURE_REASON_LABEL, FAILURE_HYPOTHESIS_NOTE, PRIVACY_NOTE,
  REMAINING_MARK_TYPES, REMAINING_MARK_LABEL, CLOSURE_STATES, CLOSURE_LABEL,
  emptyInspection, emptyBaseline,
} from "@/data/outcomes";
import type {
  InspectionObservation, OutcomeRecordType, OutcomeRecord, FollowUpInterval,
  FollowUpFinding, FailureReason, RemainingMarkType, ClosureState,
} from "@/data/outcomes";
import { assessOutcome, validateClosure, remainingMarkGuidance } from "@/lib/outcomeEngine";
import { useOutcomes } from "@/store/useOutcomes";
import { useApp } from "@/store/useApp";
import { makeContext, makeAttempt, makeApproved, fullBaseline } from "@/lib/outcomeScenarios";

const Chip = ({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-3 py-1 text-xs transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}
  >
    {children}
  </button>
);

export default function TreatmentOutcome() {
  const store = useOutcomes();
  const user = useApp((s) => s.user);
  const reporter = user?.email ?? "demo-operator";

  const [recordType, setRecordType] = useState<OutcomeRecordType>("technical_professional_attempt");
  const [garment, setGarment] = useState("White cotton shirt");
  const [stainKey, setStainKey] = useState("coffee");
  const [fabricKey, setFabricKey] = useState("cotton");
  const [attempts, setAttempts] = useState(1);
  const [baselinePhotos, setBaselinePhotos] = useState(true);
  const [existingDyeLoss, setExistingDyeLoss] = useState(false);
  const [rinseDone, setRinseDone] = useState(true);
  const [removalUncertain, setRemovalUncertain] = useState(false);
  const [driedInspected, setDriedInspected] = useState(true);
  const [ring, setRing] = useState(false);
  const [observations, setObservations] = useState<InspectionObservation[]>(["stain_removed"]);
  const [mark, setMark] = useState<RemainingMarkType | "">("");
  const [interval, setInterval] = useState<FollowUpInterval | "">("");
  const [findings, setFindings] = useState<FollowUpFinding[]>([]);
  const [hypotheses, setHypotheses] = useState<FailureReason[]>([]);
  const [closure, setClosure] = useState<ClosureState>("completed_successfully");
  const [note, setNote] = useState("");

  const draft: OutcomeRecord = useMemo(() => ({
    outcomeId: store.nextOutcomeId(),
    version: 1,
    recordType,
    context: makeContext({ garmentDescription: garment, stainKey, fabricKey, operator: reporter, role: "professional_spotter" }),
    baseline: baselinePhotos ? fullBaseline({ existingDyeLoss }) : emptyBaseline({ existingDyeLoss }),
    attempts: Array.from({ length: attempts }, (_, i) => makeAttempt({
      attemptNumber: i + 1,
      rinsingPerformed: rinseDone ? "yes" : "no",
    })),
    approvedMethod: makeApproved(),
    immediate: emptyInspection({ observations, inspectedBy: reporter, inspectedAt: new Date().toISOString(), notes: note }),
    postRinse: {
      requiredProcessCompleted: rinseDone ? "yes" : "no",
      processUsed: "water flush", completionConfirmed: rinseDone,
      residueVisible: false, odourRemains: false, ringRemains: ring,
      colourChanged: false, textureChanged: false,
      productRemovalUncertain: removalUncertain, operator: reporter,
    },
    postDrying: driedInspected
      ? {
        dryingMethod: "air dry", dryingPermittedBySafetyEngine: true,
        stainResult: observations.includes("stain_removed") ? "stain_removed" : "no_meaningful_change",
        ring, colourChanged: false, textureChanged: false, shrinkage: false, distortion: false,
        odour: false, residue: false, coatingCondition: "unchanged", decorationCondition: "unchanged",
        date: new Date().toISOString().slice(0, 10),
      }
      : undefined,
    followUp: interval ? { interval, findings, inspectedBy: reporter, recordedAt: new Date().toISOString() } : undefined,
    remainingMark: mark || undefined,
    failureHypotheses: hypotheses,
    evidenceStage: "raw_report",
    reportedBy: reporter,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    clientRecordKey: `local-${stainKey}-${fabricKey}-${attempts}-${observations.join("_")}`,
    syncState: "local_draft",
    superseded: false,
  }), [recordType, garment, stainKey, fabricKey, attempts, baselinePhotos, existingDyeLoss, rinseDone,
    removalUncertain, driedInspected, ring, observations, mark, interval, findings, hypotheses, note, reporter, user?.role, store]);

  const history = useMemo(
    () => store.records
      .filter((r) => r.context.stainKey === stainKey && r.context.fabricKey === fabricKey)
      .map((r) => ({ classification: assessOutcome(r).classification.classification, recordType: r.recordType })),
    [store.records, stainKey, fabricKey],
  );

  const assessment = useMemo(() => assessOutcome(draft, { history }), [draft, history]);
  const closureCheck = validateClosure(closure, assessment.classification.classification, draft.postDrying);

  const toggle = <T,>(list: T[], v: T, set: (x: T[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const save = () => {
    const res = store.syncRecord({ ...draft, syncState: "synced" }, reporter);
    if (!res.ok) { toast.error(res.message); return; }
    const saved = store.records[0];
    if (assessment.severity >= 3 && saved) {
      store.addAdverse({
        outcomeId: saved.outcomeId,
        severity: assessment.severity,
        caseVersion: saved.context.caseVersion,
        productKey: saved.context.productKey,
        productBatch: saved.context.productBatch,
        operator: reporter,
        garmentDescription: saved.context.garmentDescription,
        stainKey: saved.context.stainKey,
        approvedMethodKey: saved.approvedMethod?.methodVersionKey,
        actualMethodSummary: saved.attempts.map((a) => `${a.action} · ${a.quantity} · ${a.contactTime}`).join(" | "),
        deviation: assessment.compliance.primary,
        immediateSymptoms: saved.immediate.observations,
        damageTypes: saved.remainingMark ? [saved.remainingMark] : [],
        photos: Object.values(saved.baseline.photos),
        requiredFirstResponse: assessment.safetyStop.message,
        escalationRoute: "Technical reviewer",
        investigationStatus: "open",
        correctiveActions: [],
      }, reporter);
    }

    assessment.triggers.forEach((t) => saved && store.openReview(saved.outcomeId, t, assessment.severity, reporter));
    if (saved) store.closeCase(saved.outcomeId, closureCheck.ok ? closure : "escalated", reporter, closureCheck.ok ? undefined : closureCheck.message);
    toast.success(`Outcome recorded${assessment.triggers.length ? " — technical review opened." : "."}`);
  };

  return (
    <div className="space-y-4 p-4 pb-24">
      <Link to="/stain-master" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Stain Master
      </Link>
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Record treatment outcome</h1>
      </div>
      <p className="text-xs text-muted-foreground">{RECORDED_PRACTICE_NOTE}</p>

      <Card className="space-y-3 p-4">
        <p className="text-sm font-semibold">Record type</p>
        <div className="flex flex-wrap gap-2">
          {OUTCOME_RECORD_TYPES.map((t) => (
            <Chip key={t} on={recordType === t} onClick={() => setRecordType(t)}>{RECORD_TYPE_LABEL[t]}</Chip>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Input value={garment} onChange={(e) => setGarment(e.target.value)} placeholder="Garment" />
          <Input value={stainKey} onChange={(e) => setStainKey(e.target.value)} placeholder="Stain key" />
          <Input value={fabricKey} onChange={(e) => setFabricKey(e.target.value)} placeholder="Fabric key" />
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <p className="text-sm font-semibold">Pre-treatment baseline</p>
        <div className="flex items-center justify-between text-sm">
          <span>Required photographs captured</span>
          <Switch checked={baselinePhotos} onCheckedChange={setBaselinePhotos} />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Pre-existing dye loss noted</span>
          <Switch checked={existingDyeLoss} onCheckedChange={setExistingDyeLoss} />
        </div>
        {!assessment.baseline.complete && (
          <p className="text-xs text-destructive">Missing before treatment: {assessment.baseline.missing.join(", ")}</p>
        )}
      </Card>

      <Card className="space-y-3 p-4">
        <p className="text-sm font-semibold">Recorded practice</p>
        <div className="flex items-center gap-2 text-sm">
          <span>Attempts performed</span>
          <Button size="sm" variant="outline" onClick={() => setAttempts(Math.max(1, attempts - 1))}>-</Button>
          <span className="w-6 text-center font-semibold">{attempts}</span>
          <Button size="sm" variant="outline" onClick={() => setAttempts(attempts + 1)}>+</Button>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Required rinsing completed</span>
          <Switch checked={rinseDone} onCheckedChange={setRinseDone} />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Product removal uncertain</span>
          <Switch checked={removalUncertain} onCheckedChange={setRemovalUncertain} />
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <p className="text-sm font-semibold">Inspection observations</p>
        <div className="flex flex-wrap gap-2">
          {INSPECTION_OBSERVATIONS.map((o) => (
            <Chip key={o} on={observations.includes(o)} onClick={() => toggle(observations, o, setObservations)}>
              {OBSERVATION_LABEL[o]}
            </Chip>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Ring visible</span>
          <Switch checked={ring} onCheckedChange={setRing} />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Inspected after complete drying</span>
          <Switch checked={driedInspected} onCheckedChange={setDriedInspected} />
        </div>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Inspection notes" />
      </Card>

      <Card className="space-y-3 p-4">
        <p className="text-sm font-semibold">Remaining mark and follow-up</p>
        <div className="flex flex-wrap gap-2">
          {REMAINING_MARK_TYPES.map((m) => (
            <Chip key={m} on={mark === m} onClick={() => setMark(mark === m ? "" : m)}>{REMAINING_MARK_LABEL[m]}</Chip>
          ))}
        </div>
        {mark && <p className="text-xs text-muted-foreground">{remainingMarkGuidance(mark)}</p>}
        <div className="flex flex-wrap gap-2">
          {FOLLOW_UP_INTERVALS.map((i) => (
            <Chip key={i} on={interval === i} onClick={() => setInterval(interval === i ? "" : i)}>{FOLLOW_UP_INTERVAL_LABEL[i]}</Chip>
          ))}
        </div>
        {interval && (
          <div className="flex flex-wrap gap-2">
            {FOLLOW_UP_FINDINGS.map((f) => (
              <Chip key={f} on={findings.includes(f)} onClick={() => toggle(findings, f, setFindings)}>{FOLLOW_UP_FINDING_LABEL[f]}</Chip>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-3 p-4">
        <p className="text-sm font-semibold">Failure hypotheses</p>
        <p className="text-xs text-muted-foreground">{FAILURE_HYPOTHESIS_NOTE}</p>
        <div className="flex flex-wrap gap-2">
          {FAILURE_REASONS.map((f) => (
            <Chip key={f} on={hypotheses.includes(f)} onClick={() => toggle(hypotheses, f, setHypotheses)}>{FAILURE_REASON_LABEL[f]}</Chip>
          ))}
        </div>
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Controlled assessment</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{CLASSIFICATION_LABEL[assessment.classification.classification]}</Badge>
          <Badge variant="outline">{COMPLIANCE_LABEL[assessment.compliance.primary]}</Badge>
          <Badge variant="outline">{EXPECTATION_LABEL[assessment.expectation.result]}</Badge>
          <Badge variant="outline">{REPEAT_DECISION_LABEL[assessment.repeat.decision]}</Badge>
          <Badge variant={assessment.severity >= 3 ? "destructive" : "secondary"}>{SEVERITY_LABEL[assessment.severity]}</Badge>
        </div>
        {assessment.safetyStop.stopped && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 text-destructive" />
            <p className="text-xs text-destructive">{assessment.safetyStop.message}</p>
          </div>
        )}
        <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          {assessment.classification.reasons.map((r) => <li key={r}>{r}</li>)}
          {assessment.repeat.reasons.map((r) => <li key={r}>{r}</li>)}
          {assessment.remainingMarkNote && <li>{assessment.remainingMarkNote}</li>}
        </ul>
        {assessment.triggers.length > 0 && (
          <p className="text-xs">Review triggers: {assessment.triggers.map((t) => OUTCOME_TRIGGER_LABEL[t]).join(", ")}</p>
        )}
        {assessment.thresholds.filter((t) => t.action !== "monitor").map((t) => (
          <p key={t.threshold.key} className="text-xs text-destructive">
            {MONITORING_ACTION_LABEL[t.action]} — {t.note}
          </p>
        ))}
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Customer-facing summary</p>
        {Object.entries(assessment.customer).map(([k, v]) => (
          <p key={k} className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{k}:</span> {v}</p>
        ))}
      </Card>

      <Card className="space-y-3 p-4">
        <p className="text-sm font-semibold">Case closure</p>
        <div className="flex flex-wrap gap-2">
          {CLOSURE_STATES.map((c) => (
            <Chip key={c} on={closure === c} onClick={() => setClosure(c)}>{CLOSURE_LABEL[c]}</Chip>
          ))}
        </div>
        {!closureCheck.ok && <p className="text-xs text-destructive">{closureCheck.message}</p>}
        <Button className="w-full" onClick={save}>Save outcome record</Button>
        <p className="text-[11px] text-muted-foreground">{PRIVACY_NOTE}</p>
      </Card>
    </div>
  );
}
