/**
 * Step 5 — reviewed seed classifications for the permanent stain library.
 * CLASSIFICATION ONLY. No products, procedures, quantities, contact times,
 * temperatures, rinsing or neutralization anywhere in this file.
 *
 * Library classification is deliberately separate from case classification:
 * adding milk to one coffee case must never rewrite the coffee library record.
 */

import type {
  ComponentKey, ComponentRelevance, ConditionTagKey, DamageKey, EvidenceKey,
  PrimaryCategoryKey, RiskTagKey, SourceTypeKey,
} from "@/data/taxonomy";

export type ComponentLink = {
  key: ComponentKey;
  relevance: ComponentRelevance;
  confidence: number; // 0-10
  evidence: EvidenceKey;
  notes?: string;
};

export type TechnicalFields = {
  composition: string;
  solubility: string;
  bonding: string;
  heat: string;
  ageing: string;
  oxidation: string;
  acidity: string;
  alkalinity: string;
};

export type LibraryClassification = {
  key: string;
  name: string;
  alt: string[];
  local: string[];
  /** Exactly one primary category for every published stain. Null only for damage diagnoses. */
  primary: PrimaryCategoryKey | null;
  /** True when the record is a damage diagnosis rather than a stain. */
  damageOnly?: boolean;
  primaryConfidence: number;
  primaryReason: string;
  components: ComponentLink[];
  componentConfidence: number;
  sources: SourceTypeKey[];
  sourceConfidence: number;
  conditionTags: ConditionTagKey[];
  riskTags: RiskTagKey[];
  damageDefault: DamageKey;
  damageConfidence: number;
  evidence: EvidenceKey;
  plain: string;
  technical: TechnicalFields;
  legacyCategory?: string;
  status: "published" | "under_review" | "draft";
  version: number;
  owner: string;
  reviewer: string;
  reviewDate: string;
  nextReviewDate: string;
  needsReview?: boolean;
  reviewNote?: string;
  /** Links to the Step 3 identification record where one exists. */
  idRecordId?: string;
};

const NE = "Not established";
const II = "Insufficient information";

const tech = (t: Partial<TechnicalFields>): TechnicalFields => ({
  composition: II, solubility: II, bonding: II,
  heat: NE, ageing: NE, oxidation: NE, acidity: NE, alkalinity: NE,
  ...t,
});

const L = (r: Partial<LibraryClassification> & Pick<LibraryClassification, "key" | "name" | "primary" | "primaryReason" | "plain">): LibraryClassification => ({
  alt: [], local: [], primaryConfidence: 8, components: [], componentConfidence: 6,
  sources: [], sourceConfidence: 7, conditionTags: [], riskTags: [],
  damageDefault: "removable_stain_likely", damageConfidence: 7,
  evidence: "professional_consensus", technical: tech({}),
  status: "published", version: 1, owner: "Stain Master content team",
  reviewer: "Technical reviewer", reviewDate: "2026-08-01", nextReviewDate: "2027-08-01",
  ...r,
} as LibraryClassification);

const c = (
  key: ComponentKey, relevance: ComponentRelevance, confidence: number,
  evidence: EvidenceKey = "professional_consensus", notes?: string,
): ComponentLink => ({ key, relevance, confidence, evidence, notes });

