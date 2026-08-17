/** STEP 15 — governance dashboard: queues, audit findings, change requests, releases, documents. */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import {
  AUDIT_FINDING_LABEL, CHANGE_REQUEST_LABEL, CONTENT_TYPE_LABEL, EVIDENCE_STATUS_LABEL,
  GOVERNANCE_PRINCIPLE, GOV_STATUS_LABEL, NOTIFICATION_LABEL, RETENTION_POLICY,
  UNDISABLEABLE_NOTIFICATIONS,
} from "@/data/governance";
import { isReviewDueSoon, isReviewOverdue, riskBadgeVariant } from "@/lib/governanceEngine";
import { useGovernance } from "@/store/useGovernance";

export default function GovernanceDashboard() {
  const gov = useGovernance();
  const [query, setQuery] = useState("");

  useEffect(() => { gov.seed(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const records = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return gov.records;
    return gov.records.filter((r) =>
      [r.stableId, r.title, r.contentType, r.status, r.owner ?? "", r.language, r.countries.join(" "), r.currentVersion]
        .join(" ").toLowerCase().includes(q));
  }, [gov.records, query]);

  const queue = (label: string, list: typeof gov.records) => (
    <Card className="space-y-2 p-4">
      <p className="text-sm font-semibold">{label} ({list.length})</p>
      {list.length === 0 && <p className="text-xs text-muted-foreground">Nothing here.</p>}
      {list.slice(0, 12).map((r) => (
        <Link key={r.stableId} to={`/admin/governance/${r.stableId}`} className="block rounded-md border border-border p-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{r.stableId}</Badge>
            <Badge variant="outline">v{r.currentVersion}</Badge>
            <Badge variant={riskBadgeVariant(r.riskLevel)}>{r.riskLevel}</Badge>
            <span className="text-xs text-muted-foreground">{GOV_STATUS_LABEL[r.status]}</span>
          </div>
          <p className="mt-1 text-sm">{r.title} — {CONTENT_TYPE_LABEL[r.contentType]}</p>
        </Link>
      ))}
    </Card>
  );

  const integrity = gov.runIntegrity();

  return (
    <div className="space-y-4 p-4 pb-24">
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Admin
      </Link>
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Content governance</h1>
      </div>
      <p className="text-xs text-muted-foreground">{GOVERNANCE_PRINCIPLE}</p>

      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by ID, type, status, owner, country, version" />

      <Tabs defaultValue="queues">
        <TabsList className="flex w-full flex-wrap">
          <TabsTrigger value="queues">Queues</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="releases">Releases</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="log">Log</TabsTrigger>
        </TabsList>

        <TabsContent value="queues" className="space-y-3 pt-3">
          {queue("Draft content", records.filter((r) => r.status === "draft"))}
          {queue("Evidence required", records.filter((r) => r.status === "evidence_required" || r.sourceDocumentIds.length === 0))}
          {queue("In review", records.filter((r) => ["technical_review", "safety_review", "country_review", "translation_review"].includes(r.status)))}
          {queue("Overdue reviews", records.filter((r) => isReviewOverdue(r)))}
          {queue("Due within 30 days", records.filter((r) => isReviewDueSoon(r)))}
          {queue("Needs review", records.filter((r) => r.status === "needs_review"))}
          {queue("Suspended", records.filter((r) => r.status === "suspended"))}
          {queue("Unowned content", records.filter((r) => !r.owner))}
          {queue("No technical reviewer", records.filter((r) => !r.technicalReviewer))}
          {queue("Published", records.filter((r) => r.status === "published"))}

          <Card className="space-y-2 p-4">
            <p className="text-sm font-semibold">Translation backlog</p>
            {gov.translations.map((t) => (
              <div key={t.translationId} className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2 text-xs">
                <Badge variant="secondary">{t.translationId}</Badge>
                <span>{t.language.toUpperCase()} · source {t.sourceRecordId} v{t.sourceVersion}</span>
                <Badge variant={t.status === "suspended" || t.status === "outdated" ? "destructive" : "outline"}>{t.status}</Badge>
              </div>
            ))}
          </Card>

          <Card className="space-y-1 p-4">
            <p className="text-sm font-semibold">Data integrity</p>
            {integrity.ok
              ? <p className="text-xs text-muted-foreground">All integrity checks pass.</p>
              : integrity.problems.map((p) => <p key={p} className="text-xs text-destructive">{p}</p>)}
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-3 pt-3">
          <Button onClick={() => { const r = gov.runAudit(); toast.success(`${r.findings.length} findings, ${r.tasks.length} remediation tasks.`); }}>
            Run governance audit
          </Button>
          <Card className="space-y-2 p-4">
            <p className="text-sm font-semibold">Findings ({gov.findings.length})</p>
            {gov.findings.map((f, i) => (
              <div key={`${f.recordId}-${f.kind}-${i}`} className="rounded-md border border-border p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={f.severity === "high" ? "destructive" : "outline"}>{f.severity}</Badge>
                  <Badge variant="secondary">{f.recordId}</Badge>
                  <span className="text-xs font-medium">{AUDIT_FINDING_LABEL[f.kind]}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{f.detail}</p>
              </div>
            ))}
          </Card>
          <Card className="space-y-2 p-4">
            <p className="text-sm font-semibold">Remediation tasks ({gov.remediation.length})</p>
            {gov.remediation.slice(0, 30).map((t) => (
              <div key={t.taskId} className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline">{t.taskId}</Badge>
                <span>{t.recordId} · {AUDIT_FINDING_LABEL[t.finding]} → {t.assignedRole}</span>
              </div>
            ))}
          </Card>
          <Card className="space-y-1 p-4">
            <p className="text-sm font-semibold">Retention policy</p>
            {RETENTION_POLICY.map((p) => (
              <p key={p.key} className="text-xs text-muted-foreground">
                {p.label}: {p.years === "permanent" ? "permanent" : `${p.years} years`} — {p.note}
              </p>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-3 pt-3">
          <Card className="space-y-2 p-4">
            <p className="text-sm font-semibold">Raise a change request</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CHANGE_REQUEST_LABEL) as (keyof typeof CHANGE_REQUEST_LABEL)[]).map((c) => (
                <Button key={c} size="sm" variant="outline"
                  onClick={() => { const r = gov.addChangeRequest(c, "reviewer", "Reported from governance dashboard"); toast.success(`${r.requestId} created (${r.priority}).`); }}>
                  {CHANGE_REQUEST_LABEL[c]}
                </Button>
              ))}
            </div>
          </Card>
          <Card className="space-y-2 p-4">
            <p className="text-sm font-semibold">Open requests ({gov.changeRequests.filter((c) => c.status !== "resolved").length})</p>
            {gov.changeRequests.map((c) => (
              <div key={c.requestId} className="space-y-1 rounded-md border border-border p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{c.requestId}</Badge>
                  <Badge variant={c.priority === "critical" ? "destructive" : "outline"}>{c.priority}</Badge>
                  <span className="text-xs">{CHANGE_REQUEST_LABEL[c.category]} · {c.status}</span>
                </div>
                {c.status !== "resolved" && (
                  <Button size="sm" variant="outline" onClick={() => gov.resolveChangeRequest(c.requestId, "Reviewed and closed", "reviewer")}>
                    Resolve
                  </Button>
                )}
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="releases" className="space-y-3 pt-3">
          <Button onClick={() => {
            const ids = gov.records.filter((r) => r.status === "approved").map((r) => r.stableId);
            const rel = gov.createRelease(`Content release ${gov.releases.length + 1}`, ids, "rv-textile", new Date().toISOString().slice(0, 10));
            toast.success(`${rel.releaseId} created with ${ids.length} record(s).`);
          }}>
            Create release from approved content
          </Button>
          {gov.releases.map((r) => (
            <Card key={r.releaseId} className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{r.releaseId}</Badge>
                <Badge variant={r.deployment === "failed" ? "destructive" : "outline"}>{r.deployment}</Badge>
                <span className="text-sm">{r.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">Rollback plan: {r.rollbackPlan}</p>
              {r.validationIssues.map((i) => <p key={i} className="text-xs text-destructive">{i}</p>)}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { const v = gov.validateReleaseById(r.releaseId); toast[v.passed ? "success" : "error"](v.passed ? "Validation passed." : v.issues[0]); }}>
                  Validate
                </Button>
                <Button size="sm" onClick={() => { const d = gov.deployRelease(r.releaseId, "rv-admin"); toast[d.ok ? "success" : "error"](d.message); }}>
                  Deploy
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="documents" className="space-y-3 pt-3">
          {gov.documents.map((d) => (
            <Card key={d.documentId} className="space-y-1 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{d.documentId}</Badge>
                <Badge variant="outline">{d.documentType}</Badge>
                <Badge variant={d.status === "superseded" ? "destructive" : "outline"}>{EVIDENCE_STATUS_LABEL[d.status]}</Badge>
              </div>
              <p className="text-xs">{d.issuer} · doc v{d.documentVersion} · {d.country}/{d.language}</p>
              <p className="text-[11px] text-muted-foreground">Review by {d.reviewDate} · hash {d.fileHash}</p>
              <p className="text-[11px] text-muted-foreground">Claims: {d.claims.join("; ")}</p>
              {d.status !== "superseded" && (
                <Button size="sm" variant="outline" onClick={() => {
                  const res = gov.supersede(d.documentId, {
                    ...d, documentId: `SM-DOC-${String(gov.documents.length + 1).padStart(6, "0")}`,
                    documentVersion: `${Number(d.documentVersion.split(".")[0]) + 1}.0`,
                    publicationDate: new Date().toISOString().slice(0, 10), status: "current",
                  }, d.documentType === "sds");
                  toast.success(`${res.affected.length} affected, ${res.suspended.length} suspended.`);
                }}>
                  Upload newer revision
                </Button>
              )}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="log" className="space-y-3 pt-3">
          <Card className="space-y-2 p-4">
            <p className="text-sm font-semibold">Notifications</p>
            {gov.notifications.slice(0, 25).map((n) => (
              <p key={n.id} className="text-xs">
                <Badge variant={UNDISABLEABLE_NOTIFICATIONS.includes(n.kind) ? "destructive" : "outline"} className="mr-2">
                  {NOTIFICATION_LABEL[n.kind]}
                </Badge>
                {n.message}
              </p>
            ))}
            <p className="text-[11px] text-muted-foreground">Critical safety notifications cannot be disabled.</p>
          </Card>
          <Card className="space-y-1 p-4">
            <p className="text-sm font-semibold">Immutable audit log ({gov.audit.length})</p>
            {gov.audit.slice(0, 40).map((a) => (
              <p key={a.id} className="text-[11px] text-muted-foreground">
                {a.at.slice(0, 19).replace("T", " ")} · {a.user} · {a.action} · {a.recordId ?? "—"}
                {a.previousValue ? ` · ${a.previousValue} → ${a.newValue}` : ""}{a.reason ? ` · ${a.reason}` : ""}
              </p>
            ))}
            <p className="text-[11px] text-muted-foreground">Audit records cannot be edited or deleted by ordinary administrators.</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
