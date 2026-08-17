/**
 * STEP 6 — Master stain database engine.
 * Stain ID allocation, alias/variant resolution, search, duplicate detection,
 * publication validation, review triggers, role-based views and Excel export.
 */

import {
  MASTER_STAINS, MASTER_BY_KEY, LAST_ALLOCATED_SEQUENCE, formatStainId,
  DOMESTIC_NOT_RECOMMENDED, INSUFFICIENT_INFORMATION, UNDER_REVIEW, MIN_DOMESTIC_CONFIDENCE,
  RECORD_STATUS_LABEL, FABRIC_LABEL, OUTCOME_LABEL, PROHIBITION_LABEL, PROFESSIONAL_ROLES,
} from "@/data/masterStains";
import type {
  MasterStain, RecordStatus, AudienceRole, ReviewTrigger, FabricKey, Alias,
} from "@/data/masterStains";
import { CATEGORY_LABEL } from "@/data/stainKnowledge";

export const ENGINE_VERSION = "step6-v1";

/* ---------------- Stain ID allocation ---------------- */

/**
 * IDs are allocated strictly upwards from the highest ID ever seen — including
 * archived records — so an archived Stain ID is never reused.
 */
export function allocateStainId(existing: MasterStain[]): string {
  const nums = existing
    .map((s) => Number(s.stainId.replace("SM-STN-", "")))
    .filter((n) => Number.isFinite(n));
  const max = Math.max(LAST_ALLOCATED_SEQUENCE, ...(nums.length ? nums : [0]));
  return formatStainId(max + 1);
}

/* ---------------- Search and discovery ---------------- */

const norm = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\u0900-\u097F ]/g, "").trim();

/** Cheap Levenshtein for fuzzy / misspelling matching. */
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

export type SearchHit = {
  stain: MasterStain;
  score: number;
  matchedOn: string;
  matchType: "name" | "alias" | "local" | "misspelling" | "source" | "stain_id" | "category" | "fuzzy";
};

export type SearchOptions = {
  role?: AudienceRole;
  /** Administrators may search every status. */
  includeAllStatuses?: boolean;
  category?: string;
  riskOnly?: boolean;
  limit?: number;
};

export function isPubliclyVisible(s: MasterStain) {
  return s.governance.status === "published" && s.governance.published;
}

export function searchStains(
  query: string,
  all: MasterStain[] = MASTER_STAINS,
  opts: SearchOptions = {},
): SearchHit[] {
  const pool = opts.includeAllStatuses ? all : all.filter(isPubliclyVisible);
  const q = norm(query);
  const hits: SearchHit[] = [];

  for (const s of pool) {
    if (opts.category && s.primaryCategory !== opts.category) continue;
    if (!q) {
      hits.push({ stain: s, score: 1, matchedOn: s.canonicalName, matchType: "name" });
      continue;
    }
    let best: SearchHit | null = null;
    const consider = (score: number, matchedOn: string, matchType: SearchHit["matchType"]) => {
      if (!best || score > best.score) best = { stain: s, score, matchedOn, matchType };
    };

    const name = norm(s.canonicalName);
    if (name === q) consider(100, s.canonicalName, "name");
    else if (name.startsWith(q)) consider(90, s.canonicalName, "name");
    else if (name.includes(q)) consider(75, s.canonicalName, "name");

    if (norm(s.stainId) === q || s.stainId.toLowerCase() === query.toLowerCase().trim())
      consider(100, s.stainId, "stain_id");

    for (const a of s.aliases) {
      const av = norm(a.alias);
      const type: SearchHit["matchType"] =
        a.type === "local_name" || a.type === "transliteration" ? "local" : a.type === "misspelling" ? "misspelling" : "alias";
      if (av === q) consider(95 + a.searchPriority, a.alias, type);
      else if (av.startsWith(q)) consider(80 + a.searchPriority, a.alias, type);
      else if (av.includes(q)) consider(65, a.alias, type);
    }

    for (const src of s.commonSources) {
      if (norm(src.name).includes(q)) consider(55, src.name, "source");
    }
    if (norm(CATEGORY_LABEL[s.primaryCategory]).includes(q)) consider(40, CATEGORY_LABEL[s.primaryCategory], "category");

    if (!best) {
      const candidates = [s.canonicalName, ...s.aliases.map((a) => a.alias)];
      for (const c of candidates) {
        const d = editDistance(norm(c), q);
        const tolerance = q.length <= 4 ? 1 : q.length <= 7 ? 2 : 3;
        if (d <= tolerance) consider(50 - d * 5, c, "fuzzy");
      }
    }
    if (best) hits.push(best);
  }

  hits.sort((a, b) => b.score - a.score || a.stain.canonicalName.localeCompare(b.stain.canonicalName));
  return opts.limit ? hits.slice(0, opts.limit) : hits;
}

