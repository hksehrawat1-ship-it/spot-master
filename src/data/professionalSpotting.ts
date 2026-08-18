/**
 * LAYER 2 — Professional Spotting: interface structure and approved mappings.
 *
 * This file holds question structure, workflow labels and *approved component
 * decomposition mappings only. It contains NO chemistry values: no dilution,
 * temperature, dwell time, dosage or neutralisation data (Constitution R9, R22).
 * All chemistry-bearing instruction text comes from approved database records.
 */

import type { ComponentKey } from "@/data/taxonomy";

export const PROFESSIONAL_UI_VERSION = "professional-spotting-v1";

/* ------------------------------------------------------------------ */
/* 4. Controlled professional treatment-stage workflow                 */
/* ------------------------------------------------------------------ */

export const PRO_WORKFLOW = [
  { key: "inspect", label: "Inspect and document" },
  { key: "excess", label: "Remove excess material" },
  { key: "test", label: "Test fabric and colour" },
  { key: "component", label: "Select stain component" },
  { key: "stage", label: "Select treatment stage" },
  { key: "apply", label: "Apply verified product" },
  { key: "response", label: "Inspect response" },
  { key: "rinse", label: "Flush, rinse or neutralise as required" },
  { key: "reassess", label: "Reassess the remaining component" },
  { key: "decide", label: "Continue, change stage, stop or escalate" },
  { key: "final", label: "Complete the final cleaning process" },
  { key: "record", label: "Record the outcome" },
] as const;

export type ProWorkflowKey = (typeof PRO_WORKFLOW)[number]["key"];

/** Screens of the professional journey (the workflow above is the operator checklist). */
export const PRO_SCREENS = [
  { key: "garment", label: "Garment" },
  { key: "stain", label: "Stain" },
  { key: "history", label: "Previous chemicals" },
  { key: "plan", label: "Component plan" },
  { key: "decision", label: "Decision card" },
  { key: "outcome", label: "Outcome" },
] as const;

export type ProScreenKey = (typeof PRO_SCREENS)[number]["key"];

export const UNKNOWN_OPTION = "Unknown";

/* ------------------------------------------------------------------ */
/* 1. Garment assessment                                               */
/* ------------------------------------------------------------------ */

export const PRO_GARMENT_QUESTIONS = [
  {
    key: "fibre",
    label: "Known or suspected fibre",
    options: ["Cotton", "Linen", "Wool", "Silk", "Polyester", "Nylon", "Acrylic", "Viscose/rayon", "Acetate", "Elastane", "Leather or suede", UNKNOWN_OPTION],
  },
  { key: "blend", label: "Fibre blend", options: ["Single fibre", "Two-fibre blend", "Multi-fibre blend", UNKNOWN_OPTION] },
  { key: "construction", label: "Construction", options: ["Woven", "Knitted", "Coated", "Laminated", "Bonded", UNKNOWN_OPTION] },
  { key: "colourType", label: "Colour and print type", options: ["White", "Solid pale", "Solid dark", "Printed", "Yarn-dyed pattern", "Discharge print", UNKNOWN_OPTION] },
  { key: "trims", label: "Trims, embroidery, adhesive, embellishment", options: ["None", "Embroidery", "Adhesive or bonded trim", "Beads or sequins", "Leather or fur trim", "Metal trim", UNKNOWN_OPTION] },
  { key: "careInstruction", label: "Care-label instruction", options: ["Dry clean", "Dry clean — solvent restricted", "Wet clean", "Machine wash", "Hand wash", "Do not clean", "No label", UNKNOWN_OPTION] },
  { key: "colourfastness", label: "Colourfastness-test result", options: ["Passed", "Marginal", "Failed", "Not tested"] },
  { key: "existingDamage", label: "Existing damage", options: ["None", "Abrasion or thinning", "Colour loss", "Coating damage", "Hole or tear", "Suspected chemical damage", UNKNOWN_OPTION] },
  { key: "previousProcess", label: "Previous cleaning process", options: ["None known", "Dry cleaning", "Wet cleaning", "Laundry", "Hand cleaning", UNKNOWN_OPTION] },
  { key: "plannedProcess", label: "Planned final cleaning process", options: ["Dry cleaning", "Wet cleaning", "Laundry", "Hand cleaning", UNKNOWN_OPTION] },
] as const;

export type ProGarmentKey = (typeof PRO_GARMENT_QUESTIONS)[number]["key"];

