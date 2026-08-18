/**
 * LAYER 3 — Master Spotter: interface structure only.
 *
 * Labels, option lists, question structure and safety copy.
 * This file contains NO chemistry: no dilution, temperature, dwell time,
 * dosage, pH value, neutralisation recipe or product equivalence.
 * Every technical value shown in Master Spotter comes from an approved
 * database record (Constitution R9, R20, R22).
 */

export const MASTER_LAYER_KEY = "master" as const;

export const NOT_VERIFIED = "Not verified";

export const MASTER_INTRO =
  "Advanced case-treatment workspace. Technical depth is shown only where an approved manufacturer document, verified technical source or technically reviewed record exists.";

export const OPERATOR_OBSERVATION_LABEL = "Operator observation—not approved treatment guidance";

export const OFFLINE_STALE_WARNING =
  "Offline copy. Current product documentation may have changed since this summary was stored.";

export const FAIL_CLOSED_MESSAGE =
  "Current verified technical guidance is unavailable. Do not begin a new chemical stage until the approved information is available.";

export const UNVERIFIED_TRANSITION_MESSAGE =
  "This transition is not supported by sufficiently verified information. Complete the required rinse, test or technical assessment before continuing.";

export const NO_BEST_PRODUCT_NOTE =
  "Products are never ranked. Comparison shows verified eligibility only, never equivalence.";

export const UNKNOWN = "Unknown";

/* ------------------------------------------------------------------ */
/* 4. Advanced case intake                                             */
/* ------------------------------------------------------------------ */

export const GARMENT_IDENTITY_QUESTIONS = [
  {
    key: "garmentType",
    label: "Garment type",
    options: ["Shirt/blouse", "Trousers", "Jacket/coat", "Suit", "Dress", "Knitwear", "Saree/ethnic wear", "Outerwear/technical", "Furnishing", "Other"],
  },
  {
    key: "valueClass",
    label: "Value and risk classification",
    options: ["Standard", "High value", "Designer", "Heritage", "Irreplaceable", UNKNOWN],
  },
  {
    key: "sentimental",
    label: "Sentimental, heritage or irreplaceable",
    options: ["No", "Yes", UNKNOWN],
  },
  {
    key: "cleaningHistory",
    label: "Previous cleaning history",
    options: ["Never cleaned", "Dry cleaned before", "Wet cleaned before", "Home washed", "Multiple processes", UNKNOWN],
  },
  {
    key: "plannedProcess",
    label: "Planned final cleaning process",
    options: ["Dry cleaning", "Wet cleaning", "Laundry", "Hand finishing only", "Not decided"],
  },
  { key: "turnaround", label: "Required turnaround (optional)", options: ["Same day", "24 hours", "Standard", "No deadline"] },
  { key: "conditionPhotos", label: "Existing condition photographs recorded", options: ["Yes", "No"] },
  { key: "preExistingDamage", label: "Pre-existing damage acknowledged with the customer", options: ["Yes", "No", "Not applicable"] },
] as const;

export const FIBRE_CATEGORIES = [
  "Natural fibre",
  "Regenerated cellulose",
  "Synthetic fibre",
  "Protein fibre",
  "Mineral/inorganic fibre",
  "Coated or laminated material",
  "Leather or suede component",
  "Unknown material",
] as const;

export const FIBRE_CERTAINTY = ["Confirmed fibre", "Suspected fibre", "Fibre blend", UNKNOWN] as const;

export const FIBRE_IDENTIFICATION_METHODS = [
  { key: "care_label", label: "Care label", destructive: false },
  { key: "supplier", label: "Supplier or manufacturer information", destructive: false },
  { key: "visual", label: "Visual assessment", destructive: false },
  { key: "microscopy", label: "Microscopy", destructive: false },
  { key: "solubility", label: "Solubility test", destructive: true },
  { key: "controlled_test", label: "Controlled fibre-identification test", destructive: true },
  { key: "judgment", label: "Operator judgment", destructive: false },
  { key: "unknown", label: "Unknown", destructive: false },
] as const;

export type FibreIdentificationKey = (typeof FIBRE_IDENTIFICATION_METHODS)[number]["key"];

