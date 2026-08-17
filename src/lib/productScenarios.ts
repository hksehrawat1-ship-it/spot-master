/** STEP 7 — required test scenarios (§38) for the professional product database. */

import {
  COMPANIES, KITS, PRODUCTS, DOCUMENTS, KIT_PRODUCTS,
  NOT_DISCLOSED, INSUFFICIENT_INFO, FOLLOW_LABEL, COST_UNAVAILABLE,
  UNDISCLOSED_CHEMISTRY, NO_SAFETY_DATA, formatCompanyId,
} from "@/data/professionalProducts";
import type {
  Company, Kit, Product, ProductVersion, ProductDocument, Instruction,
} from "@/data/professionalProducts";
import {
  allocateCompanyId, allocateProductId, currentVersion, kitsForProduct, productsForKit,
  documentsFor, chemistryDisplay, textileSuitability, processPermission, instructionValue,
  evaluateScorecard, detectConflicts, detectIdentityConflicts, supersedeDocument,
  addVersion, discontinue, linkReplacement, costPerTreatment, professionalAccess,
  publicProductView, canAuthorise, rankedDocuments, documentRank, exportProductsCsv,
} from "@/lib/productEngine";

export type ScenarioResult = { id: number; name: string; pass: boolean; detail: string };

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

const card = (p: Product, docs: ProductDocument[] = DOCUMENTS, conflicts = []) =>
  evaluateScorecard(p, currentVersion(p), docs, COMPANIES.find((c) => c.key === p.companyKey), conflicts);

function instruction(partial: Partial<Instruction>): Instruction {
  return {
    id: Math.random().toString(36).slice(2),
    applicationStage: "spotting",
    stepOrder: 1,
    stopConditions: [],
    origin: "manufacturer_documented",
    sourceDescription: "test",
    approvalStatus: "approved",
    ...partial,
  };
}

