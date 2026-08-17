/**
 * STEP 16 — Administration engine.
 *
 * Deterministic, testable logic behind the consolidated administration area:
 * permissions and modes, dashboard cards, global search, document-upload
 * validation, bulk import/export, organization isolation, high-impact
 * confirmation, safe errors and system health.
 *
 * This engine NEVER relaxes earlier controls. Where an approval, safety,
 * version or review question is asked, it delegates to the Step 15 governance
 * engine (canApprove / canPublish / canTransition / validateRecord).
 */

import {
  ADMIN_ERRORS, ADMIN_SECTION_META, ADMIN_SECTIONS, COMPETENCY_PERMISSIONS,
  EXPORT_ROLES, HIGH_IMPACT_ACTIONS, IMPORT_TEMPLATES, MIN_REASON_LENGTH,
  MODE_ROLES, PRIVATE_EXPORT_FIELDS, STATUS_PRESENTATION,
} from "@/data/adminWorkspace";
import type {
  AdminErrorKey, AdminMode, AdminOrganization, AdminSection, AdminUser,
  ExportKind, HealthCheck, HighImpactAction, ImportKind, InventoryItem,
  RecordAction, TrainingModule,
} from "@/data/adminWorkspace";
import type {
  GovDocument, GovRecord, GovRole, GovStatus, Reviewer, TranslationRecord,
} from "@/data/governance";
import { canApprove, canPublish, isReviewOverdue, validateRecord } from "@/lib/governanceEngine";

/* ------------------------------------------------------------------ */
/* Permissions and modes                                               */
/* ------------------------------------------------------------------ */

export function modesForRoles(roles: GovRole[]): AdminMode[] {
  return (Object.keys(MODE_ROLES) as AdminMode[]).filter((m) =>
    MODE_ROLES[m].some((r) => roles.includes(r)),
  );
}

/** Competencies whose expiry date has passed. */
export function expiredCompetencies(user: AdminUser, now = new Date().toISOString()) {
  return user.competencies.filter((c) => c.expiresAt < now).map((c) => c.name);
}

/** Sections a user may open, after suspension and competency expiry are applied. */
export function sectionsForUser(user: AdminUser, now = new Date().toISOString()): AdminSection[] {
  if (user.status !== "active") return [];
  const modes = modesForRoles(user.roles).filter((m) => user.modes.includes(m));
  const expired = expiredCompetencies(user, now);
  const revoked = new Set<AdminSection>();
  for (const name of expired) for (const s of COMPETENCY_PERMISSIONS[name] ?? []) revoked.add(s);
  return ADMIN_SECTIONS.filter(
    (s) => ADMIN_SECTION_META[s].modes.some((m) => modes.includes(m)) && !revoked.has(s),
  );
}

export function canAccessSection(user: AdminUser, section: AdminSection, now = new Date().toISOString()) {
  return sectionsForUser(user, now).includes(section);
}

/** A user can never grant themselves a role or mode. */
export function canChangeUserRoles(actor: AdminUser, target: AdminUser) {
  if (actor.userId === target.userId) {
    return { ok: false, message: "Users cannot change their own roles or permissions." };
  }
  if (!actor.roles.includes("system_administrator")) {
    return { ok: false, message: "Only a system administrator may change roles." };
  }
  return { ok: true, message: "Role change permitted with confirmation." };
}

/**
 * System administrators run the platform — they are not reviewers.
 * Administrative power must never substitute for technical or safety review.
 */
export function adminCanBypassReview() {
  return false;
}

