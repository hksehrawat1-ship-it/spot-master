/**
 * Step 5 — Universal Stain Classification taxonomy.
 * Company-independent. CLASSIFICATION ONLY: no products, chemistry procedures,
 * quantities, contact times, temperatures, rinsing or neutralization.
 *
 * Four separate layers:
 *   Layer A — Primary category (exactly one per published stain)
 *   Layer B — Secondary components (zero or more)
 *   Layer C — Source type (everyday origin)
 *   Layer D — Condition and risk tags
 */

import type { IdCategoryKey } from "@/data/stainKnowledge";
import type { RiskLevel } from "@/lib/fabricSafety";

export const TAXONOMY_VERSION = "taxonomy-v1";

/* ------------------------------------------------------------------ */
/* Layer A — the 12 permanent primary categories                       */
/* ------------------------------------------------------------------ */

/** Reuses the Step 3 category keys — one category system, not two. */
export type PrimaryCategoryKey = IdCategoryKey;

export type PrimaryCategory = {
  key: PrimaryCategoryKey;
  name: string;
  icon: string;
  oneLine: string;
  plain: string;
  examples: string[];
  limitation: string;
  heatWarning?: string;
  technicalOnly?: boolean;
};

export const PRIMARY_CATEGORIES: PrimaryCategory[] = [
  {
    key: "water_soluble",
    name: "Water-Soluble",
    icon: "💧",
    oneLine: "Components that can initially dissolve or disperse in water.",
    plain:
      "Stains whose important components can initially dissolve or disperse in water.",
    examples: ["Sugar syrup", "Clear soft drinks", "Water-soluble salts", "Washable beverage residues"],
    limitation:
      "A stain containing water is not automatically water-soluble. Milk, coffee, juice, sauces and perspiration may belong to protein, tannin or combination categories.",
  },
  {
    key: "oil_grease",
    name: "Oil and Grease-Based",
    icon: "🛢️",
    oneLine: "Dominated by fats, oils, waxes or greasy material.",
    plain: "Stains dominated by fats, oils, waxes or hydrocarbon-like greasy material.",
    examples: ["Cooking oil", "Ghee", "Butter", "Machine oil", "Sebum"],
    limitation:
      "Pigmented cosmetics, sauces and shoe polish may be combination stains rather than simple oil stains.",
  },
  {
    key: "protein",
    name: "Protein-Based",
    icon: "🥚",
    oneLine: "Contains protein material that binds strongly, especially after heat.",
    plain:
      "Stains containing proteins or albuminous material that may bind strongly and become more difficult after heat.",
    examples: ["Blood", "Egg", "Milk", "Cream", "Meat juices"],
    limitation:
      "Protein stains may also contain fat, pigment, tannin, starch or biological hazards.",
    heatWarning: "Heat can set protein material and make the mark far harder to improve.",
  },
  {
    key: "tannin_plant",
    name: "Tannin and Plant-Based",
    icon: "🍷",
    oneLine: "Plant-derived colour compounds and tannins.",
    plain:
      "Stains dominated by plant-derived colour compounds, tannins or related natural extracts.",
    examples: ["Tea", "Coffee", "Wine", "Fruit", "Grass", "Tobacco"],
    limitation:
      "Coffee with milk, oily curry and sweetened beverages may require a combination classification.",
    heatWarning: "Heat and ageing can deepen plant colour.",
  },
  {
    key: "pigment_particulate",
    name: "Pigment and Particulate",
    icon: "🧱",
    oneLine: "Solid particles or insoluble pigments held in the fibres.",
    plain: "Solid particles or insoluble pigments deposited on or inside the textile.",
    examples: ["Mud", "Clay", "Dust", "Soot", "Charcoal", "Cosmetic powder"],
    limitation:
      "Paint, printing ink and dyed cosmetics may contain polymers, oils or dyes and may require another primary category.",
  },
  {
    key: "dye_ink",
    name: "Dye and Ink-Based",
    icon: "🖊️",
    oneLine: "Dyes, inks or transferred textile colour.",
    plain:
      "Stains dominated by natural or synthetic dyes, inks or transferred textile colour.",
    examples: ["Fountain-pen ink", "Marker", "Food colouring", "Hair dye", "Dye transfer"],
    limitation:
      "Ballpoint ink may also contain solvent, resin and oil components. Dye transfer is a sub-type and tag inside this category, not a category of its own.",
  },
  {
    key: "paint_polymer",
    name: "Paint, Resin, Adhesive and Polymer",
    icon: "🎨",
    oneLine: "Forms a film, hardens, cures or sticks.",
    plain:
      "Stains that form a film, harden, cure or adhere through paint binders, resins, glues or polymers.",
    examples: ["Latex paint", "Acrylic paint", "Varnish", "Adhesive", "Nail polish", "Chewing gum"],
    limitation:
      "Different products cure differently. Exact treatment cannot be selected from the general category alone.",
  },
  {
    key: "oxidizable",
    name: "Oxidizable",
    icon: "✨",
    oneLine: "Residual colour that may respond to verified oxidation later.",
    plain:
      "Residual coloured compounds that may respond to verified oxidation after earlier compatible treatment stages have been completed.",
    examples: ["Remaining beverage colour", "Some plant colours", "Selected residual yellowing"],
    limitation:
      "Oxidizable is a treatment-relevant classification, not permission to apply bleach. Fabric, dye, finish and product compatibility must be verified first.",
    technicalOnly: true,
  },
  {
    key: "reducible",
    name: "Reducible",
    icon: "⚗️",
    oneLine: "Selected colour bodies for controlled professional reducing chemistry.",
    plain:
      "Selected colour bodies that may respond to verified reducing chemistry under controlled professional conditions.",
    examples: ["Specific residual dyes", "Certain transferred colours", "Technically identified residues"],
    limitation:
      "Rust is not automatically reducible. Reducing chemistry is never exposed to domestic users.",
    technicalOnly: true,
  },
  {
    key: "metal_rust",
    name: "Metal, Rust and Mineral",
    icon: "🔩",
    oneLine: "Metallic oxides, corrosion products or mineral residues.",
    plain:
      "Deposits or discoloration involving metallic oxides, corrosion products or mineral residues.",
    examples: ["Iron rust", "Verdigris", "Metal abrasion", "Hard-water deposits", "Scale"],
    limitation:
      "Rust chemistry may damage dyes, fibres, metallic threads, trims or finishes. Classification does not authorize treatment.",
  },
  {
    key: "biological",
    name: "Biological",
    icon: "🦠",
    oneLine: "Mould, mildew, microorganisms or biologically hazardous material.",
    plain:
      "Contamination involving mould, mildew, microorganisms or biologically hazardous material.",
    examples: ["Mould", "Mildew", "Algae", "Sewage contamination", "Microbial growth"],
    limitation:
      "Biological classification includes hygiene and exposure considerations beyond visual stain removal.",
  },
  {
    key: "combination_unknown",
    name: "Combination or Unknown",
    icon: "🧪",
    oneLine: "Several important components, or not identified confidently.",
    plain:
      "Stains containing several important components, or stains that cannot be identified confidently.",
    examples: ["Curry", "Gravy", "Lipstick", "Shoe polish", "Chocolate", "Unknown yellow mark"],
    limitation:
      "Unknown stains must not receive speculative chemistry or universal treatment instructions.",
  },
];

