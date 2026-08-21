-- ============================================================
-- Canonical product-domain foundation (additive, non-destructive)
-- ============================================================

-- 1. product_versions hardening -------------------------------------------
ALTER TABLE public.product_versions
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS provisional boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS product_versions_product_ref_uq
  ON public.product_versions (product_id, version_ref);
CREATE INDEX IF NOT EXISTS product_versions_product_idx
  ON public.product_versions (product_id);

DROP TRIGGER IF EXISTS trg_product_versions_updated ON public.product_versions;
CREATE TRIGGER trg_product_versions_updated BEFORE UPDATE ON public.product_versions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. product_source_documents ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_source_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.professional_products(id) ON DELETE CASCADE,
  product_version_id uuid REFERENCES public.product_versions(id) ON DELETE CASCADE,
  source_document_id uuid NOT NULL REFERENCES public.source_documents(id) ON DELETE RESTRICT,
  document_role text NOT NULL CHECK (document_role IN (
    'manufacturer_label','manufacturer_tds','manufacturer_sds','manufacturer_spotting_chart',
    'distributor_guide','training_guide','internal_gilm_guide','regulatory_source','superseded_document')),
  claim_scope text NOT NULL DEFAULT 'product_identity',
  source_section text,
  page_reference text,
  verification_status public.verification_status NOT NULL DEFAULT 'unverified',
  reviewer uuid,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_source_documents TO authenticated;
GRANT ALL ON public.product_source_documents TO service_role;
ALTER TABLE public.product_source_documents ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS product_source_documents_uq
  ON public.product_source_documents (product_id, coalesce(product_version_id, '00000000-0000-0000-0000-000000000000'::uuid), source_document_id, document_role);
CREATE INDEX IF NOT EXISTS product_source_documents_version_idx ON public.product_source_documents (product_version_id);

DROP TRIGGER IF EXISTS trg_product_source_documents_updated ON public.product_source_documents;
CREATE TRIGGER trg_product_source_documents_updated BEFORE UPDATE ON public.product_source_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Maintainers manage product_source_documents" ON public.product_source_documents;
CREATE POLICY "Maintainers manage product_source_documents" ON public.product_source_documents
  FOR ALL TO authenticated USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));
DROP POLICY IF EXISTS "Professionals read verified evidence links" ON public.product_source_documents;
CREATE POLICY "Professionals read verified evidence links" ON public.product_source_documents
  FOR SELECT TO authenticated USING (
    verification_status = 'verified' AND public.has_any_role(auth.uid(),
      ARRAY['professional_spotter','dry_cleaner','laundry_employee','trainer']::app_role[]));

-- 3. product_guidance_mappings (canonical) --------------------------------
CREATE TABLE IF NOT EXISTS public.product_guidance_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_ref text NOT NULL,
  product_id uuid NOT NULL REFERENCES public.professional_products(id) ON DELETE RESTRICT,
  product_version_id uuid NOT NULL REFERENCES public.product_versions(id) ON DELETE RESTRICT,
  stain_record_id uuid NOT NULL REFERENCES public.stain_records(id) ON DELETE RESTRICT,
  stain_category_id uuid REFERENCES public.stain_categories(id) ON DELETE SET NULL,
  treatment_stage_id uuid REFERENCES public.treatment_stages(id) ON DELETE SET NULL,
  treatment_stage_number integer,
  decision text NOT NULL DEFAULT 'not_assessed',
  suitability public.suitability_decision NOT NULL DEFAULT 'insufficient_information',
  risk_level public.risk_level NOT NULL DEFAULT 'amber',
  user_capability text NOT NULL DEFAULT 'professional',
  country text NOT NULL DEFAULT 'IN',
  language text NOT NULL DEFAULT 'en',
  fabric_id uuid REFERENCES public.fabrics(id) ON DELETE SET NULL,
  material_family text,
  colour_condition text,
  garment_construction text,
  process_condition text,
  restriction text,
  mandatory_hidden_test boolean NOT NULL DEFAULT true,
  mandatory_stop_conditions text[] NOT NULL DEFAULT '{}',
  required_rinse text,
  required_neutralisation text,
  evidence_level public.evidence_level NOT NULL DEFAULT 'none',
  evidence_note text,
  source_document_id uuid REFERENCES public.source_documents(id) ON DELETE RESTRICT,
  source_section text,
  approval_status public.content_status NOT NULL DEFAULT 'draft',
  verification_status public.verification_status NOT NULL DEFAULT 'unverified',
  provisional boolean NOT NULL DEFAULT true,
  reviewer uuid,
  reviewed_at timestamptz,
  effective_date date,
  end_date date,
  review_note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_guidance_mappings TO authenticated;
