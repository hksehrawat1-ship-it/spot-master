/**
 * Step 2 — Fabric Safety Check
 * Transparent, rules-based risk engine.
 * Principle: users describe what they see, Stain Master decides what is safe.
 * No stain-removal product is recommended here.
 */

export type UserRoleKey =
  | "domestic_user"
  | "laundry_employee"
  | "dry_cleaner"
  | "professional_spotter"
  | "trainer"
  | "learner";

export const USER_ROLES: { key: UserRoleKey; label: string; hint: string }[] = [
  { key: "domestic_user", label: "Domestic user", hint: "At-home garment care" },
  { key: "laundry_employee", label: "Laundry-store employee", hint: "Counter and processing staff" },
  { key: "dry_cleaner", label: "Dry-cleaning operator", hint: "Machine and process operator" },
  { key: "professional_spotter", label: "Professional spotter", hint: "Trained stain removal" },
  { key: "trainer", label: "Trainer", hint: "Teaching and supervision" },
  { key: "learner", label: "Learner", hint: "In training, supervised" },
];

/** Roles allowed to record professional compatibility tests. */
export const TEST_ALLOWED_ROLES: UserRoleKey[] = [
  "laundry_employee",
  "dry_cleaner",
  "professional_spotter",
  "trainer",
];

/** Domestic users and learners never receive professional test instructions. */
export function canRunProfessionalTests(role: UserRoleKey) {
  return TEST_ALLOWED_ROLES.includes(role);
}

export type LabelRoute = "label" | "no_label" | "unclear";

export const GARMENT_TYPES = [
  "Shirt or top", "T-shirt", "Trousers", "Jeans", "Saree", "Dupatta",
  "Kurta or kurti", "Salwar or churidar", "Lehenga", "Sherwani",
  "Suit or blazer", "Dress or gown", "Jacket or coat", "Sweater or knitwear",
  "Bridal or ceremonial wear", "School or work uniform", "Sportswear",
  "Undergarment", "Curtain", "Upholstery", "Bedding", "Carpet or rug",
  "Other", "Not sure",
];

export const CLEANING_HISTORY = [
  "Machine washed", "Hand washed", "Professionally dry-cleaned",
  "Professionally wet-cleaned", "Spot-cleaned only", "Never cleaned", "Not known",
];

export const HISTORY_FOLLOWUPS = [
  { key: "shrinkage", label: "Was there shrinkage?" },
  { key: "colourBleed", label: "Did colour bleed?" },
  { key: "textureChange", label: "Did the texture change?" },
  { key: "decorationLoosened", label: "Did decorations loosen?" },
  { key: "ringOrWatermark", label: "Did a ring or watermark appear?" },
  { key: "satisfactory", label: "Was the previous result satisfactory?" },
] as const;

export const FABRIC_APPEARANCE = [
  { key: "Plain and sturdy", emoji: "🧵" },
  { key: "Smooth", emoji: "▫️" },
  { key: "Shiny", emoji: "✨" },
  { key: "Soft and flowing", emoji: "🌊" },
  { key: "Crisp or stiff", emoji: "📄" },
  { key: "Very thin or transparent", emoji: "🫧" },
  { key: "Fuzzy or wool-like", emoji: "🐑" },
  { key: "Knitted", emoji: "🧶" },
  { key: "Stretchy", emoji: "🎈" },
  { key: "Rough or textured", emoji: "🪵" },
  { key: "Velvet-like pile", emoji: "🟪" },
  { key: "Satin-like surface", emoji: "🪞" },
  { key: "Coated", emoji: "🛡️" },
  { key: "Rubberized", emoji: "⚫" },
  { key: "Waterproof", emoji: "☔" },
  { key: "Leather-like", emoji: "🧳" },
  { key: "Suede-like", emoji: "🟫" },
  { key: "Fur-like", emoji: "🧸" },
  { key: "Unknown", emoji: "❓" },
];

export const COLOUR_OPTIONS = [
  "White", "Light coloured", "Dark coloured", "Bright coloured", "Multicoloured",
  "Printed", "Patterned", "Metallic", "Garment-dyed or uneven colour", "Not sure",
];

