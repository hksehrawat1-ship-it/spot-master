import { describe, expect, it } from "vitest";
import { PILOT_SCENARIOS } from "@/lib/pilotScenarios";

describe("Step 17 — controlled pilot library acceptance scenarios", () => {
  for (const scenario of PILOT_SCENARIOS) {
    it(`${scenario.id} — ${scenario.title}`, () => {
      const result = scenario.run();
      expect(result.pass, `${scenario.id}: ${result.detail}`).toBe(true);
    });
  }
});
