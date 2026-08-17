import { describe, it, expect } from "vitest";
import { SCENARIOS, runComparisonScenarios } from "@/lib/comparisonScenarios";

describe("Step 13 — three-kit comparison scenarios", () => {
  for (const s of SCENARIOS) {
    it(`${s.id} — ${s.title}`, () => {
      const r = s.run();
      expect(r.pass, `${s.id}: ${r.detail}`).toBe(true);
    });
  }

  it("all scenarios pass", () => {
    const { passed, total } = runComparisonScenarios();
    expect(passed).toBe(total);
  });
});