GRANT ALL ON public.product_guidance_mappings TO service_role;
ALTER TABLE public.product_guidance_mappings ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS product_guidance_mappings_ref_uq ON public.product_guidance_mappings (mapping_ref);
CREATE UNIQUE INDEX IF NOT EXISTS product_guidance_mappings_scope_uq ON public.product_guidance_mappings
  (product_version_id, stain_record_id, country, language, coalesce(treatment_stage_number, -1), coalesce(material_family, ''));
CREATE INDEX IF NOT EXISTS product_guidance_mappings_stain_idx ON public.product_guidance_mappings (stain_record_id);
CREATE INDEX IF NOT EXISTS product_guidance_mappings_product_idx ON public.product_guidance_mappings (product_id);
CREATE INDEX IF NOT EXISTS product_guidance_mappings_status_idx ON public.product_guidance_mappings (approval_status);

DROP TRIGGER IF EXISTS trg_product_guidance_mappings_updated ON public.product_guidance_mappings;
CREATE TRIGGER trg_product_guidance_mappings_updated BEFORE UPDATE ON public.product_guidance_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Maintainers manage guidance mappings" ON public.product_guidance_mappings;
CREATE POLICY "Maintainers manage guidance mappings" ON public.product_guidance_mappings
  FOR ALL TO authenticated USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));
DROP POLICY IF EXISTS "Professionals read approved guidance mappings" ON public.product_guidance_mappings;
CREATE POLICY "Professionals read approved guidance mappings" ON public.product_guidance_mappings
  FOR SELECT TO authenticated USING (
    approval_status IN ('approved','published')
    AND verification_status = 'verified'
    AND provisional = false
    AND public.has_any_role(auth.uid(),
      ARRAY['professional_spotter','dry_cleaner','laundry_employee','trainer']::app_role[]));

-- 4. Staging import rows ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.import_staging_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES public.import_batches(id) ON DELETE CASCADE,
  entity_kind text NOT NULL CHECK (entity_kind IN ('company','kit','product','kit_product','source_document','product_version','guidance_mapping')),
  row_number integer NOT NULL DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  duplicate_of text,
  validation_errors text[] NOT NULL DEFAULT '{}',
  missing_fields text[] NOT NULL DEFAULT '{}',
  staging_status text NOT NULL DEFAULT 'parsed'
    CHECK (staging_status IN ('parsed','duplicate','invalid','confirmed','imported','rejected','rolled_back')),
  confirmed_by uuid,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.import_staging_rows TO authenticated;
GRANT ALL ON public.import_staging_rows TO service_role;
ALTER TABLE public.import_staging_rows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Maintainers manage import staging" ON public.import_staging_rows;
CREATE POLICY "Maintainers manage import staging" ON public.import_staging_rows
  FOR ALL TO authenticated USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));
DROP TRIGGER IF EXISTS trg_import_staging_rows_updated ON public.import_staging_rows;
CREATE TRIGGER trg_import_staging_rows_updated BEFORE UPDATE ON public.import_staging_rows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Public read import batches" ON public.import_batches;
REVOKE ALL ON public.import_batches FROM anon;

-- 5. Legacy deprecation ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.block_legacy_write()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  RAISE EXCEPTION 'Table %.% is a deprecated legacy structure and is read-only. Use the canonical product-domain tables.',
    TG_TABLE_SCHEMA, TG_TABLE_NAME;
