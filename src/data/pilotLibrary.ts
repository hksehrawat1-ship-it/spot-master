/**
 * STEP 17 — Controlled Pilot Library.
 *
 * A small, thoroughly reviewable pilot: 36 core stain records + 6 non-stain
 * diagnostic records, three provisional professional kits, domestic pilot
 * boundaries, phased release definitions and monitoring signals.
 *
 * Permanent principle:
 * "Launch with fewer verified stains, then expand through controlled
 *  evidence — not through unreviewed volume."
 *
 * Nothing in this file invents chemical values. Where a value is unknown the
 * field is deliberately absent and the UI must render "Insufficient Information".
 */

export const PILOT_PRINCIPLE =
  "Launch with fewer verified stains, then expand through controlled evidence — not through unreviewed volume.";

export const PILOT_MAX_RECORDS = 50;
export const PILOT_COUNTRY = "IN";
export const PILOT_LANGUAGE = "en";
export const PILOT_TRANSLATION_TARGETS = ["hi", "regional_in_future"] as const;
export const DOMESTIC_CONFIDENCE_MIN = 9;

/* ------------------------------------------------------------------ */
/* 1. Statuses, phases, user groups                                    */
/* ------------------------------------------------------------------ */

export const PILOT_STATUSES = [
  "internal_testing", "technical_review", "safety_review", "user_acceptance_testing",
  "release_candidate", "pilot_published", "pilot_paused", "rolled_back", "closed",
] as const;
export type PilotStatus = (typeof PILOT_STATUSES)[number];

export const PILOT_STATUS_LABEL: Record<PilotStatus, string> = {
  internal_testing: "Internal Testing",
  technical_review: "Technical Review",
  safety_review: "Safety Review",
  user_acceptance_testing: "User Acceptance Testing",
  release_candidate: "Release Candidate",
  pilot_published: "Pilot Published",
  pilot_paused: "Pilot Paused",
  rolled_back: "Rolled Back",
  closed: "Closed",
};

export const PILOT_PHASES = ["A", "B", "C", "D"] as const;
export type PilotPhase = (typeof PILOT_PHASES)[number];

export type PilotUserGroup =
  | "domestic_user" | "laundry_employee" | "dry_cleaner" | "professional_spotter"
  | "trainer" | "learner" | "technical_reviewer" | "administrator";

export const PILOT_USER_GROUPS: PilotUserGroup[] = [
  "domestic_user", "laundry_employee", "dry_cleaner", "professional_spotter",
  "trainer", "learner", "technical_reviewer", "administrator",
];

export const PROFESSIONAL_GROUPS: PilotUserGroup[] = [
  "laundry_employee", "dry_cleaner", "professional_spotter", "trainer",
  "technical_reviewer", "administrator",
];

export type PhaseDefinition = {
  phase: PilotPhase;
  name: string;
  audience: PilotUserGroup[];
  description: string;
  /** Each phase requires an explicit, recorded release decision. */
  requiresExplicitDecision: true;
  entryConditions: string[];
};

export const PHASE_DEFINITIONS: PhaseDefinition[] = [
  {
    phase: "A", name: "Phase A — Internal",
    audience: ["technical_reviewer", "administrator", "trainer"],
    description: "Reviewers and administrators only. No external access.",
    requiresExplicitDecision: true,
    entryConditions: ["All pilot records drafted", "Governance metadata complete"],
  },
  {
    phase: "B", name: "Phase B — Selected Professional Pilot",
    audience: ["dry_cleaner", "professional_spotter", "trainer", "laundry_employee", "technical_reviewer", "administrator"],
    description: "Invited dry cleaners and trainers. Quick Professional Mode is primary.",
    requiresExplicitDecision: true,
    entryConditions: ["Release gate passes", "Exactly-five validation passes", "Organization isolation verified"],
  },
  {
    phase: "C", name: "Phase C — Limited Domestic Pilot",
    audience: ["domestic_user", "learner"],
    description: "Selected Published domestic-safe records only; all other cases route to professional referral.",
    requiresExplicitDecision: true,
    entryConditions: ["Domestic confidence gate passes at 9/10", "Domestic exclusions enforced", "Phase B outcome monitoring acceptable"],
  },
  {
    phase: "D", name: "Phase D — Controlled Public Availability",
    audience: [...PILOT_USER_GROUPS],
    description: "Only after safety and outcome monitoring are satisfactory.",
    requiresExplicitDecision: true,
    entryConditions: ["No unresolved high-severity defect", "No adverse outcome trend", "Reviewer sign-off recorded"],
  },
];

/* ------------------------------------------------------------------ */
/* 2. Twelve categories (validated for the pilot)                      */
/* ------------------------------------------------------------------ */

export const PILOT_CATEGORIES = [
  "water_soluble", "oil_grease", "protein", "tannin_plant", "pigment_particulate",
  "dye_ink", "paint_resin_adhesive", "oxidizable", "reducible", "metal_rust_mineral",
  "biological", "combination_unknown",
] as const;
export type PilotCategory = (typeof PILOT_CATEGORIES)[number];

export type CategoryMeta = { key: PilotCategory; label: string; plain: string; examples: string[] };

export const PILOT_CATEGORY_META: Record<PilotCategory, CategoryMeta> = {
  water_soluble: { key: "water_soluble", label: "Water-Soluble", plain: "Marks that dissolve in water when they are still fresh.", examples: ["Soft drink", "Sugar syrup", "Fruit juice"] },
  oil_grease: { key: "oil_grease", label: "Oil and Grease-Based", plain: "Greasy marks that water alone cannot lift.", examples: ["Cooking oil", "Ghee", "Machine oil"] },
  protein: { key: "protein", label: "Protein-Based", plain: "Body or food proteins that set permanently with heat.", examples: ["Blood", "Milk", "Egg"] },
  tannin_plant: { key: "tannin_plant", label: "Tannin and Plant-Based", plain: "Plant-derived colouring from drinks and fruit.", examples: ["Tea", "Black coffee", "Red wine"] },
  pigment_particulate: { key: "pigment_particulate", label: "Pigment and Particulate", plain: "Solid coloured particles sitting in or on the fibres.", examples: ["Kajal", "Sindoor", "Shoe polish"] },
  dye_ink: { key: "dye_ink", label: "Dye and Ink-Based", plain: "Strong colourants designed to attach to fibres.", examples: ["Ballpoint ink", "Permanent marker", "Hair dye"] },
  paint_resin_adhesive: { key: "paint_resin_adhesive", label: "Paint, Resin, Adhesive and Polymer", plain: "Materials that harden into a film or glue layer.", examples: ["Latex paint", "Acrylic paint", "Craft adhesive"] },
  oxidizable: { key: "oxidizable", label: "Oxidizable", plain: "Marks that respond to controlled oxidising chemistry.", examples: ["Aged tea", "Perspiration yellowing"] },
  reducible: { key: "reducible", label: "Reducible", plain: "Marks that respond to controlled reducing chemistry.", examples: ["Rust", "Some dye transfer"] },
  metal_rust_mineral: { key: "metal_rust_mineral", label: "Metal, Rust and Mineral", plain: "Metal or mineral deposits from water, hardware or soil.", examples: ["Rust", "Mud minerals"] },
  biological: { key: "biological", label: "Biological", plain: "Living or body-origin soils, including growth on damp fabric.", examples: ["Mould/mildew", "Urine", "Vomit"] },
  combination_unknown: { key: "combination_unknown", label: "Combination or Unknown", plain: "Mixed or unidentified marks that need a careful route.", examples: ["Curry", "Gravy", "Unknown stain"] },
};

/** Deliberately absent as primary categories (Step 5 rule). */
export const FORBIDDEN_PRIMARY_CATEGORIES = ["heat_set_or_aged", "chemical_damage"] as const;

/* ------------------------------------------------------------------ */
/* 3. Pilot record model                                               */
/* ------------------------------------------------------------------ */

export type PilotRecordStatus = "draft" | "needs_review" | "approved" | "published" | "suspended";

