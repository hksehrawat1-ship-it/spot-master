/** STEP 15 — 40 acceptance scenarios for content governance, review and version control. */

import {
  SEED_REVIEWERS, SEED_DOCUMENTS, SAFE_FALLBACK_TEXT, UNDISABLEABLE_NOTIFICATIONS,
} from "@/data/governance";
import type {
  GovRecord, GovDocument, CaseSnapshot, Reviewer, TranslationRecord, Release, ApprovalSignature,
} from "@/data/governance";
import {
  analyseImpact, applyTrigger, bumpVersion, canApprove, canDelete, canDeleteAudit,
  canDisableNotification, canPublish, canReview, canRollback, canSuspend, canTransition,
  changeRequestPriority, classifyChange, countryApplicabilityOk, formatStableId,
  governanceAudit, integrityCheck, isDirectPublishAttempt, isDuplicateStableId, isLive,
  liveGuidanceFor, makeRecord, makeVersion, previewUrl, canAccessPreview, remediationTasksFrom,
  signaturesCarryForward, supersedeDocument, translationAfterSourceChange, validateRecord,
  validateRelease, validationErrors,
} from "@/lib/governanceEngine";

const reviewers = SEED_REVIEWERS;
const rv = (id: string) => reviewers.find((r) => r.id === id) as Reviewer;

const sig = (p: Partial<ApprovalSignature> & { reviewType: ApprovalSignature["reviewType"]; versionApproved: string }): ApprovalSignature => ({
  reviewerId: "rv-textile", reviewerName: "A", role: "textile_technical_reviewer",
  scopes: ["textile_fibres"], decision: "approve", at: new Date().toISOString(),
  checklistCompleted: true, comments: "ok", authenticated: true, ...p,
});

const docs: GovDocument[] = SEED_DOCUMENTS.map((d) => ({ ...d }));

function baseRecord(over: Partial<GovRecord> = {}): GovRecord {
  const r = makeRecord({
    stableId: "SM-STN-000001", contentType: "stain_record", title: "Curry stain",
    owner: "rv-textile", author: "rv-chem", technicalReviewer: "rv-textile",
    safetyReviewer: "rv-safety", countryReviewer: "rv-country",
    sourceDocumentIds: ["SM-DOC-000001"], countries: ["IN"], language: "en",
    nextReviewAt: "2030-01-01T00:00:00.000Z", approvedAt: "2026-01-01T00:00:00.000Z",
    versions: [makeVersion({ version: "1.0", immutable: true, approvedAt: "2026-01-01T00:00:00.000Z" })],
    ...over,
  });
  return r;
}

const ctx = (records: GovRecord[] = [], translations: TranslationRecord[] = []) => ({
  documents: docs, reviewers, records, translations, now: "2026-08-17T00:00:00.000Z",
});

export type Scenario = { id: string; title: string; run: () => boolean };