/* ------------------------------------------------------------------ */
/* 1b. Stain assessment                                                */
/* ------------------------------------------------------------------ */

export const PRO_STAIN_QUESTIONS = [
  { key: "source", label: "Likely stain source", options: ["Food or drink", "Body", "Cosmetic", "Industrial or workshop", "Environmental", "Household chemical", "Ink or writing", "Paint or coating", UNKNOWN_OPTION] },
  { key: "condition", label: "Condition", options: ["Fresh", "Aged", "Oxidised", "Heat-set", UNKNOWN_OPTION] },
  { key: "penetration", label: "Penetration", options: ["Surface stain", "Penetrated stain", UNKNOWN_OPTION] },
  { key: "character", label: "Characteristics", options: ["Water-soluble", "Oily", "Protein", "Tannin", "Pigment", "Mixed", UNKNOWN_OPTION] },
  { key: "confidence", label: "Operator confidence in identification", options: ["High", "Moderate", "Low", UNKNOWN_OPTION] },
] as const;

export type ProStainKey = (typeof PRO_STAIN_QUESTIONS)[number]["key"];

/* ------------------------------------------------------------------ */
/* 5. Approved multi-component decomposition mappings                  */
/* ------------------------------------------------------------------ */

export type ComponentPlanEntry = {
  order: number;
  component: ComponentKey;
  role: "excess" | "oil" | "colour" | "protein" | "residue";
  /** Stage number from the universal treatment-stage system (Step 8). */
  stageNumber: number;
  stageLabel: string;
};

export type ApprovedDecomposition = {
  key: string;
  /** Matching terms, lower-case. */
  match: string[];
  label: string;
  components: ComponentPlanEntry[];
  finalStage: string;
  approvalStatus: "approved";
  source: string;
  version: string;
};

const step = (
  order: number,
  component: ComponentKey,
  role: ComponentPlanEntry["role"],
  stageNumber: number,
  stageLabel: string,
): ComponentPlanEntry => ({ order, component, role, stageNumber, stageLabel });

/**
 * Approved sequences only. Anything not listed here produces
 * "no approved sequence" rather than a generic fixed rule.
 */
export const APPROVED_DECOMPOSITIONS: ApprovedDecomposition[] = [
  {
    key: "lipstick",
    match: ["lipstick", "lip colour", "lip gloss"],
    label: "Lipstick",
    components: [
      step(1, "particulate", "excess", 2, "Remove excess material"),
      step(2, "wax", "oil", 6, "Oil and wax component"),
      step(3, "pigment", "colour", 9, "Pigment and dye component"),
    ],
    finalStage: "Rinse or flush as verified, then the planned cleaning process",
    approvalStatus: "approved",
    source: "Approved internal component mapping",
    version: "v1",
  },
  {
    key: "curry",
    match: ["curry", "turmeric", "masala"],
    label: "Curry",
    components: [
      step(1, "particulate", "excess", 2, "Remove excess material"),
      step(2, "oil", "oil", 6, "Oil component"),
      step(3, "natural_dye", "colour", 9, "Natural colouring component"),
    ],
    finalStage: "Rinse or flush as verified, then the planned cleaning process",
    approvalStatus: "approved",
    source: "Approved internal component mapping",
    version: "v1",
  },
  {
    key: "gravy",
    match: ["gravy", "meat juice", "stew"],
    label: "Gravy",
    components: [
      step(1, "particulate", "excess", 2, "Remove excess material"),
      step(2, "protein", "protein", 7, "Protein component"),
      step(3, "oil", "oil", 6, "Oil component"),
    ],
    finalStage: "Rinse or flush as verified, then the planned cleaning process",
    approvalStatus: "approved",
    source: "Approved internal component mapping",
    version: "v1",
  },
  {
    key: "makeup",
    match: ["makeup", "make-up", "foundation", "mascara", "concealer"],
    label: "Makeup",
    components: [
      step(1, "particulate", "excess", 2, "Remove excess material"),
      step(2, "cosmetic_base", "oil", 6, "Cosmetic base component"),
      step(3, "pigment", "colour", 9, "Pigment component"),
    ],
    finalStage: "Rinse or flush as verified, then the planned cleaning process",
    approvalStatus: "approved",
    source: "Approved internal component mapping",
    version: "v1",
  },
  {
    key: "shoe_polish",
    match: ["shoe polish", "boot polish", "polish"],
    label: "Shoe polish",
    components: [
      step(1, "particulate", "excess", 2, "Remove excess material"),
      step(2, "wax", "oil", 6, "Wax component"),
      step(3, "pigment", "colour", 9, "Pigment component"),
    ],
    finalStage: "Rinse or flush as verified, then the planned cleaning process",
    approvalStatus: "approved",
    source: "Approved internal component mapping",
    version: "v1",
  },
  {
    key: "oily_food",
    match: ["food with oil", "food", "sauce", "salad dressing"],
    label: "Food with oil and colour",
    components: [
      step(1, "particulate", "excess", 2, "Remove excess material"),
      step(2, "oil", "oil", 6, "Oil component"),
      step(3, "natural_dye", "colour", 9, "Colouring component"),
    ],
    finalStage: "Rinse or flush as verified, then the planned cleaning process",
    approvalStatus: "approved",
    source: "Approved internal component mapping",
    version: "v1",
  },
  {
    key: "milk_tea",
    match: ["milk tea", "tea", "coffee", "tea/coffee", "latte"],
    label: "Milk tea or coffee",
    components: [
      step(1, "protein", "protein", 7, "Milk protein component"),
      step(2, "tannin", "colour", 9, "Tannin component"),
      step(3, "sugar", "residue", 5, "Sugar residue"),
    ],
    finalStage: "Rinse or flush as verified, then the planned cleaning process",
    approvalStatus: "approved",
    source: "Approved internal component mapping",
    version: "v1",
  },
  {
    key: "solvent_ink",
    match: ["ink", "ballpoint", "marker"],
    label: "Ink with solvent and dye components",
    components: [
      step(1, "resin", "oil", 6, "Resin and solvent-carried component"),
      step(2, "synthetic_dye", "colour", 9, "Dye component"),
    ],
    finalStage: "Rinse or flush as verified, then the planned cleaning process",
    approvalStatus: "approved",
    source: "Approved internal component mapping",
    version: "v1",
  },
];

