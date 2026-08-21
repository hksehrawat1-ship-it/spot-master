CREATE OR REPLACE FUNCTION public.product_version_publication_readiness(_version_id uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v record; c record; p record; blockers text[] := '{}'; kit_ok boolean;
BEGIN
  SELECT * INTO v FROM public.product_versions WHERE id = _version_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ready', false, 'blockers', to_jsonb(ARRAY['Product version not found.'::text])); END IF;
  SELECT * INTO p FROM public.professional_products WHERE id = v.product_id;
  SELECT * INTO c FROM public.companies WHERE id = p.company_id;

  IF c IS NULL OR c.verification_status <> 'verified' THEN blockers := blockers || 'Company is not verified.'::text; END IF;
  SELECT EXISTS (SELECT 1 FROM public.kit_products kp JOIN public.product_kits k ON k.id = kp.kit_id
                 WHERE kp.product_id = p.id AND k.source_status = 'verified') INTO kit_ok;
  IF NOT kit_ok THEN blockers := blockers || 'No verified kit contains this product.'::text; END IF;
  IF p.verification_status <> 'verified' THEN blockers := blockers || 'Product identity is not verified.'::text; END IF;
  IF p.provisional THEN blockers := blockers || 'Product is still marked provisional.'::text; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.product_source_documents d WHERE d.product_version_id = v.id)
    THEN blockers := blockers || 'No source document is linked to this product version.'::text; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.product_manufacturer_claims mc WHERE mc.product_version_id = v.id AND mc.source_document_id IS NOT NULL)
    THEN blockers := blockers || 'No manufacturer claim with an identified source document.'::text; END IF;
  IF coalesce(nullif(btrim(coalesce(p.safety_warnings,'')),''),'') = ''
    THEN blockers := blockers || 'No safety warning is recorded.'::text; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.product_safety_data s WHERE s.product_version_id = v.id)
    THEN blockers := blockers || 'SDS status is unknown for this version.'::text; END IF;
  IF coalesce(v.tds_version,'') = '' AND coalesce(v.label_version,'') = ''
    THEN blockers := blockers || 'TDS or label status is unknown for this version.'::text; END IF;
  IF coalesce(v.country,'') = '' THEN blockers := blockers || 'Country applicability is unknown.'::text; END IF;
  IF coalesce(nullif(btrim(coalesce(p.ppe,'')),''),'') = ''
    THEN blockers := blockers || 'Required PPE is neither recorded nor explicitly marked as not disclosed.'::text; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.product_instructions i WHERE i.product_version_id = v.id AND i.source_document_id IS NOT NULL)
    THEN blockers := blockers || 'No source-backed instructions exist for this version.'::text; END IF;
  IF EXISTS (SELECT 1 FROM public.product_conflicts pc WHERE pc.product_id = p.id AND pc.resolved = false)
    THEN blockers := blockers || 'Unresolved product conflicts exist.'::text; END IF;
  IF coalesce(nullif(btrim(coalesce(v.reviewer,'')),''),'') = ''
    THEN blockers := blockers || 'No reviewer is assigned to this version.'::text; END IF;

  RETURN jsonb_build_object('ready', cardinality(blockers) = 0, 'blockers', to_jsonb(blockers),
                            'version_id', v.id, 'product_id', p.id);
END; $function$;

CREATE OR REPLACE FUNCTION public.guidance_mapping_publication_readiness(_mapping_id uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE m record; sr record; vready jsonb; blockers text[] := '{}';
BEGIN
  SELECT * INTO m FROM public.product_guidance_mappings WHERE id = _mapping_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ready', false, 'blockers', to_jsonb(ARRAY['Mapping not found.'::text])); END IF;
  SELECT * INTO sr FROM public.stain_records WHERE id = m.stain_record_id;
  IF sr IS NULL THEN blockers := blockers || 'Stain record not found.'::text; END IF;
  IF sr.reroute_pending THEN blockers := blockers || 'This stain record still has a pending reroute review.'::text; END IF;
  IF m.source_document_id IS NULL THEN blockers := blockers || 'No source document cited.'::text; END IF;
  IF coalesce(btrim(coalesce(m.source_section,'')),'') = '' THEN blockers := blockers || 'No source section cited.'::text; END IF;
  IF m.evidence_level = 'none' THEN blockers := blockers || 'Evidence level is "none".'::text; END IF;
  IF coalesce(btrim(coalesce(m.review_note,'')),'') = '' THEN blockers := blockers || 'No technical review note.'::text; END IF;
  IF m.reviewer IS NULL THEN blockers := blockers || 'No reviewer assigned.'::text; END IF;
  vready := public.product_version_publication_readiness(m.product_version_id);
  IF NOT (vready->>'ready')::boolean THEN
    blockers := blockers || ('Product version is not publication ready: ' ||
      coalesce(array_to_string(ARRAY(SELECT jsonb_array_elements_text(vready->'blockers')), ' '), ''))::text;
  END IF;
  RETURN jsonb_build_object('ready', cardinality(blockers) = 0, 'blockers', to_jsonb(blockers));
END; $function$;

CREATE OR REPLACE FUNCTION public.publish_guidance_mapping(_mapping_id uuid, _reason text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
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
    RETURN jsonb_build_object('ok', false, 'blockers', to_jsonb(ARRAY['Mapping not found.'::text]));
  END IF;
  IF m.approval_status <> 'approved' THEN
    blockers := blockers || 'This mapping has not been technically approved.'::text;
  END IF;
  IF m.reviewer IS NULL OR m.reviewed_at IS NULL THEN
    blockers := blockers || 'Technical approval has no recorded reviewer and timestamp.'::text;
  END IF;
  IF m.verification_status <> 'verified' THEN blockers := blockers || 'Mapping is not verified.'::text; END IF;
  IF m.provisional THEN blockers := blockers || 'Mapping is still provisional.'::text; END IF;
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
END; $function$;

CREATE OR REPLACE FUNCTION public.publish_product_version(_version_id uuid, _reason text, _source_document_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
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
    RETURN jsonb_build_object('ok', false, 'blockers', to_jsonb(ARRAY['Product version not found.'::text]));
  END IF;
  IF v.approval_status <> 'approved' THEN
    blockers := blockers || 'This version has not been technically approved.'::text;
  END IF;
  IF v.technically_approved_by IS NULL OR v.technically_approved_at IS NULL
     OR coalesce(btrim(coalesce(v.reviewer,'')),'') = '' THEN
    blockers := blockers || 'Technical approval has no recorded reviewer and timestamp.'::text;
  END IF;
  IF v.verification_status <> 'verified' THEN
    blockers := blockers || 'Product version is not verified.'::text;
  END IF;
  IF v.provisional THEN blockers := blockers || 'Product version is still provisional.'::text; END IF;
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
END; $function$;