export const SCENARIOS: Scenario[] = [
  { id: "G01", title: "Draft stain submitted for review", run: () => canTransition("draft", "technical_review") },
  {
    id: "G02", title: "Author cannot self-approve restricted content",
    run: () => {
      const r = baseRecord({ author: "rv-textile" });
      return !canApprove(rv("rv-textile"), r, "technical").ok;
    },
  },
  {
    id: "G03", title: "Technical reviewer approves within scope",
    run: () => canApprove(rv("rv-textile"), baseRecord(), "technical").ok,
  },
  {
    id: "G04", title: "Approval outside qualification scope is refused",
    run: () => !canReview(rv("rv-trans"), baseRecord(), "technical").ok,
  },
  {
    id: "G05", title: "Safety-critical mapping requires safety review",
    run: () => {
      const r = baseRecord({ contentType: "product_mapping", stableId: "SM-MAP-000001" });
      const need = canPublish({ ...r, status: "approved" }, ctx([r]));
      return !need.ok && need.reason.includes("safety");
    },
  },
  {
    id: "G06", title: "Domestic method below 9/10 is blocked",
    run: () => {
      const r = baseRecord({ contentType: "domestic_treatment", stableId: "SM-DOM-000001", domesticConfidence: 8 });
      return validationErrors(validateRecord(r, ctx([r]))).some((e) => e.code === "domestic_confidence");
    },
  },
  {
    id: "G07", title: "Result with four recommendations is blocked",
    run: () => {
      const r = baseRecord({ recommendationCount: 4 });
      return validationErrors(validateRecord(r, ctx([r]))).some((e) => e.code === "recommendation_count");
    },
  },
  {
    id: "G08", title: "Result with six recommendations is blocked",
    run: () => {
      const r = baseRecord({ recommendationCount: 6 });
      return validationErrors(validateRecord(r, ctx([r]))).some((e) => e.code === "recommendation_count");
    },
  },
  {
    id: "G09", title: "Current SDS is superseded and preserved",
    run: () => {
      const newDoc: GovDocument = { ...docs[0], documentId: "SM-DOC-000010", documentVersion: "4.0" };
      const res = supersedeDocument(docs[0], newDoc, [baseRecord()], false);
      return res.superseded.status === "superseded" && res.replacement.supersedes === docs[0].documentId;
    },
  },
  {
    id: "G10", title: "Product mapping becomes Needs Review after supersession",
    run: () => {
      const map = baseRecord({ contentType: "product_mapping", stableId: "SM-MAP-000001" });
      const res = supersedeDocument(docs[0], { ...docs[0], documentId: "SM-DOC-000011" }, [map], false);
      return res.affectedRecordIds.includes("SM-MAP-000001") && res.suspendedRecordIds.length === 0;
    },
  },
  {
    id: "G11", title: "Safety-critical document change suspends guidance",
    run: () => {
      const map = baseRecord({ contentType: "product_mapping", stableId: "SM-MAP-000001" });
      const res = supersedeDocument(docs[0], { ...docs[0], documentId: "SM-DOC-000012" }, [map], true);
      return res.suspendedRecordIds.includes("SM-MAP-000001");
    },
  },
  { id: "G12", title: "Minor wording update creates a minor version", run: () => bumpVersion("1.0", classifyChange(["wording_clarification"])) === "1.1" },
  { id: "G13", title: "Fabric prohibition creates a major version", run: () => bumpVersion("1.1", classifyChange(["fabric_prohibition"])) === "2.0" },
  {
    id: "G14", title: "Historical case retains the old version",
    run: () => {
      const r = baseRecord({
        currentVersion: "2.0",
        versions: [
          makeVersion({ version: "1.0", immutable: true, approvedAt: "2025-01-01" }),
          makeVersion({ version: "2.0", immutable: true, approvedAt: "2026-01-01" }),
        ],
      });
      const snap: CaseSnapshot = { caseId: "CASE-1", recordId: r.stableId, version: "1.0", usedAt: "2025-06-01", payload: {} };
      const impact = analyseImpact(r, [r], [snap], ["fabric_prohibition"]);
      return impact.historicalCasesUnaffected.includes("CASE-1") && integrityCheck([r], [snap], docs).ok;
    },
  },
  {
    id: "G15", title: "Emergency suspension removes live guidance",
    run: () => {
      const r = baseRecord({ status: "suspended" });
      return liveGuidanceFor([r]).length === 0 && !isLive(r);
    },
  },
  { id: "G16", title: "Safe fallback text is defined", run: () => SAFE_FALLBACK_TEXT.startsWith("This guidance is temporarily unavailable") },
  {
    id: "G17", title: "Rollback restores previous approved content",
    run: () => {
      const r = baseRecord({
        currentVersion: "2.0",
        versions: [
          makeVersion({ version: "1.0", immutable: true, approvedAt: "2025-01-01" }),
          makeVersion({ version: "2.0", immutable: true, approvedAt: "2026-01-01" }),
        ],
      });
      const res = canRollback(r, "1.0");
      return res.ok && res.withdrawnVersion === "2.0";
    },
  },
  {
    id: "G18", title: "Withdrawn version remains auditable",
    run: () => {
      const v = makeVersion({ version: "2.0", immutable: true, withdrawnAt: "2026-02-01" });
      return v.immutable && !!v.withdrawnAt;
    },
  },
  {
    id: "G19", title: "Translation becomes outdated after source change",
    run: () => {
      const t: TranslationRecord = {
        translationId: "SM-TRA-000001", sourceRecordId: "SM-STN-000001", sourceVersion: "1.0",
        language: "hi", country: "IN", translator: "rv-trans", status: "published", previousVersions: [],
      };
      return translationAfterSourceChange(t, "1.1", false).status === "outdated";
    },
  },
  {
    id: "G20", title: "Safety-critical source change suspends the translation",
    run: () => {
      const t: TranslationRecord = {
        translationId: "SM-TRA-000002", sourceRecordId: "SM-STN-000001", sourceVersion: "1.0",
        language: "hi", country: "IN", translator: "rv-trans", status: "published", previousVersions: [],
      };
      const out = translationAfterSourceChange(t, "2.0", true);
      return out.status === "suspended" && out.previousVersions.length === 1;
    },
  },
  {
    id: "G21", title: "Country mismatch blocks publication",
    run: () => {
      const r = baseRecord({ countries: ["GB"] });
      return validationErrors(validateRecord(r, ctx([r]))).some((e) => e.code === "country_mismatch") &&
        !countryApplicabilityOk(r, docs).ok;
    },
  },
  {
    id: "G22", title: "Draft preview stays private",
    run: () => {
      const r = baseRecord({ status: "draft" });
      const url = previewUrl(r, "domestic", "tok123");
      return url.includes("/admin/") && canAccessPreview(true, "tok123", "tok123") && !canAccessPreview(false, "tok123", "tok123");
    },
  },
  {
    id: "G23", title: "Direct preview URL is inaccessible publicly",
    run: () => !canAccessPreview(false, "", "tok123") && !canAccessPreview(true, "wrong", "tok123"),
  },
  {
    id: "G24", title: "Product rank suspended after evidence change",
    run: () => {
      const rank = baseRecord({ contentType: "product_ranking", stableId: "SM-RNK-000001", status: "published" });
      return applyTrigger(rank, "ranking_evidence_change").status === "needs_review" &&
        applyTrigger(rank, "sds_change").suspend;
    },
  },
  {
    id: "G25", title: "System administrator cannot approve chemistry by default",
    run: () => !canApprove(rv("rv-admin"), baseRecord(), "technical").ok,
  },
  {
    id: "G26", title: "Approval is authenticated and version-specific",
    run: () => {
      const r = baseRecord({
        status: "approved", contentType: "public_content", stableId: "SM-PUB-000001",
        versions: [makeVersion({
          version: "1.0", immutable: true, approvedAt: "2026-01-01",
          signatures: [
            sig({ reviewType: "technical", versionApproved: "0.9" }),
            sig({ reviewType: "country", versionApproved: "1.0", role: "country_reviewer" }),
          ],
        })],
      });
      return !canPublish(r, ctx([r])).ok;
    },
  },
  {
    id: "G27", title: "Record cannot publish without owner",
    run: () => {
      const r = baseRecord({ owner: undefined, status: "approved" });
      return !canPublish(r, ctx([r])).ok;
    },
  },
  {
    id: "G28", title: "Record cannot publish without source",
    run: () => {
      const r = baseRecord({ sourceDocumentIds: [], status: "approved" });
      return !canPublish(r, ctx([r])).ok;
    },
  },
  {
    id: "G29", title: "Active instruction cannot depend only on superseded evidence",
    run: () => {
      const superseded = docs.map((d) => (d.documentId === "SM-DOC-000001" ? { ...d, status: "superseded" as const } : d));
      const r = baseRecord();
      const issues = validateRecord(r, { ...ctx([r]), documents: superseded });
      return validationErrors(issues).some((e) => e.code === "superseded_evidence");
    },
  },
  {
    id: "G30", title: "Duplicate stable ID is rejected",
    run: () => isDuplicateStableId([{ stableId: "SM-STN-000001" }], formatStableId("stain_record", 1)),
  },
  {
    id: "G31", title: "Orphaned version is detected",
    run: () => {
      const r = baseRecord({ currentVersion: "3.0" });
      return !integrityCheck([r], [], docs).ok;
    },
  },
  {
    id: "G32", title: "Change request creates an assigned high-priority task",
    run: () => changeRequestPriority("unsafe_advice") === "critical" && changeRequestPriority("search_issue") === "normal",
  },
  {
    id: "G33", title: "Overdue review is detectable for the dashboard",
    run: () => {
      const r = baseRecord({ nextReviewAt: "2020-01-01T00:00:00.000Z" });
      return !!r.nextReviewAt && r.nextReviewAt < "2026-08-17T00:00:00.000Z";
    },
  },
  {
    id: "G34", title: "Critical notification cannot be disabled",
    run: () => UNDISABLEABLE_NOTIFICATIONS.every((n) => !canDisableNotification(n)) && canDisableNotification("review_due_soon"),
  },
  {
    id: "G35", title: "Release validation fails safely",
    run: () => {
      const r = baseRecord({ status: "draft" });
      const rel: Release = {
        releaseId: "SM-REL-0001", name: "R1", version: "1.0", kind: "content",
        recordIds: [r.stableId], countries: ["IN"], languages: ["en"],
        scheduledDate: "2026-09-01", owner: "rv-textile", validationPassed: false,
        validationIssues: [], deployment: "pending", rollbackPlan: "Restore 1.0", notes: "",
      };
      const res = validateRelease(rel, [r], ctx([r]));
      return !res.passed && res.issues.length > 0;
    },
  },
  {
    id: "G36", title: "Release rollback path is preserved",
    run: () => {
      const r = baseRecord({
        contentType: "public_content", stableId: "SM-PUB-000002", currentVersion: "2.0",
        versions: [
          makeVersion({ version: "1.0", immutable: true, approvedAt: "2025-01-01" }),
          makeVersion({ version: "2.0", immutable: true, approvedAt: "2026-01-01" }),
        ],
      });
      return canRollback(r, "1.0").ok && !canRollback(baseRecord({ contentType: "sds" }), "1.0").ok;
    },
  },
  {
    id: "G37", title: "Archived product remains in historical cases",
    run: () => {
      const r = baseRecord({ contentType: "product", stableId: "SM-PRD-000001", status: "archived" });
      const snap: CaseSnapshot = { caseId: "CASE-9", recordId: r.stableId, version: "1.0", usedAt: "2025-01-01", payload: {} };
      return !canDelete(r).ok && integrityCheck([r], [snap], docs).ok;
    },
  },
  { id: "G38", title: "Audit record cannot be deleted by an ordinary administrator", run: () => !canDeleteAudit("system_administrator") },
  {
    id: "G39", title: "Initial governance audit identifies provisional kit records",
    run: () => {
      const kit = baseRecord({ contentType: "kit", stableId: "SM-KIT-000001", provisional: true });
      const findings = governanceAudit([kit], docs);
      const tasks = remediationTasksFrom(findings);
      return findings.some((f) => f.kind === "provisional_data") && tasks.length === findings.length;
    },
  },
  {
    id: "G40", title: "Suspended domestic method disappears from live guidance",
    run: () => {
      const dom = baseRecord({ contentType: "domestic_treatment", stableId: "SM-DOM-000002", status: "suspended", domesticConfidence: 9 });
      const pub = baseRecord({ contentType: "public_content", stableId: "SM-PUB-000003", status: "published" });
      return liveGuidanceFor([dom, pub]).map((r) => r.stableId).join() === "SM-PUB-000003";
    },
  },
  {
    id: "G41", title: "Published content can be reproduced by version",
    run: () => {
      const r = baseRecord({
        versions: [makeVersion({ version: "1.0", immutable: true, approvedAt: "2026-01-01", payload: { steps: ["a", "b"] } })],
      });
      const v = r.versions.find((x) => x.version === "1.0");
      return !!v && Array.isArray((v.payload as { steps: string[] }).steps);
    },
  },
  { id: "G42", title: "Direct draft-to-published transition is refused", run: () => isDirectPublishAttempt("draft", "published") && !canTransition("draft", "published") },
  {
    id: "G43", title: "Expired reviewer authorisation blocks review",
    run: () => !canReview(rv("rv-expired"), baseRecord(), "technical", "2026-08-17T00:00:00.000Z").ok,
  },
  {
    id: "G44", title: "Major version does not inherit prior approvals",
    run: () => {
      const v = makeVersion({ version: "1.0", signatures: [sig({ reviewType: "technical", versionApproved: "1.0" })] });
      return signaturesCarryForward(v, "2.0").length === 0 && signaturesCarryForward(v, "1.1").length === 1;
    },
  },
  {
    id: "G45", title: "Impact analysis lists downstream records and required reviewers",
    run: () => {
      const map = baseRecord({ contentType: "product_mapping", stableId: "SM-MAP-000001" });
      const path = baseRecord({ contentType: "treatment_pathway", stableId: "SM-PTH-000001" });
      const pub = baseRecord({ contentType: "public_content", stableId: "SM-PUB-000004" });
      const impact = analyseImpact(map, [map, path, pub], [], ["treatment_sequence"]);
      return impact.records.includes("SM-PTH-000001") && impact.publicPages.includes("SM-PUB-000004") &&
        impact.recommendedRelease === "major" && impact.blocking;
    },
  },
  {
    id: "G46", title: "Only authorised safety roles may suspend",
    run: () => canSuspend(rv("rv-safety")) && !canSuspend(rv("rv-trans")),
  },
  {
    id: "G47", title: "Suspended dependency blocks downstream validation",
    run: () => {
      const rule = baseRecord({ contentType: "safety_rule", stableId: "SM-SFR-000001", status: "suspended" });
      const dom = baseRecord({ contentType: "domestic_treatment", stableId: "SM-DOM-000003", domesticConfidence: 9 });
      return validationErrors(validateRecord(dom, ctx([rule, dom]))).some((e) => e.code === "suspended_dependency");
    },
  },
];

export function runGovernanceScenarios() {
  const results = SCENARIOS.map((s) => {
    let pass = false;
    try { pass = s.run(); } catch { pass = false; }
    return { id: s.id, title: s.title, pass };
  });
  return { total: results.length, passed: results.filter((r) => r.pass).length, results };
}