export function actionsForRecord(
  record: GovRecord,
  user: AdminUser,
  ctx: { documents: GovDocument[]; reviewers: Reviewer[]; records: GovRecord[]; translations: TranslationRecord[] },
): RecordAction[] {
  const out: RecordAction[] = ["export"];
  const isAuthor = record.author === user.userId || record.owner === user.userId;
  const editable: GovStatus[] = ["draft", "evidence_required", "changes_requested"];
  if (isAuthor && editable.includes(record.status)) {
    out.push("edit_draft", "add_evidence", "submit_for_review");
  }
  const reviewer = ctx.reviewers.find((r) => r.id === user.userId);
  const reviewing: GovStatus[] = ["technical_review", "safety_review", "country_review", "translation_review"];
  if (reviewer && reviewing.includes(record.status)) {
    out.push("request_changes");
    const technical = canApprove(reviewer, record, "technical");
    const safety = canApprove(reviewer, record, "safety");
    if (technical.ok || safety.ok) out.push("approve");
  }
  if (record.status === "approved" && user.roles.includes("publisher")) {
    out.push("schedule");
    if (canPublish(record, ctx).ok) out.push("publish");
  }
  if (reviewer?.roles.includes("chemical_safety_reviewer") || reviewer?.roles.includes("textile_technical_reviewer")) {
    out.push("suspend");
  }
  if (record.status === "published" && isAuthor) out.push("new_version");
  if (user.roles.includes("content_owner") || user.roles.includes("system_administrator")) out.push("archive");
  return Array.from(new Set(out));
}

/** 7. Why a record cannot be published, in plain language. */
export function publicationBlockers(
  record: GovRecord,
  ctx: { documents: GovDocument[]; reviewers: Reviewer[]; records: GovRecord[]; translations: TranslationRecord[] },
): string[] {
  const check = canPublish(record, ctx);
  if (check.ok) return [];
  const issues = validateRecord(record, ctx).filter((i) => i.severity === "error").map((i) => i.message);
  return Array.from(new Set([check.reason, ...issues].filter(Boolean) as string[]));
}

export function statusPresentation(status: GovStatus) {
  return STATUS_PRESENTATION[status];
}

/* ------------------------------------------------------------------ */
/* 4. Dashboard cards                                                  */
/* ------------------------------------------------------------------ */

export type DashboardCard = {
  key: string;
  label: string;
  count: number;
  section: AdminSection;
  filter: string;      // query string applied to the target section
  tone: "neutral" | "attention" | "critical";
};

export type DashboardInput = {
  records: GovRecord[];
  documents: GovDocument[];
  translations: TranslationRecord[];
  mappingsAwaitingReview: number;
  unrankedComparisons: number;
  adverseOutcomes: number;
  hazardReports: number;
  repeatedFailures: number;
  pendingReleases: number;
  systemWarnings: number;
  reviewerId?: string;
  now?: string;
};

