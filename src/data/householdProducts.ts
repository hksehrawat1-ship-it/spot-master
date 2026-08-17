/**
 * STEP 12 — Household product database (§8, §9, §10, §11, §12).
 *
 * Household products are NOT interchangeable. A laundry detergent in one market is
 * not the same formulation as the same brand in another market. Every domestic
 * method links to an exact household product record or to a generic class whose
 * minimum requirements are stated explicitly.
 *
 * Nothing in this file invents quantities, dilutions, contact times or temperatures.
 * Where an exact value is not carried by an approved source, the value is `null` and
 * the label fallback text is used instead.
 */

import type { FabricKey, ColourKey } from "@/data/masterStains";

export const HOUSEHOLD_DB_VERSION = "step12-household-v1";
export const FOLLOW_LABEL = "Follow the current product label.";

/* ------------------------------------------------------------------ */
/* §8 Allowed household material classes                               */
/* ------------------------------------------------------------------ */

export const MATERIAL_CLASSES = [
  "cool_water",
  "lukewarm_water",
  "white_absorbent_cloth",
  "white_paper_towel",
  "labelled_laundry_detergent",
  "labelled_household_stain_remover",
  "labelled_oxygen_laundry_product",
  "other_verified_household_product",
] as const;
export type MaterialClass = (typeof MATERIAL_CLASSES)[number];

export const MATERIAL_CLASS_LABEL: Record<MaterialClass, string> = {
  cool_water: "Cool water",
  lukewarm_water: "Lukewarm water",
  white_absorbent_cloth: "Clean white absorbent cloth",
  white_paper_towel: "Plain white paper towel",
  labelled_laundry_detergent: "Labelled laundry detergent",
  labelled_household_stain_remover: "Labelled household stain-removal product",
  labelled_oxygen_laundry_product: "Labelled oxygen-based laundry product",
  other_verified_household_product: "Other household-use product with verified textile instructions",
};

/**
 * Listing a class does not approve it for a stain or fabric. Approval happens only
 * inside a reviewed domestic treatment record.
 */
export const MATERIAL_CLASS_NOTE =
  "Listing a material class does not approve it for every stain or fabric. Each material must be linked to an approved treatment record.";

/* ------------------------------------------------------------------ */
/* §12 Generic product minimum requirements                            */
/* ------------------------------------------------------------------ */

export type GenericRequirement = {
  materialClass: MaterialClass;
  label: string;
  minimumRequirements: string[];
  /** When true the exact branded product must be selected — formulation affects safety. */
  exactProductRequired: boolean;
};

export const GENERIC_REQUIREMENTS: GenericRequirement[] = [
  {
    materialClass: "labelled_laundry_detergent",
    label: "Liquid laundry detergent (generic)",
    minimumRequirements: [
      "Intended for textile laundering",
      "Label in the correct market and language",
      "No added bleach unless the method explicitly requires it",
      "No unknown active ingredients",
      "Used according to its own label",
      "Compatible with the garment care instructions",
      "Hidden-area test passed where the method requires it",
    ],
    exactProductRequired: false,
  },
  {
    materialClass: "labelled_oxygen_laundry_product",
    label: "Oxygen-based laundry product (generic)",
    minimumRequirements: [
      "Oxygen-based laundry product intended for textiles",
      "Label in the correct market and language",
      "Textile and colour restrictions printed on the label",
      "Exact product must be selected — formulation affects safety",
      "Hidden-area test passed",
    ],
    exactProductRequired: true,
  },
  {
    materialClass: "labelled_household_stain_remover",
    label: "Household stain-removal product (generic)",
    minimumRequirements: [
      "Labelled for textile stain removal",
      "Label in the correct market and language",
      "Exact product must be selected — formulation affects safety",
      "Hidden-area test passed",
    ],
    exactProductRequired: true,
  },
];

/* ------------------------------------------------------------------ */
/* §9 Unverified food / pantry candidates                              */
/* ------------------------------------------------------------------ */

export const UNVERIFIED_FOOD_CANDIDATES = [
  "lemon_juice", "vinegar", "baking_soda", "salt", "toothpaste", "milk",
  "cooking_oil", "carbonated_drink", "talcum_powder", "cornflour", "dishwashing_mixture",
] as const;
export type UnverifiedFoodCandidate = (typeof UNVERIFIED_FOOD_CANDIDATES)[number];

export const UNVERIFIED_FOOD_LABEL: Record<UnverifiedFoodCandidate, string> = {
  lemon_juice: "Lemon juice", vinegar: "Vinegar", baking_soda: "Baking soda",
  salt: "Salt", toothpaste: "Toothpaste", milk: "Milk", cooking_oil: "Cooking oil",
  carbonated_drink: "Carbonated drink", talcum_powder: "Talcum powder",
  cornflour: "Cornflour", dishwashing_mixture: "Dishwashing mixture",
};

