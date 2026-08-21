/**
 * RECOVERY STEP 1 — role matrix tests.
 *
 * Verifies both sides of the permission contract:
 *  1. the frontend permission map (pure functions), and
 *  2. the outcome of the real database authorization suite
 *     (`supabase/tests/authorization.test.sql`), which exercises the live
 *     functions and row-level security policies as real temporary identities
 *     and rolls every test record back.
 *
 * When no database connection is configured (PGHOST unset) the database part
 * is reported as an explicit outstanding item, never as a silent pass.
 */

import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import {
  APP_ROLES,
  type AppRole,
  canEditProductDrafts,
  canPublishContent,
  canReadProductAudit,
  canReadProfessionalGuidance,
  canTechnicalApprove,
  hasPermission,
  isPlatformAdmin,
} from "@/lib/permissions";
import { accessForRoles } from "@/auth/useAccess";

/* ---------------------------------------------------------------- helpers */

const hasDb = !!process.env.PGHOST;
const dbIt = hasDb ? it : it.skip;

function sql(query: string): string {
  return execFileSync("psql", ["-t", "-A", "-c", query], { encoding: "utf8" }).trim();
}

/* ------------------------------------------------------- expected matrix */

const EXPECTED: Record<
  AppRole,
  {
    productDrafts: boolean;
    technicalApprove: boolean;
    publish: boolean;
    platformAdmin: boolean;
    professionalGuidance: boolean;
    productAudit: boolean;
  }
> = {
  owner: { productDrafts: true, technicalApprove: true, publish: true, platformAdmin: true, professionalGuidance: true, productAudit: true },
  administrator: { productDrafts: true, technicalApprove: false, publish: true, platformAdmin: true, professionalGuidance: true, productAudit: true },
  system_admin: { productDrafts: false, technicalApprove: false, publish: false, platformAdmin: true, professionalGuidance: false, productAudit: false },
  technical_reviewer: { productDrafts: true, technicalApprove: true, publish: false, platformAdmin: false, professionalGuidance: true, productAudit: true },
  content_admin: { productDrafts: true, technicalApprove: false, publish: true, platformAdmin: false, professionalGuidance: true, productAudit: false },
  content_editor: { productDrafts: true, technicalApprove: false, publish: false, platformAdmin: false, professionalGuidance: true, productAudit: false },
  translator: { productDrafts: false, technicalApprove: false, publish: false, platformAdmin: false, professionalGuidance: false, productAudit: false },
  auditor: { productDrafts: false, technicalApprove: false, publish: false, platformAdmin: false, professionalGuidance: false, productAudit: true },
  support: { productDrafts: false, technicalApprove: false, publish: false, platformAdmin: false, professionalGuidance: false, productAudit: false },
  professional_spotter: { productDrafts: false, technicalApprove: false, publish: false, platformAdmin: false, professionalGuidance: true, productAudit: false },
  dry_cleaner: { productDrafts: false, technicalApprove: false, publish: false, platformAdmin: false, professionalGuidance: true, productAudit: false },
  laundry_employee: { productDrafts: false, technicalApprove: false, publish: false, platformAdmin: false, professionalGuidance: true, productAudit: false },
  trainer: { productDrafts: false, technicalApprove: false, publish: false, platformAdmin: false, professionalGuidance: true, productAudit: false },
  learner: { productDrafts: false, technicalApprove: false, publish: false, platformAdmin: false, professionalGuidance: false, productAudit: false },
  domestic_user: { productDrafts: false, technicalApprove: false, publish: false, platformAdmin: false, professionalGuidance: false, productAudit: false },
};

/* ------------------------------------------------------------- frontend */