export const LIBRARY_CLASSIFICATIONS: LibraryClassification[] = [
  /* ---------------- Water-soluble ---------------- */
  L({
    key: "sugar_syrup", name: "Water-soluble sugar syrup", alt: ["Sugar syrup", "Sherbet", "Sweet drink"],
    local: ["Chashni"], primary: "water_soluble", primaryConfidence: 9,
    primaryReason: "The dominant material is sugar in water, which disperses in water before it dries.",
    components: [c("sugar", "primary", 9), c("water_soluble", "major", 9), c("natural_dye", "possible", 4, "inferred")],
    componentConfidence: 8, sources: ["beverage", "food"], sourceConfidence: 8,
    conditionTags: ["fresh"], riskTags: ["domestic_candidate"],
    plain: "A sticky sweet mark from syrup or a sweet drink.",
    technical: tech({ composition: "Sugars in water, sometimes with added colour", solubility: "Water-dispersible while fresh", bonding: "Surface deposit that becomes tacky on drying", heat: "Heat can caramelise sugar and darken the mark", ageing: "Dries hard and attracts particulate soil" }),
    legacyCategory: "Water-Based Stains",
  }),

  /* ---------------- Oil and grease ---------------- */
  L({
    key: "cooking_oil", name: "Cooking oil", alt: ["Vegetable oil", "Frying oil"], local: ["Tel"],
    primary: "oil_grease", primaryConfidence: 9,
    primaryReason: "Fat is the dominant treatment-relevant material.",
    components: [c("oil", "primary", 9), c("particulate", "possible", 3, "inferred")],
    componentConfidence: 8, sources: ["cooking", "food"], sourceConfidence: 9,
    conditionTags: [], riskTags: ["domestic_candidate"],
    plain: "A translucent greasy mark that darkens the fabric.",
    technical: tech({ composition: "Triglyceride oils", solubility: "Not water-soluble", bonding: "Absorbs into fibres and spreads", heat: "Heat drives oil deeper into the fibre", ageing: "Oxidises and yellows with age", oxidation: "Ageing oil can develop a yellow-brown tone" }),
    legacyCategory: "Oil / Grease-Based Stains", idRecordId: "cooking_oil",
  }),
  L({
    key: "ghee", name: "Ghee", alt: ["Clarified butter"], local: ["Ghee"],
    primary: "oil_grease", primaryConfidence: 9,
    primaryReason: "Clarified fat dominates; milk solids are largely removed but may remain.",
    components: [c("oil", "primary", 9), c("protein", "minor", 4, "inferred", "Residual milk solids may remain")],
    componentConfidence: 7, sources: ["cooking", "food"], sourceConfidence: 9,
    riskTags: ["domestic_candidate"],
    plain: "A greasy cooking-fat mark that may harden as it cools.",
    technical: tech({ composition: "Clarified milk fat with possible residual solids", solubility: "Not water-soluble", bonding: "Solidifies in the fibre when cool", heat: "Softens and spreads with heat" }),
    legacyCategory: "Oil / Grease-Based Stains",
  }),
  L({
    key: "machine_oil", name: "Machine oil", alt: ["Motor oil", "Lubricating grease", "Engine oil"],
    primary: "oil_grease", primaryConfidence: 9,
    primaryReason: "Hydrocarbon oil dominates, usually carrying dark particulate matter.",
    components: [c("oil", "primary", 9), c("grease", "major", 8), c("particulate", "major", 8), c("metallic_oxide", "possible", 4, "inferred")],
    componentConfidence: 8, sources: ["machinery"], sourceConfidence: 9,
    riskTags: ["domestic_not_recommended", "pigment_may_remain"],
    plain: "A dark, heavy, oily mark from machinery, usually with fine black particles in it.",
    technical: tech({ composition: "Mineral or synthetic hydrocarbon oil with suspended solids", solubility: "Not water-soluble", bonding: "Deep fibre penetration plus trapped particulate", ageing: "Darkens and becomes far harder to improve" }),
    legacyCategory: "Oil / Grease-Based Stains",
  }),

  /* ---------------- Protein ---------------- */
  L({
    key: "blood", name: "Blood", alt: ["Dried blood", "Blood spot"], local: ["Khoon", "Rakt"],
    primary: "protein", primaryConfidence: 9,
    primaryReason: "Albuminous protein is the dominant and most heat-sensitive material.",
    components: [c("protein", "primary", 9), c("pigment", "major", 7), c("biological_material", "major", 8)],
    componentConfidence: 8, sources: ["body_fluid"], sourceConfidence: 9,
    conditionTags: [], riskTags: ["biological_precaution", "heat_warning"],
    evidence: "recognized_technical_reference",
    plain: "A body-fluid mark that changes from red to brown as it ages.",
    technical: tech({ composition: "Protein, haem pigment, water and salts", solubility: "Partly water-dispersible while fresh", bonding: "Coagulates and binds to fibre", heat: "Heat sets protein strongly", ageing: "Darkens and oxidises to brown", oxidation: "Ageing converts haem colour to brown" }),
    legacyCategory: "Protein-Based Stains", idRecordId: "blood",
  }),
  L({
    key: "egg", name: "Egg", alt: ["Egg white", "Egg yolk"], local: ["Anda"],
    primary: "protein", primaryConfidence: 9,
    primaryReason: "Albumin protein dominates; yolk adds fat and colour.",
    components: [c("protein", "primary", 9), c("oil", "major", 7, "professional_consensus", "Yolk contributes fat"), c("natural_dye", "minor", 5, "inferred")],
    componentConfidence: 8, sources: ["food", "cooking"], sourceConfidence: 9,
    riskTags: ["heat_warning"],
    plain: "A yellowish protein mark that stiffens the fabric as it dries.",
    technical: tech({ composition: "Albumin protein, fat and pigment", solubility: "Partly water-dispersible while fresh", bonding: "Coagulates on the fibre surface", heat: "Coagulates quickly and sets", ageing: "Hardens and becomes brittle" }),
    legacyCategory: "Protein-Based Stains",
  }),
  L({
    key: "milk", name: "Milk", alt: ["Cream", "Dairy spill"], local: ["Doodh"],
    primary: "protein", primaryConfidence: 9,
    primaryReason: "Casein protein is the treatment-defining material, with milk fat alongside it.",
    components: [c("protein", "primary", 9), c("oil", "major", 8, "professional_consensus", "Milk fat"), c("sugar", "minor", 6, "inferred", "Lactose")],
    componentConfidence: 8, sources: ["beverage", "food"], sourceConfidence: 9,
    riskTags: ["heat_warning"],
    plain: "A faint mark that can smell sour and turn yellow if it is left or heated.",
    technical: tech({ composition: "Casein protein, milk fat and lactose", solubility: "Partly water-dispersible while fresh", bonding: "Protein binds to fibre as it dries", heat: "Sets protein and can yellow the mark", ageing: "Yellows and can develop odour" }),
    legacyCategory: "Protein-Based Stains",
  }),
  L({
    key: "perspiration", name: "Perspiration", alt: ["Sweat", "Underarm mark"], local: ["Paseena"],
    primary: "protein", primaryConfidence: 7,
    primaryReason: "Body protein and sebum dominate, though salts and residues are also present.",
    components: [c("protein", "primary", 8), c("oil", "major", 8), c("salt", "major", 8), c("mineral", "minor", 5, "inferred"), c("unknown_component", "possible", 4, "inferred")],
    componentConfidence: 6, sources: ["perspiration", "body_fluid"], sourceConfidence: 9,
    conditionTags: ["aged", "oxidized_by_age"], riskTags: ["heat_warning", "colourfastness_test_required"],
    plain: "A yellowish underarm or collar mark that builds up over time.",
    technical: tech({ composition: "Protein, sebum, salts and personal-care residue", solubility: "Partly water-dispersible when fresh", bonding: "Builds up in layers over repeated wear", heat: "Heat can yellow and set the mark", ageing: "Yellows and can weaken fibres over long periods", oxidation: "Aged marks commonly show yellowing" }),
    legacyCategory: "Oxidizable Stains",
    needsReview: true, reviewNote: "Legacy record sat under Oxidizable. Kept in protein chemistry with ageing tags until technical review confirms an oxidizable residual stage.",
  }),
  L({
    key: "deodorant_buildup", name: "Deodorant buildup", alt: ["Antiperspirant mark", "White underarm crust"],
    primary: "combination_unknown", primaryConfidence: 6,
    primaryReason: "Mineral salts, body soil, fat and fabric colour change occur together; no single chemistry dominates.",
    components: [c("mineral", "major", 7), c("metallic_oxide", "possible", 5, "inferred", "Aluminium salts are commonly declared but not verified per product"), c("oil", "major", 7), c("protein", "major", 7), c("fragrance", "minor", 5, "user_reported_source")],
    componentConfidence: 5, sources: ["personal_care", "perspiration"], sourceConfidence: 8,
    conditionTags: ["aged", "hardened"], riskTags: ["domestic_not_recommended", "hidden_test_required"],
    evidence: "professional_consensus",
    plain: "A stiff white or yellow buildup under the arms from repeated product use and sweat.",
    technical: tech({ composition: "Mineral salts, body soil and fat", solubility: II, bonding: "Layered buildup bonded into the fibre", ageing: "Hardens and can distort or weaken fabric" }),
    legacyCategory: "Combination Stains",
  }),

  /* ---------------- Tannin and plant ---------------- */
  L({
    key: "tea", name: "Tea", alt: ["Chai", "Black tea"], local: ["Chai", "Chaay"],
    primary: "tannin_plant", primaryConfidence: 9,
    primaryReason: "Plant tannin colour is the dominant material in plain tea.",
    components: [c("tannin", "primary", 9), c("natural_dye", "major", 8), c("sugar", "possible", 5, "user_reported_source")],
    componentConfidence: 8, sources: ["beverage", "plant"], sourceConfidence: 9,
    riskTags: ["heat_warning"],
    plain: "A brown plant-colour mark from tea.",
    technical: tech({ composition: "Plant tannins and colour compounds", solubility: "Partly water-dispersible while fresh", bonding: "Tannin binds to fibre and deepens with time", heat: "Heat deepens the colour", ageing: "Darkens and becomes harder to improve" }),
    legacyCategory: "Dye-Based / Tannin Stains", idRecordId: "tea",
  }),
  L({
    key: "black_coffee", name: "Black coffee", alt: ["Coffee", "Espresso"], local: ["Kaafi"],
    primary: "tannin_plant", primaryConfidence: 9,
    primaryReason: "Plain coffee is dominated by plant colour compounds and tannins.",
    components: [c("tannin", "primary", 9), c("natural_dye", "major", 8), c("particulate", "minor", 5, "inferred", "Fine grounds may be present")],
    componentConfidence: 8, sources: ["beverage", "plant"], sourceConfidence: 9,
    riskTags: ["heat_warning"],
    plain: "A brown plant-colour mark from coffee without milk.",
    technical: tech({ composition: "Plant tannins, colour compounds and fine solids", solubility: "Partly water-dispersible while fresh", bonding: "Tannin binds to fibre", heat: "Heat deepens and sets the colour", ageing: "Darkens with age" }),
    legacyCategory: "Dye-Based / Tannin Stains", idRecordId: "coffee",
  }),
  L({
    key: "coffee_with_milk", name: "Coffee with milk", alt: ["Latte", "Milk coffee", "Cappuccino"],
    primary: "combination_unknown", primaryConfidence: 8,
    primaryReason: "Plant tannin colour, milk protein and milk fat are all treatment-relevant, so no single chemistry represents the stain.",
    components: [c("tannin", "major", 9), c("natural_dye", "major", 8), c("protein", "major", 9), c("oil", "major", 8), c("sugar", "possible", 5, "user_reported_source")],
    componentConfidence: 8, sources: ["beverage"], sourceConfidence: 9,
    riskTags: ["heat_warning"],
    plain: "A coffee mark that also contains milk, so it carries plant colour, protein and fat together.",
    technical: tech({ composition: "Plant tannins with casein protein and milk fat", solubility: "Partly water-dispersible while fresh", bonding: "Protein and tannin bind separately to the fibre", heat: "Heat sets the protein and deepens the colour", ageing: "Yellows and darkens" }),
    legacyCategory: "Combination Stains",
  }),
  L({
    key: "red_wine", name: "Red wine", alt: ["Wine spill"],
    primary: "tannin_plant", primaryConfidence: 9,
    primaryReason: "Grape tannin and natural colour dominate.",
    components: [c("tannin", "primary", 9), c("natural_dye", "major", 9), c("sugar", "minor", 6, "inferred")],
    componentConfidence: 8, sources: ["beverage", "plant"], sourceConfidence: 9,
    riskTags: ["heat_warning", "colourfastness_test_required"],
    plain: "A red-purple plant-colour mark that spreads quickly.",
    technical: tech({ composition: "Grape tannins, anthocyanin colour and sugars", solubility: "Partly water-dispersible while fresh", bonding: "Colour binds rapidly to fibre", heat: "Heat sets the colour", ageing: "Turns brown-purple and becomes stubborn" }),
    legacyCategory: "Dye-Based / Tannin Stains",
  }),
  L({
    key: "fruit_juice", name: "Fruit juice", alt: ["Juice", "Mango juice", "Orange juice"], local: ["Ras"],
    primary: "tannin_plant", primaryConfidence: 8,
    primaryReason: "Natural fruit colour dominates, though sugar and pulp are usually present.",
    components: [c("natural_dye", "primary", 8), c("tannin", "major", 7), c("sugar", "major", 8), c("particulate", "possible", 5, "inferred", "Pulp")],
    componentConfidence: 7, sources: ["beverage", "food", "plant"], sourceConfidence: 9,
    riskTags: ["heat_warning"],
    plain: "A fruit-colour mark, often sticky from sugar.",
    technical: tech({ composition: "Fruit colour compounds, sugars and pulp", solubility: "Partly water-dispersible while fresh", bonding: "Colour binds as the mark dries", heat: "Heat sets the colour", ageing: "Turns brown and can appear to disappear then reappear" }),
    legacyCategory: "Dye-Based / Tannin Stains",
  }),

  /* ---------------- Pigment and particulate ---------------- */
  L({
    key: "mud", name: "Mud", alt: ["Wet soil", "Dirt"], local: ["Keechad", "Mitti"],
    primary: "pigment_particulate", primaryConfidence: 9,
    primaryReason: "Insoluble soil particles held in the fibre are the dominant material.",
    components: [c("particulate", "primary", 9), c("mineral", "major", 8), c("pigment", "major", 7), c("metallic_oxide", "possible", 4, "inferred", "Iron-rich soils may leave a coloured residue")],
    componentConfidence: 8, sources: ["soil_outdoor"], sourceConfidence: 9,
    riskTags: ["domestic_candidate"],
    plain: "Soil particles held in the fabric, usually brown or grey.",
    technical: tech({ composition: "Mineral particles, clay and organic soil", solubility: "Not soluble; removal is physical", bonding: "Mechanically trapped between fibres", ageing: "Dries and lodges deeper into the weave" }),
    legacyCategory: "Particulate (Solid) Stains", idRecordId: "mud",
  }),
  L({
    key: "clay", name: "Clay", alt: ["Red clay", "Potter's clay"],
    primary: "pigment_particulate", primaryConfidence: 9,
    primaryReason: "Very fine mineral particles dominate and can carry strong natural colour.",
    components: [c("particulate", "primary", 9), c("mineral", "major", 9), c("pigment", "major", 8)],
    componentConfidence: 8, sources: ["soil_outdoor"], sourceConfidence: 9,
    riskTags: ["pigment_may_remain"],
    plain: "Very fine earth particles that can leave a lasting colour cast.",
    technical: tech({ composition: "Fine mineral platelets with natural colour", solubility: "Not soluble; removal is physical", bonding: "Fine particles lodge deep in the fibre structure" }),
    legacyCategory: "Particulate (Solid) Stains",
  }),
  L({
    key: "soot", name: "Soot", alt: ["Smoke black", "Carbon black", "Charcoal"],
    primary: "pigment_particulate", primaryConfidence: 9,
    primaryReason: "Very fine carbon particles dominate; they are insoluble and smear easily.",
    components: [c("particulate", "primary", 9), c("pigment", "major", 9), c("oil", "minor", 5, "inferred", "Smoke residue often carries oily material")],
    componentConfidence: 8, sources: ["smoke_fire"], sourceConfidence: 9,
    riskTags: ["pigment_may_remain", "domestic_not_recommended"],
    plain: "Fine black smoke particles that smear when rubbed.",
    technical: tech({ composition: "Carbon particles with oily smoke residue", solubility: "Not soluble; removal is physical", bonding: "Extremely fine particles lodge inside the fibre", ageing: "Becomes harder to lift as it is worked in" }),
    legacyCategory: "Particulate (Solid) Stains",
  }),

  /* ---------------- Dye and ink ---------------- */
  L({
    key: "ballpoint_ink", name: "Ballpoint ink", alt: ["Pen mark", "Biro"],
    primary: "dye_ink", primaryConfidence: 8,
    primaryReason: "Dye is the dominant colour body, although the paste also contains other materials.",
    components: [c("synthetic_dye", "primary", 9), c("ink", "major", 9), c("resin", "possible", 6, "inferred", "Formulation not disclosed per product"), c("oil", "possible", 6, "inferred"), c("unknown_component", "possible", 5, "inferred", "Solvent system varies by manufacturer")],
    componentConfidence: 5, sources: ["ink_stationery"], sourceConfidence: 9,
    riskTags: ["colourfastness_test_required", "domestic_not_recommended"],
    evidence: "professional_consensus",
    plain: "A pen mark. The colour is dye, but the paste may also contain oily and resin-like material that is not disclosed.",
    technical: tech({ composition: "Dye in an undisclosed paste carrier", solubility: "Not disclosed", bonding: "Dye binds to fibre; carrier may film over the surface", ageing: "Colour can migrate outwards over time" }),
    legacyCategory: "Dye-Based / Tannin Stains",
  }),
  L({
    key: "permanent_marker", name: "Permanent marker", alt: ["Marker pen", "Sharpie-type marker"],
    primary: "dye_ink", primaryConfidence: 8,
    primaryReason: "Strong dye colour dominates, carried in a solvent system that varies by product.",
    components: [c("synthetic_dye", "primary", 9), c("ink", "major", 9), c("resin", "possible", 6, "inferred"), c("unknown_component", "possible", 6, "inferred", "Solvent not disclosed")],
    componentConfidence: 5, sources: ["ink_stationery"], sourceConfidence: 9,
    riskTags: ["professional_referral_required", "colourfastness_test_required"],
    plain: "A strong permanent pen mark that soaks straight into the fibre.",
    technical: tech({ composition: "Dye and resin in an undisclosed solvent", solubility: "Not disclosed", bonding: "Dye penetrates the fibre quickly", ageing: "Becomes progressively more fixed" }),
    legacyCategory: "Dye-Based / Tannin Stains",
  }),
  L({
    key: "dye_transfer", name: "Textile dye transfer", alt: ["Colour bleeding", "Colour run", "Dye migration"],
    primary: "dye_ink", primaryConfidence: 9,
    primaryReason: "Transferred textile dye is the material present. Dye transfer is a sub-type of dye and ink, not a category of its own.",
    components: [c("synthetic_dye", "primary", 9), c("natural_dye", "possible", 5, "inferred")],
    componentConfidence: 7, sources: ["dye_transfer"], sourceConfidence: 9,
    conditionTags: ["crossed_multiple_colours"], riskTags: ["dye_bleeding", "colourfastness_test_required", "professional_referral_required"],
    plain: "Colour that has moved from one garment or area onto another.",
    technical: tech({ composition: "Loose textile dye from another fabric", solubility: "Depends on the original dye class", bonding: "Dye redeposits and can bond to the receiving fibre", heat: "Heat fixes transferred dye", ageing: "Becomes harder to reverse over time" }),
    legacyCategory: "Dye Transfer / Color Bleeding",
  }),

  /* ---------------- Paint, resin, adhesive, polymer ---------------- */
  L({
    key: "latex_paint", name: "Latex paint", alt: ["Emulsion paint", "Wall paint"],
    primary: "paint_polymer", primaryConfidence: 9,
    primaryReason: "A polymer binder forms a film as it dries, which defines the handling pathway.",
    components: [c("paint_binder", "primary", 9), c("polymer", "major", 9), c("pigment", "major", 9), c("water_soluble", "minor", 6, "inferred", "Wet paint is water-thinned")],
    componentConfidence: 8, sources: ["paint_construction"], sourceConfidence: 9,
    conditionTags: ["cured", "polymerized"], riskTags: ["professional_referral_required", "pigment_may_remain"],
    plain: "Wall paint. Once it dries it becomes a plastic-like film in the fabric.",
    technical: tech({ composition: "Polymer binder, pigment and water", solubility: "Water-thinned while wet; not water-soluble once cured", bonding: "Cures into a film locked around the fibre", heat: "Heat accelerates curing", ageing: "Cures further and becomes far harder to address" }),
    legacyCategory: "Pigment / Paint Stains",
  }),
  L({
    key: "acrylic_paint", name: "Acrylic paint", alt: ["Artist acrylic", "Craft paint"],
    primary: "paint_polymer", primaryConfidence: 9,
    primaryReason: "An acrylic polymer binder cures into a film; pigment alone does not describe the behaviour.",
    components: [c("polymer", "primary", 9), c("paint_binder", "major", 9), c("pigment", "major", 9)],
    componentConfidence: 8, sources: ["paint_construction"], sourceConfidence: 9,
    conditionTags: ["cured", "polymerized"], riskTags: ["professional_referral_required", "pigment_may_remain"],
    plain: "Craft or artist paint that dries into a flexible plastic film.",
    technical: tech({ composition: "Acrylic polymer binder with pigment", solubility: "Not water-soluble once cured", bonding: "Encapsulates the fibre as it cures", heat: "Heat speeds curing", ageing: "Fully cured film is extremely stubborn" }),
    legacyCategory: "Pigment / Paint Stains",
  }),
  L({
    key: "oil_paint", name: "Oil paint", alt: ["Enamel paint", "Alkyd paint"],
    primary: "paint_polymer", primaryConfidence: 9,
    primaryReason: "A drying-oil or alkyd binder cures into a hard film; the oil content alone does not define it.",
    components: [c("paint_binder", "primary", 9), c("oil", "major", 9), c("pigment", "major", 9), c("resin", "major", 7)],
    componentConfidence: 7, sources: ["paint_construction"], sourceConfidence: 9,
    conditionTags: ["cured"], riskTags: ["professional_referral_required", "pigment_may_remain"],
    plain: "Paint that dries slowly into a hard, glossy film.",
    technical: tech({ composition: "Drying oil or alkyd resin with pigment", solubility: "Not water-soluble", bonding: "Cures chemically into a hard film", ageing: "Curing continues and the film hardens further" }),
    legacyCategory: "Pigment / Paint Stains",
  }),
  L({
    key: "adhesive", name: "Adhesive", alt: ["Glue", "Sticker residue", "Gum"], local: ["Gond"],
    primary: "paint_polymer", primaryConfidence: 8,
    primaryReason: "Adhesive polymer behaviour defines handling; chemistry varies widely by product.",
    components: [c("adhesive", "primary", 9), c("polymer", "major", 8), c("resin", "possible", 6, "inferred"), c("unknown_component", "possible", 6, "inferred", "Formulation not disclosed")],
    componentConfidence: 5, sources: ["adhesive"], sourceConfidence: 9,
    conditionTags: ["hardened", "cured"], riskTags: ["adhesive_risk", "professional_referral_required"],
    plain: "Glue or sticky residue that has set on or in the fabric.",
    technical: tech({ composition: "Not disclosed; varies by product", solubility: "Not disclosed", bonding: "Adheres to and between fibres", heat: "Some adhesives soften with heat and others set harder" }),
    legacyCategory: "Combination Stains",
  }),
  L({
    key: "nail_polish", name: "Nail polish", alt: ["Nail varnish", "Nail enamel"],
    primary: "paint_polymer", primaryConfidence: 9,
    primaryReason: "A fast-drying lacquer film defines the behaviour, with pigment carried inside it.",
    components: [c("resin", "primary", 9), c("polymer", "major", 9), c("pigment", "major", 9), c("synthetic_dye", "possible", 6, "inferred")],
    componentConfidence: 7, sources: ["cosmetic", "personal_care"], sourceConfidence: 9,
    conditionTags: ["cured", "hardened"], riskTags: ["professional_referral_required", "delicate_fabric_risk"],
    plain: "Nail colour that dries very fast into a hard, coloured film.",
    technical: tech({ composition: "Film-forming resin with pigment in a volatile carrier", solubility: "Not water-soluble", bonding: "Forms a brittle film locked into the weave", ageing: "Film hardens and can crack, leaving pigment behind" }),
    legacyCategory: "Pigment / Paint Stains",
  }),

  /* ---------------- Metal, rust and mineral ---------------- */
  L({
    key: "rust", name: "Rust", alt: ["Iron mark", "Orange corrosion mark"], local: ["Zang"],
    primary: "metal_rust", primaryConfidence: 9,
    primaryReason: "Iron corrosion product is the material present. Rust is classified as metal and mineral, and is never automatically treated as reducible.",
    components: [c("metallic_oxide", "primary", 9), c("mineral", "major", 8)],
    componentConfidence: 8, sources: ["metal", "water_mineral"], sourceConfidence: 9,
    conditionTags: ["aged"], riskTags: ["professional_referral_required", "metallic_thread_risk", "fibre_damage_possible"],
    evidence: "recognized_technical_reference",
    plain: "An orange-brown mark left by corroding iron or steel.",
    technical: tech({ composition: "Iron corrosion products", solubility: "Not water-soluble", bonding: "Deposits within and around the fibre", ageing: "Spreads and can weaken the fibre over time" }),
    legacyCategory: "Reducible (Metal/Rust) Stains",
    needsReview: true, reviewNote: "Legacy category combined rust with reducible chemistry. Rust is mapped to metal/rust only; any reducible pathway requires separate technical review.",
  }),

  /* ---------------- Biological ---------------- */
  L({
    key: "mould", name: "Mould", alt: ["Mildew", "Fungal growth", "Damp spots"], local: ["Phaphundi"],
    primary: "biological", primaryConfidence: 9,
    primaryReason: "Living or decaying biological growth is present, which brings hygiene considerations beyond the visible mark.",
    components: [c("biological_material", "primary", 9), c("pigment", "major", 8), c("natural_dye", "possible", 5, "inferred")],
    componentConfidence: 7, sources: ["mould_biological"], sourceConfidence: 9,
    conditionTags: ["aged", "damp"], riskTags: ["biological_precaution", "professional_referral_required", "fibre_damage_possible"],
    plain: "Musty black, green or grey growth from damp storage.",
    technical: tech({ composition: "Fungal growth with pigmented by-products", solubility: "Not soluble; colour may be bound into the fibre", bonding: "Growth penetrates the fibre and can leave permanent colour", ageing: "Continues to grow and can weaken fabric permanently" }),
    legacyCategory: "Combination Stains",
  }),

  /* ---------------- Combination ---------------- */
  L({
    key: "lipstick", name: "Lipstick", alt: ["Lip colour", "Lip balm mark"],
    primary: "combination_unknown", primaryConfidence: 9,
    primaryReason: "Wax, oil, pigment and dye are all treatment-relevant and formulation varies by product, so no single chemistry represents it.",
    components: [c("wax", "major", 8), c("oil", "major", 8), c("pigment", "major", 9), c("synthetic_dye", "major", 7), c("polymer", "possible", 5, "inferred", "Long-wear formulations may add polymer"), c("cosmetic_base", "major", 8)],
    componentConfidence: 6, sources: ["cosmetic"], sourceConfidence: 9,
    riskTags: ["pigment_may_remain", "colourfastness_test_required", "domestic_not_recommended"],
    plain: "Lip colour contains waxes, oils and strong pigment together, so it behaves as a combination stain.",
    technical: tech({ composition: "Wax and oil base carrying pigment and dye; exact formulation not disclosed", solubility: "Not disclosed", bonding: "Waxy base holds pigment against the fibre", heat: "Heat melts the base and spreads the pigment", ageing: "Pigment settles deeper into the fibre" }),
    legacyCategory: "Combination Stains", idRecordId: "lipstick",
  }),
  L({
    key: "foundation_makeup", name: "Foundation makeup", alt: ["Liquid foundation", "BB cream", "Concealer"],
    primary: "combination_unknown", primaryConfidence: 9,
    primaryReason: "Cosmetic base, oil, mineral pigment and sometimes polymer are all present together.",
    components: [c("cosmetic_base", "major", 9), c("oil", "major", 8), c("pigment", "major", 9), c("mineral", "major", 8), c("polymer", "possible", 5, "inferred")],
    componentConfidence: 6, sources: ["cosmetic"], sourceConfidence: 9,
    riskTags: ["pigment_may_remain", "domestic_not_recommended"],
    plain: "Face makeup contains oils and fine mineral pigment together, so it behaves as a combination stain.",
    technical: tech({ composition: "Emulsion base with mineral pigment; formulation not disclosed", solubility: "Not disclosed", bonding: "Fine pigment lodges in the fibre while the base holds it there" }),
    legacyCategory: "Combination Stains",
  }),
  L({
    key: "curry", name: "Curry", alt: ["Masala", "Turmeric mark"], local: ["Haldi", "Sabzi"],
    primary: "combination_unknown", primaryConfidence: 9,
    primaryReason: "Oil, strong spice colour, food particles and often protein and starch are present together.",
    components: [c("oil", "major", 9), c("natural_dye", "major", 9, "professional_consensus", "Turmeric and chilli colour"), c("pigment", "major", 8), c("particulate", "major", 8), c("protein", "possible", 6, "user_reported_source"), c("starch", "possible", 6, "inferred"), c("tannin", "possible", 5, "inferred")],
    componentConfidence: 7, sources: ["food", "cooking"], sourceConfidence: 9,
    riskTags: ["heat_warning", "pigment_may_remain", "domestic_not_recommended"],
    plain: "Curry commonly contains oil, coloured spices, food particles and sometimes protein, so it is a combination stain.",
    technical: tech({ composition: "Cooking oil, spice colour, food solids and variable protein or starch", solubility: "Mixed; components behave differently", bonding: "Oil carries strong colour deep into the fibre", heat: "Heat sets both the oil and the spice colour", ageing: "Colour becomes progressively more fixed", oxidation: "Spice colour can change tone in sunlight" }),
    legacyCategory: "Combination Stains", idRecordId: "curry",
  }),
  L({
    key: "gravy", name: "Gravy", alt: ["Meat gravy", "Sauce"],
    primary: "combination_unknown", primaryConfidence: 9,
    primaryReason: "Fat, protein, starch and plant colour occur together in variable proportions.",
    components: [c("oil", "major", 9), c("protein", "major", 9), c("starch", "major", 8), c("tannin", "possible", 6, "inferred"), c("pigment", "major", 7), c("particulate", "minor", 6, "inferred")],
    componentConfidence: 7, sources: ["food", "cooking"], sourceConfidence: 9,
    riskTags: ["heat_warning", "domestic_not_recommended"],
    plain: "Gravy contains fat, protein and thickener together, so it is a combination stain.",
    technical: tech({ composition: "Fat, protein, starch thickener and colour", solubility: "Mixed", bonding: "Protein and starch stiffen the fibre as they dry", heat: "Heat sets the protein component" }),
    legacyCategory: "Combination Stains", idRecordId: "gravy",
  }),
  L({
    key: "chocolate", name: "Chocolate", alt: ["Cocoa", "Chocolate sauce"],
    primary: "combination_unknown", primaryConfidence: 9,
    primaryReason: "Cocoa fat, milk protein, sugar and plant colour are all treatment-relevant.",
    components: [c("oil", "major", 9, "professional_consensus", "Cocoa butter"), c("protein", "major", 8), c("sugar", "major", 8), c("pigment", "major", 8), c("tannin", "major", 7, "professional_consensus", "Cocoa plant colour")],
    componentConfidence: 8, sources: ["food"], sourceConfidence: 9,
    riskTags: ["heat_warning"],
    plain: "Chocolate contains fat, milk protein, sugar and plant colour together.",
    technical: tech({ composition: "Cocoa fat, milk solids, sugar and cocoa colour", solubility: "Mixed", bonding: "Fat carries colour into the fibre", heat: "Heat melts the fat, spreads the mark and sets the protein" }),
    legacyCategory: "Combination Stains", idRecordId: "chocolate",
  }),
  L({
    key: "shoe_polish", name: "Shoe polish", alt: ["Boot polish", "Leather cream"],
    primary: "combination_unknown", primaryConfidence: 9,
    primaryReason: "Wax, oil, strong pigment and dye occur together, and some products also contain resin or solvent.",
    components: [c("wax", "major", 9), c("oil", "major", 8), c("pigment", "major", 9), c("synthetic_dye", "major", 8), c("resin", "possible", 5, "inferred", "Depends on formulation"), c("unknown_component", "possible", 5, "inferred", "Solvent system varies")],
    componentConfidence: 6, sources: ["personal_care", "household_chemical"], sourceConfidence: 8,
    riskTags: ["pigment_may_remain", "professional_referral_required"],
    plain: "Shoe polish combines wax, oil and very strong colour, so it is a combination stain.",
    technical: tech({ composition: "Wax and oil base with strong pigment and dye; formulation not disclosed", solubility: "Not disclosed", bonding: "Waxy film holds dense pigment in the fibre", heat: "Heat melts the wax and spreads the colour" }),
    legacyCategory: "Combination Stains",
  }),
  L({
    key: "unknown_yellow_mark", name: "Unknown yellow mark", alt: ["Unidentified yellow stain", "Storage mark"],
    primary: "combination_unknown", primaryConfidence: 3,
    primaryReason: "The source is not known. Yellowing can come from body soil, ageing, storage, heat, previous product use or fibre change, and these cannot be separated by appearance alone.",
    components: [c("unknown_component", "primary", 3, "insufficient_information"), c("oil", "possible", 4, "inferred"), c("protein", "possible", 4, "inferred"), c("mineral", "possible", 3, "inferred")],
    componentConfidence: 3, sources: ["unknown_source"], sourceConfidence: 2,
    conditionTags: ["unknown_age", "aged", "oxidized_by_age"],
    riskTags: ["professional_referral_required", "hidden_test_required", "domestic_not_recommended"],
    evidence: "insufficient_information", damageDefault: "insufficient_information", damageConfidence: 3,
    plain: "A yellow mark whose source is not known. It is kept as unknown rather than guessed.",
    technical: tech({ composition: II, solubility: II, bonding: II, heat: "Not established for an unidentified mark", ageing: "Yellowing commonly deepens with age" }),
    legacyCategory: "Oxidizable Stains",
    needsReview: true, reviewNote: "Kept as Combination or Unknown. Must not be promoted to Oxidizable without technical evidence.",
  }),

  /* ---------------- Damage diagnoses (not stain categories) ---------------- */
  L({
    key: "bleach_colour_loss", name: "Bleach-related colour loss", alt: ["Bleach spot", "White patch", "Colour removed"],
    primary: null, damageOnly: true, primaryConfidence: 0,
    primaryReason: "Nothing has been added to the fabric. Colour has been removed, so this is recorded as damage and not as a stain category.",
    components: [], componentConfidence: 0,
    sources: ["laundry_chemical", "household_chemical"], sourceConfidence: 7,
    riskTags: ["dye_loss_possible", "chemical_hazard", "professional_referral_required", "treatment_blocked"],
    damageDefault: "dye_loss_possible", damageConfidence: 8,
    evidence: "recognized_technical_reference",
    plain: "A pale or white patch where the fabric colour has been removed. This is damage, not a stain.",
    technical: tech({ composition: "No added material; fabric dye has been destroyed", solubility: "Not applicable", bonding: "Not applicable" }),
    legacyCategory: "Chemical Stains / Fabric Damage",
  }),
  L({
    key: "scorch_damage", name: "Scorch damage", alt: ["Iron mark", "Burn mark", "Shiny pressed patch"],
    primary: null, damageOnly: true, primaryConfidence: 0,
    primaryReason: "Heat has altered the fibre itself. This is recorded as damage and not as a stain category.",
    components: [], componentConfidence: 0,
    sources: ["smoke_fire", "household_chemical"], sourceConfidence: 7,
    conditionTags: ["heat_exposed"],
    riskTags: ["fibre_damage_possible", "professional_referral_required", "treatment_blocked", "heat_warning"],
    damageDefault: "heat_damage_possible", damageConfidence: 8,
    evidence: "recognized_technical_reference",
    plain: "A brown, shiny or melted area caused by heat. The fibre itself has changed, so this is damage.",
    technical: tech({ composition: "No added material; the fibre has been altered by heat", solubility: "Not applicable", bonding: "Not applicable", heat: "Further heat will worsen the damage" }),
    legacyCategory: "Chemical Stains / Fabric Damage",
  }),
];

export const LIBRARY_BY_KEY: Record<string, LibraryClassification> = Object.fromEntries(
  LIBRARY_CLASSIFICATIONS.map((l) => [l.key, l]),
);

/** Published stain records only — damage diagnoses are not stains. */
export const PUBLISHED_STAINS = () =>
  LIBRARY_CLASSIFICATIONS.filter((l) => l.status === "published" && !l.damageOnly);
