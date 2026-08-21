/**
 * RECOVERY STEP 1 — role matrix tests.
 *
 * Verifies both sides of the permission contract:
 *  1. the frontend permission map (pure functions), and
 *  2. the database permission helpers, RLS policies and bootstrap function,
 *     read from the live catalogues through psql.
 *
 * Database assertions are skipped automatically when no database connection is
 * configured (PGHOST unset), so the suite stays runnable in any environment.
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

function functionBody(name: string): string {
  return sql(
    `select pg_get_functiondef(p.oid) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname='public' and p.proname='${name}'`,
  );
}

function rolesInFunction(name: string): string[] {
  const body = functionBody(name);
  const list = body.match(/ARRAY\[([^\]]+)\]::app_role\[\]/);
  if (!list) return [];
  return [...list[1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort();
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

describe("database permission contract", () => {
  dbIt("is_product_maintainer covers exactly the five maintainer roles", () => {
    expect(rolesInFunction("is_product_maintainer")).toEqual(
      ["administrator", "content_admin", "content_editor", "owner", "technical_reviewer"],
    );
  });

  dbIt("can_technical_approve covers exactly owner and technical reviewer", () => {
    expect(rolesInFunction("can_technical_approve")).toEqual(["owner", "technical_reviewer"]);
  });

  dbIt("can_publish_content covers exactly owner, administrator and content administrator", () => {
    expect(rolesInFunction("can_publish_content")).toEqual(["administrator", "content_admin", "owner"]);
  });

  dbIt("is_platform_admin covers exactly owner, administrator and system administrator", () => {
    expect(rolesInFunction("is_platform_admin")).toEqual(["administrator", "owner", "system_admin"]);
  });

  dbIt("can_read_professional_guidance covers exactly the four professional roles", () => {
    expect(rolesInFunction("can_read_professional_guidance")).toEqual(
      ["dry_cleaner", "laundry_employee", "professional_spotter", "trainer"],
    );
  });

  dbIt("can_read_product_audit covers exactly the governance roles", () => {
    expect(rolesInFunction("can_read_product_audit")).toEqual(
      ["administrator", "auditor", "owner", "technical_reviewer"],
    );
  });

  const PRODUCT_TABLES = [
    "companies", "product_kits", "professional_products", "kit_products", "product_versions",
    "source_documents", "product_source_documents", "product_manufacturer_claims",
    "product_safety_data", "product_instructions", "product_guidance_mappings",
    "product_audit_log", "import_batches", "import_staging_rows",
  ];

  dbIt("every product-domain table has row-level security enabled", () => {
    const off = sql(
      `select string_agg(relname, ',') from pg_class
       where relname in (${PRODUCT_TABLES.map((t) => `'${t}'`).join(",")}) and not relrowsecurity`,
    );
    expect(off).toBe("");
  });

  dbIt("no product-domain policy is granted to anonymous users", () => {
    const bad = sql(
      `select coalesce(string_agg(distinct tablename || ':' || policyname, ','), '') from pg_policies
       where schemaname='public' and tablename in (${PRODUCT_TABLES.map((t) => `'${t}'`).join(",")})
         and 'anon' = any(roles)`,
    );
    expect(bad).toBe("");
  });

  dbIt("anonymous users hold no privileges on product-domain tables", () => {
    const bad = sql(
      `select coalesce(string_agg(distinct table_name, ','), '') from information_schema.role_table_grants
       where grantee='anon' and table_schema='public'
         and table_name in (${PRODUCT_TABLES.map((t) => `'${t}'`).join(",")})`,
    );
    expect(bad).toBe("");
  });

  dbIt("draft product-domain writes are restricted to product maintainers", () => {
    for (const table of PRODUCT_TABLES) {
      const writes = sql(
        `select coalesce(string_agg(policyname || '|' || cmd || '|' || coalesce(with_check, qual, ''), ' ;; '), '')
         from pg_policies where schemaname='public' and tablename='${table}' and cmd <> 'SELECT'`,
      );
      expect(writes, `${table} write policies`).toMatch(/is_product_maintainer/);
      expect(writes, `${table} must not use the old helper`).not.toMatch(/is_content_maintainer/);
    }
  });

  dbIt("professional read policies never expose drafts or provisional records", () => {
    const rows = sql(
      `select coalesce(string_agg(tablename || '|' || policyname, ','), '') from pg_policies
       where schemaname='public' and cmd='SELECT'
         and tablename in ('professional_products','product_versions','product_guidance_mappings')
         and qual like '%can_read_professional_guidance%'
         and qual not like '%approved%'`,
    );
    expect(rows).toBe("");
  });

  dbIt("product audit history is readable only by governance roles", () => {
    const q = sql(
      `select coalesce(string_agg(qual, ' '), '') from pg_policies
       where schemaname='public' and tablename='product_audit_log' and cmd='SELECT'`,
    );
    expect(q).toMatch(/can_read_product_audit/);
  });

  /* ------------------------------------------- first-owner bootstrap */

  dbIt("the bootstrap function exists, is SECURITY DEFINER and has a fixed search path", () => {
    const def = functionBody("bootstrap_first_owner");
    expect(def).toMatch(/SECURITY DEFINER/);
    expect(def).toMatch(/SET search_path TO 'public'|SET search_path = public/);
  });

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

  dbIt("the bootstrap rejects an unknown user, an empty reason and a second attempt", () => {
    const def = functionBody("bootstrap_first_owner");
    expect(def).toMatch(/FROM auth\.users/);
    expect(def).toMatch(/No account exists for that identifier/);
    expect(def).toMatch(/A written reason is required/);
    expect(def).toMatch(/can only run once/);
    expect(def).toMatch(/security_audit_log/);
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
      source_documents: 17,
      product_source_documents: 14,
      pending_reroutes: 4,
      guidance_mappings: 0,
    });
  });

  dbIt("nothing has been approved, verified or published by this step", () => {
    expect(sql("select count(*) from public.product_versions where approval_status in ('approved','published')")).toBe("0");
    expect(sql("select count(*) from public.product_guidance_mappings where approval_status in ('approved','published')")).toBe("0");
  });
});