export const FOOD_INGREDIENT_NOTE =
  "Popularity is not evidence. Acidic, alkaline, oily, abrasive, coloured or fragranced household materials may change dyes, damage finishes, leave residue, create rings, set proteins, interfere with professional cleaning or create additional combination stains. \u201CNatural\u201D does not mean safe.";

/* ------------------------------------------------------------------ */
/* §10 Prohibited domestic practices                                   */
/* ------------------------------------------------------------------ */

export const PROHIBITED_DOMESTIC_PRACTICES: string[] = [
  "Mixing chlorine bleach with acids",
  "Mixing chlorine bleach with ammonia",
  "Mixing chlorine bleach with alcohol",
  "Mixing chlorine bleach with another cleaner",
  "Mixing oxidizers and reducers",
  "Mixing unknown household products",
  "Industrial spotting agents",
  "Dry-cleaning solvents",
  "Petrol, kerosene or fuel",
  "Paint thinner",
  "Acetone, unless part of a separately verified labelled textile product with case-specific approval",
  "Unlabelled chemicals",
  "Boiling water without verified textile compatibility",
  "Steam guns",
  "Open flames",
  "Heating flammable products",
  "Aggressive rubbing",
  "Hard scraping",
  "Burn testing",
  "Repeated treatment after damage begins",
  "Treatment of an unknown industrial chemical",
  "Treatment of active biological contamination without appropriate controls",
];

/* ------------------------------------------------------------------ */
/* §2 Published terminology guard                                      */
/* ------------------------------------------------------------------ */

export const BANNED_PUBLISHED_TERMS = [
  "local hack", "home hack", "hack", "diy chemical", "miracle", "guaranteed removal",
  "secret formula",
];

export const containsBannedTerm = (text: string) => {
  const t = text.toLowerCase();
  return BANNED_PUBLISHED_TERMS.filter((b) => t.includes(b));
};

/* ------------------------------------------------------------------ */
/* §11 Household product record                                        */
/* ------------------------------------------------------------------ */

export type HouseholdProductType =
  | "laundry_detergent" | "oxygen_laundry_product" | "household_stain_remover"
  | "dish_liquid" | "laundry_bleach" | "other";

export const HOUSEHOLD_TYPE_LABEL: Record<HouseholdProductType, string> = {
  laundry_detergent: "Laundry detergent",
  oxygen_laundry_product: "Oxygen-based laundry product",
  household_stain_remover: "Household stain remover",
  dish_liquid: "Dishwashing liquid",
  laundry_bleach: "Laundry bleach",
  other: "Other household product",
};

export type HouseholdVerification =
  | "unverified" | "pending_review" | "verified" | "insufficient_information" | "disputed";

export type HouseholdSourceDoc = {
  id: string;
  kind: "product_label" | "manufacturer_instruction" | "safety_information" | "textile_guidance";
  reference: string;
  version?: string;
  date?: string;
  country?: string;
};

export type HouseholdProduct = {
  productId: string;               // SM-HHP-000001
  key: string;
  brand: string;
  productName: string;
  productType: HouseholdProductType;
  country: string;
  packSize: string | null;
  labelVersion: string | null;
  ingredientDisclosure: string | null;
  intendedTextileUse: string[];
  intendedStainUse: string[];
  fabricRestrictions: FabricKey[];
  colourRestrictions: ColourKey[];
  applicationInstructions: string | null;
  quantity: string | null;
  dilution: string | null;
  contactTime: string | null;
  temperature: string | null;
  rinsing: string | null;
  warnings: string[];
  incompatibilities: string[];
  storage: string | null;
  sourceDocuments: HouseholdSourceDoc[];
  verification: HouseholdVerification;
  reviewDate: string | null;
  nextReviewDate: string | null;
  status: "active" | "discontinued" | "archived";
  materialClass: MaterialClass;
  /** Set when the manufacturer changed the formulation — forces Needs Review upstream. */
  formulationChangedAt?: string;
};

export const formatHouseholdId = (n: number) => `SM-HHP-${String(n).padStart(6, "0")}`;

let hseq = 0;
const hhp = (p: Omit<HouseholdProduct, "productId">): HouseholdProduct => ({
  productId: formatHouseholdId(++hseq),
  ...p,
});

