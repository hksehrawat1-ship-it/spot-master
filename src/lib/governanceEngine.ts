/**
 * STEP 15 — Governance engine: stable IDs, immutable versions, workflow control,
 * reviewer scope, validation, supersession, dependency/impact analysis,
 * suspension, rollback, releases and the initial governance audit.
 *
 * Deterministic and side-effect free: the store applies the results.
 */

import {
  ALLOWED_TRANSITIONS, ARCHIVE_ONLY_TYPES, CHECKLISTS, CHECKLIST_FOR_TYPE,
  DEFAULT_REVIEW_INTERVAL_DAYS, DEPENDENCY_EDGES, HIGH_PRIORITY_CATEGORIES, ID_PREFIX,
  LIVE_EVIDENCE_STATUSES, LIVE_STATUSES, MAJOR_CHANGE_KINDS, PREVIEWABLE_STATUSES,
  REVIEW_TYPE_ROLES, REVIEW_TYPE_SCOPES, SAFETY_CRITICAL_TYPES, SUSPENDING_TRIGGERS,
  UNDISABLEABLE_NOTIFICATIONS,
} from "@/data/governance";
import type {
  AuditFinding, ChangeKind, ChangeRequestCategory, ContentType, GovDocument, GovRecord,
  GovRole, GovStatus, GovVersion, NotificationKind, RemediationTask, Reviewer, ReviewType,
  ReviewTrigger, RiskLevel, TranslationRecord, CaseSnapshot, Release, PreviewMode,
} from "@/data/governance";

/* ------------------------------------------------------------------ */
/* 4. Stable IDs                                                       */
/* ------------------------------------------------------------------ */

export function formatStableId(type: ContentType, n: number) {
  return `SM-${ID_PREFIX[type]}-${String(n).padStart(6, "0")}`;
}

export function formatDocumentId(n: number) {
  return `SM-DOC-${String(n).padStart(6, "0")}`;
}

export function formatTaskId(n: number) {
  return `SM-TSK-${String(n).padStart(6, "0")}`;
}

export function formatChangeRequestId(n: number) {
  return `SM-CRQ-${String(n).padStart(6, "0")}`;
}

export function formatReleaseId(n: number) {
  return `SM-REL-${String(n).padStart(4, "0")}`;
}

export function isDuplicateStableId(existing: { stableId: string }[], stableId: string) {
  return existing.some((r) => r.stableId === stableId);
}

/* ------------------------------------------------------------------ */
/* 5. Version numbering                                                */
/* ------------------------------------------------------------------ */

export function classifyChange(kinds: ChangeKind[]): "major" | "minor" {
  return kinds.some((k) => (MAJOR_CHANGE_KINDS as readonly string[]).includes(k)) ? "major" : "minor";
}

export function bumpVersion(current: string, kind: "major" | "minor") {
  const [maj, min] = current.split(".").map((n) => Number(n) || 0);
  return kind === "major" ? `${maj + 1}.0` : `${maj}.${min + 1}`;
}

export function nextVersionFor(record: GovRecord, kinds: ChangeKind[]) {
  return bumpVersion(record.currentVersion, classifyChange(kinds));
}

/** Immutable versions are never edited; a correction creates a new revision. */
export function canEditVersion(v: GovVersion) {
  return !v.immutable;
}

/* ------------------------------------------------------------------ */
/* 6/7. Workflow                                                       */
/* ------------------------------------------------------------------ */

export function canTransition(from: GovStatus, to: GovStatus) {
  return (ALLOWED_TRANSITIONS[from] ?? []).includes(to);
}

/** Direct Draft → Published is never permitted. */
export function isDirectPublishAttempt(from: GovStatus, to: GovStatus) {
  return to === "published" && (from === "draft" || from === "evidence_required" || from === "changes_requested");
}

export function isSafetyCritical(record: GovRecord) {
  return SAFETY_CRITICAL_TYPES.includes(record.contentType) ||
    record.riskLevel === "red" || record.riskLevel === "black";
}

