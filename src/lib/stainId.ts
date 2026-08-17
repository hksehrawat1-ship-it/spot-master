/**
 * Step 3 — Stain Identification engine.
 * Transparent, rules-based candidate matching. IDENTIFICATION ONLY.
 * Permanent principle: a photograph can suggest possibilities. It cannot prove stain chemistry.
 * No treatment instruction, chemical procedure or product is produced here.
 */

import type { GateStatus, RiskLevel } from "@/lib/fabricSafety";
import {
  ID_CATEGORIES,
  CATEGORY_LABEL,
  SOURCE_LABEL,
  STAIN_BY_ID,
  STAIN_RECORDS,
  type IdCategoryKey,
  type SourceKey,
  type StainRecord,
} from "@/data/stainKnowledge";

export const ID_RULES_VERSION = "stain-id-v1";

/* ------------------------------------------------------------------ */
/* Option lists (translation-ready plain language)                     */
/* ------------------------------------------------------------------ */

export const AGE_OPTIONS = [
  "Just happened", "Today", "1–3 days ago", "More than 3 days ago", "Old stain", "Not known",
] as const;

export const COLOUR_OPTIONS = [
  "Clear or colourless", "White", "Yellow", "Orange", "Red", "Brown", "Black",
  "Blue", "Green", "Purple", "Grey", "Multiple colours", "Not sure",
] as const;

export const TEXTURE_OPTIONS = [
  "Wet", "Oily", "Greasy", "Sticky", "Waxy", "Crusty", "Hard", "Powdery",
  "Mud-like", "Paint-like film", "Shiny", "Bleached or lighter than the fabric",
  "Surface looks damaged", "No texture", "Not sure",
] as const;

export const SHAPE_OPTIONS = [
  "Small spot", "Splash", "Drip", "Ring", "Large patch", "Repeated marks",
  "Line or streak", "Transfer from another fabric", "Underarm area",
  "Collar or cuff buildup", "Pocket area", "Hem or lower garment", "Not sure",
] as const;

export const ODOUR_OPTIONS = [
  "No noticeable odour", "Food-like", "Oily or fuel-like", "Perfume or cosmetic-like",
  "Musty", "Urine-like", "Chemical-like", "Smoke-like", "Other", "Not sure",
] as const;

export const LOCATION_OPTIONS = [
  "Collar", "Cuff", "Underarm", "Chest or front", "Pocket", "Sleeve", "Seat",
  "Knee", "Hem", "Lining", "Decoration", "Multiple areas", "Other",
] as const;

export const PREVIOUS_TREATMENT_OPTIONS = [
  "Nothing", "Blotted with water", "Rubbed", "Washed", "Dry-cleaned", "Tumble-dried",
  "Ironed", "Steamed", "Bleach used", "Detergent used", "Stain remover used",
  "Solvent used", "Unknown chemical used", "Multiple products mixed", "Not known",
] as const;

export const PRODUCT_USED_OPTIONS = [
  "Bleach used", "Detergent used", "Stain remover used", "Solvent used",
  "Unknown chemical used", "Multiple products mixed",
];

/** Treatments that obscure evidence or set the stain. */
const OBSCURING = ["Washed", "Dry-cleaned", "Tumble-dried", "Ironed", "Steamed", "Bleach used", "Solvent used", "Unknown chemical used", "Multiple products mixed", "Rubbed"];

export const HAZARD_OPTIONS = [
  "Unknown industrial chemical", "Battery fluid", "Strong acid", "Strong alkali",
  "Pesticide", "Fuel", "Solvent", "Mercury", "Broken fluorescent lamp residue",
  "Human blood or bodily fluid", "Animal waste", "Mould growth", "Sewage",
  "Unknown powder", "Unknown sticky chemical", "Fire or smoke contamination",
  "None of these", "Not sure",
] as const;

/** Hazards that stop ordinary stain matching. */
const HARD_HAZARDS = [
  "Unknown industrial chemical", "Battery fluid", "Strong acid", "Strong alkali",
  "Pesticide", "Fuel", "Solvent", "Mercury", "Broken fluorescent lamp residue",
  "Sewage", "Unknown powder", "Unknown sticky chemical", "Fire or smoke contamination",
];
/** Hazards requiring biological precautions but not an automatic stop. */
const BIO_HAZARDS = ["Human blood or bodily fluid", "Animal waste", "Mould growth"];

