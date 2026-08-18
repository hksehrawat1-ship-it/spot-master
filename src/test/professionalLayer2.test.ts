import { describe, expect, it } from "vitest";
import { EMPTY_CASE } from "@/store/useRetail";
import {
  EMPTY_PRO_EXTRA, basicAlternative, buildComponentPlan, buildDecisionCard, buildProfessionalEscalation,
  eligibleProducts, evaluateTransition, findApprovedDecomposition, professionalCanUse, unknownFabricOutcome,
  type ProductTransition, type ProfessionalCase, type VerifiedProduct,
} from "@/lib/professionalEngine";
import { classify } from "@/lib/dataSource";
import type { KitSelection } from "@/lib/retailEngine";
import { MASTER_ONLY_CAPABILITIES } from "@/data/professionalSpotting";

const baseCase = (over: Partial<ProfessionalCase> = {}): ProfessionalCase => ({
  ...EMPTY_CASE,
  ...EMPTY_PRO_EXTRA,
  stainName: "Curry",
  stainKnown: true,
  fabricKnown: true,
  fabric: "Cotton",
  colour: "Light",
  careLabel: "available",
  testResult: "Passed",
  kit: { kind: "company", companyId: "c1", companyName: "Seitz", productIds: [] },
  garment: { fibre: "Cotton", construction: "Woven", colourfastness: "Passed", existingDamage: "None", trims: "None" },
  stain: { condition: "Fresh", confidence: "High" },
  activeComponent: "oil",
  ...over,
});

const product = (over: Partial<VerifiedProduct> = {}): VerifiedProduct => ({
  productId: "p1",
  productKey: "SEITZ-OIL",
  productName: "Oil remover",
  companyId: "c1",
  companyName: "Seitz",
  chemistryFamily: "solvent",
  verifiedPurpose: "Oil component",
  eligibleComponents: ["oil"],
  compatibleStages: [6],
  prohibitions: [],
  applicationMethod: "Apply from the reverse side.",
  dilution: "Ready to use",
  temperature: "Ambient",
  contactTime: "60 seconds",
  mechanicalAction: "Light tamping",
  rinseRequirement: "Flush with the approved medium",
  neutralisation: null,
  ppe: ["Nitrile gloves"],
  incompatibilities: ["Do not follow with oxidising products"],
  inspectionPoint: "Inspect before repeating",
  maximumAttempts: 2,
  sourceDocument: "TDS-2025",
  documentVersion: "v3",
  ...over,
});

const approvedProducts = (p = product()) => [classify(p, "production", { origin: "database" as const })];

