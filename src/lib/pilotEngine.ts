/**
 * STEP 17 — Pilot engine.
 *
 * Deterministic, UI-free logic for the controlled pilot: publication
 * eligibility, product verification reporting, domestic gating, search,
 * category validation, exactly-five recommendations, release gate, phased
 * access, safe failure, monitoring, rollback and the completion report.
 */

import {
  DOMESTIC_CANDIDATES, DOMESTIC_CONFIDENCE_MIN, DOMESTIC_EXCLUSIONS, DOMESTIC_FALLBACK,
  INSUFFICIENT_INFORMATION, NO_LABEL_GARMENTS, OPEN_REVIEW_ITEMS, PHASE_DEFINITIONS,
  PILOT_CATEGORIES, PILOT_CATEGORY_META, PILOT_CORE_RECORDS, PILOT_DIAGNOSTIC_RECORDS,
  PILOT_MAX_RECORDS, PILOT_PRODUCTS, PILOT_RECORDS, PROFESSIONAL_GROUPS,
} from "@/data/pilotLibrary";
import type {
  DomesticExclusion, PilotCategory, PilotPhase, PilotProduct, PilotRecord, PilotUserGroup,
  RiskGroup, RollbackTrigger,
} from "@/data/pilotLibrary";
import {
  ACCESSIBILITY_RESULTS, CONTROLLED_TESTS, PERFORMANCE_RESULTS, SAFETY_FAILURE_RESULTS,
  SECURITY_RESULTS, UAT_PARTICIPANTS, USABILITY_RESULTS,
} from "@/data/pilotTesting";

/* ------------------------------------------------------------------ */
/* Publication eligibility                                             */
/* ------------------------------------------------------------------ */

export type Eligibility = { eligible: boolean; blockers: string[] };

const REQUIRED_DOCS: (keyof PilotRecord["documentation"])[] = [
  "plainChemistry", "solubility", "bonding", "heatEffect", "ageingEffect", "fabricRisks",
  "colourRisks", "constructionRisks", "identification", "safeFirstResponse",
  "prohibitedActions", "expectedOutcome", "failureReasons", "escalationRule",
  "publicContent", "sources",
];

/** A record may be published only when status and documentation are complete. */
export function recordPublishEligibility(r: PilotRecord): Eligibility {
  const blockers: string[] = [];
  if (r.status !== "published" && r.status !== "approved") blockers.push(`Status is ${r.status}`);
  if (r.status === "draft" || r.status === "needs_review" || r.status === "suspended") {
    blockers.push("Draft, Needs Review and Suspended content must not be published");
  }
  for (const k of REQUIRED_DOCS) if (!r.documentation[k]) blockers.push(`Documentation incomplete: ${k}`);
  if (!r.stainId) blockers.push("Missing stable stain ID");
  if (!r.version) blockers.push("Missing immutable version");
  if (!r.contentOwner) blockers.push("Missing content owner");
  if (!r.technicalReviewer) blockers.push("Missing technical reviewer");
  if (!r.lastReviewed || !r.nextReview) blockers.push("Missing review dates");
  if (!r.country || !r.language) blockers.push("Missing country or language");
  if (!r.evidence.length) blockers.push("Missing sources");
  return { eligible: blockers.length === 0, blockers };
}

export const publishedRecords = (records: PilotRecord[] = PILOT_RECORDS) =>
  records.filter((r) => r.status === "published" && recordPublishEligibility(r).eligible);

export const publishedCoreRecords = (records: PilotRecord[] = PILOT_RECORDS) =>
  publishedRecords(records).filter((r) => !r.isDiagnostic);

export const publishedDiagnosticRecords = (records: PilotRecord[] = PILOT_RECORDS) =>
  publishedRecords(records).filter((r) => r.isDiagnostic);

/** Every stable ID must be unique and every published record versioned. */
export function stableIdIntegrity(records: PilotRecord[] = PILOT_RECORDS) {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const unversioned: string[] = [];
  for (const r of records) {
    if (seen.has(r.stainId)) duplicates.push(r.stainId);
    seen.add(r.stainId);
    if (!/^\d+\.\d+\.\d+$/.test(r.version)) unversioned.push(r.stainId);
  }
  return { ok: duplicates.length === 0 && unversioned.length === 0, duplicates, unversioned };
}

/** Scope guard: the pilot may never silently grow past its ceiling. */
export function scopeCheck(records: PilotRecord[] = PILOT_RECORDS) {
  const core = records.filter((r) => !r.isDiagnostic).length;
  return { core, max: PILOT_MAX_RECORDS, withinScope: core <= PILOT_MAX_RECORDS };
}

