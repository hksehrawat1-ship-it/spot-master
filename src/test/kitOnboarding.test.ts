import { describe, expect, it } from "vitest";
import { CANONICAL_PRODUCT_TABLES, LEGACY_PRODUCT_TABLES } from "@/lib/productCatalog";
import { validateMappingInput } from "@/hooks/useGuidanceMappings";

describe("kit onboarding foundation", () => {
  it("keeps legacy mapping tables out of the canonical model", () => {
    for (const legacy of LEGACY_PRODUCT_TABLES) {
      expect(CANONICAL_PRODUCT_TABLES).not.toContain(legacy as never);
    }
    expect(CANONICAL_PRODUCT_TABLES).toContain("product_guidance_mappings");
  });

  it("refuses a partial guidance mapping", () => {
    const missing = validateMappingInput({ productId: "p1", decision: "recommended" });
    expect(missing).toContain("Exact stain record (stable ID)");
    expect(missing).toContain("Source document");
    expect(missing).toContain("Stop conditions");
  });

  it("accepts a fully evidenced mapping", () => {
    expect(
      validateMappingInput({
        productId: "p1",
        productVersionId: "v1",
        stainRecordId: "s1",
        decision: "recommended_after_testing",
        country: "IN",
        evidenceLevel: "label_documented",
        sourceDocumentId: "d1",
        sourceSection: "Table 2",
        reviewNote: "Documented on the manufacturer label.",
        stopConditions: ["hidden_test_failed"],
      }),
    ).toEqual([]);
  });
});