export const DESTRUCTIVE_TEST_WARNING =
  "Destructive fibre testing removes material from the garment. It is not a default method. Record an approved sampling location and method, and obtain authorisation before sampling.";

export const APPROVED_SAMPLING_LOCATIONS = [
  "Inside seam allowance",
  "Inside hem allowance",
  "Spare fabric supplied with the garment",
  "Pocket bag facing",
  "Concealed facing behind a closure",
] as const;

export const CONSTRUCTION_OPTIONS = [
  "Woven", "Knitted", "Nonwoven", "Pile", "Velvet", "Flocked", "Felted", "Bonded",
  "Laminated", "Coated", "Quilted", "Adhesive construction", "Mixed construction", UNKNOWN,
] as const;

export const DYE_COLOUR_OPTIONS = [
  "White", "Light", "Dark", "Multicolour", "Printed", "Pigment printed", "Transfer printed",
  "Piece dyed", "Yarn dyed", "Garment dyed", "Unknown colouration method",
] as const;

export const DYE_RISK_FLAGS = [
  { key: "colourfastness", label: "Colourfastness test result", options: ["Passed", "Marginal", "Failed", "Not tested"] },
  { key: "bleeding", label: "Active bleeding", options: ["No", "Yes", UNKNOWN] },
  { key: "crocking", label: "Crocking", options: ["No", "Yes", UNKNOWN] },
  { key: "fading", label: "Fading", options: ["No", "Yes", UNKNOWN] },
  { key: "brightener", label: "Optical brightener sensitivity", options: ["No", "Yes", UNKNOWN] },
  { key: "fluorescent", label: "Fluorescent colour", options: ["No", "Yes", UNKNOWN] },
  { key: "metallic", label: "Metallic finish", options: ["No", "Yes", UNKNOWN] },
] as const;

/** Trims and finishes. `sensitive` items drive the most-sensitive-component rule. */
export const TRIMS_AND_FINISHES = [
  { key: "embroidery", label: "Embroidery", sensitive: true },
  { key: "sequins", label: "Sequins", sensitive: true },
  { key: "beads", label: "Beads", sensitive: true },
  { key: "stones", label: "Stones", sensitive: true },
  { key: "metallic_trim", label: "Metallic trim", sensitive: true },
  { key: "buttons", label: "Buttons", sensitive: false },
  { key: "zippers", label: "Zippers", sensitive: false },
  { key: "adhesive_decoration", label: "Adhesive decoration", sensitive: true },
  { key: "screen_print", label: "Screen print", sensitive: true },
  { key: "transfer_print", label: "Transfer print", sensitive: true },
  { key: "reflective_trim", label: "Reflective trim", sensitive: true },
  { key: "waterproof_finish", label: "Waterproof finish", sensitive: true },
  { key: "flame_resistant", label: "Flame-resistant finish", sensitive: true },
  { key: "resin_finish", label: "Resin finish", sensitive: true },
  { key: "crease_resistant", label: "Crease-resistant finish", sensitive: true },
  { key: "antimicrobial", label: "Antimicrobial finish", sensitive: true },
  { key: "unknown_finish", label: "Unknown finish", sensitive: true },
] as const;

export type TrimKey = (typeof TRIMS_AND_FINISHES)[number]["key"];

export const MOST_SENSITIVE_COMPONENT_NOTE =
  "The safety decision follows the most sensitive component of the complete garment, not the main fabric alone.";

/* ------------------------------------------------------------------ */
/* 5. Advanced stain diagnosis                                         */
/* ------------------------------------------------------------------ */

export const STAIN_PHYSICAL_STATE = ["Liquid", "Dried", "Solid deposit", "Greasy film", "Crusted", "Powdery", UNKNOWN] as const;

export const STAIN_CONDITIONS = [
  "Surface deposit", "Penetrated deposit", "Oxidized", "Polymerized", "Denatured", "Heat-set",
  "Aged", "Chemically altered", "Previously reduced", "Previously oxidized", "Unknown condition",
] as const;

export const ODOUR_SAFETY_NOTE = "Observe odour indirectly. Never smell an unknown chemical or garment directly.";