export const COLOUR_FLAGS = [
  { key: "crossesColours", label: "Is the stain crossing two or more colours?" },
  { key: "faded", label: "Does the colour already look faded?" },
  { key: "transferring", label: "Is colour transferring onto another area?" },
  { key: "dyeBleeding", label: "Is there visible dye bleeding?" },
  { key: "reverseDifferent", label: "Is the reverse side a different colour?" },
  { key: "contrastTrims", label: "Are there contrasting trims or panels?" },
] as const;

export const CONSTRUCTION_OPTIONS = [
  "No visible decoration", "Surface print", "Embroidery", "Beads", "Sequins",
  "Rhinestones or stones", "Metallic thread", "Foil print", "Flocking", "Lace",
  "Pleats", "Padding", "Shoulder pads", "Fusible interlining", "Glued decoration",
  "Laminated layers", "Coating", "Waterproof membrane", "Lining", "Leather trim",
  "Suede trim", "Fur trim", "Elastic section", "Unknown construction",
];

export const DAMAGE_OPTIONS = [
  "Colour loss", "Dye bleeding", "Fibre thinning", "Holes", "Surface peeling",
  "Cracking", "Delamination", "Sticky coating", "Texture change", "Shrinkage",
  "Distortion", "Watermark or ring", "Heat shine", "Scorching", "Melted fibres",
  "Loose decoration", "Damaged metallic thread", "Previous chemical mark",
  "No visible damage", "Not sure",
];

export const IMPORTANCE_OPTIONS = [
  "Regular garment", "Expensive", "Designer", "Bridal or ceremonial",
  "Uniform required for work", "Sentimental", "Irreplaceable",
  "Customer requested special care", "Not sure",
];

export const PROFESSIONAL_TESTS = [
  { key: "white_cloth_transfer", label: "White-cloth colour-transfer test", roles: TEST_ALLOWED_ROLES },
  { key: "water_sensitivity", label: "Water-sensitivity test", roles: ["dry_cleaner", "professional_spotter", "trainer"] as UserRoleKey[] },
  { key: "hidden_seam", label: "Hidden-seam compatibility test", roles: ["dry_cleaner", "professional_spotter", "trainer"] as UserRoleKey[] },
  { key: "texture_inspection", label: "Texture and surface inspection", roles: TEST_ALLOWED_ROLES },
  { key: "construction_inspection", label: "Construction and adhesive inspection", roles: TEST_ALLOWED_ROLES },
];

export const PRODUCT_INSTRUCTION_FALLBACK =
  "Follow the current product label or technical data sheet.";

/* ------------------------------------------------------------------ */
/* Answers                                                             */
/* ------------------------------------------------------------------ */

export type LabelExtraction = {
  fibres: string;
  washing: string;
  bleaching: string;
  drying: string;
  ironing: string;
  professionalCare: string;
  warnings: string;
  language: string;
  confidence: number; // 0-100
  unresolved: string[];
};

export type FabricAnswers = {
  role: UserRoleKey;
  route: LabelRoute;
  photos: Record<string, string>; // kind -> data URL
  extracted: LabelExtraction | null;
  labelConfirmation: "correct" | "edited" | "cannot_confirm" | null;
  garmentType: string;
  garmentTypeOther: string;
  cleaningHistory: string[];
  historyFollowups: Record<string, boolean>;
  appearance: string[];
  colours: string[];
  colourFlags: Record<string, boolean>;
  construction: string[];
  stainTouchesFeature: boolean | null;
  damage: string[];
  importance: string[];
};

export const emptyAnswers = (role: UserRoleKey = "domestic_user"): FabricAnswers => ({
  role,
  route: "no_label",
  photos: {},
  extracted: null,
  labelConfirmation: null,
  garmentType: "",
  garmentTypeOther: "",
  cleaningHistory: [],
  historyFollowups: {},
  appearance: [],
  colours: [],
  colourFlags: {},
  construction: [],
  stainTouchesFeature: null,
  damage: [],
  importance: [],
});

/* ------------------------------------------------------------------ */
/* Rules engine                                                        */
/* ------------------------------------------------------------------ */

export type RiskLevel = "green" | "amber" | "red" | "black";
export type RiskGroup = "group_a" | "group_b" | "group_c" | "group_d";
export type Confidence = "high" | "moderate" | "low" | "unknown";
export type GateStatus =
  | "proceed"
  | "proceed_with_testing"
  | "professional_only"
  | "blocked_pending_identification"
  | "blocked_existing_damage"
  | "specialist_material_route";