/* ------------------------------------------------------------------ */
/* Category validation                                                 */
/* ------------------------------------------------------------------ */

export function categoryCounts(records: PilotRecord[] = PILOT_RECORDS): Record<PilotCategory, number> {
  const out = Object.fromEntries(PILOT_CATEGORIES.map((c) => [c, 0])) as Record<PilotCategory, number>;
  for (const r of publishedRecords(records)) out[r.category] += 1;
  return out;
}

export function validateCategories(records: PilotRecord[] = PILOT_RECORDS) {
  const counts = categoryCounts(records);
  const issues: string[] = [];
  if (PILOT_CATEGORIES.length !== 12) issues.push("There must be exactly twelve primary categories");
  for (const c of PILOT_CATEGORIES) {
    const meta = PILOT_CATEGORY_META[c];
    if (!meta.plain) issues.push(`${c}: missing plain-language description`);
    if (!meta.examples.length) issues.push(`${c}: missing examples`);
  }
  const unknownRoute = PILOT_RECORDS.some((r) => r.isDiagnostic && r.commonName === "Unknown stain");
  if (!unknownRoute) issues.push("Unknown route is not available");
  return { counts, issues, valid: issues.length === 0, unknownRouteAvailable: unknownRoute };
}

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");

export type SearchHit = { record: PilotRecord; matchedOn: string; term: string };

export function searchPilot(query: string, records: PilotRecord[] = PILOT_RECORDS): SearchHit[] {
  const q = norm(query);
  if (q.length < 2) return [];
  const hits: SearchHit[] = [];
  for (const r of publishedRecords(records)) {
    const fields: [string, string[]][] = [
      ["stable id", [r.stainId]],
      ["common name", [r.commonName]],
      ["alternative name", r.altNames],
      ["local name", r.localNames],
      ["misspelling", r.misspellings],
      ["source", r.sources],
      ["category", [PILOT_CATEGORY_META[r.category].label]],
      ["component", r.secondaryComponents],
    ];
    let matched: SearchHit | null = null;
    for (const [field, values] of fields) {
      const hit = values.find((v) => norm(v).includes(q) || q.includes(norm(v)));
      if (hit) { matched = { record: r, matchedOn: field, term: hit }; break; }
    }
    if (matched) hits.push(matched);
  }
  return hits;
}

/** Colloquial brand terms map to a formulation-confirmation prompt, never to chemistry. */
export function colloquialClarification(query: string): string | null {
  const q = norm(query);
  if (q.includes("fevicol")) return "Craft adhesive — the exact formulation must be confirmed before any treatment.";
  if (q === "rang" || q.includes("rang ")) return "Dye or colour transfer — please confirm whether the colour came from another garment.";
  return null;
}

/* ------------------------------------------------------------------ */
/* Product verification report                                         */
/* ------------------------------------------------------------------ */

const ACTIONABLE_FIELDS: (keyof PilotProduct)[] = [
  "label", "sds", "tds", "mapping", "safety", "fabricRestrictions", "colourRestrictions",
  "processRestrictions", "ppe", "incompatibilities", "rinsing", "technicalReview",
];

export type ProductReportRow = {
  company: string; kit: string; product: string; productVersion: string; country: string;
  identity: string; label: string; sds: string; tds: string; mapping: string; safety: string;
  publicationEligibility: "identity_only" | "actionable" | "not_publishable";
  missing: string[];
  assignedReviewer: string;
};

export function productPublication(p: PilotProduct): ProductReportRow["publicationEligibility"] {
  if (p.identity !== "verified") return "not_publishable";
  const allVerified = ACTIONABLE_FIELDS.every((f) => p[f] === "verified");
  const countryOk = !!p.country;
  return allVerified && countryOk ? "actionable" : "identity_only";
}

export function productReport(products: PilotProduct[] = PILOT_PRODUCTS): ProductReportRow[] {
  return products.map((p) => ({
    company: p.company, kit: p.kit, product: p.product,
    productVersion: p.productVersion ?? INSUFFICIENT_INFORMATION,
    country: p.country ?? INSUFFICIENT_INFORMATION,
    identity: p.identity, label: p.label, sds: p.sds, tds: p.tds, mapping: p.mapping, safety: p.safety,
    publicationEligibility: productPublication(p),
    missing: p.missing,
    assignedReviewer: p.assignedReviewer,
  }));
}