export function autocomplete(query: string, all: MasterStain[] = MASTER_STAINS, admin = false): string[] {
  return searchStains(query, all, { includeAllStatuses: admin, limit: 8 }).map((h) =>
    h.matchType === "name" ? h.stain.canonicalName : `${h.matchedOn} → ${h.stain.canonicalName}`,
  );
}

/* ---------------- Canonical / variant handling ---------------- */

export function canonicalOf(s: MasterStain, all: MasterStain[] = MASTER_STAINS): MasterStain {
  if (!s.canonicalOf) return s;
  return all.find((x) => x.key === s.canonicalOf) ?? s;
}

export function variantsOf(s: MasterStain, all: MasterStain[] = MASTER_STAINS): MasterStain[] {
  return all.filter((x) => x.canonicalOf === s.key);
}

/* ---------------- Duplicate detection ---------------- */

export type DuplicateDecision =
  | "create_new_canonical" | "add_alias" | "add_variant" | "link_related"
  | "restore_archived" | "reviewer_decision";

export type DuplicateFinding = {
  match: MasterStain;
  reason: string;
  suggestion: DuplicateDecision;
  safetyCritical: boolean;
};

export function detectDuplicates(
  name: string,
  aliases: string[] = [],
  all: MasterStain[] = MASTER_STAINS,
): DuplicateFinding[] {
  const terms = [name, ...aliases].map(norm).filter(Boolean);
  const out: DuplicateFinding[] = [];
  for (const s of all) {
    const pool = [s.canonicalName, ...s.aliases.map((a) => a.alias), ...s.commonSources.map((c) => c.name)];
    for (const t of terms) {
      const exact = pool.some((p) => norm(p) === t);
      const near = pool.some((p) => editDistance(norm(p), t) <= 2);
      if (exact || near) {
        const archived = s.governance.status === "archived";
        out.push({
          match: s,
          reason: exact
            ? `"${t}" already exists on ${s.stainId} (${s.canonicalName}).`
            : `"${t}" is very close to ${s.stainId} (${s.canonicalName}).`,
          suggestion: archived
            ? "restore_archived"
            : exact
              ? "add_alias"
              : s.isDamageDiagnosis
                ? "reviewer_decision"
                : "add_variant",
          safetyCritical: Boolean(s.isDamageDiagnosis) || s.governance.status === "published",
        });
        break;
      }
    }
  }
  return out;
}

/* ---------------- Publication validation (§33) ---------------- */

export type ValidationIssue = { rule: string; ok: boolean; detail: string };

