import { describe, expect, it } from "vitest";
import { canAccessAdmin, hasPermission, permissionsForRoles } from "@/lib/permissions";
import {
  applySafetyToAiSuggestions,
  canShowDomesticTreatment,
  evaluateGate,
  isPublishable,
  missingPublicationFields,
  professionalInstruction,
} from "@/lib/contentGate";
import { classifyBundled, classifyFromDatabase, isDisplayableAsGuidance } from "@/lib/dataSource";
import { DOMESTIC_MIN_CONFIDENCE } from "@/lib/constitution";

/** Regression suite for the production-hardening rules. */

describe("role permissions (least privilege)", () => {
  it("gives no administration access to end-user roles", () => {
    for (const role of ["domestic_user", "learner", "dry_cleaner", "laundry_employee", "trainer"]) {
      expect(canAccessAdmin([role])).toBe(false);
    }
  });

  it("gives no role except owner every permission", () => {
    expect(permissionsForRoles(["owner"]).length).toBeGreaterThan(permissionsForRoles(["administrator"]).length);
  });

  it("never lets a content editor publish", () => {
    expect(hasPermission(["content_editor"], "content.draft.edit")).toBe(true);
    expect(hasPermission(["content_editor"], "content.publish")).toBe(false);
    expect(hasPermission(["content_editor"], "content.technical.approve")).toBe(false);
  });

  it("never lets a technical reviewer manage users or publish alone", () => {
    expect(hasPermission(["technical_reviewer"], "admin.users.manage")).toBe(false);
    expect(hasPermission(["technical_reviewer"], "content.publish")).toBe(false);
  });

  it("gives an auditor read access only", () => {
    expect(permissionsForRoles(["auditor"]).sort()).toEqual(["admin.access", "admin.audit.read"]);
  });

  it("ignores unknown or forged role strings", () => {
    expect(canAccessAdmin(["superuser", "root", "ADMIN"])).toBe(false);
    expect(permissionsForRoles([])).toEqual([]);
  });
});

describe("content gate fails closed", () => {
  const complete = {
    fabricKnown: true,
    fabricLabelPresent: true,
    colourfastnessKnown: true,
    existingDamage: false,
    activeColourBleeding: false,
    unknownPreviousChemical: false,
    safetyEvaluationAvailable: true,
  };

  it("shows guidance only when everything is confirmed", () => {
    expect(evaluateGate(complete).outcome).toBe("show");
  });

  it("blocks when the safety check cannot run", () => {
    const d = evaluateGate({ ...complete, safetyEvaluationAvailable: false });
    expect(d.outcome).toBe("safety_check_unavailable");
    expect(d.overridable).toBe(false);
  });

  it("blocks existing damage, active bleeding and unknown chemistry", () => {
    expect(evaluateGate({ ...complete, existingDamage: true }).outcome).toBe("blocked");
    expect(evaluateGate({ ...complete, activeColourBleeding: true }).outcome).toBe("blocked");
    expect(evaluateGate({ ...complete, unknownPreviousChemical: true }).outcome).toBe("blocked");
  });

  it("requires a hidden-area test whenever fabric or colour is unconfirmed", () => {
    for (const key of ["fabricKnown", "fabricLabelPresent", "colourfastnessKnown"] as const) {
      const d = evaluateGate({ ...complete, [key]: false });
      expect(d.outcome).toBe("hidden_area_test_required");
      expect(d.hiddenAreaTestRequired).toBe(true);
    }
  });

  it("defaults to the cautious path when no facts are supplied", () => {
    expect(evaluateGate({}).outcome).not.toBe("show");
  });

  it("uses plain language with no internal terminology", () => {
    const messages = [
      evaluateGate({ ...complete, existingDamage: true }).message,
      evaluateGate({ ...complete, safetyEvaluationAvailable: false }).message,
      evaluateGate({}).message,
    ];
    for (const m of messages) {
      expect(m.length).toBeGreaterThan(20);
      expect(m.toLowerCase()).not.toMatch(/rls|supabase|json|null|undefined|table|api|engine|token/);
    }
  });
});

describe("domestic visibility and publication completeness", () => {
  it("hides domestic treatment below the confidence threshold", () => {
    expect(canShowDomesticTreatment({ confidence: DOMESTIC_MIN_CONFIDENCE - 1, status: "published" })).toBe(false);
    expect(canShowDomesticTreatment({ confidence: DOMESTIC_MIN_CONFIDENCE, status: "published" })).toBe(true);
  });

  it("hides domestic treatment that is not approved", () => {
    expect(canShowDomesticTreatment({ confidence: 10, status: "draft" })).toBe(false);
    expect(canShowDomesticTreatment({ confidence: 10, status: null })).toBe(false);
    expect(canShowDomesticTreatment({})).toBe(false);
  });

  it("refuses to publish records with missing required fields", () => {
    expect(isPublishable({})).toBe(false);
    expect(missingPublicationFields({}).length).toBeGreaterThan(0);
  });
});

describe("data classification", () => {
  it("never treats bundled records as production", () => {
    expect(classifyBundled({ x: 1 }).classification).toBe("demonstration");
    expect(isDisplayableAsGuidance(classifyBundled({ x: 1 }))).toBe(false);
  });

  it("treats unapproved database rows as provisional", () => {
    expect(classifyFromDatabase({ x: 1 }, { approval_status: "draft" }).classification).toBe("provisional");
    expect(classifyFromDatabase({ x: 1 }, { approval_status: "published" }).classification).toBe("production");
  });

  it("falls back to the label instruction rather than inventing chemistry", () => {
    expect(professionalInstruction(null)).toMatch(/label|manufacturer/i);
    expect(professionalInstruction(classifyBundled({ text: "Use 50 ml of solvent" }))).toMatch(/label|manufacturer/i);
  });
});

describe("AI suggestions stay advisory", () => {
  it("returns at most three suggestions and no actionable steps when blocked", () => {
    const out = applySafetyToAiSuggestions(
      [1, 2, 3, 4, 5].map((n) => ({ name: `s${n}`, confidence: 50, why: "" })),
      { existingDamage: true, safetyEvaluationAvailable: true },
    );
    expect(out.suggestions).toHaveLength(3);
    expect(out.actionableGuidanceAllowed).toBe(false);
  });

  it("blocks actionable guidance when the safety check is unavailable", () => {
    const out = applySafetyToAiSuggestions([{ name: "a", confidence: 90, why: "" }], {
      safetyEvaluationAvailable: false,
    });
    expect(out.actionableGuidanceAllowed).toBe(false);
  });
});