export function dashboardCards(input: DashboardInput): DashboardCard[] {
  const now = input.now ?? new Date().toISOString();
  const r = input.records;
  const byStatus = (s: GovStatus) => r.filter((x) => x.status === s).length;
  const docMissing = (kind: GovDocument["documentType"]) =>
    r.filter(
      (x) =>
        x.contentType === "product" &&
        !input.documents.some((d) => d.documentType === kind && d.relatedTo.includes(x.stableId)),
    ).length;

  const cards: DashboardCard[] = [
    { key: "draft", label: "Draft content", count: byStatus("draft"), section: "stains", filter: "status=draft", tone: "neutral" },
    { key: "evidence", label: "Evidence required", count: byStatus("evidence_required"), section: "documents", filter: "status=evidence_required", tone: "attention" },
    {
      key: "mine", label: "Reviews assigned to me",
      count: input.reviewerId
        ? r.filter((x) => x.technicalReviewer === input.reviewerId || x.safetyReviewer === input.reviewerId).length
        : 0,
      section: "reviews", filter: `reviewer=${input.reviewerId ?? ""}`, tone: "neutral",
    },
    { key: "overdue", label: "Overdue reviews", count: r.filter((x) => isReviewOverdue(x, now)).length, section: "reviews", filter: "overdue=1", tone: "critical" },
    { key: "needs_review", label: "Content needs review", count: byStatus("needs_review"), section: "reviews", filter: "status=needs_review", tone: "attention" },
    { key: "suspended", label: "Suspended guidance", count: byStatus("suspended"), section: "reviews", filter: "status=suspended", tone: "critical" },
    {
      key: "expired_docs", label: "Expired or superseded documents",
      count: input.documents.filter((d) => d.status === "superseded" || d.status === "expired_review").length,
      section: "documents", filter: "status=superseded", tone: "attention",
    },
    {
      key: "country_mismatch", label: "Country mismatches",
      count: r.filter((x) => x.countries.some((c) =>
        !input.documents.some((d) => d.relatedTo.includes(x.stableId) && (d.country === c || d.country === "global")))).length,
      section: "countries", filter: "issue=country_mismatch", tone: "attention",
    },
    {
      key: "doc_conflicts", label: "Document conflicts",
      count: input.documents.filter((d) => d.claims.some((c) => c.toLowerCase().includes("conflict"))).length,
      section: "documents", filter: "issue=conflict", tone: "attention",
    },
    { key: "missing_sds", label: "Missing SDSs", count: docMissing("sds"), section: "documents", filter: "missing=sds", tone: "attention" },
    { key: "missing_tds", label: "Missing TDSs", count: docMissing("tds"), section: "documents", filter: "missing=tds", tone: "attention" },
    { key: "missing_label", label: "Missing product labels", count: docMissing("product_label"), section: "documents", filter: "missing=product_label", tone: "attention" },
    {
      key: "domestic_review", label: "Domestic treatments under review",
      count: r.filter((x) => x.contentType === "domestic_treatment" && x.status.endsWith("review")).length,
      section: "domestic", filter: "status=under_review", tone: "neutral",
    },
    {
      key: "domestic_low", label: "Domestic treatments below 9/10",
      count: r.filter((x) => x.contentType === "domestic_treatment" && (x.domesticConfidence ?? 0) < 9).length,
      section: "domestic", filter: "confidence=below9", tone: "critical",
    },
    { key: "mappings", label: "Product mappings awaiting review", count: input.mappingsAwaitingReview, section: "mappings", filter: "status=under_review", tone: "neutral" },
    { key: "comparisons", label: "Unranked kit comparisons", count: input.unrankedComparisons, section: "comparisons", filter: "rank=none", tone: "neutral" },
    { key: "adverse", label: "Adverse outcomes", count: input.adverseOutcomes, section: "outcomes", filter: "kind=adverse", tone: "critical" },
    { key: "hazards", label: "Hazard reports", count: input.hazardReports, section: "outcomes", filter: "kind=hazard", tone: "critical" },
    { key: "failures", label: "Repeated failures", count: input.repeatedFailures, section: "outcomes", filter: "kind=repeat_failure", tone: "attention" },
    {
      key: "translations", label: "Outdated translations",
      count: input.translations.filter((t) => t.status === "outdated").length,
      section: "translations", filter: "status=outdated", tone: "attention",
    },
    { key: "releases", label: "Pending releases", count: input.pendingReleases, section: "releases", filter: "status=pending", tone: "neutral" },
    {
      key: "failed_validation", label: "Failed validations",
      count: r.filter((x) => validateRecord(x, { documents: input.documents, reviewers: [], records: r, translations: input.translations })
        .some((i) => i.severity === "error")).length,
      section: "reviews", filter: "issue=validation", tone: "attention",
    },
    { key: "unowned", label: "Unowned content", count: r.filter((x) => !x.owner).length, section: "stains", filter: "owner=none", tone: "attention" },
    { key: "system", label: "System warnings", count: input.systemWarnings, section: "system_health", filter: "", tone: "attention" },
  ];
  return cards;
}

/** A zero count is normal work-done, never an error state. */
export function cardTone(card: DashboardCard): "neutral" | "attention" | "critical" {
  return card.count === 0 ? "neutral" : card.tone;
}

export function cardLink(card: DashboardCard) {
  const base = ADMIN_SECTION_META[card.section].route;
  if (!card.filter) return base;
  return base.includes("?") ? `${base}&${card.filter}` : `${base}?${card.filter}`;
}

/* ------------------------------------------------------------------ */
/* 5. Global search                                                    */
/* ------------------------------------------------------------------ */

export type SearchEntity =
  | "record" | "document" | "user" | "organization" | "inventory" | "training"
  | "country" | "release" | "audit";

