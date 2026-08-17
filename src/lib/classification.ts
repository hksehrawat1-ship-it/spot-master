/**
 * Step 5 — Universal Stain Classification engine.
 *
 * Rules-assisted and fully reviewable: every output carries the rule that produced it.
 * CLASSIFICATION ONLY — no products, procedures, quantities, contact times,
 * temperatures, rinsing or neutralization are produced anywhere in this module.
 */

import {
  CATEGORY_BY_KEY, COMPONENT_LABEL, DAMAGE_LABEL, DAMAGE_PLAIN, EVIDENCE_CONFIRMED,
  EVIDENCE_LABEL, EVIDENCE_RANK, FORBIDDEN_PRIMARY_CATEGORY_NAMES, PRIMARY_CATEGORIES,
  SOURCE_TYPE_LABEL, TAG_LABEL, TAG_RAISES, TAXONOMY_VERSION,
  type ComponentKey, type ComponentRelevance, type ConditionTagKey, type DamageKey,
  type EvidenceKey, type PrimaryCategoryKey, type RiskTagKey, type SourceTypeKey,
} from "@/data/taxonomy";
import {
  LIBRARY_BY_KEY, LIBRARY_CLASSIFICATIONS, PUBLISHED_STAINS,
  type ComponentLink, type LibraryClassification,
} from "@/data/stainClassifications";
import type { GateStatus, RiskLevel, UserRoleKey } from "@/lib/fabricSafety";
import { RESTRICTED_GATES } from "@/lib/stainId";
import type { ReadinessStatus } from "@/lib/treatmentReadiness";

export const CLASSIFICATION_VERSION = "classification-v1";

/* ------------------------------------------------------------------ */
/* Role-aware presentation                                             */
/* ------------------------------------------------------------------ */

export type ClassificationMode = "domestic" | "quick_professional" | "technical";

export const MODE_LABEL: Record<ClassificationMode, string> = {
  domestic: "Domestic Mode",
  quick_professional: "Quick Professional Mode",
  technical: "Technical Mode",
};

export function modeForRole(role: UserRoleKey): ClassificationMode {
  if (role === "domestic_user" || role === "learner") return "domestic";
  if (role === "technical_reviewer" || role === "content_admin" || role === "system_admin" || role === "trainer") {
    return "technical";
  }
  return "quick_professional";
}

/* ------------------------------------------------------------------ */
/* Case-specific additions and damage indicators                       */
/* ------------------------------------------------------------------ */

/** Everyday things a user can add to a case without editing the library record. */
export const CASE_ADDITION_PRESETS: {
  key: string; label: string; components: ComponentKey[]; sources?: SourceTypeKey[];
}[] = [
  { key: "milk", label: "Milk or cream was in it", components: ["protein", "oil"] },
  { key: "sugar", label: "It was sweetened", components: ["sugar", "water_soluble"] },
  { key: "oil", label: "Oil or ghee was in it", components: ["oil"] },
  { key: "spice", label: "Spices or masala were in it", components: ["pigment", "natural_dye", "particulate"] },
  { key: "meat", label: "Meat, egg or gravy was in it", components: ["protein", "oil", "starch"] },
  { key: "makeup", label: "Makeup or cosmetics were involved", components: ["cosmetic_base", "pigment", "wax"] },
  { key: "soil", label: "Dust, mud or soil got into it", components: ["particulate", "mineral"] },
  { key: "unknown_product", label: "An unknown product was applied", components: ["unknown_component", "surfactant_residue"] },
];

export const DAMAGE_INDICATORS: {
  key: string; label: string; damage: DamageKey; tags: RiskTagKey[];
}[] = [
  { key: "colour_removed", label: "Colour has been removed or a pale patch appeared", damage: "dye_loss_possible", tags: ["dye_loss_possible", "professional_referral_required"] },
  { key: "bleach_contact", label: "Bleach or a strong chemical touched the area", damage: "chemical_damage_possible", tags: ["chemical_hazard", "professional_referral_required"] },
  { key: "scorch", label: "Brown, shiny, melted or scorched area", damage: "heat_damage_possible", tags: ["fibre_damage_possible", "heat_warning", "professional_referral_required"] },
  { key: "fibre_weak", label: "Fabric feels weak, rough or is breaking", damage: "fibre_damage_possible", tags: ["fibre_damage_possible", "professional_referral_required"] },
  { key: "finish_changed", label: "Surface finish looks changed or patchy", damage: "finish_damage_possible", tags: ["finish_damage_possible"] },
  { key: "coating_peeling", label: "Coating or lamination is peeling or lifting", damage: "coating_damage_possible", tags: ["coating_risk", "professional_referral_required"] },
  { key: "decoration_loose", label: "Glued decoration is loosening", damage: "adhesive_failure_possible", tags: ["adhesive_risk", "embellishment_risk"] },
];