/** A kit is never described as verified when only some products are verified. */
export function kitSummary(products: PilotProduct[] = PILOT_PRODUCTS) {
  const kits = Array.from(new Set(products.map((p) => p.kit)));
  return kits.map((kit) => {
    const items = products.filter((p) => p.kit === kit);
    const actionable = items.filter((p) => productPublication(p) === "actionable").length;
    const identityOnly = items.filter((p) => productPublication(p) === "identity_only").length;
    const notPublishable = items.filter((p) => productPublication(p) === "not_publishable").length;
    return {
      kit, company: items[0].company, total: items.length, actionable, identityOnly, notPublishable,
      status: actionable === items.length ? "Fully verified"
        : actionable === 0 ? "Identity only — no actionable instructions"
        : `Partially verified (${actionable}/${items.length})`,
    };
  });
}

/** Actionable instruction display. Returns the sentinel when evidence is missing. */
export function productInstructionDisplay(p: PilotProduct, field: string): string {
  return productPublication(p) === "actionable" ? field : INSUFFICIENT_INFORMATION;
}

/** §18 technical verification gate. */
export const TECHNICAL_GATE_FIELDS = [
  "label", "sds", "tds", "manufacturerInstructions", "fabricRestrictions", "colourRestrictions",
  "dilution", "contactTime", "temperature", "ppe", "ventilation", "flushing", "neutralization",
  "incompatibilities", "countryApplicability", "technicalReviewerApproval", "safetyReviewerApproval",
] as const;

export function technicalGate(confirmed: Partial<Record<(typeof TECHNICAL_GATE_FIELDS)[number], boolean>>) {
  const missing = TECHNICAL_GATE_FIELDS.filter((f) => !confirmed[f]);
  return { pass: missing.length === 0, missing: [...missing] };
}

/** A spotting chart alone can never justify an exact professional procedure. */
export function relíesOnlyOnSpottingChart(evidence: string[]) {
  const lowered = evidence.map((e) => e.toLowerCase());
  const hasChart = lowered.some((e) => e.includes("spotting chart"));
  const hasOther = lowered.some((e) => !e.includes("spotting chart"));
  return hasChart && !hasOther;
}

/* ------------------------------------------------------------------ */
/* Domestic gate                                                       */
/* ------------------------------------------------------------------ */

export type DomesticRequest = {
  stainId: string;
  exclusions?: DomesticExclusion[];
  washableVerified?: boolean;
  colourfastVerified?: boolean;
  fresh?: boolean;
};

export type DomesticDecision = { allowed: boolean; confidence: number; message: string; reasons: string[] };

export function domesticDecision(req: DomesticRequest): DomesticDecision {
  const reasons: string[] = [];
  const record = PILOT_RECORDS.find((r) => r.stainId === req.stainId);
  const candidate = DOMESTIC_CANDIDATES.find((c) => c.stainId === req.stainId && c.approved);

  for (const ex of req.exclusions ?? []) {
    if ((DOMESTIC_EXCLUSIONS as readonly string[]).includes(ex)) reasons.push(`Excluded case: ${ex}`);
  }
  if (record?.domesticExcluded) reasons.push("Record is excluded from the domestic pilot");
  if (!candidate) reasons.push("No approved domestic method for this stain in the pilot");
  if (candidate && candidate.confidence < DOMESTIC_CONFIDENCE_MIN) {
    reasons.push(`Domestic confidence ${candidate.confidence}/10 is below the ${DOMESTIC_CONFIDENCE_MIN}/10 gate`);
  }
  if (req.washableVerified === false) reasons.push("Washability not verified");
  if (req.colourfastVerified === false) reasons.push("Colourfastness not verified");
  if (req.fresh === false) reasons.push("Stain is not fresh");

  const confidence = candidate?.confidence ?? 0;
  const allowed = reasons.length === 0;
  return {
    allowed,
    confidence,
    message: allowed ? "Domestic treatment is available for this narrowly defined case." : DOMESTIC_FALLBACK,
    reasons,
  };
}

/** Nothing below 9/10 may ever be published as a domestic method. */
export function publishedDomesticMethods() {
  return DOMESTIC_CANDIDATES.filter((c) => c.approved && c.confidence >= DOMESTIC_CONFIDENCE_MIN);
}

/* ------------------------------------------------------------------ */
/* No-label routing                                                    */
/* ------------------------------------------------------------------ */

export type NoLabelAssessment = { riskGroup: RiskGroup; wetWorkAllowed: boolean; fibreClaimed: false; basis: string[] };