export const NO_APPROVED_SEQUENCE =
  "No approved component sequence exists for this stain. Treat one confirmed component at a time using approved product mappings, or escalate to Master Spotter.";

/* ------------------------------------------------------------------ */
/* 6. Unknown-fabric structured test panel                             */
/* ------------------------------------------------------------------ */

export const UNKNOWN_FABRIC_TESTS = [
  { key: "visual", label: "Visual and touch observation", options: ["Completed", "Inconclusive", "Not done"] },
  { key: "moisture", label: "Moisture response", options: ["No change", "Water mark", "Swelling or shrinkage", "Not done"] },
  { key: "colour_transfer", label: "Colour-transfer test", options: ["No transfer", "Slight transfer", "Clear transfer", "Not done"] },
  { key: "seam", label: "Seam or hidden-area test", options: ["No change", "Minor change", "Damage seen", "Not done"] },
  { key: "coating", label: "Coating and adhesive check", options: ["None found", "Coating present", "Adhesive present", "Not done"] },
  { key: "product_reaction", label: "Reaction to the selected product", options: ["No reaction", "Minor reaction", "Adverse reaction", "Not done"] },
  { key: "operator_confidence", label: "Operator confidence after testing", options: ["High", "Moderate", "Low"] },
] as const;

export const BURN_TEST_NOTE =
  "A burn test is not recommended as a default identification method in professional mode.";

export const UNKNOWN_FABRIC_OUTCOMES = [
  "Proceed within verified limits",
  "Proceed with restricted products",
  "Additional test required",
  "Master Spotter assessment required",
  "Do not spot-treat",
] as const;

export type UnknownFabricOutcome = (typeof UNKNOWN_FABRIC_OUTCOMES)[number];

/* ------------------------------------------------------------------ */
/* 7. Previous-chemical tracking                                       */
/* ------------------------------------------------------------------ */

export const PREVIOUS_CHEMICAL_QUESTIONS = [
  { key: "product", label: "Which product was already used?", options: ["None", "Known kit product", "Known basic product", "Unknown product"] },
  { key: "rinsed", label: "Was it rinsed or flushed?", options: ["Yes", "No", UNKNOWN_OPTION] },
  { key: "heat", label: "Was heat applied afterwards?", options: ["No", "Yes", UNKNOWN_OPTION] },
  { key: "stainChange", label: "Did the stain change?", options: ["Reduced", "No change", "Spread", "Darkened", UNKNOWN_OPTION] },
  { key: "colourTransfer", label: "Did colour transfer occur?", options: ["No", "Yes", UNKNOWN_OPTION] },
  { key: "textureChange", label: "Did the fabric texture change?", options: ["No", "Yes", UNKNOWN_OPTION] },
] as const;