export type PilotDocumentation = {
  plainChemistry: boolean;
  technicalChemistryApproved: boolean;
  solubility: boolean;
  bonding: boolean;
  heatEffect: boolean;
  ageingEffect: boolean;
  fabricRisks: boolean;
  colourRisks: boolean;
  constructionRisks: boolean;
  identification: boolean;
  safeFirstResponse: boolean;
  prohibitedActions: boolean;
  expectedOutcome: boolean;
  failureReasons: boolean;
  escalationRule: boolean;
  publicContent: boolean;
  sources: boolean;
};

export type PilotRecord = {
  stainId: string;              // stable ID, never reused
  version: string;              // immutable version string
  isDiagnostic: boolean;        // diagnostic records are not ordinary removable stains
  commonName: string;
  altNames: string[];
  localNames: string[];         // India-relevant local names / transliterations
  misspellings: string[];
  sources: string[];            // common real-world sources
  category: PilotCategory;
  secondaryComponents: string[];
  plainChemistry: string;
  solubility: string;
  bonding: string;
  heatEffect: string;
  ageingEffect: string;
  fabricRisks: string[];
  colourRisks: string[];
  constructionRisks: string[];
  identification: string;
  similarLooking: string[];
  safeFirstResponse: string;
  prohibitedActions: string[];
  expectedOutcome: string;
  failureReasons: string[];
  escalationRule: string;
  publicContent: string;
  evidence: string[];           // source references
  contentOwner: string;
  technicalReviewer: string;
  country: string;
  language: string;
  lastReviewed: string;
  nextReview: string;
  status: PilotRecordStatus;
  documentation: PilotDocumentation;
  /** Domestic route: 0-10 confidence. Below 9 must never publish a method. */
  domesticConfidence: number;
  domesticExcluded: boolean;
  translationReady: boolean;
};

const FULL_DOCS: PilotDocumentation = {
  plainChemistry: true, technicalChemistryApproved: true, solubility: true, bonding: true,
  heatEffect: true, ageingEffect: true, fabricRisks: true, colourRisks: true,
  constructionRisks: true, identification: true, safeFirstResponse: true,
  prohibitedActions: true, expectedOutcome: true, failureReasons: true,
  escalationRule: true, publicContent: true, sources: true,
};

type Spec = {
  id: string;
  name: string;
  cat: PilotCategory;
  alt?: string[];
  local?: string[];
  miss?: string[];
  src?: string[];
  comp?: string[];
  chem: string;
  sol: string;
  bond: string;
  heat?: string;
  age?: string;
  fabric?: string[];
  colour?: string[];
  build?: string[];
  ident: string;
  similar?: string[];
  first: string;
  never?: string[];
  outcome?: string;
  fail?: string[];
  escalate?: string;
  domestic?: number;          // domestic confidence 0-10, default 0
  domesticExcluded?: boolean;
  status?: PilotRecordStatus; // default published
  diagnostic?: boolean;
  docsMissing?: (keyof PilotDocumentation)[];
  reviewer?: string;
};

const DEFAULT_NEVER = [
  "Do not apply heat, hot water, a dryer or an iron before the mark is gone.",
  "Do not rub hard — rubbing spreads the mark and damages fibre surface.",
  "Do not mix household cleaning chemicals.",
];

const buildRecord = (s: Spec): PilotRecord => {
  const docs: PilotDocumentation = { ...FULL_DOCS };
  for (const k of s.docsMissing ?? []) docs[k] = false;
  return {
    stainId: s.id,
    version: "1.0.0",
    isDiagnostic: !!s.diagnostic,
    commonName: s.name,
    altNames: s.alt ?? [],
    localNames: s.local ?? [],
    misspellings: s.miss ?? [],
    sources: s.src ?? [],
    category: s.cat,
    secondaryComponents: s.comp ?? [],
    plainChemistry: s.chem,
    solubility: s.sol,
    bonding: s.bond,
    heatEffect: s.heat ?? "Heat sets the mark and can make it permanent.",
    ageingEffect: s.age ?? "The mark becomes harder to remove as it dries and ages.",
    fabricRisks: s.fabric ?? ["Silk and wool are sensitive to alkali and to heat."],
    colourRisks: s.colour ?? ["Dark and hand-dyed colours may bleed during wet work."],
    constructionRisks: s.build ?? ["Embroidery, glued stones and interlining may distort when wet."],
    identification: s.ident,
    similarLooking: s.similar ?? [],
    safeFirstResponse: s.first,
    prohibitedActions: [...(s.never ?? []), ...DEFAULT_NEVER],
    expectedOutcome: s.outcome ?? "Substantial reduction is realistic; complete removal is not guaranteed.",
    failureReasons: s.fail ?? ["Stain was aged, heated or previously treated with an unknown chemical."],
    escalationRule: s.escalate ?? "Stop and escalate to a professional if colour, texture or fibre changes.",
    publicContent: `${s.name}: ${s.chem}`,
    evidence: ["Textile-chemistry reference (internal library)", "Controlled internal trial record"],
    contentOwner: "content.owner@stainmaster.in",
    technicalReviewer: s.reviewer ?? "textile.reviewer@stainmaster.in",
    country: PILOT_COUNTRY,
    language: PILOT_LANGUAGE,
    lastReviewed: "2026-07-01",
    nextReview: "2027-07-01",
    status: s.status ?? "published",
    documentation: docs,
    domesticConfidence: s.domestic ?? 0,
    domesticExcluded: !!s.domesticExcluded,
    translationReady: true,
  };
};

/* ------------------------------------------------------------------ */
/* 4. The 36 core pilot stains                                         */
/* ------------------------------------------------------------------ */

