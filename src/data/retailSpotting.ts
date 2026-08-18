/**
 * LAYER 1 — Retail Spotting: interface structure only.
 *
 * Everything in this file is labels, question structure and safety copy.
 * It contains NO product chemistry: no dilution, temperature, dwell time,
 * dosage, neutralization or compatibility data (Constitution R9, R22).
 */

export const WORKING_LAYERS = [
  { key: "retail", label: "Retail Spotting", note: "Simple, safety-first guidance", available: true },
  { key: "professional", label: "Professional", note: "Coming later", available: false },
  { key: "master", label: "Master Spotter", note: "Coming later", available: false },
] as const;

export type WorkingLayerKey = (typeof WORKING_LAYERS)[number]["key"];

export const LAYER_UNAVAILABLE_MESSAGE =
  "This working level is being prepared. Continue with Retail Spotting for simple, safety-first guidance.";

/** Non-company kit options. Companies themselves are loaded from the database. */
export const GENERIC_KIT_OPTIONS = [
  { key: "basic", label: "Basic/domestic products", note: "Only verified, approved basic methods are shown" },
  { key: "other", label: "Other spotting kit", note: "Record the kit name — instructions are never invented" },
  { key: "none", label: "No spotting kit available", note: "Guidance is limited to safe first response" },
] as const;

export type GenericKitKey = (typeof GENERIC_KIT_OPTIONS)[number]["key"];

/* ------------------------------------------------------------------ */
/* Step 1 — stain                                                      */
/* ------------------------------------------------------------------ */

export const STAIN_SHORTCUTS = [
  "Tea/coffee",
  "Oil/grease",
  "Blood",
  "Food",
  "Ink",
  "Makeup",
  "Paint",
  "Mud",
  "Rust",
  "Colour bleeding",
  "Unknown mark",
] as const;

export const SMELL_WARNING = "Do not smell unknown chemicals directly.";

export const OBSERVATION_QUESTIONS = [
  { key: "colour", label: "What colour is the mark?", options: ["Brown", "Yellow", "Red", "Blue/black", "Green", "White/pale", "Multi/unclear"] },
  { key: "smell", label: "Any noticeable smell?", options: ["No smell", "Food or drink", "Sweet", "Chemical or solvent", "Not checked"] },
  { key: "feel", label: "How does it feel?", options: ["Oily", "Sticky", "Dry", "Powdery", "Crusted", "Not sure"] },
  { key: "location", label: "Where is it on the garment?", options: ["Collar", "Cuff", "Front body", "Underarm", "Hem", "Pocket area", "All over"] },
  { key: "age", label: "Is it fresh or old?", options: ["Fresh", "Old", "Not sure"] },
  { key: "appeared", label: "Did it appear after a process?", options: ["No", "After cleaning", "After drying", "After ironing", "Not sure"] },
] as const;

/* ------------------------------------------------------------------ */
/* Step 2 — garment                                                    */
/* ------------------------------------------------------------------ */

export const FABRIC_KNOWLEDGE_OPTIONS = ["Yes", "Not sure", "No care label"] as const;

export const COMMON_FABRICS = [
  "Cotton", "Linen", "Wool", "Silk", "Polyester", "Nylon", "Acrylic",
  "Viscose/rayon", "Acetate", "Elastane blend", "Leather or suede", "Mixed/unknown blend",
] as const;

export const COLOUR_OPTIONS = ["White", "Light", "Dark", "Multicolour", "Unknown"] as const;

export const GARMENT_QUESTIONS = [
  { key: "careLabel", label: "Is a care label available?", options: ["Yes", "No label", "Unreadable"] },
  { key: "stainAge", label: "How old is the stain?", options: ["Fresh", "Old", "Unknown"] },
  { key: "heat", label: "Has it been through heat (iron, dryer, press)?", options: ["No", "Yes", "Not sure"] },
  { key: "treated", label: "Has anything been applied already?", options: ["No", "Yes — product known", "Yes — product unknown"] },
  { key: "damage", label: "Any visible fabric damage?", options: ["No", "Yes", "Not sure"] },
  { key: "bleeding", label: "Is colour moving or bleeding right now?", options: ["No", "Yes", "Not sure"] },
  { key: "construction", label: "Print, coating, embroidery or embellishment?", options: ["No", "Yes", "Not sure"] },
] as const;

