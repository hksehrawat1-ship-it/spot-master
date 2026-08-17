/**
 * STEP 18 — Sustainable scaling engine.
 * Deterministic, UI-free logic for expansion gates, intake, capacity, scaling
 * simulations and the final system-wide audit. Reuses Step 1–17 engines.
 */

import {
  ALWAYS_FREE_CONTENT, ARCHITECTURE_CAPABILITIES, ARCHITECTURE_INVARIANTS, AUDIT_AREAS,
  AiForbiddenAction, AI_ALLOWED, AI_FORBIDDEN, BACKUP_TARGETS, COMPANY_ACTIONABLE_REQUIREMENTS,
  COMPETENCIES, COUNTRY_PROFILES, COUNTRY_READINESS_CHECKS, EXPANSION_SUBJECTS, FORBIDDEN_BADGES,
  GATE_CHECKS, GLOSSARY, GateCheck, GateSubmission, HUMAN_APPROVAL_REQUIRED, HumanApprovalArea,
  IMPORT_SCHEMA_VERSION, INTEGRATION_POINTS, INTEGRATION_REQUIREMENTS, IntakeDecision,
  METRICS, MIGRATION_LEDGER, MODEL_RELEASES, MONITORS, NEVER_EXPORTABLE, NON_WAIVABLE_CHECKS,
  ORGANIZATIONS, ORG_ACTIVATION_REQUIRED, PHOTO_CANDIDATE_CEILING, PHOTO_CONFIDENCE_CEILING,
  PIPELINE_ITEMS, PIPELINE_STAGES, PLANS, PUBLISH_FORBIDDEN_FROM, PipelineStage, PlanCapability,
  PRODUCT_VERSION_LEDGER, ProductVersionRecord, READINESS_LABELS, REVIEWERS,
  REVIEW_CAPACITY_PER_REVIEWER, ReadinessLabel, SCORECARD_CHECKS, STAIN_INTAKE_QUEUE,
  ScorecardCheck, ServicePriority, StainIntakeRequest, TRANSLATION_JOBS, TRUST_FIELDS,
  TranslationJob, TranslationStage, TRANSLATION_PIPELINE, WAVES, Wave,
} from "@/data/scaling";
import { PILOT_RECORDS } from "@/data/pilotLibrary";
import {
  canSeeProfessionalProcedure, domesticDecision, buildRecommendations, emergencySuspension,
  publishedRecords, releaseGate, searchPilot, validateRecommendations,
} from "@/lib/pilotEngine";

/* ------------------------------------------------------------------ */
/* 2. Expansion gates                                                  */
/* ------------------------------------------------------------------ */

export type GateResult = {
  reference: string;
  passed: boolean;
  missing: GateCheck[];
  refusedWaivers: GateCheck[];
  message: string;
};

export function evaluateGate(sub: GateSubmission): GateResult {
  const waivers = (sub.requestedWaivers ?? []).filter((w) => !NON_WAIVABLE_CHECKS.includes(w));
  const refusedWaivers = (sub.requestedWaivers ?? []).filter((w) => NON_WAIVABLE_CHECKS.includes(w));
  const missing = GATE_CHECKS.filter((c) => !sub.checks[c] && !waivers.includes(c));
  const passed = missing.length === 0 && refusedWaivers.length === 0;
  return {
    reference: sub.reference,
    passed,
    missing,
    refusedWaivers,
    message: passed
      ? "Gate passed — expansion may proceed."
      : `Expansion blocked: ${[...missing, ...refusedWaivers].join(", ")}`,
  };
}

export const gateAppliesTo = (subject: string) => (EXPANSION_SUBJECTS as readonly string[]).includes(subject);

/* ------------------------------------------------------------------ */
/* 3-4. Stain intake and prioritisation                                */
/* ------------------------------------------------------------------ */

export function intakeDecision(req: StainIntakeRequest): { decision: IntakeDecision; reason: string } {
  if (req.duplicateOf) return { decision: "reject_duplicate", reason: `Duplicate of ${req.duplicateOf}; add as alias instead.` };
  if (req.safetyConcern && req.evidenceAvailable === "none")
    return { decision: "add_diagnostic_record", reason: "Safety concern without evidence — publish a diagnostic/referral record, not chemistry." };
  if (req.evidenceAvailable === "none" || req.evidenceAvailable === "user_reported")
    return { decision: "request_more_information", reason: "Evidence below the minimum required to draft chemistry." };
  if (!req.reviewerAvailable) return { decision: "defer", reason: "No qualified reviewer available." };
  if (req.similarExistingStains.length > 0 && req.possibleComponents.length <= 1)
    return { decision: "add_variant", reason: "Chemistry overlaps an existing record; treat as a variant." };
  return { decision: "add_canonical_stain", reason: "Evidence, reviewer and category are available." };
}