/** The system must distinguish removable soil from permanent change. */
export const MARK_KINDS = [
  { key: "stain", label: "Stain", removable: true },
  { key: "soil", label: "Soil", removable: true },
  { key: "dye_loss", label: "Dye loss", removable: false },
  { key: "colour_transfer", label: "Colour transfer", removable: true },
  { key: "oxidation", label: "Oxidation/yellowing", removable: true },
  { key: "metal_rust", label: "Metal/rust deposit", removable: true },
  { key: "scorch", label: "Scorch", removable: false },
  { key: "chemical_damage", label: "Chemical damage", removable: false },
  { key: "coating_failure", label: "Coating failure", removable: false },
  { key: "fibre_degradation", label: "Fibre degradation", removable: false },
  { key: "optical_effect", label: "Optical effect", removable: false },
  { key: "unknown_mark", label: "Unknown mark", removable: false },
] as const;

export type MarkKind = (typeof MARK_KINDS)[number]["key"];

export const NON_REMOVABLE_MESSAGE =
  "This mark is recorded as a fabric change rather than removable soil. Chemical treatment cannot restore it and may increase the damage.";

/* ------------------------------------------------------------------ */
/* 6. Diagnostic evidence panel                                        */
/* ------------------------------------------------------------------ */

export const CONFIDENCE_FIELDS = [
  { key: "stainIdentity", label: "Stain-identification confidence" },
  { key: "fabricIdentity", label: "Fabric-identification confidence" },
  { key: "treatment", label: "Treatment confidence" },
  { key: "operator", label: "Operator confidence" },
] as const;

export type ConfidenceKey = (typeof CONFIDENCE_FIELDS)[number]["key"];

export const CONFIDENCE_LEVELS = ["High", "Moderate", "Low", UNKNOWN] as const;

export const CONFIDENCE_NEVER_OVERRIDES =
  "Operator confidence is not technical evidence and never releases a safety block.";

/* ------------------------------------------------------------------ */
/* 7. Previous-treatment chemistry ledger                              */
/* ------------------------------------------------------------------ */

export const LEDGER_FIELDS = [
  { key: "productName", label: "Product", kind: "text" },
  { key: "manufacturer", label: "Manufacturer", kind: "text" },
  { key: "amount", label: "Amount or application level", kind: "text" },
  { key: "dilution", label: "Dilution (only if verified and known)", kind: "text" },
  { key: "temperature", label: "Temperature", kind: "text" },
  { key: "contactTime", label: "Contact time", kind: "text" },
  { key: "mechanicalAction", label: "Mechanical action", kind: "text" },
  { key: "dryingOrHeat", label: "Drying or heat exposure", kind: "text" },
  { key: "visibleResponse", label: "Visible response", kind: "text" },
  { key: "colourMovement", label: "Colour movement", kind: "text" },
  { key: "textureChange", label: "Texture change", kind: "text" },
  { key: "notes", label: "Notes", kind: "text" },
] as const;

export const LEDGER_TOGGLES = [
  { key: "steamUsed", label: "Steam used" },
  { key: "vacuumUsed", label: "Vacuum used" },
  { key: "spottingBoardUsed", label: "Spotting board used" },
  { key: "rinsePerformed", label: "Rinse or flush performed" },
  { key: "neutralizationPerformed", label: "Neutralisation performed" },
] as const;

export const UNKNOWN_PRODUCT = "Unknown product";
export const UNKNOWN_ACTION = "Unknown action";

export const UNKNOWN_CHEMISTRY_RESTRICTION =
  "Previous chemistry is unknown. Incompatible next steps are restricted until the garment is flushed and reassessed.";

/* ------------------------------------------------------------------ */
/* 8. Chemistry pathway stages (possible stages, not a fixed sequence) */
/* ------------------------------------------------------------------ */