export function validateForPublication(s: MasterStain): ValidationIssue[] {
  const has = (v: unknown) => Array.isArray(v) ? v.length > 0 : Boolean(v);
  const conditionCovered = (k: string) => s.conditionEffects.some((c) => c.condition === k);
  const rules: ValidationIssue[] = [
    { rule: "Stain ID exists", ok: /^SM-STN-\d{6}$/.test(s.stainId), detail: s.stainId },
    { rule: "Canonical name exists", ok: has(s.canonicalName), detail: s.canonicalName },
    { rule: "Exactly one primary category", ok: has(s.primaryCategory), detail: CATEGORY_LABEL[s.primaryCategory] },
    { rule: "Classification confidence recorded", ok: s.classificationConfidence > 0, detail: `${s.classificationConfidence}/9` },
    { rule: "At least one credible source", ok: s.evidence.length > 0 && s.governance.sourceDocuments.length > 0, detail: `${s.evidence.length} evidence records` },
    { rule: "Heat effect addressed", ok: has(s.science.heat) && conditionCovered("heat_exposed"), detail: s.science.heat },
    { rule: "Ageing effect addressed", ok: has(s.science.ageing) && conditionCovered("aged"), detail: s.science.ageing },
    { rule: "Fabric risks addressed", ok: s.fabricRules.length >= 3, detail: `${s.fabricRules.length} fabric rules` },
    { rule: "Colour risks addressed", ok: s.colourRules.length >= 3, detail: `${s.colourRules.length} colour rules` },
    { rule: "Safe first response addressed", ok: s.firstResponses.some((f) => f.approval === "approved"), detail: `${s.firstResponses.length} first-response records` },
    { rule: "Prohibited actions addressed", ok: s.prohibitions.length > 0, detail: `${s.prohibitions.length} prohibitions` },
    { rule: "Expected outcome is realistic", ok: s.expectedOutcomes.length > 0 && !/complete removal guaranteed/i.test(JSON.stringify(s.expectedOutcomes)), detail: OUTCOME_LABEL[s.expectedOutcomes[0]?.outcome ?? "uncertain"] },
    { rule: "Escalation rule exists", ok: has(s.failure.escalationPoint), detail: s.failure.escalationPoint },
    { rule: "Public disclaimer exists", ok: has(s.publicContent.disclaimer), detail: "present" },
    { rule: "Content owner exists", ok: has(s.governance.contentOwner), detail: s.governance.contentOwner },
    { rule: "Technical reviewer exists", ok: has(s.governance.technicalReviewer), detail: s.governance.technicalReviewer ?? "missing" },
    { rule: "Country applicability exists", ok: s.governance.countries.length > 0, detail: s.governance.countries.join(", ") },
    { rule: "Review date exists", ok: has(s.governance.nextReview), detail: s.governance.nextReview ?? "missing" },
    { rule: "No unresolved critical warning", ok: !s.evidence.some((e) => e.verification === "disputed"), detail: "no disputed evidence" },
    { rule: "No unverified professional procedure published", ok: s.stageLinks.every((l) => l.approval !== "approved") || s.stageLinks.every((l) => l.evidence !== "user_report"), detail: "treatment procedures remain under separate verification" },
    { rule: "No unapproved domestic treatment published", ok: s.domesticStatus !== "approved_domestic_treatment" || s.domesticConfidence >= MIN_DOMESTIC_CONFIDENCE, detail: DOMESTIC_NOT_RECOMMENDED },
  ];
  return rules;
}

export const canPublish = (s: MasterStain) => validateForPublication(s).every((r) => r.ok);

export function sectionCompletion(s: MasterStain): { section: string; complete: boolean }[] {
  return [
    { section: "Identity", complete: Boolean(s.canonicalName && s.stainId && s.shortDescription) },
    { section: "Classification", complete: Boolean(s.primaryCategory && s.classificationConfidence) },
    { section: "Sources", complete: s.commonSources.length > 0 },
    { section: "Stain science", complete: Boolean(s.science.heat && s.science.ageing) },
    { section: "Identification", complete: Boolean(s.identification.appearance) },
    { section: "Fabric risks", complete: s.fabricRules.length >= 3 },
    { section: "Colour risks", complete: s.colourRules.length >= 3 },
    { section: "Condition effects", complete: s.conditionEffects.length >= 5 },
    { section: "Safe first response", complete: s.firstResponses.length > 0 },
    { section: "Treatment principles", complete: s.stageLinks.length > 0 },
    { section: "Prohibited actions", complete: s.prohibitions.length > 0 },
    { section: "Expected outcome", complete: s.expectedOutcomes.length > 0 },
    { section: "Failure and escalation", complete: Boolean(s.failure.escalationPoint) },
    { section: "Public content", complete: Boolean(s.publicContent.shortAnswer) },
    { section: "Technical content", complete: Boolean(s.technicalContent.detailedScience) },
    { section: "Evidence and governance", complete: s.evidence.length > 0 && Boolean(s.governance.technicalReviewer) },
    { section: "Localization", complete: s.localizations.length > 0 },
    { section: "Revision history", complete: s.revisions.length > 0 },
  ];
}