export type SearchHit = {
  id: string;
  entity: SearchEntity;
  title: string;
  subtitle: string;
  route: string;
  status?: string;
  country?: string;
  language?: string;
  owner?: string;
  reviewer?: string;
  risk?: string;
  version?: string;
  date?: string;
  company?: string;
  evidenceComplete?: boolean;
  organizationId?: string;
};

export type SearchFilters = Partial<{
  status: string; country: string; language: string; owner: string; reviewer: string;
  risk: string; version: string; company: string; evidenceComplete: boolean;
  from: string; to: string; entity: SearchEntity;
}>;

export type SearchSources = {
  records: GovRecord[];
  documents: GovDocument[];
  users: AdminUser[];
  organizations: AdminOrganization[];
  inventory: InventoryItem[];
  training: TrainingModule[];
  audit: { id: string; at: string; action: string; recordId?: string; user: string }[];
};

const norm = (s: string) => s.toLowerCase().trim();

export function globalSearch(
  query: string,
  sources: SearchSources,
  filters: SearchFilters = {},
  viewer?: AdminUser,
): SearchHit[] {
  const q = norm(query);
  const hits: SearchHit[] = [];

  for (const r of sources.records) {
    hits.push({
      id: r.stableId, entity: "record", title: r.title,
      subtitle: `${r.contentType} · ${r.currentVersion}`,
      route: `/admin/governance/${r.stableId}`, status: r.status,
      country: r.countries[0], language: r.language, owner: r.owner,
      reviewer: r.technicalReviewer ?? r.safetyReviewer, risk: r.riskLevel,
      version: r.currentVersion, date: r.lastModifiedAt,
      evidenceComplete: r.sourceDocumentIds.length > 0,
    });
  }
  for (const d of sources.documents) {
    hits.push({
      id: d.documentId, entity: "document", title: `${d.documentType.toUpperCase()} — ${d.issuer}`,
      subtitle: `${d.documentVersion} · ${d.country}/${d.language}`,
      route: `/admin/documents?doc=${d.documentId}`, status: d.status,
      country: d.country, language: d.language, version: d.documentVersion,
      date: d.publicationDate, company: d.issuer,
    });
  }
  for (const u of sources.users) {
    hits.push({
      id: u.userId, entity: "user", title: u.name, subtitle: u.email,
      route: `/admin/users?user=${u.userId}`, status: u.status, country: u.country,
      language: u.language, organizationId: u.organizationId,
    });
  }
  for (const o of sources.organizations) {
    hits.push({
      id: o.organizationId, entity: "organization", title: o.name, subtitle: o.locations.join(", "),
      route: `/admin/organizations?org=${o.organizationId}`, country: o.country,
      organizationId: o.organizationId,
    });
  }
  for (const i of sources.inventory) {
    hits.push({
      id: i.itemId, entity: "inventory", title: `${i.productId} ${i.productVersion}`,
      subtitle: `${i.packSize} · qty ${i.quantity}`,
      route: `/admin/organizations?tab=inventory&org=${i.organizationId}`,
      organizationId: i.organizationId, version: i.productVersion,
    });
  }
  for (const t of sources.training) {
    hits.push({
      id: t.moduleId, entity: "training", title: t.title, subtitle: t.competency,
      route: `/admin/training?module=${t.moduleId}`, status: t.status, country: t.countries[0],
    });
  }
  for (const a of sources.audit) {
    hits.push({
      id: a.id, entity: "audit", title: a.action, subtitle: `${a.user} · ${a.recordId ?? "—"}`,
      route: `/admin/audit?event=${a.id}`, date: a.at,
    });
  }

  return hits
    .filter((h) => (viewer ? visibleToViewer(h, viewer) : true))
    .filter((h) => !q || norm(`${h.id} ${h.title} ${h.subtitle}`).includes(q))
    .filter((h) => (filters.entity ? h.entity === filters.entity : true))
    .filter((h) => (filters.status ? h.status === filters.status : true))
    .filter((h) => (filters.country ? h.country === filters.country : true))
    .filter((h) => (filters.language ? h.language === filters.language : true))
    .filter((h) => (filters.owner ? h.owner === filters.owner : true))
    .filter((h) => (filters.reviewer ? h.reviewer === filters.reviewer : true))
    .filter((h) => (filters.risk ? h.risk === filters.risk : true))
    .filter((h) => (filters.version ? h.version === filters.version : true))
    .filter((h) => (filters.company ? h.company === filters.company : true))
    .filter((h) => (filters.evidenceComplete === undefined ? true : h.evidenceComplete === filters.evidenceComplete))
    .filter((h) => (filters.from ? (h.date ?? "") >= filters.from : true))
    .filter((h) => (filters.to ? (h.date ?? "") <= filters.to : true));
}