END; $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['manufacturer_products','product_stain_mappings','product_mappings','product_stage_mappings','stains'] LOOP
    EXECUTE format('COMMENT ON TABLE public.%I IS %L', t,
      'DEPRECATED legacy structure. Read-only history. Replaced by the canonical product-domain model (see public.legacy_table_replacements).');
    EXECUTE format('DROP TRIGGER IF EXISTS trg_block_legacy_write ON public.%I', t);
    EXECUTE format('CREATE TRIGGER trg_block_legacy_write BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.block_legacy_write()', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON public.%I FROM authenticated', t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Public read manufacturer products" ON public.manufacturer_products;
DROP POLICY IF EXISTS "Maintainers manage manufacturer products" ON public.manufacturer_products;
CREATE POLICY "Admins read legacy manufacturer products" ON public.manufacturer_products
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Public read product stain mappings" ON public.product_stain_mappings;
DROP POLICY IF EXISTS "Maintainers manage product stain mappings" ON public.product_stain_mappings;
CREATE POLICY "Admins read legacy product stain mappings" ON public.product_stain_mappings
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Professionals read approved mappings" ON public.product_mappings;
DROP POLICY IF EXISTS "Maintainers manage mappings" ON public.product_mappings;
CREATE POLICY "Admins read legacy product mappings" ON public.product_mappings
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "product_stage_mappings_read" ON public.product_stage_mappings;
DROP POLICY IF EXISTS "product_stage_mappings_manage" ON public.product_stage_mappings;
CREATE POLICY "Admins read legacy product stage mappings" ON public.product_stage_mappings
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Public read published stains" ON public.stains;
DROP POLICY IF EXISTS "Maintainers manage stains" ON public.stains;
CREATE POLICY "Admins read legacy stains" ON public.stains
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));

CREATE OR REPLACE VIEW public.legacy_table_replacements AS
SELECT * FROM (VALUES
  ('manufacturer_products','professional_products + product_versions','Product identity and versioned formulation data.'),
  ('product_stain_mappings','product_guidance_mappings','Approved product-to-stain guidance, tied to an exact product version.'),
  ('product_mappings','product_guidance_mappings','Single canonical mapping table.'),
  ('product_stage_mappings','product_guidance_mappings (treatment_stage_id / treatment_stage_number)','Stage information now lives on the canonical mapping.'),
  ('stains','stain_records','826 canonical stain records with stable IDs.')
) AS t(legacy_table, canonical_replacement, note);
GRANT SELECT ON public.legacy_table_replacements TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.product_guidance_available(_company_id uuid, _stain_record_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.product_guidance_mappings m
    JOIN public.professional_products p ON p.id = m.product_id
    WHERE p.company_id = _company_id
      AND m.stain_record_id = _stain_record_id
      AND m.approval_status IN ('approved','published')
      AND m.verification_status = 'verified'
      AND m.provisional = false
  );
$$;