/* ---------------- Review triggers (§26) ---------------- */

export type ReviewFlag = { trigger: ReviewTrigger; sections: string[]; note: string; date: string };

export function evaluateReviewTriggers(
  s: MasterStain,
  signals: Partial<Record<ReviewTrigger, string>> = {},
  today = new Date().toISOString().slice(0, 10),
): ReviewFlag[] {
  const flags: ReviewFlag[] = [];
  const push = (trigger: ReviewTrigger, sections: string[], note: string) =>
    flags.push({ trigger, sections, note, date: today });

  if (s.governance.nextReview && s.governance.nextReview < today)
    push("review_date_expired", ["governance"], `Review date ${s.governance.nextReview} has passed.`);

  for (const loc of s.localizations) {
    if (loc.sourceVersion < s.governance.contentVersion && loc.translationStatus !== "not_started")
      push("translation_outdated", [`localization:${loc.language}`], `The ${loc.language} translation is linked to version ${loc.sourceVersion} but the source is at version ${s.governance.contentVersion}.`);
  }

  const sectionMap: Partial<Record<ReviewTrigger, string[]>> = {
    product_formulation_changed: ["productMappings", "technicalContent"],
    label_changed: ["evidence", "commonSources"],
    sds_changed: ["evidence", "prohibitions"],
    tds_changed: ["evidence", "stageLinks"],
    manufacturer_instruction_changed: ["stageLinks", "technicalContent"],
    new_fabric_restriction: ["fabricRules", "prohibitions"],
    repeated_failures: ["failure", "expectedOutcomes"],
    repeated_damage_reports: ["fabricRules", "prohibitions", "expectedOutcomes"],
    better_evidence: ["evidence", "science"],
    treatment_suspended: ["stageLinks", "domesticStatus"],
  };
  for (const [trigger, note] of Object.entries(signals) as [ReviewTrigger, string][]) {
    if (!note) continue;
    push(trigger, sectionMap[trigger] ?? ["record"], note);
  }
  return flags;
}

/* ---------------- Role-based views (§21, §23) ---------------- */

export const isProfessional = (role: AudienceRole) => PROFESSIONAL_ROLES.includes(role);

export function publicView(s: MasterStain) {
  return {
    stainId: s.stainId,
    name: s.canonicalName,
    riskIndicator: s.isDamageDiagnosis
      ? "Damage — cannot be cleaned off"
      : s.riskTags.includes("professional_only")
        ? "Professional assessment recommended"
        : "Assess before treating",
    ...s.publicContent,
    isDamageDiagnosis: Boolean(s.isDamageDiagnosis),
    damageInterpretation: s.damageInterpretation,
    likelyStainType: CATEGORY_LABEL[s.primaryCategory],
    safeFirstResponse: s.firstResponses.filter((f) => f.approval === "approved" && f.roles.includes("public")),
    domesticStatus:
      s.domesticStatus === "approved_domestic_treatment" && s.domesticConfidence >= MIN_DOMESTIC_CONFIDENCE
        ? "Approved domestic treatment available"
        : DOMESTIC_NOT_RECOMMENDED,
    actionsToAvoid: s.prohibitions.filter((p) => p.roles.includes("public")),
    expectedResult: OUTCOME_LABEL[s.expectedOutcomes[0]?.outcome ?? "uncertain"],
    lastReviewed: s.governance.lastReviewed ?? "Not yet reviewed",
  };
}