export const CATEGORY_BY_KEY: Record<PrimaryCategoryKey, PrimaryCategory> =
  Object.fromEntries(PRIMARY_CATEGORIES.map((c) => [c.key, c])) as Record<
    PrimaryCategoryKey,
    PrimaryCategory
  >;

/** Names that must never become primary chemistry categories. */
export const FORBIDDEN_PRIMARY_CATEGORY_NAMES = [
  "fresh stains", "aged stains", "heat-set stains", "cosmetic stains", "food stains",
  "drink stains", "dye transfer", "colour bleeding", "color bleeding", "domestic-safe stains",
  "professional-only stains", "white-garment stains", "chemical damage", "fabric damage",
];

/* ------------------------------------------------------------------ */
/* Layer B — secondary components                                      */
/* ------------------------------------------------------------------ */

export type ComponentKey =
  | "water_soluble" | "sugar" | "salt" | "starch" | "oil" | "grease" | "wax" | "protein"
  | "tannin" | "natural_dye" | "synthetic_dye" | "ink" | "pigment" | "particulate"
  | "resin" | "adhesive" | "polymer" | "paint_binder" | "metallic_oxide" | "mineral"
  | "biological_material" | "fragrance" | "surfactant_residue" | "cosmetic_base"
  | "unknown_component";