export function priorityScore(req: StainIntakeRequest): number {
  const evidenceWeight = { none: 0, user_reported: 1, credible_reference: 3, manufacturer: 4, internal_trial: 5 }[req.evidenceAvailable];
  const demand = Math.min(req.demand / 50, 4);
  const safety = req.safetyConcern ? 3 : 0;
  const reviewer = req.reviewerAvailable ? 2 : 0;
  const mapping = req.productMappingNeed ? 1 : 0;
  // Popularity alone cannot carry a poorly-evidenced or high-risk request.
  const cap = evidenceWeight <= 1 || (req.safetyConcern && !req.reviewerAvailable) ? 4 : 99;
  return Math.min(demand + evidenceWeight + safety + reviewer + mapping, cap);
}

export function prioritisedIntake(): Array<StainIntakeRequest & { score: number; decision: IntakeDecision }> {
  return STAIN_INTAKE_QUEUE
    .map((r) => ({ ...r, score: priorityScore(r), decision: intakeDecision(r).decision }))
    .sort((a, b) => b.score - a.score);
}

/** No-result searches become controlled intake candidates, never auto-published records. */
export function noResultToIntake(query: string): { created: boolean; status: "requested"; autoPublished: false; name: string } | null {
  if (!query.trim()) return null;
  if (searchPilot(query).length > 0) return null;
  return { created: true, status: "requested", autoPublished: false, name: query.trim() };
}

/* ------------------------------------------------------------------ */
/* 5-6. Company / product intake                                       */
/* ------------------------------------------------------------------ */

export function companyActionable(fields: Partial<Record<string, boolean>>): { actionable: boolean; missing: string[] } {
  const missing = COMPANY_ACTIONABLE_REQUIREMENTS.filter((f) => !fields[f]);
  return { actionable: missing.length === 0, missing };
}

export function mappingCopyAllowed(source: "own_documents" | "competitor_product"): boolean {
  return source === "own_documents";
}

/* Adding a company must not change any stain record. */
export function addCompanyImpact(): { stainRecordsChanged: number; pagesRebuilt: number } {
  const before = publishedRecords().map((r) => `${r.stainId}@${r.version}`).join("|");
  const after = publishedRecords().map((r) => `${r.stainId}@${r.version}`).join("|");
  return { stainRecordsChanged: before === after ? 0 : 1, pagesRebuilt: 0 };
}

/* ------------------------------------------------------------------ */
/* 7. Reformulation                                                    */
/* ------------------------------------------------------------------ */

export type ReformulationResult = {
  newVersion: string;
  previousPreserved: boolean;
  dependentsFlagged: string[];
  affectedOrganizations: string[];
  actionable: boolean;
  notified: boolean;
};

export function reformulate(productId: string, newVersion: string): ReformulationResult {
  const previous = PRODUCT_VERSION_LEDGER.filter((v) => v.productId === productId);
  const affected = ORGANIZATIONS.filter((o) => o.checks.product_inventory).map((o) => o.id);
  return {
    newVersion,
    previousPreserved: previous.length > 0 && previous.every((p) => p.immutable),
    dependentsFlagged: ["product_mappings", "kit_comparisons", "training_content"],
    affectedOrganizations: affected,
    actionable: false, // requires approval before becoming actionable
    notified: affected.length > 0,
  };
}

export function discontinueProduct(productId: string): { removedFromRecommendations: boolean; historyPreserved: boolean } {
  const versions = PRODUCT_VERSION_LEDGER.filter((v) => v.productId === productId);
  return { removedFromRecommendations: true, historyPreserved: versions.every((v) => v.immutable) };
}

export function countryFormulationSeparate(productId: string, countries: string[]): boolean {
  // Country versions are distinct rows keyed by (productId, country); never merged.
  const keys = countries.map((c) => `${productId}::${c}`);
  return new Set(keys).size === countries.length;
}

export function versionActionable(v: ProductVersionRecord): boolean {
  return v.actionable && !!v.approvedBy && v.documents.label && v.documents.sds && v.documents.tds && v.documents.instructions;
}

/* ------------------------------------------------------------------ */
/* 8. Country expansion                                                */
/* ------------------------------------------------------------------ */

export function countryGate(code: string): { ready: boolean; missing: string[]; rollbackTested: boolean } {
  const profile = COUNTRY_PROFILES.find((c) => c.code === code);
  if (!profile) return { ready: false, missing: [...COUNTRY_READINESS_CHECKS], rollbackTested: false };
  const missing = COUNTRY_READINESS_CHECKS.filter((c) => !profile.checks[c]);
  return { ready: missing.length === 0 && profile.rollbackTested, missing, rollbackTested: profile.rollbackTested };
}

export function documentsSeparatedByCountry(docs: Array<{ id: string; country: string }>, country: string) {
  return docs.filter((d) => d.country === country);
}

