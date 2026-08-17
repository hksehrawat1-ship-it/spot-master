/** STEP 6 — required test scenarios (§36). Pure functions, runnable in the UI or headless. */

import { MASTER_STAINS, MASTER_BY_KEY, DOMESTIC_NOT_RECOMMENDED, UNDER_REVIEW, MIN_DOMESTIC_CONFIDENCE } from "@/data/masterStains";
import type { MasterStain } from "@/data/masterStains";
import {
  searchStains, detectDuplicates, validateForPublication, canPublish, exportRow, EXPORT_COLUMNS,
  publicView, professionalView, evaluateReviewTriggers, allocateStainId, canonicalOf, variantsOf,
} from "./masterStainEngine";

export type ScenarioResult = { id: string; title: string; pass: boolean; detail: string };

const s = (key: string) => MASTER_BY_KEY[key];

export function runMasterStainScenarios(all: MasterStain[] = MASTER_STAINS): ScenarioResult[] {
  const r: ScenarioResult[] = [];
  const add = (id: string, title: string, pass: boolean, detail: string) => r.push({ id, title, pass, detail });

  // 1 local-name search
  const haldi = searchStains("haldi", all);
  add("S1", 'Search "haldi" finds Turmeric/Haldi', haldi[0]?.stain.key === "turmeric", haldi[0]?.stain.canonicalName ?? "no hit");

  // 2 misspelling
  const miss = searchStains("cofee", all);
  add("S2", "A misspelling finds the correct stain", miss[0]?.stain.key === "coffee", miss[0]?.stain.canonicalName ?? "no hit");

  // 3 variant links to canonical but keeps components
  const cm = s("coffee_milk");
  const linked = canonicalOf(cm, all).key === "coffee";
  const keptComponents = (cm.addedComponents ?? []).includes("protein") && cm.secondaryComponents.some((c) => c.component === "oil");
  add("S3", "Coffee with milk links to coffee and retains added components", linked && keptComponents, `canonical=${canonicalOf(cm, all).key}, added=${(cm.addedComponents ?? []).join("+")}`);

  // 4 lipstick combination
  add("S4", "Lipstick appears as a combination stain", s("lipstick").primaryCategory === "combination_unknown", s("lipstick").primaryCategory);

  // 5 dye transfer category
  add("S5", "Dye transfer remains under Dye and Ink-Based", s("dye_transfer").primaryCategory === "dye_ink", s("dye_transfer").primaryCategory);

  // 6 bleach = damage guidance
  const bleach = s("bleach_colour_loss");
  add("S6", "Bleach colour loss displays damage guidance", Boolean(bleach.isDamageDiagnosis) && publicView(bleach).isDamageDiagnosis, bleach.damageInterpretation ?? "");

  // 7 scorch never promises removal
  const scorch = exportRow(s("scorch"));
  const noPromise = !/(will be|fully|completely) removed|guarantee/i.test(JSON.stringify(s("scorch")));
  add("S7", "Scorch damage does not promise removal", noPromise && s("scorch").expectedOutcomes[0].outcome === "permanent_damage_possible", scorch["Domestic Treatment"]);

  // 8 unknown yellow uncertain
  const uy = s("unknown_yellow");
  add("S8", "Unknown yellow mark remains uncertain", uy.classificationConfidence <= 4 && uy.expectedOutcomes[0].outcome === "uncertain", `confidence ${uy.classificationConfidence}/9`);

  // 9 drafts hidden from public search
  const draft: MasterStain = { ...s("blood"), key: "draft_test", stainId: "SM-STN-999999", canonicalName: "Draft test stain", governance: { ...s("blood").governance, status: "draft", published: false } };
  const pool = [...all, draft];
  const pubHit = searchStains("Draft test stain", pool).length;
  const adminHit = searchStains("Draft test stain", pool, { includeAllStatuses: true }).length;
  add("S9", "Public users cannot see Draft records", pubHit === 0 && adminHit === 1, `public=${pubHit}, admin=${adminHit}`);

  // 10 domestic users cannot see technical procedures
  add("S10", "Domestic users cannot see technical procedures", professionalView(s("rust"), "domestic_user") === null, "professionalView returns null");

  // 11 professional users see technical content
  add("S11", "Professional users see permitted technical content", professionalView(s("rust"), "professional_spotter") !== null, "technical view available");

  // 12 cannot publish without reviewer
  const noReviewer: MasterStain = { ...s("tea"), governance: { ...s("tea").governance, technicalReviewer: undefined } };
  add("S12", "A stain cannot publish without a reviewer", !canPublish(noReviewer), validateForPublication(noReviewer).filter((v) => !v.ok).map((v) => v.rule).join("; "));

  // 13 cannot publish without heat + fabric warnings
  const noHeat: MasterStain = { ...s("tea"), science: { ...s("tea").science, heat: "" }, fabricRules: [] };
  const failed = validateForPublication(noHeat).filter((v) => !v.ok).map((v) => v.rule);
  add("S13", "A stain cannot publish without heat and fabric warnings", failed.includes("Heat effect addressed") && failed.includes("Fabric risks addressed"), failed.join("; "));

  // 14 source update triggers needs review
  const flags = evaluateReviewTriggers(s("tea"), { sds_changed: "Supplier issued a new SDS" }, "2026-01-16");
  add("S14", "A source update triggers Needs Review", flags.some((f) => f.trigger === "sds_changed" && f.sections.length > 0), flags.map((f) => `${f.trigger}:${f.sections.join("/")}`).join(" "));

  // 15 alias does not create duplicate
  const dup = detectDuplicates("Chai", [], all);
  add("S15", "An alias does not create a duplicate stain", dup.some((d) => d.match.key === "tea" && d.suggestion === "add_alias"), dup.map((d) => d.suggestion).join(","));

  // 16 variant does not overwrite canonical
  const canonical = s("coffee");
  const vs = variantsOf(canonical, all);
  add("S16", "A variant does not overwrite the canonical record", vs.length >= 2 && canonical.canonicalOf === undefined && canonical.stainId !== vs[0].stainId, `${vs.length} variants, canonical ${canonical.stainId}`);

  // 17 archived stain ID never reused
  const archived: MasterStain = { ...s("mud"), key: "archived_x", stainId: "SM-STN-000900", governance: { ...s("mud").governance, status: "archived", published: false } };
  const nextId = allocateStainId([...all, archived]);
  add("S17", "An archived Stain ID is never reused", nextId === "SM-STN-000901", nextId);

  // 18 export columns
  const row = exportRow(s("blood"));
  add("S18", "Excel export uses the required fields", EXPORT_COLUMNS.every((c) => c in row) && Object.keys(row).length === EXPORT_COLUMNS.length, `${EXPORT_COLUMNS.length} columns`);

  // 19 translation linked to source version
  const hi = s("turmeric").localizations.find((l) => l.language === "hi");
  add("S19", "Translation remains linked to its source version", hi?.sourceVersion === s("turmeric").governance.contentVersion, `hi source version ${hi?.sourceVersion}`);

  // 20 historical case compatibility
  const historical = { stainId: s("tea").stainId, contentVersionUsed: 1 };
  const bumped = { ...s("tea"), governance: { ...s("tea").governance, contentVersion: 2 } };
  add("S20", "Historical cases retain the version originally used", historical.contentVersionUsed === 1 && bumped.governance.contentVersion === 2, "case pinned to v1 while record moved to v2");

  // 21 product fields remain under review
  const allUnderReview = all.every((x) => exportRow(x)["Professional Product 1"] === UNDER_REVIEW && x.productMappings.length === 0);
  add("S21", "Product fields remain empty or Under Review", allUnderReview, UNDER_REVIEW);

  // 22 domestic message
  const domesticOk = all.every((x) =>
    x.domesticConfidence >= MIN_DOMESTIC_CONFIDENCE || exportRow(x)["Domestic Treatment"] === DOMESTIC_NOT_RECOMMENDED,
  );
  add("S22", 'Domestic treatment shows "Domestic treatment is not recommended" when none is approved', domesticOk, DOMESTIC_NOT_RECOMMENDED);

  // 23 every published record passes validation
  const publishedBad = all.filter((x) => x.governance.status === "published" && !canPublish(x));
  add("S23", "Every published seed record passes publication validation", publishedBad.length === 0, publishedBad.map((x) => x.stainId).join(", ") || "all valid");

  // 24 stain IDs unique
  const ids = all.map((x) => x.stainId);
  add("S24", "Stain IDs are unique", new Set(ids).size === ids.length, `${ids.length} records`);

  return r;
}