export const COMPONENTS: { key: ComponentKey; label: string; technicalOnly?: boolean }[] = [
  { key: "water_soluble", label: "Water-soluble material" },
  { key: "sugar", label: "Sugar" },
  { key: "salt", label: "Salt" },
  { key: "starch", label: "Starch" },
  { key: "oil", label: "Oil" },
  { key: "grease", label: "Grease" },
  { key: "wax", label: "Wax" },
  { key: "protein", label: "Protein" },
  { key: "tannin", label: "Tannin" },
  { key: "natural_dye", label: "Natural dye" },
  { key: "synthetic_dye", label: "Synthetic dye" },
  { key: "ink", label: "Ink" },
  { key: "pigment", label: "Pigment" },
  { key: "particulate", label: "Particulate matter" },
  { key: "resin", label: "Resin", technicalOnly: true },
  { key: "adhesive", label: "Adhesive" },
  { key: "polymer", label: "Polymer", technicalOnly: true },
  { key: "paint_binder", label: "Paint binder", technicalOnly: true },
  { key: "metallic_oxide", label: "Metallic oxide", technicalOnly: true },
  { key: "mineral", label: "Mineral" },
  { key: "biological_material", label: "Biological material" },
  { key: "fragrance", label: "Fragrance" },
  { key: "surfactant_residue", label: "Surfactant residue", technicalOnly: true },
  { key: "cosmetic_base", label: "Cosmetic base" },
  { key: "unknown_component", label: "Unknown component" },
];

export const COMPONENT_LABEL: Record<ComponentKey, string> = Object.fromEntries(
  COMPONENTS.map((c) => [c.key, c.label]),
) as Record<ComponentKey, string>;

export type ComponentRelevance = "primary" | "major" | "minor" | "possible";

export const RELEVANCE_LABEL: Record<ComponentRelevance, string> = {
  primary: "Primary",
  major: "Major",
  minor: "Minor",
  possible: "Possible",
};

/* ------------------------------------------------------------------ */
/* Layer C — source types                                              */
/* ------------------------------------------------------------------ */

export type SourceTypeKey =
  | "food" | "beverage" | "cooking" | "body_fluid" | "perspiration" | "cosmetic"
  | "personal_care" | "medicine" | "ink_stationery" | "paint_construction" | "adhesive"
  | "machinery" | "soil_outdoor" | "plant" | "household_chemical" | "laundry_chemical"
  | "metal" | "water_mineral" | "mould_biological" | "smoke_fire" | "dye_transfer"
  | "unknown_source";

export const SOURCE_TYPES: { key: SourceTypeKey; label: string; icon: string }[] = [
  { key: "food", label: "Food", icon: "🍛" },
  { key: "beverage", label: "Beverage", icon: "🥤" },
  { key: "cooking", label: "Cooking", icon: "🍳" },
  { key: "body_fluid", label: "Body fluid", icon: "🫀" },
  { key: "perspiration", label: "Perspiration and body soil", icon: "💦" },
  { key: "cosmetic", label: "Cosmetic", icon: "💄" },
  { key: "personal_care", label: "Personal care", icon: "🧴" },
  { key: "medicine", label: "Medicine", icon: "💊" },
  { key: "ink_stationery", label: "Ink and stationery", icon: "🖊️" },
  { key: "paint_construction", label: "Paint and construction", icon: "🎨" },
  { key: "adhesive", label: "Adhesive", icon: "🩹" },
  { key: "machinery", label: "Machinery and automotive", icon: "⚙️" },
  { key: "soil_outdoor", label: "Soil and outdoor dirt", icon: "🪨" },
  { key: "plant", label: "Plant", icon: "🌿" },
  { key: "household_chemical", label: "Household chemical", icon: "🧽" },
  { key: "laundry_chemical", label: "Laundry chemical", icon: "🧺" },
  { key: "metal", label: "Metal", icon: "🔩" },
  { key: "water_mineral", label: "Water and mineral", icon: "🚰" },
  { key: "mould_biological", label: "Mould and biological", icon: "🦠" },
  { key: "smoke_fire", label: "Smoke and fire", icon: "🔥" },
  { key: "dye_transfer", label: "Textile dye transfer", icon: "🌈" },
  { key: "unknown_source", label: "Unknown source", icon: "❓" },
];

export const SOURCE_TYPE_LABEL: Record<SourceTypeKey, string> = Object.fromEntries(
  SOURCE_TYPES.map((s) => [s.key, s.label]),
) as Record<SourceTypeKey, string>;