export const USER_CONFIRMATION_OPTIONS = [
  { key: "yes", label: "Yes" },
  { key: "partly", label: "Partly" },
  { key: "no", label: "No" },
  { key: "not_sure", label: "I'm not sure" },
] as const;

export type UserConfirmation = (typeof USER_CONFIRMATION_OPTIONS)[number]["key"];

/* ------------------------------------------------------------------ */
/* Engine input and output                                             */
/* ------------------------------------------------------------------ */

export type ClassifyInput = {
  /** Library stain chosen or confirmed earlier. */
  libraryKey?: string | null;
  /** Step 3 identification outputs, reused rather than re-asked. */
  idPrimary?: PrimaryCategoryKey | null;
  idSecondary?: PrimaryCategoryKey[];
  idConfidence?: number;
  hazard?: boolean;
  biological?: boolean;
  /** Case-specific additions (preset keys from CASE_ADDITION_PRESETS). */
  additions?: string[];
  extraComponents?: ComponentKey[];
  sources?: SourceTypeKey[];
  /** Condition tags carried forward from Step 4. */
  conditionTags?: ConditionTagKey[];
  heatExposed?: boolean;
  heatSetPossible?: boolean;
  previousChemicalUnknown?: boolean;
  chemicalMixing?: boolean;
  crossesColours?: boolean;
  dyeTransferring?: boolean;
  /** Most sensitive affected garment component text from Step 4. */
  affectedComponent?: string;
  noHiddenTestArea?: boolean;
  damageIndicators?: string[];
  /** Carried-forward decisions. Classification may never bypass these. */
  riskBefore: RiskLevel;
  gate?: GateStatus;
  readiness?: ReadinessStatus | null;
  role: UserRoleKey;
  /** User confirmation of the produced classification. */
  confirmation?: UserConfirmation;
  correctionPrimary?: PrimaryCategoryKey | null;
  correctionNote?: string;
};

export type ResolvedComponent = ComponentLink & {
  label: string;
  origin: "library" | "case" | "identification" | "correction";
};

export type ClassificationResult = {
  /** Layer A */
  primaryCategory: PrimaryCategoryKey | null;
  primaryCategoryName: string;
  primaryConfidence: number;
  primaryReason: string;
  /** Layer B */
  components: ResolvedComponent[];
  componentConfidence: number;
  /** Layer C */
  sources: SourceTypeKey[];
  sourceConfidence: number;
  /** Layer D */
  conditionTags: ConditionTagKey[];
  riskTags: RiskTagKey[];
  /** Damage is stored separately from stain chemistry. */
  damageKeys: DamageKey[];
  damageConfidence: number;
  damageOnly: boolean;
  evidence: EvidenceKey;
  evidenceConfirmed: boolean;
  plainExplanation: string;
  technicalNotes: LibraryClassification["technical"] | null;
  unresolvedQuestions: string[];
  rules: string[];
  riskBefore: RiskLevel;
  riskAfter: RiskLevel;
  riskExplanation: string;
  blocked: boolean;
  blockReason: string;
  nextAction: string;
  libraryKey: string | null;
  taxonomyVersion: string;
  engineVersion: string;
};

const RISK_ORDER: RiskLevel[] = ["green", "amber", "red", "black"];
const raise = (a: RiskLevel, b: RiskLevel): RiskLevel =>
  RISK_ORDER.indexOf(a) >= RISK_ORDER.indexOf(b) ? a : b;

const clamp = (n: number) => Math.max(0, Math.min(10, Math.round(n)));

const isProfessional = (role: UserRoleKey) =>
  !(role === "domestic_user" || role === "learner");

/** Chemistry families used to decide when a case has become a combination. */
const FAMILY_OF_COMPONENT: Partial<Record<ComponentKey, string>> = {
  water_soluble: "water", sugar: "water", salt: "water", starch: "water",
  oil: "oil", grease: "oil", wax: "oil",
  protein: "protein", biological_material: "biological",
  tannin: "tannin", natural_dye: "dye", synthetic_dye: "dye", ink: "dye",
  pigment: "pigment", particulate: "pigment", mineral: "mineral", metallic_oxide: "metal",
  resin: "polymer", adhesive: "polymer", polymer: "polymer", paint_binder: "polymer",
  cosmetic_base: "oil", unknown_component: "unknown",
};

