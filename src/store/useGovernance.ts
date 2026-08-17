/** STEP 15 — governance store: records, versions, documents, reviews, releases, audit. */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MASTER_STAINS } from "@/data/masterStains";
import {
  SEED_DOCUMENTS, SEED_REVIEWERS, SAFE_FALLBACK_TEXT,
} from "@/data/governance";
import type {
  ApprovalSignature, AuditFinding, ChangeKind, ChangeRequest, ChangeRequestCategory,
  CaseSnapshot, GovAudit, GovDocument, GovRecord, GovStatus, GovVersion, NotificationKind,
  Release, RemediationTask, Reviewer, ReviewDecision, ReviewType, ReviewTrigger,
  TranslationRecord, ContentType,
} from "@/data/governance";
import {
  analyseImpact, applyTrigger, canApprove, canDelete, canPublish, canRollback, canSuspend,
  canTransition, changeRequestPriority, computeNextReview, formatChangeRequestId,
  formatReleaseId, formatStableId, governanceAudit, integrityCheck, makeRecord, makeVersion,
  nextVersionFor, remediationTasksFrom, supersedeDocument, translationAfterSourceChange,
  validateRecord, validateRelease,
} from "@/lib/governanceEngine";

const now = () => new Date().toISOString();

export type ReviewTask = {
  taskId: string;
  recordId: string;
  version: string;
  reviewType: ReviewType;
  assignedReviewer: string;
  dueDate: string;
  priority: "low" | "normal" | "high" | "critical";
  risk: string;
  requiredDocuments: string[];
  checklist: Record<string, boolean>;
  comments: string;
  decision?: ReviewDecision;
  completedAt?: string;
};

export type GovNotification = {
  id: string;
  kind: NotificationKind;
  recordId?: string;
  message: string;
  at: string;
  read: boolean;
};

type State = {
  records: GovRecord[];
  documents: GovDocument[];
  reviewers: Reviewer[];
  translations: TranslationRecord[];
  tasks: ReviewTask[];
  changeRequests: ChangeRequest[];
  releases: Release[];
  snapshots: CaseSnapshot[];
  findings: AuditFinding[];
  remediation: RemediationTask[];
  notifications: GovNotification[];
  audit: GovAudit[];
  seeded: boolean;

  seed: () => void;
  log: (e: Omit<GovAudit, "id" | "at" | "immutable">) => void;
  notify: (kind: NotificationKind, message: string, recordId?: string) => void;

  createRecord: (type: ContentType, title: string, by: string, over?: Partial<GovRecord>) => GovRecord | null;
  updateRecord: (id: string, patch: Partial<GovRecord>, by: string, reason: string) => void;
  transition: (id: string, to: GovStatus, by: string, reason: string) => { ok: boolean; message: string };
  submitForReview: (id: string, by: string) => { ok: boolean; message: string };
  assignReview: (id: string, reviewType: ReviewType, reviewerId: string, dueDate: string) => ReviewTask | null;
  decideReview: (taskId: string, reviewerId: string, decision: ReviewDecision, comments: string) => { ok: boolean; message: string };
  publish: (id: string, by: string) => { ok: boolean; message: string };
  reviseRecord: (id: string, kinds: ChangeKind[], reason: string, summary: string, by: string) => string | null;
  suspend: (id: string, reviewerId: string, reason: string) => { ok: boolean; message: string };
  rollback: (id: string, targetVersion: string, by: string, reason: string) => { ok: boolean; message: string };
  archive: (id: string, by: string, reason: string) => { ok: boolean; message: string };

  addDocument: (d: GovDocument) => void;
  supersede: (oldId: string, newDoc: GovDocument, safetyCritical: boolean) => { affected: string[]; suspended: string[] };
  fireTrigger: (id: string, trigger: ReviewTrigger, by: string) => void;

  addChangeRequest: (cat: ChangeRequestCategory, reporter: string, evidence: string, recordId?: string) => ChangeRequest;
  resolveChangeRequest: (id: string, resolution: string, by: string) => void;

  createRelease: (name: string, recordIds: string[], owner: string, scheduledDate: string) => Release;
  validateReleaseById: (releaseId: string) => { passed: boolean; issues: string[] };
  deployRelease: (releaseId: string, by: string) => { ok: boolean; message: string };

  pinCase: (caseId: string, recordId: string) => void;
  runAudit: () => { findings: AuditFinding[]; tasks: RemediationTask[] };
  runIntegrity: () => { ok: boolean; problems: string[] };
  impactFor: (id: string, kinds: ChangeKind[]) => ReturnType<typeof analyseImpact> | null;
  validate: (id: string) => ReturnType<typeof validateRecord>;
  reset: () => void;
};

