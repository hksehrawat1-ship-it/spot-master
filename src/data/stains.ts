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
  // ============ Combination Stains ============
  // 🍛 Food-Based
  { id: "curry", name: "Curry", category: "Combination Stains", subgroup: "🍛 Food-Based",
    description: "Oil + turmeric dye + spices — bonds tightly to fibers and stains yellow.",
    treatment: "Blot excess, apply glycerin or dish soap for 10 min, rinse cold, then oxygen bleach soak. Sun-dry to fade turmeric.",
    caution: "Do not use alkaline detergent first — turns turmeric red." },
  { id: "gravy", name: "Gravy", category: "Combination Stains", subgroup: "🍛 Food-Based",
    description: "Oil, protein and spices.",
    treatment: "Scrape, pre-treat with enzyme + degreaser, warm wash." },
  { id: "butter-chicken", name: "Butter Chicken / Paneer Gravy", category: "Combination Stains", subgroup: "🍛 Food-Based",
    description: "Heavy oil + tomato dye + dairy protein.",
    treatment: "Degreaser first, then enzyme detergent soak, warm wash + oxygen bleach." },
  { id: "biryani", name: "Biryani", category: "Combination Stains", subgroup: "🍛 Food-Based",
    description: "Ghee + saffron/turmeric + masala.",
    treatment: "Glycerin pre-treat, dish soap, oxygen bleach soak. Sun-dry." },
  { id: "pizza", name: "Pizza", category: "Combination Stains", subgroup: "🍛 Food-Based",
    description: "Oil + cheese + tomato sauce.",
    treatment: "Scrape cheese, blot oil with talc, degreaser, then enzyme detergent wash." },
  { id: "burger", name: "Burger", category: "Combination Stains", subgroup: "🍛 Food-Based",
    description: "Oil + sauce + protein mix.",
    treatment: "Scrape, enzyme + degreaser pre-treat, warm wash." },
  { id: "samosa", name: "Samosa / Pakoda Oil", category: "Combination Stains", subgroup: "🍛 Food-Based",
    description: "Deep-fry oil with masala particles.",
    treatment: "Talc to absorb oil, dish soap, hot wash with detergent." },
  { id: "chutney", name: "Chutney", category: "Combination Stains", subgroup: "🍛 Food-Based",
    description: "Herb/fruit dye + oil + spice.",
    treatment: "Cold flush, oxygen bleach soak, enzyme wash." },
  { id: "ketchup", name: "Ketchup", category: "Combination Stains", subgroup: "🍛 Food-Based",
    description: "Tomato dye + sugar + vinegar.",
    treatment: "Cold rinse from back, dish soap, oxygen bleach soak.",
    caution: "Hot water sets tomato pigment." },
  { id: "mayo", name: "Mayonnaise", category: "Combination Stains", subgroup: "🍛 Food-Based",
    description: "Oil + egg protein.",
    treatment: "Scrape, cold rinse, enzyme detergent + degreaser, warm wash." },
  { id: "salad-dressing-c", name: "Salad Dressing", category: "Combination Stains", subgroup: "🍛 Food-Based",
    description: "Oil, vinegar, herbs.",
    treatment: "Dish soap pre-treat 15 min, warm wash." },
  { id: "soy-sauce", name: "Soy Sauce", category: "Combination Stains", subgroup: "🍛 Food-Based",
    description: "Dark dye + salt + protein.",
    treatment: "Cold rinse immediately, enzyme soak, oxygen bleach if needed." },
  { id: "chocolate", name: "Chocolate", category: "Combination Stains", subgroup: "🍛 Food-Based",
    description: "Fat + protein + sugar.",
    treatment: "Scrape, cold rinse, enzyme + degreaser, warm wash." },
  { id: "ice-cream", name: "Ice Cream", category: "Combination Stains", subgroup: "🍛 Food-Based",
    description: "Dairy protein + fat + sugar + dye.",
    treatment: "Cold soak with enzyme detergent, then warm wash." },
  { id: "cheese", name: "Cheese", category: "Combination Stains", subgroup: "🍛 Food-Based",
    description: "Fat + protein.",
    treatment: "Scrape, enzyme pre-treat, degreaser, warm wash." },
  { id: "milkshake", name: "Milkshake", category: "Combination Stains", subgroup: "🍛 Food-Based",
    description: "Dairy + sugar + flavor dye.",
    treatment: "Cold enzyme soak, warm wash with oxygen booster." },

  // 🍷 Beverage-Based
  { id: "tea-milk", name: "Tea with Milk", category: "Combination Stains", subgroup: "🍷 Beverage-Based",
    description: "Tannin + dairy protein.",
    treatment: "Cold flush, enzyme soak, then tannin spotter + oxygen bleach." },
  { id: "coffee-cream", name: "Coffee with Milk/Cream", category: "Combination Stains", subgroup: "🍷 Beverage-Based",
    description: "Tannin + protein + fat.",
    treatment: "Cold rinse, enzyme detergent, oxygen bleach soak." },
  { id: "flavored-drink", name: "Flavored Drink (sugar + dye)", category: "Combination Stains", subgroup: "🍷 Beverage-Based",
    description: "Synthetic dye + sugar.",
    treatment: "Cold rinse, oxygen bleach soak, normal wash.",
    caution: "Avoid hot water — sets sugar." },
  { id: "cocktail", name: "Cocktail (alcohol + mixer)", category: "Combination Stains", subgroup: "🍷 Beverage-Based",
    description: "Alcohol + sugar + fruit dye.",
    treatment: "Blot, cold flush, oxygen bleach soak, enzyme wash." },
  { id: "juice-pulp", name: "Fruit Juice with Pulp", category: "Combination Stains", subgroup: "🍷 Beverage-Based",
    description: "Tannin dye + fiber + sugar.",
    treatment: "Scrape pulp, cold flush, enzyme + oxygen bleach soak." },

  // 💄 Cosmetic
  { id: "foundation", name: "Foundation", category: "Combination Stains", subgroup: "💄 Cosmetic & Personal Care",
    description: "Oil + pigment + silicone.",
    treatment: "Solvent (POG) pre-treat, dish soap, warm wash." },
  { id: "lipstick", name: "Lipstick", category: "Combination Stains", subgroup: "💄 Cosmetic & Personal Care",
    description: "Wax + oil + dye, embeds into fibers.",
    treatment: "Solvent spotter, then alkaline detergent, finish with oxygen bleach.",
    caution: "Do not rub — spreads pigment." },
  { id: "kajal", name: "Kajal / Eyeliner", category: "Combination Stains", subgroup: "💄 Cosmetic & Personal Care",
    description: "Carbon pigment + oil/wax.",
    treatment: "Solvent first, then enzyme detergent. Repeat before drying." },
  { id: "sunscreen", name: "Sunscreen", category: "Combination Stains", subgroup: "💄 Cosmetic & Personal Care",
    description: "Oil + zinc/avobenzone — leaves yellow stain.",
    treatment: "Dish soap + oxygen bleach pre-soak, hot wash." },
  { id: "lotion", name: "Lotion / Cream", category: "Combination Stains", subgroup: "💄 Cosmetic & Personal Care",
    description: "Oil-in-water emulsion with fragrance.",
    treatment: "Degreaser pre-treat, warm wash with detergent." },
  { id: "hair-gel", name: "Hair Gel + Dust", category: "Combination Stains", subgroup: "💄 Cosmetic & Personal Care",
    description: "Polymer resin + trapped particulate.",
    treatment: "Soak warm with detergent + enzyme, brush gently, rinse, wash." },
  { id: "deo-sweat", name: "Deodorant + Sweat", category: "Combination Stains", subgroup: "💄 Cosmetic & Personal Care",
    description: "Aluminum salts + protein → yellow.",
    treatment: "Enzyme + oxygen bleach soak, brush, hot wash." },
  { id: "perfume-oil", name: "Perfume + Body Oils", category: "Combination Stains", subgroup: "💄 Cosmetic & Personal Care",
    description: "Alcohol + oils + dye.",
    treatment: "Pre-treat with degreaser, oxygen bleach soak, warm wash." },

  // 🧑‍🔧 Daily Life
  { id: "yellow-pits", name: "Sweat + Deodorant Yellowing", category: "Combination Stains", subgroup: "🧑‍🔧 Daily Life",
    description: "Set-in yellow under arms.",
    treatment: "Soak overnight in oxygen bleach + enzyme. Repeat hot wash." },
  { id: "collar-cuff", name: "Collar / Cuff Dirt", category: "Combination Stains", subgroup: "🧑‍🔧 Daily Life",
    description: "Body oil + dust + sweat.",
    treatment: "Brush with detergent paste, soak warm with enzyme + degreaser, hot wash." },
  { id: "shoe-dirt", name: "Shoe Dirt", category: "Combination Stains", subgroup: "🧑‍🔧 Daily Life",
    description: "Mud + grease.",
    treatment: "Let dry, brush off, then degreaser + detergent warm wash." },
  { id: "road-grime", name: "Road Grime", category: "Combination Stains", subgroup: "🧑‍🔧 Daily Life",
    description: "Oil + carbon + dust.",
    treatment: "Solvent pre-treat, then heavy-duty detergent hot wash." },
  { id: "kitchen-cloth", name: "Kitchen Cloth Mix", category: "Combination Stains", subgroup: "🧑‍🔧 Daily Life",
    description: "Oil + food + dye build-up.",
    treatment: "Boil-soak with detergent + oxygen bleach, then hot wash." },

  // 🖍️ Industrial
  { id: "printing-ink", name: "Printing Ink", category: "Combination Stains", subgroup: "🖍️ Industrial / Complex",
    description: "Pigment + solvent + resin.",
    treatment: "Apply solvent (IPA or POG) from back, blot, then detergent wash.",
    caution: "Test colorfastness first." },
  { id: "paint-mix", name: "Paint (mixed)", category: "Combination Stains", subgroup: "🖍️ Industrial / Complex",
    description: "Binder + pigment + oil/water base.",
    treatment: "Wet: dish soap + cold flush. Dried: solvent (turpentine for oil, IPA for acrylic)." },
  { id: "adhesive", name: "Adhesives / Glue", category: "Combination Stains", subgroup: "🖍️ Industrial / Complex",
    description: "Resin + dirt embedded.",
    treatment: "Freeze to harden, scrape, apply solvent (acetone-safe fabric only), then wash." },
  { id: "grease-metal", name: "Grease + Metal Dust", category: "Combination Stains", subgroup: "🖍️ Industrial / Complex",
    description: "Heavy workwear soiling.",
    treatment: "Solvent degreaser, brush, hot wash with heavy-duty detergent." },
  { id: "tar-dirt", name: "Tar + Dirt", category: "Combination Stains", subgroup: "🖍️ Industrial / Complex",
    description: "Sticky hydrocarbon + particulate.",
    treatment: "Apply oil/butter to soften tar, scrape, then solvent + degreaser, hot wash." },
  { id: "wax-dye", name: "Wax + Dye (Candle)", category: "Combination Stains", subgroup: "🖍️ Industrial / Complex",
    description: "Paraffin wax with colored dye.",
    treatment: "Freeze, scrape, iron between paper towels to absorb wax, then oxygen bleach soak for dye." },

  // 🧒 Misc / Rare
  { id: "baby-food", name: "Baby Food", category: "Combination Stains", subgroup: "🧒 Miscellaneous / Rare",
    description: "Protein + oil + dye.",
    treatment: "Cold rinse, enzyme soak, warm wash." },
  { id: "pet-stain", name: "Pet Stain", category: "Combination Stains", subgroup: "🧒 Miscellaneous / Rare",
    description: "Protein + bacteria + dirt.",
    treatment: "Enzyme cleaner soak, disinfect with oxygen bleach, warm wash." },
  { id: "vomit", name: "Vomit", category: "Combination Stains", subgroup: "🧒 Miscellaneous / Rare",
    description: "Protein + acid + food residue.",
    treatment: "Scrape, cold rinse, enzyme + oxygen bleach soak, warm wash.",
    caution: "Neutralize acid quickly to avoid fiber damage." },
  { id: "blood-dirt", name: "Blood + Dirt", category: "Combination Stains", subgroup: "🧒 Miscellaneous / Rare",
    description: "Protein + particulate (accident stains).",
    treatment: "Cold water rinse, enzyme soak, brush off dirt, then oxygen bleach.",
    caution: "Never use hot water before protein removal." },
  { id: "mold", name: "Mold + Organic Residue", category: "Combination Stains", subgroup: "🧒 Miscellaneous / Rare",
    description: "Fungal growth with stain residue.",
    treatment: "Brush off in open air, soak in oxygen bleach + vinegar, hot wash. Sun-dry." },

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
