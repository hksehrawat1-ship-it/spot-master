export type StainCategory =
  | "Combination Stains"
  | "Oil / Grease-Based Stains"
  | "Water-Based Stains"
  | "Dye-Based / Tannin Stains"
  | "Protein-Based Stains"
  | "Particulate (Solid) Stains"
  | "Pigment / Paint Stains"
  | "Dye Transfer / Color Bleeding"
  | "Oxidizable Stains"
  | "Heat-Set / Aged Stains"
  | "Reducible (Metal/Rust) Stains"
  | "Chemical Stains / Fabric Damage";

export interface Stain {
  id: string;
  name: string;
  category: StainCategory;
  subgroup?: string;
  description: string;
  treatment: string;
  caution?: string;
}

export const STAIN_CATEGORIES: { name: StainCategory; emoji: string; blurb: string }[] = [
  { name: "Combination Stains", emoji: "🧪", blurb: "Mixed origin (e.g. lipstick, makeup)" },
  { name: "Oil / Grease-Based Stains", emoji: "🛢️", blurb: "Butter, motor oil, salad dressing" },
  { name: "Water-Based Stains", emoji: "💧", blurb: "Juice, soft drinks, sweat" },
  { name: "Dye-Based / Tannin Stains", emoji: "🍷", blurb: "Tea, coffee, wine, fruit" },
  { name: "Protein-Based Stains", emoji: "🥚", blurb: "Blood, egg, milk, dairy" },
  { name: "Particulate (Solid) Stains", emoji: "🧱", blurb: "Mud, clay, soot, dust" },
  { name: "Pigment / Paint Stains", emoji: "🎨", blurb: "Acrylic, latex, oil paints" },
  { name: "Dye Transfer / Color Bleeding", emoji: "🌈", blurb: "Color run between fabrics" },
  { name: "Oxidizable Stains", emoji: "🧴", blurb: "Yellowing, perspiration, deodorant" },
  { name: "Heat-Set / Aged Stains", emoji: "🔥", blurb: "Old or iron-set stains" },
  { name: "Reducible (Metal/Rust) Stains", emoji: "🪤", blurb: "Rust, iron, mineral deposits" },
  { name: "Chemical Stains / Fabric Damage", emoji: "⚠️", blurb: "Bleach, acid, chlorine spots" },
];