export type RiskFactor = { key: string; label: string; weight: number };
export type Override = { key: string; label: string; level: "red" | "black" };

export type FabricResult = {
  score: number;
  factors: RiskFactor[];
  overrides: Override[];
  riskLevel: RiskLevel;
  riskGroup: RiskGroup;
  riskReason: string;
  confidence: Confidence;
  confidenceReason: string;
  suspectedMaterialFamily: string | null;
  damageRisks: string[];
  gate: GateStatus;
  nextAction: string;
  rulesVersion: string;
};

const SPECIALIST_APPEARANCE = ["Leather-like", "Suede-like", "Fur-like", "Coated", "Rubberized", "Waterproof"];
const SPECIALIST_CONSTRUCTION = ["Laminated layers", "Coating", "Waterproof membrane", "Leather trim", "Suede trim", "Fur trim"];
const DELICATE_APPEARANCE = ["Shiny", "Soft and flowing", "Very thin or transparent", "Fuzzy or wool-like", "Satin-like surface", "Velvet-like pile"];
const EMBELLISHMENT = ["Embroidery", "Beads", "Sequins", "Rhinestones or stones", "Foil print", "Flocking", "Lace"];
const BLACK_DAMAGE = ["Dye bleeding", "Fibre thinning", "Holes", "Surface peeling", "Cracking", "Delamination", "Sticky coating", "Melted fibres", "Scorching"];
const RED_DAMAGE = ["Colour loss", "Texture change", "Shrinkage", "Distortion", "Watermark or ring", "Heat shine", "Loose decoration", "Damaged metallic thread", "Previous chemical mark"];
const HIGH_VALUE = ["Expensive", "Designer", "Bridal or ceremonial", "Sentimental", "Irreplaceable", "Customer requested special care"];

const RISK_WORD: Record<RiskLevel, string> = {
  green: "Lower risk",
  amber: "Test first",
  red: "Professional handling recommended",
  black: "Do not treat yet",
};

export function riskWord(level: RiskLevel) {
  return RISK_WORD[level];
}

export const RULES_VERSION = "v1";

