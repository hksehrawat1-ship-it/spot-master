/**
 * Machine-readable Stain Master Constitution.
 * Source of truth in prose: STAIN_MASTER_CONSTITUTION.md
 * These constants are enforced by contentGate.ts, the safety engine and the AI function.
 */

export const CONSTITUTION_RULES = [
  { id: "R1", rule: "Stain Master is decision support and safety guidance, not guaranteed stain removal." },
  { id: "R2", rule: "Never guarantee complete stain removal." },
  { id: "R3", rule: "Fabric safety takes priority over stain removal." },
  { id: "R4", rule: "Unknown, uncertain or unlabeled fabric means take the safest compatible path." },
  { id: "R5", rule: "A hidden-area test is required whenever compatibility or colourfastness is uncertain." },
  { id: "R6", rule: "Existing damage, active colour bleeding or unknown previous chemicals block treatment." },
  { id: "R7", rule: "Domestic treatment displays only at confidence >= 9/10 and status approved or published." },
  { id: "R8", rule: "Professional guidance requires an approved label, spotting chart, TDS, SDS or reviewed source." },
  { id: "R9", rule: "Never invent dilution, temperature, dwell time, dosage, compatibility, neutralization or safety data." },
  { id: "R10", rule: "Without an approved instruction, show the product-label fallback line." },
  { id: "R11", rule: "Every published record needs source, version, approval status, reviewer and review date." },
  { id: "R12", rule: "AI may suggest stain identities only." },
  { id: "R13", rule: "AI cannot approve treatment chemistry; deterministic safety runs after AI." },
  { id: "R14", rule: "AI or safety-engine failure shows a safe unavailable message." },
  { id: "R15", rule: "Safety blocks cannot be bypassed client-side." },
  { id: "R16", rule: "Roles come only from the user_roles table." },
  { id: "R17", rule: "No hardcoded email, OTP or demo credential grants authority in production." },
  { id: "R18", rule: "Interface restrictions are always backed by server-side rules." },
  { id: "R19", rule: "Secrets stay in server-side function environments." },
  { id: "R20", rule: "Companies, products, kits and countries are data, not code branches." },
  { id: "R21", rule: "India first, with future countries, languages and regional availability supported." },
  { id: "R22", rule: "The database is authoritative; hardcoded records are marked demonstration data." },
  { id: "R23", rule: "Safety-critical guidance fails closed." },
  { id: "R24", rule: "Legacy course platform stays behind a feature flag." },
] as const;

/** Rule 10 — the only permitted text when an approved instruction is missing. */
export const LABEL_FALLBACK_INSTRUCTION =
  "Follow the current product label or technical data sheet.";

/** Rule 7 — minimum evidence confidence before a domestic method may be shown. */
export const DOMESTIC_MIN_CONFIDENCE = 9;

/** Rule 11 — fields every publishable record must carry. */
export const REQUIRED_PUBLICATION_FIELDS = [
  "source",
  "version",
  "approvalStatus",
  "reviewer",
  "reviewDate",
] as const;

/** Rule 6 — blocks that no role and no client code may override. */
export const NON_OVERRIDABLE_BLOCKS = [
  "existing_damage",
  "active_colour_bleeding",
  "unknown_previous_chemical",
  "possible_hazard",
] as const;

export type NonOverridableBlock = (typeof NON_OVERRIDABLE_BLOCKS)[number];

export function isNonOverridableBlock(reason: string): boolean {
  return (NON_OVERRIDABLE_BLOCKS as readonly string[]).includes(reason);
}

/** Rule 2 — guard used by tests and content review to reject removal promises. */
const GUARANTEE_PATTERNS = [
  /guarantee[sd]?\s+(complete\s+)?(stain\s+)?removal/i,
  /100%\s+removal/i,
  /will\s+(completely\s+)?remove\s+(the\s+)?stain/i,
  /removes\s+every\s+stain/i,
];

export function containsRemovalGuarantee(text: string): boolean {
  return GUARANTEE_PATTERNS.some((p) => p.test(text));
}