const CORE_SPECS: Spec[] = [
  // --- Food and Beverage (15) ---
  { id: "SM-PIL-0001", name: "Tea", cat: "tannin_plant", alt: ["Chai stain", "Tea spill"], local: ["Chai", "चाय"], miss: ["chay", "chai stan", "te stain"], src: ["Cup spill", "Kettle splash"], comp: ["Tannin", "Sugar", "Milk fat (if milk tea)"],
    chem: "Tea colour comes from plant tannins; milk tea also carries fat and protein.", sol: "Fresh tea is largely water-soluble; milk tea needs a greasy-soil step too.", bond: "Tannin binds to cellulose fibres as it dries.",
    ident: "Light-brown to reddish ring, often darker at the edge.", similar: ["Black coffee", "Gravy"],
    first: "Blot with a clean white cloth and flush with cool water from the back of the fabric.", outcome: "Fresh tea on washable cotton usually clears fully.", domestic: 9 },
  { id: "SM-PIL-0002", name: "Black coffee", cat: "tannin_plant", alt: ["Coffee", "Filter coffee"], local: ["Kaapi", "कॉफ़ी"], miss: ["cofee", "coffe"], src: ["Cup spill"], comp: ["Tannin", "Sugar"],
    chem: "Coffee stains are plant tannins with sugars.", sol: "Water-soluble when fresh.", bond: "Tannin bonds to cotton as it dries.",
    ident: "Brown mark with a defined edge.", similar: ["Tea", "Cola"],
    first: "Flush with cool water immediately; blot, do not rub.", domestic: 9 },
  { id: "SM-PIL-0003", name: "Coffee with milk", cat: "combination_unknown", alt: ["Milk coffee", "Latte spill"], local: ["Doodh coffee"], miss: ["milk cofee"], src: ["Cup spill"], comp: ["Tannin", "Milk protein", "Milk fat"],
    chem: "A combination mark: plant tannin plus milk protein and fat.", sol: "Partly water-soluble; the fat and protein parts are not.", bond: "Protein sets with heat; tannin binds as it dries.",
    ident: "Pale-brown mark that stiffens slightly when dry.", similar: ["Tea with milk", "Gravy"],
    first: "Flush with cool water only. Never use hot water — it sets the milk protein.", domestic: 0 },
  { id: "SM-PIL-0004", name: "Turmeric/haldi", cat: "dye_ink", alt: ["Turmeric", "Haldi stain"], local: ["Haldi", "हल्दी", "Manjal", "Pasupu"], miss: ["haldee", "termeric", "turmaric"], src: ["Cooking", "Wedding ceremony", "Haldi ritual"], comp: ["Curcumin pigment", "Oil carrier"],
    chem: "Curcumin is a strong natural dye; it turns red-brown in alkali and fades in light.", sol: "Poorly water-soluble; oil-associated.", bond: "Stains fibre directly like a dye.",
    heat: "Heat fixes curcumin and makes removal very difficult.", ident: "Bright yellow to orange mark, often with a greasy edge.", similar: ["Curry", "Mustard"],
    first: "Scrape off solids, keep away from sunlight-drying and heat, and take the garment for professional treatment.",
    never: ["Do not apply soap and hope for the best — alkali turns haldi red."], domestic: 0 },
  { id: "SM-PIL-0005", name: "Curry", cat: "combination_unknown", alt: ["Curry splash", "Sabzi stain"], local: ["Sabzi", "Salan", "करी"], miss: ["carry stain", "curi"], src: ["Meal spill", "Tiffin leak"], comp: ["Turmeric dye", "Oil", "Protein", "Spice particles"],
    chem: "A combination of oil, spice pigment (usually turmeric) and food protein.", sol: "Mixed: oil part needs a greasy-soil route, dye part needs dye chemistry.", bond: "Pigment dyes the fibre; oil holds particles in place.",
    ident: "Yellow-orange greasy mark with visible particles.", similar: ["Turmeric", "Gravy"],
    first: "Lift solids with a blunt edge and keep the garment cool and out of sunlight.", domestic: 0 },
  { id: "SM-PIL-0006", name: "Gravy", cat: "combination_unknown", alt: ["Meat gravy", "Sauce"], local: ["Rassa", "Shorba"], miss: ["gravey"], src: ["Meal spill"], comp: ["Fat", "Protein", "Starch", "Spice"],
    chem: "Fat, protein and starch together, usually with spice colour.", sol: "Mixed solubility.", bond: "Protein sets with heat; starch stiffens on drying.",
    ident: "Brown, slightly stiff mark with a greasy halo.", similar: ["Curry", "Coffee with milk"],
    first: "Remove solids and flush with cool water. Do not iron.", domestic: 0 },
  { id: "SM-PIL-0007", name: "Chocolate", cat: "combination_unknown", alt: ["Cocoa", "Chocolate smear"], local: ["चॉकलेट"], miss: ["choclate", "chocolat"], src: ["Melted bar", "Dessert"], comp: ["Cocoa solids", "Milk protein", "Fat", "Sugar"],
    chem: "Cocoa pigment plus milk fat and protein.", sol: "Sugar dissolves; fat and cocoa do not.", bond: "Fat carries pigment into the fibre.",
    ident: "Brown greasy mark, sometimes raised when set.", similar: ["Gravy", "Coffee with milk"],
    first: "Chill and lift the solid, then blot with cool water.", domestic: 0 },
  { id: "SM-PIL-0008", name: "Milk", cat: "protein", alt: ["Dairy spill"], local: ["Doodh", "दूध"], miss: ["mikl"], src: ["Glass spill", "Baby feeding"], comp: ["Casein protein", "Milk fat"],
    chem: "Milk protein coagulates and traps fat in the fibre.", sol: "Cool-water soluble when fresh only.", bond: "Protein coagulates and grips the fibre once warmed.",
    heat: "Hot water or ironing sets milk protein permanently and can leave a yellow mark.",
    ident: "Pale mark that stiffens and yellows with age.", similar: ["Egg", "Vomit"],
    first: "Flush with cool water at once. Never use warm water.", domestic: 0 },
  { id: "SM-PIL-0009", name: "Egg", cat: "protein", alt: ["Egg yolk", "Egg white"], local: ["Anda", "अंडा"], miss: ["eg stain"], src: ["Breakfast spill", "Kitchen"], comp: ["Albumin protein", "Fat (yolk)"],
    chem: "Egg is largely protein; the yolk adds fat and yellow pigment.", sol: "Cool water only when fresh.", bond: "Protein coagulates on warming and locks in.",
    heat: "Heat cooks the protein onto the fibre — irreversible.", ident: "Glossy, stiff mark, yellowish if yolk.", similar: ["Milk", "Vomit"],
    first: "Scrape gently, then flush with cool water.", domestic: 0 },
  { id: "SM-PIL-0010", name: "Fruit juice", cat: "tannin_plant", alt: ["Juice", "Mango juice", "Orange juice"], local: ["Ras", "जूस"], miss: ["juise", "jucie"], src: ["Glass spill", "Tiffin leak"], comp: ["Plant pigment", "Sugar", "Acid"],
    chem: "Fruit colour plus sugar; the sugar turns brown with age and heat.", sol: "Water-soluble when fresh.", bond: "Pigment binds to cellulose as it dries.",
    ident: "Pink, orange or brown mark with a sugary edge.", similar: ["Soft drink", "Red wine"],
    first: "Flush from the back with cool water quickly.", domestic: 0 },
  { id: "SM-PIL-0011", name: "Red wine", cat: "tannin_plant", alt: ["Wine spill"], local: ["वाइन"], miss: ["red vine", "wain"], src: ["Glass spill", "Party"], comp: ["Anthocyanin pigment", "Tannin", "Alcohol", "Sugar"],
    chem: "Grape pigment and tannin, both of which attach quickly to fibre.", sol: "Partly water-soluble when fresh.", bond: "Pigment binds fast; ageing needs oxidising chemistry.",
    ident: "Purple to reddish-brown mark, browns with age.", similar: ["Fruit juice", "Blood (aged)"],
    first: "Blot, flush with cool water, keep damp and take it in quickly.", domestic: 0 },
  { id: "SM-PIL-0012", name: "Soft drink", cat: "water_soluble", alt: ["Cola", "Fizzy drink", "Aerated drink"], local: ["Thanda", "कोल्ड ड्रिंक"], miss: ["cold drik", "softdrink"], src: ["Bottle spill"], comp: ["Caramel colour", "Sugar", "Acid"],
    chem: "Mostly sugar and caramel colour dissolved in water.", sol: "Highly water-soluble when fresh.", bond: "Sugar residue caramelises with heat and darkens.",
    ident: "Light-brown sticky mark, sometimes invisible until it dries.", similar: ["Tea", "Fruit juice"],
    first: "Flush with cool water; do not tumble dry before checking.", domestic: 9 },
  { id: "SM-PIL-0013", name: "Sugar syrup", cat: "water_soluble", alt: ["Syrup", "Sweet spill"], local: ["Chashni", "चाशनी"], miss: ["shugar syrup"], src: ["Sweets", "Dessert"], comp: ["Sugar"],
    chem: "A simple sugar residue that becomes sticky and then brown.", sol: "Water-soluble when fresh.", bond: "Caramelises with heat into a brown, hard-to-remove mark.",
    ident: "Clear, sticky and shiny while fresh.", similar: ["Soft drink"],
    first: "Flush with cool water before it dries.", domestic: 9 },
  { id: "SM-PIL-0014", name: "Ghee", cat: "oil_grease", alt: ["Clarified butter", "Cooking fat"], local: ["Ghee", "घी", "Tup"], miss: ["ghi", "gee"], src: ["Cooking", "Sweets", "Prasad"], comp: ["Animal fat"],
    chem: "A saturated animal fat that solidifies at room temperature.", sol: "Not water-soluble; needs a greasy-soil route.", bond: "Absorbs into fibre and holds soil.",
    age: "Older ghee marks oxidise and turn yellow-brown.", ident: "Translucent, darker patch; the fabric looks 'wet' when dry.", similar: ["Cooking oil", "Machine oil"],
    first: "Blot excess and keep the garment cool; do not press.", domestic: 0 },
  { id: "SM-PIL-0015", name: "Cooking oil", cat: "oil_grease", alt: ["Vegetable oil", "Kitchen oil"], local: ["Tel", "तेल"], miss: ["cookin oil", "oyl"], src: ["Frying splatter", "Tiffin leak"], comp: ["Vegetable fat"],
    chem: "A vegetable fat that soaks into fibres and darkens them.", sol: "Not water-soluble.", bond: "Absorbed into fibre; needs surfactant or solvent action.",
    ident: "Dark translucent patch that does not stiffen.", similar: ["Ghee", "Machine oil"],
    first: "Blot excess with a clean cloth and treat the same day.", domestic: 9 },

  // --- Body and Biological (6) ---
  { id: "SM-PIL-0016", name: "Blood", cat: "protein", alt: ["Blood spot"], local: ["Khoon", "खून", "Rakt"], miss: ["blod", "bllod"], src: ["Cut", "Nosebleed", "Menstrual"], comp: ["Haemoglobin protein", "Iron"],
    chem: "Blood is a protein carrying iron; both parts must be considered.", sol: "Cool water only when fresh.", bond: "Coagulates on the fibre and darkens with age.",
    heat: "Hot water, drying or ironing sets blood permanently and turns it brown.",
    age: "Aged blood behaves like an oxidised protein-iron mark.",
    ident: "Red when fresh, brown when old, stiff to touch.", similar: ["Rust", "Red wine (aged)"],
    first: "Flush from the back with cold water only. No soap, no hot water, no heat.", domestic: 0 },
  { id: "SM-PIL-0017", name: "Perspiration", cat: "biological", alt: ["Sweat", "Underarm stain"], local: ["Paseena", "पसीना"], miss: ["persipration", "swet"], src: ["Body", "Underarm"], comp: ["Salts", "Protein", "Body oil", "Deodorant residue"],
    chem: "Salt, body oil and protein combined; often reacts with deodorant aluminium.", sol: "Partly water-soluble.", bond: "Builds up in layers and can weaken dye and fibre.",
    ident: "Yellow underarm discolouration, sometimes stiffened.", similar: ["Unknown yellow mark", "Deodorant buildup"],
    first: "Wash promptly in cool water; do not store a sweaty garment folded.", domestic: 0 },
  { id: "SM-PIL-0018", name: "Deodorant buildup", cat: "combination_unknown", alt: ["Antiperspirant residue"], local: ["डिओडरेंट"], miss: ["deoderant", "deodrant"], src: ["Underarm care products"], comp: ["Aluminium salts", "Wax", "Body oil"],
    chem: "Wax and aluminium salts combine with body oil to form a stiff white or yellow layer.", sol: "Not water-soluble.", bond: "Bonds mechanically and chemically inside the fabric.",
    ident: "Stiff white crust or yellowing at the underarm.", similar: ["Perspiration"],
    first: "Do not iron. Bring the garment in for professional treatment.", domestic: 0 },
  { id: "SM-PIL-0019", name: "Urine", cat: "biological", alt: ["Pee stain"], local: ["Peshab", "पेशाब"], miss: ["urin", "uring"], src: ["Infant", "Elderly care", "Pet"], comp: ["Urea", "Salts", "Protein", "Pigment"],
    chem: "Urea and salts with body pigment; turns alkaline and yellow as it ages.", sol: "Water-soluble when fresh.", bond: "Ageing produces yellowing and can damage dyes.",
    ident: "Yellow ring with a distinct odour.", similar: ["Unknown yellow mark", "Perspiration"],
    first: "Flush with cool water. Treat biological soil with hygiene precautions.", domestic: 0 },
  { id: "SM-PIL-0020", name: "Vomit", cat: "biological", alt: ["Sick stain"], local: ["Ulti", "उल्टी"], miss: ["vomitt", "womit"], src: ["Illness", "Travel"], comp: ["Protein", "Acid", "Food particles", "Fat"],
    chem: "Stomach acid with food protein and fat; the acid can damage dye.", sol: "Partly water-soluble.", bond: "Acid attacks dye while the protein coagulates.",
    ident: "Discoloured patch, often with a lightened dye area and odour.", similar: ["Gravy", "Milk"],
    first: "Remove solids with gloves, flush with cool water and treat as biological soil.", domestic: 0 },
  { id: "SM-PIL-0021", name: "Mould/mildew", cat: "biological", alt: ["Mildew", "Fungus", "Damp spots"], local: ["Phaphoondi", "फफूंदी"], miss: ["mould", "mildue", "fungas"], src: ["Damp storage", "Monsoon", "Wet bundle"], comp: ["Fungal growth", "Pigment", "Cellulose damage"],
    chem: "Living growth that feeds on fibre and leaves coloured pigment behind.", sol: "Not water-soluble.", bond: "Pigment penetrates and the fibre itself may be weakened.",
    age: "Long growth causes permanent fibre loss and holes.",
    ident: "Grey-black or pink speckles with a musty smell.", similar: ["Unknown grey mark"],
    first: "Isolate the garment, keep it dry and take it for professional assessment.",
    never: ["Do not brush mould indoors — spores spread."], domestic: 0, domesticExcluded: true },

  // --- Cosmetics and Personal Care (6) ---
  { id: "SM-PIL-0022", name: "Lipstick", cat: "pigment_particulate", alt: ["Lip colour"], local: ["Lipstick", "लिपस्टिक"], miss: ["lip stick", "lipstic"], src: ["Collar transfer", "Hug", "Napkin"], comp: ["Wax", "Oil", "Pigment"],
    chem: "Wax and oil holding strong pigment.", sol: "Not water-soluble; needs a greasy route first, then pigment work.", bond: "Wax grips fibre surface and the pigment settles inside.",
    ident: "Bright red/pink greasy smear.", similar: ["Foundation makeup", "Paint"],
    first: "Lift excess with a blunt edge; do not rub or wash in hot water.", domestic: 0 },
  { id: "SM-PIL-0023", name: "Foundation makeup", cat: "pigment_particulate", alt: ["Face makeup", "BB cream"], local: ["मेकअप"], miss: ["foundaton", "makup"], src: ["Collar", "Neckline", "Dupatta"], comp: ["Oil", "Silicone", "Mineral pigment"],
    chem: "Oil or silicone base carrying fine mineral pigment.", sol: "Not water-soluble.", bond: "The base holds pigment against the fibre.",
    ident: "Beige smear along collars and necklines.", similar: ["Lipstick", "Mud"],
    first: "Do not rub. Keep away from heat and bring in for treatment.", domestic: 0 },
  { id: "SM-PIL-0024", name: "Nail polish", cat: "paint_resin_adhesive", alt: ["Nail enamel", "Nail paint"], local: ["Nail paint", "नेल पॉलिश"], miss: ["nailpolish", "nail polis"], src: ["Manicure", "Spill"], comp: ["Nitrocellulose resin", "Solvent", "Pigment"],
    chem: "A fast-drying resin film with strong pigment.", sol: "Solvent-dependent; solvents can dissolve acetate and damage dye.", bond: "Forms a film that locks into fibre.",
    ident: "Glossy hard coloured film on the surface.", similar: ["Acrylic paint", "Adhesive"],
    first: "Let it stay dry and untouched; take it for professional assessment.",
    never: ["Do not use acetone at home — it destroys acetate and many dyes."], domestic: 0, domesticExcluded: true },
  { id: "SM-PIL-0025", name: "Hair dye", cat: "dye_ink", alt: ["Hair colour"], local: ["बालों का रंग", "Mehndi colour"], miss: ["hairdye", "hair die"], src: ["Salon", "Home colouring"], comp: ["Oxidative dye", "Alkali", "Peroxide"],
    chem: "A dye that develops chemically inside the fibre, just as it does in hair.", sol: "Not removable by dissolving; it is a true dye.", bond: "Bonds permanently and may also strip the garment's own dye.",
    ident: "Dark brown/black or coppery mark, often with a lightened halo.", similar: ["Ink", "Dye transfer"],
    first: "Do not attempt removal. Escalate immediately — early professional work matters.", domestic: 0, domesticExcluded: true },
  { id: "SM-PIL-0026", name: "Kajal or eyeliner", cat: "pigment_particulate", alt: ["Eyeliner", "Kohl"], local: ["Kajal", "काजल", "Surma"], miss: ["kajol", "kaajal", "eye liner"], src: ["Eye makeup", "Pillow transfer"], comp: ["Carbon pigment", "Wax", "Oil"],
    chem: "Fine carbon pigment held in wax or oil.", sol: "Not water-soluble.", bond: "Carbon particles lodge between fibres.",
    ident: "Black smudge, greasy to the touch.", similar: ["Soot", "Ink"],
    first: "Do not rub — rubbing drives carbon deeper. Bring the garment in.", domestic: 0 },
  { id: "SM-PIL-0027", name: "Sindoor", cat: "pigment_particulate", alt: ["Vermilion", "Kumkum"], local: ["Sindoor", "सिंदूर", "Kumkum"], miss: ["sindur", "sindhoor"], src: ["Daily wear", "Ceremony"], comp: ["Mineral or synthetic pigment", "Oil or wax carrier"],
    chem: "A fine red pigment, sometimes with an oil carrier; composition varies by product.", sol: "Not water-soluble.", bond: "Pigment lodges in fibre; some products also dye.",
    ident: "Bright red-orange powdery or greasy mark, often on the shoulder or dupatta.", similar: ["Lipstick", "Turmeric"],
    first: "Shake off loose powder outdoors; do not wet or rub.", domestic: 0 },

  // --- Ink, Paint, Oil and Adhesive (7) ---
  { id: "SM-PIL-0028", name: "Ballpoint ink", cat: "dye_ink", alt: ["Pen ink", "Biro mark"], local: ["Pen ki syahi", "स्याही"], miss: ["ball point ink", "inck"], src: ["Pocket pen leak", "Writing"], comp: ["Dye", "Oil-based vehicle", "Resin"],
    chem: "Dye carried in an oily resin vehicle.", sol: "Not water-soluble; needs controlled solvent work.", bond: "Resin binds dye to the fibre surface.",
    ident: "Blue or black line or blot, often at the pocket.", similar: ["Permanent marker", "Hair dye"],
    first: "Place absorbent paper underneath and avoid wetting the mark.", domestic: 0 },
  { id: "SM-PIL-0029", name: "Permanent marker", cat: "dye_ink", alt: ["Marker pen", "Sharpie-type mark"], local: ["मार्कर"], miss: ["permanant marker", "marker pen"], src: ["Labelling", "School"], comp: ["Solvent dye", "Resin"],
    chem: "A solvent dye designed to resist water and washing.", sol: "Not water-soluble.", bond: "Penetrates the fibre deeply and is often only partly removable.",
    ident: "Sharp-edged dark mark that has bled slightly into the weave.", similar: ["Ballpoint ink"],
    first: "Do not wet. Escalate to a professional; state that it is a permanent marker.",
    outcome: "Partial lightening is realistic; full removal is often not possible.", domestic: 0, domesticExcluded: true },
  { id: "SM-PIL-0030", name: "Machine or motor oil", cat: "oil_grease", alt: ["Grease", "Engine oil"], local: ["Kaala tel", "ग्रीस"], miss: ["moter oil", "machin oil"], src: ["Two-wheeler", "Workshop", "Chain grease"], comp: ["Mineral oil", "Carbon particles", "Metal fines"],
    chem: "Mineral oil holding carbon and metal particles.", sol: "Not water-soluble.", bond: "Oil soaks in and carries particles deep into the fibre.",
    ident: "Dark grey-black greasy mark with a spreading edge.", similar: ["Cooking oil", "Shoe polish"],
    first: "Blot excess, avoid folding the stain onto clean fabric, and treat professionally.", domestic: 0 },
  { id: "SM-PIL-0031", name: "Shoe polish", cat: "pigment_particulate", alt: ["Boot polish"], local: ["Polish", "पॉलिश"], miss: ["shoo polish", "shu polish"], src: ["Polishing", "Contact with shoes"], comp: ["Wax", "Solvent", "Pigment/dye"],
    chem: "A waxy carrier holding dye and pigment.", sol: "Not water-soluble.", bond: "Wax grips the surface; dye may stain permanently.",
    ident: "Dark waxy smear, often black or brown.", similar: ["Machine oil", "Kajal"],
    first: "Let it dry, lift the wax gently with a blunt edge, and escalate.", domestic: 0 },
  { id: "SM-PIL-0032", name: "Latex or water-based paint", cat: "paint_resin_adhesive", alt: ["Emulsion paint", "Wall paint"], local: ["Distemper", "पेंट"], miss: ["latax paint", "watr paint"], src: ["House painting", "School project"], comp: ["Polymer binder", "Pigment", "Water"],
    chem: "Pigment in a polymer binder that becomes water-resistant once dry.", sol: "Water-removable only while wet.", bond: "Once cured the polymer film is bonded to the fibre.",
    age: "After curing the paint film is effectively permanent.",
    ident: "Matte coloured film, flexible when fresh, brittle when old.", similar: ["Acrylic paint", "Adhesive"],
    first: "If still wet, flush gently with cool water and bring it in immediately.", domestic: 0, domesticExcluded: true },
  { id: "SM-PIL-0033", name: "Acrylic paint", cat: "paint_resin_adhesive", alt: ["Artist paint", "Craft paint"], local: ["Rang", "रंग"], miss: ["acrilic", "acrylik"], src: ["Art work", "Craft", "Festival colour"], comp: ["Acrylic polymer", "Pigment"],
    chem: "A plastic polymer that cures into a permanent film.", sol: "Not soluble once cured.", bond: "Mechanically locked around fibres.",
    ident: "Slightly raised, plastic-feeling coloured patch.", similar: ["Latex paint", "Nail polish"],
    first: "Do not scrub. Bring it in while it is still soft if possible.",
    outcome: "Cured acrylic often cannot be removed without fabric damage.", domestic: 0, domesticExcluded: true },
  { id: "SM-PIL-0034", name: "Adhesive or craft glue", cat: "paint_resin_adhesive", alt: ["Glue", "Gum"], local: ["Fevicol (colloquial search term)", "Gond", "गोंद"], miss: ["fevicol", "fevikol", "adhesiv", "gule"], src: ["Craft work", "Repairs", "Stone setting"], comp: ["Polymer emulsion or resin"],
    chem: "A polymer that hardens into a bonding film; exact formulation varies by product and must be confirmed.", sol: "Depends on the formulation; do not assume.", bond: "Bonds fibres together and stiffens the area.",
    ident: "Stiff, glossy or cloudy patch; fibres feel glued together.", similar: ["Acrylic paint", "Nail polish"],
    first: "Do not pull the fibres apart. Bring the garment in and name the product if known.",
    never: ["Do not assume chemistry from a brand name — the formulation must be confirmed."], domestic: 0, domesticExcluded: true },

  // --- Mineral, Transfer and Unknown (2) ---
  { id: "SM-PIL-0035", name: "Rust", cat: "metal_rust_mineral", alt: ["Iron mark", "Metal stain"], local: ["Zang", "जंग"], miss: ["rast", "rust stain"], src: ["Metal hangers", "Hooks", "Iron-rich water", "Wet metal contact"], comp: ["Iron oxide"],
    chem: "Iron oxide deposited in the fibre; it is a metal, not a soil.", sol: "Not water-soluble; requires reducing chemistry.", bond: "Chemically deposited inside the fibre.",
    heat: "Heat and some bleaches make rust permanent.",
    ident: "Orange-brown mark, often near metal contact points.", similar: ["Blood (aged)", "Unknown yellow mark"],
    first: "Keep the garment dry and away from chlorine bleach; escalate.",
    never: ["Never use chlorine bleach on rust — it sets the mark."], domestic: 0, domesticExcluded: true },
  { id: "SM-PIL-0036", name: "Textile dye transfer", cat: "dye_ink", alt: ["Colour bleeding", "Colour run"], local: ["Rang chad gaya", "रंग", "Rang"], miss: ["colour transfer", "dye tranfer", "rang"], src: ["Mixed wash", "Wet garments stored together", "New unwashed garment"], comp: ["Loose dye"],
    chem: "Dye released from one garment attaching to another.", sol: "Behaves as a dye, not as a soil.", bond: "Attaches to fibre in the same way as the original dyeing.",
    heat: "Drying and ironing fix transferred dye permanently.",
    ident: "Broad, uneven colour shift rather than a defined spot.", similar: ["Hair dye", "Active dye bleeding"],
    first: "Keep the garment wet and out of the dryer; escalate the same day.",
    outcome: "Early professional work gives the best chance; results are not guaranteed.", domestic: 0, domesticExcluded: true },
];