export function runProductScenarios(): ScenarioResult[] {
  const out: ScenarioResult[] = [];
  const t = (name: string, fn: () => string | true) => {
    try {
      const r = fn();
      out.push({ id: out.length + 1, name, pass: r === true, detail: r === true ? "OK" : String(r) });
    } catch (e) {
      out.push({ id: out.length + 1, name, pass: false, detail: (e as Error).message });
    }
  };

  const seitz = PRODUCTS.find((p) => p.key === "seitz_purasol")!;
  const fungusGo = PRODUCTS.find((p) => p.key === "cc_fungus_go")!;
  const organic = PRODUCTS.find((p) => p.key === "cc_organic")!;

  /* 1 */ t("Add a fourth company without changing the stain database", () => {
    const stainDbBefore = PRODUCTS.length;
    const companies: Company[] = [...COMPANIES, {
      ...clone(COMPANIES[0]), uuid: "cmp-x", key: "future_mfr",
      companyId: allocateCompanyId(COMPANIES), displayName: "Future Manufacturer",
      relationships: [],
    }];
    if (companies.length !== 4) return "fourth company not added";
    if (companies[3].companyId !== formatCompanyId(4)) return `unexpected id ${companies[3].companyId}`;
    return PRODUCTS.length === stainDbBefore ? true : "product/stain data mutated";
  });

  /* 2 */ t("Add a second kit for an existing company", () => {
    const kits: Kit[] = [...KITS, { ...clone(KITS[0]), key: "seitz_second_kit", kitId: "SM-KIT-000004", kitName: "Seitz second kit" }];
    const seitzKits = kits.filter((k) => k.companyKey === "seitz");
    return seitzKits.length === 2 ? true : `expected 2 Seitz kits, got ${seitzKits.length}`;
  });

  /* 3 */ t("One product belongs to multiple kits (no duplication)", () => {
    const links = [...KIT_PRODUCTS, { kitKey: "clean_craft_nine_bottle", productKey: seitz.key, position: 10 }];
    const kits = kitsForProduct(seitz.key, links, KITS);
    const copies = PRODUCTS.filter((p) => p.canonicalName === seitz.canonicalName).length;
    return kits.length === 2 && copies === 1 ? true : `kits=${kits.length} copies=${copies}`;
  });

  /* 4 */ t("Same product name with different country formulations", () => {
    let p = clone(seitz);
    p = addVersion(p, { country: "IN", changeSummary: "India formulation", formulationIdentifier: "IN-F1" });
    const countries = new Set(p.versions.map((v) => v.country));
    return countries.size === 2 && p.canonicalName === seitz.canonicalName
      ? true : `countries=${[...countries].join(",")}`;
  });

  /* 5 */ t("Reformulation creates a new immutable version", () => {
    const before = clone(seitz);
    const after = addVersion(before, { country: "unspecified", changeSummary: "Reformulated", knownFormulationChange: true });
    const original = after.versions[0];
    return after.versions.length === 2 &&
      original.key === before.versions[0].key &&
      original.supersededByKey === after.currentVersionKey &&
      after.versions.every((v) => v.immutable)
      ? true : "version chain incorrect";
  });

  /* 6 */ t("Discontinued product remains connected to historical cases", () => {
    const d = discontinue(clone(seitz), "2026-01-01");
    const historicalVersionKey = seitz.versions[0].key;
    return d.status === "discontinued" && d.versions.some((v) => v.key === historicalVersionKey)
      ? true : "historical version lost";
  });

  /* 7 */ t("Replacement product does not inherit approval automatically", () => {
    const old = { ...clone(seitz), status: "published" as const };
    const repl = { ...clone(PRODUCTS[1]), status: "draft" as const, verifications: [{ claimedStain: "x", verification: "verified" as const, evidenceLevel: "independent_trial" as const, approvalStatus: "approved" as const }] };
    const { discontinued, replacement } = linkReplacement(old, repl);
    return discontinued.replacementProductKey === repl.key &&
      replacement.status === "draft" && replacement.verifications.length === 0 && replacement.provisional
      ? true : "replacement inherited approval";
  });

  /* 8 */ t("Missing SDS produces Documentation Incomplete", () => {
    const c = card(seitz);
    return c.documentCompleteness === "incomplete" && !c.checks.current_sds_available
      ? true : `completeness=${c.documentCompleteness}`;
  });

  /* 9 */ t("US SDS with India product produces Country Mismatch", () => {
    const p = clone(fungusGo);
    const v = currentVersion(p);
    const docs: ProductDocument[] = [{
      key: "d-us-sds", documentId: "SM-DOC-000900", productKey: p.key, companyKey: p.companyKey,
      documentType: "sds", title: "US SDS", issuerUncertain: false, country: "US",
      state: "current_and_verified",
    }];
    const conflicts = detectConflicts(p, v, docs);
    const c = evaluateScorecard(p, v, docs, COMPANIES.find((x) => x.key === p.companyKey), conflicts);
    return conflicts.some((x) => x.conflictType === "country_mismatch") && c.countryMismatch
      ? true : "country mismatch not detected";
  });

  /* 10 */ t("Spotting chart conflicts with TDS", () => {
    const p = clone(seitz);
    const v = currentVersion(p);
    v.instructions = [
      instruction({ dilution: "1:10", documentType: "spotting_chart", sourceDescription: "chart" }),
      instruction({ dilution: "1:20", documentType: "tds", sourceDescription: "TDS", stepOrder: 2 }),
    ];
    const conflicts = detectConflicts(p, v, []);
    return conflicts.some((c) => c.conflictType === "spotting_chart_conflicts_with_document") &&
      conflicts.some((c) => c.blocksPublication)
      ? true : "chart/TDS conflict not detected";
  });

  /* 11 */ t("Distributor instruction conflicts with manufacturer label", () => {
    const p = clone(seitz);
    const v = currentVersion(p);
    v.instructions = [
      instruction({ contactTime: "documented A", origin: "manufacturer_documented", documentType: "product_label" }),
      instruction({ contactTime: "documented B", origin: "distributor_documented", stepOrder: 2 }),
    ];
    const conflicts = detectConflicts(p, v, []);
    const chose = conflicts.find((c) => c.conflictType === "distributor_conflicts_with_manufacturer");
    return chose && chose.blocksPublication && !("autoResolved" in chose)
      ? true : "distributor conflict not blocked";
  });

  /* 12 */ t("Missing dilution shows the follow-the-label message", () => {
    const v = currentVersion(seitz);
    return instructionValue(v, "dilution") === FOLLOW_LABEL &&
      instructionValue(v, "contactTime") === FOLLOW_LABEL
      ? true : "fallback text missing";
  });

  /* 13 */ t("Missing chemistry shows Not disclosed", () => {
    const d = chemistryDisplay(UNDISCLOSED_CHEMISTRY);
    return d.ingredients[0] === NOT_DISCLOSED && d.chemicalFamily === NOT_DISCLOSED &&
      d.ph === NOT_DISCLOSED ? true : "chemistry not defaulted";
  });

  /* 14 */ t("Missing compatibility defaults to Insufficient Information", () => {
    const v = currentVersion(seitz);
    const silk = textileSuitability(v, "silk");
    const perc = processPermission(v, "perc_dry_cleaning");
    return silk.label === INSUFFICIENT_INFO && silk.suitability === "insufficient_information" &&
      perc.permitted === "process_not_established" ? true : "compatibility defaulted incorrectly";
  });

  /* 15 */ t("Unverified product cannot publish actionable instructions", () => {
    const c = card(seitz);
    return !c.canPublishInstructions && c.blockingReasons.length > 0
      ? true : "unverified product would publish";
  });

  /* 16 */ t("Domestic user cannot access professional procedures", () => {
    const p = seitz; const v = currentVersion(p);
    const access = professionalAccess("domestic_user", p, v, card(p));
    const pub = publicProductView(p, COMPANIES[0], card(p));
    return !access.allowed && !access.showInstructions && !access.showCost && !access.showInternalNotes &&
      pub.professionalOnly.includes("trained professionals")
      ? true : "domestic access leaked";
  });

  /* 17 */ t("Professional user cannot bypass missing documentation", () => {
    const p = seitz; const v = currentVersion(p);
    const access = professionalAccess("professional", p, v, card(p));
    return !access.allowed && access.reasons.some((r) => r.includes("Safety Data Sheet"))
      ? true : "professional bypassed missing docs";
  });

  /* 18 */ t("Product in organization inventory remains unverified", () => {
    const inventory = { organizationKey: "org1", productKey: seitz.key, approvedForUse: true, quantity: 3 };
    const c = card(seitz);
    return inventory.approvedForUse && c.overall !== "fully_verified" &&
      !c.canPublishInstructions ? true : "inventory implied verification";
  });

  /* 19 */ t("Cost per treatment blocked without a verified dose", () => {
    const noDose = costPerTreatment({ purchasePrice: 1000, packSize: 200, doseVerified: false, currency: "INR" });
    const withDose = costPerTreatment({
      purchasePrice: 1000, packSize: 200, usableQuantity: 200, verifiedDose: 2,
      doseVerified: true, currency: "INR",
    });
    return noDose.value === null && noDose.message === COST_UNAVAILABLE && withDose.value === 10
      ? true : `noDose=${noDose.value} withDose=${withDose.value}`;
  });

  /* 20 */ t("Fungus Go description inconsistency is flagged", () =>
    fungusGo.reviewFlags.some((f) => f.toLowerCase().includes("colour transfer"))
      ? true : "Fungus Go flag missing");

  /* 21 */ t("Clean Craft steam instruction flagged for review", () => {
    const steam = fungusGo.reviewFlags.some((f) => f.toLowerCase().includes("steam-first"));
    const protein = organic.reviewFlags.some((f) => f.toLowerCase().includes("steam") && f.toLowerCase().includes("safety"));
    return steam && protein ? true : `steam=${steam} protein=${protein}`;
  });

  /* 22 */ t("Seitz solvent compatibility stored per product and process", () => {
    const p = clone(seitz); const v = currentVersion(p);
    v.processes = [
      { processKey: "perc_dry_cleaning", permitted: "permitted", verification: "verified" },
      { processKey: "hydrocarbon_dry_cleaning", permitted: "process_not_established", verification: "unverified" },
      { processKey: "silicone_solvent_dry_cleaning", permitted: "process_not_established", verification: "unverified" },
    ];
    const hydro = processPermission(v, "hydrocarbon_dry_cleaning");
    return hydro.permitted === "process_not_established"
      ? true : "compatibility generalised across solvents";
  });

  /* 23 */ t("STAS products remain provisional pending documentation", () => {
    const stasKit = KITS.find((k) => k.key === "stas_stain_n_kit")!;
    const stasProducts = productsForKit("stas_stain_n_kit");
    return stasProducts.length === 0 && stasKit.verification === "unverified" &&
      (stasKit.notes ?? "").includes("Awaiting")
      ? true : "STAS identities were invented";
  });

  /* 24 */ t("Historical product version remains visible after update", () => {
    const p = addVersion(clone(seitz), { country: "unspecified", changeSummary: "New label" });
    const historical = p.versions[0];
    return p.versions.length === 2 && historical.approvalStatus === "superseded" &&
      historical.key !== p.currentVersionKey ? true : "history lost";
  });

  /* 25 */ t("Document supersession triggers Needs Review", () => {
    const { documents, triggersReview } = supersedeDocument(clone(DOCUMENTS), "doc_seitz_chart", "doc_new");
    const p = clone(seitz); const v = currentVersion(p);
    const conflicts = detectConflicts(p, v, documents.filter((d) => d.key === "doc_seitz_chart"));
    return triggersReview && conflicts.some((c) => c.conflictType === "outdated_document")
      ? true : "supersession did not trigger review";
  });

  /* 26 */ t("Spotting chart alone cannot authorise safety-critical topics", () => {
    const chartOnly: ProductDocument[] = [{
      ...DOCUMENTS[0], state: "current_and_verified",
    }];
    const blocked = ["ppe", "dilution", "contact_time", "neutralization", "storage"] as const;
    return blocked.every((topic) => !canAuthorise(chartOnly, topic))
      ? true : "chart authorised a restricted topic";
  });

  /* 27 */ t("Document hierarchy ranks label above SDS, TDS and charts", () => {
    const ok = documentRank("product_label") < documentRank("sds") &&
      documentRank("sds") < documentRank("tds") &&
      documentRank("tds") < documentRank("spotting_chart");
    const ranked = rankedDocuments([
      { ...DOCUMENTS[0] },
      { ...DOCUMENTS[0], key: "x", documentType: "product_label" },
    ]);
    return ok && ranked[0].documentType === "product_label" ? true : "hierarchy incorrect";
  });

  /* 28 */ t("Different product names sharing one product code are flagged", () => {
    const a = { ...clone(seitz), productCode: "SAME-1" };
    const b = { ...clone(PRODUCTS[1]), productCode: "SAME-1" };
    const conflicts = detectIdentityConflicts([a, b]);
    return conflicts.some((c) => c.conflictType === "different_names_same_code")
      ? true : "duplicate code not flagged";
  });

  /* 29 */ t("Clean Craft / Seitz relationship stored as unverified claim", () => {
    const cc = COMPANIES.find((c) => c.key === "clean_craft")!;
    const rel = cc.relationships[0];
    return rel && rel.verification === "relationship_unverified" && !cc.isManufacturer
      ? true : "relationship treated as verified";
  });

  /* 30 */ t("Export contains identity but no invented instruction values", () => {
    const csv = exportProductsCsv(PRODUCTS, COMPANIES, (p) => card(p));
    return csv.includes("SM-PRD-000001") && csv.includes(FOLLOW_LABEL) && !csv.includes("undefined")
      ? true : "export incorrect";
  });

  return out;
}

export const productScenarioSummary = () => {
  const r = runProductScenarios();
  return { passed: r.filter((x) => x.pass).length, total: r.length, results: r };
};
