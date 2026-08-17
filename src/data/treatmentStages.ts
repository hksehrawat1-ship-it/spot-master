/**
 * STEP 8 — Universal treatment stages and pathways.
 *
 * Permanent principle:
 *   Products belong to verified treatment stages. They do not define the stain
 *   science or the universal workflow.
 *
 * Nothing in this file may name a company, brand, product, chemistry family,
 * dilution, quantity, contact time, temperature or attempt limit.
 */

import type { PrimaryCategoryKey, ComponentKey } from "@/data/taxonomy";
import type { UserRoleKey } from "@/lib/fabricSafety";
import type { PpeKey, ProcessKey, TrainingKey } from "@/data/professionalProducts";

export const STAGE_SYSTEM_VERSION = "step8-stages-v1";

export type StageStatus = "draft" | "approved" | "published" | "needs_review" | "archived";

export type StageEvidenceRequirement =
  | "no_chemistry_required"
  | "approved_method_required"
  | "verified_product_document_required"
  | "verified_product_document_and_authorization_required";

export type TreatmentStage = {
  stageId: string;              // SM-STG-0000
  stageNumber: number;
  key: string;
  name: string;
  plainName: string;
  technicalDescription: string;
  purpose: string;
  applicableCategories: PrimaryCategoryKey[] | "all";
  applicableComponents: ComponentKey[] | "all";
  requiredInputs: string[];
  requiredPreconditions: string[];
  prohibitedConditions: string[];
  requiredRoles: UserRoleKey[];
  requiredTraining: TrainingKey[];
  requiredEquipment: string[];
  requiredPpe: PpeKey[];
  requiredInspection: boolean;
  exitConditions: string[];
  stopConditions: string[];
  nextAllowedStages: number[];
  evidenceRequirement: StageEvidenceRequirement;
  /** Actionable = a product may be considered at this stage. */
  actionable: boolean;
  status: StageStatus;
  version: string;
};

const stageId = (n: number) => `SM-STG-${String(n).padStart(4, "0")}`;

const PRO_ROLES: UserRoleKey[] = ["dry_cleaner", "professional_spotter", "trainer"];
const ALL_ROLES: UserRoleKey[] = [
  "domestic_user", "laundry_employee", "dry_cleaner", "professional_spotter", "trainer", "learner",
];

const COMMON_STOPS = [
  "Colour loss begins",
  "Dye bleeding begins",
  "Fibre weakening begins",
  "Distortion begins",
  "Texture changes",
  "Coating lifts or softens",
  "Lamination separates",
  "Adhesive fails",
  "Decoration is affected",
  "Unexpected heat or reaction occurs",
  "Strong unexpected odour or vapour occurs",
  "Product behaviour conflicts with documentation",
  "The operator cannot complete the required rinse or neutralization",
];

function chemicalStage(
  n: number,
  key: string,
  name: string,
  plainName: string,
  technicalDescription: string,
  categories: PrimaryCategoryKey[],
  components: ComponentKey[],
  extra: Partial<TreatmentStage> = {},
): TreatmentStage {
  return {
    stageId: stageId(n),
    stageNumber: n,
    key,
    name,
    plainName,
    technicalDescription,
    purpose:
      "Assess whether a verified product may be considered for this component under the current garment, colour, process and safety conditions.",
    applicableCategories: categories,
    applicableComponents: components,
    requiredInputs: [
      "Confirmed stain classification or component",
      "Fabric and construction assessment",
      "Colour condition",
      "Available cleaning process",
      "Previous treatment history",
    ],
    requiredPreconditions: [
      "Stage 1 inspection completed",
      "Stage 3 compatibility testing completed or formally not required by an approved method",
      "No active Stage 0 safety hold",
    ],
    prohibitedConditions: [
      "Unknown previous chemical where compatibility cannot be established",
      "Active dye bleeding",
      "Existing fibre, coating or finish damage in the treatment area",
      "Required PPE, ventilation or equipment unavailable",
    ],
    requiredRoles: PRO_ROLES,
    requiredTraining: ["trained_spotter_required"],
    requiredEquipment: ["As specified by the current product document"],
    requiredPpe: ["protective_gloves", "eye_protection"],
    requiredInspection: true,
    exitConditions: [
      "Stage 15 rinsing, flushing or neutralization completed as documented",
      "Stage 16 inspection completed with no stop condition",
    ],
    stopConditions: COMMON_STOPS,
    nextAllowedStages: [15, 16, 17],
    evidenceRequirement: "verified_product_document_required",
    actionable: true,
    status: "published",
    version: STAGE_SYSTEM_VERSION,
    ...extra,
  };
}

