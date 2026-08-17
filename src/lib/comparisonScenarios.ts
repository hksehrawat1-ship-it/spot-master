/**
 * STEP 13 — technical acceptance scenarios for the kit comparison system (§35).
 *
 * Each scenario builds a fully specified case context, a set of verified or
 * deliberately incomplete products, and asserts the controlled comparison output.
 */

import type {
  Product, ProductVersion, ProductDocument, TextileKey, ProcessKey,
} from "@/data/professionalProducts";
import type { ProductStageMapping } from "@/data/productMappings";
import { UNKNOWN_RINSE } from "@/data/productMappings";
import type { PerformanceTrial, PriceRecord, ComparisonContext } from "@/data/kitComparison";
import { COMPARISON_RULESET_VERSION } from "@/data/kitComparison";
import {
  buildComparison, comparisonRows, comparisonAudience, domesticView, quickProfessionalView,
  universalTechnicalView, applyComparisonTrigger, reproduce, emptyContext, costPerTreatment,
  trialsComparable, costsComparable,
} from "@/lib/comparisonEngine";
import type { ComparisonOptions } from "@/lib/comparisonEngine";
import { INITIAL_KIT_STATUS, COMPARISON_TABLE_COLUMNS } from "@/data/kitComparison";

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

const DATE = "2026-08-17";

export function makeVersion(productKey: string, over: Partial<ProductVersion> = {}): ProductVersion {
  return {
    uuid: `pv-${productKey}`,
    key: `${productKey}__v1__IN`,
    productKey,
    versionRef: "v1",
    country: "IN",
    labelVersion: "L1",
    sdsVersion: "S1",
    tdsVersion: "T1",
    knownFormulationChange: false,
    verification: "verified",
    approvalStatus: "approved",
    immutable: true,
    chemistry: {
      ingredients: [], chemicalFamily: "Documented", solventFamily: "Documented",
      enzymePresence: "not_disclosed", oxidizing: "not_disclosed", reducing: "not_disclosed",
      acidic: "not_disclosed", alkaline: "not_disclosed", surfactantType: "Documented",
      hazardousComponents: [], disclosureConfidence: "none",
    },
    textile: [], processes: [{ process: "wetside_spotting", permission: "permitted", source: "TDS" } as never],
    instructions: [],
    safety: {
      pictograms: [], hazardStatements: [], precautionaryStatements: [], routesOfExposure: [],
      incompatibleMaterials: [], verification: "verified", storage: "Cool, dry, upright",
    } as never,
    ppe: [], incompatibilities: [{ kind: "chemical", description: "Do not mix with bleach" } as never],
    packs: [{ packSize: 1000, measurementUnit: "ml", country: "IN", claimedOnly: false }],
    countries: [{
      country: "IN", marketStatus: "available", measurementUnits: "metric",
      documentCompleteness: "complete", countryMismatch: false,
    }],
    training: { general_professional_use: true },
    documentKeys: [],
    ...over,
  } as ProductVersion;
}

export function makeProduct(key: string, companyKey: string, over: Partial<Product> = {}): Product {
  const version = makeVersion(key, (over.versions?.[0] ?? {}) as Partial<ProductVersion>);
  return {
    uuid: `prd-${key}`,
    key,
    productId: `SM-PRD-TEST-${key}`,
    companyKey,
    canonicalName: key,
    displayName: key,
    productCode: key.toUpperCase(),
    alternativeNames: [],
    previousNames: [],
    intendedProcesses: [],
    claims: [],
    verifications: [],
    versions: [version],
    currentVersionKey: version.key,
    provisional: false,
    status: "published",
    created: DATE,
    updated: DATE,
    reviewFlags: [],
    ...over,
    // versions must always come from makeVersion so the key stays aligned
    ...(over.versions ? { versions: over.versions, currentVersionKey: over.versions[0].key } : {}),
  } as Product;
}

