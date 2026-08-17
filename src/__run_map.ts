import { mappingScenarioSummary } from "@/lib/mappingScenarios";
const s = mappingScenarioSummary();
for (const r of s.results) if (!r.pass) console.log("FAIL", r.id, r.name, "→", r.detail);
console.log(`${s.passed}/${s.total} passed`);