export const TREATMENT_STAGES: TreatmentStage[] = [
  {
    stageId: stageId(0),
    stageNumber: 0,
    key: "safety_hold",
    name: "Safety Hold",
    plainName: "Stop and check before anything is done",
    technicalDescription:
      "Blocking stage entered when identification, material, contamination, documentation or safety conditions are incomplete. No actionable treatment may be produced while this stage is active.",
    purpose: "Prevent actionable guidance where the case cannot be treated safely.",
    applicableCategories: "all",
    applicableComponents: "all",
    requiredInputs: ["Case record", "Reason for the hold"],
    requiredPreconditions: [],
    prohibitedConditions: ["Any chemical application"],
    requiredRoles: ALL_ROLES,
    requiredTraining: [],
    requiredEquipment: [],
    requiredPpe: [],
    requiredInspection: false,
    exitConditions: [
      "Stain and material sufficiently identified",
      "Unknown chemical contamination excluded or a documented compatible route established",
      "Active dye bleeding resolved or case escalated",
      "Existing damage documented and accepted by a reviewer",
      "Required PPE and ventilation available",
      "Product documentation complete",
    ],
    stopConditions: ["Hold remains until every exit condition is satisfied"],
    nextAllowedStages: [1],
    evidenceRequirement: "no_chemistry_required",
    actionable: false,
    status: "published",
    version: STAGE_SYSTEM_VERSION,
  },
  {
    stageId: stageId(1),
    stageNumber: 1,
    key: "inspect_document",
    name: "Inspect and Document",
    plainName: "Look, record and photograph",
    technicalDescription:
      "Baseline recording stage. Garment information, stain information, care restrictions, previous treatment and affected components are recorded. No chemical treatment occurs.",
    purpose: "Establish a defensible baseline before any decision is made.",
    applicableCategories: "all",
    applicableComponents: "all",
    requiredInputs: [
      "Garment information",
      "Stain information",
      "Photographs",
      "Care restrictions",
      "Previous treatment history",
      "Affected components",
    ],
    requiredPreconditions: [],
    prohibitedConditions: ["Any chemical application"],
    requiredRoles: ALL_ROLES,
    requiredTraining: [],
    requiredEquipment: ["Good lighting", "Camera"],
    requiredPpe: [],
    requiredInspection: true,
    exitConditions: ["Baseline condition recorded", "Affected components identified"],
    stopConditions: ["Existing damage found that changes the case route"],
    nextAllowedStages: [0, 2, 3, 17],
    evidenceRequirement: "no_chemistry_required",
    actionable: false,
    status: "published",
    version: STAGE_SYSTEM_VERSION,
  },
  {
    stageId: stageId(2),
    stageNumber: 2,
    key: "excess_removal",
    name: "Controlled Removal of Excess Material",
    plainName: "Remove what can be lifted away safely",
    technicalDescription:
      "Removal of loose particles, thick deposits, dried surface residue, excess oil or liquid, and wax-like or polymer deposits only where a verified method exists for the material and fabric. Scraping, heating and solvent use are never prescribed universally.",
    purpose: "Reduce the amount of material before any chemistry is considered.",
    applicableCategories: "all",
    applicableComponents: "all",
    requiredInputs: ["Baseline record", "Material description", "Fabric assessment"],
    requiredPreconditions: ["Stage 1 completed", "A verified removal method exists for this material and fabric"],
    prohibitedConditions: [
      "No verified removal method for the material or fabric",
      "Delicate surface, coating, lamination or decoration in the treatment area without an approved method",
    ],
    requiredRoles: ALL_ROLES,
    requiredTraining: [],
    requiredEquipment: ["As specified by the approved method"],
    requiredPpe: [],
    requiredInspection: true,
    exitConditions: ["Excess material removed without surface change"],
    stopConditions: COMMON_STOPS,
    nextAllowedStages: [3, 16, 17, 0],
    evidenceRequirement: "approved_method_required",
    actionable: false,
    status: "published",
    version: STAGE_SYSTEM_VERSION,
  },
  {
    stageId: stageId(3),
    stageNumber: 3,
    key: "compatibility_testing",
    name: "Compatibility Testing",
    plainName: "Test a hidden area first",
    technicalDescription:
      "Hidden-area testing, colour-transfer testing, water-sensitivity testing, product compatibility testing and surface or finish inspection. The exact test must come from an approved method or a manufacturer document.",
    purpose: "Establish whether the garment can tolerate the intended process or product.",
    applicableCategories: "all",
    applicableComponents: "all",
    requiredInputs: ["Fabric assessment", "Colour condition", "Intended process", "Intended product version, when applicable"],
    requiredPreconditions: ["Stage 1 completed", "An approved test method is available"],
    prohibitedConditions: ["No approved test method available", "No hidden area available and no approved alternative"],
    requiredRoles: ["laundry_employee", ...PRO_ROLES],
    requiredTraining: ["general_professional_use"],
    requiredEquipment: ["As specified by the approved test method"],
    requiredPpe: ["protective_gloves"],
    requiredInspection: true,
    exitConditions: ["Test completed and result recorded"],
    stopConditions: ["Colour transfer observed", "Surface or finish change observed", ...COMMON_STOPS],
    nextAllowedStages: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 0],
    evidenceRequirement: "approved_method_required",
    actionable: false,
    status: "published",
    version: STAGE_SYSTEM_VERSION,
  },

  chemicalStage(4, "oil_solvent_side", "Oil and Solvent-Side Assessment", "Oily and greasy material",
    "Assessment stage for oils, grease, waxes, tar-like material, solvent-soluble binders and some cosmetics, inks and adhesives. This stage does not authorize solvent use on every fabric.",
    ["oil_grease", "combination_unknown", "paint_polymer"],
    ["oil", "grease", "wax", "cosmetic_base", "resin", "adhesive", "polymer"],
    { prohibitedConditions: [
      "Solvent-sensitive fabric, coating, lamination, decoration or trim without a verified product restriction check",
      "Unknown previous chemical where compatibility cannot be established",
      "Ventilation unavailable where the product document requires it",
    ] }),

  chemicalStage(5, "wet_side", "Water-Soluble and General Wet-Side Assessment", "Water-based material",
    "Assessment stage for water-soluble residues, sugars, salts, some food residues and selected wet-bound soil. This stage does not assume water is safe for every garment.",
    ["water_soluble", "combination_unknown"],
    ["water_soluble", "sugar", "salt", "starch", "surfactant_residue"],
    { prohibitedConditions: [
      "Water-sensitive material or finish",
      "Active dye bleeding",
      "Unknown previous chemical where compatibility cannot be established",
    ] }),

  chemicalStage(6, "protein", "Protein Assessment", "Blood, egg, milk and similar",
    "Assessment stage for blood, egg, milk, albuminous material, meat or fish residue and selected bodily fluids. Uncontrolled heat may fix or denature protein stains.",
    ["protein", "biological", "combination_unknown"],
    ["protein", "biological_material"],
    { stopConditions: ["Uncontrolled heat has been applied or is proposed", ...COMMON_STOPS] }),

  chemicalStage(7, "tannin", "Tannin and Plant-Colour Assessment", "Tea, coffee, wine and plant colour",
    "Assessment stage for tea, coffee, wine, fruit, juice, grass, tobacco and selected plant-derived colour.",
    ["tannin_plant", "combination_unknown"],
    ["tannin", "natural_dye"]),

  chemicalStage(8, "pigment_particulate", "Pigment and Particulate Assessment", "Mud, soot and dust",
    "Assessment stage for mud, clay, soot, dust, dry pigment and residual particulate material.",
    ["pigment_particulate", "combination_unknown"],
    ["pigment", "particulate", "mineral"]),

  chemicalStage(9, "dye_ink", "Dye and Ink Assessment", "Ink, marker and colour transfer",
    "Assessment stage for ink, marker, hair dye, food dye, textile dye transfer and fugitive colour. High colourfastness warning: the garment's own dye is at risk during any dye-side work.",
    ["dye_ink", "combination_unknown"],
    ["ink", "synthetic_dye", "natural_dye"],
    { requiredPreconditions: [
      "Stage 1 inspection completed",
      "Stage 3 colourfastness testing completed with an acceptable result",
      "No active Stage 0 safety hold",
    ] }),

  chemicalStage(10, "paint_resin_adhesive", "Paint, Resin, Adhesive and Polymer Assessment", "Paint, glue and nail polish",
    "Assessment stage for paint, lacquer, varnish, adhesive, nail polish, gum, resin and cured polymer. Treatment depends strongly on product type, curing state, fabric and finish.",
    ["paint_polymer", "combination_unknown"],
    ["paint_binder", "resin", "adhesive", "polymer"]),

  chemicalStage(11, "metal_rust_mineral", "Metal, Rust and Mineral Assessment", "Rust and mineral marks",
    "Assessment stage for iron rust, verdigris, metal abrasion, mineral deposits and scale. Strict material and trim checks are required.",
    ["metal_rust", "combination_unknown"],
    ["metallic_oxide", "mineral"],
    { prohibitedConditions: [
      "Metallic thread, metal trim, buttons, zips or decoration in or near the treatment area without a verified restriction check",
      "Unknown previous chemical where compatibility cannot be established",
    ] }),

  chemicalStage(12, "biological", "Biological Contamination Assessment", "Mould, mildew and contamination",
    "Assessment stage for mould, mildew, sewage, microbial contamination and biologically hazardous residues. Hygiene and exposure requirements are considered separately from visual stain removal.",
    ["biological", "combination_unknown"],
    ["biological_material"],
    { requiredPpe: ["protective_gloves", "eye_protection", "respiratory_protection"],
      requiredTraining: ["trained_spotter_required", "hazard_communication_required"] }),

  chemicalStage(13, "controlled_oxidation", "Controlled Oxidation Assessment", "Controlled colour-removal chemistry",
    "Assessment stage for approved residual stains where verified oxidation may be appropriate. This is never equivalent to generic bleach use.",
    ["oxidizable", "tannin_plant", "dye_ink", "combination_unknown"],
    ["tannin", "natural_dye", "synthetic_dye", "pigment"],
    {
      requiredPreconditions: [
        "Fabric verified",
        "Dye verified",
        "Finish verified",
        "Product verified for this use and version",
        "Incompatibility check completed",
        "Professional authorization recorded where required",
      ],
      requiredTraining: ["trained_spotter_required", "supervisor_approval_required"],
      evidenceRequirement: "verified_product_document_and_authorization_required",
    }),

  chemicalStage(14, "controlled_reduction", "Controlled Reduction Assessment", "Controlled dye-side chemistry",
    "Assessment stage for approved residual colours or dyes where verified reducing chemistry may be appropriate. Professional-only unless a separately approved domestic product and method exists.",
    ["reducible", "dye_ink", "combination_unknown"],
    ["synthetic_dye", "natural_dye", "metallic_oxide"],
    {
      requiredRoles: ["professional_spotter", "trainer"],
      requiredTraining: ["trained_spotter_required", "supervisor_approval_required"],
      evidenceRequirement: "verified_product_document_and_authorization_required",
    }),

  {
    stageId: stageId(15),
    stageNumber: 15,
    key: "rinse_neutralize",
    name: "Verified Rinsing, Flushing or Neutralization",
    plainName: "Remove or deactivate the product as documented",
    technicalDescription:
      "Stores the required removal or deactivation process after each product. A generic rule must never be used where the manufacturer specifies a particular process.",
    purpose: "Ensure applied chemistry is removed or deactivated by a documented method.",
    applicableCategories: "all",
    applicableComponents: "all",
    requiredInputs: ["Applied product version", "Documented rinsing, flushing or neutralization requirement"],
    requiredPreconditions: ["An actionable stage has been completed"],
    prohibitedConditions: [
      "The documented removal process cannot be performed",
      "No documented process exists and no approved method covers the case",
    ],
    requiredRoles: PRO_ROLES,
    requiredTraining: ["general_professional_use"],
    requiredEquipment: ["As specified by the current product document"],
    requiredPpe: ["protective_gloves"],
    requiredInspection: true,
    exitConditions: ["Documented removal or deactivation completed and recorded"],
    stopConditions: ["The required rinse or neutralization cannot be completed", ...COMMON_STOPS],
    nextAllowedStages: [16],
    evidenceRequirement: "verified_product_document_required",
    actionable: false,
    status: "published",
    version: STAGE_SYSTEM_VERSION,
  },
  {
    stageId: stageId(16),
    stageNumber: 16,
    key: "inspection_gate",
    name: "Inspection Before Repetition or Heat",
    plainName: "Check the result before doing anything else",
    technicalDescription:
      "Mandatory inspection gate. No heat and no repetition may be authorized until this inspection is completed and recorded.",
    purpose: "Detect damage or change before further chemistry, repetition or heat.",
    applicableCategories: "all",
    applicableComponents: "all",
    requiredInputs: ["Inspection record", "Operator", "Date"],
    requiredPreconditions: ["Stage 15 completed where a product was applied"],
    prohibitedConditions: ["Applying heat before the inspection is recorded", "Repeating a product before the inspection is recorded"],
    requiredRoles: ALL_ROLES,
    requiredTraining: [],
    requiredEquipment: ["Good lighting", "Camera"],
    requiredPpe: [],
    requiredInspection: true,
    exitConditions: ["Inspection recorded with no stop condition present"],
    stopConditions: COMMON_STOPS,
    nextAllowedStages: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 17, 0],
    evidenceRequirement: "no_chemistry_required",
    actionable: false,
    status: "published",
    version: STAGE_SYSTEM_VERSION,
  },
  {
    stageId: stageId(17),
    stageNumber: 17,
    key: "outcome_escalation",
    name: "Final Outcome and Escalation",
    plainName: "Record the result and decide what happens next",
    technicalDescription:
      "Records the final outcome of the case and any escalation route. Closing stage of every pathway.",
    purpose: "Close the case with a recorded outcome and an explicit next action.",
    applicableCategories: "all",
    applicableComponents: "all",
    requiredInputs: ["Outcome selection", "Operator", "Date"],
    requiredPreconditions: ["Stage 16 completed where a product was applied"],
    prohibitedConditions: [],
    requiredRoles: ALL_ROLES,
    requiredTraining: [],
    requiredEquipment: [],
    requiredPpe: [],
    requiredInspection: false,
    exitConditions: ["Outcome recorded"],
    stopConditions: [],
    nextAllowedStages: [],
    evidenceRequirement: "no_chemistry_required",
    actionable: false,
    status: "published",
    version: STAGE_SYSTEM_VERSION,
  },
];