/** 8. Which review types this record must clear before approval. */
export function requiredReviews(record: GovRecord): ReviewType[] {
  const out: ReviewType[] = ["technical"];
  if (isSafetyCritical(record)) out.push("safety");
  if (record.countries.length > 0) out.push("country");
  if (record.contentType === "translation" || record.language !== "en") out.push("translation");
  if (["sds", "tds", "product_label", "manufacturer_instruction", "product_version"].includes(record.contentType)) {
    out.push("documentation");
  }
  return Array.from(new Set(out));
}

/* ------------------------------------------------------------------ */
/* 8/9. Separation of responsibilities and reviewer scope              */
/* ------------------------------------------------------------------ */

export type ApprovalCheck = { ok: boolean; reason: string };

export function reviewerAuthorisationValid(reviewer: Reviewer, at = new Date().toISOString()) {
  return reviewer.active && reviewer.authorisationExpiry > at.slice(0, 10);
}

export function canReview(
  reviewer: Reviewer, record: GovRecord, reviewType: ReviewType, at?: string,
): ApprovalCheck {
  if (!reviewerAuthorisationValid(reviewer, at)) {
    return { ok: false, reason: "Reviewer authorisation has expired or is inactive." };
  }
  // A system administrator cannot approve technical chemistry merely by being an admin.
  const hasRole = reviewer.roles.some((r) => REVIEW_TYPE_ROLES[reviewType].includes(r));
  if (!hasRole) {
    return { ok: false, reason: `Role not authorised for ${reviewType} review.` };
  }
  const hasScope = reviewer.scopes.some((s) => REVIEW_TYPE_SCOPES[reviewType].includes(s));
  if (!hasScope) {
    return { ok: false, reason: "Review is outside the reviewer's qualification scope." };
  }
  if (reviewType === "translation" && !reviewer.languages.includes(record.language)) {
    return { ok: false, reason: "Reviewer is not qualified in this language." };
  }
  if (reviewType === "country" && !record.countries.every((c) => reviewer.countries.includes(c))) {
    return { ok: false, reason: "Reviewer is not authorised for this country." };
  }
  return { ok: true, reason: "Reviewer is in scope." };
}

/** An author may never be the sole approver of safety-critical content. */
export function canApprove(
  reviewer: Reviewer, record: GovRecord, reviewType: ReviewType, at?: string,
): ApprovalCheck {
  const scope = canReview(reviewer, record, reviewType, at);
  if (!scope.ok) return scope;
  if (isSafetyCritical(record) && record.author && record.author === reviewer.id) {
    return { ok: false, reason: "An author cannot approve their own safety-critical content." };
  }
  return { ok: true, reason: "Approval permitted." };
}

/** Approvals never carry over automatically to a new major version. */
export function signaturesCarryForward(previous: GovVersion, newVersion: string) {
  const majorChanged = previous.version.split(".")[0] !== newVersion.split(".")[0];
  return majorChanged ? [] : previous.signatures.filter((s) => s.versionApproved === previous.version);
}

/* ------------------------------------------------------------------ */
/* 12/34. Automated validation and data integrity                      */
/* ------------------------------------------------------------------ */

export type ValidationIssue = { code: string; message: string; severity: "error" | "warning" };

export type ValidationContext = {
  documents: GovDocument[];
  reviewers: Reviewer[];
  records: GovRecord[];
  translations?: TranslationRecord[];
  now?: string;
};