describe("frontend role matrix", () => {
  for (const role of APP_ROLES) {
    const want = EXPECTED[role];
    it(`${role} resolves the expected capabilities`, () => {
      const roles = [role];
      expect(canEditProductDrafts(roles)).toBe(want.productDrafts);
      expect(canTechnicalApprove(roles)).toBe(want.technicalApprove);
      expect(canPublishContent(roles)).toBe(want.publish);
      expect(isPlatformAdmin(roles)).toBe(want.platformAdmin);
      expect(canReadProfessionalGuidance(roles)).toBe(want.professionalGuidance);
      expect(canReadProductAudit(roles)).toBe(want.productAudit);
    });

    it(`${role} access contract matches the helper results`, () => {
      const a = accessForRoles([role]);
      expect(a).toMatchObject({ ...want, unverified: false });
    });
  }

  it("signed-out users receive nothing", () => {
    const a = accessForRoles([]);
    expect(Object.values(a).every((v) => v === false)).toBe(true);
  });

  it("unverified roles fail closed", () => {
    const a = accessForRoles(["owner"], true);
    expect(a.productDrafts).toBe(false);
    expect(a.publish).toBe(false);
    expect(a.platformAdmin).toBe(false);
    expect(a.unverified).toBe(true);
  });

  it("a content editor may edit drafts but never approve or publish", () => {
    expect(canEditProductDrafts(["content_editor"])).toBe(true);
    expect(canTechnicalApprove(["content_editor"])).toBe(false);
    expect(canPublishContent(["content_editor"])).toBe(false);
  });

  it("a technical reviewer may approve but never publish", () => {
    expect(canTechnicalApprove(["technical_reviewer"])).toBe(true);
    expect(canPublishContent(["technical_reviewer"])).toBe(false);
  });

  it("a system administrator cannot edit chemistry content without a second role", () => {
    expect(canEditProductDrafts(["system_admin"])).toBe(false);
    expect(canEditProductDrafts(["system_admin", "content_editor"])).toBe(true);
  });

  it("basic users receive no draft or professional access", () => {
    for (const role of ["domestic_user", "learner"]) {
      expect(canEditProductDrafts([role])).toBe(false);
      expect(canReadProfessionalGuidance([role])).toBe(false);
      expect(hasPermission([role], "admin.access")).toBe(false);
    }
  });

  it("professional users get approved guidance only, never drafts or administration", () => {
    for (const role of ["professional_spotter", "dry_cleaner", "laundry_employee", "trainer"]) {
      expect(canReadProfessionalGuidance([role])).toBe(true);
      expect(canEditProductDrafts([role])).toBe(false);
      expect(hasPermission([role], "admin.access")).toBe(false);
      expect(hasPermission([role], "admin.audit.read")).toBe(false);
    }
  });

  it("an auditor is read-only", () => {
    expect(hasPermission(["auditor"], "admin.audit.read")).toBe(true);
    expect(canEditProductDrafts(["auditor"])).toBe(false);
    expect(canPublishContent(["auditor"])).toBe(false);
    expect(canTechnicalApprove(["auditor"])).toBe(false);
  });
});

/* ------------------------------------------------------------- database */

/**
 * The authorization behaviour itself is proven by a real integration suite that
 * runs inside the database: `supabase/tests/authorization.test.sql`. It creates
 * temporary accounts, temporary roles and temporary product records, exercises
 * the real functions and the real row-level security policies as each role,
 * then rolls everything back and records only a pass/fail summary in
 * `public.authorization_test_runs`.
 *
 * These tests read that recorded run. They never inspect function source text.
 */

