import { describe, it, expect } from "vitest";
import { SCENARIOS, runGovernanceScenarios } from "@/lib/governanceScenarios";

describe("Step 15 — content governance, review and version control", () => {
  for (const s of SCENARIOS) {
    it(`${s.id} — ${s.title}`, () => {
      expect(s.run()).toBe(true);
    });
  }

  it("all scenarios pass", () => {
    const r = runGovernanceScenarios();
    expect(r.passed).toBe(r.total);
  });
});