export function validateRecord(record: GovRecord, ctx: ValidationContext): ValidationIssue[] {
  const now = ctx.now ?? new Date().toISOString();
  const issues: ValidationIssue[] = [];
  const err = (code: string, message: string) => issues.push({ code, message, severity: "error" });
  const warn = (code: string, message: string) => issues.push({ code, message, severity: "warning" });

  if (!record.title.trim()) err("missing_title", "Title is required.");
  if (!record.owner) err("missing_owner", "A published record must have a content owner.");
  if (!record.currentVersion) err("missing_version", "A current version is required.");
  if (!record.nextReviewAt) err("missing_review_date", "A next-review date is required.");
  if (record.countries.length === 0) err("missing_country", "Country applicability is required.");

  const safety = isSafetyCritical(record);
  if (safety && record.sourceDocumentIds.length === 0) {
    err("missing_source", "Safety-critical content requires at least one source document.");
  }
  if (safety && !record.technicalReviewer) err("missing_reviewer", "A technical reviewer is required.");
  if (safety && !record.safetyReviewer) err("missing_safety_reviewer", "A chemical-safety reviewer is required.");

  // Source document currency and conflicts.
  const docs = record.sourceDocumentIds
    .map((id) => ctx.documents.find((d) => d.documentId === id))
    .filter(Boolean) as GovDocument[];
  if (record.sourceDocumentIds.length > 0 && docs.length !== record.sourceDocumentIds.length) {
    err("broken_reference", "One or more source documents cannot be resolved.");
  }
  if (docs.length > 0 && docs.every((d) => d.status === "superseded")) {
    err("superseded_evidence", "An active instruction cannot depend only on superseded evidence.");
  }
  for (const d of docs) {
    if (!LIVE_EVIDENCE_STATUSES.includes(d.status) && d.status !== "superseded") {
      warn("evidence_not_current", `Document ${d.documentId} is ${d.status}.`);
    }
    if (!record.countries.includes(d.country)) {
      err("country_mismatch", `Document ${d.documentId} applies to ${d.country}, not this record's countries.`);
    }
    if (d.reviewDate && d.reviewDate < now.slice(0, 10)) {
      warn("document_review_expired", `Document ${d.documentId} is past its review date.`);
    }
  }

  // Reviewer authorisation.
  for (const rid of [record.technicalReviewer, record.safetyReviewer, record.countryReviewer, record.translationReviewer]) {
    if (!rid) continue;
    const rv = ctx.reviewers.find((r) => r.id === rid);
    if (!rv) { err("broken_reference", `Reviewer ${rid} not found.`); continue; }
    if (!reviewerAuthorisationValid(rv, now)) err("expired_reviewer", `Reviewer ${rv.name} authorisation has expired.`);
  }

  // Domestic confidence floor.
  if (record.contentType === "domestic_treatment" && (record.domesticConfidence ?? 0) < 9) {
    err("domestic_confidence", "Domestic treatment confidence must be at least 9/10.");
  }

  // Exactly five advance recommendations where applicable.
  if (record.recommendationCount !== undefined && record.recommendationCount !== 5) {
    err("recommendation_count", "A complete result must contain exactly five advance recommendations.");
  }

  // Suspended dependencies.
  for (const dep of upstreamRecords(record, ctx.records)) {
    if (dep.status === "suspended") err("suspended_dependency", `Depends on suspended record ${dep.stableId}.`);
  }

  // Translations must not depend on an outdated major source version.
  if (record.contentType === "translation" && ctx.translations) {
    const t = ctx.translations.find((x) => x.translationId === record.stableId);
    const src = t && ctx.records.find((r) => r.stableId === t.sourceRecordId);
    if (t && src && src.currentVersion.split(".")[0] !== t.sourceVersion.split(".")[0]) {
      err("translation_outdated", "Translation is linked to an outdated major source version.");
    }
  }

  // Checklist completion for the content type.
  const checklistKey = CHECKLIST_FOR_TYPE[record.contentType];
  if (checklistKey) {
    const items = CHECKLISTS[checklistKey];
    const missing = items.filter((i) => !record.checklistState[i]);
    if (missing.length > 0) warn("checklist_incomplete", `${missing.length} checklist item(s) outstanding.`);
  }

  if (record.provisional) warn("provisional", "Record is provisional and must remain clearly unapproved.");

  return issues;
}

export function validationErrors(issues: ValidationIssue[]) {
  return issues.filter((i) => i.severity === "error");
}

export function canSubmitForReview(record: GovRecord, ctx: ValidationContext) {
  if (record.sourceDocumentIds.length === 0 && isSafetyCritical(record)) {
    return { ok: false, reason: "Evidence is required before review." };
  }
  return { ok: true, reason: "Ready for review." };
}