-- 6. Publication readiness -------------------------------------------------
CREATE OR REPLACE FUNCTION public.product_version_publication_readiness(_version_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v record; c record; p record; blockers text[] := '{}'; kit_ok boolean;
BEGIN
  SELECT * INTO v FROM public.product_versions WHERE id = _version_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ready', false, 'blockers', to_jsonb(ARRAY['Product version not found.'])); END IF;
  SELECT * INTO p FROM public.professional_products WHERE id = v.product_id;
  SELECT * INTO c FROM public.companies WHERE id = p.company_id;

  IF c IS NULL OR c.verification_status <> 'verified' THEN blockers := blockers || 'Company is not verified.'; END IF;
  SELECT EXISTS (SELECT 1 FROM public.kit_products kp JOIN public.product_kits k ON k.id = kp.kit_id
                 WHERE kp.product_id = p.id AND k.source_status = 'verified') INTO kit_ok;
  IF NOT kit_ok THEN blockers := blockers || 'No verified kit contains this product.'; END IF;
  IF p.verification_status <> 'verified' THEN blockers := blockers || 'Product identity is not verified.'; END IF;
  IF p.provisional THEN blockers := blockers || 'Product is still marked provisional.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.product_source_documents d WHERE d.product_version_id = v.id)
    THEN blockers := blockers || 'No source document is linked to this product version.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.product_manufacturer_claims mc WHERE mc.product_version_id = v.id AND mc.source_document_id IS NOT NULL)
    THEN blockers := blockers || 'No manufacturer claim with an identified source document.'; END IF;
  IF coalesce(nullif(btrim(coalesce(p.safety_warnings,'')),''),'') = ''
    THEN blockers := blockers || 'No safety warning is recorded.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.product_safety_data s WHERE s.product_version_id = v.id)
    THEN blockers := blockers || 'SDS status is unknown for this version.'; END IF;
  IF coalesce(v.tds_version,'') = '' AND coalesce(v.label_version,'') = ''
    THEN blockers := blockers || 'TDS or label status is unknown for this version.'; END IF;
  IF coalesce(v.country,'') = '' THEN blockers := blockers || 'Country applicability is unknown.'; END IF;
  IF coalesce(nullif(btrim(coalesce(p.ppe,'')),''),'') = ''
    THEN blockers := blockers || 'Required PPE is neither recorded nor explicitly marked as not disclosed.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.product_instructions i WHERE i.product_version_id = v.id AND i.source_document_id IS NOT NULL)
    THEN blockers := blockers || 'No source-backed instructions exist for this version.'; END IF;
  IF EXISTS (SELECT 1 FROM public.product_conflicts pc WHERE pc.product_id = p.id AND pc.resolved = false)
    THEN blockers := blockers || 'Unresolved product conflicts exist.'; END IF;
  IF coalesce(nullif(btrim(coalesce(v.reviewer,'')),''),'') = ''
    THEN blockers := blockers || 'No reviewer is assigned to this version.'; END IF;

  RETURN jsonb_build_object('ready', cardinality(blockers) = 0, 'blockers', to_jsonb(blockers),
                            'version_id', v.id, 'product_id', p.id);
END; $$;

CREATE OR REPLACE FUNCTION public.guidance_mapping_publication_readiness(_mapping_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE m record; sr record; vready jsonb; blockers text[] := '{}';
BEGIN
  SELECT * INTO m FROM public.product_guidance_mappings WHERE id = _mapping_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ready', false, 'blockers', to_jsonb(ARRAY['Mapping not found.'])); END IF;
  SELECT * INTO sr FROM public.stain_records WHERE id = m.stain_record_id;
  IF sr IS NULL THEN blockers := blockers || 'Stain record not found.'; END IF;
  IF sr.reroute_pending THEN blockers := blockers || 'This stain record still has a pending reroute review.'; END IF;
  IF m.source_document_id IS NULL THEN blockers := blockers || 'No source document cited.'; END IF;
  IF coalesce(btrim(coalesce(m.source_section,'')),'') = '' THEN blockers := blockers || 'No source section cited.'; END IF;
  IF m.evidence_level = 'none' THEN blockers := blockers || 'Evidence level is "none".'; END IF;
  IF coalesce(btrim(coalesce(m.review_note,'')),'') = '' THEN blockers := blockers || 'No technical review note.'; END IF;
  IF m.reviewer IS NULL THEN blockers := blockers || 'No reviewer assigned.'; END IF;
  vready := public.product_version_publication_readiness(m.product_version_id);
  IF NOT (vready->>'ready')::boolean THEN
    blockers := blockers || ('Product version is not publication ready: ' ||
      coalesce(array_to_string(ARRAY(SELECT jsonb_array_elements_text(vready->'blockers')), ' '), ''));
  END IF;
  RETURN jsonb_build_object('ready', cardinality(blockers) = 0, 'blockers', to_jsonb(blockers));
END; $$;

-- 7. Secured approval transitions -----------------------------------------
CREATE OR REPLACE FUNCTION public.guard_product_version_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_setting('app.approval_ctx', true) = 'on' THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.approval_status IN ('approved','published') THEN
      RAISE EXCEPTION 'Approved or published product versions can only be created by the secured approval action.';
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.immutable AND OLD.approval_status IN ('approved','published') THEN
    RAISE EXCEPTION 'This product version is approved and immutable. Create a new version instead.';
  END IF;
  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status
     AND NEW.approval_status IN ('approved','published') THEN
    RAISE EXCEPTION 'Approval must go through the secured approval action.';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_guard_product_version_status ON public.product_versions;
CREATE TRIGGER trg_guard_product_version_status BEFORE INSERT OR UPDATE ON public.product_versions
  FOR EACH ROW EXECUTE FUNCTION public.guard_product_version_status();

CREATE OR REPLACE FUNCTION public.guard_guidance_mapping_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_setting('app.approval_ctx', true) = 'on' THEN RETURN NEW; END IF;
  IF NEW.approval_status IN ('approved','published')
     AND (TG_OP = 'INSERT' OR NEW.approval_status IS DISTINCT FROM OLD.approval_status) THEN
    RAISE EXCEPTION 'Guidance mappings can only be approved through the secured approval action.';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_guard_guidance_mapping_status ON public.product_guidance_mappings;
CREATE TRIGGER trg_guard_guidance_mapping_status BEFORE INSERT OR UPDATE ON public.product_guidance_mappings
  FOR EACH ROW EXECUTE FUNCTION public.guard_guidance_mapping_status();

CREATE OR REPLACE FUNCTION public.approve_product_version(
  _version_id uuid, _target_status public.content_status, _reason text, _source_document_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE readiness jsonb; prev public.content_status;
BEGIN
  IF NOT public.can_publish_content(auth.uid()) THEN
    RAISE EXCEPTION 'Only an authorised approver may change publication status.';
  END IF;
  IF _target_status NOT IN ('approved','published') THEN
    RAISE EXCEPTION 'This action only performs approval or publication.';
  END IF;
  IF coalesce(btrim(coalesce(_reason,'')),'') = '' THEN
    RAISE EXCEPTION 'A written reason is required.';
  END IF;
  readiness := public.product_version_publication_readiness(_version_id);
  IF NOT (readiness->>'ready')::boolean THEN
    RETURN jsonb_build_object('ok', false, 'blockers', readiness->'blockers');
  END IF;
  SELECT approval_status INTO prev FROM public.product_versions WHERE id = _version_id;
  PERFORM set_config('app.approval_ctx','on', true);
  UPDATE public.product_versions
     SET approval_status = _target_status, immutable = true,
         provisional = false, reviewer = coalesce(reviewer, auth.uid()::text)
   WHERE id = _version_id;
  PERFORM set_config('app.approval_ctx','off', true);
  INSERT INTO public.product_audit_log(entity_table, entity_id, product_id, action, field_key,
    previous_value, new_value, reason, justification_required, source_document_id, changed_by, reviewer,
    approval_decision, safety_critical)
  SELECT 'product_versions', v.id, v.product_id, 'approval', 'approval_status',
    prev::text, _target_status::text, _reason, true, _source_document_id, auth.uid()::text, auth.uid()::text,
    _target_status::text, true
  FROM public.product_versions v WHERE v.id = _version_id;
  RETURN jsonb_build_object('ok', true);
END; $$;
REVOKE ALL ON FUNCTION public.approve_product_version(uuid, public.content_status, text, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.approve_product_version(uuid, public.content_status, text, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.approve_guidance_mapping(
  _mapping_id uuid, _target_status public.content_status, _reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE readiness jsonb; prev public.content_status;
BEGIN
  IF NOT public.can_publish_content(auth.uid()) THEN
    RAISE EXCEPTION 'Only an authorised approver may change publication status.';
  END IF;
  IF _target_status NOT IN ('approved','published') THEN
    RAISE EXCEPTION 'This action only performs approval or publication.';
  END IF;
  IF coalesce(btrim(coalesce(_reason,'')),'') = '' THEN
    RAISE EXCEPTION 'A written reason is required.';
  END IF;
  readiness := public.guidance_mapping_publication_readiness(_mapping_id);
  IF NOT (readiness->>'ready')::boolean THEN
    RETURN jsonb_build_object('ok', false, 'blockers', readiness->'blockers');
  END IF;
  SELECT approval_status INTO prev FROM public.product_guidance_mappings WHERE id = _mapping_id;
  PERFORM set_config('app.approval_ctx','on', true);
  UPDATE public.product_guidance_mappings
     SET approval_status = _target_status, verification_status = 'verified', provisional = false,
         reviewed_at = now(), reviewer = coalesce(reviewer, auth.uid())
   WHERE id = _mapping_id;
  PERFORM set_config('app.approval_ctx','off', true);
  INSERT INTO public.product_audit_log(entity_table, entity_id, product_id, action, field_key,
    previous_value, new_value, reason, justification_required, source_document_id, changed_by, reviewer,
    approval_decision, safety_critical)
  SELECT 'product_guidance_mappings', m.id, m.product_id, 'approval', 'approval_status',
    prev::text, _target_status::text, _reason, true, m.source_document_id, auth.uid()::text, auth.uid()::text,
    _target_status::text, true
  FROM public.product_guidance_mappings m WHERE m.id = _mapping_id;
  RETURN jsonb_build_object('ok', true);
END; $$;
REVOKE ALL ON FUNCTION public.approve_guidance_mapping(uuid, public.content_status, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.approve_guidance_mapping(uuid, public.content_status, text) TO authenticated;

-- 8. RLS tightening on canonical tables -----------------------------------
REVOKE ALL ON public.companies, public.product_kits, public.kit_products, public.professional_products,
  public.product_versions, public.product_manufacturer_claims, public.product_safety_data,
  public.product_instructions, public.product_audit_log, public.source_documents FROM anon;

DROP POLICY IF EXISTS "Authenticated read companies" ON public.companies;
CREATE POLICY "Signed-in users read verified companies" ON public.companies
  FOR SELECT TO authenticated USING (status = 'active' AND verification_status = 'verified');

DROP POLICY IF EXISTS "Authenticated read kits" ON public.product_kits;
CREATE POLICY "Signed-in users read verified kits" ON public.product_kits
  FOR SELECT TO authenticated USING (status = 'active' AND source_status = 'verified');

DROP POLICY IF EXISTS "Signed-in users read kit_products" ON public.kit_products;
CREATE POLICY "Signed-in users read verified kit membership" ON public.kit_products
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.product_kits k WHERE k.id = kit_id AND k.status = 'active' AND k.source_status = 'verified'));

DROP POLICY IF EXISTS "Signed-in users read product_versions" ON public.product_versions;
CREATE POLICY "Signed-in users read approved product versions" ON public.product_versions
  FOR SELECT TO authenticated USING (approval_status IN ('approved','published'));

DROP POLICY IF EXISTS "Signed-in users read product_manufacturer_claims" ON public.product_manufacturer_claims;
CREATE POLICY "Professionals read verified claims" ON public.product_manufacturer_claims
  FOR SELECT TO authenticated USING (
    claim_status = 'verified' AND public.has_any_role(auth.uid(),
      ARRAY['professional_spotter','dry_cleaner','laundry_employee','trainer']::app_role[]));

DROP POLICY IF EXISTS "Professionals read product_safety_data" ON public.product_safety_data;
CREATE POLICY "Professionals read verified safety data" ON public.product_safety_data
  FOR SELECT TO authenticated USING (
    verification_status = 'verified'
    AND EXISTS (SELECT 1 FROM public.product_versions v WHERE v.id = product_version_id AND v.approval_status IN ('approved','published'))
    AND public.has_any_role(auth.uid(),
      ARRAY['professional_spotter','dry_cleaner','laundry_employee','trainer']::app_role[]));

DROP POLICY IF EXISTS "Professionals read product_instructions" ON public.product_instructions;
CREATE POLICY "Professionals read approved instructions" ON public.product_instructions
  FOR SELECT TO authenticated USING (
    approval_status IN ('approved','published')
    AND EXISTS (SELECT 1 FROM public.product_versions v WHERE v.id = product_version_id AND v.approval_status IN ('approved','published'))
    AND public.has_any_role(auth.uid(),
      ARRAY['professional_spotter','dry_cleaner','laundry_employee','trainer']::app_role[]));

DROP POLICY IF EXISTS "Professionals read product_audit_log" ON public.product_audit_log;
CREATE POLICY "Administrators and auditors read product_audit_log" ON public.product_audit_log
  FOR SELECT TO authenticated USING (
    public.is_platform_admin(auth.uid()) OR public.has_role(auth.uid(), 'auditor'::app_role)
    OR public.is_content_maintainer(auth.uid()));