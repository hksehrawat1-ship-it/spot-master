/**
 * STEP 12 — Domestic treatment records (§3, §4, §5, §14, §16, §17, §25, §32, §33).
 *
 * A domestic treatment is a SEPARATE, versioned record. It is never informal text
 * inside the stain record and never a copy of a professional spotting procedure.
 *
 * Permanent principle: if domestic treatment cannot be recommended with at least
 * 9/10 confidence, it is not provided. The fallback is exactly:
 *   "Domestic treatment is not recommended."
 */

import type { FabricKey, ColourKey, ComponentPartKey, ConditionKey } from "@/data/masterStains";
import type { RiskLevel, UserRoleKey } from "@/lib/fabricSafety";
import { FOLLOW_LABEL } from "@/data/householdProducts";

export const DOMESTIC_DB_VERSION = "step12-domestic-v1";
export const DOMESTIC_NOT_RECOMMENDED = "Domestic treatment is not recommended.";
export const MIN_DOMESTIC_CONFIDENCE = 9;
export const STOP_MESSAGE =
  "Stop treatment. Rinse only as directed, do not apply another product or heat, and seek professional advice.";

/* ------------------------------------------------------------------ */
/* §25 Statuses                                                        */
/* ------------------------------------------------------------------ */

export const DOMESTIC_WORKFLOW_STATUSES = [
  "draft", "evidence_required", "testing_required", "under_technical_review",
  "under_safety_review", "approved", "published", "needs_review", "suspended",
  "rejected", "archived",
] as const;
export type DomesticWorkflowStatus = (typeof DOMESTIC_WORKFLOW_STATUSES)[number];

export const WORKFLOW_LABEL: Record<DomesticWorkflowStatus, string> = {
  draft: "Draft",
  evidence_required: "Evidence Required",
  testing_required: "Testing Required",
  under_technical_review: "Under Technical Review",
  under_safety_review: "Under Safety Review",
  approved: "Approved",
  published: "Published",
  needs_review: "Needs Review",
  suspended: "Suspended",
  rejected: "Rejected",
  archived: "Archived",
};

/** Only Published methods may ever be shown as actionable domestic guidance. */
export const isActionable = (s: DomesticWorkflowStatus) => s === "published";

/* §26 approval workflow order */
export const APPROVAL_WORKFLOW: { key: string; label: string }[] = [
  { key: "candidate", label: "Create candidate method" },
  { key: "eligibility", label: "Define narrow eligibility" },
  { key: "evidence", label: "Attach evidence" },
  { key: "product", label: "Verify household product" },
  { key: "test", label: "Define hidden-area test" },
  { key: "method", label: "Define method" },
  { key: "attempts", label: "Define attempt limit" },
  { key: "stop", label: "Define stop conditions" },
  { key: "controlled_testing", label: "Complete internal controlled testing" },
  { key: "technical_review", label: "Technical review" },
  { key: "safety_review", label: "Chemical-safety review" },
  { key: "country_review", label: "Country review" },
  { key: "approval", label: "Approval" },
  { key: "publication", label: "Publication" },
  { key: "monitoring", label: "Monitoring" },
  { key: "scheduled_review", label: "Scheduled review" },
];

/* ------------------------------------------------------------------ */
/* §22 Expected outcome vocabulary                                     */
/* ------------------------------------------------------------------ */

export const EXPECTED_OUTCOMES = [
  "likely_removable", "likely_reducible", "uncertain", "permanent_damage_possible",
  "pigment_may_remain", "professional_assessment_required",
] as const;
export type ExpectedOutcomeKey = (typeof EXPECTED_OUTCOMES)[number];

export const EXPECTED_OUTCOME_LABEL: Record<ExpectedOutcomeKey, string> = {
  likely_removable: "Likely removable",
  likely_reducible: "Likely reducible",
  uncertain: "Uncertain",
  permanent_damage_possible: "Permanent damage possible",
  pigment_may_remain: "Pigment may remain",
  professional_assessment_required: "Professional assessment required",
};

/* ------------------------------------------------------------------ */
/* §21 Stop conditions (mandatory on every published method)           */
/* ------------------------------------------------------------------ */

export const MANDATORY_STOP_CONDITIONS = [
  "Colour transfer",
  "Colour loss",
  "Ring formation",
  "Stain spreading",
  "Texture change",
  "Fibre weakening",
  "Shrinkage",
  "Distortion",
  "Surface lifting",
  "Coating change",
  "Decoration loosening",
  "Unexpected odour, heat or reaction",
  "You are unsure at any point",
  "No improvement within the approved attempt limit",
];

/* §16 hidden-area test fail conditions */
export const TEST_FAIL_CONDITIONS = [
  "Colour transfer", "Colour lightening", "Colour darkening", "Ring formation",
  "Texture change", "Stiffness", "Shrinkage", "Surface lifting", "Coating change",
  "Decoration change", "Unexpected odour", "Other visible damage",
];

/* §19 heat and drying controls — always shown */
export const HEAT_AND_DRYING_RULES = [
  "No tumble drying before inspection",
  "No ironing before inspection",
  "No steaming before inspection",
  "No hair dryer or direct heater",
  "No uncontrolled hot water",
  "No strong sun-drying when it may alter the stain or the dye",
];

/* §18 approved technique vocabulary — never universal */
export const TECHNIQUE_LIBRARY = [
  "Remove loose material without spreading",
  "Blot where approved",
  "Work from the edge toward the centre where technically appropriate",
  "Support the stain with a clean absorbent material",
  "Use minimal mechanical action",
  "Rinse according to verified instructions",
  "Inspect before drying",
];

/* ------------------------------------------------------------------ */
/* §14 Evidence record                                                 */
/* ------------------------------------------------------------------ */

export const ACCEPTED_EVIDENCE_TYPES = [
  "household_product_label", "manufacturer_instruction", "safety_information",
  "recognized_textile_guidance", "textile_chemistry_reference",
  "controlled_internal_trial", "documented_professional_observation",
] as const;
export type AcceptedEvidenceType = (typeof ACCEPTED_EVIDENCE_TYPES)[number];

export const EVIDENCE_TYPE_LABEL: Record<AcceptedEvidenceType, string> = {
  household_product_label: "Current household-product label",
  manufacturer_instruction: "Current manufacturer instructions",
  safety_information: "Current safety information",
  recognized_textile_guidance: "Recognized textile-care guidance",
  textile_chemistry_reference: "Credible textile-chemistry reference",
  controlled_internal_trial: "Controlled internal trial",
  documented_professional_observation: "Documented repeatable professional observation",
};

/** §13 — never usable as technical evidence. */
export const REJECTED_EVIDENCE_TYPES = [
  "social_media_video", "anonymous_blog", "popularity", "testimonial",
  "ai_generated_instruction", "uncontrolled_demonstration", "it_worked_for_me",
] as const;
export type RejectedEvidenceType = (typeof REJECTED_EVIDENCE_TYPES)[number];