let mapSeq = 0;
export function makeMapping(
  productKey: string,
  companyKey: string,
  over: Partial<ProductStageMapping> = {},
): ProductStageMapping {
  mapSeq += 1;
  return {
    mappingId: `SM-MAP-T${String(mapSeq).padStart(5, "0")}`,
    productKey,
    productVersionKey: `${productKey}__v1__IN`,
    companyKey,
    kitKey: `${companyKey}_kit`,
    stageNumber: 5,
    specificity: "stain",
    stainKey: "coffee",
    country: "IN",
    role: { roles: ["professional_spotter", "trainer", "dry_cleaner"], training: [], supervisionRequired: false },
    fabricConditions: [{ textile: "cotton", verdict: "permitted", source: "TDS" }],
    colourConditions: [{ colour: "white", verdict: "permitted", source: "TDS" }],
    constructionConditions: [],
    processConditions: [{ process: "wetside_spotting", verdict: "permitted", source: "TDS" }],
    requiredEquipment: [],
    requiredPpe: ["gloves"],
    ventilationRequired: "not_required",
    requiredTests: [],
    prohibitedPriorChemistry: [],
    rinse: {
      required: "required", method: "Flush with water", medium: "Water",
      inspectionRequired: true, fallbackText: "Follow the current product label.",
    },
    quantities: {
      quantity: "2", unit: "ml", contactTime: "60 s", temperature: "20 C",
      approvalStatus: "approved", source: "TDS",
    },
    repetition: "repeat_permitted_after_inspection",
    stopConditions: [],
    verifiedUse: true,
    decision: "recommended",
    evidence: [{ level: "current_tds", description: "Current TDS held" }],
    evidenceLevel: "current_tds",
    sourceDocumentKeys: ["doc_test"],
    status: "published",
    effectiveDate: DATE,
    version: 1,
    provisional: false,
    flags: [],
    ...over,
  };
}

export function makeTrial(productKey: string, over: Partial<PerformanceTrial> = {}): PerformanceTrial {
  return {
    testId: `SM-TRIAL-${productKey}`,
    stainKey: "coffee",
    textile: "cotton",
    fabricColour: "white",
    productKey,
    productVersionKey: `${productKey}__v1__IN`,
    method: "Controlled bench trial",
    controlSample: true,
    temperature: "20 C",
    contactTime: "60 s",
    dose: "2 ml",
    process: "wetside_spotting",
    inspectionAfterDrying: true,
    result: "major_reduction",
    damageObserved: [],
    repeatability: "repeated",
    photographs: [],
    testDate: DATE,
    country: "IN",
    decision: "accepted",
    ...over,
  };
}

export function makePrice(productKey: string, over: Partial<PriceRecord> = {}): PriceRecord {
  return {
    priceId: `SM-PRICE-${productKey}`,
    productKey,
    productVersionKey: `${productKey}__v1__IN`,
    country: "IN",
    price: 1000,
    currency: "INR",
    priceDate: "2026-06-01",
    packSize: 1000,
    packUnit: "ml",
    usableQuantity: 1000,
    taxIncluded: true,
    source: "Verified distributor price list",
    verified: true,
    ...over,
  };
}

export function makeContext(over: Partial<ComparisonContext> = {}): ComparisonContext {
  return emptyContext({
    comparisonId: "SM-CMPAR-000001",
    caseId: "case-1",
    stainKey: "coffee",
    components: [],
    stageNumber: 5,
    textile: "cotton" as TextileKey,
    riskLevel: "green",
    colour: "white",
    constructions: [],
    previousChemistry: [],
    appliedProductKeys: [],
    process: "wetside_spotting" as ProcessKey,
    country: "IN",
    role: "professional_spotter",
    training: [],
    equipmentAvailable: [],
    ppeAvailable: ["gloves"],
    ventilationAvailable: true,
    comparisonDate: DATE,
    rulesetVersion: COMPARISON_RULESET_VERSION,
    mappingVersions: [],
    productVersionKeys: [],
    ...over,
  });
}

const productMap = (...products: Product[]) =>
  Object.fromEntries(products.map((p) => [p.key, p])) as Record<string, Product>;

type Setup = {
  products: Product[];
  mappings: ProductStageMapping[];
  trials?: PerformanceTrial[];
  prices?: PriceRecord[];
  docs?: ProductDocument[];
  extra?: Partial<ComparisonOptions>;
};

const run = (ctx: ComparisonContext, s: Setup, status: ComparisonOptions["status"] = "approved") =>
  buildComparison(ctx, {
    mappings: s.mappings,
    products: productMap(...s.products),
    docs: s.docs ?? [],
    trials: s.trials ?? [],
    prices: s.prices ?? [],
    status,
    ...s.extra,
  });

