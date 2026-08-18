import { describe, expect, it } from "vitest";
import { classify } from "@/lib/dataSource";
import { EMPTY_CASE } from "@/store/useRetail";
import { EMPTY_PRO_EXTRA, type ProductTransition, type VerifiedProduct } from "@/lib/professionalEngine";
import { buildComponentPlan } from "@/lib/professionalEngine";
import {
  EMPTY_MASTER_EXTRA,
  analyseFailure,
  applyInspection,
  buildMasterCard,
  buildMasterComponentMap,
  compareAcrossBrands,
  eligibleMasterProducts,
  eligibleStages,
  emergencyGuidance,
  evaluateMasterTransition,
  highestBlock,
  inspectionRequiresStop,
  isForbiddenCalculation,
  isRemovableMark,
  labelOperatorObservation,
  masterBasicAlternative,
  mostSensitiveComponent,
  offlineActionAllowed,
  offlineSafetySummary,
  preserveCase,
  safetyDecisions,
  simplifiedJobCard,
  toMasterCase,
  type LedgerEntry,
  type MasterCase,
} from "@/lib/masterEngine";
import { caseRow, ledgerRow } from "@/hooks/useMasterCase";
import { NOT_VERIFIED, TRANSITION_OUTCOMES } from "@/data/masterSpotter";

const kit = { kind: "company" as const, companyId: "seitz", companyName: "Seitz", productIds: [] };
const kitB = { kind: "company" as const, companyId: "stas", companyName: "STAS", productIds: [] };

const baseCase = (over: Partial<MasterCase> = {}): MasterCase => ({
  ...EMPTY_CASE,
  ...EMPTY_PRO_EXTRA,
  ...EMPTY_MASTER_EXTRA,
  stainName: "Curry",
  stainKnown: true,
  fabricKnown: true,
  fabric: "Cotton",
  colour: "Light",
  careLabel: "available",
  testResult: "Passed",
  kit,
  selectedKits: [kit],
  activeStage: "oil",
  activeComponent: "oil",
  fibreAssessment: { ...EMPTY_MASTER_EXTRA.fibreAssessment, category: "Natural fibre", named: "Cotton", certainty: "Confirmed fibre" },
  dyeColour: { method: "Piece dyed", flags: { colourfastness: "Passed" } },
  diagnosis: { ...EMPTY_MASTER_EXTRA.diagnosis, markKind: "stain", likelyIdentity: "Curry", primaryComponent: "oil" },
  ...over,
});

const product = (over: Partial<VerifiedProduct> = {}): VerifiedProduct => ({
  productId: "p1",
  productKey: "SEITZ-OIL-1",
  productName: "Oil remover",
  companyId: "seitz",
  companyName: "Seitz",
  chemistryFamily: "solvent",
  verifiedPurpose: "Oil component",
  eligibleComponents: ["oil"],
  compatibleStages: [5, 6],
  prohibitions: [],
  applicationMethod: "Apply from the reverse",
  dilution: "Ready to use",
  temperature: "Ambient",
  contactTime: "60 seconds",
  mechanicalAction: "Light tamping",
  rinseRequirement: "Flush fully",
  neutralisation: null,
  ppe: ["Gloves"],
  incompatibilities: [],
  inspectionPoint: null,
  maximumAttempts: 2,
  sourceDocument: "Seitz TDS",
  documentVersion: "v3",
  ...over,
});

const approved = (p = product()) => [classify(p, "production", { origin: "database", reviewDate: "2026-01-01" })];

const ledger = (over: Partial<LedgerEntry> = {}): LedgerEntry => ({
  id: "l1",
  entryOrder: 1,
  productName: "Oil remover",
  productId: "p1",
  steamUsed: false,
  vacuumUsed: false,
  spottingBoardUsed: false,
  rinsePerformed: false,
  neutralizationPerformed: false,
  operatorObservation: false,
  performedAt: new Date().toISOString(),
  contactTime: "60 seconds",
  temperature: "Ambient",
  mechanicalAction: "Light tamping",
  ...over,
});

/* ---------------- level switching ---------------- */