export const REJECTED_EVIDENCE_LABEL: Record<RejectedEvidenceType, string> = {
  social_media_video: "Social-media video",
  anonymous_blog: "Anonymous blog claim",
  popularity: "Popularity",
  testimonial: "Testimonial",
  ai_generated_instruction: "AI-generated instruction",
  uncontrolled_demonstration: "Uncontrolled demonstration",
  it_worked_for_me: "\u201CIt worked for me\u201D report",
};

export type DomesticEvidence = {
  id: string;
  claim: string;
  source: string;
  sourceType: AcceptedEvidenceType;
  issuer: string;
  country?: string;
  publicationDate?: string;
  version?: string;
  relevantSection?: string;
  fabricTested?: string;
  colourTested?: string;
  stainCondition?: string;
  method?: string;
  control?: string;
  result?: string;
  damageObserved?: string;
  repeatability?: "single_observation" | "repeated_controlled" | "not_established";
  reviewer?: string;
  verification: "unverified" | "pending_review" | "verified" | "insufficient_information" | "disputed";
};

/* ------------------------------------------------------------------ */
/* §27 Controlled testing model                                        */
/* ------------------------------------------------------------------ */

export type ControlledTest = {
  testId: string;
  domesticTreatmentId: string;
  methodVersion: number;
  stain: string;
  fabric: string;
  fabricColour: string;
  fabricFinish?: string;
  product: string;
  method: string;
  controlSample: string;
  stainAge: string;
  stainQuantity: string;
  result: string;
  damageObserved: string;
  dryingResult: string;
  resultAfterLaundering: string;
  odour: string;
  residue: string;
  ringFormation: boolean;
  repeatability: "single_observation" | "repeated_controlled" | "not_established";
  decision: "supports_method" | "requires_change" | "rejects_method";
  reviewer: string;
  photographs: string[];
  testDate: string;
};

/* ------------------------------------------------------------------ */
/* §16 Hidden-area test                                                */
/* ------------------------------------------------------------------ */

export type HiddenAreaTest = {
  required: boolean;
  location: string | null;
  product: string | null;
  quantity: string | null;
  dilution: string | null;
  contactTime: string | null;
  technique: string | null;
  rinsing: string | null;
  dryingOrInspectionTime: string | null;
  whatToObserve: string[];
  passConditions: string[];
  failConditions: string[];
  source: string | null;
};

/* ------------------------------------------------------------------ */
/* §17 Method step                                                     */
/* ------------------------------------------------------------------ */

export type MethodStep = {
  order: number;
  action: string;
  material: string;
  quantityOrDilution: string | null;
  contactTime: string | null;
  temperatureLimit: string | null;
  technique: string;
  rinsing: string | null;
  inspectionPoint: string;
  stopCondition: string;
};

/* ------------------------------------------------------------------ */
/* §15 Confidence factors                                              */
/* ------------------------------------------------------------------ */

export const CONFIDENCE_FACTORS = [
  "stain_identification", "fabric_boundary", "colour_stability", "garment_construction",
  "care_instruction_compatibility", "method_evidence", "household_product_verification",
  "previous_treatment_certainty", "test_feasibility", "expected_damage_risk",
  "country_applicability",
] as const;
export type ConfidenceFactorKey = (typeof CONFIDENCE_FACTORS)[number];

export const CONFIDENCE_FACTOR_LABEL: Record<ConfidenceFactorKey, string> = {
  stain_identification: "Stain identification",
  fabric_boundary: "Fabric or material boundary",
  colour_stability: "Colour stability",
  garment_construction: "Garment construction",
  care_instruction_compatibility: "Care-instruction compatibility",
  method_evidence: "Method evidence",
  household_product_verification: "Household-product verification",
  previous_treatment_certainty: "Previous-treatment certainty",
  test_feasibility: "Test feasibility",
  expected_damage_risk: "Expected damage risk",
  country_applicability: "Country applicability",
};

/** All factors are mandatory safety factors: the weakest one caps the score. */
export type ConfidenceFactors = Record<ConfidenceFactorKey, number>;

/* ------------------------------------------------------------------ */
/* §5 Record                                                           */
/* ------------------------------------------------------------------ */

export type DomesticRevision = {
  version: number;
  at: string;
  by: string;
  summary: string;
  status: DomesticWorkflowStatus;
};

export type RequiredMaterial = {
  /** Household product key when an exact product is required. */
  productKey?: string;
  /** Material class when a generic class is acceptable and its minimums are met. */
  materialClass: string;
  label: string;
  exactProductRequired: boolean;
};

export type DomesticTreatment = {
  domesticTreatmentId: string;     // SM-DOM-000001 — stable, never reused
  key: string;
  version: number;
  treatmentName: string;

  stainKey: string;
  stainVariant: string | null;
  primaryCategory: string;
  secondaryComponents: string[];
  intendedCondition: ConditionKey[];

  eligibleRoles: UserRoleKey[];
  eligibleCountries: string[];
  eligibleFabrics: FabricKey[];
  prohibitedFabrics: FabricKey[];
  eligibleColours: ColourKey[];
  prohibitedColours: ColourKey[];
  eligibleConstructions: ComponentPartKey[] | ["plain_unembellished"];
  prohibitedConstructions: ComponentPartKey[];
  careLabelRequirements: string[];
  careLabelProhibitors: string[];

  minimumStainConfidence: number;
  fabricConfidenceRequirement: "high" | "moderate";
  maximumRiskLevel: RiskLevel;
  maximumStainAge: "fresh" | "recent" | "days" | "old";

  requiredMaterials: RequiredMaterial[];
  householdProductKey: string | null;
  productLabelRequirement: string;

  hiddenAreaTest: HiddenAreaTest;
  preparation: string[];
  methodSteps: MethodStep[];
  dryingRestrictions: string[];
  maximumAttempts: number | null;
  inspectionPoints: string[];
  actionsToAvoid: string[];
  stopConditions: string[];
  escalationPoint: string;
  expectedOutcome: ExpectedOutcomeKey;
  expectedOutcomeNote: string;

  confidenceFactors: ConfidenceFactors;
  evidence: DomesticEvidence[];
  technicalReviewer: string | null;
  safetyReviewer: string | null;
  countryReviewer: string | null;

  status: DomesticWorkflowStatus;
  lastReviewedDate: string | null;
  nextReviewDate: string | null;
  revisions: DomesticRevision[];
  /** §28 — reasons the record was flagged for review. */
  reviewTriggers: string[];
  /** Non-published internal note, e.g. why a candidate was rejected. */
  internalNote?: string;
};

export const formatDomesticId = (n: number) => `SM-DOM-${String(n).padStart(6, "0")}`;