export function canPublish(record: GovRecord, ctx: ValidationContext): ApprovalCheck {
  if (isDirectPublishAttempt(record.status, "published")) {
    return { ok: false, reason: "Draft content cannot be published without review." };
  }
  if (!canTransition(record.status, "published")) {
    return { ok: false, reason: `Cannot publish from status ${record.status}.` };
  }
  if (record.provisional) return { ok: false, reason: "Provisional records cannot be published." };
  const errors = validationErrors(validateRecord(record, ctx));
  if (errors.length > 0) return { ok: false, reason: errors[0].message };

  const needed = requiredReviews(record);
  const version = record.versions.find((v) => v.version === record.currentVersion);
  const signed = new Set((version?.signatures ?? [])
    .filter((s) => s.versionApproved === record.currentVersion && s.authenticated &&
      (s.decision === "approve" || s.decision === "approve_with_notes"))
    .map((s) => s.reviewType));
  const missing = needed.filter((r) => !signed.has(r));
  if (missing.length > 0) {
    return { ok: false, reason: `Missing ${missing.join(", ")} approval for version ${record.currentVersion}.` };
  }
  return { ok: true, reason: "Publication permitted." };
}

export function isLive(record: GovRecord) {
  return LIVE_STATUSES.includes(record.status);
}

export function isPreviewable(record: GovRecord, authorised: boolean) {
  return authorised && PREVIEWABLE_STATUSES.includes(record.status);
}

/** 25. Preview links are never publicly reachable. */
export function previewUrl(record: GovRecord, mode: PreviewMode, token: string) {
  return `/admin/governance/preview/${record.stableId}?mode=${mode}&token=${token}`;
}

export function canAccessPreview(authenticated: boolean, token: string, expected: string) {
  return authenticated && token.length > 0 && token === expected;
}

/* ------------------------------------------------------------------ */
/* 17. Review scheduling                                               */
/* ------------------------------------------------------------------ */

export function reviewIntervalDays(record: GovRecord) {
  return record.reviewIntervalDays ?? DEFAULT_REVIEW_INTERVAL_DAYS[record.riskLevel];
}

export function computeNextReview(record: GovRecord, from: string) {
  const d = new Date(from);
  d.setDate(d.getDate() + reviewIntervalDays(record));
  return d.toISOString();
}

export function isReviewOverdue(record: GovRecord, now = new Date().toISOString()) {
  return !!record.nextReviewAt && record.nextReviewAt < now;
}

export function isReviewDueSoon(record: GovRecord, days = 30, now = new Date().toISOString()) {
  if (!record.nextReviewAt) return false;
  const limit = new Date(now); limit.setDate(limit.getDate() + days);
  return record.nextReviewAt >= now && record.nextReviewAt <= limit.toISOString();
}

/* ------------------------------------------------------------------ */
/* 18. Review triggers                                                 */
/* ------------------------------------------------------------------ */

export type TriggerOutcome = { status: GovStatus; suspend: boolean; notify: NotificationKind[]; reason: string };

export function applyTrigger(record: GovRecord, trigger: ReviewTrigger): TriggerOutcome {
  const safetyCritical = SUSPENDING_TRIGGERS.includes(trigger) && isSafetyCritical(record);
  if (safetyCritical) {
    return {
      status: "suspended", suspend: true,
      notify: ["emergency_suspension", "safety_conflict"],
      reason: `Safety-critical trigger: ${trigger}.`,
    };
  }
  return {
    status: record.status === "published" ? "needs_review" : record.status,
    suspend: false, notify: ["review_assigned"], reason: `Review triggered: ${trigger}.`,
  };
}

/* ------------------------------------------------------------------ */
/* 14. Document supersession                                           */
/* ------------------------------------------------------------------ */

export type SupersessionResult = {
  superseded: GovDocument;
  replacement: GovDocument;
  affectedRecordIds: string[];
  suspendedRecordIds: string[];
  notes: string[];
};

export function supersedeDocument(
  oldDoc: GovDocument, newDoc: GovDocument, records: GovRecord[], safetyCriticalChange: boolean,
): SupersessionResult {
  const superseded: GovDocument = { ...oldDoc, status: "superseded", supersededBy: newDoc.documentId };
  const replacement: GovDocument = { ...newDoc, supersedes: oldDoc.documentId, status: "current" };
  const direct = records.filter((r) => r.sourceDocumentIds.includes(oldDoc.documentId));
  const affected = new Set<string>();
  for (const r of direct) {
    affected.add(r.stableId);
    for (const d of downstreamRecords(r, records)) affected.add(d.stableId);
  }
  const suspended = safetyCriticalChange
    ? direct.filter((r) => isSafetyCritical(r)).map((r) => r.stableId)
    : [];
  return {
    superseded, replacement,
    affectedRecordIds: [...affected],
    suspendedRecordIds: suspended,
    notes: [
      "Superseded document preserved for audit and historical case reproduction.",
      safetyCriticalChange
        ? "Safety-critical change: affected guidance suspended pending reviewer confirmation."
        : "Affected content marked Needs Review.",
    ],
  };
}