export const HOUSEHOLD_PRODUCTS: HouseholdProduct[] = [
  hhp({
    key: "cool_water_in",
    brand: "Generic",
    productName: "Cool potable water",
    productType: "other",
    country: "IN",
    packSize: null,
    labelVersion: null,
    ingredientDisclosure: "Potable water",
    intendedTextileUse: ["Washable textiles with verified water compatibility"],
    intendedStainUse: ["Fresh water-soluble residue", "Fresh beverage residue"],
    fabricRestrictions: ["leather", "suede", "fur", "coated", "waterproof", "acetate", "triacetate"],
    colourRestrictions: ["unknown_stability"],
    applicationInstructions: "Apply cool water to a clean white absorbent cloth, not directly onto the garment.",
    quantity: "Enough to dampen the cloth without saturating the garment",
    dilution: null,
    contactTime: null,
    temperature: "Cool, below 30 \u00B0C",
    rinsing: "Blot with a second clean damp cloth",
    warnings: ["Water rings can form on water-sensitive textiles", "Do not use on water-sensitive materials"],
    incompatibilities: ["Water-sensitive finishes", "Non-colourfast dyes"],
    storage: null,
    sourceDocuments: [
      { id: "SRC-HHP-0001", kind: "textile_guidance", reference: "Recognized textile-care guidance — cool-water first response for fresh water-soluble residue", date: "2025-04-10", country: "IN" },
    ],
    verification: "verified",
    reviewDate: "2026-01-15",
    nextReviewDate: "2027-01-15",
    status: "active",
    materialClass: "cool_water",
  }),
  hhp({
    key: "white_cotton_cloth",
    brand: "Generic",
    productName: "Clean white absorbent cotton cloth",
    productType: "other",
    country: "IN",
    packSize: null,
    labelVersion: null,
    ingredientDisclosure: "Undyed cotton",
    intendedTextileUse: ["All textiles as a blotting support"],
    intendedStainUse: ["Blotting and absorption"],
    fabricRestrictions: [],
    colourRestrictions: [],
    applicationInstructions: "Use white and undyed only, so that no dye can transfer to the garment.",
    quantity: null,
    dilution: null,
    contactTime: null,
    temperature: null,
    rinsing: null,
    warnings: ["Never use coloured or printed cloth"],
    incompatibilities: [],
    storage: null,
    sourceDocuments: [
      { id: "SRC-HHP-0002", kind: "textile_guidance", reference: "Recognized textile-care guidance — white absorbent support material", date: "2025-04-10" },
    ],
    verification: "verified",
    reviewDate: "2026-01-15",
    nextReviewDate: "2027-01-15",
    status: "active",
    materialClass: "white_absorbent_cloth",
  }),
  hhp({
    key: "white_paper_towel",
    brand: "Generic",
    productName: "Plain white paper towel",
    productType: "other",
    country: "IN",
    packSize: null,
    labelVersion: null,
    ingredientDisclosure: "Unprinted, undyed paper",
    intendedTextileUse: ["Blotting support on washable textiles"],
    intendedStainUse: ["Absorption of loose liquid"],
    fabricRestrictions: ["silk", "wool"],
    colourRestrictions: [],
    applicationInstructions: "Use unprinted, undyed towel only. Replace as soon as it is loaded.",
    quantity: null,
    dilution: null,
    contactTime: null,
    temperature: null,
    rinsing: null,
    warnings: ["Printed or coloured towel may transfer ink"],
    incompatibilities: [],
    storage: null,
    sourceDocuments: [
      { id: "SRC-HHP-0003", kind: "textile_guidance", reference: "Recognized textile-care guidance — absorbent blotting material", date: "2025-04-10" },
    ],
    verification: "verified",
    reviewDate: "2026-01-15",
    nextReviewDate: "2027-01-15",
    status: "active",
    materialClass: "white_paper_towel",
  }),
  hhp({
    key: "generic_liquid_detergent_in",
    brand: "Generic",
    productName: "Liquid laundry detergent meeting the generic minimum requirements",
    productType: "laundry_detergent",
    country: "IN",
    packSize: null,
    labelVersion: "Label as supplied in the user market",
    ingredientDisclosure: "Per label; must not contain added bleach",
    intendedTextileUse: ["Washable textiles permitted by the garment care instructions"],
    intendedStainUse: ["Fresh cooking-oil residue", "Fresh beverage residue"],
    fabricRestrictions: ["leather", "suede", "fur", "coated", "waterproof"],
    colourRestrictions: ["unknown_stability", "metallic"],
    applicationInstructions: FOLLOW_LABEL,
    quantity: FOLLOW_LABEL,
    dilution: FOLLOW_LABEL,
    contactTime: FOLLOW_LABEL,
    temperature: "Never above the care-label maximum wash temperature",
    rinsing: "Rinse thoroughly with cool water until no detergent remains",
    warnings: ["Do not use a detergent containing bleach unless the method explicitly requires it"],
    incompatibilities: ["Chlorine bleach", "Unknown household products"],
    storage: "Per label",
    sourceDocuments: [
      { id: "SRC-HHP-0004", kind: "product_label", reference: "Current label of the detergent selected by the user", country: "IN" },
      { id: "SRC-HHP-0005", kind: "textile_guidance", reference: "Recognized textile-care guidance — detergent pre-treatment of fresh oily soil on washable textiles", date: "2025-06-02" },
    ],
    verification: "verified",
    reviewDate: "2026-02-01",
    nextReviewDate: "2027-02-01",
    status: "active",
    materialClass: "labelled_laundry_detergent",
  }),
  hhp({
    key: "oxygen_laundry_generic_in",
    brand: "Generic",
    productName: "Oxygen-based laundry product",
    productType: "oxygen_laundry_product",
    country: "IN",
    packSize: null,
    labelVersion: null,
    ingredientDisclosure: "Per label",
    intendedTextileUse: ["Only textiles listed on the product label"],
    intendedStainUse: ["Per label"],
    fabricRestrictions: ["wool", "silk", "leather", "suede", "fur", "coated", "waterproof", "acetate", "triacetate"],
    colourRestrictions: ["dark", "bright", "multicoloured", "printed", "garment_dyed", "metallic", "unknown_stability"],
    applicationInstructions: FOLLOW_LABEL,
    quantity: null,
    dilution: null,
    contactTime: null,
    temperature: null,
    rinsing: null,
    warnings: ["Formulation varies by market — the exact product must be selected", "Never combine with chlorine bleach"],
    incompatibilities: ["Chlorine bleach", "Reducing agents", "Unknown household products"],
    storage: "Per label",
    sourceDocuments: [],
    verification: "insufficient_information",
    reviewDate: null,
    nextReviewDate: null,
    status: "active",
    materialClass: "labelled_oxygen_laundry_product",
  }),
  hhp({
    key: "household_stain_remover_unverified_in",
    brand: "Unspecified",
    productName: "Household stain-removal spray (market formulation unconfirmed)",
    productType: "household_stain_remover",
    country: "IN",
    packSize: null,
    labelVersion: null,
    ingredientDisclosure: "Not disclosed",
    intendedTextileUse: [],
    intendedStainUse: [],
    fabricRestrictions: [],
    colourRestrictions: [],
    applicationInstructions: null,
    quantity: null,
    dilution: null,
    contactTime: null,
    temperature: null,
    rinsing: null,
    warnings: ["Formulation and label unconfirmed — not usable in a published method"],
    incompatibilities: [],
    storage: null,
    sourceDocuments: [],
    verification: "unverified",
    reviewDate: null,
    nextReviewDate: null,
    status: "active",
    materialClass: "labelled_household_stain_remover",
  }),
  hhp({
    key: "generic_liquid_detergent_uk",
    brand: "Generic",
    productName: "Liquid laundry detergent (UK market label)",
    productType: "laundry_detergent",
    country: "GB",
    packSize: null,
    labelVersion: "UK market label",
    ingredientDisclosure: "Per label; must not contain added bleach",
    intendedTextileUse: ["Washable textiles permitted by the garment care instructions"],
    intendedStainUse: ["Fresh cooking-oil residue"],
    fabricRestrictions: ["leather", "suede", "fur", "coated", "waterproof"],
    colourRestrictions: ["unknown_stability", "metallic"],
    applicationInstructions: FOLLOW_LABEL,
    quantity: FOLLOW_LABEL,
    dilution: FOLLOW_LABEL,
    contactTime: FOLLOW_LABEL,
    temperature: "Never above the care-label maximum wash temperature",
    rinsing: "Rinse thoroughly with cool water until no detergent remains",
    warnings: ["UK formulation differs from other markets"],
    incompatibilities: ["Chlorine bleach"],
    storage: "Per label",
    sourceDocuments: [
      { id: "SRC-HHP-0006", kind: "product_label", reference: "Current UK label of the detergent selected by the user", country: "GB" },
    ],
    verification: "verified",
    reviewDate: "2026-02-01",
    nextReviewDate: "2027-02-01",
    status: "active",
    materialClass: "labelled_laundry_detergent",
  }),
];

export const HOUSEHOLD_BY_KEY: Record<string, HouseholdProduct> = Object.fromEntries(
  HOUSEHOLD_PRODUCTS.map((p) => [p.key, p]),
);