let dseq = 0;
const dom = (t: Omit<DomesticTreatment, "domesticTreatmentId">): DomesticTreatment => ({
  domesticTreatmentId: formatDomesticId(++dseq),
  ...t,
});

const baseFactors = (over: Partial<ConfidenceFactors> = {}): ConfidenceFactors => ({
  stain_identification: 10,
  fabric_boundary: 10,
  colour_stability: 10,
  garment_construction: 10,
  care_instruction_compatibility: 10,
  method_evidence: 10,
  household_product_verification: 10,
  previous_treatment_certainty: 10,
  test_feasibility: 10,
  expected_damage_risk: 10,
  country_applicability: 10,
  ...over,
});

const commonAvoid = [
  "Do not rub the stain",
  "Do not scrape the surface",
  "Do not apply heat of any kind before inspection",
  "Do not apply a second product",
  "Do not mix any household products",
  "Do not use coloured or printed cloth",
];

/* ------------------------------------------------------------------ */
/* §33 Initial candidate scope                                         */
/* ------------------------------------------------------------------ */

export const DOMESTIC_TREATMENTS: DomesticTreatment[] = [
  /* 1 — PUBLISHED: fresh water-soluble residue, washable colourfast textile */
  dom({
    key: "fresh_water_soluble_blot_wash",
    version: 3,
    treatmentName: "Safe first response for fresh water-soluble residue on a washable colourfast textile",
    stainKey: "water_soluble_residue",
    stainVariant: "fresh, undried, not previously treated",
    primaryCategory: "water_based",
    secondaryComponents: [],
    intendedCondition: ["fresh", "wet"],
    eligibleRoles: ["domestic_user", "learner"],
    eligibleCountries: ["IN", "GB"],
    eligibleFabrics: ["cotton", "linen", "polyester"],
    prohibitedFabrics: ["wool", "silk", "viscose", "acetate", "triacetate", "leather", "suede", "fur", "coated", "waterproof", "unknown_material"],
    eligibleColours: ["white", "light"],
    prohibitedColours: ["dark", "bright", "multicoloured", "printed", "garment_dyed", "metallic", "unknown_stability"],
    eligibleConstructions: ["plain_unembellished"],
    prohibitedConstructions: ["prints", "embroidery", "beads", "sequins", "metallic_thread", "adhesives", "coatings", "laminations", "leather_trims"],
    careLabelRequirements: ["Care label permits washing in water"],
    careLabelProhibitors: ["do_not_wash", "dry_clean_only", "spot_clean_only", "do_not_clean"],
    minimumStainConfidence: 9,
    fabricConfidenceRequirement: "high",
    maximumRiskLevel: "green",
    maximumStainAge: "fresh",
    requiredMaterials: [
      { materialClass: "cool_water", productKey: "cool_water_in", label: "Cool water", exactProductRequired: false },
      { materialClass: "white_absorbent_cloth", productKey: "white_cotton_cloth", label: "Clean white absorbent cloth", exactProductRequired: false },
    ],
    householdProductKey: null,
    productLabelRequirement: "No chemical product is used in this method.",
    hiddenAreaTest: {
      required: true,
      location: "Inside seam allowance or inside hem, out of sight",
      product: "Cool water on a clean white absorbent cloth",
      quantity: "Enough to dampen the cloth; the garment must not be saturated",
      dilution: null,
      contactTime: "30 seconds of contact",
      technique: "Press the damp cloth against the hidden area without rubbing",
      rinsing: "Blot with a second clean, dry white cloth",
      dryingOrInspectionTime: "Inspect after 10 minutes of air drying",
      whatToObserve: ["Any colour on the white cloth", "Any change in the fabric surface", "Any water ring at the damp edge"],
      passConditions: ["No colour on the white cloth", "No change in surface or texture", "No ring at the damp edge"],
      failConditions: TEST_FAIL_CONDITIONS,
      source: "Recognized textile-care guidance — colourfastness check before water contact",
    },
    preparation: [
      "Work on a flat surface in good light",
      "Place a clean white absorbent cloth underneath the stained area",
      "Remove any loose material without spreading it",
    ],
    methodSteps: [
      {
        order: 1,
        action: "Absorb the loose liquid",
        material: "Clean white absorbent cloth",
        quantityOrDilution: null,
        contactTime: "Until no more liquid transfers to the cloth",
        temperatureLimit: "Room temperature only",
        technique: "Blot straight down; do not rub or wipe sideways",
        rinsing: null,
        inspectionPoint: "Check whether the stained area is still wet",
        stopCondition: "Stop if any colour transfers to the white cloth",
      },
      {
        order: 2,
        action: "Flush the residue with cool water",
        material: "Cool water on a clean white absorbent cloth",
        quantityOrDilution: "Dampen the cloth only; do not pour water onto the garment",
        contactTime: "Work for no more than 2 minutes",
        temperatureLimit: "Cool, below 30 \u00B0C",
        technique: "Press from the edge of the stain toward the centre with minimal mechanical action",
        rinsing: "Blot with a second clean damp cloth to remove loosened residue",
        inspectionPoint: "Check for a ring at the damp edge and for any colour on the cloth",
        stopCondition: "Stop if a ring forms, colour transfers, or the stain spreads",
      },
      {
        order: 3,
        action: "Inspect before drying",
        material: "Daylight or a bright lamp",
        quantityOrDilution: null,
        contactTime: null,
        temperatureLimit: "No heat of any kind",
        technique: "Inspect the treated area and the surrounding fabric while still damp",
        rinsing: null,
        inspectionPoint: "Ring formation, colour change, texture change, residue",
        stopCondition: "Stop and seek professional advice if any stop condition is present",
      },
      {
        order: 4,
        action: "Air dry away from heat and strong sunlight, then re-inspect",
        material: "Air drying only",
        quantityOrDilution: null,
        contactTime: null,
        temperatureLimit: "Room temperature; no tumble drying, ironing, steaming, hair dryer or heater",
        technique: "Lay flat or hang in shade",
        rinsing: null,
        inspectionPoint: "Confirm the mark is gone before any laundering or pressing",
        stopCondition: "Stop if any mark, ring or colour change remains",
      },
    ],
    dryingRestrictions: HEAT_AND_DRYING_RULES,
    maximumAttempts: 2,
    inspectionPoints: ["After blotting", "After flushing", "Before drying", "After drying"],
    actionsToAvoid: commonAvoid,
    stopConditions: MANDATORY_STOP_CONDITIONS,
    escalationPoint: "If the mark remains after the second attempt, stop and take the garment to a professional cleaner with this case record.",
    expectedOutcome: "likely_removable",
    expectedOutcomeNote: "Fresh, untreated water-soluble residue on a colourfast washable textile is usually removable. Removal is never guaranteed.",
    confidenceFactors: baseFactors({ expected_damage_risk: 9, previous_treatment_certainty: 9 }),
    evidence: [
      {
        id: "SM-DOM-EV-0001",
        claim: "Cool water blotting is an appropriate first response for fresh water-soluble residue on washable colourfast cotton, linen and polyester.",
        source: "Recognized textile-care guidance — water-soluble soil first response",
        sourceType: "recognized_textile_guidance",
        issuer: "Textile-care guidance body",
        country: "IN",
        publicationDate: "2025-04-10",
        version: "2025.1",
        relevantSection: "Fresh water-soluble soils",
        fabricTested: "Cotton, linen, polyester",
        colourTested: "White and light",
        stainCondition: "Fresh, undried",
        method: "Blot, flush with cool water, inspect before drying",
        control: "Untreated half of the same stained swatch",
        result: "Residue removed without ring formation",
        damageObserved: "None",
        repeatability: "repeated_controlled",
        reviewer: "Technical reviewer A",
        verification: "verified",
      },
      {
        id: "SM-DOM-EV-0002",
        claim: "A hidden-area water contact test detects non-colourfast dyes before treatment.",
        source: "Credible textile-chemistry reference — colourfastness to water",
        sourceType: "textile_chemistry_reference",
        issuer: "Textile chemistry reference",
        publicationDate: "2024-11-02",
        repeatability: "repeated_controlled",
        reviewer: "Technical reviewer A",
        verification: "verified",
      },
    ],
    technicalReviewer: "Technical reviewer A",
    safetyReviewer: "Safety reviewer B",
    countryReviewer: "Country reviewer IN/GB",
    status: "published",
    lastReviewedDate: "2026-02-10",
    nextReviewDate: "2027-02-10",
    revisions: [
      { version: 1, at: "2025-10-01", by: "Content author", summary: "Candidate method created", status: "draft" },
      { version: 2, at: "2025-12-14", by: "Technical reviewer A", summary: "Attempt limit set to 2 after controlled trials", status: "under_technical_review" },
      { version: 3, at: "2026-02-10", by: "Safety reviewer B", summary: "Safety review completed; published for IN and GB", status: "published" },
    ],
    reviewTriggers: [],
  }),

  /* 2 — PUBLISHED: fresh beverage stain on washable textile */
  dom({
    key: "fresh_beverage_cool_water_detergent",
    version: 2,
    treatmentName: "Domestic treatment for a fresh known beverage stain on a washable colourfast textile",
    stainKey: "beverage_tea_coffee_fresh",
    stainVariant: "fresh, not dried, not previously treated",
    primaryCategory: "dye_tannin",
    secondaryComponents: ["sugar", "tannin"],
    intendedCondition: ["fresh", "wet"],
    eligibleRoles: ["domestic_user", "learner"],
    eligibleCountries: ["IN"],
    eligibleFabrics: ["cotton", "linen", "polyester"],
    prohibitedFabrics: ["wool", "silk", "viscose", "acetate", "triacetate", "leather", "suede", "fur", "coated", "waterproof", "unknown_material"],
    eligibleColours: ["white", "light"],
    prohibitedColours: ["dark", "bright", "multicoloured", "printed", "garment_dyed", "metallic", "unknown_stability"],
    eligibleConstructions: ["plain_unembellished"],
    prohibitedConstructions: ["prints", "embroidery", "beads", "sequins", "metallic_thread", "adhesives", "coatings", "laminations", "leather_trims"],
    careLabelRequirements: ["Care label permits washing in water"],
    careLabelProhibitors: ["do_not_wash", "dry_clean_only", "spot_clean_only", "do_not_clean"],
    minimumStainConfidence: 9,
    fabricConfidenceRequirement: "high",
    maximumRiskLevel: "green",
    maximumStainAge: "fresh",
    requiredMaterials: [
      { materialClass: "cool_water", productKey: "cool_water_in", label: "Cool water", exactProductRequired: false },
      { materialClass: "white_absorbent_cloth", productKey: "white_cotton_cloth", label: "Clean white absorbent cloth", exactProductRequired: false },
      { materialClass: "labelled_laundry_detergent", productKey: "generic_liquid_detergent_in", label: "Liquid laundry detergent meeting the generic minimum requirements", exactProductRequired: false },
    ],
    householdProductKey: "generic_liquid_detergent_in",
    productLabelRequirement:
      "A liquid laundry detergent intended for textile laundering, with a current label in the user's market and language, no added bleach and no unknown active ingredients.",
    hiddenAreaTest: {
      required: true,
      location: "Inside seam allowance or inside hem",
      product: "Detergent prepared exactly as its own label directs, on a clean white cloth",
      quantity: FOLLOW_LABEL,
      dilution: FOLLOW_LABEL,
      contactTime: "60 seconds of contact",
      technique: "Press the damp cloth against the hidden area without rubbing",
      rinsing: "Blot with a clean cloth dampened with cool water until no detergent remains",
      dryingOrInspectionTime: "Inspect after 15 minutes of air drying",
      whatToObserve: ["Colour on the white cloth", "Lightening or darkening of the hidden area", "Texture or stiffness change", "Ring at the damp edge"],
      passConditions: ["No colour on the cloth", "No colour change in the hidden area", "No texture change", "No ring"],
      failConditions: TEST_FAIL_CONDITIONS,
      source: "Recognized textile-care guidance — detergent spot test before treatment",
    },
    preparation: [
      "Work on a flat surface in good light",
      "Place a clean white absorbent cloth underneath the stained area",
      "Confirm the care label permits washing in water",
    ],
    methodSteps: [
      {
        order: 1,
        action: "Blot the fresh liquid",
        material: "Clean white absorbent cloth",
        quantityOrDilution: null,
        contactTime: "Until no more liquid transfers",
        temperatureLimit: "Room temperature",
        technique: "Blot straight down with minimal mechanical action",
        rinsing: null,
        inspectionPoint: "Check the cloth for garment dye",
        stopCondition: "Stop if garment colour transfers to the cloth",
      },
      {
        order: 2,
        action: "Flush from the reverse with cool water",
        material: "Cool water",
        quantityOrDilution: "A gentle flow through the reverse of the fabric",
        contactTime: "Up to 2 minutes",
        temperatureLimit: "Cool, below 30 \u00B0C",
        technique: "Flush from the reverse so the stain leaves the way it came in",
        rinsing: "Continue until the water runs clear",
        inspectionPoint: "Check whether the stain is reducing",
        stopCondition: "Stop if the stain spreads or a ring forms",
      },
      {
        order: 3,
        action: "Apply the detergent exactly as its own label directs",
        material: "Liquid laundry detergent meeting the stated minimum requirements",
        quantityOrDilution: FOLLOW_LABEL,
        contactTime: FOLLOW_LABEL,
        temperatureLimit: "Never above the care-label maximum wash temperature",
        technique: "Apply with a clean white cloth; use minimal mechanical action, no rubbing",
        rinsing: "Rinse thoroughly with cool water until no detergent remains",
        inspectionPoint: "Check for colour change and ring formation",
        stopCondition: "Stop if any colour change, ring, texture change or spreading occurs",
      },
      {
        order: 4,
        action: "Inspect before drying, then air dry",
        material: "Air drying only",
        quantityOrDilution: null,
        contactTime: null,
        temperatureLimit: "No tumble drying, ironing, steaming, hair dryer or heater before inspection",
        technique: "Inspect while damp, then dry flat in shade",
        rinsing: null,
        inspectionPoint: "Confirm the mark is gone before any laundering or pressing",
        stopCondition: "Stop if any mark remains — heat can set the remaining stain",
      },
    ],
    dryingRestrictions: HEAT_AND_DRYING_RULES,
    maximumAttempts: 2,
    inspectionPoints: ["After blotting", "After flushing", "After detergent contact", "Before drying"],
    actionsToAvoid: [...commonAvoid, "Do not use hot water — heat can set a tannin stain"],
    stopConditions: MANDATORY_STOP_CONDITIONS,
    escalationPoint: "If the stain remains after the second attempt, stop and take the garment to a professional cleaner without drying or pressing it.",
    expectedOutcome: "likely_reducible",
    expectedOutcomeNote: "Fresh beverage stains on washable colourfast textiles are usually reducible and often removable. Removal is never guaranteed.",
    confidenceFactors: baseFactors({ method_evidence: 9, expected_damage_risk: 9, household_product_verification: 9 }),
    evidence: [
      {
        id: "SM-DOM-EV-0003",
        claim: "Cool-water flushing followed by label-directed liquid detergent reduces fresh tannin beverage stains on washable colourfast cotton.",
        source: "Controlled internal trial series DT-2025-014",
        sourceType: "controlled_internal_trial",
        issuer: "Stain Master technical laboratory",
        country: "IN",
        publicationDate: "2025-11-20",
        fabricTested: "Cotton poplin, polyester-cotton",
        colourTested: "White, light blue",
        stainCondition: "Fresh, under 10 minutes",
        method: "Blot, reverse flush, label-directed detergent, cool rinse",
        control: "Untreated stained control swatch",
        result: "Stain removed or strongly reduced in 11 of 12 controlled swatches",
        damageObserved: "None",
        repeatability: "repeated_controlled",
        reviewer: "Technical reviewer A",
        verification: "verified",
      },
      {
        id: "SM-DOM-EV-0004",
        claim: "Detergent quantity, dilution and contact time are taken only from the current product label.",
        source: "Current household-product label",
        sourceType: "household_product_label",
        issuer: "Detergent manufacturer",
        country: "IN",
        repeatability: "repeated_controlled",
        reviewer: "Safety reviewer B",
        verification: "verified",
      },
    ],
    technicalReviewer: "Technical reviewer A",
    safetyReviewer: "Safety reviewer B",
    countryReviewer: "Country reviewer IN",
    status: "published",
    lastReviewedDate: "2026-02-10",
    nextReviewDate: "2027-02-10",
    revisions: [
      { version: 1, at: "2025-11-25", by: "Content author", summary: "Candidate created from controlled trial DT-2025-014", status: "draft" },
      { version: 2, at: "2026-02-10", by: "Safety reviewer B", summary: "Technical, safety and country review completed; published for IN", status: "published" },
    ],
    reviewTriggers: [],
  }),

  /* 3 — PUBLISHED: fresh cooking-oil stain, washable textile */
  dom({
    key: "fresh_cooking_oil_detergent",
    version: 2,
    treatmentName: "Domestic treatment for a fresh cooking-oil stain on a washable colourfast textile",
    stainKey: "cooking_oil_fresh",
    stainVariant: "fresh, not heated, not previously treated",
    primaryCategory: "oil_grease",
    secondaryComponents: [],
    intendedCondition: ["fresh"],
    eligibleRoles: ["domestic_user", "learner"],
    eligibleCountries: ["IN", "GB"],
    eligibleFabrics: ["cotton", "linen", "polyester"],
    prohibitedFabrics: ["wool", "silk", "viscose", "acetate", "triacetate", "leather", "suede", "fur", "coated", "waterproof", "unknown_material"],
    eligibleColours: ["white", "light"],
    prohibitedColours: ["dark", "bright", "multicoloured", "printed", "garment_dyed", "metallic", "unknown_stability"],
    eligibleConstructions: ["plain_unembellished"],
    prohibitedConstructions: ["prints", "embroidery", "beads", "sequins", "metallic_thread", "adhesives", "coatings", "laminations", "leather_trims"],
    careLabelRequirements: ["Care label permits washing in water"],
    careLabelProhibitors: ["do_not_wash", "dry_clean_only", "spot_clean_only", "do_not_clean"],
    minimumStainConfidence: 9,
    fabricConfidenceRequirement: "high",
    maximumRiskLevel: "green",
    maximumStainAge: "fresh",
    requiredMaterials: [
      { materialClass: "white_absorbent_cloth", productKey: "white_cotton_cloth", label: "Clean white absorbent cloth", exactProductRequired: false },
      { materialClass: "labelled_laundry_detergent", productKey: "generic_liquid_detergent_in", label: "Liquid laundry detergent meeting the generic minimum requirements", exactProductRequired: false },
      { materialClass: "lukewarm_water", label: "Lukewarm water within the care-label limit", exactProductRequired: false },
    ],
    householdProductKey: "generic_liquid_detergent_in",
    productLabelRequirement:
      "A liquid laundry detergent intended for textile laundering, correct market label, no added bleach, no unknown active ingredients, used strictly according to its own label.",
    hiddenAreaTest: {
      required: true,
      location: "Inside seam allowance or inside hem",
      product: "Detergent prepared exactly as its own label directs",
      quantity: FOLLOW_LABEL,
      dilution: FOLLOW_LABEL,
      contactTime: "60 seconds of contact",
      technique: "Press with a clean white cloth; no rubbing",
      rinsing: "Rinse the tested area with cool water until no detergent remains",
      dryingOrInspectionTime: "Inspect after 15 minutes of air drying",
      whatToObserve: ["Colour on the cloth", "Lightening or darkening", "Stiffness", "Ring at the damp edge"],
      passConditions: ["No colour transfer", "No colour change", "No stiffness", "No ring"],
      failConditions: TEST_FAIL_CONDITIONS,
      source: "Recognized textile-care guidance — detergent spot test before treatment",
    },
    preparation: [
      "Do not apply heat or wash the garment before treatment",
      "Place a clean white absorbent cloth underneath the stained area",
      "Remove any loose food material without spreading it",
    ],
    methodSteps: [
      {
        order: 1,
        action: "Lift surface oil",
        material: "Clean white absorbent cloth",
        quantityOrDilution: null,
        contactTime: "Until no more oil transfers",
        temperatureLimit: "Room temperature",
        technique: "Blot straight down; never rub the oil into the weave",
        rinsing: null,
        inspectionPoint: "Check how much oil transferred to the cloth",
        stopCondition: "Stop if the stain spreads",
      },
      {
        order: 2,
        action: "Apply the detergent exactly as its own label directs",
        material: "Liquid laundry detergent meeting the stated minimum requirements",
        quantityOrDilution: FOLLOW_LABEL,
        contactTime: FOLLOW_LABEL,
        temperatureLimit: "Never above the care-label maximum wash temperature",
        technique: "Apply to the stain with a clean white cloth using minimal mechanical action",
        rinsing: "Rinse with lukewarm water within the care-label limit until no detergent remains",
        inspectionPoint: "Check for colour change, ring formation and remaining oil shadow",
        stopCondition: "Stop if any colour change, ring or texture change appears",
      },
      {
        order: 3,
        action: "Inspect before drying",
        material: "Daylight or a bright lamp",
        quantityOrDilution: null,
        contactTime: null,
        temperatureLimit: "No heat of any kind before inspection",
        technique: "Inspect the damp area from both sides",
        rinsing: null,
        inspectionPoint: "An oil shadow may only be visible once dry — check again after drying",
        stopCondition: "Stop and escalate if a shadow or ring remains",
      },
      {
        order: 4,
        action: "Air dry away from heat, then re-inspect before any laundering",
        material: "Air drying only",
        quantityOrDilution: null,
        contactTime: null,
        temperatureLimit: "No tumble drying, ironing, steaming, hair dryer or heater",
        technique: "Dry flat in shade",
        rinsing: null,
        inspectionPoint: "Confirm no oil shadow before pressing or machine drying",
        stopCondition: "Stop if any shadow remains — heat will set it",
      },
    ],
    dryingRestrictions: HEAT_AND_DRYING_RULES,
    maximumAttempts: 2,
    inspectionPoints: ["After blotting", "After detergent contact", "Before drying", "After drying"],
    actionsToAvoid: [...commonAvoid, "Do not apply cooking oil, talcum powder, cornflour or dishwashing mixtures"],
    stopConditions: MANDATORY_STOP_CONDITIONS,
    escalationPoint: "If an oil shadow remains after the second attempt, stop and take the garment to a professional cleaner before it is dried or pressed.",
    expectedOutcome: "likely_reducible",
    expectedOutcomeNote: "Fresh cooking-oil stains on washable colourfast textiles are usually reducible. Aged or heated oil often needs professional treatment.",
    confidenceFactors: baseFactors({ method_evidence: 9, expected_damage_risk: 9, household_product_verification: 9, previous_treatment_certainty: 9 }),
    evidence: [
      {
        id: "SM-DOM-EV-0005",
        claim: "Label-directed liquid laundry detergent reduces fresh cooking-oil soil on washable cotton and polyester without damage.",
        source: "Controlled internal trial series DT-2025-021",
        sourceType: "controlled_internal_trial",
        issuer: "Stain Master technical laboratory",
        country: "IN",
        publicationDate: "2025-12-05",
        fabricTested: "Cotton, polyester, polyester-cotton",
        colourTested: "White, light",
        stainCondition: "Fresh, unheated",
        method: "Blot, label-directed detergent, lukewarm rinse, inspect before drying",
        control: "Untreated stained control swatch",
        result: "Strong reduction or full removal in 10 of 12 controlled swatches",
        damageObserved: "None",
        repeatability: "repeated_controlled",
        reviewer: "Technical reviewer A",
        verification: "verified",
      },
    ],
    technicalReviewer: "Technical reviewer A",
    safetyReviewer: "Safety reviewer B",
    countryReviewer: "Country reviewer IN/GB",
    status: "published",
    lastReviewedDate: "2026-02-10",
    nextReviewDate: "2027-02-10",
    revisions: [
      { version: 1, at: "2025-12-08", by: "Content author", summary: "Candidate created from controlled trial DT-2025-021", status: "draft" },
      { version: 2, at: "2026-02-10", by: "Safety reviewer B", summary: "Reviews completed; published for IN and GB", status: "published" },
    ],
    reviewTriggers: [],
  }),

  /* 4 — UNDER TECHNICAL REVIEW: dried mud / particulate soil */
  dom({
    key: "dry_particulate_soil_removal",
    version: 1,
    treatmentName: "Candidate: removal of dried loose mud or particulate soil after safe drying",
    stainKey: "particulate_mud",
    stainVariant: "loose, fully dried, not previously treated",
    primaryCategory: "particulate",
    secondaryComponents: [],
    intendedCondition: ["dried"],
    eligibleRoles: ["domestic_user"],
    eligibleCountries: ["IN"],
    eligibleFabrics: ["cotton", "linen", "polyester"],
    prohibitedFabrics: ["wool", "silk", "viscose", "acetate", "triacetate", "leather", "suede", "fur", "coated", "waterproof", "unknown_material"],
    eligibleColours: ["white", "light"],
    prohibitedColours: ["dark", "bright", "multicoloured", "printed", "garment_dyed", "metallic", "unknown_stability"],
    eligibleConstructions: ["plain_unembellished"],
    prohibitedConstructions: ["prints", "embroidery", "beads", "sequins", "metallic_thread", "adhesives", "coatings", "laminations", "leather_trims"],
    careLabelRequirements: ["Care label permits washing in water"],
    careLabelProhibitors: ["do_not_wash", "dry_clean_only", "spot_clean_only", "do_not_clean"],
    minimumStainConfidence: 9,
    fabricConfidenceRequirement: "high",
    maximumRiskLevel: "green",
    maximumStainAge: "days",
    requiredMaterials: [
      { materialClass: "white_absorbent_cloth", productKey: "white_cotton_cloth", label: "Clean white absorbent cloth", exactProductRequired: false },
    ],
    householdProductKey: null,
    productLabelRequirement: "No chemical product is used in the dry-removal stage.",
    hiddenAreaTest: {
      required: false,
      location: null,
      product: null,
      quantity: null,
      dilution: null,
      contactTime: null,
      technique: null,
      rinsing: null,
      dryingOrInspectionTime: null,
      whatToObserve: [],
      passConditions: [],
      failConditions: TEST_FAIL_CONDITIONS,
      source: null,
    },
    preparation: ["Allow the soil to dry completely before touching it"],
    methodSteps: [
      {
        order: 1,
        action: "Remove dried loose soil",
        material: "Clean white absorbent cloth",
        quantityOrDilution: null,
        contactTime: null,
        temperatureLimit: "No heat",
        technique: "Lift the loose soil away from the surface without pressing it into the weave",
        rinsing: null,
        inspectionPoint: "Check whether a coloured mark remains after the loose soil is gone",
        stopCondition: "Stop if the soil smears or the fabric surface changes",
      },
    ],
    dryingRestrictions: HEAT_AND_DRYING_RULES,
    maximumAttempts: 1,
    inspectionPoints: ["After dry removal"],
    actionsToAvoid: [...commonAvoid, "Do not wet dried soil before the loose material is removed"],
    stopConditions: MANDATORY_STOP_CONDITIONS,
    escalationPoint: "If a coloured mark remains after the loose soil is removed, stop — the remaining mark requires a separate assessment.",
    expectedOutcome: "likely_reducible",
    expectedOutcomeNote: "Dry removal addresses loose particulate only. Any remaining coloured mark is a separate case.",
    confidenceFactors: baseFactors({ method_evidence: 7, test_feasibility: 8, expected_damage_risk: 9 }),
    evidence: [
      {
        id: "SM-DOM-EV-0006",
        claim: "Dry removal of loose particulate soil before any wet treatment reduces spreading.",
        source: "Recognized textile-care guidance — particulate soil handling",
        sourceType: "recognized_textile_guidance",
        issuer: "Textile-care guidance body",
        publicationDate: "2025-04-10",
        repeatability: "repeated_controlled",
        reviewer: "Technical reviewer A",
        verification: "pending_review",
      },
    ],
    technicalReviewer: null,
    safetyReviewer: null,
    countryReviewer: null,
    status: "under_technical_review",
    lastReviewedDate: null,
    nextReviewDate: null,
    revisions: [
      { version: 1, at: "2026-01-30", by: "Content author", summary: "Candidate created for review; evidence for the wet stage is incomplete", status: "under_technical_review" },
    ],
    reviewTriggers: [],
    internalNote:
      "Method evidence for the wet follow-up stage is not yet controlled. Confidence is capped at 7/10 by method evidence, so the method is not publishable.",
  }),

  /* 5 — SUSPENDED after an adverse outcome */
  dom({
    key: "oxygen_product_light_cotton",
    version: 4,
    treatmentName: "Suspended: oxygen-based laundry product on light cotton",
    stainKey: "beverage_tea_coffee_fresh",
    stainVariant: "dried",
    primaryCategory: "dye_tannin",
    secondaryComponents: ["tannin"],
    intendedCondition: ["dried"],
    eligibleRoles: ["domestic_user"],
    eligibleCountries: ["IN"],
    eligibleFabrics: ["cotton"],
    prohibitedFabrics: ["wool", "silk", "viscose", "acetate", "triacetate", "leather", "suede", "fur", "coated", "waterproof", "unknown_material"],
    eligibleColours: ["white"],
    prohibitedColours: ["light", "dark", "bright", "multicoloured", "printed", "garment_dyed", "metallic", "unknown_stability"],
    eligibleConstructions: ["plain_unembellished"],
    prohibitedConstructions: ["prints", "embroidery", "beads", "sequins", "metallic_thread", "adhesives", "coatings", "laminations", "leather_trims"],
    careLabelRequirements: ["Care label permits washing in water"],
    careLabelProhibitors: ["do_not_wash", "do_not_bleach", "dry_clean_only", "spot_clean_only", "do_not_clean"],
    minimumStainConfidence: 9,
    fabricConfidenceRequirement: "high",
    maximumRiskLevel: "green",
    maximumStainAge: "days",
    requiredMaterials: [
      { materialClass: "labelled_oxygen_laundry_product", productKey: "oxygen_laundry_generic_in", label: "Oxygen-based laundry product (exact product required)", exactProductRequired: true },
    ],
    householdProductKey: "oxygen_laundry_generic_in",
    productLabelRequirement: "The exact oxygen-based laundry product must be selected — formulation affects safety.",
    hiddenAreaTest: {
      required: true,
      location: "Inside hem",
      product: "The selected oxygen-based laundry product prepared per its label",
      quantity: FOLLOW_LABEL,
      dilution: FOLLOW_LABEL,
      contactTime: FOLLOW_LABEL,
      technique: "Press with a clean white cloth; no rubbing",
      rinsing: "Rinse until no product remains",
      dryingOrInspectionTime: "Inspect after 20 minutes of air drying",
      whatToObserve: ["Colour lightening", "Texture change", "Ring formation"],
      passConditions: ["No colour lightening", "No texture change", "No ring"],
      failConditions: TEST_FAIL_CONDITIONS,
      source: "Product label",
    },
    preparation: ["Confirm the exact product and its current label"],
    methodSteps: [],
    dryingRestrictions: HEAT_AND_DRYING_RULES,
    maximumAttempts: 1,
    inspectionPoints: ["Before drying"],
    actionsToAvoid: commonAvoid,
    stopConditions: MANDATORY_STOP_CONDITIONS,
    escalationPoint: "Seek professional advice.",
    expectedOutcome: "uncertain",
    expectedOutcomeNote: "Suspended pending review.",
    confidenceFactors: baseFactors({ household_product_verification: 4, method_evidence: 6, expected_damage_risk: 5 }),
    evidence: [],
    technicalReviewer: "Technical reviewer A",
    safetyReviewer: null,
    countryReviewer: null,
    status: "suspended",
    lastReviewedDate: "2026-03-02",
    nextReviewDate: "2026-04-02",
    revisions: [
      { version: 3, at: "2026-01-05", by: "Technical reviewer A", summary: "Published for white cotton only", status: "published" },
      { version: 4, at: "2026-03-02", by: "Safety reviewer B", summary: "Suspended immediately after a credible colour-loss damage report", status: "suspended" },
    ],
    reviewTriggers: ["Credible damage report", "Household product formulation unverified"],
    internalNote: "Suspended after a credible colour-loss report. Not actionable; retained for audit and re-review.",
  }),

  /* 6 — REJECTED internet practice, retained as a restricted audit record */
  dom({
    key: "rejected_pantry_mixture",
    version: 1,
    treatmentName: "Rejected candidate: pantry mixture applied to a dye stain",
    stainKey: "dye_transfer",
    stainVariant: null,
    primaryCategory: "dye_transfer",
    secondaryComponents: [],
    intendedCondition: [],
    eligibleRoles: [],
    eligibleCountries: [],
    eligibleFabrics: [],
    prohibitedFabrics: [],
    eligibleColours: [],
    prohibitedColours: [],
    eligibleConstructions: [],
    prohibitedConstructions: [],
    careLabelRequirements: [],
    careLabelProhibitors: [],
    minimumStainConfidence: 9,
    fabricConfidenceRequirement: "high",
    maximumRiskLevel: "green",
    maximumStainAge: "fresh",
    requiredMaterials: [],
    householdProductKey: null,
    productLabelRequirement: "Not applicable.",
    hiddenAreaTest: {
      required: true, location: null, product: null, quantity: null, dilution: null,
      contactTime: null, technique: null, rinsing: null, dryingOrInspectionTime: null,
      whatToObserve: [], passConditions: [], failConditions: TEST_FAIL_CONDITIONS, source: null,
    },
    preparation: [],
    methodSteps: [],
    dryingRestrictions: HEAT_AND_DRYING_RULES,
    maximumAttempts: null,
    inspectionPoints: [],
    actionsToAvoid: [],
    stopConditions: MANDATORY_STOP_CONDITIONS,
    escalationPoint: "Professional assessment required.",
    expectedOutcome: "professional_assessment_required",
    expectedOutcomeNote: "Not publishable.",
    confidenceFactors: baseFactors({
      method_evidence: 0, household_product_verification: 0, expected_damage_risk: 2, colour_stability: 3,
    }),
    evidence: [],
    technicalReviewer: "Technical reviewer A",
    safetyReviewer: "Safety reviewer B",
    countryReviewer: null,
    status: "rejected",
    lastReviewedDate: "2026-02-18",
    nextReviewDate: null,
    revisions: [
      { version: 1, at: "2026-02-18", by: "Technical reviewer A", summary: "Rejected — popular online practice with no credible evidence and a real dye and residue risk", status: "rejected" },
    ],
    reviewTriggers: [],
    internalNote:
      "Rejected internet practice. Acidic and abrasive pantry materials can change dyes, leave residue and create rings. Retained as a restricted audit record only; never publicly visible.",
  }),
];