/* ------------------------------------------------------------------ */
/* 19/20. Dependency graph and impact analysis                         */
/* ------------------------------------------------------------------ */

export function downstreamTypes(type: ContentType): ContentType[] {
  const seen = new Set<ContentType>();
  const walk = (t: ContentType) => {
    for (const e of DEPENDENCY_EDGES) {
      if (e.from === t && !seen.has(e.to)) { seen.add(e.to); walk(e.to); }
    }
  };
  walk(type);
  return [...seen];
}

export function upstreamTypes(type: ContentType): ContentType[] {
  const seen = new Set<ContentType>();
  const walk = (t: ContentType) => {
    for (const e of DEPENDENCY_EDGES) {
      if (e.to === t && !seen.has(e.from)) { seen.add(e.from); walk(e.from); }
    }
  };
  walk(type);
  return [...seen];
}

export function downstreamRecords(record: GovRecord, all: GovRecord[]) {
  const types = downstreamTypes(record.contentType);
  return all.filter((r) => r.stableId !== record.stableId && types.includes(r.contentType));
}

export function upstreamRecords(record: GovRecord, all: GovRecord[]) {
  const types = upstreamTypes(record.contentType);
  return all.filter((r) => r.stableId !== record.stableId && types.includes(r.contentType));
}

export type ImpactAnalysis = {
  records: string[];
  countries: string[];
  languages: string[];
  products: string[];
  stains: string[];
  activeCases: string[];
  historicalCasesUnaffected: string[];
  publicPages: string[];
  trainingModules: string[];
  rankings: string[];
  domesticMethods: string[];
  safetyRuleInteractions: string[];
  requiredReviewers: ReviewType[];
  recommendedRelease: "major" | "minor";
  blocking: boolean;
  blockingReason?: string;
};

export function analyseImpact(
  record: GovRecord, all: GovRecord[], snapshots: CaseSnapshot[], changeKinds: ChangeKind[],
): ImpactAnalysis {
  const down = downstreamRecords(record, all);
  const ids = [record.stableId, ...down.map((r) => r.stableId)];
  const byType = (t: ContentType) => down.filter((r) => r.contentType === t).map((r) => r.stableId);
  const activeCases = snapshots
    .filter((s) => s.recordId === record.stableId && s.version === record.currentVersion)
    .map((s) => s.caseId);
  const historical = snapshots
    .filter((s) => s.recordId === record.stableId && s.version !== record.currentVersion)
    .map((s) => s.caseId);
  const release = classifyChange(changeKinds);
  const blocking = release === "major" && isSafetyCritical(record);
  return {
    records: ids,
    countries: Array.from(new Set([...record.countries, ...down.flatMap((r) => r.countries)])),
    languages: Array.from(new Set([record.language, ...down.map((r) => r.language)])),
    products: [...byType("product"), ...byType("product_version"), ...byType("product_mapping")],
    stains: byType("stain_record"),
    activeCases,
    historicalCasesUnaffected: historical,
    publicPages: byType("public_content"),
    trainingModules: byType("training_content"),
    rankings: [...byType("product_ranking"), ...byType("kit_comparison")],
    domesticMethods: byType("domestic_treatment"),
    safetyRuleInteractions: upstreamRecords(record, all)
      .filter((r) => r.contentType === "safety_rule").map((r) => r.stableId),
    requiredReviewers: requiredReviews(record),
    recommendedRelease: release,
    blocking,
    blockingReason: blocking
      ? "Safety-critical major change requires impact review before activation."
      : undefined,
  };
}

/* ------------------------------------------------------------------ */
/* 22. Emergency suspension                                            */
/* ------------------------------------------------------------------ */

export function canSuspend(reviewer: Reviewer) {
  return reviewer.active && reviewer.roles.some((r) =>
    r === "chemical_safety_reviewer" || r === "final_approver" || r === "system_administrator");
}