const ctxOf = (s: State) => ({
  documents: s.documents, reviewers: s.reviewers, records: s.records, translations: s.translations,
});

export const useGovernance = create<State>()(
  persist(
    (set, get) => ({
      records: [], documents: [], reviewers: [], translations: [], tasks: [],
      changeRequests: [], releases: [], snapshots: [], findings: [], remediation: [],
      notifications: [], audit: [], seeded: false,

      log: (e) =>
        set((st) => ({
          audit: [{ id: `ga${st.audit.length + 1}`, at: now(), immutable: true as const, ...e }, ...st.audit].slice(0, 2000),
        })),

      notify: (kind, message, recordId) =>
        set((st) => ({
          notifications: [{ id: `gn${st.notifications.length + 1}`, kind, message, recordId, at: now(), read: false }, ...st.notifications].slice(0, 300),
        })),

      seed: () => {
        if (get().seeded) return;
        const docs = SEED_DOCUMENTS.map((d) => ({ ...d }));
        const stains = MASTER_STAINS.slice(0, 8).map((s, i) =>
          makeRecord({
            stableId: formatStableId("stain_record", i + 1),
            contentType: "stain_record",
            title: s.canonicalName,
            status: i < 5 ? "published" : "draft",
            owner: i === 6 ? undefined : "rv-textile",
            author: "rv-chem",
            technicalReviewer: i === 7 ? undefined : "rv-textile",
            safetyReviewer: "rv-safety",
            countryReviewer: "rv-country",
            sourceDocumentIds: i < 4 ? ["SM-DOC-000001"] : [],
            riskLevel: i % 3 === 0 ? "red" : "amber",
            approvedAt: i < 5 ? "2026-01-01T00:00:00.000Z" : undefined,
            publishedAt: i < 5 ? "2026-01-05T00:00:00.000Z" : undefined,
            lastReviewedAt: i < 5 ? "2026-01-05T00:00:00.000Z" : undefined,
            nextReviewAt: i === 3 ? "2026-03-01T00:00:00.000Z" : "2027-01-05T00:00:00.000Z",
            versions: [makeVersion({
              version: "1.0", immutable: true,
              approvedAt: i < 5 ? "2026-01-01T00:00:00.000Z" : undefined,
              status: i < 5 ? "published" : "draft",
              reasonForChange: "Initial governed record",
              revisionSummary: "Migrated from existing Stain Master content.",
              payload: { key: s.key, category: s.primaryCategory },
            })],
          }),
        );
        const others: GovRecord[] = [
          makeRecord({
            stableId: formatStableId("product", 1), contentType: "product",
            title: "Seitz protein remover", status: "published", owner: "rv-textile",
            author: "rv-chem", technicalReviewer: "rv-textile", safetyReviewer: "rv-safety",
            countryReviewer: "rv-country", sourceDocumentIds: ["SM-DOC-000001"],
            riskLevel: "red", approvedAt: "2026-01-02T00:00:00.000Z",
            nextReviewAt: "2026-07-01T00:00:00.000Z",
            versions: [makeVersion({ version: "1.0", immutable: true, approvedAt: "2026-01-02T00:00:00.000Z", status: "published" })],
          }),
          makeRecord({
            stableId: formatStableId("kit", 1), contentType: "kit",
            title: "Clean Craft provisional kit", status: "draft", provisional: true,
            author: "rv-chem", riskLevel: "amber", sourceDocumentIds: ["SM-DOC-000003"],
            versions: [makeVersion({ version: "0.1" })], currentVersion: "0.1",
          }),
          makeRecord({
            stableId: formatStableId("domestic_treatment", 1), contentType: "domestic_treatment",
            title: "Domestic tea stain method", status: "draft", owner: "rv-chem", author: "rv-chem",
            technicalReviewer: "rv-textile", safetyReviewer: "rv-safety", countryReviewer: "rv-country",
            domesticConfidence: 8, riskLevel: "amber", sourceDocumentIds: ["SM-DOC-000002"],
            nextReviewAt: "2027-01-01T00:00:00.000Z",
            versions: [makeVersion({ version: "1.0" })],
          }),
          makeRecord({
            stableId: formatStableId("safety_rule", 1), contentType: "safety_rule",
            title: "Never mix chlorine bleach with acid", status: "published", owner: "rv-safety",
            author: "rv-safety", technicalReviewer: "rv-textile", safetyReviewer: "rv-safety",
            countryReviewer: "rv-country", sourceDocumentIds: ["SM-DOC-000001"], riskLevel: "black",
            approvedAt: "2026-01-01T00:00:00.000Z", nextReviewAt: "2026-04-01T00:00:00.000Z",
            versions: [makeVersion({ version: "1.0", immutable: true, approvedAt: "2026-01-01T00:00:00.000Z", status: "published" })],
          }),
        ];
        const translations: TranslationRecord[] = [{
          translationId: formatStableId("translation", 1), sourceRecordId: formatStableId("stain_record", 1),
          sourceVersion: "1.0", language: "hi", country: "IN", translator: "rv-trans",
          technicalReviewer: "rv-textile", status: "published", previousVersions: [],
        }];
        set({
          records: [...stains, ...others], documents: docs, reviewers: SEED_REVIEWERS.map((r) => ({ ...r })),
          translations, seeded: true,
        });
        const findings = governanceAudit(get().records, docs, translations);
        set({ findings, remediation: remediationTasksFrom(findings) });
        get().log({ user: "system", action: "seed", reason: "Initial governance audit executed" });
      },

      createRecord: (type, title, by, over) => {
        const st = get();
        const n = st.records.filter((r) => r.contentType === type).length + 1;
        let stableId = formatStableId(type, n);
        if (st.records.some((r) => r.stableId === stableId)) {
          stableId = formatStableId(type, st.records.length + n + 1);
        }
        if (st.records.some((r) => r.stableId === stableId)) return null;
        const rec = makeRecord({
          stableId, contentType: type, title, author: by, status: "draft",
          versions: [makeVersion({ version: "1.0", reasonForChange: "Initial draft" })],
          ...over,
        });
        set((s) => ({ records: [rec, ...s.records] }));
        get().log({ user: by, action: "create", recordId: stableId, version: rec.currentVersion });
        return rec;
      },

      updateRecord: (id, patch, by, reason) => {
        set((s) => ({
          records: s.records.map((r) => (r.stableId === id ? { ...r, ...patch, lastModifiedAt: now() } : r)),
        }));
        get().log({ user: by, action: "update", recordId: id, reason });
      },

      transition: (id, to, by, reason) => {
        const rec = get().records.find((r) => r.stableId === id);
        if (!rec) return { ok: false, message: "Record not found." };
        if (!canTransition(rec.status, to)) {
          return { ok: false, message: `Transition ${rec.status} → ${to} is not permitted.` };
        }
        get().updateRecord(id, { status: to }, by, reason);
        get().log({ user: by, action: "transition", recordId: id, previousValue: rec.status, newValue: to, reason });
        return { ok: true, message: `Status set to ${to}.` };
      },

      submitForReview: (id, by) => {
        const rec = get().records.find((r) => r.stableId === id);
        if (!rec) return { ok: false, message: "Record not found." };
        if (rec.sourceDocumentIds.length === 0) {
          get().transition(id, "evidence_required", by, "Evidence missing at submission");
          return { ok: false, message: "Evidence is required before review." };
        }
        const res = get().transition(id, "technical_review", by, "Submitted for technical review");
        if (res.ok) {
          get().updateRecord(id, { submittedAt: now() }, by, "Submitted");
          get().notify("review_assigned", `${rec.title} submitted for technical review.`, id);
        }
        return res;
      },

      assignReview: (id, reviewType, reviewerId, dueDate) => {
        const rec = get().records.find((r) => r.stableId === id);
        if (!rec) return null;
        const task: ReviewTask = {
          taskId: `SM-TSK-${String(get().tasks.length + 1).padStart(6, "0")}`,
          recordId: id, version: rec.currentVersion, reviewType, assignedReviewer: reviewerId,
          dueDate, priority: rec.riskLevel === "black" ? "critical" : rec.riskLevel === "red" ? "high" : "normal",
          risk: rec.riskLevel, requiredDocuments: rec.sourceDocumentIds, checklist: {}, comments: "",
        };
        set((s) => ({ tasks: [task, ...s.tasks] }));
        get().notify("review_assigned", `${REVIEW_LABEL[reviewType]} assigned for ${rec.title}.`, id);
        get().log({ user: reviewerId, action: "review_assigned", recordId: id, version: rec.currentVersion });
        return task;
      },

      decideReview: (taskId, reviewerId, decision, comments) => {
        const st = get();
        const task = st.tasks.find((t) => t.taskId === taskId);
        if (!task) return { ok: false, message: "Task not found." };
        const rec = st.records.find((r) => r.stableId === task.recordId);
        const reviewer = st.reviewers.find((r) => r.id === reviewerId);
        if (!rec || !reviewer) return { ok: false, message: "Record or reviewer not found." };

        if (decision === "approve" || decision === "approve_with_notes") {
          const check = canApprove(reviewer, rec, task.reviewType);
          if (!check.ok) return { ok: false, message: check.reason };
          const signature: ApprovalSignature = {
            reviewerId, reviewerName: reviewer.name, role: reviewer.roles[0], scopes: reviewer.scopes,
            reviewType: task.reviewType, decision, at: now(), versionApproved: rec.currentVersion,
            checklistCompleted: true, comments, authenticated: true,
          };
          set((s) => ({
            records: s.records.map((r) =>
              r.stableId !== rec.stableId ? r : {
                ...r, reviewedAt: now(),
                versions: r.versions.map((v) =>
                  v.version === r.currentVersion ? { ...v, signatures: [...v.signatures, signature] } : v),
              }),
          }));
          get().log({ user: reviewerId, action: `approve_${task.reviewType}`, recordId: rec.stableId, version: rec.currentVersion, reason: comments, approvalImpact: true });
          get().notify("content_approved", `${REVIEW_LABEL[task.reviewType]} approved for ${rec.title}.`, rec.stableId);
        } else if (decision === "changes_required" || decision === "reject") {
          get().transition(rec.stableId, decision === "reject" ? "rejected" : "changes_requested", reviewerId, comments);
          get().notify("changes_requested", `${rec.title}: ${comments || decision}`, rec.stableId);
        } else if (decision === "suspend_pending_investigation") {
          get().suspend(rec.stableId, reviewerId, comments || "Suspended pending investigation");
        }

        set((s) => ({
          tasks: s.tasks.map((t) => (t.taskId === taskId ? { ...t, decision, comments, completedAt: now() } : t)),
        }));
        return { ok: true, message: "Decision recorded." };
      },

      publish: (id, by) => {
        const st = get();
        const rec = st.records.find((r) => r.stableId === id);
        if (!rec) return { ok: false, message: "Record not found." };
        // move approved records forward once all signatures exist
        const staged = rec.status === "technical_review" || rec.status === "safety_review" ||
          rec.status === "country_review" || rec.status === "translation_review"
          ? { ...rec, status: "approved" as GovStatus, approvedAt: rec.approvedAt ?? now() }
          : rec;
        const check = canPublish(staged, ctxOf(st));
        if (!check.ok) return { ok: false, message: check.reason };
        const at = now();
        set((s) => ({
          records: s.records.map((r) =>
            r.stableId !== id ? r : {
              ...r, status: "published", approvedAt: staged.approvedAt ?? at, publishedAt: at,
              lastReviewedAt: at, nextReviewAt: computeNextReview(r, at),
              versions: r.versions.map((v) =>
                v.version === r.currentVersion ? { ...v, status: "published", publishedAt: at, immutable: true } : v),
            }),
        }));
        get().log({ user: by, action: "publish", recordId: id, version: rec.currentVersion, approvalImpact: true });
        get().notify("content_published", `${rec.title} v${rec.currentVersion} published.`, id);
        return { ok: true, message: "Published." };
      },

      reviseRecord: (id, kinds, reason, summary, by) => {
        const rec = get().records.find((r) => r.stableId === id);
        if (!rec) return null;
        const version = nextVersionFor(rec, kinds);
        const draft = makeVersion({
          version, reasonForChange: reason, revisionSummary: summary, changeKinds: kinds,
          sourceDocumentIds: rec.sourceDocumentIds, status: "draft", immutable: false,
        });
        set((s) => ({
          records: s.records.map((r) =>
            r.stableId !== id ? r : {
              ...r, currentVersion: version, status: "draft", pendingChangeKinds: kinds,
              reasonForChange: reason, revisionSummary: summary, lastModifiedAt: now(),
              approvedAt: undefined, versions: [...r.versions, draft],
            }),
        }));
        // Source change invalidates dependent translations.
        const safetyCritical = kinds.some((k) => k !== "wording_clarification" && k !== "formatting");
        set((s) => ({
          translations: s.translations.map((t) =>
            t.sourceRecordId === id ? translationAfterSourceChange(t, version, safetyCritical) : t),
        }));
        get().log({ user: by, action: "revise", recordId: id, previousValue: rec.currentVersion, newValue: version, reason });
        get().notify("translation_outdated", `Translations for ${rec.title} require review.`, id);
        return version;
      },

      suspend: (id, reviewerId, reason) => {
        const st = get();
        const reviewer = st.reviewers.find((r) => r.id === reviewerId);
        const rec = st.records.find((r) => r.stableId === id);
        if (!rec) return { ok: false, message: "Record not found." };
        if (!reviewer || !canSuspend(reviewer)) return { ok: false, message: "Not authorised to suspend guidance." };
        set((s) => ({
          records: s.records.map((r) =>
            r.stableId === id ? { ...r, status: "suspended", suspendedAt: now(), suspensionReason: reason } : r),
        }));
        get().log({ user: reviewerId, action: "emergency_suspension", recordId: id, reason, approvalImpact: true });
        get().notify("emergency_suspension", `${rec.title} suspended. ${SAFE_FALLBACK_TEXT}`, id);
        return { ok: true, message: SAFE_FALLBACK_TEXT };
      },

      rollback: (id, targetVersion, by, reason) => {
        const rec = get().records.find((r) => r.stableId === id);
        if (!rec) return { ok: false, message: "Record not found." };
        const res = canRollback(rec, targetVersion);
        if (!res.ok) return { ok: false, message: res.message };
        set((s) => ({
          records: s.records.map((r) =>
            r.stableId !== id ? r : {
              ...r, currentVersion: targetVersion, status: "approved",
              versions: r.versions.map((v) =>
                v.version === res.withdrawnVersion ? { ...v, withdrawnAt: now(), immutable: true } : v),
            }),
        }));
        get().log({ user: by, action: "rollback", recordId: id, previousValue: res.withdrawnVersion, newValue: targetVersion, reason, approvalImpact: true });
        get().notify("rollback_completed", `${rec.title} restored to v${targetVersion}.`, id);
        return { ok: true, message: `Restored version ${targetVersion}. Withdrawn version preserved.` };
      },

      archive: (id, by, reason) => {
        const rec = get().records.find((r) => r.stableId === id);
        if (!rec) return { ok: false, message: "Record not found." };
        set((s) => ({
          records: s.records.map((r) => (r.stableId === id ? { ...r, status: "archived", archivedAt: now() } : r)),
        }));
        get().log({ user: by, action: "archive", recordId: id, reason });
        return { ok: true, message: canDelete(rec).ok ? "Archived." : "Archived (deletion is not permitted for this content)." };
      },

      addDocument: (d) => {
        set((s) => ({ documents: [d, ...s.documents] }));
        get().log({ user: "system", action: "document_added", recordId: d.documentId, version: d.documentVersion });
      },

      supersede: (oldId, newDoc, safetyCritical) => {
        const st = get();
        const oldDoc = st.documents.find((d) => d.documentId === oldId);
        if (!oldDoc) return { affected: [], suspended: [] };
        const res = supersedeDocument(oldDoc, newDoc, st.records, safetyCritical);
        set((s) => ({
          documents: [res.replacement, ...s.documents.map((d) => (d.documentId === oldId ? res.superseded : d))],
          records: s.records.map((r) => {
            if (res.suspendedRecordIds.includes(r.stableId)) {
              return { ...r, status: "suspended", suspendedAt: now(), suspensionReason: "Safety-critical document change" };
            }
            if (res.affectedRecordIds.includes(r.stableId) && r.status === "published") {
              return { ...r, status: "needs_review" };
            }
            return r;
          }),
        }));
        get().log({ user: "system", action: "document_superseded", recordId: oldId, newValue: newDoc.documentId, approvalImpact: safetyCritical });
        get().notify("document_superseded", `${oldId} superseded by ${newDoc.documentId}.`);
        return { affected: res.affectedRecordIds, suspended: res.suspendedRecordIds };
      },

      fireTrigger: (id, trigger, by) => {
        const rec = get().records.find((r) => r.stableId === id);
        if (!rec) return;
        const out = applyTrigger(rec, trigger);
        set((s) => ({
          records: s.records.map((r) =>
            r.stableId === id ? {
              ...r, status: out.status,
              suspendedAt: out.suspend ? now() : r.suspendedAt,
              suspensionReason: out.suspend ? out.reason : r.suspensionReason,
            } : r),
        }));
        out.notify.forEach((n) => get().notify(n, `${rec.title}: ${out.reason}`, id));
        get().log({ user: by, action: `trigger_${trigger}`, recordId: id, reason: out.reason });
      },

      addChangeRequest: (cat, reporter, evidence, recordId) => {
        const req: ChangeRequest = {
          requestId: formatChangeRequestId(get().changeRequests.length + 1),
          category: cat, priority: changeRequestPriority(cat), reporter, evidence,
          status: "open", linkedRecordId: recordId, createdAt: now(),
          assignedOwner: cat === "unsafe_advice" || cat === "garment_damage" ? "rv-safety" : "rv-textile",
        };
        set((s) => ({ changeRequests: [req, ...s.changeRequests] }));
        get().log({ user: reporter, action: "change_request", recordId: recordId ?? req.requestId, reason: cat });
        return req;
      },

      resolveChangeRequest: (id, resolution, by) => {
        set((s) => ({
          changeRequests: s.changeRequests.map((c) => (c.requestId === id ? { ...c, status: "resolved", resolution } : c)),
        }));
        get().log({ user: by, action: "change_request_resolved", recordId: id, reason: resolution });
      },

      createRelease: (name, recordIds, owner, scheduledDate) => {
        const rel: Release = {
          releaseId: formatReleaseId(get().releases.length + 1), name, version: "1.0", kind: "content",
          recordIds, countries: ["IN"], languages: ["en"], scheduledDate, owner,
          validationPassed: false, validationIssues: [], deployment: "pending",
          rollbackPlan: "Restore the previous approved version of every included record.", notes: "",
        };
        set((s) => ({ releases: [rel, ...s.releases] }));
        get().log({ user: owner, action: "release_created", recordId: rel.releaseId });
        return rel;
      },

      validateReleaseById: (releaseId) => {
        const st = get();
        const rel = st.releases.find((r) => r.releaseId === releaseId);
        if (!rel) return { passed: false, issues: ["Release not found."] };
        const res = validateRelease(rel, st.records, ctxOf(st));
        set((s) => ({
          releases: s.releases.map((r) =>
            r.releaseId === releaseId ? { ...r, validationPassed: res.passed, validationIssues: res.issues } : r),
        }));
        if (!res.passed) get().notify("release_failed", `${rel.name}: validation failed.`);
        return res;
      },

      deployRelease: (releaseId, by) => {
        const res = get().validateReleaseById(releaseId);
        const rel = get().releases.find((r) => r.releaseId === releaseId);
        if (!rel) return { ok: false, message: "Release not found." };
        if (!res.passed) {
          set((s) => ({ releases: s.releases.map((r) => (r.releaseId === releaseId ? { ...r, deployment: "failed" } : r)) }));
          return { ok: false, message: res.issues[0] };
        }
        rel.recordIds.forEach((id) => get().publish(id, by));
        set((s) => ({ releases: s.releases.map((r) => (r.releaseId === releaseId ? { ...r, deployment: "deployed", approvedBy: by } : r)) }));
        get().log({ user: by, action: "release_deployed", recordId: releaseId, approvalImpact: true });
        return { ok: true, message: "Release deployed." };
      },

      pinCase: (caseId, recordId) => {
        const rec = get().records.find((r) => r.stableId === recordId);
        if (!rec) return;
        const v = rec.versions.find((x) => x.version === rec.currentVersion);
        set((s) => ({
          snapshots: [{ caseId, recordId, version: rec.currentVersion, usedAt: now(), payload: v?.payload ?? {} }, ...s.snapshots],
        }));
      },

      runAudit: () => {
        const st = get();
        const findings = governanceAudit(st.records, st.documents, st.translations);
        const tasks = remediationTasksFrom(findings);
        set({ findings, remediation: tasks });
        get().log({ user: "system", action: "governance_audit", reason: `${findings.length} findings` });
        return { findings, tasks };
      },

      runIntegrity: () => {
        const st = get();
        return integrityCheck(st.records, st.snapshots, st.documents);
      },

      impactFor: (id, kinds) => {
        const st = get();
        const rec = st.records.find((r) => r.stableId === id);
        if (!rec) return null;
        return analyseImpact(rec, st.records, st.snapshots, kinds);
      },

      validate: (id) => {
        const st = get();
        const rec = st.records.find((r) => r.stableId === id);
        if (!rec) return [];
        return validateRecord(rec, ctxOf(st));
      },

      reset: () => set({
        records: [], documents: [], reviewers: [], translations: [], tasks: [], changeRequests: [],
        releases: [], snapshots: [], findings: [], remediation: [], notifications: [], audit: [], seeded: false,
      }),
    }),
    { name: "sm-governance-v1" },
  ),
);

const REVIEW_LABEL: Record<ReviewType, string> = {
  technical: "Technical review", safety: "Chemical-safety review", country: "Country review",
  translation: "Translation review", documentation: "Documentation review",
};