export const STAGE_BY_NUMBER: Record<number, TreatmentStage> = Object.fromEntries(
  TREATMENT_STAGES.map((s) => [s.stageNumber, s]),
);
export const STAGE_BY_KEY: Record<string, TreatmentStage> = Object.fromEntries(
  TREATMENT_STAGES.map((s) => [s.key, s]),
);
export const STAGE_BY_ID: Record<string, TreatmentStage> = Object.fromEntries(
  TREATMENT_STAGES.map((s) => [s.stageId, s]),
);

export const ACTIONABLE_STAGES = TREATMENT_STAGES.filter((s) => s.actionable);

/* ------------------------------------------------------------------ */
/* Stage 17 outcomes                                                    */
/* ------------------------------------------------------------------ */

export const FINAL_OUTCOMES = [
  "removed", "reduced", "no_change", "pigment_remains", "possible_dye_loss",
  "possible_fibre_damage", "possible_finish_damage", "further_attempt_permitted",
  "stop_treatment", "professional_escalation", "specialist_assessment_required",
] as const;
export type FinalOutcome = (typeof FINAL_OUTCOMES)[number];

export const FINAL_OUTCOME_LABEL: Record<FinalOutcome, string> = {
  removed: "Removed",
  reduced: "Reduced",
  no_change: "No change",
  pigment_remains: "Pigment remains",
  possible_dye_loss: "Possible dye loss",
  possible_fibre_damage: "Possible fibre damage",
  possible_finish_damage: "Possible finish damage",
  further_attempt_permitted: "Further attempt permitted",
  stop_treatment: "Stop treatment",
  professional_escalation: "Professional escalation",
  specialist_assessment_required: "Specialist assessment required",
};

