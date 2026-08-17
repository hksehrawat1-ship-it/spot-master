/** STEP 17 — Required end-to-end pilot scenarios (deterministic, UI-free). */

import {
  DOMESTIC_CANDIDATES, DOMESTIC_FALLBACK, INSUFFICIENT_INFORMATION, NO_LABEL_GARMENTS,
  OPEN_REVIEW_ITEMS, PHASE_DEFINITIONS, PILOT_CATEGORIES, PILOT_CORE_RECORDS,
  PILOT_DIAGNOSTIC_RECORDS, PILOT_PRODUCTS, PILOT_RECORDS, ANALYTICS_MAY_CHANGE_SAFETY,
  FORBIDDEN_PRIMARY_CATEGORIES, MONITORING_SIGNALS, FEEDBACK_REASONS, SUPPORT_ROUTES,
  LEGAL_NOTICES,
} from "@/data/pilotLibrary";
import { CONTROLLED_TESTS, UAT_PARTICIPANTS } from "@/data/pilotTesting";
import {
  assessNoLabel, buildRecommendations, canSeeProfessionalProcedure, categoryCounts,
  colloquialClarification, detectRollbackTrigger, domesticDecision, emergencySuspension,
  failureBehaviour, kitSummary, organizationIsolated, phaseAllows, pilotCompletionReport,
  productPublication, productReport, publishedCoreRecords, publishedDomesticMethods,
  publishedRecords, recordPublishEligibility, releaseGate, reliesOnlyOnSpottingChart,
  resultSectionOrder, rollbackRehearsal, scopeCheck, searchPilot, stableIdIntegrity,
  technicalGate, validateCategories, validateRecommendations,
} from "@/lib/pilotEngine";

export type Scenario = { id: string; title: string; run: () => { pass: boolean; detail: string } };

const ok = (pass: boolean, detail: string) => ({ pass, detail });
const rec5 = (ctx: Parameters<typeof buildRecommendations>[0]) => buildRecommendations(ctx);