export const DOMESTIC_BY_KEY: Record<string, DomesticTreatment> = Object.fromEntries(
  DOMESTIC_TREATMENTS.map((t) => [t.key, t]),
);
export const DOMESTIC_BY_ID: Record<string, DomesticTreatment> = Object.fromEntries(
  DOMESTIC_TREATMENTS.map((t) => [t.domesticTreatmentId, t]),
);
export const LAST_DOMESTIC_SEQUENCE = dseq;

/* ------------------------------------------------------------------ */
/* §32 Migration review of pre-existing domestic content               */
/* ------------------------------------------------------------------ */

export const MIGRATION_CLASSIFICATIONS = [
  "candidate_for_review", "approved_evidence_backed", "insufficient_evidence", "unsafe",
  "chemically_incompatible", "textile_risk_concern", "professional_only", "rejected_internet_practice",
] as const;
export type MigrationClassification = (typeof MIGRATION_CLASSIFICATIONS)[number];

export const MIGRATION_LABEL: Record<MigrationClassification, string> = {
  candidate_for_review: "Candidate for review",
  approved_evidence_backed: "Approved evidence-backed domestic treatment",
  insufficient_evidence: "Insufficient evidence",
  unsafe: "Unsafe",
  chemically_incompatible: "Chemically incompatible",
  textile_risk_concern: "Textile-risk concern",
  professional_only: "Professional-only",
  rejected_internet_practice: "Rejected internet practice",
};