/* ------------------------------------------------------------------ */
/* Inspection gate fields (Stage 16)                                    */
/* ------------------------------------------------------------------ */

export const INSPECTION_FIELDS = [
  "stain_reduced", "stain_unchanged", "stain_spread", "ring_appeared", "dye_transferred",
  "colour_lightened", "colour_darkened", "fibre_weakened", "texture_changed",
  "coating_changed", "adhesive_loosened", "decoration_affected", "odour_remains",
  "residue_remains",
] as const;
export type InspectionField = (typeof INSPECTION_FIELDS)[number];

export const INSPECTION_LABEL: Record<InspectionField, string> = {
  stain_reduced: "Stain reduced",
  stain_unchanged: "Stain unchanged",
  stain_spread: "Stain spread",
  ring_appeared: "Ring appeared",
  dye_transferred: "Dye transferred",
  colour_lightened: "Colour lightened",
  colour_darkened: "Colour darkened",
  fibre_weakened: "Fibre weakened",
  texture_changed: "Texture changed",
  coating_changed: "Coating changed",
  adhesive_loosened: "Adhesive loosened",
  decoration_affected: "Decoration affected",
  odour_remains: "Odour remains",
  residue_remains: "Residue remains",
};

/** Inspection findings that force treatment to stop. */
export const STOPPING_INSPECTION_FIELDS: InspectionField[] = [
  "stain_spread", "ring_appeared", "dye_transferred", "colour_lightened", "colour_darkened",
  "fibre_weakened", "texture_changed", "coating_changed", "adhesive_loosened", "decoration_affected",
];