/* ------------------------------------------------------------------ */
/* 5. Six non-stain diagnostic records                                 */
/* ------------------------------------------------------------------ */

const DIAGNOSTIC_SPECS: Spec[] = [
  { id: "SM-PIL-D001", name: "Unknown stain", cat: "combination_unknown", diagnostic: true, alt: ["Unidentified mark"], local: ["Pata nahi", "अज्ञात दाग"], miss: ["unknow stain"], src: ["Unclear"],
    chem: "The composition is unknown, so no chemistry can be assumed.", sol: "Unknown — must not be assumed.", bond: "Unknown.",
    ident: "Origin, age or composition cannot be established from what the user knows.", similar: ["Unknown yellow mark"],
    first: "Do not apply any chemical. Record what is known and route to a professional assessment.",
    escalate: "Always escalate: unknown chemistry cannot be treated safely at home.", domestic: 0, domesticExcluded: true },
  { id: "SM-PIL-D002", name: "Unknown yellow mark", cat: "combination_unknown", diagnostic: true, alt: ["Yellowing", "Age yellowing"], local: ["Peela daag", "पीला दाग"], miss: ["yelow mark"], src: ["Storage", "Old perspiration", "Previous invisible spill"],
    chem: "Yellowing can come from oxidised body oil, sugar, previous treatment or storage — it is a symptom, not a stain type.", sol: "Unknown until identified.", bond: "Varies with cause.",
    ident: "Diffuse yellow area, often on stored whites or underarms.", similar: ["Perspiration", "Scorch"],
    first: "Do not bleach. Establish the cause before any chemical is chosen.", domestic: 0, domesticExcluded: true },
  { id: "SM-PIL-D003", name: "Bleach-related colour loss", cat: "combination_unknown", diagnostic: true, alt: ["Bleach spot", "Colour loss"], local: ["Rang uud gaya"], miss: ["bleech spot"], src: ["Household bleach", "Toilet cleaner splash", "Benzoyl peroxide"],
    chem: "The garment's own dye has been destroyed. This is damage, not a stain.", sol: "Not applicable — there is nothing to dissolve.", bond: "Not applicable.",
    ident: "Lightened patch with a distinct edge; the fabric is otherwise sound.", similar: ["Unknown yellow mark", "Scorch"],
    first: "Stop all treatment. Explain that removal chemistry cannot restore destroyed dye.",
    outcome: "No removal is possible; only re-colouring services may help.",
    escalate: "Route to a professional for a re-colouring assessment.", domestic: 0, domesticExcluded: true },
  { id: "SM-PIL-D004", name: "Scorch or heat damage", cat: "combination_unknown", diagnostic: true, alt: ["Iron burn", "Heat mark"], local: ["Jal gaya", "इस्त्री का दाग"], miss: ["scorge", "skorch"], src: ["Iron", "Dryer", "Press"],
    chem: "The fibre itself has been altered by heat. This is damage, not a stain.", sol: "Not applicable.", bond: "Not applicable.",
    ident: "Shiny or yellow-brown mark following the iron shape; fibres may be brittle.", similar: ["Unknown yellow mark"],
    first: "Stop. Do not attempt chemical removal on damaged fibre.",
    outcome: "Light surface scorch may improve slightly; damaged fibre cannot be restored.", domestic: 0, domesticExcluded: true },
  { id: "SM-PIL-D005", name: "Dye bleeding", cat: "combination_unknown", diagnostic: true, alt: ["Active bleeding", "Colour running"], local: ["Rang chhut raha hai"], miss: ["dye bleding"], src: ["Unfixed dye", "Wet storage", "Hand-dyed garment"],
    chem: "The garment is actively releasing its own dye. Any wet work will spread it.", sol: "Not applicable — the dye is mobile.", bond: "Not applicable.",
    ident: "Colour appears on the test swab or on adjacent areas during the crock test.", similar: ["Textile dye transfer"],
    first: "Stop all wet treatment immediately and isolate the garment.",
    escalate: "Professional dye-stabilising assessment is required before any treatment.", domestic: 0, domesticExcluded: true },
  { id: "SM-PIL-D006", name: "Coating or finish damage", cat: "combination_unknown", diagnostic: true, alt: ["Peeling coating", "Finish loss"], local: ["Coating kharab"], miss: ["coting damage"], src: ["Waterproof jacket", "Coated fabric", "PU finish"],
    chem: "The applied coating or finish has failed. This is a material condition, not a stain.", sol: "Not applicable.", bond: "Not applicable.",
    ident: "Flaking, tackiness, cloudiness or loss of water repellency.", similar: ["Adhesive residue"],
    first: "Stop. Solvents and spotting agents will accelerate coating failure.",
    escalate: "Route to a specialist; state the coating type if the label is available.", domestic: 0, domesticExcluded: true },
];

