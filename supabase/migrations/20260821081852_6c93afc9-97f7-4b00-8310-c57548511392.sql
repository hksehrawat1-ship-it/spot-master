-- =====================================================================
-- RECOVERY STEP 1 — CORRECTION
-- 1. Separate technical approval from publication
-- 2. Strengthen professional read policies (fail closed)
-- 3. Concurrency-safe first-owner bootstrap
-- No data rows are created, approved, verified or published here.
-- =====================================================================

-- ---------------------------------------------------------------- 1 --
ALTER TABLE public.product_versions
  ADD COLUMN IF NOT EXISTS technically_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS technically_approved_by uuid;

-- Technical approval of a product version: owner / technical_reviewer only.
CREATE OR REPLACE FUNCTION public.technically_approve_product_version(
  _version_id uuid, _reason text, _source_document_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE readiness jsonb; prev public.content_status;
BEGIN
  IF NOT public.can_technical_approve(auth.uid()) THEN
    RAISE EXCEPTION 'Only an owner or technical reviewer may technically approve content.';
  END IF;
  IF coalesce(btrim(coalesce(_reason,'')),'') = '' THEN
    RAISE EXCEPTION 'A written reason is required.';
  END IF;
  SELECT approval_status INTO prev FROM public.product_versions WHERE id = _version_id;
  IF prev IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'blockers', to_jsonb(ARRAY['Product version not found.']));
  END IF;
  IF prev IN ('approved','published') THEN
    RETURN jsonb_build_object('ok', false, 'blockers', to_jsonb(ARRAY['This version is already technically approved.']));
  END IF;
  readiness := public.product_version_publication_readiness(_version_id);
  IF NOT (readiness->>'ready')::boolean THEN
    RETURN jsonb_build_object('ok', false, 'blockers', readiness->'blockers');
  END IF;

  PERFORM set_config('app.approval_ctx','on', true);
  UPDATE public.product_versions
     SET approval_status = 'approved', immutable = true, provisional = false,
         reviewer = coalesce(nullif(btrim(coalesce(reviewer,'')),''), auth.uid()::text),
         technically_approved_by = auth.uid(), technically_approved_at = now()
   WHERE id = _version_id;
  PERFORM set_config('app.approval_ctx','off', true);

  INSERT INTO public.product_audit_log(entity_table, entity_id, product_id, action, field_key,
    previous_value, new_value, reason, justification_required, source_document_id, changed_by, reviewer,
    approval_decision, safety_critical)
  SELECT 'product_versions', v.id, v.product_id, 'technical_approval', 'approval_status',
    prev::text, 'approved', _reason, true, _source_document_id, auth.uid()::text, auth.uid()::text,
    'approved', true
  FROM public.product_versions v WHERE v.id = _version_id;

  RETURN jsonb_build_object('ok', true);
END; $$;

-- Publication of a product version: owner / administrator / content_admin only,
-- and only for a record that is already technically approved.
CREATE OR REPLACE FUNCTION public.publish_product_version(
  _version_id uuid, _reason text, _source_document_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v record; readiness jsonb; blockers text[] := '{}';
BEGIN
  IF NOT public.can_publish_content(auth.uid()) THEN
    RAISE EXCEPTION 'Only an authorised publisher may publish content.';
  END IF;
  IF coalesce(btrim(coalesce(_reason,'')),'') = '' THEN
    RAISE EXCEPTION 'A written reason is required.';
  END IF;
  SELECT * INTO v FROM public.product_versions WHERE id = _version_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'blockers', to_jsonb(ARRAY['Product version not found.']));
  END IF;
  IF v.approval_status <> 'approved' THEN
    blockers := blockers || 'This version has not been technically approved.';
  END IF;
  IF v.technically_approved_by IS NULL OR v.technically_approved_at IS NULL
     OR coalesce(btrim(coalesce(v.reviewer,'')),'') = '' THEN
    blockers := blockers || 'Technical approval has no recorded reviewer and timestamp.';
  END IF;
  IF v.verification_status <> 'verified' THEN
    blockers := blockers || 'Product version is not verified.';
  END IF;
  IF v.provisional THEN blockers := blockers || 'Product version is still provisional.'; END IF;
  readiness := public.product_version_publication_readiness(_version_id);
  IF NOT (readiness->>'ready')::boolean THEN
    blockers := blockers || ARRAY(SELECT jsonb_array_elements_text(readiness->'blockers'));
  END IF;
  IF cardinality(blockers) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'blockers', to_jsonb(blockers));
  END IF;

  PERFORM set_config('app.approval_ctx','on', true);
  UPDATE public.product_versions SET approval_status = 'published' WHERE id = _version_id;
  PERFORM set_config('app.approval_ctx','off', true);

  INSERT INTO public.product_audit_log(entity_table, entity_id, product_id, action, field_key,
    previous_value, new_value, reason, justification_required, source_document_id, changed_by, reviewer,
    approval_decision, safety_critical)
  VALUES ('product_versions', v.id, v.product_id, 'publication', 'approval_status',
    'approved', 'published', _reason, true, _source_document_id, auth.uid()::text, auth.uid()::text,
    'published', true);

  RETURN jsonb_build_object('ok', true);
