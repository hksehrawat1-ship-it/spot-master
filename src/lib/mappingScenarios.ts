/** STEP 8 — required test scenarios (§29) for product-to-stage mapping. */

import {
  SEED_MAPPINGS, SEED_TRANSITIONS, STAS_MAPPING_GAP, UNKNOWN_RINSE,
} from "@/data/productMappings";
import type {
  ProductStageMapping, ProductTransition, MappingDecision,
} from "@/data/productMappings";
import {
  PRODUCT_BY_KEY, DOCUMENTS,
} from "@/data/professionalProducts";
import type { Product, ProductDocument } from "@/data/professionalProducts";
import {
  evaluateEligibility, evaluateCase, emptyCase, validateMapping, canPublish,
  compareMappings, applyReviewTrigger, visibleMappings, evaluateInspection,
  repetitionText, resolveMappings, dependencyReport, SAFE_FALLBACK,
} from "@/lib/mappingEngine";
import type { MappingCase } from "@/lib/mappingEngine";
import {
  TREATMENT_STAGES, TREATMENT_PATHWAYS, combinationSequence, STAGE_BY_NUMBER,
} from "@/data/treatmentStages";

export type ScenarioResult = { id: number; name: string; pass: boolean; detail: string };

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

/* ---------------- fully verified fixture ---------------- */

const VERIFIED_DOCS: ProductDocument[] = [
  {
    key: "doc_test_label", documentId: "SM-DOC-900001", companyKey: "seitz",
    documentType: "product_label", title: "Test label", issuerUncertain: false,
    country: "IN", state: "current_and_verified",
  },
  {
    key: "doc_test_sds", documentId: "SM-DOC-900002", companyKey: "seitz",
    documentType: "sds", title: "Test SDS", issuerUncertain: false,
    country: "IN", state: "current_and_verified",
  },
  {
    key: "doc_test_tds", documentId: "SM-DOC-900003", companyKey: "seitz",
    documentType: "tds", title: "Test TDS", issuerUncertain: false,
    country: "IN", state: "current_and_verified",
  },
];

function verifiedProducts(): Record<string, Product> {
  const products = clone(PRODUCT_BY_KEY);
  for (const p of Object.values(products)) {
    p.status = "published";
    p.versions.forEach((v) => {
      v.verification = "verified";
      v.approvalStatus = "approved";
      v.country = "IN";
      v.labelVersion = "1";
      v.sdsVersion = "1";
      v.tdsVersion = "1";
    });
  }
  return products;
}

function verifiedMapping(over: Partial<ProductStageMapping> = {}): ProductStageMapping {
  const product = PRODUCT_BY_KEY.seitz_frankosol;
  return {
    mappingId: "SM-MAP-900001",
    productKey: "seitz_frankosol",
    productVersionKey: product.currentVersionKey,
    companyKey: "seitz",
    kitKey: "seitz_seven_bottle",
    stageNumber: 5,
    specificity: "component",
    componentKey: "water_soluble",
    country: "IN",
    role: { roles: ["professional_spotter", "trainer"], training: ["trained_spotter_required"], supervisionRequired: false },
    fabricConditions: [
      { textile: "cotton", verdict: "permitted", source: "TDS" },
      { textile: "silk", verdict: "prohibited", source: "TDS" },
    ],
    colourConditions: [
      { colour: "white", verdict: "permitted", source: "TDS" },
      { colour: "dark", verdict: "permitted", source: "TDS" },
    ],
    constructionConditions: [{ construction: "coating", verdict: "prohibited", source: "TDS" }],
    processConditions: [
      { process: "hand_spotting", verdict: "permitted", source: "TDS" },
      { process: "perc_dry_cleaning", verdict: "prohibited", source: "TDS" },
    ],
    requiredEquipment: [],
    requiredPpe: ["protective_gloves"],
    ventilationRequired: "not_required",
    requiredTests: [],
    prohibitedPriorChemistry: ["unknown_chemical"],
    rinse: {
      required: "required", method: "Flush as stated in the current TDS", medium: "Water",
      inspectionRequired: true, sourceDocumentKey: "doc_test_tds", documentVersion: "1",
      country: "IN", fallbackText: "Follow the current product label or technical data sheet.",
    },
    repetition: "repeat_permitted_after_inspection",
    stopConditions: [],
    verifiedUse: true,
    decision: "recommended",
    evidence: [{ level: "current_tds", documentKey: "doc_test_tds", description: "Current TDS" }],
    evidenceLevel: "current_tds",
    sourceDocumentKeys: ["doc_test_label", "doc_test_sds", "doc_test_tds"],
    status: "published",
    effectiveDate: "2026-08-17",
    version: 1,
    provisional: false,
    flags: [],
    ...over,
  };
}