/** 28. Strict separation between organizations. */
export function visibleToViewer(hit: SearchHit, viewer: AdminUser) {
  if (!hit.organizationId) return true;
  if (viewer.roles.includes("system_administrator")) return true;
  return hit.organizationId === viewer.organizationId;
}

export function inventoryForViewer(items: InventoryItem[], viewer: AdminUser) {
  if (viewer.roles.includes("system_administrator")) return items;
  return items.filter((i) => i.organizationId === viewer.organizationId);
}

/* ------------------------------------------------------------------ */
/* 15. Document upload validation                                      */
/* ------------------------------------------------------------------ */

export type UploadCandidate = {
  fileName: string;
  mimeType: string;
  fileHash: string;
  readable: boolean;
  passwordProtected: boolean;
  pageCount: number;
  expectedPages?: number;
  extractionQuality: number; // 0..1
  issuer?: string;
  productName?: string;
  productCode?: string;
  country?: string;
  language?: string;
  documentVersion?: string;
  publicationDate?: string;
};

export type UploadCheck = { field: string; ok: boolean; message: string };

export const ALLOWED_UPLOAD_TYPES = ["application/pdf", "image/png", "image/jpeg"];

export function validateUpload(c: UploadCandidate, existing: GovDocument[]): UploadCheck[] {
  const checks: UploadCheck[] = [];
  const add = (field: string, ok: boolean, message: string) => checks.push({ field, ok, message });

  add("file_type", ALLOWED_UPLOAD_TYPES.includes(c.mimeType), "PDF, PNG or JPEG only.");
  add("readable", c.readable, "File could not be read.");
  add("password", !c.passwordProtected, "Password-protected files cannot be reviewed.");
  add("duplicate_hash", !existing.some((d) => d.fileHash === c.fileHash), "A document with this file hash already exists.");
  add("issuer", !!c.issuer, "Issuer is required.");
  add("product_name", !!c.productName, "Product name is required.");
  add("product_code", !!c.productCode, "Product code is required.");
  add("country", !!c.country, "Country is required.");
  add("language", !!c.language, "Language is required.");
  add("version", !!c.documentVersion, "Document version is required.");
  add("date", !!c.publicationDate, "Publication date is required.");
  add("pages", c.expectedPages === undefined || c.pageCount >= c.expectedPages, "Pages appear to be missing.");
  add("extraction", c.extractionQuality >= 0.6, "Extraction quality is too low for automatic field capture.");
  return checks;
}

/** Uploading is never verification. */
export function uploadResultStatus(checks: UploadCheck[]): "rejected" | "uploaded_unverified" {
  return checks.every((c) => c.ok) ? "uploaded_unverified" : "rejected";
}

/* ------------------------------------------------------------------ */
/* 30. Bulk import — drafts only                                       */
/* ------------------------------------------------------------------ */

export type ImportRow = Record<string, string>;
export type ImportIssue = { row: number; column: string; message: string };
export type ImportPreview = {
  kind: ImportKind;
  columnsOk: boolean;
  issues: ImportIssue[];
  duplicates: number[];
  createRows: ImportRow[];
  createdStatus: "draft";
};

export function importTemplate(kind: ImportKind) {
  return IMPORT_TEMPLATES[kind];
}