export function evaluateFabricSafety(a: FabricAnswers): FabricResult {
  const factors: RiskFactor[] = [];
  const overrides: Override[] = [];
  const add = (key: string, label: string, weight: number) => factors.push({ key, label, weight });
  const has = (arr: string[], v: string) => arr.includes(v);
  const anyOf = (arr: string[], list: string[]) => list.some((v) => arr.includes(v));

  const labelConfirmed =
    a.route === "label" && a.labelConfirmation === "correct" && !!a.extracted?.fibres?.trim();
  const labelPartial =
    a.route === "label" && (a.labelConfirmation === "edited" || (!!a.extracted?.fibres?.trim() && a.labelConfirmation !== "cannot_confirm"));
  const lowExtraction = (a.extracted?.confidence ?? 0) < 60;

  /* --- score factors --- */
  if (a.route === "no_label") add("no_label", "No care label", 2);
  if (a.route === "unclear" || a.labelConfirmation === "cannot_confirm" || (a.route === "label" && lowExtraction))
    add("label_unclear", "Label unclear or conflicting", 2);
  if (has(a.appearance, "Unknown") || a.garmentType === "Not sure")
    add("unknown_material", "Material unknown", 2);
  if (anyOf(a.colours, ["Dark coloured", "Bright coloured", "Multicoloured"]))
    add("dark_bright_multi", "Dark, bright or multicoloured dye", 2);
  if (a.colourFlags.crossesColours) add("stain_crosses_colours", "Stain crosses two or more colours", 2);
  if (a.colourFlags.transferring) add("active_colour_transfer", "Active colour transfer reported", 3);
  if (anyOf(a.colours, ["Printed", "Patterned", "Garment-dyed or uneven colour"]) || has(a.construction, "Surface print"))
    add("print_surface_design", "Print or surface design", 1);
  if (anyOf(a.appearance, DELICATE_APPEARANCE)) add("delicate_appearance", "Delicate appearance", 3);
  if (has(a.appearance, "Stretchy") || has(a.construction, "Elastic section"))
    add("stretch_content", "Stretch content", 1);
  if (has(a.appearance, "Velvet-like pile") || has(a.construction, "Fur trim"))
    add("pile_surface", "Pile surface", 2);
  if (anyOf(a.construction, ["Padding", "Shoulder pads", "Fusible interlining", "Unknown construction"]) ||
      ["Suit or blazer", "Sherwani", "Lehenga", "Bridal or ceremonial wear"].includes(a.garmentType))
    add("structured_garment", "Structured garment or unknown interlining", 2);
  if (anyOf(a.cleaningHistory, ["Never cleaned", "Not known"]) || a.cleaningHistory.length === 0)
    add("no_cleaning_history", "No history of successful cleaning", 1);
  if (has(a.damage, "Previous chemical mark"))
    add("unknown_previous_chemical", "Unknown previous chemical treatment", 2);
  if (anyOf(a.importance, HIGH_VALUE)) add("high_value", "High garment value", 3);
  if (anyOf(a.construction, EMBELLISHMENT)) add("embellishment", "Embellishment present", 3);
  if (has(a.construction, "Metallic thread") || has(a.colours, "Metallic"))
    add("metallic_thread", "Metallic thread", 3);
  if (has(a.construction, "Glued decoration")) add("glued_decoration", "Glued decoration", 3);
  if (a.stainTouchesFeature) add("stain_on_feature", "Stain touches decoration, coating or adhesive", 3);
  if (a.historyFollowups.colourBleed) add("history_colour_bleed", "Colour bled during previous cleaning", 2);
  if (a.historyFollowups.shrinkage) add("history_shrinkage", "Shrank during previous cleaning", 2);
  const fibreText = (a.extracted?.fibres ?? "").toLowerCase();
  if (/viscose|rayon|silk|wool|acetate|modal|cupro|linen|lyocell|acrylic|mohair|cashmere|angora/.test(fibreText))
    add("sensitive_fibre_declared", "Care label declares a moisture- or solvent-sensitive fibre", 3);

  const score = factors.reduce((s, f) => s + f.weight, 0);

  /* --- mandatory overrides (may only raise risk) --- */
  const specialistMaterial =
    anyOf(a.appearance, SPECIALIST_APPEARANCE) || anyOf(a.construction, SPECIALIST_CONSTRUCTION);
  const activeBleeding = a.colourFlags.dyeBleeding || has(a.damage, "Dye bleeding");
  const blackDamage = a.damage.filter((d) => BLACK_DAMAGE.includes(d));
  const redDamage = a.damage.filter((d) => RED_DAMAGE.includes(d));

  if (activeBleeding) overrides.push({ key: "active_dye_bleeding", label: "Active dye bleeding", level: "black" });
  if (has(a.damage, "Fibre thinning") || has(a.damage, "Holes"))
    overrides.push({ key: "fibre_disintegration", label: "Existing fibre disintegration", level: "black" });
  if (has(a.damage, "Melted fibres") || has(a.damage, "Scorching"))
    overrides.push({ key: "melted_scorched", label: "Melted or scorched surface", level: "black" });
  if (has(a.damage, "Surface peeling") || has(a.damage, "Cracking") || has(a.damage, "Sticky coating"))
    overrides.push({ key: "coating_peeling", label: "Peeling or failing coating", level: "black" });
  if (has(a.damage, "Delamination"))
    overrides.push({ key: "delamination", label: "Delamination", level: "black" });
  if (specialistMaterial && !labelConfirmed)
    overrides.push({ key: "leather_suede_fur", label: "Leather-, suede-, fur-like, coated or laminated material", level: "black" });
  else if (specialistMaterial)
    overrides.push({ key: "specialist_material", label: "Specialist material (coated, laminated or skin-based)", level: "black" });

  const silkOrWoolLike = anyOf(a.appearance, ["Shiny", "Satin-like surface", "Soft and flowing", "Fuzzy or wool-like"]);
  if (silkOrWoolLike && a.route !== "label")
    overrides.push({ key: "silk_wool_no_label", label: "Silk-like or wool-like with no label", level: "red" });
  if (anyOf(a.importance, ["Bridal or ceremonial", "Designer", "Irreplaceable"]))
    overrides.push({ key: "high_value_garment", label: "Bridal, designer or irreplaceable garment", level: "red" });
  if (anyOf(a.construction, EMBELLISHMENT))
    overrides.push({ key: "heavy_embellishment", label: "Embellishment present", level: "red" });
  if (has(a.construction, "Metallic thread"))
    overrides.push({ key: "metallic_thread_override", label: "Metallic thread", level: "red" });
  if (has(a.construction, "Glued decoration"))
    overrides.push({ key: "glued_decoration_override", label: "Glued decoration", level: "red" });
  if (has(a.colours, "Multicoloured") && a.construction.filter((c) => c !== "No visible decoration").length > 0)
    overrides.push({ key: "complex_multicolour", label: "Complex multicoloured construction", level: "red" });
  if (anyOf(a.construction, ["Fusible interlining", "Unknown construction"]) && a.route !== "label")
    overrides.push({ key: "unknown_interlining", label: "Structured garment with unknown interlining", level: "red" });
  if (a.stainTouchesFeature)
    overrides.push({ key: "stain_on_feature_override", label: "Stain directly on decoration, coating or adhesive", level: "red" });
  if (redDamage.length)
    overrides.push({ key: "existing_damage", label: `Existing damage: ${redDamage.join(", ")}`, level: "red" });

  /* --- risk level --- */
  let riskLevel: RiskLevel = score >= 8 ? "red" : score >= 3 ? "amber" : "green";
  if (overrides.some((o) => o.level === "red")) riskLevel = "red";
  if (overrides.some((o) => o.level === "black")) riskLevel = "black";

  const riskGroup: RiskGroup =
    riskLevel === "black" ? "group_d" : riskLevel === "red" ? "group_c" : riskLevel === "amber" ? "group_b" : "group_a";

  /* --- confidence (independent of risk) --- */
  let confidence: Confidence;
  let confidenceReason: string;
  if (labelConfirmed) {
    confidence = "high";
    confidenceReason = "A readable care label was confirmed by you, so the fibre information is documented.";
  } else if (labelPartial || (a.route !== "label" && a.cleaningHistory.some((h) => !["Never cleaned", "Not known", "Spot-cleaned only"].includes(h)) && a.appearance.length > 0 && !has(a.appearance, "Unknown"))) {
    confidence = "moderate";
    confidenceReason = "Partial label information or strong supporting history was available, but the exact fibre is not confirmed.";
  } else if (a.appearance.length > 0 && !has(a.appearance, "Unknown")) {
    confidence = "low";
    confidenceReason = "Only appearance and handling description were available. Appearance cannot confirm a fibre.";
  } else {
    confidence = "unknown";
    confidenceReason = "Not enough information, or the information given conflicts. The fibre cannot be estimated.";
  }

  const suspectedMaterialFamily = labelConfirmed
    ? null
    : has(a.appearance, "Fuzzy or wool-like")
      ? "Possibly an animal-hair family fabric — not confirmed"
      : silkOrWoolLike
        ? "Possibly a delicate filament or protein-family fabric — not confirmed"
        : has(a.appearance, "Plain and sturdy")
          ? "Possibly a sturdy cellulosic or blended fabric — not confirmed"
          : null;

  /* --- damage risks --- */
  const damageRisks = new Set<string>();
  if (anyOf(a.colours, ["Dark coloured", "Bright coloured", "Multicoloured", "Printed", "Patterned", "Garment-dyed or uneven colour"]) || a.colourFlags.crossesColours)
    damageRisks.add("Colour bleeding");
  if (a.colourFlags.faded || has(a.damage, "Colour loss")) damageRisks.add("Dye loss");
  if (has(a.appearance, "Fuzzy or wool-like") || has(a.appearance, "Knitted") || a.historyFollowups.shrinkage)
    damageRisks.add("Shrinkage");
  if (has(a.appearance, "Stretchy") || has(a.construction, "Pleats") || has(a.construction, "Elastic section"))
    damageRisks.add("Distortion");
  if (has(a.damage, "Fibre thinning") || has(a.damage, "Holes")) damageRisks.add("Fibre weakening");
  if (anyOf(a.appearance, ["Shiny", "Satin-like surface", "Velvet-like pile"])) damageRisks.add("Texture change");
  if (a.route !== "label" || has(a.appearance, "Smooth")) damageRisks.add("Ring formation");
  if (has(a.appearance, "Velvet-like pile") || has(a.construction, "Fur trim") || has(a.appearance, "Fur-like"))
    damageRisks.add("Pile damage");
  if (has(a.appearance, "Coated") || has(a.construction, "Coating") || has(a.appearance, "Rubberized"))
    damageRisks.add("Coating damage");
  if (has(a.construction, "Laminated layers") || has(a.construction, "Waterproof membrane") || has(a.damage, "Delamination"))
    damageRisks.add("Delamination");
  if (has(a.construction, "Glued decoration") || has(a.construction, "Fusible interlining"))
    damageRisks.add("Adhesive failure");
  if (anyOf(a.construction, EMBELLISHMENT)) damageRisks.add("Decoration damage");
  if (has(a.construction, "Metallic thread") || has(a.colours, "Metallic")) damageRisks.add("Metallic-thread damage");
  if (has(a.damage, "Heat shine") || has(a.damage, "Scorching") || has(a.damage, "Melted fibres"))
    damageRisks.add("Heat damage");

  /* --- treatment gate --- */
  let gate: GateStatus;
  if (activeBleeding) gate = "blocked_existing_damage";
  else if (blackDamage.length) gate = "blocked_existing_damage";
  else if (specialistMaterial) gate = "specialist_material_route";
  else if (riskLevel === "black") gate = "blocked_pending_identification";
  else if (riskLevel === "red") gate = "professional_only";
  else if (riskLevel === "amber") gate = "proceed_with_testing";
  else gate = "proceed";

  const nextAction =
    gate === "proceed"
      ? "Continue to Stain Identification"
      : gate === "proceed_with_testing"
        ? "Professional Compatibility Test Required"
        : gate === "professional_only"
          ? "Experienced Professional Assessment Required"
          : "Do Not Apply Chemicals Yet";

  const topFactors = [...factors].sort((x, y) => y.weight - x.weight).slice(0, 3).map((f) => f.label);
  const riskReason =
    overrides.length > 0
      ? `${overrides[0].label}. This is a mandatory safety rule and cannot be lowered by the score.`
      : topFactors.length
        ? `Based on: ${topFactors.join(", ")}.`
        : "No risk-increasing condition was reported.";

  return {
    score,
    factors,
    overrides,
    riskLevel,
    riskGroup,
    riskReason,
    confidence,
    confidenceReason,
    suspectedMaterialFamily,
    damageRisks: [...damageRisks],
    gate,
    nextAction,
    rulesVersion: RULES_VERSION,
  };
}