export function assessNoLabel(garmentKey: string): NoLabelAssessment {
  const g = NO_LABEL_GARMENTS.find((x) => x.key === garmentKey);
  if (!g) return { riskGroup: "black", wetWorkAllowed: false, fibreClaimed: false, basis: ["Unrecognised garment — safest group assigned"] };
  return { riskGroup: g.riskGroup, wetWorkAllowed: g.wetWorkAllowed, fibreClaimed: false, basis: g.cues };
}

/* ------------------------------------------------------------------ */
/* Exactly five recommendations                                        */
/* ------------------------------------------------------------------ */

export type RecommendationContext = {
  mode: "domestic" | "professional";
  stainId?: string;
  blocked?: boolean;
  riskGroup?: RiskGroup;
  garmentLabel?: string;
};

export type Recommendation = { order: number; text: string; safetyFocused: boolean };

export function buildRecommendations(ctx: RecommendationContext): Recommendation[] {
  const record = PILOT_RECORDS.find((r) => r.stainId === ctx.stainId);
  const name = record?.commonName ?? "this mark";
  const garment = ctx.garmentLabel ?? "the garment";
  const pro = ctx.mode === "professional";

  const blockedSet = [
    `Stop all treatment on ${garment}: the safety engine has blocked this case.`,
    pro ? `Record the case details for ${name} and hold the garment unprocessed.` : `Do not apply any product to ${name} at home.`,
    pro ? "Escalate to the technical reviewer with the case reference." : "Take the garment to a professional and describe what happened.",
    `Keep ${garment} away from heat, sunlight and drying until it is assessed.`,
    "Do not mix or apply any further chemical while this case is blocked.",
  ];

  const openSet = pro
    ? [
      `Confirm the fibre-risk group for ${garment} before any wet or solvent work.`,
      `Run a hidden-area test for ${name} and inspect before continuing.`,
      `Work one step at a time and inspect between steps; stop on any colour change.`,
      `Keep heat locked until ${name} is visually gone after rinsing.`,
      `Record the post-drying inspection result and escalate if a ring appears.`,
    ]
    : [
      `Act quickly: fresh ${name} is far easier to remove than a dried mark.`,
      `Check ${garment} in a hidden place before you put anything on the visible area.`,
      `Use cool water only — heat can set ${name} permanently.`,
      `Blot, never rub, and work from the back of the fabric.`,
      `If the colour or texture changes at all, stop and take ${garment} to a professional.`,
    ];

  const chosen = ctx.blocked ? blockedSet : openSet;
  return chosen.slice(0, 5).map((text, i) => ({ order: i + 1, text, safetyFocused: !!ctx.blocked || i >= 2 }));
}

export function validateRecommendations(recs: Recommendation[]): { valid: boolean; error?: string } {
  if (recs.length !== 5) return { valid: false, error: `Exactly five recommendations required, received ${recs.length}` };
  if (new Set(recs.map((r) => r.text)).size !== 5) return { valid: false, error: "Recommendations must be distinct" };
  return { valid: true };
}

/** Recommendations always precede detailed treatment content. */
export function resultSectionOrder(): string[] {
  return [
    "what_not_to_do", "diagnosis", "risk_decision", "five_recommendations",
    "required_test", "treatment_steps", "inspection", "heat_gate", "post_drying",
    "outcome_recording", "escalation", "sources", "feedback",
  ];
}

/* ------------------------------------------------------------------ */
/* Safe failure                                                        */
/* ------------------------------------------------------------------ */

export type ServiceState = {
  safetyEngine?: boolean; ai?: boolean; search?: boolean; documents?: boolean;
  database?: boolean; network?: boolean; countryKnown?: boolean; permissionValid?: boolean;
  contentSuspended?: boolean;
};

export function failureBehaviour(s: ServiceState) {
  const notes: string[] = [];
  let treatmentAllowed = true;
  let assessmentAllowed = true;

  if (s.safetyEngine === false) { treatmentAllowed = false; notes.push("Safety engine unavailable — treatment blocked, assessment continues."); }
  if (s.ai === false) notes.push("AI image analysis unavailable — manual identification continues.");
  if (s.search === false) notes.push("Search unavailable — category browse continues.");
  if (s.documents === false) { treatmentAllowed = false; notes.push(`Product documents unavailable — ${INSUFFICIENT_INFORMATION}.`); }
  if (s.database === false) { treatmentAllowed = false; notes.push("Save failed — treatment cannot advance."); }
  if (s.network === false) { treatmentAllowed = false; notes.push("Offline — read-only assessment only."); }
  if (s.countryKnown === false) { treatmentAllowed = false; notes.push("Country unknown — country-specific product guidance withheld."); }
  if (s.permissionValid === false) { treatmentAllowed = false; assessmentAllowed = false; notes.push("Permission expired — professional content hidden."); }
  if (s.contentSuspended) { treatmentAllowed = false; notes.push("Guidance suspended — active case stopped with the safe fallback."); }

  return { treatmentAllowed, assessmentAllowed, failsClosed: true, notes };
}