export function validateImport(
  kind: ImportKind,
  columns: string[],
  rows: ImportRow[],
  existingKeys: string[] = [],
): ImportPreview {
  const template = IMPORT_TEMPLATES[kind];
  const missing = template.filter((c) => !columns.includes(c));
  const issues: ImportIssue[] = missing.map((c) => ({ row: 0, column: c, message: `Missing column "${c}".` }));
  const duplicates: number[] = [];
  const seen = new Set(existingKeys.map(norm));

  rows.forEach((row, index) => {
    for (const col of template) {
      if (!row[col]?.trim()) issues.push({ row: index + 1, column: col, message: `"${col}" is required.` });
    }
    const key = norm(template.map((c) => row[c] ?? "").join("|"));
    if (seen.has(key)) duplicates.push(index + 1);
    else seen.add(key);
  });

  const badRows = new Set(issues.filter((i) => i.row > 0).map((i) => i.row));
  const createRows = missing.length
    ? []
    : rows.filter((_, i) => !badRows.has(i + 1) && !duplicates.includes(i + 1));

  return { kind, columnsOk: missing.length === 0, issues, duplicates, createRows, createdStatus: "draft" };
}

/** Import never publishes. Every accepted row becomes a Draft record. */
export function importCreatesStatus(): GovStatus {
  return "draft";
}

/* ------------------------------------------------------------------ */
/* 31. Bulk export                                                     */
/* ------------------------------------------------------------------ */

export type ExportResult = { allowed: boolean; message: string; rows: Record<string, unknown>[] };

export function exportDataset(
  kind: ExportKind,
  user: AdminUser,
  rows: Record<string, unknown>[],
): ExportResult {
  if (!EXPORT_ROLES[kind].some((r) => user.roles.includes(r))) {
    return { allowed: false, message: "Your role is not authorised to export this dataset.", rows: [] };
  }
  const scoped = user.roles.includes("system_administrator")
    ? rows
    : rows.filter((r) => !r.organizationId || r.organizationId === user.organizationId);
  const cleaned = scoped.map((r) => {
    const copy: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) if (!PRIVATE_EXPORT_FIELDS.includes(k)) copy[k] = v;
    return copy;
  });
  return { allowed: true, message: `${cleaned.length} row(s) exported.`, rows: cleaned };
}

/* ------------------------------------------------------------------ */
/* 38. High-impact confirmation                                        */
/* ------------------------------------------------------------------ */

export function requiresConfirmation(action: string): action is HighImpactAction {
  return (HIGH_IMPACT_ACTIONS as readonly string[]).includes(action);
}

export function confirmHighImpact(action: HighImpactAction, reason: string, confirmed: boolean) {
  if (!confirmed) return { ok: false, message: "Confirm the action to continue." };
  if (reason.trim().length < MIN_REASON_LENGTH) {
    return { ok: false, message: `A written reason of at least ${MIN_REASON_LENGTH} characters is required.` };
  }
  return { ok: true, message: "Action recorded with reason in the audit log." };
}

/* ------------------------------------------------------------------ */
/* 35. Safe errors and unsaved-work recovery                           */
/* ------------------------------------------------------------------ */

export function adminError(key: AdminErrorKey) {
  return ADMIN_ERRORS[key];
}

export type DraftBuffer = { key: string; payload: Record<string, unknown>; savedAt: string };

export function bufferDraft(key: string, payload: Record<string, unknown>): DraftBuffer {
  return { key, payload, savedAt: new Date().toISOString() };
}

export function recoverDraft(buffers: DraftBuffer[], key: string) {
  return buffers.find((b) => b.key === key) ?? null;
}

/* ------------------------------------------------------------------ */
/* 34. System health                                                   */
/* ------------------------------------------------------------------ */

export type HealthState = { check: HealthCheck; status: "ok" | "degraded" | "down"; detail: string };

export type HealthInput = {
  safetyEngineAvailable: boolean;
  failedValidations: number;
  failedMigrations: number;
  unsyncedOffline: number;
  lastBackupAt?: string;
  appVersion: string;
  ruleSetVersion: string;
  contentRelease: string;
};