export const MASTER_STAGES = [
  { number: 1, key: "inspection", label: "Inspection and documentation", chemical: false },
  { number: 2, key: "mechanical", label: "Mechanical removal of excess material", chemical: false },
  { number: 3, key: "testing", label: "Controlled testing", chemical: false },
  { number: 4, key: "soluble", label: "Soluble-component assessment", chemical: false },
  { number: 5, key: "oil", label: "Oily/solvent-compatible stage", chemical: true, component: "oil" },
  { number: 6, key: "protein", label: "Protein/enzyme-compatible stage", chemical: true, component: "protein" },
  { number: 7, key: "tannin", label: "Tannin/acid-compatible stage", chemical: true, component: "tannin" },
  { number: 8, key: "alkali", label: "Alkali-compatible stage", chemical: true, component: "alkali" },
  { number: 9, key: "dye", label: "Dye/pigment assessment", chemical: true, component: "colour" },
  { number: 10, key: "oxidising", label: "Oxidizing stage, when eligible", chemical: true, component: "colour", conditional: true },
  { number: 11, key: "reducing", label: "Reducing stage, when eligible", chemical: true, component: "colour", conditional: true },
  { number: 12, key: "metal", label: "Metal/rust stage, when eligible", chemical: true, component: "metal", conditional: true },
  { number: 13, key: "rinse", label: "Controlled rinse or flush", chemical: false },
  { number: 14, key: "neutralise", label: "Neutralization, when required", chemical: false, conditional: true },
  { number: 15, key: "final_process", label: "Final cleaning process", chemical: false },
  { number: 16, key: "drying", label: "Drying and final inspection", chemical: false },
  { number: 17, key: "outcome", label: "Outcome documentation", chemical: false },
] as const;

export type MasterStageKey = (typeof MASTER_STAGES)[number]["key"];

export const STAGES_ARE_NOT_A_SEQUENCE =
  "These are possible stages, not a mandatory universal sequence. Eligibility depends on the stain components, fibre, dye stability, construction, finishes, previous chemistry, selected manufacturer, planned final process and the approved source instructions.";

/* ------------------------------------------------------------------ */
/* 9. Advanced chemistry fields — labels only, values come from data   */
/* ------------------------------------------------------------------ */

export const CHEMISTRY_FIELDS = [
  { key: "chemicalFamily", label: "Chemical family" },
  { key: "functionalRole", label: "Functional role" },
  { key: "carrier", label: "Water-based or solvent-based behaviour" },
  { key: "acidity", label: "Acidity/alkalinity" },
  { key: "ph", label: "Verified pH or pH range" },
  { key: "enzymeClass", label: "Enzyme class" },
  { key: "oxidising", label: "Oxidizing action" },
  { key: "reducing", label: "Reducing action" },
  { key: "chelation", label: "Chelation or metal-removal action" },
  { key: "emulsification", label: "Emulsification" },
  { key: "surfactant", label: "Surfactant action" },
  { key: "solvent", label: "Solvent action" },
  { key: "tannin", label: "Tannin action" },
  { key: "protein", label: "Protein action" },
  { key: "dyeRisk", label: "Dye-risk implications" },
  { key: "temperatureSensitivity", label: "Temperature sensitivity" },
  { key: "contactTime", label: "Dwell/contact time" },
  { key: "concentration", label: "Concentration or dilution" },
  { key: "moisture", label: "Moisture requirement" },
  { key: "mechanicalAction", label: "Mechanical action" },
  { key: "steam", label: "Steam compatibility" },
  { key: "vacuum", label: "Vacuum requirement" },
  { key: "rinse", label: "Rinse/flush requirement" },
  { key: "neutralisation", label: "Neutralization requirement" },
  { key: "incompatibilities", label: "Incompatibilities" },
  { key: "transitions", label: "Transition requirements" },
  { key: "ppe", label: "PPE" },
  { key: "ventilation", label: "Ventilation" },
  { key: "storage", label: "Storage and handling warnings" },
] as const;

export type ChemistryFieldKey = (typeof CHEMISTRY_FIELDS)[number]["key"];

/** Capabilities Master Spotter still must never perform (Constitution R9). */
export const FORBIDDEN_CALCULATIONS = [
  "custom_chemical_formulation",
  "unsupported_concentration",
  "improvised_oxidiser_or_reducer",
  "unsupported_ph_adjustment",
  "undocumented_product_combination",
  "marketing_based_brand_equivalence",
  "ai_inferred_substitution",
  "experimental_chemistry_as_approved",
] as const;

export type ForbiddenCalculation = (typeof FORBIDDEN_CALCULATIONS)[number];