/* ------------------------------------------------------------------ */
/* The classifier                                                      */
/* ------------------------------------------------------------------ */

export function classify(input: ClassifyInput): ClassificationResult {
  const rules: string[] = [];
  const unresolved: string[] = [];
  const mode = modeForRole(input.role);

  const library = input.libraryKey ? LIBRARY_BY_KEY[input.libraryKey] ?? null : null;
  if (input.libraryKey && !library) {
    unresolved.push("The selected stain is not in the classification library yet and needs reviewer attention.");
  }

  /* ---------- Layer A: primary category ---------- */
  let primary: PrimaryCategoryKey | null = null;
  let primaryConfidence = 0;
  let primaryReason = "";

  if (library && !library.damageOnly && library.primary) {
    primary = library.primary;
    primaryConfidence = library.primaryConfidence;
    primaryReason = library.primaryReason;
    rules.push(`Primary category taken from the reviewed library record for ${library.name}.`);
  } else if (library?.damageOnly) {
    primary = null;
    primaryReason = library.primaryReason;
    rules.push(`${library.name} is recorded as a damage diagnosis, not a stain category.`);
  } else if (input.idPrimary) {
    primary = input.idPrimary;
    primaryConfidence = clamp(input.idConfidence ?? 5);
    primaryReason = "Taken from the stain identification result.";
    rules.push("Primary category taken from the Step 3 identification result.");
  } else {
    primary = "combination_unknown";
    primaryConfidence = 2;
    primaryReason =
      "The stain was not identified confidently, so it stays in Combination or Unknown rather than being forced into a chemistry it may not have.";
    rules.push("No library record or identification, so the stain remains Combination or Unknown.");
    unresolved.push("What was the source of the mark?");
    unresolved.push("How old is the mark and what has already been done to it?");
  }

  /* ---------- Layer B: components ---------- */
  const components: ResolvedComponent[] = [];
  const addComponent = (
    key: ComponentKey, relevance: ComponentRelevance, confidence: number,
    evidence: EvidenceKey, origin: ResolvedComponent["origin"], notes?: string,
  ) => {
    const existing = components.find((c) => c.key === key);
    if (existing) {
      const order: ComponentRelevance[] = ["possible", "minor", "major", "primary"];
      if (order.indexOf(relevance) > order.indexOf(existing.relevance)) existing.relevance = relevance;
      existing.confidence = Math.max(existing.confidence, confidence);
      return;
    }
    components.push({ key, label: COMPONENT_LABEL[key], relevance, confidence, evidence, origin, notes });
  };

  library?.components.forEach((c) =>
    addComponent(c.key, c.relevance, c.confidence, c.evidence, "library", c.notes));

  // Secondary categories suggested by Step 3 become "possible" components only.
  (input.idSecondary ?? []).forEach((catKey) => {
    const mapped = CATEGORY_TO_COMPONENT[catKey];
    if (mapped) addComponent(mapped, "possible", 4, "inferred", "identification",
      "Suggested by identification, not confirmed chemistry.");
  });

  const caseFamilies = new Set<string>();
  (input.additions ?? []).forEach((k) => {
    const preset = CASE_ADDITION_PRESETS.find((p) => p.key === k);
    if (!preset) return;
    preset.components.forEach((cKey) => {
      addComponent(cKey, "major", 7, "user_reported_source", "case",
        `Reported for this case: ${preset.label}`);
      const fam = FAMILY_OF_COMPONENT[cKey];
      if (fam) caseFamilies.add(fam);
    });
    rules.push(`Case addition recorded: ${preset.label}. The library record is unchanged.`);
  });

  (input.extraComponents ?? []).forEach((cKey) => {
    addComponent(cKey, "possible", 5, "user_reported_source", "case");
    const fam = FAMILY_OF_COMPONENT[cKey];
    if (fam) caseFamilies.add(fam);
  });

  if (input.previousChemicalUnknown) {
    addComponent("unknown_component", "major", 6, "user_reported_source", "case",
      "An unidentified product was applied to this mark.");
    rules.push("An unknown product was reported, so an unknown component is recorded.");
    unresolved.push("Which product was previously applied, and is a label or photograph available?");
  }

  if (input.biological) {
    addComponent("biological_material", "major", 7, "user_reported_source", "case");
  }

  /* Case-level combination promotion — library record is never rewritten. */
  const libraryFamilies = new Set(
    (library?.components ?? [])
      .filter((c) => c.relevance === "primary" || c.relevance === "major")
      .map((c) => FAMILY_OF_COMPONENT[c.key])
      .filter(Boolean) as string[],
  );
  const newFamilies = [...caseFamilies].filter((f) => !libraryFamilies.has(f) && f !== "unknown");
  let caseCombination = false;
  if (primary && primary !== "combination_unknown" && newFamilies.length >= 2) {
    caseCombination = true;
    primary = "combination_unknown";
    primaryReason =
      "This case contains additional treatment-relevant components beyond the library stain, so it is classified as a combination for this case only.";
    rules.push(
      `Case promoted to Combination or Unknown because ${newFamilies.length} additional component families were reported. The library classification is unchanged.`,
    );
  }

  /* ---------- Layer C: sources ---------- */
  const sources = new Set<SourceTypeKey>([...(library?.sources ?? []), ...(input.sources ?? [])]);
  if (input.dyeTransferring) sources.add("dye_transfer");
  if (sources.size === 0) {
    sources.add("unknown_source");
    unresolved.push("Where did the mark come from?");
  }
  let sourceConfidence = library ? library.sourceConfidence : input.sources?.length ? 6 : 2;

  /* ---------- Layer D: condition and risk tags ---------- */
  const conditionTags = new Set<ConditionTagKey>([
    ...(library?.conditionTags ?? []),
    ...(input.conditionTags ?? []),
  ]);
  if (input.heatExposed) conditionTags.add("heat_exposed");
  if (input.heatSetPossible) conditionTags.add("heat_set_possible");
  if (input.crossesColours) conditionTags.add("crossed_multiple_colours");

  const riskTags = new Set<RiskTagKey>(library?.riskTags ?? []);
  if (input.dyeTransferring) { riskTags.add("dye_bleeding"); riskTags.add("colourfastness_test_required"); }
  if (input.crossesColours) riskTags.add("colourfastness_test_required");
  if (input.previousChemicalUnknown) riskTags.add("unknown_chemical");
  if (input.chemicalMixing) { riskTags.add("chemical_hazard"); riskTags.add("treatment_blocked"); }
  if (input.noHiddenTestArea) riskTags.add("hidden_test_required");
  if (input.hazard) { riskTags.add("chemical_hazard"); riskTags.add("treatment_blocked"); }
  if (input.biological) riskTags.add("biological_precaution");
  if (conditionTags.has("heat_exposed") || conditionTags.has("heat_set_possible")) riskTags.add("heat_warning");

  const sensitive = (input.affectedComponent ?? "").toLowerCase();
  if (/bead|sequin|embroider/.test(sensitive)) riskTags.add("embellishment_risk");
  if (/metallic/.test(sensitive)) riskTags.add("metallic_thread_risk");
  if (/coat|lamin/.test(sensitive)) riskTags.add("coating_risk");
  if (/glue|adhesive|fusible/.test(sensitive)) riskTags.add("adhesive_risk");
  if (riskTags.size && !isProfessional(input.role)) {
    if (riskTags.has("professional_only") || riskTags.has("specialist_only") || riskTags.has("professional_referral_required")) {
      riskTags.add("domestic_not_recommended");
    }
  }

  /* ---------- Damage interpretation (separate from chemistry) ---------- */
  const damageKeys = new Set<DamageKey>();
  (input.damageIndicators ?? []).forEach((k) => {
    const d = DAMAGE_INDICATORS.find((x) => x.key === k);
    if (!d) return;
    damageKeys.add(d.damage);
    d.tags.forEach((t) => riskTags.add(t));
    rules.push(`Damage indicator recorded: ${d.label}. Stored as ${DAMAGE_LABEL[d.damage]}, not as a stain category.`);
  });
  if (library?.damageOnly) damageKeys.add(library.damageDefault);

  const hasRealDamage = [...damageKeys].some((k) => k !== "removable_stain_likely" && k !== "insufficient_information");
  const damageOnly = Boolean(library?.damageOnly) || (hasRealDamage && !library && !input.libraryKey);

  if (hasRealDamage && (library || input.idPrimary) && !library?.damageOnly) {
    damageKeys.add("combination_stain_and_damage");
    rules.push("Both added material and fabric damage appear to be present.");
  }
  if (damageKeys.size === 0) {
    damageKeys.add(primary ? "removable_stain_likely" : "insufficient_information");
  }

  let damageConfidence = library ? library.damageConfidence : hasRealDamage ? 7 : 4;
  if (damageOnly) {
    primary = null;
    primaryConfidence = 0;
    if (!primaryReason) {
      primaryReason =
        "Nothing has been added to the fabric, or the fabric itself has changed, so this is recorded as damage rather than as a stain.";
    }
    riskTags.add("professional_referral_required");
    riskTags.add("treatment_blocked");
    rules.push("Damage is not a stain category: no chemistry classification is assigned.");
  }

  /* ---------- Confidence ---------- */
  let componentConfidence = library ? library.componentConfidence : components.length ? 4 : 1;
  if (caseCombination) componentConfidence = Math.max(3, componentConfidence - 1);
  if (input.previousChemicalUnknown) {
    componentConfidence = Math.max(1, componentConfidence - 2);
    primaryConfidence = Math.max(0, primaryConfidence - 1);
    rules.push("Confidence reduced because an unidentified product was applied earlier.");
  }
  if (conditionTags.has("heat_set_possible")) {
    rules.push("Heat exposure is recorded as a condition tag. The chemistry category is unchanged.");
  }
  if (input.confirmation === "partly") {
    primaryConfidence = Math.max(0, primaryConfidence - 2);
    componentConfidence = Math.max(0, componentConfidence - 2);
    unresolved.push("Which part of the description does not match?");
    rules.push("User answered 'Partly': confidence reduced and the contradiction kept open.");
  }
  if (input.confirmation === "no") {
    primaryConfidence = Math.max(0, primaryConfidence - 4);
    componentConfidence = Math.max(0, componentConfidence - 3);
    sourceConfidence = Math.max(0, sourceConfidence - 3);
    unresolved.push("What actually happened to the garment?");
    rules.push("User rejected the classification: confidence reduced and the classification marked unconfirmed.");
  }
  if (input.confirmation === "not_sure") {
    primaryConfidence = Math.max(0, primaryConfidence - 1);
    rules.push("User was unsure: confidence reduced slightly.");
  }

  /* ---------- Correction ---------- */
  if (input.correctionPrimary) {
    const target = CATEGORY_BY_KEY[input.correctionPrimary];
    if (target?.technicalOnly && !isProfessional(input.role)) {
      unresolved.push(
        `${target.name} is a technical classification and cannot be selected without supporting professional evidence.`,
      );
      rules.push(
        `Correction to ${target.name} was not applied: a domestic user cannot confirm professional chemistry without evidence.`,
      );
    } else {
      primary = input.correctionPrimary;
      primaryReason = input.correctionNote?.trim()
        ? `Corrected by the user: ${input.correctionNote.trim()}`
        : "Corrected by the user.";
      primaryConfidence = Math.min(primaryConfidence, 6);
      rules.push(`Primary category corrected to ${CATEGORY_BY_KEY[input.correctionPrimary].name}.`);
    }
  }

  /* ---------- Evidence ---------- */
  let evidence: EvidenceKey = library?.evidence ?? "inferred";
  if (!library) evidence = input.idPrimary ? "inferred" : "insufficient_information";
  if (input.confirmation === "no" || input.confirmation === "partly") {
    if (EVIDENCE_RANK[evidence] > EVIDENCE_RANK.user_reported_source) evidence = "user_reported_source";
  }
  if (caseCombination && EVIDENCE_RANK[evidence] > EVIDENCE_RANK.user_reported_source) {
    evidence = "user_reported_source";
  }
  if (primaryConfidence <= 3) evidence = "insufficient_information";

  /* ---------- Risk (never lowered) ---------- */
  let riskAfter = input.riskBefore;
  const riskReasons: string[] = [];
  [...conditionTags, ...riskTags].forEach((t) => {
    const r = TAG_RAISES[t];
    if (r && RISK_ORDER.indexOf(r) > RISK_ORDER.indexOf(riskAfter)) {
      riskAfter = raise(riskAfter, r);
      riskReasons.push(`${TAG_LABEL[t]} raised the risk to ${riskAfter}.`);
    }
  });
  if (riskAfter !== input.riskBefore) {
    rules.push(`Risk raised from ${input.riskBefore} to ${riskAfter} by classification tags.`);
  } else {
    rules.push(`Risk unchanged at ${input.riskBefore}. Classification never lowers an earlier risk decision.`);
  }

  /* ---------- Blocking (classification may not bypass earlier decisions) ---------- */
  let blocked = false;
  let blockReason = "";
  const readinessBlocked = input.readiness?.startsWith("blocked_") ?? false;
  if (input.gate && RESTRICTED_GATES.includes(input.gate)) {
    blocked = true;
    blockReason = "The garment safety check restricted this case, so classification is recorded for documentation only.";
  } else if (readinessBlocked) {
    blocked = true;
    blockReason = "The treatment-readiness assessment blocked this case, so classification is recorded for documentation only.";
  } else if (input.hazard || input.chemicalMixing) {
    blocked = true;
    blockReason = "A possible hazard was reported, so classification is recorded for documentation only.";
  } else if (damageOnly || hasRealDamage) {
    blocked = true;
    blockReason = "Possible fabric damage was recorded. Damage is assessed professionally, not treated as a stain.";
  }
  if (blocked) {
    riskTags.add("treatment_blocked");
    rules.push("Earlier restrictions are preserved: classification cannot unlock a blocked case.");
  }

  /* ---------- Explanations ---------- */
  const catName = primary ? CATEGORY_BY_KEY[primary].name : "Damage, not a stain";
  const majorComponents = components
    .filter((c) => c.relevance === "primary" || c.relevance === "major")
    .map((c) => c.label.toLowerCase());

  let plain: string;
  if (damageOnly) {
    plain = `${DAMAGE_PLAIN[[...damageKeys][0]]} This is recorded as a damage diagnosis, not as a stain category.`;
  } else if (primary === "combination_unknown" && primaryConfidence <= 3) {
    plain =
      "This mark could not be identified confidently, so it stays as Combination or Unknown. Guessing a chemistry here would not be safe.";
  } else if (primary === "combination_unknown") {
    plain = `This is classified as a combination stain because it commonly contains ${
      majorComponents.slice(0, 4).join(", ") || "several different materials"
    } together.`;
  } else {
    plain = `This is classified as ${catName} because ${
      majorComponents[0] ?? "its main material"
    } is the material that matters most when deciding what is safe.`;
  }
  if (conditionTags.has("heat_set_possible")) {
    plain += " Heat exposure is recorded separately as a condition, not as a different stain type.";
  }

  const nextAction = blocked
    ? "Documentation and professional referral only"
    : primaryConfidence <= 3
      ? "More information required before technical classification is confirmed"
      : "Ready for the master stain database step";

  return {
    primaryCategory: primary,
    primaryCategoryName: catName,
    primaryConfidence: clamp(primaryConfidence),
    primaryReason,
    components,
    componentConfidence: clamp(componentConfidence),
    sources: [...sources],
    sourceConfidence: clamp(sourceConfidence),
    conditionTags: [...conditionTags],
    riskTags: [...riskTags],
    damageKeys: [...damageKeys],
    damageConfidence: clamp(damageConfidence),
    damageOnly,
    evidence,
    evidenceConfirmed: EVIDENCE_CONFIRMED[evidence],
    plainExplanation: plain,
    technicalNotes: library?.technical ?? null,
    unresolvedQuestions: [...new Set(unresolved)],
    rules,
    riskBefore: input.riskBefore,
    riskAfter,
    riskExplanation: riskReasons.length
      ? riskReasons.join(" ")
      : `Risk stays at ${input.riskBefore}. Classification tags did not add a higher risk.`,
    blocked,
    blockReason,
    nextAction,
    libraryKey: library?.key ?? null,
    taxonomyVersion: TAXONOMY_VERSION,
    engineVersion: CLASSIFICATION_VERSION,
  };
}