/* ------------------------------------------------------------------ */
/* Step 4 — concealed-area test                                        */
/* ------------------------------------------------------------------ */

export const CONCEALED_TEST_LOCATIONS = [
  "Inside seam",
  "Inside hem",
  "Pocket facing",
  "Spare fabric allowance",
  "Another concealed construction area",
] as const;

export const CONCEALED_TEST_STEPS = [
  "Inspect the concealed area before testing.",
  "Place a clean white absorbent cloth underneath where possible.",
  "Apply the smallest practical amount of the selected product.",
  "Blot gently — do not rub.",
  "Check the white cloth for colour transfer.",
  "Check the garment for texture change, shine, swelling, hardening, coating damage or weakening.",
  "Allow the test area to settle or dry when the approved product instructions require it.",
  "Continue only when no unsafe change is observed.",
] as const;

export const TEST_RESULTS = ["Passed", "Failed", "Unsure", "No concealed area available"] as const;
export type TestResult = (typeof TEST_RESULTS)[number] | "Not tested";

/* ------------------------------------------------------------------ */
/* Result copy                                                         */
/* ------------------------------------------------------------------ */

export const AVOID_LIBRARY = {
  rub: "Do not rub.",
  heat: "Do not apply heat.",
  mix: "Do not mix products.",
  colour: "Do not continue if colour transfers.",
  texture: "Do not continue if the fabric texture changes.",
} as const;

export const CHECK_AFTER_EVERY_STEP = [
  "Stain reduction",
  "Colour transfer",
  "Spreading",
  "Texture change",
  "Shine",
  "Fibre damage",
  "Coating or print damage",
] as const;

export const NEXT_DECISIONS = [
  { key: "reduced", label: "Stain reduced — continue as instructed" },
  { key: "no_change", label: "No change — stop or escalate" },
  { key: "colour_moved", label: "Colour moved — stop" },
  { key: "fabric_changed", label: "Fabric changed — stop" },
  { key: "record", label: "Record outcome" },
] as const;

export const EXPECTED_OUTCOMES = [
  "Likely removable",
  "Likely reducible",
  "Improvement possible",
  "Result uncertain",
  "Permanent damage possible",
  "Professional assessment recommended",
] as const;

export type ExpectedOutcome = (typeof EXPECTED_OUTCOMES)[number];

export const NO_VERIFIED_BASIC_METHOD =
  "No sufficiently verified basic method is available for this case. Test an approved spotting-kit product in a concealed area or escalate the case.";

/** Possible basic material categories — never an automatic recommendation. */
export const BASIC_MATERIAL_CATEGORIES = [
  "Cool or lukewarm water",
  "Mild neutral liquid detergent",
  "Mild dishwashing liquid",
  "White absorbent cloth",
  "Absorbent powder for fresh oil",
  "Blunt scraper",
  "Individually approved consumer oxygen-based product",
] as const;

export const PROHIBITED_COMBINATIONS = [
  "bleach and acid",
  "bleach and ammonia",
  "different bleaching products",
  "peroxide with an unverified product",
  "vinegar with an unverified chemical",
  "solvents with unknown previous chemicals",
  "any household hack without verified 9/10 confidence",
] as const;

export const RETAIL_STEPS = [
  { key: "stain", label: "Stain" },
  { key: "garment", label: "Garment" },
  { key: "safety", label: "Safety Test" },
  { key: "guidance", label: "Guidance" },
  { key: "outcome", label: "Outcome" },
] as const;