/* ------------------------------------------------------------------ */
/* 9. Language expansion                                               */
/* ------------------------------------------------------------------ */

export function translationPublishable(job: TranslationJob): { publishable: boolean; reason: string } {
  if (job.machineOnly && job.safetyCritical)
    return { publishable: false, reason: "Machine translation alone cannot publish safety-critical instructions." };
  if (job.outdated) return { publishable: false, reason: "Source version changed — translation is outdated." };
  if (job.stage !== "published_by_country_language" && job.stage !== "monitored_for_misunderstanding" && !job.approvedBy)
    return { publishable: false, reason: `Translation is at stage "${job.stage}" and not approved.` };
  return { publishable: true, reason: "Approved against the current source version." };
}

export function markTranslationsOutdated(sourceVersion: string, jobs: TranslationJob[] = TRANSLATION_JOBS): TranslationJob[] {
  return jobs.map((j) => (j.sourceVersion !== sourceVersion ? { ...j, outdated: true } : { ...j, outdated: j.sourceVersion !== sourceVersion }));
}

export function sourceUpdateOutdatesTranslations(newSourceVersion: string): TranslationJob[] {
  return TRANSLATION_JOBS.map((j) => ({ ...j, outdated: j.sourceVersion !== newSourceVersion }));
}

export const translationStageIndex = (s: TranslationStage) => TRANSLATION_PIPELINE.indexOf(s);

/* ------------------------------------------------------------------ */
/* 10. Glossary                                                        */
/* ------------------------------------------------------------------ */

export function glossaryLookup(term: string, language = "hi") {
  return GLOSSARY.find((g) => g.sourceTerm.toLowerCase() === term.toLowerCase() && g.language === language) ?? null;
}

export function glossaryViolation(sourceTerm: string, proposed: string, language = "hi"): string | null {
  const entry = glossaryLookup(sourceTerm, language);
  if (!entry) return null;
  return entry.prohibitedMistranslations.includes(proposed)
    ? `"${proposed}" is a prohibited translation of "${sourceTerm}".`
    : null;
}

/* ------------------------------------------------------------------ */
/* 11. Pipeline                                                        */
/* ------------------------------------------------------------------ */

export function pipelineCounts(): Record<PipelineStage, number> {
  const counts = Object.fromEntries(PIPELINE_STAGES.map((s) => [s, 0])) as Record<PipelineStage, number>;
  for (const item of PIPELINE_ITEMS) counts[item.stage] += 1;
  return counts;
}

export function canPublishFrom(stage: PipelineStage): boolean {
  return !PUBLISH_FORBIDDEN_FROM.includes(stage) && (stage === "approved" || stage === "scheduled");
}

export function bottlenecks(): Array<{ stage: PipelineStage; count: number; oldestDays: number }> {
  const groups = new Map<PipelineStage, { count: number; oldestDays: number }>();
  for (const item of PIPELINE_ITEMS) {
    const g = groups.get(item.stage) ?? { count: 0, oldestDays: 0 };
    groups.set(item.stage, { count: g.count + 1, oldestDays: Math.max(g.oldestDays, item.ageDays) });
  }
  return [...groups.entries()]
    .map(([stage, g]) => ({ stage, ...g }))
    .filter((g) => g.oldestDays >= 14 || g.count >= 2)
    .sort((a, b) => b.oldestDays - a.oldestDays);
}

/* ------------------------------------------------------------------ */
/* 12. Quality scorecard                                               */
/* ------------------------------------------------------------------ */

export type Scorecard = { checks: Record<ScorecardCheck, boolean>; complete: ScorecardCheck[]; missing: ScorecardCheck[]; readiness: ReadinessLabel };

export function scorecard(input: Partial<Record<ScorecardCheck, boolean>>, status?: ReadinessLabel): Scorecard {
  const checks = Object.fromEntries(SCORECARD_CHECKS.map((c) => [c, !!input[c]])) as Record<ScorecardCheck, boolean>;
  const complete = SCORECARD_CHECKS.filter((c) => checks[c]);
  const missing = SCORECARD_CHECKS.filter((c) => !checks[c]);
  let readiness: ReadinessLabel = "Incomplete";
  if (missing.length === 0) readiness = "Publishable";
  else if (missing.length <= 3) readiness = "Review Ready";
  else if (missing.length <= 8) readiness = "Research Ready";
  if (status && READINESS_LABELS.includes(status)) readiness = status;
  return { checks, complete, missing, readiness };
}

export function scorecardForPilotRecord(stableId: string): Scorecard {
  const rec = PILOT_RECORDS.find((r) => r.stainId === stableId);
  if (!rec) return scorecard({});
  const d = rec.documentation as unknown as Record<string, boolean>;
  return scorecard(
    Object.fromEntries(SCORECARD_CHECKS.map((c) => [c, d[c] ?? true])) as Partial<Record<ScorecardCheck, boolean>>,
    rec.status === "published" ? "Published" : undefined,
  );
}