export type MigrationRecord = {
  id: string;
  sourceLocation: string;
  originalContent: string;
  stainKey?: string;
  classification: MigrationClassification;
  rejectionReason?: string;
  publiclyVisible: boolean;
  reviewer: string;
  reviewedAt: string;
};

/**
 * Audit of household content that existed in the project before Step 12.
 * Nothing classified as unsafe or rejected remains publicly visible.
 */
export const MIGRATION_AUDIT: MigrationRecord[] = [
  {
    id: "MIG-0001",
    sourceLocation: "src/data/stains.ts — treatment notes on legacy stain cards",
    originalContent: "Short informal household notes stored as free text on the legacy stain list.",
    classification: "insufficient_evidence",
    rejectionReason:
      "Informal free text with no source, no fabric or colour boundary, no attempt limit and no stop conditions. Cannot be published as a domestic treatment.",
    publiclyVisible: false,
    reviewer: "Technical reviewer A",
    reviewedAt: "2026-02-18",
  },
  {
    id: "MIG-0002",
    sourceLocation: "src/pages/StainIdentify.tsx — legacy \u201CDIY\u201D result block",
    originalContent: "Legacy result section labelled DIY, presenting household steps alongside professional methods.",
    classification: "professional_only",
    rejectionReason:
      "The block mixed household guidance with professional spotting content. Domestic Mode must never receive professional procedures; the domestic route now comes only from an approved Domestic Treatment record.",
    publiclyVisible: false,
    reviewer: "Technical reviewer A",
    reviewedAt: "2026-02-18",
  },
  {
    id: "MIG-0003",
    sourceLocation: "Legacy content — pantry-ingredient practices (lemon, vinegar, baking soda, toothpaste, salt)",
    originalContent: "Popular household practices circulated online for dye and tannin stains.",
    classification: "rejected_internet_practice",
    rejectionReason:
      "Popularity is not evidence. Acidic, alkaline and abrasive pantry materials may change dyes, damage finishes, leave residue, create rings, set proteins and interfere with later professional cleaning.",
    publiclyVisible: false,
    reviewer: "Safety reviewer B",
    reviewedAt: "2026-02-18",
  },
  {
    id: "MIG-0004",
    sourceLocation: "Legacy content — hot-water and steam suggestions for protein and tannin stains",
    originalContent: "Suggestions to use hot or boiling water and steam on stained garments.",
    classification: "unsafe",
    rejectionReason:
      "Uncontrolled heat sets protein and tannin stains and risks shrinkage and dye movement. Steam guns and boiling water are prohibited domestic practices.",
    publiclyVisible: false,
    reviewer: "Safety reviewer B",
    reviewedAt: "2026-02-18",
  },
  {
    id: "MIG-0005",
    sourceLocation: "Legacy content — bleach-based whitening suggestions",
    originalContent: "Suggestions to use chlorine bleach, sometimes combined with other cleaners.",
    classification: "chemically_incompatible",
    rejectionReason:
      "Mixing chlorine bleach with acids, ammonia, alcohol or another cleaner is prohibited. No domestic bleach method is published.",
    publiclyVisible: false,
    reviewer: "Safety reviewer B",
    reviewedAt: "2026-02-18",
  },
  {
    id: "MIG-0006",
    sourceLocation: "Legacy content — blotting first response for fresh spills",
    originalContent: "Blot fresh spills with a clean white cloth before doing anything else.",
    classification: "approved_evidence_backed",
    publiclyVisible: true,
    reviewer: "Technical reviewer A",
    reviewedAt: "2026-02-18",
  },
  {
    id: "MIG-0007",
    sourceLocation: "Legacy content — dry removal of mud before washing",
    originalContent: "Let mud dry completely, then remove the loose soil before any wet treatment.",
    classification: "candidate_for_review",
    publiclyVisible: false,
    reviewer: "Technical reviewer A",
    reviewedAt: "2026-02-18",
  },
];

/* §33 stains never initially eligible for a domestic method */
export const NEVER_INITIALLY_APPROVED = [
  "unknown_stain", "unknown_chemical", "blood", "biological_contamination", "dye_transfer",
  "hair_dye", "permanent_ink", "paint", "resin", "adhesive", "rust", "mould",
];