/* ------------------------------------------------------------------ */
/* 10. Transition outcomes                                             */
/* ------------------------------------------------------------------ */

export const TRANSITION_OUTCOMES = [
  { key: "eligible", label: "Eligible", allowed: true, overridable: true },
  { key: "eligible_after_rinse", label: "Eligible after rinse/flush", allowed: false, overridable: true },
  { key: "eligible_after_neutralisation", label: "Eligible after verified neutralization", allowed: false, overridable: true },
  { key: "additional_test_required", label: "Additional test required", allowed: false, overridable: true },
  { key: "incompatible", label: "Incompatible", allowed: false, overridable: false },
  { key: "insufficient_information", label: "Insufficient verified information", allowed: false, overridable: false },
  { key: "blocked", label: "Treatment blocked", allowed: false, overridable: false },
] as const;

export type TransitionOutcomeKey = (typeof TRANSITION_OUTCOMES)[number]["key"];

/* ------------------------------------------------------------------ */
/* 13. Inspection checkpoints                                          */
/* ------------------------------------------------------------------ */

export const INSPECTION_RESULTS = [
  { key: "removed", label: "Stain removed", stop: false },
  { key: "reduced", label: "Stain reduced", stop: false },
  { key: "unchanged", label: "Stain unchanged", stop: false },
  { key: "spread", label: "Stain spread", stop: true },
  { key: "colour_transferred", label: "Colour transferred", stop: true },
  { key: "colour_changed", label: "Colour changed", stop: true },
  { key: "texture_changed", label: "Texture changed", stop: true },
  { key: "shine", label: "Shine appeared", stop: true },
  { key: "fabric_weakened", label: "Fabric weakened", stop: true },
  { key: "coating_changed", label: "Coating changed", stop: true },
  { key: "adhesive_changed", label: "Adhesive changed", stop: true },
  { key: "odour_remains", label: "Odour remains", stop: false },
  { key: "uncertain", label: "Uncertain response", stop: true },
] as const;

export type InspectionResultKey = (typeof INSPECTION_RESULTS)[number]["key"];

export const IMMEDIATE_STOP_CONDITIONS = [
  { key: "active_bleeding", label: "Active colour bleeding" },
  { key: "fibre_weakening", label: "Fibre weakening" },
  { key: "coating_failure", label: "Coating failure" },
  { key: "delamination", label: "Delamination" },
  { key: "unexpected_heat", label: "Unexpected heat" },
  { key: "fumes", label: "Fumes or unsafe reaction" },
  { key: "rapid_colour_change", label: "Rapid colour change" },
  { key: "unknown_response", label: "Unknown chemical response" },
  { key: "failed_test", label: "Failed controlled test" },
] as const;

export type StopConditionKey = (typeof IMMEDIATE_STOP_CONDITIONS)[number]["key"];

export const NO_SDS_EMERGENCY_TEXT =
  "No approved safety data sheet is loaded for this product. Follow your site emergency procedure and the current product label.";

/* ------------------------------------------------------------------ */
/* 14. Component map                                                   */
/* ------------------------------------------------------------------ */

export const COMPONENT_MAP_ORDER = [
  { key: "surface", label: "Surface deposit" },
  { key: "oil", label: "Oil/grease component" },
  { key: "protein", label: "Protein component" },
  { key: "tannin", label: "Tannin/dye component" },
  { key: "pigment", label: "Pigment component" },
  { key: "metal", label: "Metal/mineral component" },
  { key: "residue", label: "Final residue" },
  { key: "damage", label: "Possible permanent damage" },
] as const;

export type ComponentMapKey = (typeof COMPONENT_MAP_ORDER)[number]["key"];

export const NO_UNIVERSAL_SEQUENCE_NOTE =
  "Combination stains do not share a universal sequence. Each case is sequenced from its own approved component mapping.";

/* ------------------------------------------------------------------ */
/* 15. Cross-brand comparison                                          */
/* ------------------------------------------------------------------ */