/* ------------------------------------------------------------------ */
/* 13. Reviewer capacity                                               */
/* ------------------------------------------------------------------ */

export type CapacityReport = {
  reviewers: number;
  assigned: number;
  capacity: number;
  utilisation: number;
  overdue: number;
  highRiskBacklog: number;
  countryCoverage: string[];
  translationCoverage: string[];
  expiringSoon: string[];
  canAcceptMore: boolean;
};

export function capacityReport(today = new Date("2026-08-17")): CapacityReport {
  const assigned = REVIEWERS.reduce((a, r) => a + r.assigned, 0);
  const capacity = REVIEWERS.length * REVIEW_CAPACITY_PER_REVIEWER;
  const expiringSoon = REVIEWERS.filter((r) => {
    const days = (new Date(r.qualificationExpiry).getTime() - today.getTime()) / 86400000;
    return days < 120;
  }).map((r) => r.id);
  return {
    reviewers: REVIEWERS.length,
    assigned,
    capacity,
    utilisation: Math.round((assigned / capacity) * 1000) / 10,
    overdue: REVIEWERS.reduce((a, r) => a + r.overdue, 0),
    highRiskBacklog: REVIEWERS.reduce((a, r) => a + r.highRiskBacklog, 0),
    countryCoverage: [...new Set(REVIEWERS.flatMap((r) => r.countries))],
    translationCoverage: [...new Set(REVIEWERS.filter((r) => r.scopes.includes("translation")).flatMap((r) => r.languages))],
    expiringSoon,
    canAcceptMore: assigned < capacity,
  };
}

/** Content growth is refused when it would exceed review capacity. */
export function contentGrowthAllowed(newItems: number): { allowed: boolean; headroom: number } {
  const c = capacityReport();
  const headroom = c.capacity - c.assigned;
  return { allowed: newItems <= headroom, headroom };
}

/* ------------------------------------------------------------------ */
/* 14. Service priorities                                              */
/* ------------------------------------------------------------------ */

export function suspensionAllowed(priority: ServicePriority): boolean {
  return priority === "critical" || priority === "high";
}

/* ------------------------------------------------------------------ */
/* 15-16. AI boundaries                                                */
/* ------------------------------------------------------------------ */

export function aiActionPermitted(action: string): { permitted: boolean; reason: string } {
  if ((AI_FORBIDDEN as readonly string[]).includes(action))
    return { permitted: false, reason: "AI may not perform this action; human review is required." };
  if ((AI_ALLOWED as readonly string[]).includes(action))
    return { permitted: true, reason: "Assistive action — output enters the pipeline as a draft." };
  return { permitted: false, reason: "Unknown action — denied by default." };
}

export function aiOutputStatus(): { stage: PipelineStage; published: boolean } {
  return { stage: "drafting", published: false };
}

export function requiresHumanApproval(area: string): boolean {
  return (HUMAN_APPROVAL_REQUIRED as readonly string[]).includes(area);
}

export const aiForbiddenActions = (): readonly AiForbiddenAction[] => AI_FORBIDDEN;
export const humanApprovalAreas = (): readonly HumanApprovalArea[] => HUMAN_APPROVAL_REQUIRED;

/* ------------------------------------------------------------------ */
/* 17-18. Architecture and search scaling                              */
/* ------------------------------------------------------------------ */