/* ------------------------------------------------------------------ */
/* Layer D — condition and risk tags                                   */
/* ------------------------------------------------------------------ */

export type ConditionTagKey =
  | "fresh" | "wet" | "damp" | "dried" | "aged" | "heat_exposed" | "heat_set_possible"
  | "washed" | "dry_cleaned" | "previously_spotted" | "repeatedly_treated"
  | "oxidized_by_age" | "hardened" | "cured" | "polymerized" | "spread" | "ring_formed"
  | "penetrated_lining" | "crossed_multiple_colours" | "unknown_age";

export type RiskTagKey =
  | "domestic_candidate" | "domestic_not_recommended" | "professional_only" | "specialist_only"
  | "colourfastness_test_required" | "hidden_test_required" | "heat_warning"
  | "biological_precaution" | "chemical_hazard" | "unknown_chemical" | "delicate_fabric_risk"
  | "coating_risk" | "adhesive_risk" | "embellishment_risk" | "metallic_thread_risk"
  | "dye_bleeding" | "dye_loss_possible" | "fibre_damage_possible" | "finish_damage_possible"
  | "pigment_may_remain" | "professional_referral_required" | "treatment_blocked";

export const CONDITION_TAGS: { key: ConditionTagKey; label: string; raises?: RiskLevel }[] = [
  { key: "fresh", label: "Fresh" },
  { key: "wet", label: "Wet" },
  { key: "damp", label: "Damp" },
  { key: "dried", label: "Dried" },
  { key: "aged", label: "Aged", raises: "amber" },
  { key: "heat_exposed", label: "Heat exposed", raises: "amber" },
  { key: "heat_set_possible", label: "Heat-set possible", raises: "amber" },
  { key: "washed", label: "Washed" },
  { key: "dry_cleaned", label: "Dry cleaned" },
  { key: "previously_spotted", label: "Previously spotted", raises: "amber" },
  { key: "repeatedly_treated", label: "Repeatedly treated", raises: "amber" },
  { key: "oxidized_by_age", label: "Oxidized by age", raises: "amber" },
  { key: "hardened", label: "Hardened" },
  { key: "cured", label: "Cured", raises: "amber" },
  { key: "polymerized", label: "Polymerized", raises: "amber" },
  { key: "spread", label: "Spread", raises: "amber" },
  { key: "ring_formed", label: "Ring formed", raises: "amber" },
  { key: "penetrated_lining", label: "Penetrated lining", raises: "amber" },
  { key: "crossed_multiple_colours", label: "Crosses multiple colours", raises: "amber" },
  { key: "unknown_age", label: "Unknown age" },
];

export const RISK_TAGS: { key: RiskTagKey; label: string; raises?: RiskLevel; technicalOnly?: boolean }[] = [
  { key: "domestic_candidate", label: "Domestic candidate" },
  { key: "domestic_not_recommended", label: "Domestic treatment not recommended", raises: "amber" },
  { key: "professional_only", label: "Professional only", raises: "red" },
  { key: "specialist_only", label: "Specialist only", raises: "red" },
  { key: "colourfastness_test_required", label: "Colourfastness test required", raises: "amber" },
  { key: "hidden_test_required", label: "Hidden test required", raises: "amber" },
  { key: "heat_warning", label: "Heat warning", raises: "amber" },
  { key: "biological_precaution", label: "Biological precaution", raises: "amber" },
  { key: "chemical_hazard", label: "Chemical hazard", raises: "black" },
  { key: "unknown_chemical", label: "Unknown chemical", raises: "red" },
  { key: "delicate_fabric_risk", label: "Delicate fabric risk", raises: "amber" },
  { key: "coating_risk", label: "Coating risk", raises: "red" },
  { key: "adhesive_risk", label: "Adhesive risk", raises: "red" },
  { key: "embellishment_risk", label: "Embellishment risk", raises: "red" },
  { key: "metallic_thread_risk", label: "Metallic thread risk", raises: "red" },
  { key: "dye_bleeding", label: "Dye bleeding", raises: "red" },
  { key: "dye_loss_possible", label: "Dye loss possible", raises: "red" },
  { key: "fibre_damage_possible", label: "Fibre damage possible", raises: "red" },
  { key: "finish_damage_possible", label: "Finish damage possible", raises: "red" },
  { key: "pigment_may_remain", label: "Pigment may remain" },
  { key: "professional_referral_required", label: "Professional referral required", raises: "red" },
  { key: "treatment_blocked", label: "Treatment blocked", raises: "black" },
];

