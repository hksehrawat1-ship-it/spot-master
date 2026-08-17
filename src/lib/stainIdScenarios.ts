/**
 * Step 3 — required test scenarios for the identification engine.
 * Run from /admin/stain-id.
 */
import type { GateStatus, RiskLevel } from "@/lib/fabricSafety";
import { emptyIdAnswers, evaluateIdentification, type IdAnswers, type IdOutcome } from "@/lib/stainId";

export type IdScenario = {
  name: string;
  answers: Partial<IdAnswers>;
  context: { riskBefore: RiskLevel; gateBefore: GateStatus };
  expect: {
    outcome: IdOutcome;
    maxCandidates?: number;
    minConfidence?: number;
    maxConfidence?: number;
    riskAfter?: RiskLevel;
    documentationOnly?: boolean;
  };
};

const green = { riskBefore: "green" as RiskLevel, gateBefore: "proceed" as GateStatus };
const amber = { riskBefore: "amber" as RiskLevel, gateBefore: "proceed_with_testing" as GateStatus };
const red = { riskBefore: "red" as RiskLevel, gateBefore: "professional_only" as GateStatus };
const black = { riskBefore: "black" as RiskLevel, gateBefore: "blocked_pending_identification" as GateStatus };

export const ID_SCENARIOS: IdScenario[] = [
  {
    name: "User directly witnessed a coffee spill",
    context: green,
    answers: { entryRoute: "search", selectedStainId: "coffee", sourceKnown: "yes", age: "Just happened", colours: ["Brown"], textures: ["Wet"], locations: ["Chest or front"], previousTreatment: ["Nothing"], hazards: ["None of these"], damage: ["No visible damage"] },
    expect: { outcome: "identified", minConfidence: 8, riskAfter: "green" },
  },
  {
    name: "Photograph only of a brown mark",
    context: green,
    answers: { entryRoute: "photo", sourceKnown: "no", photos: [{ kind: "close_up", dataUrl: "x", capturedAt: 0 }], aiSuggestions: [{ label: "Coffee", stainId: "coffee", note: "may be", confidence: 5, modelVersion: "v1" }] },
    expect: { outcome: "possibilities", maxConfidence: 5, riskAfter: "green" },
  },
  {
    name: "Unknown oily mark on a dark garment",
    context: amber,
    answers: { entryRoute: "unknown", sourceKnown: "no", colours: ["Not sure"], textures: ["Oily", "Greasy"], locations: ["Chest or front"], age: "Not known", hazards: ["Not sure"], damage: ["No visible damage"] },
    expect: { outcome: "possibilities", maxConfidence: 6, riskAfter: "amber" },
  },
  {
    name: "Turmeric curry stain with oil",
    context: green,
    answers: { entryRoute: "search", selectedStainId: "curry", sourceKnown: "yes", colours: ["Yellow", "Orange"], textures: ["Oily"], locations: ["Chest or front"], age: "Today", previousTreatment: ["Nothing"], hazards: ["None of these"], damage: ["No visible damage"] },
    expect: { outcome: "identified", minConfidence: 8 },
  },
  {
    name: "Lipstick as a combination stain",
    context: green,
    answers: { entryRoute: "source", selectedSource: "cosmetics", selectedStainId: "lipstick", sourceKnown: "yes", colours: ["Red"], textures: ["Waxy"], locations: ["Collar"], age: "Today", previousTreatment: ["Nothing"], hazards: ["None of these"], damage: ["No visible damage"] },
    expect: { outcome: "identified", minConfidence: 8 },
  },
  {
    name: "Blood reported by source",
    context: green,
    answers: { entryRoute: "search", selectedStainId: "blood", sourceKnown: "yes", colours: ["Red"], textures: ["Wet"], locations: ["Sleeve"], age: "Just happened", previousTreatment: ["Nothing"], hazards: ["Human blood or bodily fluid"], damage: ["No visible damage"] },
    expect: { outcome: "identified", riskAfter: "amber" },
  },
  {
    name: "Old heat-treated protein-like stain",
    context: amber,
    answers: { entryRoute: "search", selectedStainId: "milk", sourceKnown: "idea", age: "Old stain", colours: ["Yellow"], textures: ["Crusty"], locations: ["Chest or front"], previousTreatment: ["Washed", "Ironed"], hazards: ["None of these"], damage: ["No visible damage"] },
    expect: { outcome: "possibilities", maxConfidence: 6 },
  },
  {
    name: "Dye transfer between garments",
    context: green,
    answers: { entryRoute: "search", selectedStainId: "colour_transfer", sourceKnown: "yes", colours: ["Blue"], textures: ["No texture"], shapes: ["Transfer from another fabric"], locations: ["Multiple areas"], age: "Today", previousTreatment: ["Washed"], hazards: ["None of these"], damage: ["No visible damage"] },
    expect: { outcome: "identified", maxConfidence: 8 },
  },
  {
    name: "Bleach spot mistaken for a stain",
    context: green,
    answers: { entryRoute: "unknown", sourceKnown: "no", colours: ["White"], textures: ["Bleached or lighter than the fabric"], locations: ["Chest or front"], damage: ["Lighter colour"], hazards: ["None of these"] },
    expect: { outcome: "possible_damage", maxConfidence: 4, riskAfter: "amber" },
  },
  {
    name: "Scorch mark mistaken for a stain",
    context: green,
    answers: { entryRoute: "search", selectedStainId: "scorch", sourceKnown: "idea", colours: ["Brown"], textures: ["Shiny"], damage: ["Melted or shiny"], locations: ["Cuff"], hazards: ["None of these"] },
    expect: { outcome: "possible_damage", riskAfter: "red", documentationOnly: true },
  },
  {
    name: "Rust-coloured mark with unknown source",
    context: green,
    answers: { entryRoute: "unknown", sourceKnown: "no", colours: ["Orange"], textures: ["Crusty"], locations: ["Hem"], age: "Not known", hazards: ["None of these"], damage: ["No visible damage"] },
    expect: { outcome: "possibilities", maxConfidence: 6 },
  },
  {
    name: "Mould-like growth",
    context: amber,
    answers: { entryRoute: "search", selectedStainId: "mould", sourceKnown: "idea", colours: ["Black", "Green"], textures: ["Powdery"], odour: "Musty", locations: ["Lining"], age: "Old stain", hazards: ["Mould growth"], damage: ["No visible damage"] },
    expect: { outcome: "identified", riskAfter: "amber" },
  },
  {
    name: "Unknown industrial chemical",
    context: green,
    answers: { entryRoute: "unknown", sourceKnown: "no", hazards: ["Unknown industrial chemical"], colours: ["Not sure"], textures: ["Not sure"] },
    expect: { outcome: "hazard_stop", riskAfter: "black", documentationOnly: true, maxConfidence: 3 },
  },
  {
    name: "Stain crossing multiple colours",
    context: amber,
    answers: { entryRoute: "unknown", sourceKnown: "no", colours: ["Multiple colours"], textures: ["No texture"], locations: ["Multiple areas"], hazards: ["None of these"], damage: ["No visible damage"] },
    expect: { outcome: "possibilities", maxConfidence: 6 },
  },
  {
    name: "No photograph available, questionnaire only",
    context: green,
    answers: { entryRoute: "search", selectedStainId: "tea", sourceKnown: "yes", colours: ["Brown"], textures: ["Wet"], locations: ["Chest or front"], age: "Today", previousTreatment: ["Nothing"], hazards: ["None of these"], damage: ["No visible damage"] },
    expect: { outcome: "identified", minConfidence: 8 },
  },
  {
    name: "AI service unavailable",
    context: green,
    answers: { entryRoute: "photo", aiUnavailable: true, sourceKnown: "idea", selectedStainId: "mud", colours: ["Brown"], textures: ["Mud-like"], locations: ["Hem"], age: "Today", hazards: ["None of these"], damage: ["No visible damage"] },
    expect: { outcome: "identified", minConfidence: 6 },
  },
  {
    name: "Black-risk garment entering Step 3",
    context: black,
    answers: { entryRoute: "search", selectedStainId: "tea", sourceKnown: "yes", colours: ["Brown"], textures: ["Wet"], locations: ["Chest or front"], age: "Today", hazards: ["None of these"], damage: ["No visible damage"] },
    expect: { outcome: "identified", riskAfter: "black", documentationOnly: true },
  },
  {
    name: "Red-risk bridal garment with known food stain",
    context: red,
    answers: { entryRoute: "search", selectedStainId: "curry", sourceKnown: "yes", colours: ["Yellow"], textures: ["Oily"], locations: ["Chest or front"], age: "Today", hazards: ["None of these"], damage: ["No visible damage"] },
    expect: { outcome: "identified", riskAfter: "red" },
  },
];

export type ScenarioRun = {
  name: string;
  pass: boolean;
  actual: { outcome: IdOutcome; confidence: number; candidates: number; riskAfter: RiskLevel; documentationOnly: boolean };
  expected: IdScenario["expect"];
};

export function runIdScenarios(): ScenarioRun[] {
  return ID_SCENARIOS.map((s) => {
    const answers: IdAnswers = { ...emptyIdAnswers(), ...s.answers };
    const r = evaluateIdentification(answers, s.context);
    const pass =
      r.outcome === s.expect.outcome &&
      r.candidates.length <= (s.expect.maxCandidates ?? 3) &&
      (s.expect.minConfidence === undefined || r.confidence >= s.expect.minConfidence) &&
      (s.expect.maxConfidence === undefined || r.confidence <= s.expect.maxConfidence) &&
      (s.expect.riskAfter === undefined || r.riskAfter === s.expect.riskAfter) &&
      (s.expect.documentationOnly === undefined || r.documentationOnly === s.expect.documentationOnly);
    return {
      name: s.name,
      pass,
      actual: { outcome: r.outcome, confidence: r.confidence, candidates: r.candidates.length, riskAfter: r.riskAfter, documentationOnly: r.documentationOnly },
      expected: s.expect,
    };
  });
}
