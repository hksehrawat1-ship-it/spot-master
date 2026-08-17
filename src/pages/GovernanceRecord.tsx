/** STEP 15 — record workspace: workflow, reviews, versions, impact, suspension, rollback. */

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, FileCheck2 } from "lucide-react";
import {
  CHECKLISTS, CHECKLIST_FOR_TYPE, CHANGE_KIND_LABEL, CONTENT_TYPE_LABEL, COUNTRY_CHECK_LABEL,
  GOV_STATUS_LABEL, MAJOR_CHANGE_KINDS, MINOR_CHANGE_KINDS, PREVIEW_MODES, PREVIEW_MODE_LABEL,
  PREVIEW_WATERMARK, REVIEW_TRIGGERS, REVIEW_TRIGGER_LABEL, REVIEW_TYPES, REVIEW_TYPE_LABEL,
  SAFE_FALLBACK_TEXT,
} from "@/data/governance";
import type { ChangeKind, ReviewType } from "@/data/governance";
import {
  countryApplicabilityOk, previewUrl, requiredReviews, riskBadgeVariant,
} from "@/lib/governanceEngine";
import { useGovernance } from "@/store/useGovernance";

export default function GovernanceRecord() {
  const { stableId = "" } = useParams();
  const gov = useGovernance();
  const [reason, setReason] = useState("");
  const [kinds, setKinds] = useState<ChangeKind[]>([]);
  const [reviewerId, setReviewerId] = useState("rv-textile");

  useEffect(() => { gov.seed(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const record = gov.records.find((r) => r.stableId === stableId);
  const issues = useMemo(() => (record ? gov.validate(record.stableId) : []), [gov, record]);
  const impact = useMemo(() => (record ? gov.impactFor(record.stableId, kinds) : null), [gov, record, kinds]);

  if (!record) {
    return (
      <div className="space-y-3 p-4">
        <Link to="/admin/governance" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Governance
        </Link>
        <p className="text-sm">Record not found.</p>
      </div>
    );
  }

  const checklistKey = CHECKLIST_FOR_TYPE[record.contentType];
  const checklist = checklistKey ? CHECKLISTS[checklistKey] : [];
  const needReason = () => {
    if (reason.trim().length < 8) { toast.error("A written reason is required."); return false; }
    return true;
  };
  const country = countryApplicabilityOk(record, gov.documents);

  return (
    <div className="space-y-4 p-4 pb-24">
      <Link to="/admin/governance" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Governance
      </Link>

      <div className="flex items-center gap-2">
        <FileCheck2 className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">{record.title}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{record.stableId}</Badge>
        <Badge variant="outline">v{record.currentVersion}</Badge>
        <Badge variant={riskBadgeVariant(record.riskLevel)}>{record.riskLevel}</Badge>
        <Badge>{GOV_STATUS_LABEL[record.status]}</Badge>
        <span className="text-xs text-muted-foreground">{CONTENT_TYPE_LABEL[record.contentType]}</span>
      </div>
      {record.status === "suspended" && (
        <Card className="border-destructive p-3 text-sm text-destructive">{SAFE_FALLBACK_TEXT}</Card>
      )}
      {record.status !== "published" && (
        <Card className="p-3 text-xs font-semibold">{PREVIEW_WATERMARK}</Card>
      )}

      <Card className="space-y-1 p-4 text-xs">
        <p><strong>Owner:</strong> {record.owner ?? "— missing —"}</p>
        <p><strong>Author:</strong> {record.author ?? "—"}</p>
        <p><strong>Technical reviewer:</strong> {record.technicalReviewer ?? "— missing —"}</p>
        <p><strong>Safety reviewer:</strong> {record.safetyReviewer ?? "—"}</p>
        <p><strong>Country / language:</strong> {record.countries.join(", ") || "—"} / {record.language}</p>
        <p><strong>Sources:</strong> {record.sourceDocumentIds.join(", ") || "— none —"}</p>
        <p><strong>Next review:</strong> {record.nextReviewAt?.slice(0, 10) ?? "— missing —"}</p>
        <p><strong>Required reviews:</strong> {requiredReviews(record).map((t) => REVIEW_TYPE_LABEL[t]).join(", ")}</p>
        <p><strong>Country applicability:</strong> {country.reason}</p>
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Automated validation</p>
        {issues.length === 0 && <p className="text-xs text-muted-foreground">No issues. Human review is still required.</p>}
        {issues.map((i, n) => (
          <p key={`${i.code}-${n}`} className={i.severity === "error" ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
            [{i.severity}] {i.message}
          </p>
        ))}
      </Card>

      {checklist.length > 0 && (
        <Card className="space-y-2 p-4">
          <p className="text-sm font-semibold">Review checklist</p>
          {checklist.map((item) => (
            <label key={item} className="flex items-start gap-2 text-xs">
              <Checkbox
                checked={!!record.checklistState[item]}
                onCheckedChange={(v) =>
                  gov.updateRecord(record.stableId, { checklistState: { ...record.checklistState, [item]: !!v } }, "reviewer", "Checklist updated")}
              />
              <span>{item}</span>
            </label>
          ))}
        </Card>
      )}

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Written reason (required for controlled actions)</p>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason recorded in the audit log" />
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Workflow</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => { const r = gov.submitForReview(record.stableId, "rv-chem"); toast[r.ok ? "success" : "error"](r.message); }}>
            Submit for review
          </Button>
          <Button size="sm" variant="outline" onClick={() => { const r = gov.publish(record.stableId, "rv-admin"); toast[r.ok ? "success" : "error"](r.message); }}>
            Publish
          </Button>
          <Button size="sm" variant="outline" onClick={() => {
            if (!needReason()) return;
            const r = gov.archive(record.stableId, "rv-admin", reason); toast.success(r.message);
          }}>Archive</Button>
          <Button size="sm" variant="destructive" onClick={() => {
            if (!needReason()) return;
            const r = gov.suspend(record.stableId, "rv-safety", reason); toast[r.ok ? "success" : "error"](r.message);
          }}>Emergency suspend</Button>
        </div>

        <p className="mt-2 text-sm font-semibold">Assign review</p>
        <div className="flex flex-wrap gap-2">
          {gov.reviewers.map((rv) => (
            <Button key={rv.id} size="sm" variant={reviewerId === rv.id ? "default" : "outline"} onClick={() => setReviewerId(rv.id)}>
              {rv.name}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {REVIEW_TYPES.map((t: ReviewType) => (
            <Button key={t} size="sm" variant="outline"
              onClick={() => { gov.assignReview(record.stableId, t, reviewerId, new Date(Date.now() + 6048e5).toISOString().slice(0, 10)); toast.success(`${REVIEW_TYPE_LABEL[t]} assigned.`); }}>
              {REVIEW_TYPE_LABEL[t]}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Review tasks</p>
        {gov.tasks.filter((t) => t.recordId === record.stableId).length === 0 &&
          <p className="text-xs text-muted-foreground">No review tasks.</p>}
        {gov.tasks.filter((t) => t.recordId === record.stableId).map((t) => (
          <div key={t.taskId} className="space-y-2 rounded-md border border-border p-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="secondary">{t.taskId}</Badge>
              <Badge variant="outline">v{t.version}</Badge>
              <span>{REVIEW_TYPE_LABEL[t.reviewType]} · {t.assignedReviewer} · due {t.dueDate} · {t.priority}</span>
              {t.decision && <Badge>{t.decision}</Badge>}
            </div>
            {!t.decision && (
              <div className="flex flex-wrap gap-2">
                {(["approve", "approve_with_notes", "changes_required", "reject", "suspend_pending_investigation", "refer_to_specialist"] as const).map((d) => (
                  <Button key={d} size="sm" variant="outline"
                    onClick={() => { const r = gov.decideReview(t.taskId, t.assignedReviewer, d, reason); toast[r.ok ? "success" : "error"](r.message); }}>
                    {d.replace(/_/g, " ")}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Create a revision</p>
        <div className="flex flex-wrap gap-1">
          {[...MAJOR_CHANGE_KINDS, ...MINOR_CHANGE_KINDS].map((k) => (
            <Button key={k} size="sm" variant={kinds.includes(k) ? "default" : "outline"}
              onClick={() => setKinds((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]))}>
              {CHANGE_KIND_LABEL[k]}
            </Button>
          ))}
        </div>
        <Button size="sm" disabled={kinds.length === 0} onClick={() => {
          if (!needReason()) return;
          const v = gov.reviseRecord(record.stableId, kinds, reason, reason, "rv-chem");
          toast.success(`Revision ${v} created as draft.`); setKinds([]);
        }}>
          Create revision
        </Button>
      </Card>

      {impact && (
        <Card className="space-y-1 p-4 text-xs">
          <p className="text-sm font-semibold">Impact analysis</p>
          <p>Records affected: {impact.records.length}</p>
          <p>Countries: {impact.countries.join(", ") || "—"} · Languages: {impact.languages.join(", ")}</p>
          <p>Products: {impact.products.length} · Stains: {impact.stains.length} · Public pages: {impact.publicPages.length}</p>
          <p>Training: {impact.trainingModules.length} · Rankings: {impact.rankings.length} · Domestic: {impact.domesticMethods.length}</p>
          <p>Active cases: {impact.activeCases.length} · Historical cases unaffected: {impact.historicalCasesUnaffected.length}</p>
          <p>Required reviewers: {impact.requiredReviewers.join(", ")}</p>
          <p>Recommended release: {impact.recommendedRelease}</p>
          {impact.blocking && <p className="text-destructive">{impact.blockingReason}</p>}
        </Card>
      )}

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Version history (immutable)</p>
        {record.versions.map((v) => (
          <div key={v.version} className="rounded-md border border-border p-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">v{v.version}</Badge>
              <span>{GOV_STATUS_LABEL[v.status]}</span>
              {v.immutable && <Badge variant="secondary">immutable</Badge>}
              {v.withdrawnAt && <Badge variant="destructive">withdrawn</Badge>}
            </div>
            <p className="mt-1 text-muted-foreground">{v.revisionSummary || v.reasonForChange || "—"}</p>
            <p className="text-muted-foreground">Signatures: {v.signatures.length ? v.signatures.map((s) => `${s.reviewerName} (${s.reviewType})`).join(", ") : "none"}</p>
            {v.version !== record.currentVersion && (
              <Button size="sm" variant="outline" className="mt-1" onClick={() => {
                if (!needReason()) return;
                const r = gov.rollback(record.stableId, v.version, "rv-admin", reason);
                toast[r.ok ? "success" : "error"](r.message);
              }}>Roll back to v{v.version}</Button>
            )}
          </div>
        ))}
      </Card>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold">Review triggers</p>
        <div className="flex flex-wrap gap-1">
          {REVIEW_TRIGGERS.map((t) => (
            <Button key={t} size="sm" variant="outline"
              onClick={() => { gov.fireTrigger(record.stableId, t, "rv-safety"); toast.success(REVIEW_TRIGGER_LABEL[t]); }}>
              {REVIEW_TRIGGER_LABEL[t]}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="space-y-1 p-4 text-xs">
        <p className="text-sm font-semibold">Private previews</p>
        {PREVIEW_MODES.map((m) => (
          <p key={m} className="text-muted-foreground">{PREVIEW_MODE_LABEL[m]}: {previewUrl(record, m, "session-token")}</p>
        ))}
        <p className="text-muted-foreground">Preview links require an authenticated session token and are never publicly indexable.</p>
      </Card>

      <Card className="space-y-1 p-4 text-xs">
        <p className="text-sm font-semibold">Country checklist</p>
        {Object.values(COUNTRY_CHECK_LABEL).map((l) => <p key={l} className="text-muted-foreground">• {l}</p>)}
      </Card>
    </div>
  );
}