describe("working-level switching", () => {
  it("carries garment, stain, kit, tests, photos and notes into Master Spotter", () => {
    const pro = {
      ...EMPTY_CASE,
      ...EMPTY_PRO_EXTRA,
      garment: { fibre: "Silk" },
      stain: { condition: "Aged" },
      kit,
      fabricTests: { seam: "No change" },
      previousChemical: { product: "Known kit product", rinsed: "Yes" },
      testResult: "Passed" as const,
      photos: { before: ["a.jpg"], after: [] },
      notes: "Customer accepts risk",
      supervisorNotes: "Checked",
    };
    const master = toMasterCase(pro);
    expect(master.garment.fibre).toBe("Silk");
    expect(master.stain.condition).toBe("Aged");
    expect(master.kit).toEqual(kit);
    expect(master.fabricTests.seam).toBe("No change");
    expect(master.previousChemical.rinsed).toBe("Yes");
    expect(master.photos.before).toEqual(["a.jpg"]);
    expect(master.notes).toBe("Customer accepts risk");
    expect(master.supervisorNotes).toBe("Checked");
    expect(master.testResult).toBe("Passed");
  });

  it("preserveCase does not clear existing master data", () => {
    const current = baseCase({ ledger: [ledger()], caseReference: "MS-1" });
    const merged = preserveCase({ garment: { fibre: "Wool" } }, current);
    expect(merged.ledger).toHaveLength(1);
    expect(merged.caseReference).toBe("MS-1");
    expect(merged.garment.fibre).toBe("Wool");
  });
});

/* ---------------- kit and inventory ---------------- */

describe("kit and inventory selection", () => {
  it("returns no products when no company kit is selected", () => {
    expect(eligibleMasterProducts(approved(), { kits: [{ kind: "none" }] })).toHaveLength(0);
  });

  it("supports several kits at once without company-specific code", () => {
    const records = [...approved(), ...approved(product({ productId: "p2", companyId: "stas", companyName: "STAS", productKey: "STAS-1" }))];
    const both = eligibleMasterProducts(records, { kits: [kit, kitB], component: "oil", stageNumber: 5 });
    expect(both.map((p) => p.companyId).sort()).toEqual(["seitz", "stas"]);
  });

  it("filters by the products physically available at the workstation", () => {
    const records = [...approved(), ...approved(product({ productId: "p2", productKey: "SEITZ-2" }))];
    const list = eligibleMasterProducts(records, { kits: [kit], inventory: ["p2"], component: "oil", stageNumber: 5 });
    expect(list.map((p) => p.productId)).toEqual(["p2"]);
  });

  it("never shows unverified records as eligible", () => {
    const provisional = [classify(product(), "provisional", { origin: "database" })];
    expect(eligibleMasterProducts(provisional, { kits: [kit], component: "oil", stageNumber: 5 })).toHaveLength(0);
  });
});

/* ---------------- fabric, dye, damage ---------------- */

describe("material risk", () => {
  it("uses the most sensitive component, not the main fabric", () => {
    const c = baseCase({ trims: ["sequins"] });
    expect(mostSensitiveComponent(c)).toMatchObject({ sensitive: true, source: "trim_or_finish" });
  });

  it("treats mixed construction as sensitive", () => {
    const c = baseCase({ constructionTypes: ["Woven", "Laminated"] });
    expect(mostSensitiveComponent(c).sensitive).toBe(true);
  });

  it("treats an unknown fabric as sensitive", () => {
    const c = baseCase({ fabricKnown: false, fibreAssessment: { ...EMPTY_MASTER_EXTRA.fibreAssessment, category: "Unknown material" } });
    expect(mostSensitiveComponent(c).sensitive).toBe(true);
  });

  it("blocks the case on active colour bleeding, non-overridably", () => {
    const c = baseCase({ activeColourBleeding: "Yes" });
    const block = highestBlock(safetyDecisions(c));
    expect(block?.overridable).toBe(false);
    expect(buildMasterCard(c, { products: approved() }).status).toBe("stopped");
  });

  it("blocks the case on existing damage", () => {
    const c = baseCase({ visibleDamage: "Yes" });
    expect(buildMasterCard(c, { products: approved() }).status).toBe("stopped");
  });

  it("does not treat dye loss as removable soil", () => {
    expect(isRemovableMark("dye_loss")).toBe(false);
    const c = baseCase({ diagnosis: { ...EMPTY_MASTER_EXTRA.diagnosis, markKind: "dye_loss" } });
    expect(buildMasterCard(c, { products: approved() }).status).toBe("stopped");
  });

  it("requires a controlled test before treatment when colourfastness is unproven", () => {
    const c = baseCase({ testResult: "Not tested", dyeColour: { method: "Piece dyed", flags: {} } });
    const card = buildMasterCard(c, { products: approved() });
    expect(card.status).toBe("test_required");
  });

  it("stops the case when a controlled test failed", () => {
    const c = baseCase({ stopConditions: ["failed_test"] });
    expect(buildMasterCard(c, { products: approved() }).status).toBe("stopped");
  });
});