export const COMPARISON_FIELDS = [
  { key: "component", label: "Intended stain component" },
  { key: "textiles", label: "Compatible textiles" },
  { key: "process", label: "Process compatibility" },
  { key: "application", label: "Application type" },
  { key: "dilution", label: "Ready-to-use/dilution status" },
  { key: "contactTime", label: "Contact time" },
  { key: "rinse", label: "Rinse/neutralisation requirements" },
  { key: "ppe", label: "PPE" },
  { key: "prohibitions", label: "Prohibitions" },
  { key: "sourceQuality", label: "Source quality" },
  { key: "verificationDate", label: "Verification date" },
  { key: "country", label: "Country availability" },
  { key: "cost", label: "Cost per verified use" },
] as const;

export const COMPARISON_OUTCOMES = [
  { key: "eligible", label: "Eligible for this case" },
  { key: "conditionally_eligible", label: "Conditionally eligible" },
  { key: "not_eligible", label: "Not eligible" },
  { key: "insufficient_evidence", label: "Insufficient evidence" },
  { key: "different_function", label: "Different function—not directly comparable" },
] as const;

export type ComparisonOutcomeKey = (typeof COMPARISON_OUTCOMES)[number]["key"];

export const CROSS_BRAND_TRANSITION_NOTE =
  "Switching between companies still requires the verified transition for the products actually used.";

/* ------------------------------------------------------------------ */
/* 16. Basic/domestic alternatives                                     */
/* ------------------------------------------------------------------ */

export const MASTER_BASIC_LABEL = "Verified basic alternative—not a direct chemical equivalent";

/* ------------------------------------------------------------------ */
/* 17. Failure analysis                                                */
/* ------------------------------------------------------------------ */

export const FAILURE_CAUSES = [
  { key: "wrong_identification", label: "Incorrect stain identification" },
  { key: "incomplete_sequence", label: "Incomplete component sequence" },
  { key: "aged_or_heatset", label: "Aged or heat-set stain" },
  { key: "oxidised", label: "Oxidation or polymerization" },
  { key: "incompatible_previous", label: "Incompatible previous chemistry" },
  { key: "insufficient_rinse", label: "Insufficient rinse or flush" },
  { key: "dwell_time", label: "Incorrect dwell time" },
  { key: "temperature", label: "Incorrect temperature" },
  { key: "mechanical", label: "Insufficient or excessive mechanical action" },
  { key: "fibre_damage", label: "Fibre damage mistaken for stain" },
  { key: "dye_loss", label: "Dye loss mistaken for stain" },
  { key: "finish_failure", label: "Coating or finish failure" },
  { key: "out_of_scope", label: "Product out of verified scope" },
  { key: "permanent", label: "Permanent damage" },
  { key: "missing_evidence", label: "Missing evidence" },
] as const;

export type FailureCauseKey = (typeof FAILURE_CAUSES)[number]["key"];

export const FAILURE_CONCLUSIONS = [
  { key: "retry_once", label: "Retry the same verified stage once" },
  { key: "complete_rinse", label: "Complete required rinse/neutralization" },
  { key: "reassess_identity", label: "Reassess stain identity" },
  { key: "change_stage", label: "Change to another verified stage" },
  { key: "stop", label: "Stop treatment" },
  { key: "permanent_damage", label: "Permanent damage possible" },
  { key: "external_consultation", label: "External laboratory/manufacturer consultation" },
  { key: "no_pathway", label: "No supported pathway remains" },
] as const;

export type FailureConclusionKey = (typeof FAILURE_CONCLUSIONS)[number]["key"];

export const NO_STRONGER_CHEMISTRY_NOTE =
  "Stronger chemistry is never recommended simply because a stain remains.";

/* ------------------------------------------------------------------ */
/* 18. Outcomes                                                        */
/* ------------------------------------------------------------------ */

export const MASTER_OUTCOMES = [
  "Fully removed",
  "Substantially reduced",
  "Partially reduced",
  "No improvement",
  "Treatment stopped safely",
  "Colour damage detected",
  "Fabric damage detected",
  "Pre-existing damage confirmed",
  "Permanent damage likely",
  "Further technical review required",
] as const;

export type MasterOutcome = (typeof MASTER_OUTCOMES)[number];

export const NO_AUTO_GUIDANCE_NOTE =
  "A successful case never becomes universal treatment guidance automatically. Promotion runs through governance review.";