export const MANDATORY_STOP_CONDITIONS = COMMON_STOPS;

/* ------------------------------------------------------------------ */
/* Treatment pathways                                                   */
/* ------------------------------------------------------------------ */

export type PathwayKey =
  | "water_soluble_assessment" | "oil_grease_assessment" | "protein_assessment"
  | "tannin_assessment" | "pigment_particulate_assessment" | "dye_ink_assessment"
  | "paint_resin_adhesive_assessment" | "metal_rust_mineral_assessment"
  | "biological_assessment" | "controlled_oxidation_assessment"
  | "controlled_reduction_assessment" | "combination_assessment"
  | "unknown_stain_assessment" | "damage_diagnosis_route" | "specialist_material_route";

export type PathwayStage = {
  stageNumber: number;
  position: number;
  optional: boolean;
  condition?: string;
};

export type TreatmentPathway = {
  pathwayId: string;            // SM-PTH-0000
  key: PathwayKey;
  name: string;
  plainName: string;
  description: string;
  categories: PrimaryCategoryKey[];
  stages: PathwayStage[];
  completionRequirements: string[];
  professionalOnly: boolean;
  status: StageStatus;
  version: string;
};

const COMPLETION = [
  "Fabric conditions are known",
  "Applicable products are verified",
  "Product-specific requirements are attached",
  "User role is authorized",
  "Required tests are passed",
];