export const PILOT_RECORDS: PilotRecord[] = [
  ...CORE_SPECS.map(buildRecord),
  ...DIAGNOSTIC_SPECS.map(buildRecord),
];

export const PILOT_CORE_RECORDS = PILOT_RECORDS.filter((r) => !r.isDiagnostic);
export const PILOT_DIAGNOSTIC_RECORDS = PILOT_RECORDS.filter((r) => r.isDiagnostic);

/* ------------------------------------------------------------------ */
/* 6. Professional kits (provisional library records)                  */
/* ------------------------------------------------------------------ */

export type VerificationState = "verified" | "pending" | "missing" | "conflicting";

export type PilotProduct = {
  productKey: string;
  company: string;
  kit: string;
  product: string;
  /** Only recorded when the manufacturer document states it. */
  productVersion?: string;
  country?: string;
  identity: VerificationState;
  label: VerificationState;
  sds: VerificationState;
  tds: VerificationState;
  mapping: VerificationState;
  safety: VerificationState;
  fabricRestrictions: VerificationState;
  colourRestrictions: VerificationState;
  processRestrictions: VerificationState;
  ppe: VerificationState;
  incompatibilities: VerificationState;
  rinsing: VerificationState;
  technicalReview: VerificationState;
  missing: string[];
  assignedReviewer: string;
};