/** Step 3 category suggestions map to a representative component, never to confirmed chemistry. */
const CATEGORY_TO_COMPONENT: Partial<Record<PrimaryCategoryKey, ComponentKey>> = {
  water_soluble: "water_soluble",
  oil_grease: "oil",
  protein: "protein",
  tannin_plant: "tannin",
  pigment_particulate: "pigment",
  dye_ink: "synthetic_dye",
  paint_polymer: "polymer",
  metal_rust: "metallic_oxide",
  biological: "biological_material",
  combination_unknown: "unknown_component",
};

/* ------------------------------------------------------------------ */
/* Browsing, counts and filters                                        */
/* ------------------------------------------------------------------ */

export function categoryCounts(): Record<PrimaryCategoryKey, number> {
  const counts = Object.fromEntries(
    PRIMARY_CATEGORIES.map((c) => [c.key, 0]),
  ) as Record<PrimaryCategoryKey, number>;
  PUBLISHED_STAINS().forEach((s) => {
    if (s.primary) counts[s.primary] += 1;
  });
  return counts;
}

export type LibraryFilters = {
  query?: string;
  category?: PrimaryCategoryKey | "all";
  component?: ComponentKey | "all";
  source?: SourceTypeKey | "all";
  condition?: ConditionTagKey | "all";
  risk?: RiskTagKey | "all";
  includeDamage?: boolean;
};

