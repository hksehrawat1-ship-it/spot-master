/**
 * Step 3 — Stain Identification knowledge base.
 * IDENTIFICATION AND CLASSIFICATION ONLY.
 * No treatment instructions, chemistry procedures or product names are stored here.
 */

export type IdCategoryKey =
  | "water_soluble"
  | "oil_grease"
  | "protein"
  | "tannin_plant"
  | "pigment_particulate"
  | "dye_ink"
  | "paint_polymer"
  | "oxidizable"
  | "reducible"
  | "metal_rust"
  | "biological"
  | "combination_unknown";

export const ID_CATEGORIES: {
  key: IdCategoryKey;
  label: string;
  subtitle: string;
  examples: string;
  technical?: boolean;
}[] = [
  { key: "water_soluble", label: "Water-Soluble", subtitle: "Dissolves in water", examples: "Soft drink, fruit squash, sugar syrup, salt marks" },
  { key: "oil_grease", label: "Oil and Grease-Based", subtitle: "Feels oily or greasy", examples: "Cooking oil, ghee, butter, motor oil, hair oil" },
  { key: "protein", label: "Protein-Based", subtitle: "From the body or from food", examples: "Blood, egg, milk, sweat, vomit" },
  { key: "tannin_plant", label: "Tannin and Plant-Based", subtitle: "From plants, tea and fruit", examples: "Tea, coffee, wine, fruit juice, grass" },
  { key: "pigment_particulate", label: "Pigment and Particulate", subtitle: "Solid particles sitting in the fibres", examples: "Mud, soot, dust, powder, kajal" },
  { key: "dye_ink", label: "Dye and Ink-Based", subtitle: "Strong colour that soaks in", examples: "Ballpoint ink, marker, hair dye, mehndi" },
  { key: "paint_polymer", label: "Paint, Resin, Adhesive and Polymer", subtitle: "Dries into a film or a hard layer", examples: "Paint, glue, chewing gum, nail polish" },
  { key: "oxidizable", label: "Oxidizable", subtitle: "Yellowing or darkening with age", examples: "Old yellow marks, aged collar marks", technical: true },
  { key: "reducible", label: "Reducible", subtitle: "Certain metal-related discolouration", examples: "Some rust-like marks", technical: true },
  { key: "metal_rust", label: "Metal, Rust and Mineral", subtitle: "Orange, brown or chalky marks", examples: "Rust, hard-water marks, metal transfer" },
  { key: "biological", label: "Biological", subtitle: "Living or decaying material", examples: "Mould, mildew, animal waste" },
  { key: "combination_unknown", label: "Combination or Unknown", subtitle: "More than one component, or not known", examples: "Curry, lipstick, gravy, unknown marks" },
];

export const CATEGORY_LABEL: Record<IdCategoryKey, string> = Object.fromEntries(
  ID_CATEGORIES.map((c) => [c.key, c.label]),
) as Record<IdCategoryKey, string>;

/* ---------------- Source groups (navigation metadata only) ---------------- */

export type SourceKey =
  | "food" | "drinks" | "cooking" | "body" | "cosmetics" | "ink" | "paint"
  | "oil_machinery" | "soil" | "plants" | "medicine" | "household_chem"
  | "metal" | "dye_transfer" | "mould" | "adhesive" | "unknown_source";

export const SOURCE_GROUPS: { key: SourceKey; label: string; icon: string }[] = [
  { key: "food", label: "Food", icon: "🍛" },
  { key: "drinks", label: "Drinks", icon: "🥤" },
  { key: "cooking", label: "Cooking", icon: "🍳" },
  { key: "body", label: "Body fluids", icon: "🫀" },
  { key: "cosmetics", label: "Cosmetics and personal care", icon: "💄" },
  { key: "ink", label: "Ink and stationery", icon: "🖊️" },
  { key: "paint", label: "Paint and construction", icon: "🎨" },
  { key: "oil_machinery", label: "Oil and machinery", icon: "⚙️" },
  { key: "soil", label: "Soil, mud and outdoor dirt", icon: "🪨" },
  { key: "plants", label: "Plants and grass", icon: "🌿" },
  { key: "medicine", label: "Medicine", icon: "💊" },
  { key: "household_chem", label: "Household chemicals", icon: "🧴" },
  { key: "metal", label: "Metal and rust", icon: "🔩" },
  { key: "dye_transfer", label: "Dye transfer", icon: "🌈" },
  { key: "mould", label: "Mould and biological contamination", icon: "🦠" },
  { key: "adhesive", label: "Adhesive and gum", icon: "🩹" },
  { key: "unknown_source", label: "Unknown source", icon: "❓" },
];