END; $$;

-- Backwards-compatible dispatcher: strict branch on the requested target status.
CREATE OR REPLACE FUNCTION public.approve_product_version(
  _version_id uuid, _target_status content_status, _reason text, _source_document_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF _target_status = 'approved' THEN
    RETURN public.technically_approve_product_version(_version_id, _reason, _source_document_id);
  ELSIF _target_status = 'published' THEN
    RETURN public.publish_product_version(_version_id, _reason, _source_document_id);
  END IF;
  RAISE EXCEPTION 'This action only performs technical approval or publication.';
END; $$;

-- Guidance mappings ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.technically_approve_guidance_mapping(_mapping_id uuid, _reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE readiness jsonb; prev public.content_status;
BEGIN
  IF NOT public.can_technical_approve(auth.uid()) THEN
    RAISE EXCEPTION 'Only an owner or technical reviewer may technically approve content.';
  END IF;
  IF coalesce(btrim(coalesce(_reason,'')),'') = '' THEN
    RAISE EXCEPTION 'A written reason is required.';
  END IF;
  SELECT approval_status INTO prev FROM public.product_guidance_mappings WHERE id = _mapping_id;
  IF prev IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'blockers', to_jsonb(ARRAY['Mapping not found.']));
  END IF;
  IF prev IN ('approved','published') THEN
    RETURN jsonb_build_object('ok', false, 'blockers', to_jsonb(ARRAY['This mapping is already technically approved.']));
  END IF;
  readiness := public.guidance_mapping_publication_readiness(_mapping_id);
  IF NOT (readiness->>'ready')::boolean THEN
    RETURN jsonb_build_object('ok', false, 'blockers', readiness->'blockers');
  END IF;

  PERFORM set_config('app.approval_ctx','on', true);
  UPDATE public.product_guidance_mappings
     SET approval_status = 'approved', verification_status = 'verified', provisional = false,
         reviewed_at = now(), reviewer = coalesce(reviewer, auth.uid())
   WHERE id = _mapping_id;
  PERFORM set_config('app.approval_ctx','off', true);

  INSERT INTO public.product_audit_log(entity_table, entity_id, product_id, action, field_key,
    previous_value, new_value, reason, justification_required, source_document_id, changed_by, reviewer,
    approval_decision, safety_critical)
  SELECT 'product_guidance_mappings', m.id, m.product_id, 'technical_approval', 'approval_status',
    prev::text, 'approved', _reason, true, m.source_document_id, auth.uid()::text, auth.uid()::text,
    'approved', true
  FROM public.product_guidance_mappings m WHERE m.id = _mapping_id;

  RETURN jsonb_build_object('ok', true);
END; $$;

CREATE OR REPLACE FUNCTION public.publish_guidance_mapping(_mapping_id uuid, _reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE m record; readiness jsonb; blockers text[] := '{}';
BEGIN
  IF NOT public.can_publish_content(auth.uid()) THEN
    RAISE EXCEPTION 'Only an authorised publisher may publish content.';
  END IF;
  IF coalesce(btrim(coalesce(_reason,'')),'') = '' THEN
    RAISE EXCEPTION 'A written reason is required.';
  END IF;
  SELECT * INTO m FROM public.product_guidance_mappings WHERE id = _mapping_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'blockers', to_jsonb(ARRAY['Mapping not found.']));
  END IF;
  IF m.approval_status <> 'approved' THEN
    blockers := blockers || 'This mapping has not been technically approved.';
  END IF;
  IF m.reviewer IS NULL OR m.reviewed_at IS NULL THEN
    blockers := blockers || 'Technical approval has no recorded reviewer and timestamp.';
  END IF;
  IF m.verification_status <> 'verified' THEN blockers := blockers || 'Mapping is not verified.'; END IF;
  IF m.provisional THEN blockers := blockers || 'Mapping is still provisional.'; END IF;
  readiness := public.guidance_mapping_publication_readiness(_mapping_id);
  IF NOT (readiness->>'ready')::boolean THEN
    blockers := blockers || ARRAY(SELECT jsonb_array_elements_text(readiness->'blockers'));
  END IF;
  IF cardinality(blockers) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'blockers', to_jsonb(blockers));
  END IF;

  PERFORM set_config('app.approval_ctx','on', true);
  UPDATE public.product_guidance_mappings SET approval_status = 'published' WHERE id = _mapping_id;
  PERFORM set_config('app.approval_ctx','off', true);

  INSERT INTO public.product_audit_log(entity_table, entity_id, product_id, action, field_key,
    previous_value, new_value, reason, justification_required, source_document_id, changed_by, reviewer,
    approval_decision, safety_critical)
  VALUES ('product_guidance_mappings', m.id, m.product_id, 'publication', 'approval_status',
    'approved', 'published', _reason, true, m.source_document_id, auth.uid()::text, auth.uid()::text,
    'published', true);

  RETURN jsonb_build_object('ok', true);