export function filterLibrary(filters: LibraryFilters): LibraryClassification[] {
  const q = (filters.query ?? "").trim().toLowerCase();
  return LIBRARY_CLASSIFICATIONS.filter((rec) => {
    if (!filters.includeDamage && rec.damageOnly) return false;
    if (filters.category && filters.category !== "all" && rec.primary !== filters.category) return false;
    if (filters.component && filters.component !== "all" &&
      !rec.components.some((c) => c.key === filters.component)) return false;
    if (filters.source && filters.source !== "all" && !rec.sources.includes(filters.source)) return false;
    if (filters.condition && filters.condition !== "all" && !rec.conditionTags.includes(filters.condition)) return false;
    if (filters.risk && filters.risk !== "all" && !rec.riskTags.includes(filters.risk)) return false;
    if (!q) return true;
    const hay = [rec.name, ...rec.alt, ...rec.local].join(" ").toLowerCase();
    return hay.includes(q);
  });
}

export function sourcesForCategory(category: PrimaryCategoryKey): SourceTypeKey[] {
  const set = new Set<SourceTypeKey>();
  PUBLISHED_STAINS()
    .filter((s) => s.primary === category)
    .forEach((s) => s.sources.forEach((x) => set.add(x)));
  return [...set];
}

export const sourceLabel = (k: SourceTypeKey) => SOURCE_TYPE_LABEL[k];
export const evidenceLabel = (k: EvidenceKey) => EVIDENCE_LABEL[k];