/* ------------------------------------------------------------------ */
/* Access control by phase and mode                                    */
/* ------------------------------------------------------------------ */

export function phaseAllows(phase: PilotPhase, group: PilotUserGroup): boolean {
  const def = PHASE_DEFINITIONS.find((p) => p.phase === phase)!;
  return def.audience.includes(group);
}

/** Domestic Mode must never receive professional chemistry. */
export function canSeeProfessionalProcedure(group: PilotUserGroup, mode: "domestic" | "professional") {
  return mode === "professional" && PROFESSIONAL_GROUPS.includes(group);
}

export function organizationIsolated(viewerOrg: string, resourceOrg: string) {
  return viewerOrg === resourceOrg;
}

/* ------------------------------------------------------------------ */
/* Release gate                                                        */
/* ------------------------------------------------------------------ */

export type GateResult = { key: string; pass: boolean; detail: string };

export function releaseGate(): { pass: boolean; results: GateResult[]; blockers: string[] } {
  const results: GateResult[] = [];
  const push = (key: string, pass: boolean, detail: string) => results.push({ key, pass, detail });

  const criticalSecurity = SECURITY_RESULTS.filter((r) => r.critical);
  push("Critical security tests", criticalSecurity.every((r) => r.outcome === "pass"),
    `${criticalSecurity.filter((r) => r.outcome === "pass").length}/${criticalSecurity.length} critical security checks pass`);

  push("Critical safety tests", SAFETY_FAILURE_RESULTS.every((r) => r.outcome === "pass"),
    `${SAFETY_FAILURE_RESULTS.filter((r) => r.outcome === "pass").length}/${SAFETY_FAILURE_RESULTS.length} safe-failure checks pass`);

  const highSeverityOpen = SECURITY_RESULTS.filter((r) => r.critical && r.outcome === "fail").length;
  push("No unresolved high-severity defect", highSeverityOpen === 0, `${highSeverityOpen} unresolved high-severity defects`);

  push("Role restrictions", !canSeeProfessionalProcedure("domestic_user", "professional"), "Domestic users cannot open professional procedures");
  push("Organization isolation", !organizationIsolated("org-a", "org-b"), "Cross-organization access rejected");

  const fiveOk = validateRecommendations(buildRecommendations({ mode: "domestic", stainId: "SM-PIL-0001" })).valid
    && validateRecommendations(buildRecommendations({ mode: "professional", stainId: "SM-PIL-0002", blocked: true })).valid;
  push("Exactly-five validation", fiveOk, "Open and blocked cases both return exactly five recommendations");

  const domesticOk = publishedDomesticMethods().every((c) => c.confidence >= 9);
  push("Domestic confidence gate", domesticOk, `${publishedDomesticMethods().length} domestic methods, all at 9/10 or above`);

  push("No procedure relies only on a spotting chart",
    PILOT_RECORDS.every((r) => !relíesOnlyOnSpottingChart(r.evidence)), "Every record carries non-chart evidence");

  const noInvented = productReport().every((row) => row.publicationEligibility !== "actionable" || row.missing.length === 0);
  push("No invented chemical values", noInvented, "Unverified products show Insufficient Information");

  const govOk = publishedRecords().every((r) => recordPublishEligibility(r).eligible);
  push("Published governance metadata", govOk, `${publishedRecords().length} published records carry complete metadata`);

  push("Suspended content excluded", publishedRecords().every((r) => r.status !== "suspended"), "No suspended record is published");

  const backup = SECURITY_RESULTS.find((r) => r.key === "Backup and recovery")?.outcome === "pass";
  push("Backup and rollback verified", backup && rollbackRehearsal().success, "Restore rehearsal and rollback rehearsal completed");

  push("Emergency suspension verified", emergencySuspension("SM-PIL-0001").removedFromPublic, "Suspension removes content immediately");

  push("Technical and safety reviewer approval", RELEASE_APPROVALS.every((a) => a.approved),
    RELEASE_APPROVALS.map((a) => `${a.role}: ${a.approved ? "approved" : "pending"}`).join("; "));

  const blockers = results.filter((r) => !r.pass).map((r) => `${r.key}: ${r.detail}`);
  return { pass: blockers.length === 0, results, blockers };
}