/* ---------------- transitions ---------------- */

describe("product-transition safety", () => {
  const trans = (over: Partial<ProductTransition> = {}): ProductTransition => ({
    fromProductKey: "SEITZ-PRE",
    fromChemistryFamily: "alkali",
    toProductKey: "SEITZ-OIL-1",
    toChemistryFamily: "solvent",
    permission: "permitted",
    requiredRinse: null,
    requiredNeutralisation: null,
    inspectionRequired: false,
    approvalStatus: "approved",
    ...over,
  });

  it("allows the first stage when no chemistry is recorded", () => {
    expect(evaluateMasterTransition(baseCase(), product(), []).outcome).toBe("eligible");
  });

  it("returns insufficient information when the mapping is missing", () => {
    const c = baseCase({ previousProductKey: "OTHER", previousChemistryFamily: "acid", ledger: [ledger({ productName: "Other" })] });
    const d = evaluateMasterTransition(c, product(), []);
    expect(d.outcome).toBe("insufficient_information");
    expect(d.allowed).toBe(false);
    expect(d.overridable).toBe(false);
  });

  it("requires the rinse before the next product", () => {
    const c = baseCase({ previousProductKey: "SEITZ-PRE", previousChemistryFamily: "alkali", ledger: [ledger({ productName: "Pre", rinsePerformed: false })] });
    const d = evaluateMasterTransition(c, product(), [trans({ requiredRinse: "Flush with water" })]);
    expect(d.outcome).toBe("eligible_after_rinse");
    expect(d.allowed).toBe(false);
  });

  it("clears once the rinse is recorded", () => {
    const c = baseCase({ previousProductKey: "SEITZ-PRE", previousChemistryFamily: "alkali", ledger: [ledger({ productName: "Pre", rinsePerformed: true })] });
    expect(evaluateMasterTransition(c, product(), [trans({ requiredRinse: "Flush with water" })]).outcome).toBe("eligible");
  });

  it("requires verified neutralisation when the mapping demands it", () => {
    const c = baseCase({ previousProductKey: "SEITZ-PRE", previousChemistryFamily: "alkali", ledger: [ledger({ productName: "Pre", rinsePerformed: true })] });
    const d = evaluateMasterTransition(c, product(), [trans({ requiredNeutralisation: "Neutralise as verified" })]);
    expect(d.outcome).toBe("eligible_after_neutralisation");
  });

  it("marks a prohibited mapping incompatible and non-overridable", () => {
    const c = baseCase({ previousProductKey: "SEITZ-PRE", previousChemistryFamily: "alkali", ledger: [ledger({ productName: "Pre" })] });
    const d = evaluateMasterTransition(c, product(), [trans({ permission: "prohibited" })]);
    expect(d.outcome).toBe("incompatible");
    expect(d.overridable).toBe(false);
  });

  it("restricts the next step when previous chemistry is unknown", () => {
    const c = baseCase({ ledger: [ledger({ productName: "Unknown product" })] });
    expect(evaluateMasterTransition(c, product(), []).outcome).toBe("insufficient_information");
  });

  it("fails closed when technical data is unavailable", () => {
    const c = baseCase({ technicalDataAvailable: false });
    expect(evaluateMasterTransition(c, product(), []).outcome).toBe("blocked");
    expect(buildMasterCard(c, { products: approved() }).status).toBe("data_unavailable");
  });

  it("exposes exactly the seven transition outcomes", () => {
    expect(TRANSITION_OUTCOMES).toHaveLength(7);
  });
});

/* ---------------- pathway and components ---------------- */