const baseCase = (over: Partial<MappingCase> = {}): MappingCase =>
  emptyCase({
    stageNumber: 5,
    components: ["water_soluble"],
    dominantComponent: "water_soluble",
    textile: "cotton",
    colour: "dark",
    process: "hand_spotting",
    country: "IN",
    riskLevel: "green",
    ppeAvailable: ["protective_gloves", "eye_protection"],
    equipmentAvailable: [],
    ...over,
  });

const opts = (extra: Record<string, unknown> = {}) => ({
  transitions: SEED_TRANSITIONS as ProductTransition[],
  docs: VERIFIED_DOCS,
  products: verifiedProducts(),
  ...extra,
});

/* ---------------- scenarios ---------------- */

export function runMappingScenarios(): ScenarioResult[] {
  const out: ScenarioResult[] = [];
  const t = (name: string, fn: () => string | true) => {
    try {
      const r = fn();
      out.push({ id: out.length + 1, name, pass: r === true, detail: r === true ? "OK" : String(r) });
    } catch (e) {
      out.push({ id: out.length + 1, name, pass: false, detail: `threw: ${(e as Error).message}` });
    }
  };
  const eq = (a: unknown, b: unknown, label: string) => (a === b ? true : `${label}: expected ${b}, got ${a}`);

  t("Baseline verified mapping is eligible", () => {
    const r = evaluateEligibility(verifiedMapping(), baseCase(), opts());
    return eq(r.outcome, "eligible", "outcome");
  });

  t("Verified product matches stain but not fabric", () => {
    const r = evaluateEligibility(verifiedMapping(), baseCase({ textile: "silk" }), opts());
    return r.outcome === "ineligible_fabric" && r.reason.includes("silk") ? true : `${r.outcome} / ${r.reason}`;
  });

  t("Matches stain and fabric but not cleaning process", () => {
    const r = evaluateEligibility(verifiedMapping(), baseCase({ process: "perc_dry_cleaning" }), opts());
    return eq(r.outcome, "ineligible_process", "outcome");
  });

  t("Product matches case but SDS is missing", () => {
    const docs = VERIFIED_DOCS.filter((d) => d.documentType !== "sds");
    const products = verifiedProducts();
    Object.values(products).forEach((p) => p.versions.forEach((v) => { v.sdsVersion = undefined; }));
    const r = evaluateEligibility(verifiedMapping(), baseCase(), opts({ docs, products }));
    return eq(r.outcome, "documentation_incomplete", "outcome");
  });

  t("Required PPE unavailable", () => {
    const r = evaluateEligibility(verifiedMapping(), baseCase({ ppeAvailable: [] }), opts());
    return eq(r.outcome, "missing_ppe", "outcome");
  });

  t("Required training missing", () => {
    const r = evaluateEligibility(verifiedMapping(), baseCase({ training: [] }), opts());
    return eq(r.outcome, "missing_training", "outcome");
  });

  t("Hidden test required and not completed", () => {
    const m = verifiedMapping({
      requiredTests: [{ testKey: "hidden_area", methodSource: "Current TDS section 4", approved: true }],
    });
    const r = evaluateEligibility(m, baseCase(), opts());
    return r.outcome === "eligible_after_testing" && r.decision === "recommended_after_testing"
      ? true : `${r.outcome} / ${r.decision}`;
  });

  t("Hidden test fails", () => {
    const m = verifiedMapping({
      requiredTests: [{ testKey: "hidden_area", methodSource: "Current TDS section 4", approved: true }],
    });
    const r = evaluateEligibility(m, baseCase({ testsCompleted: [{ testKey: "hidden_area", passed: false }] }), opts());
    return r.outcome === "ineligible_fabric" && r.decision === "not_recommended" ? true : `${r.outcome}/${r.decision}`;
  });

  t("Product version is country-mismatched", () => {
    const r = evaluateEligibility(verifiedMapping(), baseCase({ country: "DE" }), opts());
    return eq(r.outcome, "ineligible_country", "outcome");
  });

  t("Product was reformulated — mapping does not carry over", () => {
    const products = verifiedProducts();
    products.seitz_frankosol.versions.forEach((v) => { v.knownFormulationChange = true; v.approvalStatus = "under_review"; });
    const r = evaluateEligibility(verifiedMapping(), baseCase(), opts({ products }));
    return eq(r.outcome, "documentation_incomplete", "outcome");
  });

  t("Product is discontinued", () => {
    const products = verifiedProducts();
    products.seitz_frankosol.status = "discontinued";
    const r = evaluateEligibility(verifiedMapping(), baseCase(), opts({ products }));
    return eq(r.outcome, "product_discontinued", "outcome");
  });

  t("Product is suspended cannot be recommended", () => {
    const products = verifiedProducts();
    products.seitz_frankosol.status = "suspended";
    const r = evaluateEligibility(verifiedMapping(), baseCase(), opts({ products }));
    return r.outcome === "product_suspended" && r.decision !== "recommended" ? true : r.outcome;
  });

  t("Previous chemical is unknown", () => {
    const r = evaluateEligibility(verifiedMapping(), baseCase({ previousChemistry: ["unknown_chemical"] }), opts());
    return r.outcome === "insufficient_information" && r.reason.includes("unknown") ? true : `${r.outcome}/${r.reason}`;
  });

  t("Two products have a documented incompatibility", () => {
    const transitions: ProductTransition[] = [
      ...SEED_TRANSITIONS,
      {
        transitionId: "SM-TRN-900001", fromProductKey: "seitz_cavesol", toProductKey: "seitz_frankosol",
        permission: "prohibited", inspectionRequired: true, source: "Current manufacturer instruction",
        country: "IN", approvalStatus: "published",
      },
    ];
    const r = evaluateEligibility(verifiedMapping(), baseCase({ appliedProductKeys: ["seitz_cavesol"] }), opts({ transitions }));
    return eq(r.outcome, "ineligible_previous_chemical", "outcome");
  });

  t("Transition allowed only after verified flushing", () => {
    const transitions: ProductTransition[] = [
      ...SEED_TRANSITIONS,
      {
        transitionId: "SM-TRN-900002", fromProductKey: "seitz_blutol", toProductKey: "seitz_frankosol",
        permission: "permitted_after_verified_flushing", requiredRinse: "As stated in the current TDS",
        inspectionRequired: true, source: "Current manufacturer instruction", country: "IN", approvalStatus: "published",
      },
    ];
    const r = evaluateEligibility(verifiedMapping(), baseCase({ appliedProductKeys: ["seitz_blutol"] }), opts({ transitions }));
    return r.outcome === "eligible_after_testing" && r.reason.includes("flushing") ? true : `${r.outcome}/${r.reason}`;
  });

  t("Undocumented transition between kit-mates is blocked", () => {
    const r = evaluateEligibility(verifiedMapping(), baseCase({ appliedProductKeys: ["seitz_quickol"] }), opts());
    return r.outcome === "ineligible_previous_chemical" || r.outcome === "insufficient_information"
      ? true : r.outcome;
  });

  t("Rinsing information is missing", () => {
    const m = verifiedMapping({ rinse: { ...UNKNOWN_RINSE } });
    const r = evaluateEligibility(m, baseCase(), opts());
    return r.outcome === "insufficient_information" && r.rinseText.includes("Follow the current product label")
      ? true : `${r.outcome}/${r.rinseText}`;
  });

  t("Contact time is missing and is not invented", () => {
    const m = verifiedMapping({ quantities: undefined });
    const cmp = compareMappings([m]);
    return cmp.rows[0].cells.contact_time.value === "Insufficient Information" ? true : cmp.rows[0].cells.contact_time.value;
  });

  t("Combination stain requires multiple stages", () => {
    const seq = combinationSequence({
      dominantComponent: "oil", components: ["oil", "protein", "synthetic_dye"],
    });
    const actionable = seq.stages.filter((s) => STAGE_BY_NUMBER[s]?.actionable);
    return actionable.length >= 3 && seq.stages.indexOf(9) > seq.stages.indexOf(4)
      ? true : `stages ${seq.stages.join(",")}`;
  });

  t("Broad category mapping conflicts with stain-specific prohibition", () => {
    const broad = verifiedMapping({ mappingId: "SM-MAP-900010", specificity: "category", categoryKey: "water_soluble", componentKey: undefined });
    const specific = verifiedMapping({
      mappingId: "SM-MAP-900011", specificity: "stain", stainKey: "turmeric", componentKey: undefined,
      decision: "not_recommended", notRecommendedReason: "Documented dye-lift risk on this stain.",
    });
    const resolved = resolveMappings([broad, specific], baseCase({ stainKey: "turmeric" }));
    return resolved.length === 1 && resolved[0].decision === "not_recommended"
      ? true : resolved.map((r) => r.decision).join(",");
  });

  t("Red-risk garment remains professional-only", () => {
    const r = evaluateEligibility(verifiedMapping(), baseCase({ riskLevel: "red", role: "laundry_employee",
      training: ["trained_spotter_required"] }), opts());
    return r.outcome === "ineligible_user_role" || r.outcome === "professional_only" ? true : r.outcome;
  });

  t("Black-risk garment remains blocked", () => {
    const r = evaluateEligibility(verifiedMapping(), baseCase({ riskLevel: "black" }), opts());
    return r.outcome === "professional_only" && r.decision === "not_recommended" ? true : `${r.outcome}/${r.decision}`;
  });

  t("Domestic user cannot see professional mappings", () => {
    const visible = visibleMappings([verifiedMapping()], "domestic");
    const r = evaluateEligibility(verifiedMapping(), baseCase({ role: "domestic_user", training: [] }), opts());
    return visible.length === 0 && r.outcome !== "eligible" ? true : `${visible.length}/${r.outcome}`;
  });

  t("Three products map to one stage but are not directly comparable", () => {
    const a = verifiedMapping({ mappingId: "A", productKey: "seitz_frankosol" });
    const b = verifiedMapping({ mappingId: "B", productKey: "cc_food_1", productVersionKey: PRODUCT_BY_KEY.cc_food_1.currentVersionKey, companyKey: "clean_craft", quantities: undefined });
    const c = verifiedMapping({ mappingId: "C", productKey: "seitz_quickol", productVersionKey: PRODUCT_BY_KEY.seitz_quickol.currentVersionKey, evidenceLevel: "insufficient_information" });
    const cmp = compareMappings([a, b, c]);
    return cmp.rankable === false && cmp.message.includes("not directly comparable") ? true : cmp.message;
  });

  t("No eligible product returns the safe fallback", () => {
    const evalCase = evaluateCase([verifiedMapping()], baseCase({ textile: "silk" }), opts());
    return evalCase.fallback === SAFE_FALLBACK ? true : String(evalCase.fallback);
  });

  t("Inspection detects colour loss and stops treatment", () => {
    const insp = evaluateInspection(["colour_lightened"], true);
    const r = evaluateEligibility(verifiedMapping(), baseCase({ inspectionCompleted: true, inspectionFindings: ["colour_lightened"] }), opts());
    return insp.stop && !insp.repeatAllowed && r.decision === "not_recommended" ? true : `${insp.stop}/${r.decision}`;
  });

  t("Inspection not recorded blocks repetition and heat", () => {
    const insp = evaluateInspection([], false);
    return !insp.repeatAllowed && !insp.heatAllowed ? true : "repetition or heat wrongly allowed";
  });

  t("Product repeat limit unavailable is not invented", () => {
    const text = repetitionText("insufficient_information");
    return text.includes("not invented") ? true : text;
  });

  t("Seitz mapping uses a current verified document", () => {
    const m = verifiedMapping({ productKey: "seitz_cavesol", productVersionKey: PRODUCT_BY_KEY.seitz_cavesol.currentVersionKey, companyKey: "seitz", stageNumber: 7, componentKey: "tannin" });
    const r = evaluateEligibility(m, baseCase({ stageNumber: 7, components: ["tannin"], dominantComponent: "tannin" }), opts());
    return r.outcome === "eligible" && r.evidenceLevel === "current_tds" ? true : `${r.outcome}/${r.evidenceLevel}`;
  });

  t("STAS mapping remains provisional without complete documents", () => {
    const stas = SEED_MAPPINGS.filter((m) => m.companyKey === "stas");
    return stas.length === 0 && STAS_MAPPING_GAP.blocking ? true : "STAS mappings should not exist yet";
  });

  t("Clean Craft Fungus Go mapping remains unresolved", () => {
    const m = SEED_MAPPINGS.find((x) => x.productKey === "cc_fungus_go")!;
    return m.status !== "published" && m.flags.some((f) => f.startsWith("UNRESOLVED"))
      ? true : `${m.status}`;
  });

  t("Clean Craft steam/protein conflict blocks publication", () => {
    const m = SEED_MAPPINGS.find((x) => x.productKey === "cc_organic")!;
    const publishable = canPublish({ ...m, status: "published", decision: "recommended" });
    return !publishable && m.flags.some((f) => f.includes("steam")) ? true : "conflict not blocking";
  });

  t("Mapping review is triggered after an SDS update", () => {
    const { updated, history, affectedIds } = applyReviewTrigger(
      [verifiedMapping()], "sds_change", { productKey: "seitz_frankosol" },
    );
    return updated[0].status === "needs_review" && history.length === 1 && affectedIds.length === 1
      ? true : `${updated[0].status}/${history.length}`;
  });

  t("Historical case retains the mapping version originally used", () => {
    const original = verifiedMapping();
    const { updated, history } = applyReviewTrigger([original], "tds_change", { productKey: "seitz_frankosol" });
    const retained = history[0];
    return retained.version === original.version && retained.productVersionKey === original.productVersionKey &&
      updated[0].mappingId === original.mappingId
      ? true : "historical mapping not retained";
  });

  t("Unverified provisional mapping can never be Recommended", () => {
    const provisional = SEED_MAPPINGS[0];
    const issues = validateMapping({ ...provisional, decision: "recommended" });
    const r = evaluateEligibility(provisional, baseCase({ stageNumber: provisional.stageNumber }), opts());
    return issues.some((i) => i.severity === "error") && r.decision !== "recommended" ? true : "provisional wrongly recommended";
  });

  t("Validation: Domestic Use Suitable needs 9/10 domestic record", () => {
    const m = verifiedMapping({ decision: "domestic_use_suitable" });
    const bad = validateMapping(m, { domesticRecordConfidence: 7 });
    const good = validateMapping(m, { domesticRecordConfidence: 9 });
    return bad.some((i) => i.severity === "error") && !good.some((i) => i.severity === "error")
      ? true : "domestic confidence rule not enforced";
  });

  t("Stages are brand-independent and pathways complete", () => {
    const brandWords = ["seitz", "stas", "clean craft", "purasol", "quickol", "blutol"];
    const text = JSON.stringify(TREATMENT_STAGES).toLowerCase();
    const clean = !brandWords.some((w) => text.includes(w));
    return clean && TREATMENT_STAGES.length === 18 && TREATMENT_PATHWAYS.length === 15
      ? true : `clean=${clean} stages=${TREATMENT_STAGES.length} pathways=${TREATMENT_PATHWAYS.length}`;
  });

  t("Dependency report finds no blocking issues in seed mappings", () => {
    const issues = dependencyReport(SEED_MAPPINGS);
    const blocking = issues.filter((i) => i.severity === "blocking");
    return blocking.length === 0 ? true : blocking.map((b) => b.message).join(" | ");
  });

  return out;
}

export function mappingScenarioSummary() {
  const results = runMappingScenarios();
  return { results, passed: results.filter((r) => r.pass).length, total: results.length };
}
