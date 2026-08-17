/** STEP 14 — technical review: root cause, corrective actions, evidence promotion and audit. */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Gavel } from "lucide-react";
import {
  ROOT_CAUSE_QUESTIONS, ROOT_CAUSE_CONCLUSIONS, ROOT_CAUSE_LABEL,
  CORRECTIVE_ACTIONS, CORRECTIVE_ACTION_LABEL, CORRECTIVE_APPROVAL_NOTE,
  OUTCOME_TRIGGER_LABEL, SEVERITY_LABEL, EVIDENCE_STAGES, EVIDENCE_STAGE_LABEL,
  INVESTIGATION_STATUSES, LOW_QUALITY_REPORT_NOTE,
} from "@/data/outcomes";
import type { EvidenceStage, RootCauseConclusion, CorrectiveActionKey, InvestigationStatus } from "@/data/outcomes";
import { useOutcomes } from "@/store/useOutcomes";

export default function OutcomeReview() {
  const store = useOutcomes();
  const reviewer = "technical_reviewer";
  const [reason, setReason] = useState("");

  const requireReason = () => {
    if (reason.trim().length < 8) { toast.error("A written justification is required."); return false; }
    return true;
  };

  return (
    <div className="space-y-4 p-4 pb-24">
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Admin
      </Link>
      <div className="flex items-center gap-2">
        <Gavel className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Outcome review</h1>
      </div>
      <p className="text-xs text-muted-foreground">{LOW_QUALITY_REPORT_NOTE}</p>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Written justification</p>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason recorded with every decision" />
        <p className="text-[11px] text-muted-foreground">{CORRECTIVE_APPROVAL_NOTE}</p>
      </Card>

      <Card className="space-y-3 p-4">
        <p className="text-sm font-semibold">Open reviews ({store.reviews.filter((r) => r.status !== "closed").length})</p>
        {store.reviews.length === 0 && <p className="text-xs text-muted-foreground">No review tasks.</p>}
        {store.reviews.map((t) => (
          <div key={t.reviewId} className="space-y-2 rounded-md border border-border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{t.reviewId}</Badge>
              <Badge variant="outline">{t.outcomeId}</Badge>
              <Badge variant={t.priority === "immediate" ? "destructive" : "outline"}>{t.priority}</Badge>
              <span className="text-xs text-muted-foreground">{OUTCOME_TRIGGER_LABEL[t.trigger]}</span>
            </div>

            <div className="space-y-1">
              {ROOT_CAUSE_QUESTIONS.map((q) => (
                <div key={q} className="flex items-center justify-between gap-2">
                  <span className="text-xs">{q}</span>
                  <div className="flex gap-1">
                    {(["yes", "no", "unknown"] as const).map((a) => (
                      <Button
                        key={a}
                        size="sm"
                        variant={t.answers[q] === a ? "default" : "outline"}
                        onClick={() => store.answerReview(t.reviewId, q, a)}
                      >
                        {a}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-1">
              {ROOT_CAUSE_CONCLUSIONS.map((c: RootCauseConclusion) => (
                <Button
                  key={c}
                  size="sm"
                  variant={t.conclusion === c ? "default" : "outline"}
                  onClick={() => requireReason() && store.concludeReview(t.reviewId, c, reviewer, reason)}
                >
                  {ROOT_CAUSE_LABEL[c]}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1">
              {CORRECTIVE_ACTIONS.map((k: CorrectiveActionKey) => (
                <Button
                  key={k}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!requireReason()) return;
                    store.proposeAction(t.reviewId, {
                      key: k, detail: reason, approvalStatus: "proposed", affectsLiveGuidance: false,
                    }, reviewer);
                    toast.success("Corrective action proposed for approval.");
                  }}
                >
                  {CORRECTIVE_ACTION_LABEL[k]}
                </Button>
              ))}
            </div>

            {t.correctiveActions.map((a) => (
              <div key={a.key} className="flex items-center justify-between rounded border border-border px-2 py-1">
                <span className="text-xs">{CORRECTIVE_ACTION_LABEL[a.key]} — {a.approvalStatus}</span>
                {a.approvalStatus !== "approved" && (
                  <Button size="sm" onClick={() => requireReason() && store.approveAction(t.reviewId, a.key, reviewer, reason)}>
                    Approve
                  </Button>
                )}
              </div>
            ))}
          </div>
        ))}
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Adverse outcomes</p>
        {store.adverse.length === 0 && <p className="text-xs text-muted-foreground">No adverse outcomes recorded.</p>}
        {store.adverse.map((a) => (
          <div key={a.adverseId} className="space-y-1 rounded-md border border-destructive/40 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="destructive">{a.adverseId}</Badge>
              <span className="text-xs">{SEVERITY_LABEL[a.severity]} · {a.garmentDescription}</span>
            </div>
            <p className="text-xs text-muted-foreground">{a.actualMethodSummary}</p>
            <div className="flex flex-wrap gap-1">
              {INVESTIGATION_STATUSES.map((s: InvestigationStatus) => (
                <Button
                  key={s}
                  size="sm"
                  variant={a.investigationStatus === s ? "default" : "outline"}
                  onClick={() => requireReason() && store.setInvestigation(a.adverseId, s, reviewer, reason)}
                >
                  {s.replace(/_/g, " ")}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Evidence promotion</p>
        {store.records.slice(0, 10).map((r) => (
          <div key={r.outcomeId} className="flex flex-wrap items-center gap-2 rounded border border-border p-2">
            <Badge variant="outline">{r.outcomeId}</Badge>
            <span className="text-xs">{EVIDENCE_STAGE_LABEL[r.evidenceStage]}</span>
            {EVIDENCE_STAGES.map((s: EvidenceStage) => (
              <Button
                key={s}
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!requireReason()) return;
                  const res = store.promote(r.outcomeId, r.evidenceStage, s, reviewer, reviewer, reason);
                  res.ok ? toast.success(res.message) : toast.error(res.message);
                }}
              >
                → {EVIDENCE_STAGE_LABEL[s]}
              </Button>
            ))}
          </div>
        ))}
      </Card>

      <Card className="space-y-1 p-4">
        <p className="text-sm font-semibold">Audit trail</p>
        {store.audit.slice(0, 20).map((a) => (
          <p key={a.id} className="text-[11px] text-muted-foreground">
            {a.at.slice(0, 19).replace("T", " ")} · {a.user} · {a.action} · {a.outcomeId} — {a.reason}
          </p>
        ))}
        {store.audit.length === 0 && <p className="text-xs text-muted-foreground">No entries yet.</p>}
      </Card>
    </div>
  );
}
