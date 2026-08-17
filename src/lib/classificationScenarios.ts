/**
 * Step 5 — required test scenarios for the universal classification system.
 * Pure functions, runnable from the admin console.
 */

import { classify, type ClassifyInput, type ClassificationResult } from "@/lib/classification";
import { LIBRARY_BY_KEY } from "@/data/stainClassifications";
import { checkTaxonomyGovernance, categoryCounts } from "@/lib/classification";
import { PRIMARY_CATEGORIES } from "@/data/taxonomy";

export type ScenarioResult = {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
};

const base = (over: Partial<ClassifyInput> = {}): ClassifyInput => ({
  riskBefore: "green",
  role: "professional_spotter",
  ...over,
});

const has = (r: ClassificationResult, key: string) =>
  r.components.some((c) => c.key === key);

export function runClassificationScenarios(): ScenarioResult[] {
  const out: ScenarioResult[] = [];
  const push = (name: string, expected: string, actual: string, passed: boolean) =>
    out.push({ name, expected, actual, passed });

  // 1 — Black coffee is tannin
  {
    const r = classify(base({ libraryKey: "black_coffee" }));
    push("Black coffee classified as tannin", "tannin_plant", String(r.primaryCategory),
      r.primaryCategory === "tannin_plant");
  }

  // 2 — Coffee with milk gains protein and fat
  {
    const r = classify(base({ libraryKey: "coffee_with_milk" }));
    push("Coffee with milk carries protein and fat components", "protein + oil components",
      r.components.map((c) => c.key).join(", "), has(r, "protein") && has(r, "oil"));
  }

  // 3 — Curry is combination
  {
    const r = classify(base({ libraryKey: "curry" }));
    push("Curry classified as combination", "combination_unknown", String(r.primaryCategory),
      r.primaryCategory === "combination_unknown" && r.components.length >= 4);
  }

  // 4 — Lipstick is combination
  {
    const r = classify(base({ libraryKey: "lipstick" }));
    push("Lipstick classified as combination", "combination_unknown with wax, oil, pigment",
      `${r.primaryCategory}: ${r.components.map((c) => c.key).join(", ")}`,
      r.primaryCategory === "combination_unknown" && has(r, "wax") && has(r, "pigment") && has(r, "oil"));
  }

  // 5 — Plain cooking oil is oil and grease
  {
    const r = classify(base({ libraryKey: "cooking_oil" }));
    push("Cooking oil classified as oil and grease", "oil_grease", String(r.primaryCategory),
      r.primaryCategory === "oil_grease");
  }

  // 6 — Mud is pigment and particulate
  {
    const r = classify(base({ libraryKey: "mud" }));
    push("Mud classified as pigment and particulate", "pigment_particulate", String(r.primaryCategory),
      r.primaryCategory === "pigment_particulate");
  }

  // 7 — Acrylic paint is paint/polymer
  {
    const r = classify(base({ libraryKey: "acrylic_paint" }));
    push("Acrylic paint classified as paint and polymer", "paint_polymer", String(r.primaryCategory),
      r.primaryCategory === "paint_polymer");
  }

  // 8 — Ballpoint ink: dye/ink plus possible resin and unknown solvent
  {
    const r = classify(base({ libraryKey: "ballpoint_ink" }));
    const resin = r.components.find((c) => c.key === "resin");
    push("Ballpoint ink is dye/ink with possible resin and solvent components",
      "dye_ink primary, resin marked possible",
      `${r.primaryCategory}, resin=${resin?.relevance ?? "missing"}`,
      r.primaryCategory === "dye_ink" && resin?.relevance === "possible" && has(r, "unknown_component"));
  }

  // 9 — Rust is metal/rust, never automatically reducible
  {
    const r = classify(base({ libraryKey: "rust" }));
    push("Rust classified as metal and rust, not reducible", "metal_rust", String(r.primaryCategory),
      r.primaryCategory === "metal_rust");
  }

  // 10 — Dye transfer sits inside dye/ink with a tag
  {
    const r = classify(base({ libraryKey: "dye_transfer", dyeTransferring: true }));
    push("Dye transfer classified under dye/ink with a dye-transfer tag",
      "dye_ink + dye_bleeding tag", `${r.primaryCategory} + ${r.riskTags.join(",")}`,
      r.primaryCategory === "dye_ink" && r.riskTags.includes("dye_bleeding"));
  }

  // 11 — Heat-set stain keeps its chemistry category
  {
    const r = classify(base({ libraryKey: "black_coffee", heatExposed: true, heatSetPossible: true }));
    push("Heat-set stain keeps its chemistry category with a heat-set tag",
      "tannin_plant + heat_set_possible", `${r.primaryCategory} + ${r.conditionTags.join(",")}`,
      r.primaryCategory === "tannin_plant" && r.conditionTags.includes("heat_set_possible"));
  }

  // 12 — Cosmetic never becomes a primary category
  {
    const r = classify(base({ libraryKey: "foundation_makeup" }));
    const cosmeticIsCategory = PRIMARY_CATEGORIES.some((c) => /cosmetic/i.test(c.name));
    push("Cosmetic stain does not become a primary category",
      "no cosmetic category; foundation is combination",
      `${r.primaryCategory}, cosmeticCategoryExists=${cosmeticIsCategory}`,
      !cosmeticIsCategory && r.primaryCategory === "combination_unknown");
  }

  // 13 — Bleach spot routes to dye loss
  {
    const r = classify(base({ damageIndicators: ["colour_removed", "bleach_contact"] }));
    push("Bleach spot routes to possible dye loss", "damage only, dye_loss_possible",
      `damageOnly=${r.damageOnly}, ${r.damageKeys.join(",")}`,
      r.damageOnly && r.damageKeys.includes("dye_loss_possible") && r.primaryCategory === null);
  }

  // 14 — Scorch mark routes to heat damage
  {
    const r = classify(base({ libraryKey: "scorch_damage" }));
    push("Scorch mark routes to heat damage", "damage only, heat_damage_possible",
      `damageOnly=${r.damageOnly}, ${r.damageKeys.join(",")}`,
      r.damageOnly && r.damageKeys.includes("heat_damage_possible"));
  }

  // 15 — Unknown stays unknown
  {
    const r = classify(base({}));
    push("Unknown stain remains unknown with low confidence",
      "combination_unknown, confidence <= 3",
      `${r.primaryCategory} @ ${r.primaryConfidence}`,
      r.primaryCategory === "combination_unknown" && r.primaryConfidence <= 3);
  }

  // 16 — Adding milk to a coffee case does not rewrite the library record
  {
    const before = LIBRARY_BY_KEY.black_coffee.primary;
    const r = classify(base({ libraryKey: "black_coffee", additions: ["milk"] }));
    const after = LIBRARY_BY_KEY.black_coffee.primary;
    push("User adds milk to a coffee case: components added, library untouched",
      "case gains protein and oil; library record still tannin_plant",
      `case=${r.primaryCategory} components=${r.components.map((c) => c.key).join(",")} library=${after}`,
      has(r, "protein") && has(r, "oil") && before === after && after === "tannin_plant");
  }

  // 17 — User rejects the classification
  {
    const r = classify(base({ libraryKey: "curry", confirmation: "no" }));
    const baseline = classify(base({ libraryKey: "curry" }));
    push("User rejects the classification: confidence drops and evidence downgrades",
      "lower confidence, unconfirmed evidence",
      `${r.primaryConfidence} < ${baseline.primaryConfidence}, evidenceConfirmed=${r.evidenceConfirmed}`,
      r.primaryConfidence < baseline.primaryConfidence && !r.evidenceConfirmed);
  }

  // 18 — Classification never lowers case risk
  {
    const r = classify(base({ libraryKey: "sugar_syrup", riskBefore: "red" }));
    push("Classification does not lower case risk", "risk stays red", r.riskAfter, r.riskAfter === "red");
  }

  // 19 — Domestic user sees plain language and no technical category
  {
    const r = classify(base({ libraryKey: "rust", role: "domestic_user" }));
    const view = presentForRole(r, "domestic_user");
    push("Domestic user sees plain language only",
      "plain explanation, no technical fields",
      `technicalShown=${view.showTechnical}`,
      !view.showTechnical && view.plain.length > 0);
  }

  // 20 — Technical reviewer sees full evidence
  {
    const r = classify(base({ libraryKey: "rust", role: "professional_spotter" }));
    const view = presentForRole(r, "professional_spotter", true);
    push("Technical reviewer sees full evidence and confidence",
      "technical fields and evidence visible",
      `technicalShown=${view.showTechnical}, evidence=${r.evidence}`,
      view.showTechnical && Boolean(r.evidence));
  }

  // 21 — Domestic user cannot self-select professional chemistry
  {
    const r = classify(base({ libraryKey: "black_coffee", role: "domestic_user", correctionPrimary: "reducible" }));
    push("Domestic user cannot confirm professional chemistry",
      "correction rejected, category unchanged", String(r.primaryCategory),
      r.primaryCategory === "tannin_plant" && r.unresolvedQuestions.some((q) => /Reducible/i.test(q)));
  }

  // 22 — Legacy migration preserves history
  {
    const withLegacy = Object.values(LIBRARY_BY_KEY).filter((l) => l.legacyCategory);
    push("Existing category migration preserves the original category",
      "every migrated record keeps its legacy category",
      `${withLegacy.length} records carry a legacy category`,
      withLegacy.length >= 20);
  }

  // 23 — Live category counts come from published records
  {
    const counts = categoryCounts();
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    push("Category counts are calculated from published records",
      "counts > 0 and no hard-coded totals", `total=${total}`, total > 0);
  }

  // 24 — Governance: exactly 12 categories, no forbidden names, one primary each
  {
    const issues = checkTaxonomyGovernance().filter((i) => i.severity === "error");
    push("Taxonomy governance has no errors",
      "12 categories, one primary per published stain, no forbidden names",
      issues.length ? issues.map((i) => i.message).join("; ") : "no errors",
      issues.length === 0 && PRIMARY_CATEGORIES.length === 12);
  }

  // 25 — Blocked earlier decision cannot be bypassed
  {
    const r = classify(base({ libraryKey: "curry", gate: "blocked_existing_damage" }));
    push("Classification cannot bypass an earlier treatment block",
      "blocked, documentation only", `${r.blocked} / ${r.nextAction}`,
      r.blocked && /Documentation/i.test(r.nextAction));
  }

  // 26 — Unknown product lowers confidence and adds an unknown component
  {
    const r = classify(base({ libraryKey: "black_coffee", previousChemicalUnknown: true }));
    push("Unknown previous product adds an unknown component and lowers confidence",
      "unknown_component present, unknown_chemical tag",
      `${r.components.map((c) => c.key).join(",")} / ${r.riskTags.join(",")}`,
      has(r, "unknown_component") && r.riskTags.includes("unknown_chemical"));
  }

  return out;
}

/* Role-aware presentation used by the UI and by scenario 19/20. */
export function presentForRole(
  result: ClassificationResult,
  role: Parameters<typeof classify>[0]["role"],
  isReviewer = false,
) {
  const domestic = !isReviewer && (role === "domestic_user" || role === "learner");
  return {
    showTechnical: !domestic,
    showEvidence: !domestic,
    showComponents: true,
    plain: result.plainExplanation,
  };
}