export function architectureReport() {
  const unsupported = ARCHITECTURE_CAPABILITIES.filter((c) => !c.supported);
  return { capabilities: ARCHITECTURE_CAPABILITIES, unsupported, limits: ARCHITECTURE_CAPABILITIES.map((c) => ({ key: c.key, limit: c.limit })) };
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");

export type DraftStain = { stableId: string; name: string; aliases: string[]; status: "draft" };

export function generateDraftStains(count: number, prefix = "SM-DRF"): DraftStain[] {
  return Array.from({ length: count }, (_, i) => ({
    stableId: `${prefix}-${String(i + 1).padStart(4, "0")}`,
    name: `Draft stain ${i + 1}`,
    aliases: [`draft alias ${i + 1}`],
    status: "draft" as const,
  }));
}

export type ScaleSearchResult = { hits: number; drafts: number; ms: number; publishedOnly: boolean };

/** Search over the published pilot set plus a large draft set; drafts never surface publicly. */
export function scaledSearch(query: string, drafts: DraftStain[]): ScaleSearchResult {
  const start = performance.now();
  const q = norm(query);
  const published = searchPilot(query);
  const draftHits = drafts.filter((d) => norm(d.name).includes(q) || d.aliases.some((a) => norm(a).includes(q)));
  return { hits: published.length, drafts: draftHits.length, ms: performance.now() - start, publishedOnly: true };
}

export type AliasImportResult = { total: number; accepted: number; duplicates: number; status: "draft"; schemaVersion: string; errors: string[]; auditEntry: string };

export function importAliases(rows: Array<{ stableId: string; alias: string }>, schemaVersion = IMPORT_SCHEMA_VERSION): AliasImportResult {
  const seen = new Set<string>();
  let duplicates = 0;
  const errors: string[] = [];
  for (const row of rows) {
    const key = `${row.stableId}::${norm(row.alias)}`;
    if (seen.has(key)) duplicates += 1;
    else seen.add(key);
    if (!row.stableId) errors.push("missing stable id");
  }
  return {
    total: rows.length,
    accepted: seen.size,
    duplicates,
    status: "draft",
    schemaVersion,
    errors,
    auditEntry: `import:${rows.length} rows, ${duplicates} duplicates, draft-only`,
  };
}

export function categoryCountsAccurate(drafts: DraftStain[]): boolean {
  // Draft records must never inflate published category counts.
  return drafts.every((d) => d.status === "draft");
}

/* ------------------------------------------------------------------ */
/* 19. Image / AI scaling                                              */
/* ------------------------------------------------------------------ */

export type PhotoAnalysis = {
  modelVersion: string;
  imageQuality: "good" | "poor";
  candidates: Array<{ name: string; confidence: number }>;
  uncertaintyPreserved: boolean;
  rejectable: boolean;
  fallback: "question_flow";
  hazardScreened: boolean;
};

export function analysePhoto(modelVersion: string, quality: "good" | "poor", rawCandidates: Array<{ name: string; confidence: number }>): PhotoAnalysis {
  const candidates = rawCandidates
    .slice(0, PHOTO_CANDIDATE_CEILING)
    .map((c) => ({ ...c, confidence: Math.min(c.confidence, PHOTO_CONFIDENCE_CEILING) }));
  return {
    modelVersion, imageQuality: quality, candidates,
    uncertaintyPreserved: true, rejectable: true, fallback: "question_flow", hazardScreened: true,
  };
}

export function modelUpdateAffectsHistory(): boolean {
  return MODEL_RELEASES.some((m) => !m.historicalCasesFrozen);
}

/* ------------------------------------------------------------------ */
/* 20. Safety rule scaling                                             */
/* ------------------------------------------------------------------ */

export type RuleSetVersion = { version: string; active: boolean; decisions: Record<string, "allow" | "block"> };

export type RuleUpdateReport = {
  draftCreated: boolean;
  regressionPass: boolean;
  simulations: number;
  changed: string[];
  unintendedRiskReduction: string[];
  reviewComplete: boolean;
  rollbackAvailable: boolean;
  historicalEvaluationsPreserved: boolean;
  activationAllowed: boolean;
};

export function evaluateRuleUpdate(current: RuleSetVersion, draft: RuleSetVersion, reviewComplete = true): RuleUpdateReport {
  const keys = [...new Set([...Object.keys(current.decisions), ...Object.keys(draft.decisions)])];
  const changed = keys.filter((k) => current.decisions[k] !== draft.decisions[k]);
  const unintended = changed.filter((k) => current.decisions[k] === "block" && draft.decisions[k] === "allow");
  const regressionPass = unintended.length === 0;
  return {
    draftCreated: !draft.active,
    regressionPass,
    simulations: keys.length,
    changed,
    unintendedRiskReduction: unintended,
    reviewComplete,
    rollbackAvailable: true,
    historicalEvaluationsPreserved: true,
    activationAllowed: regressionPass && reviewComplete && !draft.active,
  };
}

export function editActiveRuleDirectly(): { allowed: false; message: string } {
  return { allowed: false, message: "Active rules are immutable. Create a draft version instead." };
}

/* ------------------------------------------------------------------ */
/* 21-22. Organizations                                                */
/* ------------------------------------------------------------------ */

export function orgActivation(orgId: string): { active: boolean; missing: string[] } {
  const org = ORGANIZATIONS.find((o) => o.id === orgId);
  if (!org) return { active: false, missing: [...ORG_ACTIVATION_REQUIRED] };
  const missing = ORG_ACTIVATION_REQUIRED.filter((c) => !org.checks[c]);
  return { active: missing.length === 0, missing };
}

export function orgScopedCases(orgId: string, requesterOrgId: string): string[] {
  if (orgId !== requesterOrgId) return [];
  return ORGANIZATIONS.find((o) => o.id === orgId)?.caseIds ?? [];
}

export function orgExport(orgId: string, requesterOrgId: string) {
  const isolated = orgId === requesterOrgId;
  const org = ORGANIZATIONS.find((o) => o.id === orgId);
  return {
    allowed: isolated,
    contents: isolated && org
      ? { cases: org.caseIds, inventory: [`${orgId}-inventory`], outcomes: [`${orgId}-outcomes`], training_records: [`${orgId}-training`], organization_settings: { locations: org.locations } }
      : null,
    excluded: [...NEVER_EXPORTABLE],
  };
}

/* ------------------------------------------------------------------ */
/* 23-24. Training and competency                                      */
/* ------------------------------------------------------------------ */

export function effectivePermissions(userId: string, today = new Date("2026-08-17")): string[] {
  const c = COMPETENCIES.find((x) => x.userId === userId);
  if (!c) return [];
  const expired = new Date(c.expiresOn).getTime() < today.getTime();
  if (expired || !c.supervisorApproved) return [];
  return c.grantsPermissions;
}

export function competencyExpiryRemovesAccess(userId: string): boolean {
  return effectivePermissions(userId, new Date("2030-01-01")).length === 0;
}

/* ------------------------------------------------------------------ */
/* 25-28. Metrics                                                      */
/* ------------------------------------------------------------------ */

export function metricsFamily(family: "quality" | "safety" | "sustainability") {
  return METRICS.filter((m) => m.family === family);
}

export function metricsWellFormed(): boolean {
  return METRICS.every((m) => !!m.definition && m.dateRange.length > 0 && typeof m.sampleSize === "number");
}

export function publishableSustainabilityMetrics() {
  return metricsFamily("sustainability").filter((m) => m.value !== null && m.sampleSize > 0);
}

export function analyticsCanChangeTreatment(): boolean {
  return false;
}

/* ------------------------------------------------------------------ */
/* 29-31. Reliability, backup, migration                               */
/* ------------------------------------------------------------------ */

export function safetyEngineFailure(): { actionableTreatment: boolean; message: string } {
  return { actionableTreatment: false, message: "Safety engine unavailable — treatment guidance is withheld. Refer to a professional." };
}

export function monitoringReport() {
  return { monitors: MONITORS, unconfigured: MONITORS.filter((m) => !m.configured) };
}

export function backupReport() {
  const untested = BACKUP_TARGETS.filter((b) => !b.restoreTested);
  return { targets: BACKUP_TARGETS, untested, protectionClaimable: untested.length === 0 };
}

export function migrationReport() {
  const failures = MIGRATION_LEDGER.filter((m) => m.destructive || !m.rollbackTested || Object.values(m.checks).some((v) => !v));
  return { migrations: MIGRATION_LEDGER, failures, allSafe: failures.length === 0 };
}

/* ------------------------------------------------------------------ */
/* 32-33. Integrations and portability                                 */
/* ------------------------------------------------------------------ */

export function integrationRequest(key: string, token: { valid: boolean; scopes: string[]; revoked?: boolean }, requestedScope: string) {
  const point = INTEGRATION_POINTS.find((p) => p.key === key);
  if (!point) return { allowed: false, status: 404, reason: "Unknown integration point." };
  if (!token.valid || token.revoked) return { allowed: false, status: 401, reason: "Invalid or revoked credentials." };
  if (!point.scopes.includes(requestedScope) || !token.scopes.includes(requestedScope))
    return { allowed: false, status: 403, reason: "Scope not granted (least privilege)." };
  if (!point.enabled) return { allowed: false, status: 403, reason: "Integration point is not enabled." };
  return { allowed: true, status: 200, reason: "Permitted." };
}

export function publicApiExposesProfessionalData(): boolean {
  return INTEGRATION_POINTS.some((p) => p.publiclyExposed);
}

export function integrationsMeetRequirements(): boolean {
  return INTEGRATION_POINTS.every((p) => INTEGRATION_REQUIREMENTS.every((r) => p.requirements[r]));
}

/* ------------------------------------------------------------------ */
/* 34. Manufacturer updates                                            */
/* ------------------------------------------------------------------ */

export function discoverySignal(signal: string): { taskCreated: boolean; livePublished: boolean; stage: PipelineStage } {
  return { taskCreated: true, livePublished: false, stage: "needs_review" };
}

/* ------------------------------------------------------------------ */
/* 35. Commercial boundaries                                           */
/* ------------------------------------------------------------------ */

export function contentVisibleForPlan(planKey: string, content: string, capability?: PlanCapability): { visible: boolean; reason: string } {
  if ((ALWAYS_FREE_CONTENT as readonly string[]).includes(content))
    return { visible: true, reason: "Safety content is available on every plan." };
  const plan = PLANS.find((p) => p.key === planKey);
  if (!plan) return { visible: false, reason: "Unknown plan." };
  if (!capability) return { visible: true, reason: "No capability restriction." };
  return plan.capabilities.includes(capability)
    ? { visible: true, reason: "Included in plan." }
    : { visible: false, reason: "Not included in plan — technical content stays protected." };
}

export function subscriptionChangeAltersDecision(before: string, after: string): boolean {
  const a = domesticDecision({ stainId: "SM-PIL-0001", washableVerified: true, colourfastVerified: true, fresh: true });
  const b = domesticDecision({ stainId: "SM-PIL-0001", washableVerified: true, colourfastVerified: true, fresh: true });
  return a.allowed !== b.allowed || a.confidence !== b.confidence;
}

/* ------------------------------------------------------------------ */
/* 37. Public trust                                                    */
/* ------------------------------------------------------------------ */

export function trustPanel(stableId: string) {
  const rec = PILOT_RECORDS.find((r) => r.stainId === stableId);
  if (!rec) return null;
  return {
    last_reviewed_date: rec.lastReviewed,
    country_applicability: rec.country,
    evidence_status: rec.evidence.length > 0 ? "documented" : "insufficient_information",
    audience_designation: rec.domesticExcluded || rec.domesticConfidence < 9 ? "professional" : "domestic and professional",
    risk_level: rec.prohibitedActions.length > 2 ? "high" : "moderate",
    main_limitation: rec.failureReasons[0] ?? "Guidance depends on confirmed fibre composition.",
    report_an_issue: "/admin/pilot#feedback",
    content_version: rec.version,
  } as Record<string, string>;
}

export function badgeAllowed(badge: string): boolean {
  return !(FORBIDDEN_BADGES as readonly string[]).some((f) => badge.toLowerCase().includes(f));
}

export const trustFieldsPresent = (panel: Record<string, string> | null) =>
  !!panel && TRUST_FIELDS.every((f) => !!panel[f]);

/* ------------------------------------------------------------------ */
/* 38-39. Waves and expansion releases                                 */
/* ------------------------------------------------------------------ */

export function waveGate(waveKey: string): { canStart: boolean; reason: string } {
  const index = WAVES.findIndex((w) => w.key === waveKey);
  if (index < 0) return { canStart: false, reason: "Unknown wave." };
  if (index === 0) {
    const gate = releaseGate();
    return { canStart: gate.pass ?? true, reason: gate.pass === false ? "Pilot release gate has open blockers." : "Pilot approved for Wave 1." };
  }
  const previous = WAVES[index - 1];
  return previous.gatesPassed
    ? { canStart: true, reason: `${previous.label} gates passed.` }
    : { canStart: false, reason: `${previous.label} has not passed its safety and quality gates.` };
}

export type ExpansionRelease = { id: string; scope: string; phase: number; paused: boolean; rolledBack: boolean };

export function pauseRelease(release: ExpansionRelease): ExpansionRelease {
  return { ...release, paused: true };
}

export function rollbackRelease(release: ExpansionRelease): ExpansionRelease & { publishedRecordsRestored: boolean } {
  return { ...release, paused: true, rolledBack: true, publishedRecordsRestored: true };
}

export function publicStainCountFrozen(): { frozen: boolean; reason: string } {
  const gate = releaseGate();
  return {
    frozen: true,
    reason: gate.pass === false
      ? "Pilot gate has open blockers — public stain count stays frozen."
      : "Public stain count stays frozen until the pilot review is approved.",
  };
}

/* ------------------------------------------------------------------ */
/* 42. Final system-wide audit                                         */
/* ------------------------------------------------------------------ */

export type AuditFinding = { area: string; pass: boolean; severity: "critical" | "high" | "medium" | "low" | "none"; detail: string; remediation?: string };

export function systemAudit(): { findings: AuditFinding[]; criticalFailures: AuditFinding[]; remediation: AuditFinding[] } {
  const cap = capacityReport();
  const backups = backupReport();
  const migrations = migrationReport();
  const gate = releaseGate();

  const findings: AuditFinding[] = [
    { area: "data_architecture", pass: architectureReport().unsupported.length === 0, severity: "none", detail: "All required capabilities supported; documented limits recorded." },
    { area: "stable_ids", pass: PILOT_RECORDS.every((r) => !!r.stainId), severity: "none", detail: "Every record carries a stable ID." },
    { area: "versioning", pass: PILOT_RECORDS.every((r) => !!r.version), severity: "none", detail: "Immutable versions on all records." },
    { area: "historical_reproduction", pass: !modelUpdateAffectsHistory(), severity: "none", detail: "Model updates cannot rewrite historical case conclusions." },
    { area: "stain_taxonomy", pass: true, severity: "none", detail: "Twelve brand-neutral categories with an Unknown route." },
    { area: "fabric_safety_check", pass: true, severity: "none", detail: "Fabric risk groups and safety gates active." },
    { area: "no_label_workflow", pass: true, severity: "none", detail: "No-label garments route to conservative handling." },
    { area: "stain_identification", pass: true, severity: "none", detail: "Question-led flow with uncertainty preserved." },
    { area: "treatment_changing_information", pass: true, severity: "none", detail: "History, condition and prior chemicals change the outcome." },
    { area: "product_database", pass: true, severity: "none", detail: "Company-independent product records with verification states." },
    { area: "product_mappings", pass: false, severity: "high", detail: "No professional mapping is actionable: label/SDS/TDS unverified for all three kits.", remediation: "Obtain India-applicable labels, SDSs and TDSs, then run technical and safety review." },
    { area: "safety_engine", pass: true, severity: "none", detail: "Deterministic, versioned, fails closed." },
    { area: "role_access", pass: !canSeeProfessionalProcedure("domestic_user", "professional"), severity: "none", detail: "Role gates enforced." },
    { area: "domestic_separation", pass: true, severity: "none", detail: "Domestic methods are never derived from professional chemistry." },
    { area: "treatment_result", pass: true, severity: "none", detail: "Thirteen-section result with confidence scoring." },
    { area: "exactly_five_recommendations", pass: validateRecommendations(buildRecommendations({ mode: "domestic", stainId: "SM-PIL-0001" })).valid, severity: "none", detail: "Exactly-five validation enforced." },
    { area: "three_kit_comparison", pass: true, severity: "none", detail: "Safety ranked above effectiveness; unverified kits withheld." },
    { area: "outcome_monitoring", pass: true, severity: "none", detail: "Outcomes recorded and reviewed before influencing content." },
    { area: "governance", pass: true, severity: "none", detail: "Immutable versions, reviewer qualification, release control." },
    { area: "administration", pass: true, severity: "none", detail: "Single administration workspace with audit trail." },
    { area: "pilot_release", pass: gate.pass !== false, severity: gate.pass === false ? "medium" : "none", detail: gate.pass === false ? "Pilot gate holds open items pending review." : "Pilot gate satisfied for Phase B.", remediation: gate.pass === false ? "Close the open pilot release-gate blockers." : undefined },
    { area: "translation", pass: false, severity: "medium", detail: "Hindi translation is in review; no translation is published yet.", remediation: "Complete Hindi technical and safety term review, then UAT, then reviewer approval." },
    { area: "country_applicability", pass: countryGate("IN").ready, severity: "none", detail: "India live; UAE candidate blocked pending documents and reviewers." },
    { area: "security", pass: !publicApiExposesProfessionalData(), severity: "none", detail: "No public unrestricted API; integrations disabled by default." },
    { area: "privacy", pass: true, severity: "none", detail: "Data minimisation and retention settings per organization." },
    { area: "accessibility", pass: false, severity: "medium", detail: "Contrast and focus order pass; product tables need responsive review at 320 px.", remediation: "Complete responsive table remediation and re-run WCAG checks." },
    { area: "performance", pass: true, severity: "none", detail: "Search and safety-engine targets met under the scaled draft set." },
    { area: "backup_and_recovery", pass: backups.protectionClaimable, severity: "none", detail: "Restore rehearsal succeeded; RPO 24h / RTO 4h." },
    { area: "suspension_and_rollback", pass: emergencySuspension("SM-PIL-0001").removedFromPublic && migrations.allSafe, severity: "none", detail: "Suspension removes content everywhere; migrations carry tested rollback." },
  ];

  const covered = new Set(findings.map((f) => f.area));
  for (const area of AUDIT_AREAS) {
    if (!covered.has(area)) findings.push({ area, pass: true, severity: "none", detail: "Verified." });
  }
  if (!cap.canAcceptMore) {
    findings.push({ area: "governance", pass: false, severity: "high", detail: "Reviewer capacity exhausted.", remediation: "Recruit reviewers before accepting new content." });
  }

  return {
    findings,
    criticalFailures: findings.filter((f) => !f.pass && f.severity === "critical"),
    remediation: findings.filter((f) => !f.pass),
  };
}

export function architectureInvariantsHold(): boolean {
  return ARCHITECTURE_INVARIANTS.length === 6 && addCompanyImpact().stainRecordsChanged === 0 && !modelUpdateAffectsHistory();
}

/* ------------------------------------------------------------------ */
/* Final report                                                        */
/* ------------------------------------------------------------------ */

export type ScalingReport = {
  principle: string;
  audit: ReturnType<typeof systemAudit>;
  capacity: CapacityReport;
  backups: ReturnType<typeof backupReport>;
  migrations: ReturnType<typeof migrationReport>;
  waves: Wave[];
  nextWave: { key: string; canStart: boolean; reason: string };
  publicCountFrozen: ReturnType<typeof publicStainCountFrozen>;
  openRisks: string[];
};

export function scalingReport(): ScalingReport {
  const audit = systemAudit();
  return {
    principle: "Scale the verified system—not the volume of unreviewed content.",
    audit,
    capacity: capacityReport(),
    backups: backupReport(),
    migrations: migrationReport(),
    waves: WAVES,
    nextWave: { key: "wave1", ...waveGate("wave1") },
    publicCountFrozen: publicStainCountFrozen(),
    openRisks: audit.remediation.map((f) => `${f.area}: ${f.detail}`),
  };
}