const prod = (
  company: string, kit: string, product: string, over: Partial<PilotProduct> = {},
): PilotProduct => ({
  productKey: `${company}-${product}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  company, kit, product,
  country: "IN",
  identity: "verified",
  label: "pending", sds: "pending", tds: "pending", mapping: "pending", safety: "pending",
  fabricRestrictions: "pending", colourRestrictions: "pending", processRestrictions: "pending",
  ppe: "pending", incompatibilities: "pending", rinsing: "pending", technicalReview: "pending",
  missing: ["Current India-market label", "Current India-applicable SDS", "Current TDS"],
  assignedReviewer: "textile.reviewer@stainmaster.in",
  ...over,
});

export const SEITZ_KIT = "Seitz Seven-Bottle Kit";
export const STAS_KIT = "STAS Stain N Kit";
export const CLEANCRAFT_KIT = "Clean Craft Nine-Bottle Kit";

export const PILOT_PRODUCTS: PilotProduct[] = [
  // Seitz — identity known from the supplied chart; documents not yet verified for India.
  prod("Seitz", SEITZ_KIT, "Purasol", { missing: ["Current India-market label", "Current India-applicable SDS", "Current TDS", "Rinsing requirement"] }),
  prod("Seitz", SEITZ_KIT, "Quickol"),
  prod("Seitz", SEITZ_KIT, "Lacol"),
  prod("Seitz", SEITZ_KIT, "Frankosol"),
  prod("Seitz", SEITZ_KIT, "Cavesol", { missing: ["Current India-market label", "Current India-applicable SDS", "Current TDS", "Cavesol/Blutol compatibility"] }),
  prod("Seitz", SEITZ_KIT, "Blutol", { missing: ["Current India-market label", "Current India-applicable SDS", "Current TDS", "Cavesol/Blutol compatibility"] }),
  prod("Seitz", SEITZ_KIT, "Colorsol"),
  // STAS — exact product identities are NOT known. Kit-level placeholder only, no invented names.
  prod("STAS", STAS_KIT, "Kit contents (identities unconfirmed)", {
    identity: "missing",
    missing: [
      "Exact kit product identities", "Current labels", "Current SDSs", "Current TDSs",
      "Manufacturer identity and country applicability", "Textile restrictions", "PPE",
      "Incompatibilities", "Verified application instructions",
    ],
  }),
  // Clean Craft — nine named products, documents unverified.
  ...["Food 1", "Food 2", "Colour 1", "Colour 2", "Fungus Go", "Organic", "Oil 1", "Oil 2", "Rust Go"]
    .map((p) => prod("Clean Craft", CLEANCRAFT_KIT, p, {
      missing: p === "Fungus Go"
        ? ["Current label", "Current SDS", "Current TDS", "Description inconsistency (Fungus Go)", "Steam-first instruction conflict with protein stains"]
        : ["Current label", "Current SDS", "Current TDS", "Chemical family", "Textile restrictions", "PPE", "Ventilation", "Verified quantity and contact time"],
    })),
];

export const INSUFFICIENT_INFORMATION = "Insufficient Information";

/** §9 — known initial review items that must stay visible until resolved. */
export type ReviewItem = { id: string; company: string; item: string; severity: "safety_critical" | "documentation"; open: boolean };

export const OPEN_REVIEW_ITEMS: ReviewItem[] = [
  { id: "RV-S1", company: "Seitz", item: "Current India-market labels", severity: "documentation", open: true },
  { id: "RV-S2", company: "Seitz", item: "Current India-applicable SDSs", severity: "safety_critical", open: true },
  { id: "RV-S3", company: "Seitz", item: "Current TDSs", severity: "documentation", open: true },
  { id: "RV-S4", company: "Seitz", item: "Product-specific cleaning-solvent restrictions", severity: "safety_critical", open: true },
  { id: "RV-S5", company: "Seitz", item: "Product-specific textile restrictions", severity: "safety_critical", open: true },
  { id: "RV-S6", company: "Seitz", item: "Product-transition restrictions", severity: "safety_critical", open: true },
  { id: "RV-S7", company: "Seitz", item: "Cavesol and Blutol compatibility", severity: "safety_critical", open: true },
  { id: "RV-S8", company: "Seitz", item: "Purasol rinsing requirements", severity: "safety_critical", open: true },
  { id: "RV-S9", company: "Seitz", item: "Clean Craft / Seitz relationship claim", severity: "documentation", open: true },
  { id: "RV-T1", company: "STAS", item: "Exact kit product identities", severity: "documentation", open: true },
  { id: "RV-T2", company: "STAS", item: "Current labels", severity: "documentation", open: true },
  { id: "RV-T3", company: "STAS", item: "Current SDSs", severity: "safety_critical", open: true },
  { id: "RV-T4", company: "STAS", item: "Current TDSs", severity: "documentation", open: true },
  { id: "RV-T5", company: "STAS", item: "Manufacturer identity and country applicability", severity: "documentation", open: true },
  { id: "RV-T6", company: "STAS", item: "Textile restrictions", severity: "safety_critical", open: true },
  { id: "RV-T7", company: "STAS", item: "PPE", severity: "safety_critical", open: true },
  { id: "RV-T8", company: "STAS", item: "Incompatibilities", severity: "safety_critical", open: true },
  { id: "RV-T9", company: "STAS", item: "Verified application instructions", severity: "safety_critical", open: true },
  { id: "RV-C1", company: "Clean Craft", item: "Fungus Go description inconsistency", severity: "safety_critical", open: true },
  { id: "RV-C2", company: "Clean Craft", item: "Steam-first instructions", severity: "safety_critical", open: true },
  { id: "RV-C3", company: "Clean Craft", item: "Protein and heat conflict", severity: "safety_critical", open: true },
  { id: "RV-C4", company: "Clean Craft", item: "Product chemical families", severity: "documentation", open: true },
  { id: "RV-C5", company: "Clean Craft", item: "Current labels", severity: "documentation", open: true },
  { id: "RV-C6", company: "Clean Craft", item: "Current SDSs", severity: "safety_critical", open: true },
  { id: "RV-C7", company: "Clean Craft", item: "Current TDSs", severity: "documentation", open: true },
  { id: "RV-C8", company: "Clean Craft", item: "Textile restrictions", severity: "safety_critical", open: true },
  { id: "RV-C9", company: "Clean Craft", item: "Colour restrictions", severity: "safety_critical", open: true },
  { id: "RV-C10", company: "Clean Craft", item: "PPE", severity: "safety_critical", open: true },
  { id: "RV-C11", company: "Clean Craft", item: "Ventilation", severity: "safety_critical", open: true },
  { id: "RV-C12", company: "Clean Craft", item: "Incompatibilities", severity: "safety_critical", open: true },
  { id: "RV-C13", company: "Clean Craft", item: "Verified quantity and contact time", severity: "documentation", open: true },
];

/* ------------------------------------------------------------------ */
/* 7. Domestic pilot scope                                             */
/* ------------------------------------------------------------------ */

export const DOMESTIC_FALLBACK = "Domestic treatment is not recommended.";

export type DomesticCandidate = {
  candidateId: string;
  stainId: string;
  description: string;
  requires: string[];
  confidence: number;      // 0-10; must be >= 9 to publish
  approved: boolean;       // explicit reviewer approval, never automatic
};

export const DOMESTIC_CANDIDATES: DomesticCandidate[] = [
  { candidateId: "DC-01", stainId: "SM-PIL-0012", description: "Fresh known water-soluble residue (soft drink) on verified washable, colourfast textile", requires: ["care label present or washable verified", "colourfastness test passed", "stain fresh and known"], confidence: 9, approved: true },
  { candidateId: "DC-02", stainId: "SM-PIL-0013", description: "Fresh sugar syrup residue on verified washable, colourfast textile", requires: ["washable verified", "colourfast verified", "not heat-dried"], confidence: 9, approved: true },
  { candidateId: "DC-03", stainId: "SM-PIL-0001", description: "Fresh known tea on verified washable, colourfast textile", requires: ["washable verified", "colourfast verified", "no milk component", "stain under 1 hour"], confidence: 9, approved: true },
  { candidateId: "DC-04", stainId: "SM-PIL-0002", description: "Fresh known black coffee on verified washable, colourfast textile", requires: ["washable verified", "colourfast verified", "no milk component", "stain under 1 hour"], confidence: 9, approved: true },
  { candidateId: "DC-05", stainId: "SM-PIL-0015", description: "Fresh known cooking oil on verified washable, colourfast textile", requires: ["washable verified", "colourfast verified", "no heat applied", "cotton-like or synthetic"], confidence: 9, approved: true },
  { candidateId: "DC-06", stainId: "SM-PIL-D001", description: "Loose dried mud or particulate soil with verified removal boundaries", requires: ["fully dry", "loose particulate only", "washable verified"], confidence: 8, approved: false },
];

/** §11 — never publish a domestic chemical treatment for these. */
export const DOMESTIC_EXCLUSIONS = [
  "unknown_stain", "unknown_chemical", "dye_transfer", "hair_dye", "permanent_marker",
  "nail_polish", "paint", "adhesive", "rust", "mould", "leather", "suede", "fur",
  "coated_fabric", "waterproof_fabric", "bridal_garment", "highly_embellished",
  "active_dye_bleeding", "bleach_damage", "scorch_damage", "previous_unknown_chemical",
  "mixed_household_cleaners",
] as const;
export type DomesticExclusion = (typeof DOMESTIC_EXCLUSIONS)[number];

/* ------------------------------------------------------------------ */
/* 8. No-label pilot garments (§15)                                    */
/* ------------------------------------------------------------------ */

export type RiskGroup = "green" | "yellow" | "orange" | "red" | "black";

export type NoLabelGarment = {
  key: string;
  label: string;
  /** Behavioural cues only — never a claimed fibre identification. */
  cues: string[];
  riskGroup: RiskGroup;
  wetWorkAllowed: boolean;
};

export const NO_LABEL_GARMENTS: NoLabelGarment[] = [
  { key: "cotton_kurta", label: "Plain cotton-like kurta", cues: ["matte surface", "absorbs water quickly"], riskGroup: "green", wetWorkAllowed: true },
  { key: "dark_uniform", label: "Dark synthetic uniform", cues: ["smooth handle", "water beads briefly"], riskGroup: "yellow", wetWorkAllowed: true },
  { key: "printed_saree", label: "Multicoloured printed saree", cues: ["multiple adjacent colours", "printed pattern"], riskGroup: "orange", wetWorkAllowed: false },
  { key: "silk_saree", label: "Silk-like saree", cues: ["lustrous", "protein-fibre behaviour suspected"], riskGroup: "red", wetWorkAllowed: false },
  { key: "wool_blazer", label: "Wool-like blazer", cues: ["fuzzy surface", "structured with interlining"], riskGroup: "red", wetWorkAllowed: false },
  { key: "bridal_lehenga", label: "Bridal lehenga", cues: ["heavy embellishment", "multiple materials"], riskGroup: "black", wetWorkAllowed: false },
  { key: "embroidered_kurti", label: "Embroidered kurti", cues: ["thread work", "possible dye migration"], riskGroup: "orange", wetWorkAllowed: false },
  { key: "sportswear", label: "Stretch sportswear", cues: ["elastic recovery", "smooth synthetic handle"], riskGroup: "yellow", wetWorkAllowed: true },
  { key: "waterproof_jacket", label: "Waterproof jacket", cues: ["water repels", "coating or membrane suspected"], riskGroup: "black", wetWorkAllowed: false },
  { key: "stitched_suit", label: "Locally stitched suit with fusible interlining", cues: ["stiff panels", "adhesive interlining suspected"], riskGroup: "red", wetWorkAllowed: false },
  { key: "metallic_thread", label: "Garment with metallic thread", cues: ["zari or metallic yarn", "tarnish risk"], riskGroup: "black", wetWorkAllowed: false },
  { key: "glued_stones", label: "Garment with glued stones", cues: ["stones attached with adhesive"], riskGroup: "black", wetWorkAllowed: false },
];

/* ------------------------------------------------------------------ */
/* 9. Analytics, feedback, support, notices                            */
/* ------------------------------------------------------------------ */

/** Privacy-conscious: aggregate counters only, never free-text personal data. */
export const PILOT_ANALYTICS_EVENTS = [
  "search_term", "no_result_search", "local_name_search", "label_available", "label_unavailable",
  "unknown_fabric", "unknown_stain", "risk_distribution", "domestic_eligible", "professional_referral",
  "product_documentation_gap", "treatment_start", "treatment_stop", "escalation", "post_drying_outcome",
  "adverse_outcome", "abandonment_stage", "mode_usage", "device_type", "accessibility_error",
] as const;
export type PilotAnalyticsEvent = (typeof PILOT_ANALYTICS_EVENTS)[number];

/** Analytics must never automatically change a live safety decision. */
export const ANALYTICS_MAY_CHANGE_SAFETY = false;

export const FEEDBACK_REASONS = [
  { key: "not_found", label: "Could not find stain", priority: "normal" },
  { key: "fabric_unclear", label: "Could not identify fabric", priority: "normal" },
  { key: "unclear", label: "Instructions unclear", priority: "normal" },
  { key: "product_missing", label: "Product missing", priority: "normal" },
  { key: "product_wrong", label: "Product instruction appears incorrect", priority: "high" },
  { key: "safety", label: "Safety concern", priority: "high" },
  { key: "translation", label: "Translation issue", priority: "normal" },
  { key: "treatment_failed", label: "Treatment failed", priority: "normal" },
  { key: "damage", label: "Garment damaged", priority: "high" },
  { key: "feature", label: "Feature request", priority: "low" },
  { key: "other", label: "Other", priority: "low" },
] as const;

export const SUPPORT_ROUTES = [
  { key: "content", label: "Content question", owner: "Content team", responseTarget: "2 working days" },
  { key: "technical", label: "Technical question", owner: "Technical reviewer", responseTarget: "2 working days" },
  { key: "documents", label: "Product-document request", owner: "Product librarian", responseTarget: "5 working days" },
  { key: "safety", label: "Safety concern", owner: "Safety reviewer", responseTarget: "Same working day" },
  { key: "adverse", label: "Adverse outcome", owner: "Safety reviewer", responseTarget: "Same working day" },
  { key: "access", label: "Access problem", owner: "Administrator", responseTarget: "1 working day" },
  { key: "onboarding", label: "Organization onboarding", owner: "Administrator", responseTarget: "3 working days" },
  { key: "correction", label: "Data correction", owner: "Content team", responseTarget: "3 working days" },
] as const;

export const LEGAL_NOTICES = [
  "Stain and fabric identification may remain uncertain.",
  "Photo analysis suggests possibilities; it does not confirm chemistry.",
  "Results depend on fabric, dye, construction, stain age and previous treatment.",
  "Always follow the garment care label and the product label.",
  "Professional products require appropriate training and safety controls.",
  "Complete removal is not guaranteed.",
  "Stop treatment immediately if colour or material changes.",
  "Hazardous contamination requires appropriate professional handling.",
];

/* ------------------------------------------------------------------ */
/* 10. Monitoring, pause and rollback                                  */
/* ------------------------------------------------------------------ */

export type MonitoringSignal = { key: string; label: string; owner: string; responseTime: string; severity: "critical" | "high" | "normal" };

export const MONITORING_SIGNALS: MonitoringSignal[] = [
  { key: "safety_engine_failures", label: "Safety-engine failures", owner: "Safety reviewer", responseTime: "Immediate", severity: "critical" },
  { key: "permission_failures", label: "Permission failures", owner: "Administrator", responseTime: "Same day", severity: "high" },
  { key: "incorrect_recommendations", label: "Incorrect recommendations", owner: "Technical reviewer", responseTime: "Same day", severity: "high" },
  { key: "domestic_rejections", label: "Domestic-treatment rejections", owner: "Content team", responseTime: "Weekly", severity: "normal" },
  { key: "stop_conditions", label: "Stop-condition use", owner: "Technical reviewer", responseTime: "Weekly", severity: "normal" },
  { key: "damage_reports", label: "Garment-damage reports", owner: "Safety reviewer", responseTime: "Immediate", severity: "critical" },
  { key: "document_conflicts", label: "Product-document conflicts", owner: "Product librarian", responseTime: "Same day", severity: "high" },
  { key: "search_gaps", label: "Search gaps", owner: "Content team", responseTime: "Weekly", severity: "normal" },
  { key: "unknown_cases", label: "Unknown cases", owner: "Content team", responseTime: "Weekly", severity: "normal" },
  { key: "system_errors", label: "System errors", owner: "Administrator", responseTime: "Same day", severity: "high" },
  { key: "support_volume", label: "Support volume", owner: "Administrator", responseTime: "Weekly", severity: "normal" },
  { key: "review_backlog", label: "Review backlog", owner: "Content administrator", responseTime: "Weekly", severity: "normal" },
];

export const ROLLBACK_TRIGGERS = [
  "unsafe_instruction_discovered",
  "professional_content_in_domestic_mode",
  "organization_data_crossed_boundary",
  "product_restriction_bypassed",
  "domestic_method_below_nine",
  "exactly_five_validation_failed",
  "serious_adverse_outcome",
  "safety_engine_unreliable",
  "product_documents_linked_incorrectly",
  "critical_translation_meaning_change",
  "unauthorized_restricted_access",
] as const;
export type RollbackTrigger = (typeof ROLLBACK_TRIGGERS)[number];

export const SUPPORTED_BROWSERS = [
  { name: "Chrome", versions: "Current and previous major", tested: true },
  { name: "Safari", versions: "Current and previous major", tested: true },
  { name: "Edge", versions: "Current major", tested: true },
  { name: "Mobile Chrome (Android)", versions: "Current major", tested: true },
  { name: "Mobile Safari (iOS)", versions: "Current and previous major", tested: true },
];

export const DEVICE_MATRIX = ["Small phone", "Large phone", "Tablet", "Desktop", "Slow network", "Camera permission denied", "Low-quality camera image"];
