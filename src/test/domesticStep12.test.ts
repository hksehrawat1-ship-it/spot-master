import { describe, it, expect } from "vitest";
import { runDomesticScenarios } from "@/lib/domesticScenarios";
describe("step12", () => { it("scenarios", () => {
  const r = runDomesticScenarios();
  const fails = r.filter(x=>!x.pass);
  console.log(r.map(x=>`${x.id} ${x.pass?"PASS":"FAIL"} ${x.title} :: ${x.detail}`).join("\n"));
  expect(fails.length).toBe(0);
}); });