export const DAMAGE_OPTIONS = [
  "Lighter colour", "Darker colour", "Rough texture", "Thinner fabric",
  "Hole or fibre loss", "Melted or shiny", "Cracked or peeling", "Coating lifted",
  "No visible damage", "Not sure",
] as const;

const HARD_DAMAGE = ["Thinner fabric", "Hole or fibre loss", "Melted or shiny", "Cracked or peeling", "Coating lifted"];
const SOFT_DAMAGE = ["Lighter colour", "Rough texture"];

export const PHOTO_KINDS = [
  { key: "full_garment", label: "Full garment", hint: "Whole garment, laid flat" },
  { key: "stained_area", label: "Entire stained area", hint: "Include the complete edge of the mark" },
  { key: "close_up", label: "Close-up of the stain", hint: "Sharp focus, neutral light" },
  { key: "reverse", label: "Reverse side", hint: "Only if you can reach it safely" },
  { key: "comparison", label: "Unaffected area or seam", hint: "For colour comparison" },
  { key: "source", label: "Stain source or container", hint: "Only if it is safe to handle" },
] as const;

export type PhotoKind = (typeof PHOTO_KINDS)[number]["key"];

/* ------------------------------------------------------------------ */
/* Answers                                                             */
/* ------------------------------------------------------------------ */

export type StainPhoto = {
  kind: PhotoKind;
  dataUrl: string;
  capturedAt: number;
  description?: string;
  quality?: ImageQuality;
};

export type ImageQuality = {
  score: number; // 0-10
  sufficient: boolean;
  issues: string[];
};

export type AiSuggestion = {
  label: string;
  stainId?: string;
  note: string;
  confidence: number; // 0-10, suggestion only
  modelVersion: string;
  acceptedByUser?: boolean | null;
};

export type ProductInfo = {
  name: string;
  appliedAt: string;
  rinsed: string;
  result: string;
  productPhoto?: string;
  labelPhoto?: string;
};

export type IdAnswers = {
  entryRoute: "search" | "source" | "category" | "photo" | "unknown" | null;
  searchTerms: string[];
  selectedStainId: string | null;
  selectedSource: SourceKey | null;
  selectedCategory: IdCategoryKey | null;
  localNameUsed: string | null;
  sourceKnown: "yes" | "idea" | "no" | null;
  age: string | null;
  colours: string[];
  textures: string[];
  shapes: string[];
  odour: string | null;
  locations: string[];
  previousTreatment: string[];
  product: ProductInfo | null;
  hazards: string[];
  damage: string[];
  photos: StainPhoto[];
  aiSuggestions: AiSuggestion[];
  aiUnavailable?: boolean;
};

export const emptyIdAnswers = (): IdAnswers => ({
  entryRoute: null,
  searchTerms: [],
  selectedStainId: null,
  selectedSource: null,
  selectedCategory: null,
  localNameUsed: null,
  sourceKnown: null,
  age: null,
  colours: [],
  textures: [],
  shapes: [],
  odour: null,
  locations: [],
  previousTreatment: [],
  product: null,
  hazards: [],
  damage: [],
  photos: [],
  aiSuggestions: [],
});

/* ------------------------------------------------------------------ */
/* Search (everyday, alternative, local and misspelled names)          */
/* ------------------------------------------------------------------ */

const norm = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();

/** Simple bounded Levenshtein for spelling tolerance. */
function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let last = prev[0];
    prev[0] = i;
    let best = prev[0];
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, last + (a[i - 1] === b[j - 1] ? 0 : 1));
      last = tmp;
      best = Math.min(best, prev[j]);
    }
    if (best > max) return max + 1;
  }
  return prev[b.length];
}

export type SearchHit = { record: StainRecord; matchedTerm: string; exact: boolean; score: number };

