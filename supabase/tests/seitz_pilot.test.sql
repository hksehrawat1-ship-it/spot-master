-- =====================================================================
-- SEITZ 7-BOTTLE CONTROLLED PILOT — ACCEPTANCE TESTS
--
-- Executes SEITZ_PILOT_TEST_CHECKLIST.md against the real database:
-- real rows, real row-level security, real approval functions.
--
-- Temporary identities and roles are created inside an inner block that
-- is always rolled back. The pilot data itself is only read, never
-- modified. Only the pass/fail summary is kept, in
-- public.authorization_test_runs (results tagged "SEITZ-PILOT").
--
-- Run with trusted database authority:
--   run with service authority (auth schema access is required for the
--   temporary identities); psql alone cannot create test accounts
-- =====================================================================

DO $suite$
DECLARE
  res jsonb := '[]'::jsonb; ok boolean; err text; rc integer; n integer; j jsonb;
  u jsonb := '{}'::jsonb; r text; aborted text; tmp uuid;
  passed int := 0; failed int := 0;

  c_company uuid := 'ea96cf3e-1c39-41ca-a06d-54c0e2aa34d2';
  c_kit     uuid := '08553f05-6d6a-4660-be79-5cd6f72a2be9';
  c_stain   uuid := 'e6b8374a-0d3f-439c-9efa-78d1ab70479d';
  c_hash    text := '4b0d95e2395fc97dd643b4253a8d4fbe12e5cdcb47ba0cb636aad5086298660d';
  purasol   uuid := '0be8cec7-ad9e-4a9b-8a6f-7db98c769ad0';
  pura_v    uuid := '31b75e12-aba4-456c-a26b-4faab759ba88';
  lacol     uuid := '6487b85c-7985-4997-8b47-ef68940e2892';
  lacol_v   uuid := 'bda607c0-cb43-4171-951e-7cfd2730c064';
  colorsol  uuid := '8bbb550c-df06-43c1-9f63-347de71abd87';
  color_v   uuid := '411a2225-1f85-47e3-8c21-c2fe47d9a5ce';
  brochure  uuid;
  map_id    uuid;
  vids      uuid[] := ARRAY['31b75e12-aba4-456c-a26b-4faab759ba88','977040c7-a632-48ba-a974-bfbe9a2bac87',
                            'bda607c0-cb43-4171-951e-7cfd2730c064','d4b7bdce-e27a-4469-9219-4861c6dc4dee',
                            'a5e0770f-9a03-460f-9562-9e6367bc12e0','9dbc75f7-4448-41b4-bebe-ec5d6b0475d4',
                            '411a2225-1f85-47e3-8c21-c2fe47d9a5ce']::uuid[];
  vid uuid; all_blocked boolean;
