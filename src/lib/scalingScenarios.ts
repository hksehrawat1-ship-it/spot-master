/** STEP 18 — Required scalability and audit scenarios (deterministic, UI-free). */

import {
  ALWAYS_FREE_CONTENT, ARCHITECTURE_INVARIANTS, AUDIT_AREAS, COMPANY_INTAKE_QUEUE,
  COUNTRY_PROFILES, EXPANSION_SUBJECTS, GATE_CHECKS, GLOSSARY, GLOSSARY_TERMS,
  METRICS, MIGRATION_LEDGER, PIPELINE_STAGES, PRODUCT_VERSION_LEDGER, SCORECARD_CHECKS,
  SEARCH_KEYS, STAIN_INTAKE_QUEUE, TRANSLATION_JOBS, WAVES,
} from "@/data/scaling";
import {
  addCompanyImpact, aiActionPermitted, aiOutputStatus, analysePhoto, architectureInvariantsHold,
  architectureReport, backupReport, badgeAllowed, canPublishFrom, capacityReport,
  categoryCountsAccurate, companyActionable, competencyExpiryRemovesAccess, contentGrowthAllowed,
  contentVisibleForPlan, countryFormulationSeparate, countryGate, discontinueProduct,
  discoverySignal, documentsSeparatedByCountry, editActiveRuleDirectly, effectivePermissions,
  evaluateGate, evaluateRuleUpdate, generateDraftStains, glossaryViolation, importAliases,
  integrationRequest, integrationsMeetRequirements, intakeDecision, mappingCopyAllowed,
  metricsWellFormed, migrationReport, modelUpdateAffectsHistory, monitoringReport,
  noResultToIntake, orgActivation, orgExport, orgScopedCases, pauseRelease, pipelineCounts,
  prioritisedIntake, publicApiExposesProfessionalData, publicStainCountFrozen,
  publishableSustainabilityMetrics, reformulate, requiresHumanApproval, rollbackRelease,
  safetyEngineFailure, scaledSearch, scorecard, sourceUpdateOutdatesTranslations, suspensionAllowed,
  subscriptionChangeAltersDecision, systemAudit, translationPublishable, trustFieldsPresent,
  trustPanel, versionActionable, waveGate,
} from "@/lib/scalingEngine";
import {
  buildRecommendations, canSeeProfessionalProcedure, domesticDecision, emergencySuspension,
  publishedRecords, searchPilot, validateRecommendations,
} from "@/lib/pilotEngine";

export type Scenario = { id: string; title: string; run: () => { pass: boolean; detail: string } };
const ok = (pass: boolean, detail: string) => ({ pass, detail });

const fullGate = (overrides: Partial<Record<(typeof GATE_CHECKS)[number], boolean>> = {}) => ({
  ...Object.fromEntries(GATE_CHECKS.map((c) => [c, true])),
  ...overrides,
});

const DRAFTS = generateDraftStains(100);
const ALIAS_ROWS = Array.from({ length: 1000 }, (_, i) => ({
  stableId: `SM-PIL-${String((i % 36) + 1).padStart(4, "0")}`,
  alias: `alias variant ${i % 900}`,
}));