export type SuspensionResult = {
  status: GovStatus;
  fallbackText: string;
  investigationTaskRequired: true;
  notifyOwners: string[];
  affectedActiveCases: string[];
  preserved: true;
};

export function suspendRecord(record: GovRecord, snapshots: CaseSnapshot[]): SuspensionResult {
  return {
    status: "suspended",
    fallbackText: "This guidance is temporarily unavailable pending technical review.",
    investigationTaskRequired: true,
    notifyOwners: [record.owner, record.technicalReviewer, record.safetyReviewer].filter(Boolean) as string[],
    affectedActiveCases: snapshots.filter((s) => s.recordId === record.stableId).map((s) => s.caseId),
    preserved: true,
  };
}

/** Suspended content must never appear in live guidance. */
export function liveGuidanceFor(records: GovRecord[]) {
  return records.filter((r) => isLive(r));
}

/* ------------------------------------------------------------------ */
/* 23. Rollback                                                        */
/* ------------------------------------------------------------------ */

export type RollbackResult = { ok: boolean; message: string; targetVersion?: string; withdrawnVersion?: string };

export function canRollback(record: GovRecord, targetVersion: string): RollbackResult {
  const target = record.versions.find((v) => v.version === targetVersion);
  if (!target) return { ok: false, message: "Target version not found." };
  if (!target.approvedAt) return { ok: false, message: "Only a previously approved version may be restored." };
  if (targetVersion === record.currentVersion) return { ok: false, message: "Target version is already current." };
  if (["sds", "tds", "product_label", "manufacturer_instruction", "product_version"].includes(record.contentType)) {
    return {
      ok: false,
      message: "Product formulations and documents cannot be rolled back; supersede with a current document instead.",
    };
  }
  return { ok: true, message: "Rollback permitted.", targetVersion, withdrawnVersion: record.currentVersion };
}

/* ------------------------------------------------------------------ */
/* 24. Release management                                              */
/* ------------------------------------------------------------------ */

export function validateRelease(release: Release, records: GovRecord[], ctx: ValidationContext) {
  const issues: string[] = [];
  for (const id of release.recordIds) {
    const r = records.find((x) => x.stableId === id);
    if (!r) { issues.push(`${id}: record not found.`); continue; }
    const check = canPublish(r, ctx);
    if (!check.ok) issues.push(`${id}: ${check.reason}`);
  }
  if (release.recordIds.length === 0) issues.push("Release contains no records.");
  return { passed: issues.length === 0, issues };
}

/* ------------------------------------------------------------------ */
/* 21. Change requests                                                 */
/* ------------------------------------------------------------------ */

export function changeRequestPriority(cat: ChangeRequestCategory): "low" | "normal" | "high" | "critical" {
  if (cat === "unsafe_advice" || cat === "garment_damage") return "critical";
  if (HIGH_PRIORITY_CATEGORIES.includes(cat)) return "high";
  if (cat === "accessibility_issue" || cat === "search_issue") return "normal";
  return "normal";
}

/* ------------------------------------------------------------------ */
/* 26. Translation governance                                          */
/* ------------------------------------------------------------------ */

export function translationAfterSourceChange(
  t: TranslationRecord, newSourceVersion: string, safetyCritical: boolean,
): TranslationRecord {
  const majorChange = t.sourceVersion.split(".")[0] !== newSourceVersion.split(".")[0];
  return {
    ...t,
    previousVersions: [{ version: t.sourceVersion, status: t.status, at: new Date().toISOString() }, ...t.previousVersions],
    status: safetyCritical && majorChange ? "suspended" : "outdated",
  };
}

/* ------------------------------------------------------------------ */
/* 27. Country governance                                              */
/* ------------------------------------------------------------------ */

export function countryApplicabilityOk(record: GovRecord, docs: GovDocument[]) {
  const linked = docs.filter((d) => record.sourceDocumentIds.includes(d.documentId));
  if (linked.length === 0) return { ok: false, reason: "No documents linked for country confirmation." };
  const mismatched = linked.filter((d) => !record.countries.includes(d.country));
  if (mismatched.length > 0) {
    return {
      ok: false,
      reason: `Foreign documentation (${mismatched.map((d) => d.country).join(", ")}) cannot support country-specific instructions without approved applicability.`,
    };
  }
  if (!record.countryReviewer) return { ok: false, reason: "A country reviewer is required." };
  return { ok: true, reason: "Country applicability confirmed." };
}