export type PreviousChemicalKey = (typeof PREVIOUS_CHEMICAL_QUESTIONS)[number]["key"];

/* ------------------------------------------------------------------ */
/* 8. Decision-card section order                                      */
/* ------------------------------------------------------------------ */

export const DECISION_CARD_SECTIONS = [
  "Safety status",
  "Fabric-risk summary",
  "Stain-component assessment",
  "Selected kit and eligible product",
  "Source and verification status",
  "Test requirement",
  "Application instructions",
  "PPE",
  "Prohibited combinations",
  "Rinse, flush or neutralisation requirement",
  "Inspection checkpoint",
  "Next eligible action",
  "Expected outcome",
  "Escalation conditions",
] as const;

/* ------------------------------------------------------------------ */
/* 11 & 12. Boundaries and escalation                                  */
/* ------------------------------------------------------------------ */

export const MASTER_ONLY_CAPABILITIES = [
  "unrestricted_chemistry_exploration",
  "custom_chemical_formulation",
  "advanced_ph_manipulation",
  "custom_oxidising_reducing_systems",
  "experimental_product_substitution",
  "unsupported_brand_equivalence",
  "override_non_overridable_safety_block",
  "create_or_approve_product_mappings",
  "advanced_failure_investigation",
  "unpublished_chemistry_access",
] as const;

export type MasterOnlyCapability = (typeof MASTER_ONLY_CAPABILITIES)[number];

export const MASTER_ONLY_MESSAGE =
  "This control is reserved for Master Spotter. Professional mode works only within verified, approved limits.";

export const ESCALATION_TRIGGERS = [
  { key: "fabric_unidentified", label: "Fabric cannot be reasonably identified" },
  { key: "colourfastness_failed", label: "Colourfastness repeatedly fails" },
  { key: "active_bleeding", label: "Active colour bleeding" },
  { key: "multiple_unknown_chemicals", label: "Several unknown chemicals previously applied" },
  { key: "suspected_damage", label: "Chemical or heat damage suspected" },
  { key: "high_value_garment", label: "High-value or heritage garment" },
  { key: "stain_remains", label: "Stain remains after the approved sequence" },
  { key: "unverified_transition", label: "Required product transition is unverified" },
  { key: "sensitive_construction", label: "Sensitive coating, adhesive or mixed construction" },
  { key: "operator_uncertain", label: "Operator is uncertain" },
] as const;

export type EscalationTriggerKey = (typeof ESCALATION_TRIGGERS)[number]["key"];

export const BASIC_ALTERNATIVE_LABEL =
  "Basic alternative—not equivalent to the selected professional product";

export const NO_BRAND_EQUIVALENCE_NOTE =
  "Similarly named products from different companies are not treated as equivalent. Use only the products verified for the selected kit.";

/* ------------------------------------------------------------------ */
/* 9. Professional tools                                               */
/* ------------------------------------------------------------------ */

export const PRO_TOOLS = [
  { key: "cases", label: "Saved garment cases" },
  { key: "history", label: "Treatment history" },
  { key: "product_use", label: "Product-use history" },
  { key: "photos", label: "Before/after photographs" },
  { key: "outcome", label: "Outcome recording" },
  { key: "rework", label: "Rework tracking" },
  { key: "adverse", label: "Adverse-event reporting" },
  { key: "inventory", label: "Product inventory" },
  { key: "favourite", label: "Favourite kit setting" },
  { key: "jobcard", label: "Printable job card" },
  { key: "supervisor", label: "Supervisor notes" },
  { key: "library", label: "Verified product library" },
  { key: "sources", label: "Source documents and revisions" },
  { key: "offline", label: "Offline safety summary" },
] as const;

export const OFFLINE_SAFETY_SUMMARY = {
  version: "safety-summary-v1",
  reviewDate: "2026-01-15",
  points: [
    "Stop immediately if colour transfers, the texture changes or the coating lifts.",
    "Never mix products. Rinse, flush or neutralise between different products as verified.",
    "Existing damage, active bleeding and unknown previous chemicals are non-overridable stops.",
    "Where an approved instruction is missing, follow the current product label or technical data sheet.",
    "Escalate to Master Spotter rather than improvising chemistry.",
  ],
} as const;