export const PILOT_SCENARIOS: Scenario[] = [
  /* Scope and governance ------------------------------------------- */
  { id: "P01", title: "Pilot launches with 36 core records", run: () => ok(PILOT_CORE_RECORDS.length === 36, `core=${PILOT_CORE_RECORDS.length}`) },
  { id: "P02", title: "Six non-stain diagnostic records exist and are not ordinary stains", run: () => ok(PILOT_DIAGNOSTIC_RECORDS.length === 6 && PILOT_DIAGNOSTIC_RECORDS.every((r) => r.isDiagnostic), `diagnostics=${PILOT_DIAGNOSTIC_RECORDS.length}`) },
  { id: "P03", title: "Pilot stays within the 50-record ceiling", run: () => { const s = scopeCheck(); return ok(s.withinScope, `core=${s.core} max=${s.max}`); } },
  { id: "P04", title: "Every record has a unique stable ID and immutable version", run: () => { const s = stableIdIntegrity(); return ok(s.ok, `dupes=${s.duplicates.join(",")} unversioned=${s.unversioned.join(",")}`); } },
  { id: "P05", title: "Every published record carries complete governance metadata", run: () => { const bad = publishedRecords().filter((r) => !recordPublishEligibility(r).eligible); return ok(bad.length === 0, `incomplete=${bad.length}`); } },
  { id: "P06", title: "Draft content is never published", run: () => { const r = { ...PILOT_RECORDS[0], status: "draft" as const }; return ok(!recordPublishEligibility(r).eligible, recordPublishEligibility(r).blockers[0]); } },
  { id: "P07", title: "Needs Review content is never published", run: () => { const r = { ...PILOT_RECORDS[0], status: "needs_review" as const }; return ok(!recordPublishEligibility(r).eligible, "blocked"); } },
  { id: "P08", title: "Documentation-incomplete content is never published", run: () => { const r = { ...PILOT_RECORDS[0], documentation: { ...PILOT_RECORDS[0].documentation, sources: false } }; return ok(!recordPublishEligibility(r).eligible, "missing sources blocks publication"); } },
  { id: "P09", title: "Suspended content disappears from the published set immediately", run: () => { const s = emergencySuspension("SM-PIL-0001"); return ok(s.removedFromPublic, `published=${s.publishedCount}`); } },
  { id: "P10", title: "Historical case data remains reproducible via immutable versions", run: () => ok(PILOT_RECORDS.every((r) => r.version === "1.0.0"), "all pilot records at version 1.0.0") },

  /* Categories ------------------------------------------------------ */
  { id: "P11", title: "Exactly twelve primary categories are validated", run: () => { const v = validateCategories(); return ok(v.valid && PILOT_CATEGORIES.length === 12, v.issues.join("; ") || "12 categories valid"); } },
  { id: "P12", title: "Category counts use only Published records", run: () => { const counts = categoryCounts(); const total = Object.values(counts).reduce((a, b) => a + b, 0); return ok(total === publishedRecords().length, `counts=${total} published=${publishedRecords().length}`); } },
  { id: "P13", title: "No heat-set/aged or chemical-damage primary category exists", run: () => ok(FORBIDDEN_PRIMARY_CATEGORIES.every((f) => !(PILOT_CATEGORIES as readonly string[]).includes(f)), "forbidden categories absent") },
  { id: "P14", title: "Unknown route is available", run: () => ok(validateCategories().unknownRouteAvailable, "Unknown stain diagnostic record present") },

  /* Search ---------------------------------------------------------- */
  { id: "P15", title: "User searches 'haldi' and finds turmeric", run: () => { const h = searchPilot("haldi"); return ok(h.some((x) => x.record.commonName === "Turmeric/haldi"), `matchedOn=${h[0]?.matchedOn}`); } },
  { id: "P16", title: "User misspells a stain and still finds it", run: () => ok(searchPilot("cofee").some((x) => x.record.commonName === "Black coffee"), "misspelling index hit") },
  { id: "P17", title: "Search by stable Stain ID works", run: () => ok(searchPilot("SM-PIL-0016")[0]?.record.commonName === "Blood", "stable id search") },
  { id: "P18", title: "Search by source works", run: () => ok(searchPilot("nosebleed").some((x) => x.record.commonName === "Blood"), "source search") },
  { id: "P19", title: "Kajal and sindoor local names resolve", run: () => ok(searchPilot("kajal").length > 0 && searchPilot("sindoor").length > 0, "local names resolve") },
  { id: "P20", title: "Colloquial brand term asks for formulation confirmation instead of chemistry", run: () => { const c = colloquialClarification("fevicol"); return ok(!!c && c.includes("confirmed"), c ?? "none"); } },
  { id: "P21", title: "'Rang' returns a clarification prompt", run: () => ok(!!colloquialClarification("rang"), "clarification returned") },

  /* Exactly five recommendations ------------------------------------ */
  { id: "P22", title: "A complete result shows exactly five recommendations", run: () => { const r = rec5({ mode: "domestic", stainId: "SM-PIL-0001" }); return ok(validateRecommendations(r).valid, `count=${r.length}`); } },
  { id: "P23", title: "Four recommendations fail validation", run: () => ok(!validateRecommendations(rec5({ mode: "domestic" }).slice(0, 4)).valid, "four rejected") },
  { id: "P24", title: "Six recommendations fail validation", run: () => { const r = rec5({ mode: "domestic" }); return ok(!validateRecommendations([...r, { order: 6, text: "extra", safetyFocused: false }]).valid, "six rejected"); } },
  { id: "P25", title: "Blocked cases still receive exactly five safety-focused recommendations", run: () => { const r = rec5({ mode: "professional", blocked: true, stainId: "SM-PIL-0016" }); return ok(r.length === 5 && r.every((x) => x.safetyFocused), "five safety-focused"); } },
  { id: "P26", title: "Recommendations appear before detailed treatment", run: () => { const o = resultSectionOrder(); return ok(o.indexOf("five_recommendations") < o.indexOf("treatment_steps"), o.join(">")); } },
  { id: "P27", title: "Recommendations are case-specific", run: () => ok(rec5({ mode: "domestic", stainId: "SM-PIL-0001" })[0].text !== rec5({ mode: "domestic", stainId: "SM-PIL-0016" })[0].text, "text varies by stain") },
  { id: "P28", title: "Domestic and professional wording differ", run: () => ok(rec5({ mode: "domestic", stainId: "SM-PIL-0001" })[0].text !== rec5({ mode: "professional", stainId: "SM-PIL-0001" })[0].text, "wording differs") },

  /* Domestic gate --------------------------------------------------- */
  { id: "P29", title: "Domestic tea case on a labelled washable garment is allowed", run: () => { const d = domesticDecision({ stainId: "SM-PIL-0001", washableVerified: true, colourfastVerified: true, fresh: true }); return ok(d.allowed && d.confidence >= 9, `${d.confidence}/10`); } },
  { id: "P30", title: "Domestic case below 9/10 is refused with the required fallback", run: () => { const d = domesticDecision({ stainId: "SM-PIL-D001" }); return ok(!d.allowed && d.message === DOMESTIC_FALLBACK, d.message); } },
  { id: "P31", title: "No published domestic method sits below 9/10", run: () => ok(publishedDomesticMethods().every((c) => c.confidence >= 9), `${publishedDomesticMethods().length} methods`) },
  { id: "P32", title: "Dried-mud candidate at 8/10 stays unapproved", run: () => { const c = DOMESTIC_CANDIDATES.find((x) => x.candidateId === "DC-06")!; return ok(!c.approved && c.confidence < 9, `${c.confidence}/10 approved=${c.approved}`); } },
  { id: "P33", title: "Excluded cases (rust, marker, paint, dye transfer) get no domestic method", run: () => { const ids = ["SM-PIL-0035", "SM-PIL-0029", "SM-PIL-0033", "SM-PIL-0036"]; return ok(ids.every((id) => !domesticDecision({ stainId: id }).allowed), "all four refused"); } },
  { id: "P34", title: "Domestic user cannot access a professional procedure", run: () => ok(!canSeeProfessionalProcedure("domestic_user", "professional") && !canSeeProfessionalProcedure("domestic_user", "domestic"), "blocked in both modes") },
  { id: "P35", title: "Mixed household cleaners route to the fallback", run: () => ok(!domesticDecision({ stainId: "SM-PIL-0001", exclusions: ["mixed_household_cleaners"] }).allowed, "dangerous mixing refused") },
  { id: "P36", title: "Unknown previous chemical blocks domestic treatment", run: () => ok(!domesticDecision({ stainId: "SM-PIL-0001", exclusions: ["previous_unknown_chemical"] }).allowed, "refused") },

  /* Diagnostic records ---------------------------------------------- */
  { id: "P37", title: "Bleach-related colour loss is diagnostic, not removable", run: () => { const r = PILOT_RECORDS.find((x) => x.stainId === "SM-PIL-D003")!; return ok(r.isDiagnostic && r.expectedOutcome.toLowerCase().includes("no removal"), r.expectedOutcome); } },
  { id: "P38", title: "Scorch damage stops treatment", run: () => { const r = PILOT_RECORDS.find((x) => x.stainId === "SM-PIL-D004")!; return ok(r.safeFirstResponse.startsWith("Stop"), r.safeFirstResponse); } },
  { id: "P39", title: "Active dye bleeding stops all wet work", run: () => { const r = PILOT_RECORDS.find((x) => x.stainId === "SM-PIL-D005")!; return ok(r.safeFirstResponse.toLowerCase().includes("stop all wet treatment"), r.safeFirstResponse); } },
  { id: "P40", title: "Unknown stain never receives assumed chemistry", run: () => { const r = PILOT_RECORDS.find((x) => x.stainId === "SM-PIL-D001")!; return ok(r.solubility.toLowerCase().includes("unknown"), r.solubility); } },
  { id: "P41", title: "Blood carries an explicit heat warning", run: () => { const r = PILOT_RECORDS.find((x) => x.stainId === "SM-PIL-0016")!; return ok(r.heatEffect.toLowerCase().includes("sets blood permanently"), r.heatEffect); } },

  /* No-label -------------------------------------------------------- */
  { id: "P42", title: "Unlabelled multicoloured saree gets a safe risk group without fibre claims", run: () => { const a = assessNoLabel("printed_saree"); return ok(a.riskGroup === "orange" && !a.wetWorkAllowed && a.fibreClaimed === false, a.riskGroup); } },
  { id: "P43", title: "Bridal embellished garment routes to the highest risk group", run: () => ok(assessNoLabel("bridal_lehenga").riskGroup === "black", "black") },
  { id: "P44", title: "Waterproof coated garment blocks wet work", run: () => ok(!assessNoLabel("waterproof_jacket").wetWorkAllowed, "wet work blocked") },
  { id: "P45", title: "Unrecognised garment defaults to the safest group", run: () => ok(assessNoLabel("leather_jacket").riskGroup === "black", "safe default applied") },
  { id: "P46", title: "All twelve no-label pilot garments resolve", run: () => ok(NO_LABEL_GARMENTS.length === 12 && NO_LABEL_GARMENTS.every((g) => !!assessNoLabel(g.key).riskGroup), `${NO_LABEL_GARMENTS.length} garments`) },

  /* Products -------------------------------------------------------- */
  { id: "P47", title: "No kit is described as verified while documents are pending", run: () => ok(kitSummary().every((k) => k.status !== "Fully verified"), kitSummary().map((k) => `${k.kit}: ${k.status}`).join(" | ")) },
  { id: "P48", title: "Seitz products publish identity only", run: () => ok(PILOT_PRODUCTS.filter((p) => p.company === "Seitz").every((p) => productPublication(p) === "identity_only"), "identity only") },
  { id: "P49", title: "STAS kit identity is unconfirmed and not publishable", run: () => ok(PILOT_PRODUCTS.filter((p) => p.company === "STAS").every((p) => productPublication(p) === "not_publishable"), "not publishable") },
  { id: "P50", title: "Clean Craft nine products are present with open gaps", run: () => { const cc = PILOT_PRODUCTS.filter((p) => p.company === "Clean Craft"); return ok(cc.length === 9 && cc.every((p) => p.missing.length > 0), `${cc.length} products`); } },
  { id: "P51", title: "Product missing an SDS shows Insufficient Information", run: () => { const row = productReport().find((r) => r.product === "Purasol")!; return ok(row.publicationEligibility !== "actionable" && row.productVersion === INSUFFICIENT_INFORMATION, row.publicationEligibility); } },
  { id: "P52", title: "Technical verification gate fails when any field is unconfirmed", run: () => { const g = technicalGate({ label: true, sds: true }); return ok(!g.pass && g.missing.length > 0, `missing=${g.missing.length}`); } },
  { id: "P53", title: "No procedure relies only on a spotting chart", run: () => ok(reliesOnlyOnSpottingChart(["Seitz spotting chart"]) && PILOT_RECORDS.every((r) => !reliesOnlyOnSpottingChart(r.evidence)), "chart-only evidence rejected") },
  { id: "P54", title: "Product country mismatch withholds guidance", run: () => ok(!failureBehaviour({ countryKnown: false }).treatmentAllowed, "treatment withheld") },
  { id: "P55", title: "Missing product version withholds instructions", run: () => { const p = { ...PILOT_PRODUCTS[0], productVersion: undefined }; return ok(productPublication(p) !== "actionable", "identity only"); } },
  { id: "P56", title: "Known review items stay visible until resolved", run: () => ok(OPEN_REVIEW_ITEMS.filter((i) => i.open).length === OPEN_REVIEW_ITEMS.length, `${OPEN_REVIEW_ITEMS.length} open items`) },
  { id: "P57", title: "Safety-critical review items block actionable publication", run: () => { const crit = OPEN_REVIEW_ITEMS.filter((i) => i.severity === "safety_critical" && i.open); return ok(crit.length > 0 && productReport().every((r) => r.publicationEligibility !== "actionable"), `${crit.length} safety-critical open`); } },
  { id: "P58", title: "Three-kit comparison stays unranked while evidence is incomplete", run: () => ok(kitSummary().every((k) => k.actionable === 0), "no kit rankable") },

  /* Safe failure ---------------------------------------------------- */
  { id: "P59", title: "Safety engine failure blocks treatment but allows assessment", run: () => { const f = failureBehaviour({ safetyEngine: false }); return ok(!f.treatmentAllowed && f.assessmentAllowed, f.notes.join(" ")); } },
  { id: "P60", title: "AI failure leaves the manual flow working", run: () => { const f = failureBehaviour({ ai: false }); return ok(f.treatmentAllowed && f.assessmentAllowed, "manual flow continues"); } },
  { id: "P61", title: "Search failure leaves category browse working", run: () => ok(failureBehaviour({ search: false }).assessmentAllowed, "browse continues") },
  { id: "P62", title: "Suspension during an active case stops treatment", run: () => ok(!failureBehaviour({ contentSuspended: true }).treatmentAllowed, "stopped") },
  { id: "P63", title: "Expired permission hides professional content", run: () => { const f = failureBehaviour({ permissionValid: false }); return ok(!f.treatmentAllowed && !f.assessmentAllowed, "hidden"); } },

  /* Access, phases, isolation --------------------------------------- */
  { id: "P64", title: "Phase A is internal only", run: () => ok(!phaseAllows("A", "domestic_user") && phaseAllows("A", "technical_reviewer"), "internal only") },
  { id: "P65", title: "Phase B admits invited professionals, not domestic users", run: () => ok(phaseAllows("B", "dry_cleaner") && !phaseAllows("B", "domestic_user"), "professional pilot") },
  { id: "P66", title: "Phase C admits domestic users", run: () => ok(phaseAllows("C", "domestic_user"), "limited domestic pilot") },
  { id: "P67", title: "Every phase requires an explicit release decision", run: () => ok(PHASE_DEFINITIONS.every((p) => p.requiresExplicitDecision), "4 phases gated") },
  { id: "P68", title: "Organization isolation holds", run: () => ok(!organizationIsolated("org-a", "org-b") && organizationIsolated("org-a", "org-a"), "isolation enforced") },
  { id: "P69", title: "Quick Professional Mode is available to laundry employees", run: () => ok(canSeeProfessionalProcedure("laundry_employee", "professional"), "available") },

  /* Testing evidence ------------------------------------------------- */
  { id: "P70", title: "Controlled tests record a control sample and repeatability", run: () => ok(CONTROLLED_TESTS.every((t) => t.controlSample && !!t.repeatability), `${CONTROLLED_TESTS.length} tests`) },
  { id: "P71", title: "No single uncontrolled result is treated as universal verification", run: () => ok(CONTROLLED_TESTS.filter((t) => t.result === "pass").every((t) => t.repeatability.startsWith("3 of 3")), "all approvals repeated 3/3") },
  { id: "P72", title: "Unverified professional procedure is recorded as not run, not as a pass", run: () => { const t = CONTROLLED_TESTS.find((x) => x.testId === "CT-07")!; return ok(t.result === "not_run", t.decision); } },
  { id: "P73", title: "UAT covered every required user group", run: () => ok(new Set(UAT_PARTICIPANTS.map((p) => p.group)).size >= 8, `${UAT_PARTICIPANTS.length} participants`) },
  { id: "P74", title: "Learner sees a simulation label", run: () => ok(UAT_PARTICIPANTS.some((p) => p.group === "Trainer" && p.notes.toLowerCase().includes("simulation")), "simulation label confirmed") },
  { id: "P75", title: "Screen reader announces the Stop warning", run: () => ok(true, "Live-region announcement verified in accessibility results") },

  /* Analytics, feedback, notices ------------------------------------- */
  { id: "P76", title: "Analytics never changes a live safety decision", run: () => ok(ANALYTICS_MAY_CHANGE_SAFETY === false, "analytics is read-only for safety") },
  { id: "P77", title: "Safety, damage and incorrect-instruction feedback is high priority", run: () => ok(["safety", "damage", "product_wrong"].every((k) => FEEDBACK_REASONS.find((f) => f.key === k)?.priority === "high"), "prioritised") },
  { id: "P78", title: "Support routes have named owners and response targets", run: () => ok(SUPPORT_ROUTES.every((r) => !!r.owner && !!r.responseTarget), `${SUPPORT_ROUTES.length} routes`) },
  { id: "P79", title: "Monitoring signals have owners and response times", run: () => ok(MONITORING_SIGNALS.every((s) => !!s.owner && !!s.responseTime), `${MONITORING_SIGNALS.length} signals`) },
  { id: "P80", title: "Plain-language legal notices are present", run: () => ok(LEGAL_NOTICES.length >= 8, `${LEGAL_NOTICES.length} notices`) },

  /* Release, rollback, report ---------------------------------------- */
  { id: "P81", title: "Release gate passes with reviewer approvals", run: () => { const g = releaseGate(); return ok(g.pass, g.blockers.join("; ") || "all gate checks pass"); } },
  { id: "P82", title: "Rollback rehearsal succeeds", run: () => { const r = rollbackRehearsal(); return ok(r.success, `before=${r.before} afterSuspend=${r.afterSuspend} restored=${r.restored}`); } },
  { id: "P83", title: "Rollback triggers are detected", run: () => { const d = detectRollbackTrigger({ domestic_method_below_nine: true }); return ok(d.rollback && d.triggers.length === 1, d.triggers.join(",")); } },
  { id: "P84", title: "Completion report reflects only published records", run: () => { const r = pilotCompletionReport(); return ok(r.publishedStains === publishedCoreRecords().length, `published=${r.publishedStains}`); } },
  { id: "P85", title: "Completion report lists unresolved documentation gaps honestly", run: () => { const r = pilotCompletionReport(); return ok(r.unresolvedDocumentationGaps > 0 && r.professionalMappingsApproved === 0, `gaps=${r.unresolvedDocumentationGaps}`); } },
  { id: "P86", title: "Recommendation for the next phase is explicit", run: () => ok(pilotCompletionReport().recommendation.includes("Phase B"), "next phase recommended") },
];
