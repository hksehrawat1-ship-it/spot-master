import { describe, expect, it } from "vitest";
import { ADMIN_SCENARIOS } from "@/lib/adminScenarios";

describe("Step 16 — administration workspace acceptance scenarios", () => {
  for (const scenario of ADMIN_SCENARIOS) {
    it(`${scenario.id} — ${scenario.title}`, () => {
      const result = scenario.run();
      expect(result.pass, `${scenario.id}: ${result.detail}`).toBe(true);
    });
  }
});