/* ------------------------------------------------------------------ */
/* Taxonomy governance checks (admin surface)                          */
/* ------------------------------------------------------------------ */

export type GovernanceIssue = { severity: "error" | "warning"; message: string };

export function checkTaxonomyGovernance(): GovernanceIssue[] {
  const issues: GovernanceIssue[] = [];

  if (PRIMARY_CATEGORIES.length !== 12) {
    issues.push({ severity: "error", message: `Expected exactly 12 primary categories, found ${PRIMARY_CATEGORIES.length}.` });
  }

  const names = PRIMARY_CATEGORIES.map((c) => c.name.toLowerCase().trim());
  const seen = new Set<string>();
  names.forEach((n) => {
    if (seen.has(n)) issues.push({ severity: "error", message: `Duplicate category name: ${n}` });
    seen.add(n);
    if (FORBIDDEN_PRIMARY_CATEGORY_NAMES.includes(n)) {
      issues.push({ severity: "error", message: `${n} must not be a primary chemistry category.` });
    }
  });

  LIBRARY_CLASSIFICATIONS.forEach((rec) => {
    if (rec.status === "published" && !rec.damageOnly && !rec.primary) {
      issues.push({ severity: "error", message: `${rec.name} is published without a primary category.` });
    }
    if (rec.damageOnly && rec.primary) {
      issues.push({ severity: "error", message: `${rec.name} is a damage diagnosis and must not carry a stain category.` });
    }
    if (!rec.damageOnly && rec.sources.length === 0) {
      issues.push({ severity: "warning", message: `${rec.name} has no source type recorded.` });
    }
    if (rec.needsReview) {
      issues.push({ severity: "warning", message: `${rec.name} is flagged for manual review: ${rec.reviewNote ?? "no note"}` });
    }
  });

  return issues;
}

export function unclassifiedLegacyRecords(legacyNames: string[]): string[] {
  const covered = new Set(
    LIBRARY_CLASSIFICATIONS.map((l) => l.legacyCategory).filter(Boolean) as string[],
  );
  return legacyNames.filter((n) => !covered.has(n));
}