END; $$;

CREATE OR REPLACE FUNCTION public.approve_guidance_mapping(
  _mapping_id uuid, _target_status content_status, _reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF _target_status = 'approved' THEN
    RETURN public.technically_approve_guidance_mapping(_mapping_id, _reason);
  ELSIF _target_status = 'published' THEN
    RETURN public.publish_guidance_mapping(_mapping_id, _reason);
  END IF;
  RAISE EXCEPTION 'This action only performs technical approval or publication.';
END; $$;

REVOKE ALL ON FUNCTION public.technically_approve_product_version(uuid, text, uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.publish_product_version(uuid, text, uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.technically_approve_guidance_mapping(uuid, text) FROM public, anon;
REVOKE ALL ON FUNCTION public.publish_guidance_mapping(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.technically_approve_product_version(uuid, text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.publish_product_version(uuid, text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.technically_approve_guidance_mapping(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.publish_guidance_mapping(uuid, text) TO authenticated, service_role;

-- ---------------------------------------------------------------- 2 --
-- Fail-closed professional read predicates.
CREATE OR REPLACE FUNCTION public.product_publicly_releasable(_product_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.professional_products p
    WHERE p.id = _product_id
      AND p.status IN ('approved','published')
      AND p.verification_status = 'verified'
      AND p.provisional = false
  );
$$;

CREATE OR REPLACE FUNCTION public.product_version_releasable(_version_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.product_versions v
    WHERE v.id = _version_id
      AND v.approval_status IN ('approved','published')
      AND v.verification_status = 'verified'
      AND v.provisional = false
      AND public.product_publicly_releasable(v.product_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.source_document_releasable(_document_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.source_documents d
    WHERE d.id = _document_id
      AND d.verification_status = 'verified'
      AND d.superseded_by IS NULL
      AND coalesce(d.document_state, 'current') NOT IN
          ('draft','private','superseded','pending_review','archived','withdrawn')
  );
$$;

GRANT EXECUTE ON FUNCTION public.product_publicly_releasable(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.product_version_releasable(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.source_document_releasable(uuid) TO authenticated, service_role;

-- product_versions
DROP POLICY IF EXISTS "Professionals read approved product versions" ON public.product_versions;
CREATE POLICY "Professionals read released product versions"
ON public.product_versions FOR SELECT TO authenticated
USING (
  public.can_read_professional_guidance(auth.uid())
  AND approval_status IN ('approved','published')
  AND verification_status = 'verified'
  AND provisional = false
  AND public.product_publicly_releasable(product_id)
);

-- product_source_documents (evidence links)
DROP POLICY IF EXISTS "Professionals read verified evidence links" ON public.product_source_documents;
CREATE POLICY "Professionals read released evidence links"
ON public.product_source_documents FOR SELECT TO authenticated
USING (
  public.can_read_professional_guidance(auth.uid())
  AND verification_status = 'verified'
  AND product_id IS NOT NULL AND public.product_publicly_releasable(product_id)
  AND product_version_id IS NOT NULL AND public.product_version_releasable(product_version_id)
  AND source_document_id IS NOT NULL AND public.source_document_releasable(source_document_id)
);

-- source_documents: verified, current documents only
DROP POLICY IF EXISTS "Professionals read verified source documents" ON public.source_documents;
CREATE POLICY "Professionals read verified source documents"
ON public.source_documents FOR SELECT TO authenticated
USING (
  public.can_read_professional_guidance(auth.uid())
  AND public.source_document_releasable(id)
);

-- product_manufacturer_claims
DROP POLICY IF EXISTS "Professionals read verified claims" ON public.product_manufacturer_claims;
CREATE POLICY "Professionals read released claims"
ON public.product_manufacturer_claims FOR SELECT TO authenticated
USING (
  public.can_read_professional_guidance(auth.uid())
  AND claim_status = 'verified'
  AND product_id IS NOT NULL AND public.product_publicly_releasable(product_id)
  AND product_version_id IS NOT NULL AND public.product_version_releasable(product_version_id)
  AND source_document_id IS NOT NULL AND public.source_document_releasable(source_document_id)
);

-- product_safety_data
DROP POLICY IF EXISTS "Professionals read verified safety data" ON public.product_safety_data;
CREATE POLICY "Professionals read released safety data"
ON public.product_safety_data FOR SELECT TO authenticated
USING (
  public.can_read_professional_guidance(auth.uid())
  AND verification_status = 'verified'
  AND product_version_id IS NOT NULL AND public.product_version_releasable(product_version_id)
);

-- product_instructions
DROP POLICY IF EXISTS "Professionals read approved instructions" ON public.product_instructions;
CREATE POLICY "Professionals read released instructions"
ON public.product_instructions FOR SELECT TO authenticated
USING (
  public.can_read_professional_guidance(auth.uid())
  AND approval_status IN ('approved','published')
  AND product_version_id IS NOT NULL AND public.product_version_releasable(product_version_id)
);

-- product_guidance_mappings
DROP POLICY IF EXISTS "Professionals read approved guidance mappings" ON public.product_guidance_mappings;
CREATE POLICY "Professionals read released guidance mappings"
ON public.product_guidance_mappings FOR SELECT TO authenticated
USING (
  public.can_read_professional_guidance(auth.uid())
  AND approval_status IN ('approved','published')
  AND verification_status = 'verified'
  AND provisional = false
  AND product_id IS NOT NULL AND public.product_publicly_releasable(product_id)
  AND product_version_id IS NOT NULL AND public.product_version_releasable(product_version_id)
  AND source_document_id IS NOT NULL AND public.source_document_releasable(source_document_id)
  AND EXISTS (
    SELECT 1 FROM public.stain_records r
    WHERE r.id = product_guidance_mappings.stain_record_id
      AND r.reroute_pending = false
  )
);

-- ---------------------------------------------------------------- 3 --
-- Concurrency-safe first-owner bootstrap.
-- Advisory key 748213590017 is reserved permanently for first-owner bootstrap.
CREATE OR REPLACE FUNCTION public.bootstrap_first_owner(target_user_id uuid, reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _exists boolean;
BEGIN
  -- Serialise every bootstrap attempt for the whole transaction so two
  -- simultaneous callers can never both pass the "no privileged user" check.
  PERFORM pg_advisory_xact_lock(748213590017);

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
END; $$;

REVOKE ALL ON FUNCTION public.bootstrap_first_owner(uuid, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_owner(uuid, text) TO service_role;