const pathwayId = (n: number) => `SM-PTH-${String(n).padStart(4, "0")}`;

function pathway(
  n: number,
  key: PathwayKey,
  name: string,
  plainName: string,
  description: string,
  categories: PrimaryCategoryKey[],
  core: number[],
  opts: Partial<TreatmentPathway> = {},
): TreatmentPathway {
  const sequence = [1, 2, 3, ...core, 15, 16, 17];
  return {
    pathwayId: pathwayId(n),
    key,
    name,
    plainName,
    description,
    categories,
    stages: sequence.map((stageNumber, i) => ({
      stageNumber,
      position: i + 1,
      optional: stageNumber === 2,
      condition: stageNumber === 2 ? "Only where removable excess material is present and a verified method exists" : undefined,
    })),
    completionRequirements: COMPLETION,
    professionalOnly: true,
    status: "published",
    version: STAGE_SYSTEM_VERSION,
    ...opts,
  };
}

export const TREATMENT_PATHWAYS: TreatmentPathway[] = [
  pathway(1, "water_soluble_assessment", "Simple Water-Soluble Assessment", "Water-based material route",
    "Wet-side route for water-soluble residues where the garment tolerates moisture.", ["water_soluble"], [5]),
  pathway(2, "oil_grease_assessment", "Oil / Grease Assessment", "Oily material route",
    "Solvent-side route for oils, grease and waxes, subject to fabric and finish restrictions.", ["oil_grease"], [4]),
  pathway(3, "protein_assessment", "Protein Assessment", "Blood, egg and milk route",
    "Protein route with an explicit heat warning: uncontrolled heat may fix protein stains.", ["protein"], [6]),
  pathway(4, "tannin_assessment", "Tannin Assessment", "Tea, coffee and wine route",
    "Tannin and plant-colour route with optional controlled oxidation only after verification.", ["tannin_plant"], [7]),
  pathway(5, "pigment_particulate_assessment", "Pigment / Particulate Assessment", "Mud and soot route",
    "Particulate route beginning with controlled removal of dry material.", ["pigment_particulate"], [8]),
  pathway(6, "dye_ink_assessment", "Dye / Ink Assessment", "Ink and colour transfer route",
    "Dye-side route carrying a high colourfastness warning throughout.", ["dye_ink"], [9]),
  pathway(7, "paint_resin_adhesive_assessment", "Paint / Resin / Adhesive Assessment", "Paint and glue route",
    "Route for paints, resins, adhesives and cured polymers; strongly dependent on curing state and finish.", ["paint_polymer"], [10]),
  pathway(8, "metal_rust_mineral_assessment", "Metal / Rust / Mineral Assessment", "Rust and mineral route",
    "Route requiring strict material and trim checks before any chemistry.", ["metal_rust"], [11]),
  pathway(9, "biological_assessment", "Biological Assessment", "Mould and contamination route",
    "Route where hygiene and exposure control are assessed separately from visual stain removal.", ["biological"], [12]),
  pathway(10, "controlled_oxidation_assessment", "Controlled Oxidation Assessment", "Controlled colour-removal route",
    "Residual-colour route requiring fabric, dye, finish and product verification plus authorization.", ["oxidizable"], [13]),
  pathway(11, "controlled_reduction_assessment", "Controlled Reduction Assessment", "Controlled dye-side route",
    "Professional-only reducing route for approved residual colours or dyes.", ["reducible"], [14]),
  pathway(12, "combination_assessment", "Combination-Stain Assessment", "Mixed stain route",
    "Ordered multi-stage route. The sequence is resolved per case from the dominant component, fabric, colour, finish, age, previous treatment, product compatibility, manufacturer instructions and inspection results. No fixed sequence is hard-coded.",
    ["combination_unknown"], [4, 5, 6, 7, 8, 9]),
  pathway(13, "unknown_stain_assessment", "Unknown-Stain Assessment", "Unidentified stain route",
    "Route for unidentified material. Remains at Safety Hold until identification improves.", ["combination_unknown"], [], {
      stages: [
        { stageNumber: 0, position: 1, optional: false },
        { stageNumber: 1, position: 2, optional: false },
        { stageNumber: 3, position: 3, optional: false },
        { stageNumber: 17, position: 4, optional: false },
      ],
    }),
  pathway(14, "damage_diagnosis_route", "Damage-Diagnosis Route", "Damage, not a stain",
    "Route used when the mark is fibre, dye or finish damage rather than a stain. No stain chemistry applies.", [], [], {
      stages: [
        { stageNumber: 1, position: 1, optional: false },
        { stageNumber: 16, position: 2, optional: false },
        { stageNumber: 17, position: 3, optional: false },
      ],
    }),
  pathway(15, "specialist_material_route", "Specialist-Material Route", "Specialist referral",
    "Route for leather, suede, fur, coated, laminated and heavily embellished items requiring specialist assessment.", [], [], {
      stages: [
        { stageNumber: 0, position: 1, optional: false },
        { stageNumber: 1, position: 2, optional: false },
        { stageNumber: 17, position: 3, optional: false },
      ],
    }),
];

