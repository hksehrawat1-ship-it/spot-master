import { describe, it, expect } from "vitest";
import { SCENARIOS, runOutcomeScenarios } from "@/lib/outcomeScenarios";

describe("Step 14 — treatment feedback and outcome loop", () => {
  for (const s of SCENARIOS) {
    it(`${s.id} — ${s.title}`, () => {
      expect(s.run()).toBe(true);
    });
  }

  it("all scenarios pass", () => {
    const r = runOutcomeScenarios();
    expect(r.passed).toBe(r.total);
  });
});