/** Returns null for roles that are not permitted to see technical content. */
export function professionalView(s: MasterStain, role: AudienceRole) {
  if (!isProfessional(role)) return null;
  return {
    ...s.technicalContent,
    science: s.science,
    classification: {
      category: CATEGORY_LABEL[s.primaryCategory],
      confidence: s.classificationConfidence,
      components: s.secondaryComponents,
      evidence: s.classificationEvidence,
      version: s.classificationVersion,
    },
    fabricMatrix: s.fabricRules,
    colourMatrix: s.colourRules,
    stageSequence: s.stageLinks,
    failure: s.failure,
    evidence: s.evidence,
    productMapping: UNDER_REVIEW,
  };
}

/* ---------------- Excel-ready export (§24) ---------------- */

export const EXPORT_COLUMNS = [
  "Stain ID", "Common Name", "Alternative Names", "Category", "Common Sources", "Chemistry",
  "Fabrics at Risk", "Heat Warning", "First Response", "Professional Product 1",
  "Professional Product 2", "Professional Product 3", "Domestic Treatment", "Do Not Use",
  "Escalation Rule", "Confidence", "Source", "Version", "Review Date",
] as const;

export function exportRow(s: MasterStain): Record<(typeof EXPORT_COLUMNS)[number], string> {
  const risky = s.fabricRules.filter((f) => f.testRequired).map((f) => FABRIC_LABEL[f.fabric as FabricKey] ?? String(f.fabric));
  return {
    "Stain ID": s.stainId,
    "Common Name": s.canonicalName,
    "Alternative Names": s.aliases.map((a) => a.alias).join("; ") || INSUFFICIENT_INFORMATION,
    Category: CATEGORY_LABEL[s.primaryCategory],
    "Common Sources": s.commonSources.map((c) => c.name).join("; ") || INSUFFICIENT_INFORMATION,
    Chemistry: s.science.composition,
    "Fabrics at Risk": risky.join("; ") || INSUFFICIENT_INFORMATION,
    "Heat Warning": s.science.heat,
    "First Response": s.firstResponses[0]?.action ?? INSUFFICIENT_INFORMATION,
    "Professional Product 1": UNDER_REVIEW,
    "Professional Product 2": UNDER_REVIEW,
    "Professional Product 3": UNDER_REVIEW,
    "Domestic Treatment":
      s.domesticStatus === "approved_domestic_treatment" && s.domesticConfidence >= MIN_DOMESTIC_CONFIDENCE
        ? "Approved domestic treatment"
        : DOMESTIC_NOT_RECOMMENDED,
    "Do Not Use": s.prohibitions.map((p) => `${PROHIBITION_LABEL[p.type]} (${p.condition})`).join("; "),
    "Escalation Rule": s.failure.escalationPoint,
    Confidence: `${s.classificationConfidence}/9`,
    Source: s.evidence.map((e) => e.source).join("; ") || INSUFFICIENT_INFORMATION,
    Version: String(s.governance.contentVersion),
    "Review Date": s.governance.nextReview ?? INSUFFICIENT_INFORMATION,
  };
}

const csvCell = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;

export function exportCsv(stains: MasterStain[] = MASTER_STAINS): string {
  const rows = stains.map(exportRow);
  return [
    EXPORT_COLUMNS.join(","),
    ...rows.map((r) => EXPORT_COLUMNS.map((c) => csvCell(r[c])).join(",")),
  ].join("\n");
}

/* ---------------- Status helpers ---------------- */

export const statusLabel = (s: RecordStatus) => RECORD_STATUS_LABEL[s];

export function applyStatusChange(
  s: MasterStain,
  next: RecordStatus,
  by: string,
  reason: string,
  sections?: string[],
): MasterStain {
  const version = next === "published" || next === "approved" ? s.governance.contentVersion + 1 : s.governance.contentVersion;
  return {
    ...s,
    governance: {
      ...s.governance,
      status: next,
      published: next === "published",
      contentVersion: version,
      revisionReason: reason,
      lastReviewed: next === "approved" || next === "published" ? new Date().toISOString().slice(0, 10) : s.governance.lastReviewed,
    },
    revisions: [
      ...s.revisions,
      { version, date: new Date().toISOString().slice(0, 10), by, reason, status: next, sections },
    ],
  };
}

export { MASTER_STAINS, MASTER_BY_KEY };
export type { MasterStain, Alias };