export function searchStains(query: string, limit = 12): SearchHit[] {
  const q = norm(query);
  if (q.length < 2) return [];
  const hits: SearchHit[] = [];
  for (const record of STAIN_RECORDS) {
    const terms: { term: string; weight: number }[] = [
      { term: record.name, weight: 100 },
      ...record.alt.map((t) => ({ term: t, weight: 85 })),
      ...record.local.map((t) => ({ term: t, weight: 85 })),
      ...record.sources.map((s) => ({ term: SOURCE_LABEL[s], weight: 40 })),
      { term: CATEGORY_LABEL[record.category], weight: 30 },
      { term: record.typicalSources, weight: 25 },
    ];
    let best: SearchHit | null = null;
    for (const { term, weight } of terms) {
      const t = norm(term);
      let score = 0;
      let exact = false;
      if (t === q) { score = weight + 30; exact = true; }
      else if (t.startsWith(q)) score = weight + 15;
      else if (t.includes(q)) score = weight;
      else {
        const words = t.split(" ");
        const near = words.some((w) => w.length > 3 && editDistance(w, q, q.length > 5 ? 2 : 1) <= (q.length > 5 ? 2 : 1));
        if (near) score = weight - 25;
      }
      if (score > 0 && (!best || score > best.score)) best = { record, matchedTerm: term, exact, score };
    }
    if (best) hits.push(best);
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Image quality check (heuristic, on-device)                          */
/* ------------------------------------------------------------------ */

export function checkImageQuality(input: {
  width: number; height: number; brightness: number; variance: number; saturationSpread: number; hasComparison: boolean;
}): ImageQuality {
  const issues: string[] = [];
  if (Math.min(input.width, input.height) < 300) issues.push("Please move closer, or send a larger photograph.");
  if (input.variance < 180) issues.push("The stained area looks out of focus.");
  if (input.brightness < 45) issues.push("The photograph is too dark to judge colour.");
  if (input.brightness > 225) issues.push("Glare or bright light is hiding the stain.");
  if (input.saturationSpread > 0.7) issues.push("The lighting appears to change the garment colour.");
  if (!input.hasComparison) issues.push("Please include an unaffected area for colour comparison.");
  const score = Math.max(0, 10 - issues.length * 2);
  return { score, sufficient: issues.filter((i) => !i.startsWith("Please include an unaffected")).length === 0, issues };
}

/* ------------------------------------------------------------------ */
/* Candidate matching                                                  */
/* ------------------------------------------------------------------ */

export type Candidate = {
  rank: 1 | 2 | 3;
  stainId: string;
  name: string;
  altName: string;
  category: IdCategoryKey;
  categoryLabel: string;
  secondary: IdCategoryKey[];
  icon: string;
  score: number;
  why: string[];
  whyNot: string[];
  missingEvidence: string[];
};

export type IdOutcome =
  | "identified"
  | "possibilities"
  | "unknown"
  | "possible_damage"
  | "hazard_stop";

export type NextAction =
  | "Confirm and Continue"
  | "Answer More Questions"
  | "Continue as Unknown Stain"
  | "Professional Identification Recommended"
  | "Stop—Possible Hazard"
  | "Stop—Possible Fabric Damage";

export type IdResult = {
  outcome: IdOutcome;
  headline: string;
  candidates: Candidate[];
  confidence: number; // 0-10
  confidenceReason: string;
  uncertainty: string[];
  missingEvidence: string[];
  primaryCategory: IdCategoryKey | null;
  secondaryComponents: IdCategoryKey[];
  hazardStop: boolean;
  hazardReasons: string[];
  damageRoute: boolean;
  damageReasons: string[];
  biologicalPrecautions: boolean;
  riskBefore: RiskLevel;
  riskAfter: RiskLevel;
  riskRule: string;
  gateBefore: GateStatus;
  gateAfter: GateStatus;
  documentationOnly: boolean;
  nextAction: NextAction;
  rulesVersion: string;
};

const RISK_ORDER: RiskLevel[] = ["green", "amber", "red", "black"];
const raise = (a: RiskLevel, b: RiskLevel): RiskLevel =>
  RISK_ORDER.indexOf(a) >= RISK_ORDER.indexOf(b) ? a : b;

export const RESTRICTED_GATES: GateStatus[] = [
  "blocked_pending_identification",
  "blocked_existing_damage",
  "specialist_material_route",
];

export const GATE_PLAIN: Record<GateStatus, string> = {
  proceed: "The garment check allows you to continue.",
  proceed_with_testing: "The garment check allows you to continue, with testing required later.",
  professional_only: "The garment check allows you to continue, but handling should be professional.",
  blocked_pending_identification:
    "You can document this mark, but treatment guidance is unavailable because the garment could not be identified safely.",
  blocked_existing_damage:
    "You can document this mark, but treatment guidance is unavailable because the garment already shows damage.",
  specialist_material_route:
    "You can document this mark, but treatment guidance is unavailable because the garment requires specialist assessment.",
};

function overlap(a: string[], b: string[]) {
  return a.filter((x) => b.includes(x));
}

export function evaluateIdentification(
  answers: IdAnswers,
  context: { riskBefore: RiskLevel; gateBefore: GateStatus },
): IdResult {
  const { riskBefore, gateBefore } = context;
  const uncertainty: string[] = [];
  const missing: string[] = [];

  /* ---- hazard screening happens first ---- */
  const hazardReasons = answers.hazards.filter((h) => HARD_HAZARDS.includes(h));
  const bioFlags = answers.hazards.filter((h) => BIO_HAZARDS.includes(h));
  const hazardUnsure = answers.hazards.includes("Not sure");
  const hazardStop = hazardReasons.length > 0;

  /* ---- damage screening ---- */
  const damageHard = overlap(answers.damage, HARD_DAMAGE);
  const damageSoft = overlap(answers.damage, SOFT_DAMAGE);
  const bleachLike = answers.textures.includes("Bleached or lighter than the fabric") || answers.damage.includes("Lighter colour");
  const damageRoute = damageHard.length > 0 || (bleachLike && !answers.selectedStainId) || answers.selectedStainId === "bleach_spot" || answers.selectedStainId === "scorch";
  const damageReasons = [
    ...damageHard.map((d) => `Reported: ${d.toLowerCase()}`),
    ...(bleachLike ? ["The area looks lighter than the surrounding fabric, which can mean dye loss rather than a deposit."] : []),
    ...damageSoft.filter((d) => d !== "Lighter colour").map((d) => `Reported: ${d.toLowerCase()}`),
  ];

  /* ---- candidate scoring ---- */
  const selected = answers.selectedStainId ? STAIN_BY_ID[answers.selectedStainId] : null;
  const aiIds = answers.aiSuggestions.map((s) => s.stainId).filter(Boolean) as string[];

  const scored = STAIN_RECORDS.map((r) => {
    let score = 0;
    const why: string[] = [];
    const whyNot: string[] = [];

    if (selected && r.id === selected.id) {
      if (answers.sourceKnown === "yes") { score += 45; why.push("You told us this is what caused the mark."); }
      else if (answers.sourceKnown === "idea") { score += 26; why.push("You believe this is the likely source."); }
      else { score += 14; why.push("You selected this stain name."); }
    }
    if (answers.selectedSource && r.sources.includes(answers.selectedSource)) {
      score += 12; why.push(`Common in the "${SOURCE_LABEL[answers.selectedSource]}" group you chose.`);
    }
    if (answers.selectedCategory && r.category === answers.selectedCategory) {
      score += 10; why.push(`Matches the "${CATEGORY_LABEL[answers.selectedCategory]}" category you browsed.`);
    }

    const colourHit = overlap(answers.colours, r.colours);
    if (colourHit.length) { score += Math.min(16, colourHit.length * 8); why.push(`Colour reported (${colourHit.join(", ").toLowerCase()}) is typical.`); }
    else if (answers.colours.length && !answers.colours.includes("Not sure")) {
      score -= 6; whyNot.push(`The colour you reported is not typical for ${r.name.toLowerCase()}.`);
    }

    const textureHit = overlap(answers.textures, r.textures);
    if (textureHit.length) { score += Math.min(16, textureHit.length * 8); why.push(`Feel described (${textureHit.join(", ").toLowerCase()}) is consistent.`); }
    else if (answers.textures.length && !answers.textures.includes("Not sure")) {
      score -= 5; whyNot.push("The physical character described is not typical.");
    }

    const locHit = overlap(answers.locations, r.locations);
    if (locHit.length) { score += 6; why.push(`Position on the garment (${locHit.join(", ").toLowerCase()}) supports this.`); }

    if (answers.odour) {
      const odourMap: Record<string, string[]> = {
        "Food-like": ["curry", "chocolate", "milk", "egg", "vomit", "fruit_juice", "tea", "coffee", "ghee_butter"],
        "Oily or fuel-like": ["motor_oil", "cooking_oil", "wax", "shoe_polish"],
        "Perfume or cosmetic-like": ["lipstick", "foundation", "deodorant", "hair_dye", "nail_polish"],
        Musty: ["mould", "unknown_yellow"],
        "Urine-like": ["urine"],
        "Chemical-like": ["unknown_chemical", "paint", "nail_polish", "bleach_spot", "adhesive"],
        "Smoke-like": ["scorch"],
      };
      if (odourMap[answers.odour]?.includes(r.id)) { score += 7; why.push(`An already-noticeable ${answers.odour.toLowerCase()} odour fits.`); }
    }

    // AI is supporting evidence only, never decisive on its own.
    if (aiIds.includes(r.id)) { score += 6; why.push("Photo analysis suggested this as a possibility (suggestion only)."); }

    // Age interaction
    if ((answers.age === "Old stain" || answers.age === "More than 3 days ago") && r.category === "oxidizable") {
      score += 5; why.push("Age is consistent with a mark that yellows over time.");
    }
    if (answers.age === "Just happened" && r.id === "unknown_yellow") {
      score -= 8; whyNot.push("An age-related yellow mark is unlikely for a fresh spill.");
    }

    if (damageRoute && !r.damageRoute) whyNot.push("The area may be damaged rather than stained, which weakens this match.");
    if (r.damageRoute && damageRoute) { score += 14; why.push("The reported appearance fits fabric change rather than a deposit."); }
    if (r.hazardCandidate && (hazardStop || hazardUnsure)) { score += 20; why.push("An unknown or hazardous substance was indicated."); }

    return { r, score, why, whyNot };
  })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  /* ---- missing evidence ---- */
  if (!answers.sourceKnown || answers.sourceKnown === "no") missing.push("What caused the mark");
  if (!answers.age || answers.age === "Not known") missing.push("When it happened");
  if (!answers.colours.length || answers.colours.includes("Not sure")) missing.push("Colour of the mark");
  if (!answers.textures.length || answers.textures.includes("Not sure")) missing.push("How the mark feels");
  if (!answers.locations.length) missing.push("Where it is on the garment");
  if (!answers.photos.length) missing.push("Photographs of the stain");
  if (!answers.previousTreatment.length) missing.push("What was already done to the stain");

  const topScore = scored[0]?.score ?? 0;
  const candidates: Candidate[] = scored.slice(0, 3).map((c, i) => ({
    rank: (i + 1) as 1 | 2 | 3,
    stainId: c.r.id,
    name: c.r.name,
    altName: c.r.alt[0] ?? "",
    category: c.r.category,
    categoryLabel: CATEGORY_LABEL[c.r.category],
    secondary: c.r.secondary,
    icon: c.r.icon,
    score: c.score,
    why: c.why.length ? c.why : ["General consistency with the information given."],
    whyNot: c.whyNot.length
      ? c.whyNot
      : ["Other substances can look and feel the same, so this is not confirmed."],
    missingEvidence: missing,
  }));

  /* ---- confidence ---- */
  let confidence = 0;
  const reasons: string[] = [];
  const photoOnly =
    answers.photos.length > 0 &&
    !answers.selectedStainId &&
    answers.sourceKnown !== "yes" &&
    !answers.colours.length &&
    !answers.textures.length;

  if (answers.sourceKnown === "yes" && selected) { confidence = 8; reasons.push("the source was directly known"); }
  else if (answers.sourceKnown === "idea" && selected) { confidence = 6; reasons.push("you gave a likely source"); }
  else if (topScore >= 40) { confidence = 5; reasons.push("observations point to a small group of stains"); }
  else if (topScore >= 20) { confidence = 4; reasons.push("several possibilities remain"); }
  else if (topScore > 0) { confidence = 2; reasons.push("the evidence is weak"); }
  else { confidence = 0; reasons.push("there is not enough evidence"); }

  if (answers.colours.length && !answers.colours.includes("Not sure")) confidence += 0.5;
  if (answers.textures.length && !answers.textures.includes("Not sure")) confidence += 0.5;
  if (answers.locations.length) confidence += 0.5;
  if (answers.age && answers.age !== "Not known") confidence += 0.5;

  const obscured = overlap(answers.previousTreatment, OBSCURING);
  if (obscured.length) {
    confidence -= 2;
    uncertainty.push(`Earlier handling (${obscured.join(", ").toLowerCase()}) may have changed or set the mark.`);
    reasons.push("earlier handling has obscured the evidence");
  }
  if (candidates.length > 1 && candidates[1].score >= candidates[0].score - 6) {
    confidence -= 1;
    uncertainty.push("More than one stain fits the description almost equally well.");
  }
  if (damageRoute) {
    confidence = Math.min(confidence, 4);
    uncertainty.push("The area may be fabric damage rather than a removable stain.");
  }
  if (photoOnly) {
    confidence = Math.min(confidence, 5);
    uncertainty.push("A photograph can suggest possibilities. It cannot prove stain chemistry.");
  }
  if (answers.sourceKnown === "no") confidence = Math.min(confidence, 6);
  if (hazardStop) { confidence = Math.min(confidence, 3); uncertainty.push("A possible hazardous substance stops ordinary stain matching."); }
  if (missing.length >= 4) uncertainty.push("Several observations are still missing.");

  // A photograph alone can never produce a 9/10 or 10/10 result, and 10/10 is
  // reserved for cases confirmed later in the workflow.
  confidence = Math.max(0, Math.min(9, Math.round(confidence)));

  /* ---- outcome ---- */
  let outcome: IdOutcome;
  if (hazardStop) outcome = "hazard_stop";
  else if (damageRoute) outcome = "possible_damage";
  else if (!candidates.length || confidence <= 1) outcome = "unknown";
  else if (confidence >= 7 && candidates.length && (candidates.length === 1 || candidates[0].score - (candidates[1]?.score ?? 0) >= 12))
    outcome = "identified";
  else outcome = "possibilities";

  /* ---- risk interaction (never silently lowers Step 2 risk) ---- */
  let riskAfter = riskBefore;
  const rules: string[] = [];
  if (hazardStop) { riskAfter = raise(riskAfter, "black"); rules.push("Possible hazardous or unknown chemical → Black"); }
  if (hazardUnsure && !hazardStop) { riskAfter = raise(riskAfter, "amber"); rules.push("Hazard screening unresolved → at least Amber"); }
  if (damageHard.length) { riskAfter = raise(riskAfter, "red"); rules.push("Reported fibre or coating damage → at least Red"); }
  if (damageRoute && !damageHard.length) { riskAfter = raise(riskAfter, "amber"); rules.push("Possible dye loss or damage → at least Amber"); }
  const biological =
    bioFlags.length > 0 ||
    candidates.slice(0, 1).some((c) => STAIN_BY_ID[c.stainId]?.biological);
  if (biological) { riskAfter = raise(riskAfter, "amber"); rules.push("Biological material → precautions required, at least Amber"); }
  if (outcome === "unknown") { riskAfter = raise(riskAfter, "amber"); rules.push("Unknown stain → at least Amber"); }
  if (riskBefore === "black") rules.push("Step 2 Black decision preserved");

  /* ---- gate ---- */
  let gateAfter: GateStatus = gateBefore;
  if (hazardStop) gateAfter = "blocked_pending_identification";
  else if (damageHard.length) gateAfter = "blocked_existing_damage";
  else if (RESTRICTED_GATES.includes(gateBefore)) gateAfter = gateBefore;
  else if (riskAfter === "black") gateAfter = "blocked_pending_identification";
  else if (riskAfter === "red" && gateBefore === "proceed") gateAfter = "professional_only";
  else if (riskAfter === "amber" && gateBefore === "proceed") gateAfter = "proceed_with_testing";

  const documentationOnly = RESTRICTED_GATES.includes(gateAfter);

  /* ---- next action ---- */
  let nextAction: NextAction;
  if (hazardStop) nextAction = "Stop—Possible Hazard";
  else if (damageRoute) nextAction = "Stop—Possible Fabric Damage";
  else if (documentationOnly) nextAction = "Professional Identification Recommended";
  else if (outcome === "identified") nextAction = "Confirm and Continue";
  else if (outcome === "unknown") nextAction = missing.length >= 3 ? "Answer More Questions" : "Continue as Unknown Stain";
  else nextAction = "Answer More Questions";

  const headline =
    outcome === "hazard_stop"
      ? "Hazardous substance assessment required"
      : outcome === "possible_damage"
        ? "Possible fabric damage, not an ordinary stain"
        : outcome === "identified"
          ? `Likely stain identified: ${candidates[0].name}`
          : outcome === "possibilities"
            ? `${candidates.length} possible stain${candidates.length > 1 ? "s" : ""}`
            : "Unknown stain";

  const primary = outcome === "identified" || outcome === "possibilities" ? candidates[0]?.category ?? null : null;
  const secondary = outcome === "identified" ? candidates[0]?.secondary ?? [] : [];

  return {
    outcome,
    headline,
    candidates,
    confidence,
    confidenceReason: `Identification confidence ${confidence}/10 because ${reasons.join(", ")}.`,
    uncertainty,
    missingEvidence: missing,
    primaryCategory: primary,
    secondaryComponents: secondary,
    hazardStop,
    hazardReasons,
    damageRoute,
    damageReasons,
    biologicalPrecautions: biological,
    riskBefore,
    riskAfter,
    riskRule: rules.length ? rules.join("; ") : "No Step 3 rule changed the garment risk",
    gateBefore,
    gateAfter,
    documentationOnly,
    nextAction,
    rulesVersion: ID_RULES_VERSION,
  };
}

export const CATEGORY_LIST = ID_CATEGORIES;