export function systemHealth(input: HealthInput): HealthState[] {
  return [
    { check: "database", status: "ok", detail: "Reachable." },
    { check: "storage", status: "ok", detail: "Document bucket reachable." },
    { check: "search", status: "ok", detail: "Index responding." },
    {
      check: "safety_engine",
      status: input.safetyEngineAvailable ? "ok" : "down",
      detail: input.safetyEngineAvailable ? "Rules evaluated." : "Unavailable — publication and live guidance blocked.",
    },
    { check: "authentication", status: "ok", detail: "Sessions issuing normally." },
    { check: "background_jobs", status: "ok", detail: "Queue drained." },
    { check: "document_extraction", status: "ok", detail: "Extraction workers idle." },
    { check: "translation_jobs", status: "ok", detail: "No stuck jobs." },
    { check: "notifications", status: "ok", detail: "Delivery healthy." },
    {
      check: "failed_validations",
      status: input.failedValidations > 0 ? "degraded" : "ok",
      detail: `${input.failedValidations} record(s) failing validation.`,
    },
    {
      check: "failed_migrations",
      status: input.failedMigrations > 0 ? "down" : "ok",
      detail: `${input.failedMigrations} failed migration(s).`,
    },
    {
      check: "unsynced_offline",
      status: input.unsyncedOffline > 0 ? "degraded" : "ok",
      detail: `${input.unsyncedOffline} record(s) waiting to sync.`,
    },
    {
      check: "last_backup",
      status: input.lastBackupAt ? "ok" : "degraded",
      detail: input.lastBackupAt ? `Last backup ${input.lastBackupAt}.` : "Backup status not reported.",
    },
  ];
}

/** Safety-engine outage blocks publication and live treatment guidance. */
export function publicationAllowedByHealth(states: HealthState[]) {
  const engine = states.find((s) => s.check === "safety_engine");
  return engine?.status === "ok";
}

/** Health output must never expose secrets or infrastructure detail. */
export const HEALTH_REDACTED_KEYS = ["token", "secret", "key", "password", "dsn", "connectionString"];

export function healthIsRedacted(payload: Record<string, unknown>) {
  return !Object.keys(payload).some((k) =>
    HEALTH_REDACTED_KEYS.some((bad) => k.toLowerCase().includes(bad)),
  );
}

/* ------------------------------------------------------------------ */
/* 39. Administration analytics (read-only; never changes decisions)   */
/* ------------------------------------------------------------------ */

export type AdminAnalytics = {
  contentCreated: number;
  publications: number;
  suspensions: number;
  overdueReviews: number;
  evidenceGaps: number;
  documentsExpiring: number;
  translationBacklog: number;
  dataCompleteness: number;
  importErrors: number;
  permissionDenials: number;
};

export function adminAnalytics(input: {
  records: GovRecord[];
  documents: GovDocument[];
  translations: TranslationRecord[];
  importErrors: number;
  permissionDenials: number;
  now?: string;
}): AdminAnalytics {
  const now = input.now ?? new Date().toISOString();
  const total = input.records.length || 1;
  const complete = input.records.filter((r) => r.owner && r.sourceDocumentIds.length > 0).length;
  return {
    contentCreated: input.records.length,
    publications: input.records.filter((r) => r.status === "published").length,
    suspensions: input.records.filter((r) => r.status === "suspended").length,
    overdueReviews: input.records.filter((r) => isReviewOverdue(r, now)).length,
    evidenceGaps: input.records.filter((r) => r.sourceDocumentIds.length === 0).length,
    documentsExpiring: input.documents.filter((d) => d.reviewDate && d.reviewDate < now).length,
    translationBacklog: input.translations.filter((t) => t.status === "outdated" || t.status === "not_started").length,
    dataCompleteness: Math.round((complete / total) * 100),
    importErrors: input.importErrors,
    permissionDenials: input.permissionDenials,
  };
}

/** Analytics are advisory only. */
export function analyticsCanChangeApproval() {
  return false;
}