export const TAG_LABEL: Record<string, string> = {
  ...Object.fromEntries(CONDITION_TAGS.map((t) => [t.key, t.label])),
  ...Object.fromEntries(RISK_TAGS.map((t) => [t.key, t.label])),
};

export const TAG_RAISES: Record<string, RiskLevel | undefined> = {
  ...Object.fromEntries(CONDITION_TAGS.map((t) => [t.key, t.raises])),
  ...Object.fromEntries(RISK_TAGS.map((t) => [t.key, t.raises])),
};

/* ------------------------------------------------------------------ */
/* Damage diagnosis — deliberately NOT a stain category                */
/* ------------------------------------------------------------------ */

export type DamageKey =
  | "removable_stain_likely" | "dye_loss_possible" | "fibre_damage_possible"
  | "heat_damage_possible" | "chemical_damage_possible" | "finish_damage_possible"
  | "coating_damage_possible" | "adhesive_failure_possible"
  | "combination_stain_and_damage" | "insufficient_information";

export const DAMAGE_INTERPRETATIONS: {
  key: DamageKey; label: string; plain: string; isStain: boolean; professional: boolean;
}[] = [
  { key: "removable_stain_likely", label: "Removable stain likely", plain: "This looks like added material rather than damage to the fabric itself.", isStain: true, professional: false },
  { key: "dye_loss_possible", label: "Dye loss possible", plain: "Colour may have been removed from the fabric. That is damage, not a stain.", isStain: false, professional: true },
  { key: "fibre_damage_possible", label: "Fibre damage possible", plain: "The fibres themselves may be weakened or altered.", isStain: false, professional: true },
  { key: "heat_damage_possible", label: "Heat damage possible", plain: "Scorching, shine or melting suggests heat damage.", isStain: false, professional: true },
  { key: "chemical_damage_possible", label: "Chemical damage possible", plain: "A chemical may have altered the fabric or its colour.", isStain: false, professional: true },
  { key: "finish_damage_possible", label: "Finish damage possible", plain: "The surface finish of the fabric may be affected.", isStain: false, professional: true },
  { key: "coating_damage_possible", label: "Coating damage possible", plain: "A coating or lamination may be lifting or breaking down.", isStain: false, professional: true },
  { key: "adhesive_failure_possible", label: "Adhesive failure possible", plain: "Glued construction or decoration may be failing.", isStain: false, professional: true },
  { key: "combination_stain_and_damage", label: "Combination of stain and damage", plain: "Both added material and fabric damage appear to be present.", isStain: true, professional: true },
  { key: "insufficient_information", label: "Insufficient information", plain: "There is not enough information to say whether this is a stain or damage.", isStain: false, professional: true },
];

export const DAMAGE_LABEL: Record<DamageKey, string> = Object.fromEntries(
  DAMAGE_INTERPRETATIONS.map((d) => [d.key, d.label]),
) as Record<DamageKey, string>;

export const DAMAGE_PLAIN: Record<DamageKey, string> = Object.fromEntries(
  DAMAGE_INTERPRETATIONS.map((d) => [d.key, d.plain]),
) as Record<DamageKey, string>;

/* ------------------------------------------------------------------ */
/* Evidence levels                                                     */
/* ------------------------------------------------------------------ */

export type EvidenceKey =
  | "manufacturer_documented" | "recognized_technical_reference" | "internal_trial_verified"
  | "professional_consensus" | "user_reported_source" | "ai_suggested" | "inferred"
  | "insufficient_information";

export const EVIDENCE_LEVELS: { key: EvidenceKey; label: string; confirmed: boolean; rank: number }[] = [
  { key: "manufacturer_documented", label: "Manufacturer Documented", confirmed: true, rank: 8 },
  { key: "recognized_technical_reference", label: "Recognized Technical Reference", confirmed: true, rank: 7 },
  { key: "internal_trial_verified", label: "Internal Trial Verified", confirmed: true, rank: 6 },
  { key: "professional_consensus", label: "Professional Consensus", confirmed: true, rank: 5 },
  { key: "user_reported_source", label: "User-Reported Source", confirmed: false, rank: 4 },
  { key: "ai_suggested", label: "AI-Suggested", confirmed: false, rank: 3 },
  { key: "inferred", label: "Inferred", confirmed: false, rank: 2 },
  { key: "insufficient_information", label: "Insufficient Information", confirmed: false, rank: 1 },
];