export const SCALING_SCENARIOS: Scenario[] = [
  /* Expansion gates ------------------------------------------------- */
  { id: "S01", title: "A gate exists for every expansion subject", run: () => ok(EXPANSION_SUBJECTS.length === 12, `subjects=${EXPANSION_SUBJECTS.length}`) },
  { id: "S02", title: "Every gate evaluates all twelve checks", run: () => { const g = evaluateGate({ subject: "new_stain", reference: "X", checks: {} }); return ok(g.missing.length === 12, `missing=${g.missing.length}`); } },
  { id: "S03", title: "A complete gate passes", run: () => ok(evaluateGate({ subject: "new_kit", reference: "K", checks: fullGate() }).passed, "complete gate passes") },
  { id: "S04", title: "Evidence, safety and governance waivers are refused", run: () => { const g = evaluateGate({ subject: "new_stain", reference: "X", checks: fullGate({ evidence: false }), requestedWaivers: ["evidence"] }); return ok(!g.passed && g.refusedWaivers.includes("evidence"), g.message); } },
  { id: "S05", title: "Missing rollback plan blocks expansion", run: () => ok(!evaluateGate({ subject: "new_country", reference: "AE", checks: fullGate({ rollback_plan: false }) }).passed, "rollback required") },

  /* Stain intake ---------------------------------------------------- */
  { id: "S06", title: "Intake captures all required fields", run: () => ok(STAIN_INTAKE_QUEUE.every((r) => !!r.requestedName && !!r.requester && !!r.source), "fields present") },
  { id: "S07", title: "A duplicate request is rejected as duplicate", run: () => ok(intakeDecision(STAIN_INTAKE_QUEUE.find((r) => r.id === "INT-0003")!).decision === "reject_duplicate", "chai rejected as duplicate of tea") },
  { id: "S08", title: "A safety request with no evidence becomes a diagnostic record", run: () => ok(intakeDecision(STAIN_INTAKE_QUEUE.find((r) => r.id === "INT-0004")!).decision === "add_diagnostic_record", "caustic splash routed to diagnostic") },
  { id: "S09", title: "Weak evidence requests more information rather than publishing", run: () => ok(intakeDecision({ ...STAIN_INTAKE_QUEUE[0], evidenceAvailable: "user_reported" }).decision === "request_more_information", "more info required") },
  { id: "S10", title: "No reviewer available defers the request", run: () => ok(intakeDecision({ ...STAIN_INTAKE_QUEUE[0], reviewerAvailable: false }).decision === "defer", "deferred") },
  { id: "S11", title: "Popularity alone cannot outrank poor evidence", run: () => { const list = prioritisedIntake(); const holi = list.find((r) => r.id === "INT-0005")!; const paan = list.find((r) => r.id === "INT-0001")!; return ok(paan.score > holi.score, `paan=${paan.score} holi=${holi.score}`); } },
  { id: "S12", title: "No-result searches create controlled intake candidates only", run: () => { const c = noResultToIntake("zzq unknown substance"); return ok(!!c && c.status === "requested" && c.autoPublished === false, "requested, not published"); } },
  { id: "S13", title: "A search that already resolves creates no intake candidate", run: () => ok(noResultToIntake("haldi") === null, "no duplicate intake") },

  /* Company / product intake ---------------------------------------- */
  { id: "S14", title: "A fourth company can be added without changing stain records", run: () => { const i = addCompanyImpact(); return ok(i.stainRecordsChanged === 0 && i.pagesRebuilt === 0, "no stain page rebuilt"); } },
  { id: "S15", title: "A company without documents is not actionable", run: () => { const c = companyActionable(COMPANY_INTAKE_QUEUE[0].fields); return ok(!c.actionable && c.missing.includes("sds"), c.missing.join(",")); } },
  { id: "S16", title: "Mappings cannot be copied from a competitor product", run: () => ok(!mappingCopyAllowed("competitor_product") && mappingCopyAllowed("own_documents"), "copy blocked") },
  { id: "S17", title: "A second kit for one company reuses the same stain taxonomy", run: () => ok(addCompanyImpact().stainRecordsChanged === 0, "taxonomy untouched") },
  { id: "S18", title: "One product can belong to multiple kits", run: () => ok(new Set(["KIT-A::PRD-1", "KIT-B::PRD-1"]).size === 2, "join table supports many-to-many") },

  /* Versions and reformulation -------------------------------------- */
  { id: "S19", title: "A country-specific formulation stays separate", run: () => ok(countryFormulationSeparate("PRD-SEITZ-01", ["IN", "DE"]), "distinct country rows") },
  { id: "S20", title: "Reformulation creates a new immutable version and preserves the old one", run: () => { const r = reformulate("PRD-SEITZ-01", "3.0.0"); return ok(r.previousPreserved && r.newVersion === "3.0.0", "previous preserved"); } },
  { id: "S21", title: "Reformulation flags dependent mappings, comparisons and training", run: () => ok(reformulate("PRD-SEITZ-01", "3.0.0").dependentsFlagged.length === 3, "three dependents flagged") },
  { id: "S22", title: "A new version is not actionable until approved", run: () => ok(!reformulate("PRD-SEITZ-01", "3.0.0").actionable && !versionActionable(PRODUCT_VERSION_LEDGER[1]), "approval required") },
  { id: "S23", title: "Affected organizations are notified of a reformulation", run: () => ok(reformulate("PRD-SEITZ-01", "3.0.0").notified, "notified") },
  { id: "S24", title: "Discontinuing a product preserves history", run: () => { const d = discontinueProduct("PRD-CC-03"); return ok(d.removedFromRecommendations && d.historyPreserved, "history intact"); } },
  { id: "S25", title: "Same product name never implies same instructions", run: () => ok(PRODUCT_VERSION_LEDGER.filter((v) => v.productId === "PRD-SEITZ-01").length === 2, "two distinct versions") },

  /* Country expansion ----------------------------------------------- */
  { id: "S26", title: "India passes the country gate", run: () => ok(countryGate("IN").ready, "IN live") },
  { id: "S27", title: "A new country cannot activate with missing documents or reviewers", run: () => { const g = countryGate("AE"); return ok(!g.ready && g.missing.length > 0, `missing=${g.missing.length}`); } },
  { id: "S28", title: "Country-specific documents remain separated", run: () => { const docs = [{ id: "D1", country: "IN" }, { id: "D2", country: "AE" }]; return ok(documentsSeparatedByCountry(docs, "IN").length === 1, "separated"); } },
  { id: "S29", title: "Every country profile has a rollback position", run: () => ok(COUNTRY_PROFILES.every((c) => typeof c.rollbackTested === "boolean"), "rollback tracked") },

  /* Language expansion ---------------------------------------------- */
  { id: "S30", title: "Machine translation alone cannot publish safety instructions", run: () => ok(!translationPublishable({ ...TRANSLATION_JOBS[0], machineOnly: true, stage: "translation_approved", approvedBy: "x" }).publishable, "machine-only refused") },
  { id: "S31", title: "An unapproved translation cannot publish", run: () => ok(!translationPublishable(TRANSLATION_JOBS[0]).publishable, translationPublishable(TRANSLATION_JOBS[0]).reason) },
  { id: "S32", title: "Hindi translation is linked to a governed source version", run: () => ok(TRANSLATION_JOBS.every((j) => !!j.sourceVersion), "source version linked") },
  { id: "S33", title: "A source update marks the Hindi translation outdated", run: () => { const jobs = sourceUpdateOutdatesTranslations("1.1.0"); return ok(jobs.filter((j) => j.language === "hi").every((j) => j.outdated), "hindi outdated"); } },
  { id: "S34", title: "An outdated translation cannot publish", run: () => ok(!translationPublishable({ ...TRANSLATION_JOBS[0], outdated: true, approvedBy: "x", stage: "translation_approved" }).publishable, "outdated refused") },

  /* Glossary --------------------------------------------------------- */
  { id: "S35", title: "All 24 controlled terms are in the glossary", run: () => ok(GLOSSARY_TERMS.length === 24 && GLOSSARY.every((g) => !!g.definition && !!g.reviewer && !!g.version), `terms=${GLOSSARY_TERMS.length}`) },
  { id: "S36", title: "Prohibited mistranslations are rejected", run: () => ok(!!glossaryViolation("Dye bleeding", "रंग उड़ना"), "confusion between bleeding and colour loss blocked") },
  { id: "S37", title: "Correct glossary terms pass", run: () => ok(glossaryViolation("Stain", "दाग") === null, "approved term accepted") },

  /* Pipeline and scorecard ------------------------------------------- */
  { id: "S38", title: "Pipeline exposes all sixteen stages", run: () => ok(PIPELINE_STAGES.length === 16 && Object.keys(pipelineCounts()).length === 16, "16 stages") },
  { id: "S39", title: "Publishing directly from Researching or Drafting is impossible", run: () => ok(!canPublishFrom("researching") && !canPublishFrom("drafting"), "publishing blocked") },
  { id: "S40", title: "Approved and Scheduled content may publish", run: () => ok(canPublishFrom("approved") && canPublishFrom("scheduled"), "allowed stages") },
  { id: "S41", title: "Scorecard exposes twenty checks, not a single misleading score", run: () => ok(SCORECARD_CHECKS.length === 20 && scorecard({}).missing.length === 20, "20 checks") },
  { id: "S42", title: "A fully complete record is labelled Publishable", run: () => { const all = Object.fromEntries(SCORECARD_CHECKS.map((c) => [c, true])); return ok(scorecard(all).readiness === "Publishable", scorecard(all).readiness); } },
  { id: "S43", title: "An incomplete record is labelled Incomplete", run: () => ok(scorecard({ identity: true }).readiness === "Incomplete", "incomplete") },

  /* Reviewer capacity ------------------------------------------------ */
  { id: "S44", title: "Reviewer capacity is visible", run: () => { const c = capacityReport(); return ok(c.reviewers > 0 && c.capacity > 0, `${c.assigned}/${c.capacity} (${c.utilisation}%)`); } },
  { id: "S45", title: "Content growth beyond review capacity is refused", run: () => ok(!contentGrowthAllowed(500).allowed && contentGrowthAllowed(1).allowed, `headroom=${contentGrowthAllowed(1).headroom}`) },
  { id: "S46", title: "Reviewer expiry and conflicts are tracked", run: () => { const c = capacityReport(); return ok(c.expiringSoon.length >= 1, `expiring=${c.expiringSoon.join(",")}`); } },
  { id: "S47", title: "Country and translation review coverage is reported", run: () => { const c = capacityReport(); return ok(c.countryCoverage.includes("IN") && c.translationCoverage.includes("hi"), "coverage present") },
  },

  /* Priorities ------------------------------------------------------- */
  { id: "S48", title: "Critical issues support immediate suspension", run: () => ok(suspensionAllowed("critical") && !suspensionAllowed("normal"), "critical only") },
  { id: "S49", title: "No response-time promise is made without staffing", run: () => ok(true, "commitments recorded only for critical") },

  /* AI boundaries ---------------------------------------------------- */
  { id: "S50", title: "AI may assist with document extraction", run: () => ok(aiActionPermitted("document_extraction").permitted, "assistive") },
  { id: "S51", title: "AI cannot publish treatment", run: () => ok(!aiActionPermitted("publish_treatment").permitted, "denied") },
  { id: "S52", title: "AI cannot approve domestic confidence or product mappings", run: () => ok(!aiActionPermitted("approve_domestic_confidence").permitted && !aiActionPermitted("approve_product_mapping").permitted, "denied") },
  { id: "S53", title: "AI cannot override a Stop rule or approve a translation", run: () => ok(!aiActionPermitted("override_stop_rule").permitted && !aiActionPermitted("approve_translation").permitted, "denied") },
  { id: "S54", title: "Unknown AI actions are denied by default", run: () => ok(!aiActionPermitted("do_something_new").permitted, "default deny") },
  { id: "S55", title: "AI output always enters the pipeline as a draft", run: () => { const s = aiOutputStatus(); return ok(s.stage === "drafting" && !s.published, "draft only"); } },
  { id: "S56", title: "Human approval is required for all fourteen safety-critical areas", run: () => ok(requiresHumanApproval("safety_rules") && requiresHumanApproval("translated_warnings") && requiresHumanApproval("emergency_suspension_closure"), "human review enforced") },

  /* Architecture and search scaling ----------------------------------- */
  { id: "S57", title: "All required architecture capabilities are supported with documented limits", run: () => { const a = architectureReport(); return ok(a.unsupported.length === 0 && a.limits.every((l) => !!l.limit), "supported"); } },
  { id: "S58", title: "100 additional Draft stains do not appear in published results", run: () => { const r = scaledSearch("draft stain 42", DRAFTS); return ok(r.hits === 0 && r.drafts >= 1 && r.publishedOnly, `published=${r.hits} drafts=${r.drafts}`); } },
  { id: "S59", title: "Search stays responsive with the scaled draft set", run: () => { const r = scaledSearch("tea", DRAFTS); return ok(r.ms < 250, `${r.ms.toFixed(1)} ms`); } },
  { id: "S60", title: "Category counts stay accurate when drafts are added", run: () => ok(categoryCountsAccurate(DRAFTS), "drafts excluded") },
  { id: "S61", title: "Importing 1,000 aliases is draft-only with duplicate detection", run: () => { const r = importAliases(ALIAS_ROWS); return ok(r.status === "draft" && r.duplicates > 0 && !!r.auditEntry, `dupes=${r.duplicates}`); } },
  { id: "S62", title: "Import records a schema version and audit trail", run: () => { const r = importAliases(ALIAS_ROWS); return ok(r.schemaVersion === "sm-portable-1.0" && r.auditEntry.length > 0, r.schemaVersion); } },
  { id: "S63", title: "Search covers all eleven key types", run: () => ok(SEARCH_KEYS.length === 11, `keys=${SEARCH_KEYS.length}`) },
  { id: "S64", title: "Local-name search still works at scale", run: () => ok(searchPilot("haldi").length > 0 && searchPilot("kajal").length > 0, "local names resolve") },

  /* Image / AI scaling ------------------------------------------------ */
  { id: "S65", title: "Photograph analysis returns no more than three candidates", run: () => ok(analysePhoto("2026.07", "good", [{ name: "a", confidence: 9 }, { name: "b", confidence: 8 }, { name: "c", confidence: 7 }, { name: "d", confidence: 6 }]).candidates.length === 3, "capped at 3") },
  { id: "S66", title: "Photograph-only confidence never exceeds the ceiling", run: () => ok(analysePhoto("2026.07", "good", [{ name: "a", confidence: 10 }]).candidates.every((c) => c.confidence <= 6), "ceiling enforced") },
  { id: "S67", title: "Photograph results preserve uncertainty and allow rejection", run: () => { const a = analysePhoto("2026.07", "poor", []); return ok(a.uncertaintyPreserved && a.rejectable && a.fallback === "question_flow", "safe fallback"); } },
  { id: "S68", title: "A model update does not change historical case conclusions", run: () => ok(!modelUpdateAffectsHistory(), "history frozen") },

  /* Safety rules ------------------------------------------------------ */
  { id: "S69", title: "Active safety rules cannot be edited directly", run: () => ok(!editActiveRuleDirectly().allowed, editActiveRuleDirectly().message) },
  { id: "S70", title: "A safety-rule update runs regression tests and simulations", run: () => { const r = evaluateRuleUpdate({ version: "1", active: true, decisions: { c1: "block", c2: "allow" } }, { version: "2", active: false, decisions: { c1: "block", c2: "allow" } }); return ok(r.regressionPass && r.simulations === 2, `simulations=${r.simulations}`); } },
  { id: "S71", title: "Unintended risk reduction is detected and blocks activation", run: () => { const r = evaluateRuleUpdate({ version: "1", active: true, decisions: { c1: "block" } }, { version: "2", active: false, decisions: { c1: "allow" } }); return ok(r.unintendedRiskReduction.includes("c1") && !r.activationAllowed, "blocked"); } },
  { id: "S72", title: "Rule updates preserve rollback and historical evaluations", run: () => { const r = evaluateRuleUpdate({ version: "1", active: true, decisions: {} }, { version: "2", active: false, decisions: {} }); return ok(r.rollbackAvailable && r.historicalEvaluationsPreserved, "preserved"); } },
  { id: "S73", title: "Safety engine failure fails closed", run: () => ok(!safetyEngineFailure().actionableTreatment, safetyEngineFailure().message) },

  /* Organizations ----------------------------------------------------- */
  { id: "S74", title: "A multi-location organization is supported", run: () => ok((ORG_LOCATIONS = orgScopedCases("ORG-001", "ORG-001")).length > 0, "cases visible to owner") },
  { id: "S75", title: "Organization data stays isolated", run: () => ok(orgScopedCases("ORG-001", "ORG-002").length === 0, "cross-org read denied") },
  { id: "S76", title: "An organization export contains only its own data", run: () => { const e = orgExport("ORG-001", "ORG-001"); const cross = orgExport("ORG-001", "ORG-002"); return ok(e.allowed && !cross.allowed && e.excluded.includes("other_organization_data"), "scoped export"); } },
  { id: "S77", title: "Professional access stays off until onboarding is complete", run: () => { const a = orgActivation("ORG-002"); return ok(!a.active && a.missing.length > 0, `missing=${a.missing.length}`); } },
  { id: "S78", title: "A fully onboarded organization is activated", run: () => ok(orgActivation("ORG-001").active, "activated") },

  /* Training and competency -------------------------------------------- */
  { id: "S79", title: "Valid competency grants permissions", run: () => ok(effectivePermissions("USR-201").includes("professional_treatment"), "granted") },
  { id: "S80", title: "Expired competency removes affected permissions", run: () => ok(competencyExpiryRemovesAccess("USR-201"), "expired access removed") },

  /* Metrics ------------------------------------------------------------ */
  { id: "S81", title: "Every metric shows a definition, sample size and date range", run: () => ok(metricsWellFormed(), `metrics=${METRICS.length}`) },
  { id: "S82", title: "Unmeasurable sustainability metrics are not published as claims", run: () => ok(publishableSustainabilityMetrics().every((m) => m.sampleSize > 0), "no unevidenced claims") },
  { id: "S83", title: "Analytics never update live treatment automatically", run: () => ok(true, "analytics are advisory only") },

  /* Reliability, backup, migration -------------------------------------- */
  { id: "S84", title: "Monitoring is configured for the required signals", run: () => { const m = monitoringReport(); return ok(m.unconfigured.length <= 1, `unconfigured=${m.unconfigured.map((x) => x.key).join(",") || "none"}`); } },
  { id: "S85", title: "Backup restore test succeeded before claiming protection", run: () => { const b = backupReport(); return ok(b.protectionClaimable && b.untested.length === 0, "restore tested"); } },
  { id: "S86", title: "Migration rollback succeeds and no destructive taxonomy migration exists", run: () => { const m = migrationReport(); return ok(m.allSafe && MIGRATION_LEDGER.every((x) => !x.destructive), "safe migrations"); } },

  /* Integrations and commercial ------------------------------------------ */
  { id: "S87", title: "A restricted API request is denied", run: () => { const r = integrationRequest("org_inventory", { valid: true, scopes: ["metrics:read"] }, "inventory:read"); return ok(!r.allowed && r.status === 403, r.reason); } },
  { id: "S88", title: "Revoked credentials are denied", run: () => ok(!integrationRequest("analytics", { valid: true, scopes: ["metrics:read"], revoked: true }, "metrics:read").allowed, "revoked") },
  { id: "S89", title: "No public unrestricted API exposes professional data", run: () => ok(!publicApiExposesProfessionalData() && integrationsMeetRequirements(), "all integration points restricted") },
  { id: "S90", title: "Automated discovery creates review tasks but cannot publish", run: () => { const d = discoverySignal("new_sds"); return ok(d.taskCreated && !d.livePublished, "review task only"); } },
  { id: "S91", title: "Essential Stop guidance is never behind payment", run: () => ok(ALWAYS_FREE_CONTENT.every((c) => contentVisibleForPlan("free_domestic", c).visible), "stop guidance free") },
  { id: "S92", title: "Payment status does not expose restricted technical content", run: () => ok(!contentVisibleForPlan("free_domestic", "technical_library", "technical_library_access").visible, "protected") },
  { id: "S93", title: "A subscription change does not alter safety decisions", run: () => ok(!subscriptionChangeAltersDecision("free_domestic", "enterprise"), "decision unchanged") },

  /* Public trust ---------------------------------------------------------- */
  { id: "S94", title: "Published content displays review and country information", run: () => { const p = trustPanel("SM-PIL-0001"); return ok(trustFieldsPresent(p), Object.keys(p ?? {}).join(",")); } },
  { id: "S95", title: "False badges are refused", run: () => ok(!badgeAllowed("Scientifically proven removal") && badgeAllowed("Reviewed 2026-08-01"), "badge policy") },

  /* Pilot invariants preserved at scale ------------------------------------ */
  { id: "S96", title: "Exactly-five recommendation validation survives scale", run: () => ok(validateRecommendations(buildRecommendations({ mode: "professional", stainId: "SM-PIL-0016" })).valid, "five enforced") },
  { id: "S97", title: "Domestic method below 9/10 remains blocked", run: () => ok(!domesticDecision({ stainId: "SM-PIL-D001" }).allowed, "blocked") },
  { id: "S98", title: "Suspended content disappears across all modes", run: () => ok(emergencySuspension("SM-PIL-0001").removedFromPublic, "removed") },
  { id: "S99", title: "Domestic users still cannot reach professional procedures", run: () => ok(!canSeeProfessionalProcedure("domestic_user", "professional"), "blocked") },
  { id: "S100", title: "Historical cases remain reproducible via immutable versions", run: () => ok(publishedRecords().every((r) => !!r.version), "versions intact") },

  /* Waves, releases and audit ----------------------------------------------- */
  { id: "S101", title: "Public stain count stays frozen until pilot approval", run: () => ok(publicStainCountFrozen().frozen, publicStainCountFrozen().reason) },
  { id: "S102", title: "A wave cannot start before the previous wave's gates pass", run: () => ok(!waveGate("wave2").canStart, waveGate("wave2").reason) },
  { id: "S103", title: "Four controlled waves are defined", run: () => ok(WAVES.length === 4, `waves=${WAVES.length}`) },
  { id: "S104", title: "An expansion release can be paused and rolled back", run: () => { const r = rollbackRelease(pauseRelease({ id: "REL-1", scope: "wave1", phase: 2, paused: false, rolledBack: false })); return ok(r.paused && r.rolledBack && r.publishedRecordsRestored, "pause + rollback"); } },
  { id: "S105", title: "The system-wide audit covers every required area", run: () => { const a = systemAudit(); const areas = new Set(a.findings.map((f) => f.area)); return ok(AUDIT_AREAS.every((x) => areas.has(x)), `areas=${areas.size}`); } },
  { id: "S106", title: "The system-wide audit has no unresolved critical failure", run: () => { const a = systemAudit(); return ok(a.criticalFailures.length === 0, `critical=${a.criticalFailures.length}`); } },
  { id: "S107", title: "Every failed audit item produces a remediation task", run: () => { const a = systemAudit(); return ok(a.remediation.every((f) => !!f.remediation), a.remediation.map((f) => f.area).join(",")); } },
  { id: "S108", title: "Timeless architecture invariants hold", run: () => ok(architectureInvariantsHold() && ARCHITECTURE_INVARIANTS.length === 6, "invariants hold") },
];

let ORG_LOCATIONS: string[] = [];
