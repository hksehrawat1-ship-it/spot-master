-- ============================================================
-- STAIN MASTER RECOVERY STEP 1 — role contract & RLS repair
-- Additive / non-destructive: no data rows are touched.
-- ============================================================

-- ---------- 1. Authoritative role helper functions ----------

CREATE OR REPLACE FUNCTION public.is_product_maintainer(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_any_role(_user_id, ARRAY['owner','administrator','content_admin','technical_reviewer','content_editor']::app_role[]);
$$;

CREATE OR REPLACE FUNCTION public.can_technical_approve(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_any_role(_user_id, ARRAY['owner','technical_reviewer']::app_role[]);
$$;

CREATE OR REPLACE FUNCTION public.can_publish_content(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_any_role(_user_id, ARRAY['owner','administrator','content_admin']::app_role[]);
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_any_role(_user_id, ARRAY['owner','administrator','system_admin']::app_role[]);
$$;

CREATE OR REPLACE FUNCTION public.can_read_professional_guidance(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_any_role(_user_id, ARRAY['professional_spotter','dry_cleaner','laundry_employee','trainer']::app_role[]);
$$;

CREATE OR REPLACE FUNCTION public.can_read_product_audit(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_any_role(_user_id, ARRAY['owner','administrator','auditor','technical_reviewer']::app_role[]);
$$;

-- ---------- 2. Product-domain RLS: fail-closed rebuild ----------

-- companies
DROP POLICY IF EXISTS "Maintainers manage companies" ON public.companies;
DROP POLICY IF EXISTS "Signed-in users read verified companies" ON public.companies;
CREATE POLICY "Product maintainers manage companies" ON public.companies FOR ALL TO authenticated
  USING (public.is_product_maintainer(auth.uid())) WITH CHECK (public.is_product_maintainer(auth.uid()));
CREATE POLICY "Professionals read verified companies" ON public.companies FOR SELECT TO authenticated
  USING (status = 'active' AND verification_status = 'verified' AND public.can_read_professional_guidance(auth.uid()));

-- product_kits
DROP POLICY IF EXISTS "Maintainers manage kits" ON public.product_kits;
DROP POLICY IF EXISTS "Signed-in users read verified kits" ON public.product_kits;
CREATE POLICY "Product maintainers manage kits" ON public.product_kits FOR ALL TO authenticated
  USING (public.is_product_maintainer(auth.uid())) WITH CHECK (public.is_product_maintainer(auth.uid()));
CREATE POLICY "Professionals read verified kits" ON public.product_kits FOR SELECT TO authenticated
  USING (status = 'active' AND source_status = 'verified' AND public.can_read_professional_guidance(auth.uid()));

-- kit_products
DROP POLICY IF EXISTS "Maintainers manage kit_products" ON public.kit_products;
DROP POLICY IF EXISTS "Signed-in users read verified kit membership" ON public.kit_products;
CREATE POLICY "Product maintainers manage kit_products" ON public.kit_products FOR ALL TO authenticated
  USING (public.is_product_maintainer(auth.uid())) WITH CHECK (public.is_product_maintainer(auth.uid()));
CREATE POLICY "Professionals read verified kit membership" ON public.kit_products FOR SELECT TO authenticated
  USING (public.can_read_professional_guidance(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.product_kits k WHERE k.id = kit_products.kit_id
      AND k.status = 'active' AND k.source_status = 'verified'));

-- professional_products
DROP POLICY IF EXISTS "Maintainers manage products" ON public.professional_products;
DROP POLICY IF EXISTS "Professionals read approved products" ON public.professional_products;
CREATE POLICY "Product maintainers manage products" ON public.professional_products FOR ALL TO authenticated
  USING (public.is_product_maintainer(auth.uid())) WITH CHECK (public.is_product_maintainer(auth.uid()));
CREATE POLICY "Professionals read approved products" ON public.professional_products FOR SELECT TO authenticated
  USING (status IN ('approved','published') AND verification_status = 'verified' AND provisional = false
         AND public.can_read_professional_guidance(auth.uid()));

-- product_versions
DROP POLICY IF EXISTS "Maintainers manage product_versions" ON public.product_versions;
DROP POLICY IF EXISTS "Signed-in users read approved product versions" ON public.product_versions;
CREATE POLICY "Product maintainers manage product_versions" ON public.product_versions FOR ALL TO authenticated
  USING (public.is_product_maintainer(auth.uid())) WITH CHECK (public.is_product_maintainer(auth.uid()));
CREATE POLICY "Professionals read approved product versions" ON public.product_versions FOR SELECT TO authenticated
  USING (approval_status IN ('approved','published') AND provisional = false
         AND public.can_read_professional_guidance(auth.uid()));

-- source_documents
DROP POLICY IF EXISTS "Maintainers manage documents" ON public.source_documents;
DROP POLICY IF EXISTS "Maintainers read documents" ON public.source_documents;
CREATE POLICY "Product maintainers manage documents" ON public.source_documents FOR ALL TO authenticated
  USING (public.is_product_maintainer(auth.uid())) WITH CHECK (public.is_product_maintainer(auth.uid()));

-- product_source_documents
DROP POLICY IF EXISTS "Maintainers manage product_source_documents" ON public.product_source_documents;
DROP POLICY IF EXISTS "Professionals read verified evidence links" ON public.product_source_documents;
CREATE POLICY "Product maintainers manage product_source_documents" ON public.product_source_documents FOR ALL TO authenticated
  USING (public.is_product_maintainer(auth.uid())) WITH CHECK (public.is_product_maintainer(auth.uid()));
CREATE POLICY "Professionals read verified evidence links" ON public.product_source_documents FOR SELECT TO authenticated
  USING (verification_status = 'verified' AND public.can_read_professional_guidance(auth.uid()));

-- product_manufacturer_claims
DROP POLICY IF EXISTS "Maintainers manage product_manufacturer_claims" ON public.product_manufacturer_claims;
DROP POLICY IF EXISTS "Professionals read verified claims" ON public.product_manufacturer_claims;
CREATE POLICY "Product maintainers manage manufacturer claims" ON public.product_manufacturer_claims FOR ALL TO authenticated
  USING (public.is_product_maintainer(auth.uid())) WITH CHECK (public.is_product_maintainer(auth.uid()));
CREATE POLICY "Professionals read verified claims" ON public.product_manufacturer_claims FOR SELECT TO authenticated
  USING (claim_status = 'verified' AND public.can_read_professional_guidance(auth.uid())
         AND EXISTS (SELECT 1 FROM public.product_versions v WHERE v.id = product_manufacturer_claims.product_version_id
                     AND v.approval_status IN ('approved','published')));

-- product_safety_data
DROP POLICY IF EXISTS "Maintainers manage product_safety_data" ON public.product_safety_data;
DROP POLICY IF EXISTS "Professionals read verified safety data" ON public.product_safety_data;
CREATE POLICY "Product maintainers manage product_safety_data" ON public.product_safety_data FOR ALL TO authenticated
  USING (public.is_product_maintainer(auth.uid())) WITH CHECK (public.is_product_maintainer(auth.uid()));
CREATE POLICY "Professionals read verified safety data" ON public.product_safety_data FOR SELECT TO authenticated
  USING (verification_status = 'verified' AND public.can_read_professional_guidance(auth.uid())
         AND EXISTS (SELECT 1 FROM public.product_versions v WHERE v.id = product_safety_data.product_version_id
                     AND v.approval_status IN ('approved','published')));

-- product_instructions
DROP POLICY IF EXISTS "Maintainers manage product_instructions" ON public.product_instructions;
DROP POLICY IF EXISTS "Professionals read approved instructions" ON public.product_instructions;
CREATE POLICY "Product maintainers manage product_instructions" ON public.product_instructions FOR ALL TO authenticated
  USING (public.is_product_maintainer(auth.uid())) WITH CHECK (public.is_product_maintainer(auth.uid()));
CREATE POLICY "Professionals read approved instructions" ON public.product_instructions FOR SELECT TO authenticated
  USING (approval_status IN ('approved','published') AND public.can_read_professional_guidance(auth.uid())
         AND EXISTS (SELECT 1 FROM public.product_versions v WHERE v.id = product_instructions.product_version_id
                     AND v.approval_status IN ('approved','published')));

-- product_guidance_mappings
DROP POLICY IF EXISTS "Maintainers manage guidance mappings" ON public.product_guidance_mappings;
DROP POLICY IF EXISTS "Professionals read approved guidance mappings" ON public.product_guidance_mappings;
CREATE POLICY "Product maintainers manage guidance mappings" ON public.product_guidance_mappings FOR ALL TO authenticated
  USING (public.is_product_maintainer(auth.uid())) WITH CHECK (public.is_product_maintainer(auth.uid()));
CREATE POLICY "Professionals read approved guidance mappings" ON public.product_guidance_mappings FOR SELECT TO authenticated
  USING (approval_status IN ('approved','published') AND verification_status = 'verified' AND provisional = false
         AND public.can_read_professional_guidance(auth.uid()));

-- product_audit_log (append-only for maintainers; read for governance roles)
DROP POLICY IF EXISTS "Maintainers manage product_audit_log" ON public.product_audit_log;
DROP POLICY IF EXISTS "Administrators and auditors read product_audit_log" ON public.product_audit_log;
CREATE POLICY "Governance roles read product_audit_log" ON public.product_audit_log FOR SELECT TO authenticated
  USING (public.can_read_product_audit(auth.uid()));
CREATE POLICY "Product maintainers append product_audit_log" ON public.product_audit_log FOR INSERT TO authenticated
  WITH CHECK (public.is_product_maintainer(auth.uid()));

-- import_batches / import_staging_rows
DROP POLICY IF EXISTS "Maintainers manage import batches" ON public.import_batches;
DROP POLICY IF EXISTS "Maintainers manage import staging" ON public.import_staging_rows;
CREATE POLICY "Product maintainers manage import batches" ON public.import_batches FOR ALL TO authenticated
  USING (public.is_product_maintainer(auth.uid())) WITH CHECK (public.is_product_maintainer(auth.uid()));
CREATE POLICY "Product maintainers manage import staging" ON public.import_staging_rows FOR ALL TO authenticated
  USING (public.is_product_maintainer(auth.uid())) WITH CHECK (public.is_product_maintainer(auth.uid()));

-- Anonymous users must never reach product-domain records.
REVOKE ALL ON public.companies, public.product_kits, public.professional_products, public.kit_products,
  public.product_versions, public.source_documents, public.product_source_documents,
  public.product_manufacturer_claims, public.product_safety_data, public.product_instructions,
  public.product_guidance_mappings, public.product_audit_log, public.import_batches,
  public.import_staging_rows FROM anon;

-- ---------- 3. Dedicated security audit trail ----------

CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  target_user_id uuid,
  reason text NOT NULL,
  performed_by text NOT NULL DEFAULT current_user,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.security_audit_log TO authenticated;
GRANT ALL ON public.security_audit_log TO service_role;

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Governance roles read the security audit log" ON public.security_audit_log;
CREATE POLICY "Governance roles read the security audit log" ON public.security_audit_log FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['owner','administrator','auditor']::app_role[]));

-- ---------- 4. One-time first-owner bootstrap ----------

CREATE OR REPLACE FUNCTION public.bootstrap_first_owner(target_user_id uuid, reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _exists boolean;
BEGIN
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'A target user identifier is required.';
  END IF;

  IF coalesce(btrim(coalesce(reason, '')), '') = '' THEN
    RAISE EXCEPTION 'A written reason is required.';
  END IF;

  SELECT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = target_user_id) INTO _exists;
  IF NOT _exists THEN
    RAISE EXCEPTION 'No account exists for that identifier.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE role IN ('owner','administrator','system_admin')
  ) THEN
    RAISE EXCEPTION 'A privileged account already exists. First-owner bootstrap can only run once.';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'owner');

  INSERT INTO public.security_audit_log (action, target_user_id, reason, metadata)
  VALUES ('bootstrap_first_owner', target_user_id, btrim(reason),
          jsonb_build_object('granted_role', 'owner'));

  RETURN jsonb_build_object('ok', true, 'user_id', target_user_id, 'role', 'owner');
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_first_owner(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bootstrap_first_owner(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.bootstrap_first_owner(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_owner(uuid, text) TO service_role;

-- Privileged roles are never self-assignable from the application.
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated;
REVOKE ALL ON public.user_roles FROM anon;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