/* ------------------------------------------------------------------ */
/* 31. Notifications                                                   */
/* ------------------------------------------------------------------ */

export function canDisableNotification(kind: NotificationKind) {
  return !UNDISABLEABLE_NOTIFICATIONS.includes(kind);
}

/* ------------------------------------------------------------------ */
/* 33. Archival                                                        */
/* ------------------------------------------------------------------ */

export function canDelete(record: GovRecord) {
  if (ARCHIVE_ONLY_TYPES.includes(record.contentType)) {
    return { ok: false, reason: "This content type is archived, never deleted." };
  }
  if (record.versions.some((v) => v.publishedAt)) {
    return { ok: false, reason: "Previously published records are archived, never deleted." };
  }
  return { ok: true, reason: "Draft record may be removed." };
}

export function canDeleteAudit(role: GovRole) {
  return false || role === ("__never__" as GovRole);
}

/* ------------------------------------------------------------------ */
/* 34. Integrity checks                                                */
/* ------------------------------------------------------------------ */

export function integrityCheck(records: GovRecord[], snapshots: CaseSnapshot[], docs: GovDocument[]) {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const r of records) {
    if (ids.has(r.stableId)) problems.push(`Duplicate stable ID ${r.stableId}.`);
    ids.add(r.stableId);
    if (r.versions.length === 0) problems.push(`${r.stableId}: no versions (orphaned record).`);
    if (!r.versions.some((v) => v.version === r.currentVersion)) {
      problems.push(`${r.stableId}: current version ${r.currentVersion} has no immutable record (orphaned version).`);
    }
    if (r.status === "published" && !r.owner) problems.push(`${r.stableId}: published without an owner.`);
    if (r.status === "published" && isSafetyCritical(r) && !r.approvedAt) {
      problems.push(`${r.stableId}: published safety-critical record without approval.`);
    }
    if (r.status === "published" && r.sourceDocumentIds.length > 0) {
      const linked = docs.filter((d) => r.sourceDocumentIds.includes(d.documentId));
      if (linked.length > 0 && linked.every((d) => d.status === "superseded")) {
        problems.push(`${r.stableId}: active instruction linked only to superseded evidence.`);
      }
    }
    if (r.contentType === "domestic_treatment" && r.status === "published" && (r.domesticConfidence ?? 0) < 9) {
      problems.push(`${r.stableId}: domestic treatment below 9/10 confidence.`);
    }
    if (r.recommendationCount !== undefined && r.recommendationCount !== 5) {
      problems.push(`${r.stableId}: result does not contain exactly five recommendations.`);
    }
  }
  for (const s of snapshots) {
    const rec = records.find((r) => r.stableId === s.recordId);
    if (!rec) { problems.push(`Case ${s.caseId}: references unknown record ${s.recordId}.`); continue; }
    const v = rec.versions.find((x) => x.version === s.version);
    if (!v) problems.push(`Case ${s.caseId}: pinned version ${s.version} missing.`);
    else if (!v.immutable) problems.push(`Case ${s.caseId}: linked to a mutable live version.`);
  }
  return { ok: problems.length === 0, problems };
}

/* ------------------------------------------------------------------ */
/* 35. Initial governance audit                                        */
/* ------------------------------------------------------------------ */