describe("database authorization suite", () => {
  if (!hasDb) {
    it.todo(
      "DATABASE AUTHORIZATION SUITE NOT EXECUTED HERE — run supabase/tests/authorization.test.sql " +
        "against the database and re-check public.authorization_test_runs",
    );
  }

  /** The role-contract run stores a bare array of results (no suite label). */
  const LATEST_AUTHZ =
    `(select id from public.authorization_test_runs where jsonb_typeof(results) = 'array' order by run_at desc limit 1)`;

  dbIt("the recorded authorization run completed without aborting", () => {
    const aborted = sql(
      `select coalesce(aborted_with, '') from public.authorization_test_runs where id = ${LATEST_AUTHZ}`,
    );
    expect(aborted).toBe("");
  });

  dbIt("every authorization test passed", () => {
    const row = sql(
      `select total || '|' || passed || '|' || failed from public.authorization_test_runs where id = ${LATEST_AUTHZ}`,
    );
    const [total, passed, failed] = row.split("|").map(Number);
    expect(failed).toBe(0);
    expect(passed).toBe(total);
    expect(total).toBeGreaterThanOrEqual(80);
  });

  dbIt("the recorded run covers approval, publication, professional reads and bootstrap", () => {
    const names = sql(
      `select string_agg(e->>'test', ' ') from public.authorization_test_runs,
        lateral jsonb_array_elements(results) e
       where id = ${LATEST_AUTHZ}`,
    );
    expect(names).toMatch(/technical reviewer cannot publish/);
    expect(names).toMatch(/administrator cannot technically approve/);
    expect(names).toMatch(/administrator publishes an approved version/);
    expect(names).toMatch(/cannot read an approved but unverified version/);
    expect(names).toMatch(/a second bootstrap attempt is rejected/);
    expect(names).toMatch(/advisory lock/);
  });

  /* ------------------------------------------------ Seitz pilot suite */

  const LATEST_PILOT =
    `(select id from public.authorization_test_runs where results->>'suite' = 'SEITZ-PILOT' order by run_at desc limit 1)`;

  dbIt("the Seitz pilot acceptance run completed and passed", () => {
    const row = sql(
      `select coalesce(aborted_with,'') || '|' || total || '|' || passed || '|' || failed
         from public.authorization_test_runs where id = ${LATEST_PILOT}`,
    );
    const [aborted, total, passed, failed] = row.split("|");
    expect(aborted).toBe("");
    expect(Number(failed)).toBe(0);
    expect(Number(passed)).toBe(Number(total));
    expect(Number(total)).toBeGreaterThanOrEqual(70);
  });

  dbIt("the Seitz pilot run covers identity, safety, roles and rollback", () => {
    const names = sql(
      `select string_agg(e->>'test', ' ') from public.authorization_test_runs,
        lateral jsonb_array_elements(results->'tests') e
       where id = ${LATEST_PILOT}`,
    );
    expect(names).toMatch(/826 stain records unchanged/);
    expect(names).toMatch(/no duplicates/);
    expect(names).toMatch(/hard-stop in hydrocarbon or silicone machines/);
    expect(names).toMatch(/cannot see the provisional pilot mapping/);
    expect(names).toMatch(/publisher cannot bypass technical approval/);
    expect(names).toMatch(/creates no second source document/);
  });


  /* ------------------------------------------- real privilege checks */

  dbIt("the bootstrap function is unavailable to anonymous and signed-in users", () => {
    const acl = sql(
      `select coalesce(array_to_string(proacl, ','), 'default') from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       where n.nspname='public' and p.proname='bootstrap_first_owner'`,
    );
    expect(acl).not.toMatch(/(^|,)anon=/);
    expect(acl).not.toMatch(/(^|,)authenticated=/);
    expect(acl).not.toMatch(/(^|,)=X/); // no PUBLIC execute
    expect(acl).toMatch(/service_role=X/);
  });

  dbIt("privileged roles are not self-assignable from the application", () => {
    const grants = sql(
      `select coalesce(string_agg(privilege_type, ','), '') from information_schema.role_table_grants
       where table_schema='public' and table_name='user_roles' and grantee in ('anon','authenticated')`,
    );
    expect(grants).not.toMatch(/INSERT|UPDATE|DELETE/);
  });

  dbIt("no real user has been granted a role by this recovery step", () => {
    expect(sql("select count(*) from public.user_roles")).toBe("0");
    expect(sql("select count(*) from public.security_audit_log")).toBe("0");
  });

  /* ------------------------------------------------- baseline counts */

  dbIt("the verified data baseline is unchanged", () => {
    const counts = Object.fromEntries(
      sql(`select 'stain_records', count(*) from public.stain_records
           union all select 'stain_categories', count(*) from public.stain_categories where category_number is not null
           union all select 'companies', count(*) from public.companies
           union all select 'product_kits', count(*) from public.product_kits
           union all select 'professional_products', count(*) from public.professional_products
           union all select 'kit_products', count(*) from public.kit_products
           union all select 'product_versions', count(*) from public.product_versions
           union all select 'source_documents', count(*) from public.source_documents
           union all select 'product_source_documents', count(*) from public.product_source_documents
           union all select 'pending_reroutes', count(*) from public.stain_record_reroutes where review_status = 'suggested'
           union all select 'guidance_mappings', count(*) from public.product_guidance_mappings`)
        .split("\n")
        .map((line) => {
          const [k, v] = line.split("|");
          return [k.trim(), Number(v)];
        }),
    );
    expect(counts).toEqual({
      stain_records: 826,
      stain_categories: 12,
      companies: 3,
      product_kits: 5,
      professional_products: 32,
      kit_products: 32,
      product_versions: 32,
      source_documents: 18, // +1 Seitz manufacturer brochure (controlled pilot)
      product_source_documents: 21, // +7 brochure links (controlled pilot)
      pending_reroutes: 4,
      guidance_mappings: 1, // the single provisional Purasol pilot mapping
    });
  });

  dbIt("no test record survived the authorization run", () => {
    expect(sql("select count(*) from public.product_kits where kit_name like 'ZZTEST%'")).toBe("0");
    expect(sql("select count(*) from public.companies where company_name like 'ZZTEST%'")).toBe("0");
  });

  dbIt("nothing has been approved, verified or published by this step", () => {
    expect(sql("select count(*) from public.product_versions where approval_status in ('approved','published')")).toBe("0");
    expect(sql("select count(*) from public.product_guidance_mappings where approval_status in ('approved','published')")).toBe("0");
  });
});