BEGIN
  EXECUTE $f$
    CREATE FUNCTION pg_temp.as_user(uid uuid) RETURNS void AS $b$
    BEGIN
      EXECUTE 'RESET ROLE';
      PERFORM set_config('request.jwt.claims',
        json_build_object('sub', uid::text, 'role', 'authenticated')::text, true);
      EXECUTE 'SET LOCAL ROLE authenticated';
    END $b$ LANGUAGE plpgsql;
  $f$;
  EXECUTE $f$
    CREATE FUNCTION pg_temp.as_trusted() RETURNS void AS $b$
    BEGIN
      EXECUTE 'RESET ROLE';
      PERFORM set_config('request.jwt.claims', '', true);
    END $b$ LANGUAGE plpgsql;
  $f$;

  SELECT id INTO brochure FROM public.source_documents WHERE file_hash = c_hash;
  SELECT id INTO map_id FROM public.product_guidance_mappings
   WHERE mapping_ref = 'PGM-PILOT-SEITZ-PURASOL-NAIL-POLISH-IN';

  BEGIN
    -- =================================================================
    -- Baseline and identity
    -- =================================================================
    SELECT count(*) INTO n FROM public.stain_records;
    res := res || jsonb_build_object('test','I1 826 stain records unchanged','pass', n = 826, 'detail', n);

    SELECT count(*) INTO n FROM public.stain_categories WHERE category_number IS NOT NULL;
    res := res || jsonb_build_object('test','I2 12 active stain categories unchanged','pass', n = 12, 'detail', n);

    SELECT count(*) INTO n FROM public.companies WHERE company_name ILIKE 'seitz%';
    res := res || jsonb_build_object('test','I3 exactly one Seitz company record exists','pass', n = 1, 'detail', n);

    SELECT count(*) INTO n FROM public.product_kits WHERE kit_ref = 'KIT-SEITZ-LARGE';
    res := res || jsonb_build_object('test','I4 exactly one KIT-SEITZ-LARGE kit exists','pass', n = 1, 'detail', n);

    SELECT count(*) INTO n FROM public.kit_products WHERE kit_id = c_kit;
    res := res || jsonb_build_object('test','I5 the kit contains exactly seven product links','pass', n = 7, 'detail', n);

    SELECT count(DISTINCT position) INTO n FROM public.kit_products
     WHERE kit_id = c_kit AND position BETWEEN 1 AND 7;
    res := res || jsonb_build_object('test','I6 kit product links occupy positions 1 to 7','pass', n = 7, 'detail', n);

    SELECT count(*) INTO n FROM public.professional_products WHERE company_id = c_company AND kit_id = c_kit;
    res := res || jsonb_build_object('test','I7 exactly seven products belong to the Large Super Spotting Line, no duplicates','pass', n = 7, 'detail', n);

    SELECT count(*) INTO n FROM public.professional_products WHERE company_id = c_company;
    res := res || jsonb_build_object('test','I7b the pilot created no extra Seitz product (14 pre-existing across three kits)','pass', n = 14, 'detail', n);

    SELECT count(*) INTO n FROM (
      SELECT product_ref FROM public.professional_products WHERE company_id = c_company
      GROUP BY product_ref HAVING count(*) > 1) d;
    res := res || jsonb_build_object('test','I8 Seitz product references are unique, no duplicates','pass', n = 0, 'detail', n);

    SELECT count(*) INTO n FROM public.product_versions
     WHERE product_id IN (SELECT id FROM public.professional_products
                           WHERE company_id = c_company AND kit_id = c_kit);
    res := res || jsonb_build_object('test','I9 each of the seven kit products has exactly one staging version','pass', n = 7, 'detail', n);

    SELECT count(*) INTO n FROM public.product_versions v
     WHERE v.id = ANY(vids) AND v.version_ref = 'staging-v1'
       AND v.product_id IN (SELECT id FROM public.professional_products
                             WHERE company_id = c_company AND kit_id = c_kit);
    res := res || jsonb_build_object('test','I10 every staging version belongs to its own Seitz product','pass', n = 7, 'detail', n);

    -- =================================================================
    -- Source separation and idempotency
    -- =================================================================
    SELECT count(*) INTO n FROM public.source_documents WHERE file_hash = c_hash;
    res := res || jsonb_build_object('test','S-DOC1 the brochure hash exists exactly once','pass', n = 1, 'detail', n);

    SELECT count(*) INTO n FROM public.source_documents
     WHERE id = brochure AND source_role = 'manufacturer_brochure'
       AND printed_identifier = '8002/21' AND issuer = 'SEITZ GmbH'
       AND publication_date IS NULL AND currentness = 'not_confirmed'
       AND verification_status = 'pending_review' AND document_state <> 'published';
    res := res || jsonb_build_object('test','S-DOC2 brochure stored as pending, not current, not published','pass', n = 1);

    SELECT count(*) INTO n FROM public.source_documents
     WHERE id = '5a5794b8-37ad-4fb8-beb7-d18d836c2ae2' AND source_role = 'internal_gilm_guide';
    res := res || jsonb_build_object('test','S-DOC3 the GILM guide stays an internal guide','pass', n = 1);

    SELECT count(*) INTO n FROM public.source_documents
     WHERE id = '53f3afae-422a-4bc6-8d8d-6c1ae26e9ad1' AND source_role = 'manufacturer_spotting_chart';
    res := res || jsonb_build_object('test','S-DOC4 the Seitz chart stays a manufacturer spotting chart','pass', n = 1);

    SELECT count(DISTINCT source_role) INTO n FROM public.source_documents
     WHERE id IN (brochure,'5a5794b8-37ad-4fb8-beb7-d18d836c2ae2','53f3afae-422a-4bc6-8d8d-6c1ae26e9ad1');
    res := res || jsonb_build_object('test','S-DOC5 three sources keep three distinct roles','pass', n = 3, 'detail', n);

    SELECT count(*) INTO n FROM public.product_source_documents
     WHERE source_document_id = brochure AND document_role = 'manufacturer_brochure';
    res := res || jsonb_build_object('test','S-LNK1 brochure linked to exactly seven product versions','pass', n = 7, 'detail', n);

    SELECT count(*) INTO n FROM public.product_source_documents
     WHERE source_document_id = brochure
       AND (page_reference IS NULL OR verification_status <> 'pending_review' OR notes IS NULL);
    res := res || jsonb_build_object('test','S-LNK2 every link carries a page, pending status and review note','pass', n = 0, 'detail', n);

    SELECT count(*) INTO n FROM (
      SELECT product_id, product_version_id, source_document_id, document_role
        FROM public.product_source_documents
       GROUP BY 1,2,3,4 HAVING count(*) > 1) d;
    res := res || jsonb_build_object('test','S-LNK3 no duplicate product-source links exist','pass', n = 0, 'detail', n);

    SELECT count(*) INTO n FROM public.product_source_documents psd
      JOIN public.product_versions v ON v.id = psd.product_version_id
     WHERE psd.source_document_id = brochure AND v.product_id <> psd.product_id;
    res := res || jsonb_build_object('test','S-LNK4 each link points at its own product version','pass', n = 0, 'detail', n);

    -- Legacy tables untouched by this pilot
    SELECT count(*) INTO n FROM public.product_stain_mappings;
    SELECT count(*) + n INTO n FROM public.product_mappings;
    SELECT count(*) + n INTO n FROM public.manufacturer_products;
    res := res || jsonb_build_object('test','S-LEG1 no legacy mapping tables were used','pass', n = 0, 'detail', n);

    -- =================================================================
    -- Claims and restrictions
    -- =================================================================
    SELECT count(*) INTO n FROM public.product_manufacturer_claims
     WHERE source_document_id = brochure AND claim_status = 'provisional';
    res := res || jsonb_build_object('test','C1 manufacturer claims stored as provisional','pass', n = 70, 'detail', n);

    SELECT count(*) INTO n FROM public.product_manufacturer_claims
     WHERE source_document_id = brochure AND (section_reference IS NULL OR source_document_id IS NULL);
    res := res || jsonb_build_object('test','C2 every claim cites a document and page','pass', n = 0, 'detail', n);

    SELECT count(*) INTO n FROM public.product_manufacturer_claims
     WHERE source_document_id = brochure AND claim_status IN ('verified','approved');
    res := res || jsonb_build_object('test','C3 no claim is verified by the internal guide or otherwise','pass', n = 0, 'detail', n);

    SELECT count(*) INTO n FROM public.product_restrictions
     WHERE condition_key = 'fabric_unknown_or_untested' AND product_version_id = ANY(vids);
    res := res || jsonb_build_object('test','C4 hidden-seam test recorded for all seven products','pass', n = 7, 'detail', n);

    -- Missing safety information must be absent/pending, never asserted as safe
    SELECT count(*) INTO n FROM public.product_safety_data WHERE product_version_id = ANY(vids);
    res := res || jsonb_build_object('test','C5 no SDS record is invented for any staging version','pass', n = 0, 'detail', n);

    SELECT count(*) INTO n FROM public.product_versions
     WHERE id = ANY(vids) AND (sds_version IS NOT NULL OR tds_version IS NOT NULL);
    res := res || jsonb_build_object('test','C6 no SDS or TDS version is invented for any staging version','pass', n = 0, 'detail', n);

    SELECT count(*) INTO n FROM public.product_versions
     WHERE id = ANY(vids) AND label_version = 'GB 12/2008';
    res := res || jsonb_build_object('test','C6b the pre-existing printed label reference is left untouched','pass', n = 7, 'detail', n);

    SELECT count(*) INTO n FROM public.professional_products
     WHERE company_id = c_company AND kit_id = c_kit
       AND (coalesce(ppe,'') NOT IN ('','Not disclosed')
         OR coalesce(dilution_instruction,'') NOT IN ('','Not disclosed')
         OR coalesce(contact_time,'') NOT IN ('','Not disclosed')
         OR coalesce(temperature_limits,'') NOT IN ('','Not disclosed')
         OR coalesce(active_chemistry,'') NOT IN ('','Not disclosed')
         OR coalesce(ventilation,'') NOT IN ('','Not disclosed'));
    res := res || jsonb_build_object('test','C7 no PPE, dilution, contact time, temperature or chemistry invented','pass', n = 0, 'detail', n);

    SELECT count(*) INTO n FROM public.product_instructions WHERE product_version_id = ANY(vids);
    res := res || jsonb_build_object('test','C8 no user-facing procedure was created','pass', n = 0, 'detail', n);

    SELECT count(*) INTO n FROM public.product_conflicts
     WHERE product_id = colorsol AND resolved = false AND blocks_publication = true;
    res := res || jsonb_build_object('test','C9 Colorsol source conflict recorded and unresolved','pass', n = 1, 'detail', n);

    -- =================================================================
    -- Safety behaviour tests S1 - S5 (real restriction rows)
    -- =================================================================
    SELECT count(*) INTO n FROM public.product_restrictions
     WHERE product_version_id = pura_v AND condition_key = 'fabric_unknown_or_untested'
       AND severity = 'required_test';
    SELECT count(*) + n INTO n FROM public.product_guidance_mappings
     WHERE id = map_id AND mandatory_hidden_test = true
       AND approval_status = 'draft' AND suitability = 'insufficient_information';
    res := res || jsonb_build_object('test','S1 unknown fabric requires a hidden test and offers no approved procedure','pass', n = 2, 'detail', n);

    SELECT count(*) INTO n FROM public.product_restrictions
     WHERE condition_key = 'machine_uses_hydrocarbon_or_silicone_solvent'
       AND severity = 'stop' AND operator_override_allowed = false
       AND product_id IN (purasol,'a84f0dcb-0c1f-43d0-b440-2f38d3d8d402'::uuid, lacol);
    res := res || jsonb_build_object('test','S2 Purasol, Quickol and Lacol hard-stop in hydrocarbon or silicone machines, no override','pass', n = 3, 'detail', n);

    SELECT count(*) INTO n FROM public.product_restrictions
     WHERE product_id = lacol AND condition_key = 'coating_or_lamination' AND severity = 'stop';
    res := res || jsonb_build_object('test','S3 Lacol hard-stops on coatings or laminations','pass', n = 1, 'detail', n);

    SELECT count(*) INTO n FROM public.product_restrictions
     WHERE product_id = lacol AND condition_key = 'acetate_fibre_or_acetate_dye'
       AND severity = 'warning' AND statement ILIKE '%may be damaged%';
    res := res || jsonb_build_object('test','S4 Lacol warns that acetate dyes may be damaged, no guaranteed outcome','pass', n = 1, 'detail', n);

    SELECT count(*) INTO n FROM public.product_restrictions
     WHERE product_id = colorsol AND severity = 'stop'
       AND condition_key IN ('coloured_acetate_silk','coloured_polyamide');
    res := res || jsonb_build_object('test','S5 Colorsol hard-stops on coloured acetate silk and coloured polyamide','pass', n = 2, 'detail', n);

    -- =================================================================
    -- Temporary identities for the role and approval tests
    -- =================================================================
    FOREACH r IN ARRAY ARRAY['owner','technical_reviewer','administrator','content_admin',
                             'content_editor','dry_cleaner','professional_spotter','domestic_user'] LOOP
      INSERT INTO auth.users(id, email, instance_id, aud, role)
      VALUES (gen_random_uuid(), 'zzseitz-'||r||'@example.invalid',
              '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
        RETURNING id INTO tmp;
      INSERT INTO public.user_roles(user_id, role) VALUES (tmp, r::public.app_role);
      u := u || jsonb_build_object(r, tmp::text);
    END LOOP;

    -- ---- S6 approval blocked by missing SDS/TDS/label/PPE ----------
    all_blocked := true;
    PERFORM pg_temp.as_user((u->>'owner')::uuid);
    FOREACH vid IN ARRAY vids LOOP
      BEGIN j := public.technically_approve_product_version(vid, 'Pilot approval attempt');
      EXCEPTION WHEN others THEN j := jsonb_build_object('ok', false, 'blockers', to_jsonb(ARRAY[SQLERRM])); END;
      IF coalesce((j->>'ok')::boolean, false) THEN all_blocked := false; END IF;
      IF vid = pura_v THEN err := j::text; END IF;
    END LOOP;
    PERFORM pg_temp.as_trusted();
    res := res || jsonb_build_object('test','S6a technical approval is refused for all seven staging versions','pass', all_blocked);
    res := res || jsonb_build_object('test','S6b blocker list names the missing SDS or TDS evidence','pass',
      (err ILIKE '%SDS%' OR err ILIKE '%TDS%') AND err NOT ILIKE '%malformed%', 'detail', err);

    SELECT count(*) INTO n FROM public.product_versions
     WHERE id = ANY(vids) AND (approval_status <> 'draft' OR verification_status = 'verified' OR provisional = false);
    res := res || jsonb_build_object('test','S6c no version changed to approved, verified or published','pass', n = 0, 'detail', n);

    PERFORM pg_temp.as_user((u->>'owner')::uuid);
    BEGIN j := public.technically_approve_guidance_mapping(map_id, 'Pilot mapping approval attempt');
    EXCEPTION WHEN others THEN j := jsonb_build_object('ok', false, 'blockers', to_jsonb(ARRAY[SQLERRM])); END;
    PERFORM pg_temp.as_trusted();
    res := res || jsonb_build_object('test','S6d technical approval of the pilot mapping is refused','pass',
      NOT coalesce((j->>'ok')::boolean, false) AND j::text NOT ILIKE '%malformed%', 'detail', j::text);

    PERFORM pg_temp.as_user((u->>'content_admin')::uuid);
    BEGIN j := public.publish_guidance_mapping(map_id, 'Publisher bypass attempt');
    EXCEPTION WHEN others THEN j := jsonb_build_object('ok', false, 'blockers', to_jsonb(ARRAY[SQLERRM])); END;
    PERFORM pg_temp.as_trusted();
    res := res || jsonb_build_object('test','R5 a publisher cannot bypass technical approval','pass',
      NOT coalesce((j->>'ok')::boolean, false) AND j::text NOT ILIKE '%malformed%', 'detail', j::text);

    PERFORM pg_temp.as_user((u->>'content_admin')::uuid);
    BEGIN j := public.publish_product_version(pura_v, 'Publisher bypass attempt');
    EXCEPTION WHEN others THEN j := jsonb_build_object('ok', false, 'blockers', to_jsonb(ARRAY[SQLERRM])); END;
    PERFORM pg_temp.as_trusted();
    res := res || jsonb_build_object('test','R5b a publisher cannot publish an unapproved staging version','pass',
      NOT coalesce((j->>'ok')::boolean, false) AND j::text NOT ILIKE '%malformed%', 'detail', j::text);

    -- =================================================================
    -- Pilot mapping content
    -- =================================================================
    SELECT count(*) INTO n FROM public.product_guidance_mappings;
    res := res || jsonb_build_object('test','M1 exactly one guidance mapping exists in the whole database','pass', n = 1, 'detail', n);

    SELECT count(*) INTO n FROM public.product_guidance_mappings
     WHERE id = map_id AND product_id = purasol AND product_version_id = pura_v
       AND stain_record_id = c_stain AND country = 'IN'
       AND decision = 'not_assessed' AND suitability = 'insufficient_information'
       AND evidence_level = 'manufacturer_claim' AND approval_status = 'draft'
       AND verification_status = 'unverified' AND provisional = true
       AND mandatory_hidden_test = true AND source_document_id = brochure
       AND source_section ILIKE '%page 3%';
    res := res || jsonb_build_object('test','M2 pilot mapping matches the package exactly and stays draft','pass', n = 1);

    SELECT count(*) INTO n FROM public.product_guidance_mappings m
      JOIN public.stain_records s ON s.id = m.stain_record_id
     WHERE m.id = map_id AND s.stable_id = 'SM-CAT-04-NAIL-POLISH';
    res := res || jsonb_build_object('test','M3 mapping resolves to the exact nail polish stable ID','pass', n = 1);

    SELECT count(*) INTO n FROM public.product_guidance_mappings m
      JOIN public.stain_records s ON s.id = m.stain_record_id
     WHERE s.stable_id = 'SM-CAT-01-NAIL-POLISH-WITH-HAND-CREAM';
    res := res || jsonb_build_object('test','M4 mapping is not confused with nail polish with hand cream','pass', n = 0, 'detail', n);

    SELECT count(*) INTO n FROM public.product_guidance_mappings
     WHERE approval_status IN ('approved','published');
    res := res || jsonb_build_object('test','M5 zero approved or published guidance mappings','pass', n = 0, 'detail', n);

    SELECT count(*) INTO n FROM public.professional_products
     WHERE company_id = c_company AND (status IN ('approved','published') OR verification_status = 'verified');
    res := res || jsonb_build_object('test','M6 no Seitz product is approved, published or verified','pass', n = 0, 'detail', n);

    -- =================================================================
    -- Role visibility under real RLS
    -- =================================================================
    FOREACH r IN ARRAY ARRAY['domestic_user','dry_cleaner','professional_spotter'] LOOP
      PERFORM pg_temp.as_user((u->>r)::uuid);
      SELECT count(*) INTO n FROM public.product_guidance_mappings WHERE id = map_id;
      res := res || jsonb_build_object('test','R1 '||r||' cannot see the provisional pilot mapping','pass', n = 0, 'detail', n);
      SELECT count(*) INTO n FROM public.professional_products WHERE company_id = c_company AND kit_id = c_kit;
      res := res || jsonb_build_object('test','R2 '||r||' cannot see draft Seitz product identities','pass', n = 0, 'detail', n);
      SELECT count(*) INTO n FROM public.source_documents WHERE id = brochure;
      res := res || jsonb_build_object('test','R3 '||r||' cannot see the pending brochure','pass', n = 0, 'detail', n);
      SELECT count(*) INTO n FROM public.product_restrictions WHERE product_version_id = ANY(vids);
      res := res || jsonb_build_object('test','R4 '||r||' cannot see provisional restrictions','pass', n = 0, 'detail', n);
    END LOOP;
    PERFORM pg_temp.as_trusted();

    EXECUTE 'RESET ROLE'; PERFORM set_config('request.jwt.claims','', true); EXECUTE 'SET LOCAL ROLE anon';
    BEGIN SELECT count(*) INTO n FROM public.product_guidance_mappings; EXCEPTION WHEN others THEN n := 0; END;
    res := res || jsonb_build_object('test','R6 signed-out visitors see no guidance mapping','pass', n = 0, 'detail', n);
    BEGIN SELECT count(*) INTO n FROM public.product_restrictions; EXCEPTION WHEN others THEN n := 0; END;
    res := res || jsonb_build_object('test','R7 signed-out visitors see no product restrictions','pass', n = 0, 'detail', n);
    PERFORM pg_temp.as_trusted();

    -- content editor may edit draft identity but may not approve
    PERFORM pg_temp.as_user((u->>'content_editor')::uuid);
    BEGIN
      EXECUTE format('UPDATE public.professional_products SET odour_description = %L WHERE id = %L','zz', purasol);
      GET DIAGNOSTICS rc = ROW_COUNT;
    EXCEPTION WHEN others THEN rc := -1; END;
    res := res || jsonb_build_object('test','R8 a content editor may edit draft identity data','pass', rc = 1, 'rows', rc);
    BEGIN PERFORM public.technically_approve_product_version(pura_v,'Editor attempt'); ok := true;
    EXCEPTION WHEN others THEN ok := false; END;
    res := res || jsonb_build_object('test','R9 a content editor cannot technically approve','pass', ok = false);
    PERFORM pg_temp.as_trusted();

    -- maintainer visibility
    PERFORM pg_temp.as_user((u->>'technical_reviewer')::uuid);
    SELECT count(*) INTO n FROM public.product_guidance_mappings WHERE id = map_id;
    SELECT count(*) + n INTO n FROM public.product_restrictions WHERE product_version_id = pura_v;
    res := res || jsonb_build_object('test','R10 a maintainer can see the draft mapping and its restrictions','pass', n >= 2, 'detail', n);
    PERFORM pg_temp.as_trusted();

    -- owner action recorded in the audit log
    SELECT count(*) INTO n FROM public.product_audit_log
     WHERE action = 'pilot_import' AND field_key = 'seitz_large_super_spotting_line'
       AND new_value ILIKE '%package_version=1.0%' AND new_value ILIKE '%'||c_hash||'%'
       AND changed_by IS NOT NULL AND created_at IS NOT NULL;
    res := res || jsonb_build_object('test','R11 one import audit entry records package version, hash, actor and time','pass', n = 1, 'detail', n);

    -- =================================================================
    -- Re-import and rollback
    -- =================================================================
    SELECT count(*) INTO rc FROM public.product_source_documents WHERE source_document_id = brochure;
    BEGIN
      INSERT INTO public.product_source_documents (product_id, product_version_id, source_document_id,
             document_role, verification_status)
      VALUES (purasol, pura_v, brochure, 'manufacturer_brochure', 'pending_review');
      ok := true;
    EXCEPTION WHEN unique_violation THEN ok := false; END;
    SELECT count(*) INTO n FROM public.product_source_documents WHERE source_document_id = brochure;
    res := res || jsonb_build_object('test','X1 a repeat link insert is rejected and creates no duplicate','pass',
      ok = false AND n = rc, 'detail', n);

    BEGIN
      INSERT INTO public.source_documents (document_title, document_type, file_hash)
      VALUES ('Duplicate brochure attempt', 'manufacturer_instruction', c_hash);
      ok := true;
    EXCEPTION WHEN unique_violation THEN ok := false; END;
    SELECT count(*) INTO n FROM public.source_documents WHERE file_hash = c_hash;
    res := res || jsonb_build_object('test','X2 re-importing the same file creates no second source document','pass',
      ok = false AND n = 1, 'detail', n);

    BEGIN
      INSERT INTO public.product_guidance_mappings(mapping_ref, product_id, product_version_id,
             stain_record_id, decision, country, evidence_level, source_document_id, source_section, review_note)
      VALUES ('PGM-PILOT-SEITZ-PURASOL-NAIL-POLISH-IN', purasol, pura_v, c_stain, 'not_assessed', 'IN',
              'manufacturer_claim', brochure, 'page 3', 'duplicate attempt');
      ok := true;
    EXCEPTION WHEN unique_violation THEN ok := false; END;
    SELECT count(*) INTO n FROM public.product_guidance_mappings;
    res := res || jsonb_build_object('test','X3 a repeat pilot mapping is rejected, still exactly one mapping','pass',
      ok = false AND n = 1, 'detail', n);

    -- a failing batch rolls the whole batch back, not just the last row
    SELECT count(*) INTO rc FROM public.product_restrictions;
    BEGIN
      INSERT INTO public.product_restrictions(product_id, product_version_id, rule_kind, condition_key,
             severity, statement)
      VALUES (purasol, pura_v, 'warning', 'zz_rollback_probe_a', 'warning', 'probe a');
      INSERT INTO public.product_restrictions(product_id, product_version_id, rule_kind, condition_key,
             severity, statement)
      VALUES (purasol, pura_v, 'not_a_valid_kind', 'zz_rollback_probe_b', 'warning', 'probe b');
      ok := true;
    EXCEPTION WHEN others THEN ok := false; END;
    SELECT count(*) INTO n FROM public.product_restrictions;
    res := res || jsonb_build_object('test','X4 a failed batch rolls back completely, leaving no partial rows','pass',
      ok = false AND n = rc, 'detail', n);

    SELECT count(*) INTO n FROM public.stain_records;
    res := res || jsonb_build_object('test','X5 rollback leaves the 826 stain records unchanged','pass', n = 826, 'detail', n);

    SELECT count(*) INTO n FROM public.professional_products WHERE company_id <> c_company;
    res := res || jsonb_build_object('test','X6 non-Seitz companies and products are unchanged','pass', n = 18, 'detail', n);

    PERFORM pg_temp.as_trusted();
    RAISE EXCEPTION 'ZZSEITZ_ROLLBACK';
  EXCEPTION WHEN others THEN
    EXECUTE 'RESET ROLE';
    IF SQLERRM <> 'ZZSEITZ_ROLLBACK' THEN aborted := SQLERRM; END IF;
  END;

  SELECT count(*) FILTER (WHERE (e->>'pass')::boolean),
         count(*) FILTER (WHERE NOT (e->>'pass')::boolean)
    INTO passed, failed FROM jsonb_array_elements(res) e;

  INSERT INTO public.authorization_test_runs(total, passed, failed, aborted_with, results)
  VALUES (passed + failed, passed, failed, aborted,
          jsonb_build_object('suite','SEITZ-PILOT') || jsonb_build_object('tests', res));
END
$suite$;