describe("Layer 2 — Professional Spotting", () => {
  it("P1 decomposes approved multi-component stains", () => {
    const plan = buildComponentPlan(baseCase({ stainName: "Lipstick" }));
    expect(plan.available).toBe(true);
    expect(plan.entries.map((e) => e.role)).toEqual(["excess", "oil", "colour"]);
  });

  it("P2 never invents a sequence for unmapped stains", () => {
    const plan = buildComponentPlan(baseCase({ stainName: "Unidentified mark" }));
    expect(plan.available).toBe(false);
    expect(plan.entries).toHaveLength(0);
  });

  it("P3 matches milk tea to protein-then-tannin", () => {
    expect(findApprovedDecomposition("Milk tea")?.components[0].role).toBe("protein");
  });

  it("P4 unknown fabric does not automatically stop the case", () => {
    const outcome = unknownFabricOutcome(
      baseCase({
        fabricKnown: false,
        garment: { fibre: "Unknown" },
        fabricTests: {
          visual: "Completed", moisture: "No change", colour_transfer: "No transfer",
          seam: "No change", coating: "None found", operator_confidence: "High",
        },
      }),
    );
    expect(outcome).toBe("Proceed within verified limits");
  });

  it("P5 adverse test response stops spot treatment", () => {
    expect(
      unknownFabricOutcome(baseCase({ fabricKnown: false, garment: { fibre: "Unknown" }, fabricTests: { seam: "Damage seen" } })),
    ).toBe("Do not spot-treat");
  });

  it("P6 coating or adhesive routes to Master Spotter", () => {
    expect(
      unknownFabricOutcome(baseCase({ fabricKnown: false, garment: { fibre: "Unknown" }, fabricTests: { coating: "Coating present" } })),
    ).toBe("Master Spotter assessment required");
  });

  it("P7 incomplete panel asks for more testing", () => {
    expect(unknownFabricOutcome(baseCase({ fabricKnown: false, garment: { fibre: "Unknown" }, fabricTests: {} }))).toBe(
      "Additional test required",
    );
  });

  it("P8 blocks any product after an unknown previous chemical", () => {
    const t = evaluateTransition(baseCase({ previousChemical: { product: "Unknown product" } }), product(), []);
    expect(t.allowed).toBe(false);
    expect(t.status).toBe("prohibited");
  });

  it("P9 treats an unmapped transition as unverified, not permitted", () => {
    const t = evaluateTransition(
      baseCase({ previousChemical: { product: "Known kit product" }, previousProductKey: "SEITZ-PROTEIN" }),
      product(),
      [],
    );
    expect(t.status).toBe("unverified");
    expect(t.allowed).toBe(false);
  });

  it("P10 requires the mapped rinse before the next product", () => {
    const transitions: ProductTransition[] = [
      {
        fromProductKey: "SEITZ-PROTEIN", toProductKey: "SEITZ-OIL", permission: "permitted_with_rinse",
        requiredRinse: "Flush fully", approvalStatus: "approved", inspectionRequired: true,
      },
    ];
    const c = baseCase({ previousChemical: { product: "Known kit product", rinsed: "No" }, previousProductKey: "SEITZ-PROTEIN" });
    expect(evaluateTransition(c, product(), transitions).status).toBe("requires_rinse");
    const rinsed = { ...c, previousChemical: { product: "Known kit product", rinsed: "Yes" } };
    expect(evaluateTransition(rinsed, product(), transitions).allowed).toBe(true);
  });

  it("P11 never treats products from another company as equivalent", () => {
    const list = eligibleProducts(approvedProducts(product({ companyId: "other-co" })), {
      kit: { kind: "company", companyId: "c1", companyName: "Seitz", productIds: [] },
      component: "oil",
      stageNumber: 6,
    });
    expect(list).toHaveLength(0);
  });

  it("P12 shows only products eligible for the current component and stage", () => {
    const kit: KitSelection = { kind: "company", companyId: "c1", companyName: "Seitz", productIds: [] };
    expect(eligibleProducts(approvedProducts(), { kit, component: "oil", stageNumber: 6 })).toHaveLength(1);
    expect(eligibleProducts(approvedProducts(), { kit, component: "protein", stageNumber: 7 })).toHaveLength(0);
  });

  it("P13 excludes provisional records from actionable guidance", () => {
    const list = eligibleProducts([classify(product(), "provisional", { origin: "database" })], {
      kit: { kind: "company", companyId: "c1", companyName: "Seitz", productIds: [] },
      component: "oil",
      stageNumber: 6,
    });
    expect(list).toHaveLength(0);
  });

  it("P14 builds a full 14-section decision card when cleared", () => {
    const card = buildDecisionCard(baseCase(), { products: approvedProducts() });
    expect(card.status).toBe("proceed");
    expect(card.product?.productName).toBe("Oil remover");
    expect(card.instructions.map((i) => i.label)).toContain("Approved dilution");
    expect(card.ppe).toContain("Nitrile gloves");
    expect(card.rinseRequirement).toBe("Flush with the approved medium");
  });

  it("P15 falls back to the label instruction when a value is missing", () => {
    const card = buildDecisionCard(baseCase(), { products: approvedProducts(product({ dilution: null })) });
    expect(card.instructions.find((i) => i.label === "Approved dilution")?.value).toMatch(
      /product label or technical data sheet/i,
    );
  });

  it("P16 shows no instructions while the case is stopped", () => {
    const card = buildDecisionCard(baseCase({ activeColourBleeding: "Yes" }), { products: approvedProducts() });
    expect(card.status).toBe("stop_escalate");
    expect(card.instructions).toHaveLength(0);
    expect(card.product).toBeNull();
  });

  it("P17 fails closed when the safety evaluation is unavailable", () => {
    const card = buildDecisionCard(baseCase({ safetyEngineAvailable: false }), { products: approvedProducts() });
    expect(card.status).toBe("stop_escalate");
    expect(card.blockReason).toBe("safety_engine_unavailable");
  });

  it("P18 reports every active escalation trigger", () => {
    const card = buildDecisionCard(
      baseCase({ highValueGarment: true, operatorUncertain: true, garment: { ...baseCase().garment, construction: "Laminated" } }),
      { products: approvedProducts() },
    );
    const keys = card.escalation.triggers.map((t) => t.key);
    expect(keys).toEqual(expect.arrayContaining(["high_value_garment", "operator_uncertain", "sensitive_construction"]));
    expect(card.escalation.required).toBe(true);
  });

  it("P19 offers a basic alternative only when it is verified and safe", () => {
    const method = { methodId: "m1", title: "Approved basic method", steps: ["Blot"], confidence: 9, status: "approved" };
    expect(basicAlternative(baseCase(), [method])?.label).toMatch(/not equivalent/i);
    expect(basicAlternative(baseCase(), [{ ...method, confidence: 8 }])).toBeNull();
    expect(basicAlternative(baseCase({ previousChemical: { product: "Unknown product" } }), [method])).toBeNull();
  });

  it("P20 reserves master-only capabilities", () => {
    for (const cap of MASTER_ONLY_CAPABILITIES) expect(professionalCanUse(cap)).toBe(false);
    expect(professionalCanUse("record_outcome")).toBe(true);
  });

  it("P21 transfers the complete case history on escalation", () => {
    const c = baseCase({ notes: "operator note", supervisorNotes: "supervisor note" });
    const card = buildDecisionCard(c, { products: approvedProducts() });
    const pkg = buildProfessionalEscalation(c, card, "Stain remains");
    expect(pkg.garment.fibre).toBe("Cotton");
    expect(pkg.componentPlan.entries.length).toBeGreaterThan(0);
    expect(pkg.previousChemical).toBeDefined();
    expect(pkg.operatorNotes).toBe("operator note");
    expect(pkg.supervisorNotes).toBe("supervisor note");
    expect(pkg.layer).toBe("professional");
  });

  it("P22 never guarantees stain removal", () => {
    const card = buildDecisionCard(baseCase(), { products: approvedProducts() });
    expect(card.expectedOutcome).toMatch(/never guaranteed/i);
  });

  it("P23 asks for a component before showing a product", () => {
    const card = buildDecisionCard(baseCase({ activeComponent: undefined }), { products: approvedProducts() });
    expect(card.status).toBe("additional_information_required");
  });

  it("P24 reports when no kit product covers the component", () => {
    const card = buildDecisionCard(baseCase({ activeComponent: "protein" }), { products: approvedProducts() });
    expect(card.status).toBe("no_verified_product");
  });
});