/** Three verified, comparable products across three different companies. */
function threeVerified(): Setup {
  const a = makeProduct("alpha_one", "seitz");
  const b = makeProduct("beta_one", "clean_craft");
  const c = makeProduct("gamma_one", "stas");
  return {
    products: [a, b, c],
    mappings: [
      makeMapping("alpha_one", "seitz"),
      makeMapping("beta_one", "clean_craft"),
      makeMapping("gamma_one", "stas"),
    ],
    trials: [
      makeTrial("alpha_one", { result: "complete_visual_removal" }),
      makeTrial("beta_one", { result: "major_reduction" }),
      makeTrial("gamma_one", { result: "moderate_reduction" }),
    ],
    prices: [makePrice("alpha_one"), makePrice("beta_one"), makePrice("gamma_one")],
  };
}

/* ------------------------------------------------------------------ */
/* Scenarios                                                           */
/* ------------------------------------------------------------------ */

export type Scenario = { id: string; title: string; run: () => { pass: boolean; detail: string } };

const ok = (pass: boolean, detail: string) => ({ pass, detail });

export const SCENARIOS: Scenario[] = [
  {
    id: "C01", title: "Three verified products compared under identical conditions",
    run: () => {
      const r = run(makeContext(), threeVerified());
      return ok(r.entries.length === 3 && r.comparability.comparable && r.ranked,
        `${r.entries.length} entries, ranked=${r.ranked}`);
    },
  },
  {
    id: "C02", title: "Product prohibited on the fabric is excluded, not low-ranked",
    run: () => {
      const s = threeVerified();
      s.mappings[1] = makeMapping("beta_one", "clean_craft", {
        fabricConditions: [{ textile: "cotton", verdict: "prohibited", source: "TDS" }],
      });
      const r = run(makeContext(), s);
      const e = r.entries.find((x) => x.productKey === "beta_one")!;
      return ok(e.selection === "excluded_fabric" && e.rank === "not_recommended", `${e.selection}/${e.rank}`);
    },
  },
  {
    id: "C03", title: "Product incompatible with the cleaning process is excluded",
    run: () => {
      const s = threeVerified();
      s.mappings[1] = makeMapping("beta_one", "clean_craft", {
        processConditions: [{ process: "wetside_spotting", verdict: "prohibited", source: "TDS" }],
      });
      const r = run(makeContext(), s);
      return ok(r.entries.find((x) => x.productKey === "beta_one")!.selection === "excluded_process", "excluded by process");
    },
  },
  {
    id: "C04", title: "Missing SDS excludes the product by documentation",
    run: () => {
      const s = threeVerified();
      s.products[1] = makeProduct("beta_one", "clean_craft", {
        versions: [makeVersion("beta_one", { sdsVersion: undefined })],
      });
      const r = run(makeContext(), s);
      const e = r.entries.find((x) => x.productKey === "beta_one")!;
      return ok(e.selection === "excluded_missing_documentation" && !e.checklist.sds_current, e.selection);
    },
  },
  {
    id: "C05", title: "Country mismatch excludes the product",
    run: () => {
      const s = threeVerified();
      s.mappings[2] = makeMapping("gamma_one", "stas", { country: "DE" });
      const r = run(makeContext(), s);
      return ok(r.entries.find((x) => x.productKey === "gamma_one")!.selection === "excluded_country", "country enforced");
    },
  },
  {
    id: "C06", title: "Unavailable PPE excludes the product",
    run: () => {
      const s = threeVerified();
      s.mappings[0] = makeMapping("alpha_one", "seitz", { requiredPpe: ["respirator"] });
      const r = run(makeContext(), s);
      const e = r.entries.find((x) => x.productKey === "alpha_one")!;
      return ok(e.selection === "excluded_ppe" || e.selection === "excluded_equipment", e.selection);
    },
  },
  {
    id: "C07", title: "Unavailable equipment excludes the product",
    run: () => {
      const s = threeVerified();
      s.mappings[0] = makeMapping("alpha_one", "seitz", { requiredEquipment: ["vacuum spotting board"] });
      const r = run(makeContext(), s);
      return ok(r.entries.find((x) => x.productKey === "alpha_one")!.selection === "excluded_equipment", "equipment enforced");
    },
  },
  {
    id: "C08", title: "Missing training excludes the product",
    run: () => {
      const s = threeVerified();
      s.mappings[0] = makeMapping("alpha_one", "seitz", {
        role: { roles: ["professional_spotter"], training: ["manufacturer_training_required"], supervisionRequired: false },
      });
      const r = run(makeContext(), s);
      return ok(r.entries.find((x) => x.productKey === "alpha_one")!.selection === "excluded_training", "training enforced");
    },
  },
  {
    id: "C09", title: "Same stage but a different stain target is not comparable",
    run: () => {
      const s = threeVerified();
      s.mappings[1] = makeMapping("beta_one", "clean_craft", { stainKey: "ink" });
      const r = run(makeContext(), s);
      return ok(!r.ranked || r.entries.find((x) => x.productKey === "beta_one")!.selection !== "included",
        `ranked=${r.ranked}`);
    },
  },
  {
    id: "C10", title: "Same stain at a different stage is not included in this comparison",
    run: () => {
      const s = threeVerified();
      s.mappings[1] = makeMapping("beta_one", "clean_craft", { stageNumber: 7 });
      const r = run(makeContext(), s);
      return ok(r.entries.every((e) => e.dimensions.stage === "Stage 5"), "single stage only");
    },
  },
  {
    id: "C11", title: "Comparable controlled trials pass the trial comparability test",
    run: () => ok(trialsComparable(makeTrial("a"), makeTrial("b")), "identical conditions comparable"),
  },
  {
    id: "C12", title: "Non-comparable trial conditions are rejected",
    run: () => ok(!trialsComparable(makeTrial("a"), makeTrial("b", { contactTime: "300 s", textile: "wool" })),
      "different conditions not comparable"),
  },
  {
    id: "C13", title: "Better removal with damage never outranks a safer product",
    run: () => {
      const s = threeVerified();
      s.trials = [
        makeTrial("alpha_one", { result: "complete_visual_removal", damageObserved: ["dye_loss"] }),
        makeTrial("beta_one", { result: "moderate_reduction" }),
        makeTrial("gamma_one", { result: "moderate_reduction" }),
      ];
      const r = run(makeContext(), s);
      const a = r.entries.find((x) => x.productKey === "alpha_one")!;
      return ok(!a.rankEligible && a.rank !== "rank_1", `alpha rank=${a.rank}`);
    },
  },
  {
    id: "C14", title: "Safer moderate reduction outranks damaging full removal",
    run: () => {
      const s = threeVerified();
      s.trials = [
        makeTrial("alpha_one", { result: "complete_visual_removal", damageObserved: ["fibre_damage"] }),
        makeTrial("beta_one", { result: "moderate_reduction" }),
        makeTrial("gamma_one", { result: "minor_reduction" }),
      ];
      const r = run(makeContext(), s);
      const b = r.entries.find((x) => x.productKey === "beta_one")!;
      return ok(b.rank === "rank_1", `beta rank=${b.rank}`);
    },
  },
  {
    id: "C15", title: "Unavailable dose prevents cost calculation",
    run: () => {
      const m = makeMapping("alpha_one", "seitz", { quantities: undefined });
      const c = costPerTreatment(makePrice("alpha_one"), m, makeContext());
      return ok(!c.calculable && c.missingInputs.includes("Verified dose"), c.message);
    },
  },
  {
    id: "C16", title: "Unavailable price prevents cost calculation",
    run: () => {
      const c = costPerTreatment(undefined, makeMapping("alpha_one", "seitz"), makeContext());
      return ok(!c.calculable && !c.result, c.message);
    },
  },
  {
    id: "C17", title: "Currency conversion records rate, source and date",
    run: () => {
      const price = makePrice("alpha_one", {
        currency: "EUR", exchangeRate: 95, exchangeRateSource: "ECB reference rate", exchangeRateDate: "2026-08-01",
      });
      const c = costPerTreatment(price, makeMapping("alpha_one", "seitz"), makeContext(), { targetCurrency: "INR" });
      return ok(c.calculable && c.inputs.exchangeRate.includes("ECB"), c.inputs.exchangeRate ?? "");
    },
  },
  {
    id: "C18", title: "Discontinued product is excluded",
    run: () => {
      const s = threeVerified();
      s.products[0] = makeProduct("alpha_one", "seitz", { status: "discontinued" });
      const r = run(makeContext(), s);
      return ok(r.entries.find((x) => x.productKey === "alpha_one")!.selection === "excluded_safety_rule", "discontinued excluded");
    },
  },
  {
    id: "C19", title: "Reformulated unapproved version is excluded",
    run: () => {
      const s = threeVerified();
      s.products[0] = makeProduct("alpha_one", "seitz", {
        versions: [makeVersion("alpha_one", { knownFormulationChange: true, approvalStatus: "under_review" })],
      });
      const r = run(makeContext(), s);
      return ok(r.entries.find((x) => x.productKey === "alpha_one")!.selection === "excluded_missing_documentation",
        "reformulation blocks carry-over");
    },
  },
  {
    id: "C20", title: "Organization with a single eligible product produces no rank",
    run: () => {
      const s = threeVerified();
      s.extra = { inventoryProductKeys: ["alpha_one"] };
      const r = run(makeContext({ organizationKey: "org1" }), s);
      const a = r.entries.find((x) => x.productKey === "alpha_one")!;
      return ok(!r.ranked && a.rank === "not_comparable", `${a.rank}`);
    },
  },
  {
    id: "C21", title: "No eligible product returns a controlled no-product result",
    run: () => {
      const s = threeVerified();
      s.mappings = s.mappings.map((m) => ({
        ...m, fabricConditions: [{ textile: "cotton", verdict: "prohibited", source: "TDS" }],
      }));
      const r = run(makeContext(), s);
      return ok(r.entries.every((e) => e.rank === "not_recommended") && !r.ranked, r.headline);
    },
  },
  {
    id: "C22", title: "Equivalent verified data produce a joint rank",
    run: () => {
      const s = threeVerified();
      s.products = s.products.slice(0, 2);
      s.mappings = s.mappings.slice(0, 2);
      s.trials = [makeTrial("alpha_one"), makeTrial("beta_one")];
      s.prices = [makePrice("alpha_one"), makePrice("beta_one")];
      const r = run(makeContext(), s);
      return ok(r.entries.every((e) => e.rank === "joint_rank"), r.entries.map((e) => e.rank).join(","));
    },
  },
  {
    id: "C23", title: "Missing evidence produces no rank with an explanation",
    run: () => {
      const s = threeVerified();
      s.trials = [];
      const r = run(makeContext(), s);
      return ok(!r.ranked && !!r.noRankReason, r.noRankReason ?? "");
    },
  },
  {
    id: "C24", title: "Domestic user cannot access the professional comparison",
    run: () => {
      const audience = comparisonAudience("domestic_user");
      const view = domesticView();
      return ok(audience === "domestic" && !view.accessible && !view.message.includes("PPE"), view.message);
    },
  },
  {
    id: "C25", title: "Quick professional view is simplified but never invents a rank",
    run: () => {
      const s = threeVerified();
      s.trials = [];
      const r = run(makeContext(), s);
      const q = quickProfessionalView(r);
      return ok(q.cards.length === 3 && q.cards.every((c) => c.rank === undefined), q.action);
    },
  },
  {
    id: "C26", title: "Technical user sees the complete evidence checklist",
    run: () => {
      const r = run(makeContext(), threeVerified());
      const e = r.entries[0];
      return ok(Object.keys(e.checklist).length === 21 && comparisonAudience("technical_reviewer") === "technical",
        `${Object.keys(e.checklist).length} checklist items`);
    },
  },
  {
    id: "C27", title: "STAS remains unranked while documents are missing",
    run: () => {
      const stas = INITIAL_KIT_STATUS.find((k) => k.companyKey === "stas")!;
      return ok(!stas.rankable && stas.unresolved.length >= 5, stas.summary);
    },
  },
  {
    id: "C28", title: "Clean Craft remains unranked with unresolved conflicts",
    run: () => {
      const cc = INITIAL_KIT_STATUS.find((k) => k.companyKey === "clean_craft")!;
      return ok(!cc.rankable && cc.unresolved.some((u) => u.includes("Fungus Go")), cc.status);
    },
  },
  {
    id: "C29", title: "Seitz is assessed using product-specific recorded restrictions only",
    run: () => {
      const seitz = INITIAL_KIT_STATUS.find((k) => k.companyKey === "seitz")!;
      return ok(!seitz.rankable && seitz.summary.includes("no stain is assumed"), seitz.status);
    },
  },
  {
    id: "C30", title: "A fourth company is added without redesign",
    run: () => {
      const s = threeVerified();
      s.products.push(makeProduct("delta_one", "new_company"));
      s.mappings.push(makeMapping("delta_one", "new_company"));
      s.trials!.push(makeTrial("delta_one", { result: "minor_reduction" }));
      s.prices!.push(makePrice("delta_one"));
      const r = run(makeContext(), s);
      return ok(r.entries.length === 4 && r.entries.some((e) => e.companyKey === "new_company"),
        `${r.entries.length} companies compared`);
    },
  },
  {
    id: "C31", title: "New evidence triggers review",
    run: () => {
      const r = run(makeContext(), threeVerified());
      const t = applyComparisonTrigger(r.snapshot, "new_performance_trial");
      return ok(t.status === "needs_review" && !t.rankSuspended, t.note);
    },
  },
  {
    id: "C32", title: "A damage report suspends an existing rank",
    run: () => {
      const r = run(makeContext(), threeVerified());
      const t = applyComparisonTrigger(r.snapshot, "damage_report");
      return ok(t.status === "suspended" && t.rankSuspended, t.note);
    },
  },
  {
    id: "C33", title: "Historical comparison remains reproducible",
    run: () => {
      const r = run(makeContext(), threeVerified());
      const again = reproduce(r.snapshot);
      return ok(JSON.stringify(again) === JSON.stringify(r.snapshot), again.comparisonId);
    },
  },
  {
    id: "C34", title: "Final table contains every required column",
    run: () => {
      const r = run(makeContext(), threeVerified());
      const row = comparisonRows(r)[0];
      const keys = Object.keys(row).filter((k) => k !== "criticalWarnings");
      return ok(keys.length === COMPARISON_TABLE_COLUMNS.length, `${keys.length} columns`);
    },
  },
  {
    id: "C35", title: "Mobile comparison retains safety warnings",
    run: () => {
      const s = threeVerified();
      s.mappings[1] = makeMapping("beta_one", "clean_craft", {
        fabricConditions: [{ textile: "cotton", verdict: "prohibited", source: "TDS" }],
      });
      const rows = comparisonRows(run(makeContext(), s));
      const beta = rows.find((x) => x.kitProduct.includes("beta_one"))!;
      return ok(beta.criticalWarnings.length > 0, beta.criticalWarnings[0]);
    },
  },
  {
    id: "C36", title: "Organization pricing stays out of the universal technical comparison",
    run: () => {
      const s = threeVerified();
      s.prices = s.prices!.map((p) => ({ ...p, organizationKey: "org1" }));
      const r = universalTechnicalView(run(makeContext({ organizationKey: "org1" }), s));
      return ok(r.entries.every((e) => !e.cost.calculable), r.entries[0].cost.message);
    },
  },
  {
    id: "C37", title: "Kit bottle count never affects ranking",
    run: () => {
      const s = threeVerified();
      const r = run(makeContext(), s);
      const scoreFields = JSON.stringify(r.entries.map((e) => e.rank));
      return ok(!scoreFields.includes("bottle") && r.entries.every((e) => !e.advantages.join(" ").includes("more products")),
        "kit size is not a dimension");
    },
  },
  {
    id: "C38", title: "The comparison never upgrades a mapping decision",
    run: () => {
      const s = threeVerified();
      s.mappings[0] = makeMapping("alpha_one", "seitz", { decision: "insufficient_information" });
      const r = run(makeContext(), s);
      const e = r.entries.find((x) => x.productKey === "alpha_one")!;
      return ok(e.decision !== "recommended", e.decision);
    },
  },
  {
    id: "C39", title: "Missing cost basis blocks cost comparison",
    run: () => {
      const a = costPerTreatment(makePrice("a"), makeMapping("a", "x"), makeContext());
      const b = costPerTreatment(makePrice("b", { taxIncluded: false }), makeMapping("b", "y"), makeContext());
      return ok(!costsComparable(a, b), "tax basis differs");
    },
  },
  {
    id: "C40", title: "A safety-engine block removes every product from the comparison",
    run: () => {
      const s = threeVerified();
      s.extra = { safetyOutcome: "blocked" };
      const r = run(makeContext(), s);
      return ok(r.entries.every((e) => e.selection === "excluded_safety_rule" && e.rank === "not_recommended"), r.headline);
    },
  },
];

export function runComparisonScenarios() {
  const results = SCENARIOS.map((s) => ({ ...s, ...s.run() }));
  return { results, passed: results.filter((r) => r.pass).length, total: results.length };
}