export const EVIDENCE_LABEL: Record<EvidenceKey, string> = Object.fromEntries(
  EVIDENCE_LEVELS.map((e) => [e.key, e.label]),
) as Record<EvidenceKey, string>;

export const EVIDENCE_CONFIRMED: Record<EvidenceKey, boolean> = Object.fromEntries(
  EVIDENCE_LEVELS.map((e) => [e.key, e.confirmed]),
) as Record<EvidenceKey, boolean>;

export const EVIDENCE_RANK: Record<EvidenceKey, number> = Object.fromEntries(
  EVIDENCE_LEVELS.map((e) => [e.key, e.rank]),
) as Record<EvidenceKey, number>;

/* ------------------------------------------------------------------ */
/* Legacy category migration map (Step 5 §28)                          */
/* ------------------------------------------------------------------ */

export type LegacyMapping = {
  legacy: string;
  target: PrimaryCategoryKey | null;
  split: PrimaryCategoryKey[];
  tagsAdded: (ConditionTagKey | RiskTagKey)[];
  routedToDamage: boolean;
  reason: string;
  reviewerStatus: "pending_review" | "needs_manual_review";
};

export const LEGACY_CATEGORY_MAP: LegacyMapping[] = [
  { legacy: "Combination Stains", target: "combination_unknown", split: [], tagsAdded: [], routedToDamage: false, reason: "Direct mapping. Components recorded individually.", reviewerStatus: "pending_review" },
  { legacy: "Oil / Grease-Based Stains", target: "oil_grease", split: [], tagsAdded: [], routedToDamage: false, reason: "Direct mapping.", reviewerStatus: "pending_review" },
  { legacy: "Water-Based Stains", target: "water_soluble", split: [], tagsAdded: [], routedToDamage: false, reason: "Mapped only after record-level review; many entries are tannin, protein or combination.", reviewerStatus: "needs_manual_review" },
  { legacy: "Dye-Based / Tannin Stains", target: null, split: ["dye_ink", "tannin_plant"], tagsAdded: [], routedToDamage: false, reason: "Records split between dye/ink and tannin/plant.", reviewerStatus: "needs_manual_review" },
  { legacy: "Protein-Based Stains", target: "protein", split: [], tagsAdded: [], routedToDamage: false, reason: "Direct mapping.", reviewerStatus: "pending_review" },
  { legacy: "Particulate (Solid) Stains", target: "pigment_particulate", split: [], tagsAdded: [], routedToDamage: false, reason: "Direct mapping.", reviewerStatus: "pending_review" },
  { legacy: "Pigment / Paint Stains", target: null, split: ["pigment_particulate", "paint_polymer"], tagsAdded: [], routedToDamage: false, reason: "Records split between pigment/particulate and paint/resin/polymer.", reviewerStatus: "needs_manual_review" },
  { legacy: "Dye Transfer / Color Bleeding", target: "dye_ink", split: [], tagsAdded: ["dye_bleeding", "crossed_multiple_colours"], routedToDamage: false, reason: "Dye transfer handled as a sub-type and tag inside dye/ink.", reviewerStatus: "pending_review" },
  { legacy: "Oxidizable Stains", target: "oxidizable", split: [], tagsAdded: [], routedToDamage: false, reason: "Mapped only after technical review; otherwise records stay in their original chemistry category.", reviewerStatus: "needs_manual_review" },
  { legacy: "Heat-Set / Aged Stains", target: null, split: [], tagsAdded: ["aged", "heat_exposed", "heat_set_possible"], routedToDamage: false, reason: "Not a chemistry category. Records keep their chemistry category and receive condition tags.", reviewerStatus: "needs_manual_review" },
  { legacy: "Reducible (Metal/Rust) Stains", target: null, split: ["metal_rust", "reducible"], tagsAdded: [], routedToDamage: false, reason: "Rust and mineral records map to metal/rust; only technically reviewed records map to reducible.", reviewerStatus: "needs_manual_review" },
  { legacy: "Chemical Stains / Fabric Damage", target: null, split: [], tagsAdded: [], routedToDamage: true, reason: "Not a stain category. Records route to the separate damage-diagnosis structure.", reviewerStatus: "needs_manual_review" },
];