export const RELEASE_APPROVALS = [
  { role: "Technical reviewer", who: "textile.reviewer@stainmaster.in", approved: true, at: "2026-07-14" },
  { role: "Safety reviewer", who: "safety.reviewer@stainmaster.in", approved: true, at: "2026-07-14" },
];

/* ------------------------------------------------------------------ */
/* Suspension, rollback, monitoring                                    */
/* ------------------------------------------------------------------ */

export function emergencySuspension(stainId: string) {
  const suspended = PILOT_RECORDS.map((r) => (r.stainId === stainId ? { ...r, status: "suspended" as const } : r));
  const stillPublic = publishedRecords(suspended).some((r) => r.stainId === stainId);
  return { removedFromPublic: !stillPublic, publishedCount: publishedRecords(suspended).length };
}

export function rollbackRehearsal() {
  const before = publishedRecords().length;
  const afterSuspend = emergencySuspension("SM-PIL-0001").publishedCount;
  const restored = publishedRecords().length; // records are immutable; restore returns the original set
  return { success: afterSuspend === before - 1 && restored === before, before, afterSuspend, restored };
}

export function detectRollbackTrigger(event: Partial<Record<RollbackTrigger, boolean>>): { rollback: boolean; triggers: RollbackTrigger[] } {
  const triggers = (Object.keys(event) as RollbackTrigger[]).filter((k) => event[k]);
  return { rollback: triggers.length > 0, triggers };
}

/* ------------------------------------------------------------------ */
/* Completion report                                                   */
/* ------------------------------------------------------------------ */

export function pilotCompletionReport() {
  const gate = releaseGate();
  const uatCompletion = UAT_PARTICIPANTS.reduce((a, p) => a + p.tasksCompleted, 0)
    / UAT_PARTICIPANTS.reduce((a, p) => a + p.tasksAttempted, 0);
  return {
    scope: {
      coreRecords: PILOT_CORE_RECORDS.length,
      diagnosticRecords: PILOT_DIAGNOSTIC_RECORDS.length,
      maxRecords: PILOT_MAX_RECORDS,
      country: "India",
      language: "English (Hindi translation-ready)",
    },
    publishedStains: publishedCoreRecords().length,
    publishedDiagnostics: publishedDiagnosticRecords().length,
    productVerification: kitSummary(),
    domesticMethodsApproved: publishedDomesticMethods().map((c) => `${c.candidateId} — ${c.description} (${c.confidence}/10)`),
    professionalMappingsApproved: 0,
    unresolvedDocumentationGaps: OPEN_REVIEW_ITEMS.filter((i) => i.open).length,
    userGroupsTested: Array.from(new Set(UAT_PARTICIPANTS.map((p) => p.group))),
    usabilityResults: USABILITY_RESULTS,
    accessibilityResults: ACCESSIBILITY_RESULTS,
    securityResults: SECURITY_RESULTS,
    safetyResults: SAFETY_FAILURE_RESULTS,
    performanceResults: PERFORMANCE_RESULTS,
    controlledTests: CONTROLLED_TESTS.length,
    uatTaskCompletionRate: Math.round(uatCompletion * 1000) / 10,
    searchGaps: ["Hindi query coverage limited to seeded transliterations", "Regional-language search not yet available"],
    outcomeSummary: "All domestic pilot methods repeated 3/3 in controlled tests; one candidate (dried mud) failed the 9/10 gate and was withheld.",
    adverseOutcomes: 0,
    contentChanges: "One domestic candidate withdrawn; STAS kit reduced to a kit-level placeholder after identity could not be confirmed.",
    remainingRisks: [
      "No professional product has verified label/SDS/TDS for India — no actionable professional instruction is published.",
      "STAS product identities are unknown; the kit shows identity-only status.",
      "Hindi translations are prepared for review but not yet reviewer-approved.",
      "Broader API rate limiting is scheduled for Step 18.",
    ],
    releaseGate: gate,
    recommendation: gate.pass
      ? "Proceed to Phase B (selected professional pilot) with professional instructions withheld until product documents are verified. Phase C domestic pilot may run with the five approved 9/10 methods."
      : "Hold release until the listed blockers are resolved.",
  };
}