export const PATHWAY_BY_KEY: Record<string, TreatmentPathway> = Object.fromEntries(
  TREATMENT_PATHWAYS.map((p) => [p.key, p]),
);

/** Default pathway for a primary category. Combination and unknown are resolved per case. */
export function pathwayForCategory(category: PrimaryCategoryKey): TreatmentPathway {
  const found = TREATMENT_PATHWAYS.find((p) => p.categories.includes(category));
  return found ?? PATHWAY_BY_KEY.unknown_stain_assessment;
}

/**
 * Resolve a combination-stain sequence from the case. The ordering is derived,
 * never hard-coded: the dominant component leads, remaining components follow in
 * documented-risk order, and dye-side work is always last before rinsing.
 */
export function combinationSequence(input: {
  dominantComponent?: ComponentKey;
  components: ComponentKey[];
  heatExposed?: boolean;
  activeDyeBleeding?: boolean;
}): { stages: number[]; reasons: string[] } {
  const reasons: string[] = [];
  const stageFor: Partial<Record<ComponentKey, number>> = {
    oil: 4, grease: 4, wax: 4, cosmetic_base: 4,
    water_soluble: 5, sugar: 5, salt: 5, starch: 5, surfactant_residue: 5,
    protein: 6, biological_material: 12,
    tannin: 7, natural_dye: 7,
    pigment: 8, particulate: 8, mineral: 8,
    ink: 9, synthetic_dye: 9,
    resin: 10, adhesive: 10, polymer: 10, paint_binder: 10,
    metallic_oxide: 11,
  };
  const ordered: number[] = [];
  const push = (n?: number) => { if (n && !ordered.includes(n)) ordered.push(n); };

  if (input.activeDyeBleeding) {
    reasons.push("Active dye bleeding holds the case at Stage 0 until it is resolved.");
    return { stages: [0, 1], reasons };
  }
  if (input.dominantComponent) {
    push(stageFor[input.dominantComponent]);
    reasons.push(`Dominant component "${input.dominantComponent}" leads the sequence.`);
  }
  const rest = input.components.filter((c) => c !== input.dominantComponent);
  // Protein before any heat-related work; dye-side last.
  rest.filter((c) => c === "protein").forEach((c) => push(stageFor[c]));
  rest.filter((c) => !["protein", "ink", "synthetic_dye", "natural_dye"].includes(c)).forEach((c) => push(stageFor[c]));
  rest.filter((c) => ["ink", "synthetic_dye", "natural_dye"].includes(c)).forEach((c) => push(stageFor[c]));

  if (input.components.includes("protein") && input.heatExposed) {
    reasons.push("Heat exposure with a protein component: heat-set risk is recorded and repetition needs inspection first.");
  }
  if (ordered.some((n) => n === 9)) {
    reasons.push("Dye-side assessment is placed last because it carries the highest colourfastness risk.");
  }
  const stages = [1, 3, ...ordered, 15, 16, 17];
  reasons.push("Rinsing or neutralization and inspection close every actionable stage.");
  return { stages, reasons };
}