export const SOURCE_LABEL: Record<SourceKey, string> = Object.fromEntries(
  SOURCE_GROUPS.map((s) => [s.key, s.label]),
) as Record<SourceKey, string>;

/* ---------------- Stain records ---------------- */

export type StainRecord = {
  id: string;
  name: string;
  alt: string[];
  local: string[];
  sources: SourceKey[];
  category: IdCategoryKey;
  /** Components present in addition to the primary category. */
  secondary: IdCategoryKey[];
  /** Placeholder only — treatment sequencing is defined in a later step. */
  stageSequencePlaceholder?: string;
  colours: string[];
  textures: string[];
  locations: string[];
  typicalSources: string;
  plain: string;
  icon: string;
  /** Identification flags */
  biological?: boolean;
  hazardCandidate?: boolean;
  damageRoute?: boolean;
};

const S = (r: StainRecord) => r;

export const STAIN_RECORDS: StainRecord[] = [
  S({
    id: "blood", name: "Blood", alt: ["Dried blood", "Blood spot"], local: ["Khoon", "Rakt"],
    sources: ["body"], category: "protein", secondary: ["pigment_particulate"],
    stageSequencePlaceholder: "protein-first sequence (defined in a later step)",
    colours: ["Red", "Brown", "Black"], textures: ["Wet", "Crusty", "Hard"],
    locations: ["Chest or front", "Sleeve", "Cuff", "Knee", "Other"],
    typicalSources: "Cuts, nosebleed, medical care, menstruation",
    plain: "A body-fluid mark that darkens from red to brown as it ages.",
    icon: "🩸", biological: true,
  }),
  S({
    id: "tea", name: "Tea", alt: ["Chai", "Tea spill", "Milk tea"], local: ["Chai", "Chaay"],
    sources: ["drinks"], category: "tannin_plant", secondary: ["protein"],
    colours: ["Brown", "Orange", "Yellow"], textures: ["Wet", "No texture"],
    locations: ["Chest or front", "Sleeve", "Pocket", "Other"],
    typicalSources: "Cups, flasks, tea service spills",
    plain: "A light brown drink mark, often with a darker edge ring.",
    icon: "🍵",
  }),
  S({
    id: "coffee", name: "Coffee", alt: ["Espresso", "Latte", "Cappuccino"], local: ["Kaapi", "Coffee"],
    sources: ["drinks"], category: "tannin_plant", secondary: ["protein"],
    colours: ["Brown", "Black"], textures: ["Wet", "No texture"],
    locations: ["Chest or front", "Sleeve", "Pocket", "Other"],
    typicalSources: "Cups, mugs, coffee machines",
    plain: "A brown drink mark, usually darker than tea, often with a ring edge.",
    icon: "☕",
  }),
  S({
    id: "red_wine", name: "Red wine", alt: ["Wine"], local: ["Sharab", "Madira"],
    sources: ["drinks"], category: "tannin_plant", secondary: ["dye_ink"],
    colours: ["Red", "Purple", "Brown"], textures: ["Wet", "No texture"],
    locations: ["Chest or front", "Sleeve", "Other"],
    typicalSources: "Glasses, bottles, dining spills",
    plain: "A red to purple drink mark that turns brownish with age.",
    icon: "🍷",
  }),
  S({
    id: "turmeric", name: "Turmeric", alt: ["Haldi", "Turmeric powder", "Turmeric paste"], local: ["Haldi", "Manjal", "Halad", "Pasupu"],
    sources: ["food", "cooking"], category: "dye_ink", secondary: ["pigment_particulate", "oil_grease"],
    colours: ["Yellow", "Orange"], textures: ["Powdery", "Oily", "No texture"],
    locations: ["Chest or front", "Sleeve", "Cuff", "Hem", "Other"],
    typicalSources: "Cooking, haldi ceremonies, spice handling",
    plain: "A strong yellow mark from turmeric, often with an orange edge.",
    icon: "🟡",
  }),
  S({
    id: "curry", name: "Curry", alt: ["Gravy", "Masala", "Sabzi splash"], local: ["Curry", "Masala", "Tari"],
    sources: ["food", "cooking"], category: "combination_unknown",
    secondary: ["oil_grease", "dye_ink", "protein", "pigment_particulate"],
    stageSequencePlaceholder: "multi-component sequence (defined in a later step)",
    colours: ["Yellow", "Orange", "Brown", "Red", "Multiple colours"], textures: ["Oily", "Greasy", "Crusty"],
    locations: ["Chest or front", "Sleeve", "Cuff", "Hem", "Other"],
    typicalSources: "Meals, cooking splashes, food delivery leaks",
    plain: "A mixed food mark with oil, spice colour and food residue together.",
    icon: "🍛",
  }),
  S({
    id: "cooking_oil", name: "Cooking oil", alt: ["Vegetable oil", "Frying oil", "Refined oil"], local: ["Tel", "Sarson ka tel", "Mustard oil"],
    sources: ["cooking", "food"], category: "oil_grease", secondary: [],
    colours: ["Clear or colourless", "Yellow", "Not sure"], textures: ["Oily", "Greasy", "Shiny"],
    locations: ["Chest or front", "Sleeve", "Hem", "Pocket", "Other"],
    typicalSources: "Frying, food packaging, kitchen work",
    plain: "A darker, see-through oily patch with no strong colour of its own.",
    icon: "🫗",
  }),
  S({
    id: "ghee_butter", name: "Butter or ghee", alt: ["Ghee", "Butter", "Margarine"], local: ["Ghee", "Makkhan", "Tup"],
    sources: ["cooking", "food"], category: "oil_grease", secondary: ["protein"],
    colours: ["Yellow", "Clear or colourless"], textures: ["Greasy", "Waxy", "Oily"],
    locations: ["Chest or front", "Sleeve", "Cuff", "Other"],
    typicalSources: "Cooking, parathas, sweets, dairy handling",
    plain: "A yellowish greasy mark that may feel slightly waxy when cold.",
    icon: "🧈",
  }),
  S({
    id: "motor_oil", name: "Motor oil", alt: ["Engine oil", "Grease", "Machine oil", "Chain oil"], local: ["Mobil oil", "Grease"],
    sources: ["oil_machinery"], category: "oil_grease", secondary: ["pigment_particulate"],
    colours: ["Black", "Brown", "Grey"], textures: ["Oily", "Greasy", "Sticky"],
    locations: ["Knee", "Hem", "Pocket", "Sleeve", "Seat", "Other"],
    typicalSources: "Vehicles, machinery, workshops, chains",
    plain: "A dark greasy mark with a strong oily or fuel-like smell.",
    icon: "⚙️",
  }),
  S({
    id: "ballpoint_ink", name: "Ballpoint ink", alt: ["Pen ink", "Biro", "Ink leak"], local: ["Pen ki syahi", "Syahi"],
    sources: ["ink"], category: "dye_ink", secondary: ["oil_grease"],
    colours: ["Blue", "Black", "Red"], textures: ["No texture", "Shiny"],
    locations: ["Pocket", "Chest or front", "Cuff", "Sleeve", "Other"],
    typicalSources: "Pens left in pockets, writing, leaking refills",
    plain: "A blue or black line or blot, often near a pocket.",
    icon: "🖊️",
  }),
  S({
    id: "permanent_marker", name: "Permanent marker", alt: ["Marker pen", "Sketch pen", "Whiteboard marker"], local: ["Marker"],
    sources: ["ink"], category: "dye_ink", secondary: [],
    colours: ["Black", "Blue", "Red", "Green"], textures: ["No texture"],
    locations: ["Chest or front", "Sleeve", "Pocket", "Other"],
    typicalSources: "Labelling, school and office work, packaging",
    plain: "A solid, sharply defined coloured mark that has soaked into the fibres.",
    icon: "🖍️",
  }),
  S({
    id: "lipstick", name: "Lipstick", alt: ["Lip colour", "Lip balm tint"], local: ["Lipstick"],
    sources: ["cosmetics"], category: "combination_unknown",
    secondary: ["oil_grease", "pigment_particulate", "dye_ink"],
    stageSequencePlaceholder: "multi-component sequence (defined in a later step)",
    colours: ["Red", "Purple", "Brown", "Orange"], textures: ["Waxy", "Greasy", "Shiny"],
    locations: ["Collar", "Chest or front", "Cuff", "Sleeve", "Other"],
    typicalSources: "Cosmetics, transfer while dressing, contact",
    plain: "A waxy coloured smear that combines oil, wax and pigment.",
    icon: "💄",
  }),
  S({
    id: "foundation", name: "Foundation makeup", alt: ["Makeup", "BB cream", "Concealer", "Compact"], local: ["Makeup"],
    sources: ["cosmetics"], category: "combination_unknown",
    secondary: ["oil_grease", "pigment_particulate", "paint_polymer"],
    colours: ["Brown", "Orange", "Yellow", "Grey"], textures: ["Greasy", "Powdery", "Paint-like film"],
    locations: ["Collar", "Chest or front", "Cuff", "Other"],
    typicalSources: "Cosmetics transfer at the neckline and collar",
    plain: "A skin-toned smear that may be oily, powdery or both.",
    icon: "🧴",
  }),
  S({
    id: "nail_polish", name: "Nail polish", alt: ["Nail paint", "Nail enamel"], local: ["Nail polish"],
    sources: ["cosmetics"], category: "paint_polymer", secondary: ["pigment_particulate", "dye_ink"],
    colours: ["Red", "Purple", "Black", "Multiple colours"], textures: ["Paint-like film", "Hard", "Shiny"],
    locations: ["Chest or front", "Sleeve", "Hem", "Other"],
    typicalSources: "Nail products spilled or brushed against fabric",
    plain: "A hard, shiny film of colour sitting on the surface of the fabric.",
    icon: "💅",
  }),
  S({
    id: "hair_dye", name: "Hair dye", alt: ["Hair colour", "Henna dye"], local: ["Baalon ka rang", "Hair colour"],
    sources: ["cosmetics"], category: "dye_ink", secondary: ["oxidizable"],
    colours: ["Black", "Brown", "Red", "Orange"], textures: ["No texture", "Crusty"],
    locations: ["Collar", "Chest or front", "Sleeve", "Other"],
    typicalSources: "Salon and home hair colouring",
    plain: "A dark colour mark, usually around the collar and shoulders.",
    icon: "🎨",
  }),
  S({
    id: "mehndi", name: "Mehndi / henna", alt: ["Henna", "Heena"], local: ["Mehndi", "Mehandi", "Heena"],
    sources: ["cosmetics", "plants"], category: "dye_ink", secondary: ["tannin_plant"],
    colours: ["Brown", "Orange", "Red"], textures: ["Crusty", "Powdery", "No texture"],
    locations: ["Cuff", "Sleeve", "Hem", "Chest or front", "Other"],
    typicalSources: "Henna application, ceremonies, cones",
    plain: "An orange to deep brown plant-dye mark, often near sleeves and cuffs.",
    icon: "🌿",
  }),
  S({
    id: "paan_gutka", name: "Paan or gutka", alt: ["Betel", "Supari", "Tobacco spit"], local: ["Paan", "Gutka", "Katha", "Supari"],
    sources: ["food"], category: "tannin_plant", secondary: ["dye_ink", "pigment_particulate"],
    colours: ["Red", "Brown", "Orange"], textures: ["Sticky", "Crusty"],
    locations: ["Chest or front", "Collar", "Sleeve", "Other"],
    typicalSources: "Betel and tobacco chewing, splashes",
    plain: "A red-brown sticky mark from betel or tobacco preparations.",
    icon: "🍂",
  }),
  S({
    id: "mud", name: "Mud", alt: ["Soil", "Dirt", "Clay", "Slush"], local: ["Mitti", "Keechad"],
    sources: ["soil"], category: "pigment_particulate", secondary: [],
    colours: ["Brown", "Grey", "Orange", "Black"], textures: ["Mud-like", "Powdery", "Crusty"],
    locations: ["Hem", "Knee", "Seat", "Sleeve", "Other"],
    typicalSources: "Roads, rain, fields, playgrounds",
    plain: "A gritty earth mark made of solid particles held in the fibres.",
    icon: "🪨",
  }),
  S({
    id: "grass", name: "Grass", alt: ["Grass smear", "Leaf stain"], local: ["Ghaas"],
    sources: ["plants"], category: "tannin_plant", secondary: ["pigment_particulate"],
    colours: ["Green", "Brown"], textures: ["No texture", "Crusty"],
    locations: ["Knee", "Seat", "Hem", "Sleeve", "Other"],
    typicalSources: "Sport, gardening, sitting on grass",
    plain: "A green plant mark, usually at the knees or seat.",
    icon: "🌱",
  }),
  S({
    id: "rust", name: "Rust", alt: ["Iron mark", "Metal transfer"], local: ["Zang", "Jung"],
    sources: ["metal"], category: "metal_rust", secondary: ["reducible"],
    colours: ["Orange", "Brown", "Red"], textures: ["Crusty", "Powdery", "No texture"],
    locations: ["Hem", "Pocket", "Seat", "Collar", "Other"],
    typicalSources: "Metal hangers, railings, wet metal, water pipes",
    plain: "An orange-brown mark, usually where the fabric touched metal.",
    icon: "🔩",
  }),
  S({
    id: "paint", name: "Paint", alt: ["Wall paint", "Emulsion", "Enamel", "Distemper"], local: ["Rang", "Paint"],
    sources: ["paint"], category: "paint_polymer", secondary: ["pigment_particulate"],
    colours: ["White", "Blue", "Green", "Multiple colours", "Not sure"], textures: ["Paint-like film", "Hard", "Crusty"],
    locations: ["Sleeve", "Chest or front", "Hem", "Knee", "Other"],
    typicalSources: "Painting work, construction sites, wet walls",
    plain: "A dried film of colour sitting on top of the fabric.",
    icon: "🪣",
  }),
  S({
    id: "adhesive", name: "Adhesive or glue", alt: ["Glue", "Gum", "Sticker residue", "Craft adhesive"], local: ["Gond", "Fevicol (as a source term)"],
    sources: ["adhesive"], category: "paint_polymer", secondary: [],
    colours: ["Clear or colourless", "White", "Yellow"], textures: ["Sticky", "Hard", "Shiny"],
    locations: ["Chest or front", "Sleeve", "Pocket", "Other"],
    typicalSources: "Craft work, stickers, labels, packaging tape",
    plain: "A sticky or hardened clear patch. The exact formulation is not assumed.",
    icon: "🩹",
  }),
  S({
    id: "chewing_gum", name: "Chewing gum", alt: ["Gum", "Bubble gum"], local: ["Chewing gum"],
    sources: ["adhesive", "food"], category: "paint_polymer", secondary: ["oil_grease"],
    colours: ["White", "Grey", "Multiple colours"], textures: ["Sticky", "Hard", "Waxy"],
    locations: ["Seat", "Hem", "Pocket", "Other"],
    typicalSources: "Seats, pockets, laundry mishaps",
    plain: "A sticky rubbery lump attached to the surface.",
    icon: "🍬",
  }),
  S({
    id: "wax", name: "Candle wax", alt: ["Wax", "Crayon wax"], local: ["Mom", "Candle"],
    sources: ["household_chem"], category: "oil_grease", secondary: ["paint_polymer", "pigment_particulate"],
    colours: ["White", "Red", "Multiple colours", "Clear or colourless"], textures: ["Waxy", "Hard", "Shiny"],
    locations: ["Chest or front", "Sleeve", "Hem", "Other"],
    typicalSources: "Candles, ceremonies, crayons",
    plain: "A hardened waxy deposit, sometimes with colour.",
    icon: "🕯️",
  }),
  S({
    id: "shoe_polish", name: "Shoe polish", alt: ["Boot polish", "Leather cream"], local: ["Polish"],
    sources: ["household_chem", "cosmetics"], category: "combination_unknown",
    secondary: ["oil_grease", "pigment_particulate", "dye_ink"],
    stageSequencePlaceholder: "multi-component sequence (defined in a later step)",
    colours: ["Black", "Brown", "Grey"], textures: ["Waxy", "Greasy", "Powdery"],
    locations: ["Hem", "Cuff", "Knee", "Pocket", "Other"],
    typicalSources: "Shoe care, polish tins and applicators",
    plain: "A dark waxy mark that mixes wax, oil, pigment and dye.",
    icon: "🥾",
  }),
  S({
    id: "sweat", name: "Sweat", alt: ["Perspiration", "Body soil"], local: ["Paseena"],
    sources: ["body"], category: "protein", secondary: ["oxidizable", "oil_grease"],
    colours: ["Yellow", "White", "Clear or colourless"], textures: ["Crusty", "No texture", "Bleached or lighter than the fabric"],
    locations: ["Underarm", "Collar", "Chest or front", "Other"],
    typicalSources: "Body contact areas over repeated wear",
    plain: "A yellowish build-up in underarm and collar areas.",
    icon: "💧", biological: true,
  }),
  S({
    id: "deodorant", name: "Deodorant buildup", alt: ["Antiperspirant", "Roll-on residue"], local: ["Deo"],
    sources: ["cosmetics", "body"], category: "combination_unknown",
    secondary: ["oil_grease", "metal_rust", "protein"],
    colours: ["White", "Yellow", "Grey"], textures: ["Crusty", "Powdery", "Waxy", "Hard"],
    locations: ["Underarm", "Chest or front", "Other"],
    typicalSources: "Antiperspirant products reacting with body soil",
    plain: "A stiff white or yellow build-up under the arms.",
    icon: "🧼",
  }),
  S({
    id: "urine", name: "Urine", alt: ["Pet urine", "Toilet accident"], local: ["Peshab", "Mutra"],
    sources: ["body"], category: "protein", secondary: ["oxidizable", "biological"],
    colours: ["Yellow", "Clear or colourless", "Brown"], textures: ["Wet", "Crusty", "No texture"],
    locations: ["Seat", "Hem", "Lining", "Other"],
    typicalSources: "Infants, patients, pets, accidents",
    plain: "A yellowish body-fluid mark, often with an odour already noticeable.",
    icon: "🚼", biological: true,
  }),
  S({
    id: "vomit", name: "Vomit", alt: ["Sick", "Regurgitation"], local: ["Ulti"],
    sources: ["body", "food"], category: "protein", secondary: ["combination_unknown", "biological"],
    colours: ["Yellow", "Orange", "Brown", "Multiple colours"], textures: ["Wet", "Sticky", "Crusty"],
    locations: ["Chest or front", "Sleeve", "Lining", "Other"],
    typicalSources: "Illness, travel sickness, infants",
    plain: "A body-fluid and food mixture, usually with a noticeable odour.",
    icon: "🤢", biological: true,
  }),
  S({
    id: "milk", name: "Milk", alt: ["Dairy", "Cream", "Curd"], local: ["Doodh", "Dahi"],
    sources: ["drinks", "food"], category: "protein", secondary: ["oil_grease"],
    colours: ["White", "Yellow", "Clear or colourless"], textures: ["Wet", "Crusty", "No texture"],
    locations: ["Chest or front", "Sleeve", "Collar", "Other"],
    typicalSources: "Drinks, infant feeding, dairy handling",
    plain: "A pale mark that may turn yellow and smell sour as it ages.",
    icon: "🥛",
  }),
  S({
    id: "egg", name: "Egg", alt: ["Yolk", "Egg white", "Omelette"], local: ["Anda"],
    sources: ["food", "cooking"], category: "protein", secondary: ["oil_grease", "pigment_particulate"],
    colours: ["Yellow", "Clear or colourless", "Orange"], textures: ["Crusty", "Sticky", "Hard"],
    locations: ["Chest or front", "Sleeve", "Cuff", "Other"],
    typicalSources: "Cooking and eating egg dishes",
    plain: "A yellowish protein mark that stiffens as it dries.",
    icon: "🥚",
  }),
  S({
    id: "chocolate", name: "Chocolate", alt: ["Cocoa", "Chocolate sauce"], local: ["Chocolate"],
    sources: ["food"], category: "combination_unknown", secondary: ["oil_grease", "protein", "tannin_plant"],
    colours: ["Brown", "Black"], textures: ["Greasy", "Sticky", "Crusty"],
    locations: ["Chest or front", "Pocket", "Sleeve", "Other"],
    typicalSources: "Confectionery, desserts, melted bars in pockets",
    plain: "A brown food mark with both fat and colour components.",
    icon: "🍫",
  }),
  S({
    id: "fruit_juice", name: "Fruit juice", alt: ["Juice", "Squash", "Mango juice", "Orange juice"], local: ["Ras", "Sharbat", "Aam ka ras"],
    sources: ["drinks", "food"], category: "water_soluble", secondary: ["tannin_plant", "dye_ink"],
    colours: ["Orange", "Yellow", "Red", "Purple"], textures: ["Wet", "Sticky", "No texture"],
    locations: ["Chest or front", "Sleeve", "Cuff", "Other"],
    typicalSources: "Drinks, fruit, packed juices",
    plain: "A coloured sticky drink mark that dissolves in water when fresh.",
    icon: "🧃",
  }),
  S({
    id: "colour_transfer", name: "Colour transfer", alt: ["Dye transfer", "Colour bleeding", "Colour run"], local: ["Rang chadhna", "Rang nikalna"],
    sources: ["dye_transfer"], category: "dye_ink", secondary: [],
    colours: ["Blue", "Red", "Purple", "Grey", "Multiple colours"], textures: ["No texture"],
    locations: ["Multiple areas", "Chest or front", "Sleeve", "Other"],
    typicalSources: "Washing with a bleeding garment, damp contact, new clothes",
    plain: "Colour that moved onto this garment from another fabric, often over a wide area.",
    icon: "🌈",
  }),
  S({
    id: "mould", name: "Mould or mildew", alt: ["Mildew", "Fungus", "Damp growth"], local: ["Phaphoondi", "Fungus"],
    sources: ["mould"], category: "biological", secondary: ["pigment_particulate"],
    colours: ["Black", "Green", "Grey", "White", "Multiple colours"], textures: ["Powdery", "Crusty", "Surface looks damaged"],
    locations: ["Lining", "Hem", "Multiple areas", "Other"],
    typicalSources: "Damp storage, monsoon, wet garments left folded",
    plain: "Spotted growth from damp storage, usually with a musty odour.",
    icon: "🦠", biological: true,
  }),
  S({
    id: "unknown_yellow", name: "Unknown yellow mark", alt: ["Yellow patch", "Storage yellowing", "Age yellowing"], local: ["Peela daag"],
    sources: ["unknown_source"], category: "oxidizable", secondary: ["protein", "oil_grease"],
    colours: ["Yellow", "Orange", "Brown"], textures: ["No texture", "Crusty"],
    locations: ["Collar", "Underarm", "Multiple areas", "Hem", "Other"],
    typicalSources: "Long storage, hidden body soil, old invisible spills",
    plain: "A yellow mark that appeared over time with no known cause.",
    icon: "🟨",
  }),
  S({
    id: "bleach_spot", name: "Bleach-related colour loss", alt: ["Bleach spot", "Colour loss", "White spot"], local: ["Bleach ka daag", "Rang uda"],
    sources: ["household_chem"], category: "combination_unknown", secondary: [],
    colours: ["White", "Yellow", "Orange", "Clear or colourless"], textures: ["Bleached or lighter than the fabric", "No texture"],
    locations: ["Multiple areas", "Chest or front", "Hem", "Other"],
    typicalSources: "Bleach, toilet cleaners, disinfectants, acne products",
    plain: "The garment colour has been removed. This is dye loss, not a deposit.",
    icon: "⚪", damageRoute: true,
  }),
  S({
    id: "scorch", name: "Scorch or heat damage", alt: ["Iron mark", "Burn mark", "Heat shine"], local: ["Jala hua nishan", "Istri ka daag"],
    sources: ["household_chem"], category: "combination_unknown", secondary: [],
    colours: ["Brown", "Yellow", "Grey", "Black"], textures: ["Shiny", "Hard", "Surface looks damaged", "Bleached or lighter than the fabric"],
    locations: ["Chest or front", "Collar", "Cuff", "Sleeve", "Other"],
    typicalSources: "Irons, presses, dryers, heat contact",
    plain: "Heat has changed the fibre itself. This is damage, not a deposit.",
    icon: "🔥", damageRoute: true,
  }),
  S({
    id: "unknown_chemical", name: "Unknown chemical mark", alt: ["Unknown liquid", "Unknown substance", "Unknown powder"], local: ["Anjaan rasayan"],
    sources: ["household_chem", "unknown_source"], category: "combination_unknown", secondary: [],
    colours: ["Not sure", "Clear or colourless", "Multiple colours"], textures: ["Not sure", "Surface looks damaged", "Sticky", "Powdery"],
    locations: ["Other", "Multiple areas"],
    typicalSources: "Industrial areas, workshops, cleaning stores, spills of unknown origin",
    plain: "An unidentified substance. Safety assessment comes before any stain work.",
    icon: "⚠️", hazardCandidate: true,
  }),
];

export const STAIN_BY_ID: Record<string, StainRecord> = Object.fromEntries(
  STAIN_RECORDS.map((s) => [s.id, s]),
);

export const COMMON_STAIN_IDS = ["blood", "tea", "coffee", "turmeric", "curry", "cooking_oil", "ballpoint_ink", "mud"];