export function governanceAudit(
  records: GovRecord[], docs: GovDocument[], translations: TranslationRecord[] = [],
): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const push = (kind: AuditFinding["kind"], recordId: string, detail: string, severity: AuditFinding["severity"] = "medium") =>
    findings.push({ kind, recordId, detail, severity });

  const seen = new Map<string, number>();
  for (const r of records) {
    seen.set(r.stableId, (seen.get(r.stableId) ?? 0) + 1);
    if (!r.owner) push("missing_owner", r.stableId, "No content owner assigned.", "high");
    if (isSafetyCritical(r) && !r.technicalReviewer) push("missing_reviewer", r.stableId, "No technical reviewer.", "high");
    if (r.sourceDocumentIds.length === 0) push("missing_source", r.stableId, "No source documents linked.", isSafetyCritical(r) ? "high" : "low");
    if (r.countries.length === 0) push("missing_country", r.stableId, "No country applicability.", "medium");
    if (!r.currentVersion) push("missing_version", r.stableId, "No version recorded.", "high");
    if (!r.nextReviewAt) push("missing_review_date", r.stableId, "No next-review date.", "medium");
    if (r.provisional) push("provisional_data", r.stableId, "Provisional data awaiting verification.", "medium");
    if (r.contentType === "domestic_treatment" && (r.domesticConfidence ?? 0) < 9) {
      push("unverified_domestic", r.stableId, "Domestic content below the 9/10 confidence floor.", "high");
    }
    if (r.status === "published" && !r.approvedAt) {
      push("published_without_approval", r.stableId, "Published with no approval record.", "high");
    }
    const linked = docs.filter((d) => r.sourceDocumentIds.includes(d.documentId));
    if (linked.length > 0 && linked.every((d) => d.documentType === "spotting_chart")) {
      push("spotting_chart_only", r.stableId, "Instruction supported only by a spotting chart.", "medium");
    }
    if (r.contentType === "company" && r.provisional) {
      push("unverified_company_relationship", r.stableId, "Company relationship claim unverified.", "medium");
    }
  }
  for (const [id, count] of seen) {
    if (count > 1) push("duplicate_record", id, `Stable ID appears ${count} times.`, "high");
  }
  for (const t of translations) {
    if (t.status === "outdated" || t.status === "not_started") {
      push("untranslated_safety_warning", t.translationId, `Translation ${t.language} is ${t.status}.`, "medium");
    }
  }
  return findings;
}

export function remediationTasksFrom(findings: AuditFinding[], startIndex = 1): RemediationTask[] {
  const roleFor: Record<string, GovRole> = {
    missing_owner: "content_owner", missing_reviewer: "textile_technical_reviewer",
    missing_source: "product_documentation_reviewer", missing_country: "country_reviewer",
    missing_version: "content_author", missing_review_date: "content_owner",
    provisional_data: "product_documentation_reviewer", spotting_chart_only: "textile_technical_reviewer",
    unverified_domestic: "stain_chemistry_reviewer", unverified_company_relationship: "content_owner",
    conflicting_instruction: "textile_technical_reviewer", untranslated_safety_warning: "translation_reviewer",
    published_without_approval: "final_approver", duplicate_record: "system_administrator",
  };
  return findings.map((f, i) => ({
    taskId: formatTaskId(startIndex + i),
    finding: f.kind,
    recordId: f.recordId,
    detail: f.detail,
    assignedRole: roleFor[f.kind] ?? "content_owner",
    status: "open" as const,
    createdAt: new Date().toISOString(),
  }));
}

/* ------------------------------------------------------------------ */
/* Helpers used by UI                                                  */
/* ------------------------------------------------------------------ */

export function riskBadgeVariant(risk: RiskLevel) {
  return risk === "black" || risk === "red" ? "destructive" : risk === "amber" ? "secondary" : "outline";
}

export function makeRecord(partial: Partial<GovRecord> & {
  stableId: string; contentType: ContentType; title: string;
}): GovRecord {
  const now = new Date().toISOString();
  return {
    uuid: partial.uuid ?? `uuid-${partial.stableId}`,
    currentVersion: "1.0",
    status: "draft",
    sourceDocumentIds: [],
    countries: ["IN"],
    language: "en",
    riskLevel: "amber",
    provisional: false,
    createdAt: now,
    lastModifiedAt: now,
    scheduleKind: "risk_based",
    versions: [],
    pendingChangeKinds: [],
    checklistState: {},
    ...partial,
  } as GovRecord;
}

export function makeVersion(partial: Partial<GovVersion> & { version: string }): GovVersion {
  const now = new Date().toISOString();
  return {
    createdAt: now,
    status: "draft",
    reasonForChange: "",
    revisionSummary: "",
    changeKinds: [],
    signatures: [],
    sourceDocumentIds: [],
    payload: {},
    immutable: false,
    ...partial,
  };
}