describe("chemistry pathway", () => {
  it("marks conditional stages ineligible when the component is not in the plan", () => {
    const c = baseCase();
    const stages = eligibleStages(c, buildComponentPlan(c));
    expect(stages.find((s) => s.key === "metal")?.eligible).toBe(false);
    expect(stages.find((s) => s.key === "inspection")?.eligible).toBe(true);
  });

  it("blocks all chemical stages when a non-overridable rule is triggered", () => {
    const c = baseCase({ activeColourBleeding: "Yes" });
    const stages = eligibleStages(c, buildComponentPlan(c));
    expect(stages.filter((s) => s.chemical).every((s) => !s.eligible)).toBe(true);
  });

  it("sequences multi-component stains from the approved mapping only", () => {
    const c = baseCase({ stainName: "Lipstick" });
    const map = buildMasterComponentMap(c, buildComponentPlan(c));
    const present = map.filter((m) => m.present).map((m) => m.key);
    expect(present).toContain("oil");
    expect(present).toContain("pigment");
    expect(map.find((m) => m.key === "metal")?.present).toBe(false);
  });

  it("marks treated components as completed and the active one as treating", () => {
    const c = baseCase({ stainName: "Curry", ledger: [ledger({ componentKey: "particulate" })] });
    const map = buildMasterComponentMap(c, buildComponentPlan(c));
    expect(map.find((m) => m.key === "surface")?.state).toBe("completed");
    expect(map.find((m) => m.key === "oil")?.state).toBe("treating");
  });
});

/* ---------------- instruction card ---------------- */

describe("treatment instruction card", () => {
  it("shows verified values and never invents missing ones", () => {
    const card = buildMasterCard(baseCase(), { products: approved(product({ compatibleStages: [5], mechanicalAction: null })) });
    expect(card.status).toBe("proceed");
    expect(card.sections.find((s) => s.label === "Verified contact time")?.value).toBe("60 seconds");
    expect(card.sections.find((s) => s.label === "Permitted mechanical action")?.value).toBe(NOT_VERIFIED);
  });

  it("reports no verified product when nothing is approved for the stage", () => {
    const card = buildMasterCard(baseCase({ activeStage: "protein", activeComponent: "protein" }), { products: approved() });
    expect(card.status).toBe("no_verified_product");
    expect(card.product).toBeNull();
  });

  it("flags superseded instructions as unusable", () => {
    const card = buildMasterCard(baseCase(), { products: approved(), superseded: true });
    expect(card.status).toBe("data_unavailable");
  });

  it("keeps the simplified job card consistent with the technical view", () => {
    const card = buildMasterCard(baseCase(), { products: approved(product({ compatibleStages: [5] })) });
    const job = simplifiedJobCard(card);
    expect(job.product).toBe("Oil remover");
    expect(job.time).toBe(card.sections.find((s) => s.label === "Verified contact time")?.value);
    expect(job.rinse).toBe(card.rinseRequirement);
  });

  it("always requires an inspection checkpoint", () => {
    const card = buildMasterCard(baseCase(), { products: approved() });
    expect(card.inspectionCheckpoint.toLowerCase()).toContain("inspection checkpoint");
  });
});

/* ---------------- inspection ---------------- */

describe("inspection checkpoints", () => {
  it("classifies adverse responses as stop conditions", () => {
    expect(inspectionRequiresStop("colour_transferred")).toBe(true);
    expect(inspectionRequiresStop("reduced")).toBe(false);
  });

  it("records a stop condition and blocks the next stage", () => {
    const stopped = applyInspection(baseCase(), "fabric_weakened");
    expect(stopped.stopConditions).toContain("fibre_weakening");
    expect(buildMasterCard(stopped, { products: approved() }).status).toBe("stopped");
  });
});

/* ---------------- comparison ---------------- */

describe("cross-brand comparison", () => {
  it("uses neutral outcomes and never ranks products", () => {
    const records = [
      ...approved(),
      ...approved(product({ productId: "p2", companyId: "stas", companyName: "STAS", productKey: "STAS-1", eligibleComponents: ["protein"] })),
    ];
    const rows = compareAcrossBrands(records, baseCase({ selectedKits: [kit, kitB] }), { component: "oil", stageNumber: 5 });
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.outcome)).toContain("eligible");
    expect(rows.map((r) => r.outcome)).toContain("different_function");
    expect(rows.every((r) => !/best|better|recommended/i.test(r.outcomeLabel))).toBe(true);
  });

  it("marks unverified records as insufficient evidence", () => {
    const records = [classify(product(), "provisional", { origin: "database" })];
    const rows = compareAcrossBrands(records, baseCase({ selectedKits: [kit] }), { component: "oil", stageNumber: 5 });
    expect(rows[0].outcome).toBe("insufficient_evidence");
  });
});