/* ------------------------------------------------------------------ */
/* 19. Technical references                                            */
/* ------------------------------------------------------------------ */

export const REFERENCE_FIELDS = [
  { key: "sourceType", label: "Source type" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "title", label: "Document title" },
  { key: "documentNumber", label: "Document number" },
  { key: "version", label: "Version" },
  { key: "revisionDate", label: "Publication/revision date" },
  { key: "section", label: "Exact page or section" },
  { key: "language", label: "Language" },
  { key: "country", label: "Country applicability" },
  { key: "extractionStatus", label: "Extraction status" },
  { key: "reviewer", label: "Reviewer" },
  { key: "reviewDate", label: "Review date" },
] as const;

export const EVIDENCE_KINDS = [
  { key: "manufacturer_claim", label: "Manufacturer claim", drivesGuidance: false },
  { key: "approved_interpretation", label: "Approved Stain Master interpretation", drivesGuidance: true },
  { key: "independent_evidence", label: "Independent technical evidence", drivesGuidance: true },
  { key: "operator_observation", label: "Operator observation", drivesGuidance: false },
  { key: "provisional", label: "Provisional information", drivesGuidance: false },
  { key: "superseded", label: "Superseded information", drivesGuidance: false },
] as const;

export type EvidenceKind = (typeof EVIDENCE_KINDS)[number]["key"];

export const SUPERSEDED_WARNING =
  "This instruction has been superseded. Do not treat from it — load the current approved document.";

/* ------------------------------------------------------------------ */
/* 20. Safety hierarchy                                                */
/* ------------------------------------------------------------------ */

export const SAFETY_HIERARCHY = [
  { rank: 1, key: "human_safety", label: "Immediate human safety", overridable: false },
  { rank: 2, key: "sds_prohibition", label: "SDS and manufacturer prohibitions", overridable: false },
  { rank: 3, key: "care_label_prohibition", label: "Garment care-label prohibition", overridable: false },
  { rank: 4, key: "damage_or_bleeding", label: "Existing damage and active bleeding", overridable: false },
  { rank: 5, key: "material_safety", label: "Fibre, dye, construction and finish safety", overridable: false },
  { rank: 6, key: "unknown_previous_chemistry", label: "Unknown previous chemistry", overridable: false },
  { rank: 7, key: "verified_transition", label: "Verified transition requirements", overridable: false },
  { rank: 8, key: "stain_removal", label: "Stain-removal objective", overridable: true },
  { rank: 9, key: "cost_convenience", label: "Cost and convenience", overridable: true },
] as const;

export type SafetyHierarchyKey = (typeof SAFETY_HIERARCHY)[number]["key"];

/* ------------------------------------------------------------------ */
/* 11 & 21. Workspace structure                                        */
/* ------------------------------------------------------------------ */

export const MASTER_TABS = [
  { key: "case", label: "Case" },
  { key: "diagnosis", label: "Diagnosis" },
  { key: "pathway", label: "Pathway" },
  { key: "safety", label: "Safety" },
  { key: "evidence", label: "Evidence" },
  { key: "outcome", label: "Outcome" },
] as const;

export type MasterTabKey = (typeof MASTER_TABS)[number]["key"];

export const INSTRUCTION_CARD_SECTIONS = [
  "Current treatment stage",
  "Product and manufacturer",
  "Purpose in this case",
  "Eligibility status",
  "Fabric and dye limitations",
  "Concealed-area test requirement",
  "Manufacturer-approved application",
  "Verified dilution or ready-to-use status",
  "Verified temperature",
  "Verified contact time",
  "Permitted mechanical action",
  "Steam/vacuum guidance",
  "Required PPE",
  "Prohibited combinations",
  "Required rinse, flush or neutralization",
  "Inspection checkpoint",
  "Maximum verified repetition",
  "Source and verification information",
  "Next eligible actions",
  "Stop conditions",
] as const;

export const VIEW_MODES = [
  { key: "technical", label: "Technical view" },
  { key: "simplified", label: "Simplified job card" },
] as const;

export type ViewMode = (typeof VIEW_MODES)[number]["key"];
