import {
  HelpCircle,
  Droplets,
  CupSoda,
  Wine,
  Egg,
  Mountain,
  Paintbrush,
  Shuffle,
  Sun,
  Clock,
  Wrench,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

/**
 * Presentation layer for the twelve stain categories.
 * Titles are operator-facing; the technical name is secondary text only.
 * No stain counts are declared here — counts must be derived from approved records.
 */
export type CategoryCard = {
  key: string;
  title: string;
  technicalName: string;
  examples: string[];
  icon: LucideIcon;
};

export const CATEGORY_CARDS: CategoryCard[] = [
  {
    key: "combination",
    title: "Unknown or Mixed Stains",
    technicalName: "Combination stains",
    examples: ["Unidentified marks", "Food spills", "Cosmetics"],
    icon: HelpCircle,
  },
  {
    key: "oil",
    title: "Oil & Grease",
    technicalName: "Oil / grease-based stains",
    examples: ["Cooking oil", "Butter", "Machine grease"],
    icon: Droplets,
  },
  {
    key: "water",
    title: "Drinks & Water-Based",
    technicalName: "Water-based stains",
    examples: ["Soft drinks", "Juice", "Water marks"],
    icon: CupSoda,
  },
  {
    key: "tannin",
    title: "Tea, Coffee, Wine & Tannins",
    technicalName: "Dye-based / tannin stains",
    examples: ["Tea", "Coffee", "Red wine"],
    icon: Wine,
  },
  {
    key: "protein",
    title: "Blood, Egg, Milk & Protein",
    technicalName: "Protein-based stains",
    examples: ["Blood", "Egg", "Milk"],
    icon: Egg,
  },
  {
    key: "particulate",
    title: "Mud, Dust & Solid Deposits",
    technicalName: "Particulate (solid) stains",
    examples: ["Mud", "Soot", "Clay"],
    icon: Mountain,
  },
  {
    key: "pigment",
    title: "Paint, Ink & Pigments",
    technicalName: "Pigment / paint stains",
    examples: ["Ballpoint ink", "Emulsion paint", "Toner"],
    icon: Paintbrush,
  },
  {
    key: "dye-transfer",
    title: "Colour Transfer & Bleeding",
    technicalName: "Dye transfer / colour bleeding",
    examples: ["Denim transfer", "Bled trim", "Wash crocking"],
    icon: Shuffle,
  },
  {
    key: "oxidizable",
    title: "Yellowing & Oxidation",
    technicalName: "Oxidizable stains",
    examples: ["Underarm yellowing", "Storage yellowing", "Perspiration"],
    icon: Sun,
  },
  {
    key: "heat-set",
    title: "Old & Heat-Set Stains",
    technicalName: "Heat-set / aged stains",
    examples: ["Ironed-in marks", "Tumble-dried stains", "Stored garments"],
    icon: Clock,
  },
  {
    key: "reducible",
    title: "Rust & Mineral Deposits",
    technicalName: "Reducible (metal / rust) stains",
    examples: ["Rust", "Hard-water marks", "Metal transfer"],
    icon: Wrench,
  },
  {
    key: "chemical",
    title: "Chemical Marks & Fabric Damage",
    technicalName: "Chemical stains / fabric damage",
    examples: ["Bleach spots", "Acid marks", "Colour loss"],
    icon: AlertTriangle,
  },
];

export const QUICK_SAFETY_CASES = [
  { key: "unknown-stain", label: "Unknown stain", hint: "Treat cautiously and test first" },
  { key: "unknown-fabric", label: "Unknown fabric", hint: "Identify the fibre before treating" },
  { key: "no-care-label", label: "No care label", hint: "Assume the most sensitive route" },
  { key: "colour-bleeding", label: "Colour bleeding", hint: "Check dye fastness before wetting" },
  { key: "possible-damage", label: "Possible fabric damage", hint: "Assess damage before treatment" },
  { key: "previously-treated", label: "Previously treated stain", hint: "Residual chemistry may react" },
] as const;