export const STAINS: Stain[] = [
  // Combination
  { id: "lipstick", name: "Lipstick", category: "Combination Stains",
    description: "Wax + oil + dye combination, embeds into fibers.",
    treatment: "Pre-treat with solvent spotter, then alkaline detergent, finish with oxygen bleach if needed.",
    caution: "Do not rub — spreads pigment." },
  { id: "makeup", name: "Foundation / Makeup", category: "Combination Stains",
    description: "Oils, pigments and silicones blended.",
    treatment: "Apply solvent (POG), tamp gently, flush, then wash with warm water + detergent." },
  { id: "mascara", name: "Mascara", category: "Combination Stains",
    description: "Wax, oil and carbon pigment.",
    treatment: "Solvent first, then enzyme detergent. Repeat before drying." },

  // Oil / Grease
  { id: "butter", name: "Butter / Cooking Oil", category: "Oil / Grease-Based Stains",
    description: "Animal/vegetable fats absorbed into fibers.",
    treatment: "Blot, dust with talc/cornstarch, apply degreaser, hot wash with detergent." },
  { id: "motor-oil", name: "Motor Oil / Grease", category: "Oil / Grease-Based Stains",
    description: "Heavy hydrocarbon stain with dirt particles.",
    treatment: "Solvent (perchloroethylene or POG) → emulsifier → hot wash." },
  { id: "salad-dressing", name: "Salad Dressing", category: "Oil / Grease-Based Stains",
    description: "Oil + vinegar + spices.",
    treatment: "Pre-treat with dish soap, soak 15 min, wash warm." },

  // Water-based
  { id: "juice", name: "Fruit Juice", category: "Water-Based Stains",
    description: "Sugar + tannin in water solution.",
    treatment: "Cold water flush immediately, then enzyme detergent.",
    caution: "Hot water sets sugar stains." },
  { id: "soda", name: "Soft Drink / Cola", category: "Water-Based Stains",
    description: "Sugar, caramel color, acids.",
    treatment: "Cold rinse, detergent + oxygen bleach soak." },
  { id: "sweat", name: "Sweat / Perspiration", category: "Water-Based Stains",
    description: "Salts + body oils causing yellowing.",
    treatment: "Pre-treat with enzyme + oxygen booster, wash warm." },

  // Tannin / Dye
  { id: "coffee", name: "Coffee", category: "Dye-Based / Tannin Stains",
    description: "Tannin pigment, sometimes with milk/sugar.",
    treatment: "Cold water flush, tannin spotter, oxygen bleach soak." },
  { id: "tea", name: "Tea", category: "Dye-Based / Tannin Stains",
    description: "Strong tannin pigment.",
    treatment: "Flush cold, treat with vinegar solution, wash with oxygen bleach." },
  { id: "red-wine", name: "Red Wine", category: "Dye-Based / Tannin Stains",
    description: "Anthocyanin dye + tannin.",
    treatment: "Blot, salt or club soda, then oxygen bleach soak." },

  // Protein
  { id: "blood", name: "Blood", category: "Protein-Based Stains",
    description: "Hemoglobin protein — coagulates with heat.",
    treatment: "Cold water rinse, enzyme detergent soak, then wash.",
    caution: "Never use hot water before removal." },
  { id: "egg", name: "Egg", category: "Protein-Based Stains",
    description: "Albumin protein.",
    treatment: "Scrape, cold soak with enzyme detergent, then wash." },
  { id: "milk", name: "Milk / Dairy", category: "Protein-Based Stains",
    description: "Protein + fat mixture.",
    treatment: "Cold rinse, enzyme pre-soak, warm wash." },

  // Particulate
  { id: "mud", name: "Mud / Clay", category: "Particulate (Solid) Stains",
    description: "Soil particles bonded to fiber.",
    treatment: "Allow to dry, brush off, then wash with detergent + builder." },
  { id: "soot", name: "Soot / Ash", category: "Particulate (Solid) Stains",
    description: "Fine carbon particles.",
    treatment: "Vacuum first, do NOT rub. Pre-treat with dry-side solvent, then wet wash." },

  // Pigment / Paint
  { id: "acrylic-paint", name: "Acrylic Paint", category: "Pigment / Paint Stains",
    description: "Water-based polymer pigment.",
    treatment: "Treat while wet — flush cold, dish soap, repeat. Dried = isopropyl alcohol." },
  { id: "oil-paint", name: "Oil Paint", category: "Pigment / Paint Stains",
    description: "Linseed/oil binder + pigment.",
    treatment: "Turpentine or paint thinner from back, then detergent wash.",
    caution: "Test for colorfastness." },

  // Dye transfer
  { id: "color-bleed", name: "Color Bleed", category: "Dye Transfer / Color Bleeding",
    description: "Dye migrated from another garment.",
    treatment: "Re-wash immediately with color-run remover. Do not dry until removed." },

  // Oxidizable
  { id: "yellowing", name: "Yellowing / Aging", category: "Oxidizable Stains",
    description: "Oxidation of residues over time.",
    treatment: "Oxygen bleach soak, optical brightener wash." },
  { id: "deodorant", name: "Deodorant / Antiperspirant", category: "Oxidizable Stains",
    description: "Aluminum + sweat reaction → yellow.",
    treatment: "Enzyme + oxygen bleach soak, brush, wash hot." },

  // Heat-set / aged
  { id: "set-stain", name: "Iron-Set Stain", category: "Heat-Set / Aged Stains",
    description: "Stain locked in by heat (dryer or iron).",
    treatment: "Soak in oxygen bleach overnight, repeat wash. Often permanent." },

  // Rust / metal
  { id: "rust", name: "Rust", category: "Reducible (Metal/Rust) Stains",
    description: "Iron oxide deposit.",
    treatment: "Use rust remover (oxalic acid based). Rinse thoroughly.",
    caution: "Never use chlorine bleach — sets rust permanently." },

  // Chemical / damage
  { id: "bleach-spot", name: "Bleach Spot", category: "Chemical Stains / Fabric Damage",
    description: "Color stripped from fabric.",
    treatment: "Cannot be reversed — re-dye or fabric pen for touch-up." },
  { id: "acid-burn", name: "Acid Burn", category: "Chemical Stains / Fabric Damage",
    description: "Acid weakened fibers.",
    treatment: "Neutralize with mild alkali (baking soda solution) immediately. Damage usually permanent." },
];