export const GATE_LABEL: Record<GateStatus, string> = {
  proceed: "Proceed",
  proceed_with_testing: "Proceed with testing",
  professional_only: "Professional only",
  blocked_pending_identification: "Blocked — pending identification",
  blocked_existing_damage: "Blocked — existing damage",
  specialist_material_route: "Specialist material route",
};

export const BLACK_SAFETY_MESSAGE =
  "The garment cannot be assessed within a safe treatment boundary. Do not apply stain-removal chemicals or heat yet.";

/* ------------------------------------------------------------------ */
/* Seed test scenarios                                                 */
/* ------------------------------------------------------------------ */

export type Scenario = { name: string; answers: FabricAnswers; expect: { risk: RiskLevel; gate: GateStatus; confidence: Confidence } };

const base = (p: Partial<FabricAnswers>): FabricAnswers => ({ ...emptyAnswers(), ...p });

export const SEED_SCENARIOS: Scenario[] = [
  {
    name: "Labelled white cotton shirt, no decoration",
    answers: base({
      route: "label", labelConfirmation: "correct",
      extracted: { fibres: "100% cotton", washing: "Machine wash 40", bleaching: "Do not bleach", drying: "Tumble dry low", ironing: "Medium", professionalCare: "", warnings: "", language: "English", confidence: 92, unresolved: [] },
      garmentType: "Shirt or top", cleaningHistory: ["Machine washed"], historyFollowups: { satisfactory: true },
      appearance: ["Plain and sturdy"], colours: ["White"], construction: ["No visible decoration"],
      damage: ["No visible damage"], importance: ["Regular garment"], stainTouchesFeature: false,
    }),
    expect: { risk: "green", gate: "proceed", confidence: "high" },
  },
  {
    name: "Labelled polyester-viscose blend",
    answers: base({
      route: "label", labelConfirmation: "correct",
      extracted: { fibres: "65% polyester, 35% viscose", washing: "Gentle wash", bleaching: "Do not bleach", drying: "Line dry", ironing: "Low", professionalCare: "Dry clean permitted", warnings: "", language: "English", confidence: 88, unresolved: [] },
      garmentType: "Dress or gown", cleaningHistory: ["Professionally dry-cleaned"], historyFollowups: { satisfactory: true },
      appearance: ["Smooth"], colours: ["Light coloured"], construction: ["Lining"],
      damage: ["No visible damage"], importance: ["Regular garment"], stainTouchesFeature: false,
    }),
    expect: { risk: "amber", gate: "proceed_with_testing", confidence: "high" },
  },
  {
    name: "Unlabelled dark kurta",
    answers: base({
      route: "no_label", garmentType: "Kurta or kurti", cleaningHistory: ["Hand washed"],
      appearance: ["Plain and sturdy"], colours: ["Dark coloured"], construction: ["No visible decoration"],
      damage: ["No visible damage"], importance: ["Regular garment"], stainTouchesFeature: false,
    }),
    expect: { risk: "amber", gate: "proceed_with_testing", confidence: "moderate" },
  },
  {
    name: "Multicoloured printed saree",
    answers: base({
      route: "no_label", garmentType: "Saree", cleaningHistory: ["Not known"],
      appearance: ["Soft and flowing", "Shiny"], colours: ["Multicoloured", "Printed"],
      colourFlags: { crossesColours: true }, construction: ["Surface print"],
      damage: ["No visible damage"], importance: ["Expensive"], stainTouchesFeature: false,
    }),
    expect: { risk: "red", gate: "professional_only", confidence: "low" },
  },
  {
    name: "Bridal lehenga with beads and glued stones",
    answers: base({
      route: "no_label", garmentType: "Lehenga", cleaningHistory: ["Never cleaned"],
      appearance: ["Shiny", "Crisp or stiff"], colours: ["Bright coloured", "Metallic"],
      construction: ["Beads", "Rhinestones or stones", "Glued decoration", "Metallic thread", "Fusible interlining"],
      damage: ["No visible damage"], importance: ["Bridal or ceremonial", "Irreplaceable"], stainTouchesFeature: true,
    }),
    expect: { risk: "red", gate: "professional_only", confidence: "low" },
  },
  {
    name: "Wool-like blazer without a label",
    answers: base({
      route: "no_label", garmentType: "Suit or blazer", cleaningHistory: ["Professionally dry-cleaned"],
      appearance: ["Fuzzy or wool-like"], colours: ["Dark coloured"],
      construction: ["Shoulder pads", "Fusible interlining", "Lining"],
      damage: ["No visible damage"], importance: ["Expensive"], stainTouchesFeature: false,
    }),
    expect: { risk: "red", gate: "professional_only", confidence: "moderate" },
  },
  {
    name: "Stretch sportswear",
    answers: base({
      route: "label", labelConfirmation: "correct",
      extracted: { fibres: "88% polyester, 12% elastane", washing: "Cold wash", bleaching: "Do not bleach", drying: "Line dry", ironing: "Do not iron", professionalCare: "Do not dry clean", warnings: "", language: "English", confidence: 90, unresolved: [] },
      garmentType: "Sportswear", cleaningHistory: ["Machine washed"], historyFollowups: { satisfactory: true },
      appearance: ["Stretchy", "Knitted"], colours: ["Bright coloured"], construction: ["Elastic section"],
      damage: ["No visible damage"], importance: ["Regular garment"], stainTouchesFeature: false,
    }),
    expect: { risk: "amber", gate: "proceed_with_testing", confidence: "high" },
  },
  {
    name: "Waterproof jacket",
    answers: base({
      route: "label", labelConfirmation: "correct",
      extracted: { fibres: "100% polyamide with polyurethane coating", washing: "Special wash", bleaching: "Do not bleach", drying: "Line dry", ironing: "Do not iron", professionalCare: "Specialist clean", warnings: "", language: "English", confidence: 85, unresolved: [] },
      garmentType: "Jacket or coat", cleaningHistory: ["Professionally wet-cleaned"],
      appearance: ["Waterproof", "Coated"], colours: ["Dark coloured"], construction: ["Waterproof membrane", "Laminated layers"],
      damage: ["No visible damage"], importance: ["Regular garment"], stainTouchesFeature: false,
    }),
    expect: { risk: "black", gate: "specialist_material_route", confidence: "high" },
  },
  {
    name: "Leather jacket",
    answers: base({
      route: "no_label", garmentType: "Jacket or coat", cleaningHistory: ["Not known"],
      appearance: ["Leather-like"], colours: ["Dark coloured"], construction: ["Lining"],
      damage: ["No visible damage"], importance: ["Expensive"], stainTouchesFeature: false,
    }),
    expect: { risk: "black", gate: "specialist_material_route", confidence: "low" },
  },
  {
    name: "Suede footwear",
    answers: base({
      route: "no_label", garmentType: "Other", garmentTypeOther: "Suede shoes", cleaningHistory: ["Spot-cleaned only"],
      appearance: ["Suede-like"], colours: ["Light coloured"], construction: ["Glued decoration"],
      damage: ["No visible damage"], importance: ["Regular garment"], stainTouchesFeature: false,
    }),
    expect: { risk: "black", gate: "specialist_material_route", confidence: "low" },
  },
  {
    name: "Garment with active colour bleeding",
    answers: base({
      route: "no_label", garmentType: "T-shirt", cleaningHistory: ["Machine washed"],
      appearance: ["Plain and sturdy"], colours: ["Bright coloured"], colourFlags: { dyeBleeding: true, transferring: true },
      construction: ["No visible decoration"], damage: ["Dye bleeding"], importance: ["Regular garment"], stainTouchesFeature: false,
    }),
    expect: { risk: "black", gate: "blocked_existing_damage", confidence: "moderate" },
  },
  {
    name: "Garment with bleach-related colour loss",
    answers: base({
      route: "no_label", garmentType: "Trousers", cleaningHistory: ["Machine washed"],
      appearance: ["Plain and sturdy"], colours: ["Dark coloured"], construction: ["No visible decoration"],
      damage: ["Colour loss", "Previous chemical mark"], importance: ["Regular garment"], stainTouchesFeature: false,
    }),
    expect: { risk: "red", gate: "professional_only", confidence: "moderate" },
  },
  {
    name: "Coated fabric with peeling",
    answers: base({
      route: "no_label", garmentType: "Jacket or coat", cleaningHistory: ["Not known"],
      appearance: ["Coated"], colours: ["Dark coloured"], construction: ["Coating"],
      damage: ["Surface peeling", "Cracking"], importance: ["Regular garment"], stainTouchesFeature: false,
    }),
    expect: { risk: "black", gate: "blocked_existing_damage", confidence: "low" },
  },
  {
    name: "Previously washed plain uniform",
    answers: base({
      route: "label", labelConfirmation: "correct",
      extracted: { fibres: "65% polyester, 35% cotton", washing: "Machine wash 40", bleaching: "Do not bleach", drying: "Tumble dry low", ironing: "Medium", professionalCare: "", warnings: "", language: "English", confidence: 90, unresolved: [] },
      garmentType: "School or work uniform", cleaningHistory: ["Machine washed"], historyFollowups: { satisfactory: true },
      appearance: ["Plain and sturdy"], colours: ["Light coloured"], construction: ["No visible decoration"],
      damage: ["No visible damage"], importance: ["Uniform required for work"], stainTouchesFeature: false,
    }),
    expect: { risk: "green", gate: "proceed", confidence: "high" },
  },
  {
    name: "Unknown high-value garment",
    answers: base({
      route: "unclear", garmentType: "Not sure", cleaningHistory: ["Not known"],
      appearance: ["Unknown"], colours: ["Not sure"], construction: ["Unknown construction"],
      damage: ["Not sure"], importance: ["Irreplaceable", "Expensive"], stainTouchesFeature: null,
    }),
    expect: { risk: "red", gate: "professional_only", confidence: "unknown" },
  },
];

export function runSeedScenarios() {
  return SEED_SCENARIOS.map((s) => {
    const r = evaluateFabricSafety(s.answers);
    return {
      name: s.name,
      expect: s.expect,
      actual: { risk: r.riskLevel, gate: r.gate, confidence: r.confidence },
      pass:
        r.riskLevel === s.expect.risk &&
        r.gate === s.expect.gate &&
        r.confidence === s.expect.confidence,
      result: r,
    };
  });
}