/* ---------------- basic alternatives ---------------- */

describe("basic/domestic alternatives", () => {
  const method = (confidence: number, status = "approved") => ({ methodId: "m1", title: "Basic method", steps: ["Blot"], confidence, status });

  it("requires at least 9/10 evidence confidence", () => {
    expect(masterBasicAlternative(baseCase(), [method(8)])).toBeNull();
    expect(masterBasicAlternative(baseCase(), [method(9)])?.label).toContain("not a direct chemical equivalent");
  });

  it("is withheld when previous chemistry is unknown", () => {
    const c = baseCase({ ledger: [ledger({ productName: "Unknown product" })] });
    expect(masterBasicAlternative(c, [method(10)])).toBeNull();
  });
});

/* ---------------- failure analysis ---------------- */

describe("failure analysis", () => {
  it("never concludes with stronger chemistry", () => {
    const a = analyseFailure(baseCase({ ledger: [ledger({ rinsePerformed: false })] }));
    expect(a.conclusions.map((c) => c.label).join(" ")).not.toMatch(/stronger|escalate the chemistry/i);
    expect(a.note).toMatch(/never recommended/i);
  });

  it("recommends completing the rinse when a stage was not flushed", () => {
    const a = analyseFailure(baseCase({ ledger: [ledger({ rinsePerformed: false })] }));
    expect(a.conclusions.map((c) => c.key)).toContain("complete_rinse");
  });

  it("recognises permanent damage instead of retrying", () => {
    const a = analyseFailure(baseCase({ diagnosis: { ...EMPTY_MASTER_EXTRA.diagnosis, markKind: "fibre_degradation" } }));
    expect(a.conclusions.map((c) => c.key)).toContain("permanent_damage");
    expect(a.conclusions.map((c) => c.key)).not.toContain("retry_once");
  });
});

/* ---------------- offline, guard rails, persistence ---------------- */

describe("offline and guard rails", () => {
  it("only shows an offline summary with source version and verification date", () => {
    expect(offlineSafetySummary({ content: "x" }).readable).toBe(false);
    const ok = offlineSafetySummary({ content: "x", sourceVersion: "v2", lastVerified: "2026-01-01" });
    expect(ok.readable).toBe(true);
    expect(ok.warning).toMatch(/may have changed/i);
  });

  it("never allows publication or calculation offline", () => {
    expect(offlineActionAllowed("publish")).toBe(false);
    expect(offlineActionAllowed("approve")).toBe(false);
    expect(offlineActionAllowed("calculate")).toBe(false);
    expect(offlineActionAllowed("read_summary")).toBe(true);
  });

  it("rejects forbidden chemistry calculations", () => {
    expect(isForbiddenCalculation("custom_chemical_formulation")).toBe(true);
    expect(isForbiddenCalculation("record_ledger")).toBe(false);
  });

  it("labels operator observations and keeps them unpublishable", () => {
    const o = labelOperatorObservation("Seemed to lift faster warm");
    expect(o.publishable).toBe(false);
    expect(o.label).toMatch(/not approved treatment guidance/i);
  });

  it("shows emergency guidance only from an approved SDS", () => {
    expect(emergencyGuidance(null)).toMatch(/site emergency procedure/i);
    expect(emergencyGuidance({ firstAid: "Rinse eyes for 15 minutes", approved: true })).toBe("Rinse eyes for 15 minutes");
  });
});

describe("supabase persistence shape", () => {
  it("maps the case to the authoritative record columns", () => {
    const row = caseRow(baseCase({ caseReference: "MS-1", outcome: "Partially reduced" }));
    expect(row.working_level).toBe("master");
    expect(row.case_reference).toBe("MS-1");
    expect(row.outcome).toBe("Partially reduced");
    expect(row.fibre).toBeDefined();
    expect(row.dye_colour).toBeDefined();
  });

  it("maps ledger entries chronologically with rinse and neutralisation state", () => {
    const row = ledgerRow("case-1", ledger({ entryOrder: 3, rinsePerformed: true }));
    expect(row.case_id).toBe("case-1");
    expect(row.entry_order).toBe(3);
    expect(row.rinse_performed).toBe(true);
    expect(row.neutralization_performed).toBe(false);
  });
});
