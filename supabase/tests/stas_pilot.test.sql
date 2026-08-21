-- =====================================================================
-- STAS STASTAIN-N CONTROLLED PILOT — ACCEPTANCE TESTS
--
-- Executes STAS_PILOT_TEST_CHECKLIST.md against the real database:
-- real rows, real row-level security, real approval functions.
--
-- Temporary identities are created inside an inner block that is always
-- rolled back. The pilot data itself is only read, never modified.
-- Only the pass/fail summary is kept, in public.authorization_test_runs
-- (results tagged "STAS-PILOT").
-- =====================================================================

DO $suite$
DECLARE
  res jsonb := '[]'::jsonb; ok boolean; err text; rc integer; n integer; j jsonb;
  u jsonb := '{}'::jsonb; r text; aborted text; tmp uuid;
  passed int := 0; failed int := 0;

  c_company uuid := '65b42a5e-75f1-4d3c-80bf-f210b7b5e1a1';
  c_kit     uuid := '2636f972-07cb-40d0-bcd9-82a750352cba';
  c_doc     uuid := '62011b81-523e-4541-8db2-16e2b020ff9c';
  c_stain   uuid := '807c7f5b-cbe9-4143-8c42-e3e5ea3d63ba';
  c_hash    text := 'b15749bcfd7d11b7b79cc1a1f760341d91d40d77a5d469a0702c99332c33f02f';
  n2        uuid := '47d70b62-f8df-469a-8d41-dda50c49184f';
  n2_v      uuid := '62863cb2-a2bb-4ea7-ad5e-ca94e350ddb4';
  map_id    uuid;
  vids      uuid[];
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

  SELECT id INTO map_id FROM public.product_guidance_mappings
   WHERE mapping_ref = 'MAP-STAS-N2-SM-CAT-04-BALLPOINT-INK';
  SELECT array_agg(v.id) INTO vids FROM public.product_versions v
    JOIN public.professional_products p ON p.id = v.product_id
   WHERE p.company_id = c_company;

  BEGIN
    -- =================================================================
    -- 1. One company, one kit, nine products, no duplicates
    -- =================================================================
    SELECT count(*) INTO n FROM public.companies
     WHERE company_name ILIKE 'stas%' OR company_name ILIKE '%stash%';
    res := res || jsonb_build_object('test','T1a exactly one STAS company record','pass', n = 1, 'detail', n);

    SELECT count(*) INTO n FROM public.product_kits WHERE company_id = c_company;
    res := res || jsonb_build_object('test','T1b exactly one STAS kit (STASTAIN-N KIT)','pass', n = 1, 'detail', n);

    SELECT count(*) INTO n FROM public.product_kits
     WHERE id = c_kit AND kit_name = 'STASTAIN-N KIT' AND product_count_claimed = 9;
    res := res || jsonb_build_object('test','T1c the kit is the STASTAIN-N KIT claiming nine products','pass', n = 1);

    SELECT count(*) INTO n FROM (
      SELECT product_ref FROM public.professional_products WHERE company_id = c_company
      GROUP BY product_ref HAVING count(*) > 1) d;
    res := res || jsonb_build_object('test','T1d no duplicate STAS product reference','pass', n = 0, 'detail', n);

    -- =================================================================
    -- 2. Nine product identities resolved
    -- =================================================================
    SELECT count(*) INTO n FROM public.professional_products WHERE company_id = c_company;
    res := res || jsonb_build_object('test','T2a exactly nine STAS product identities','pass', n = 9, 'detail', n);

    SELECT count(*) INTO n FROM public.kit_products WHERE kit_id = c_kit;
    res := res || jsonb_build_object('test','T2b nine products linked to the kit','pass', n = 9, 'detail', n);

    SELECT count(*) INTO n FROM public.professional_products
     WHERE company_id = c_company AND product_name IN
       ('STASTAIN N1','STASTAIN N2','STASTAIN N3','STASTAIN N4','STASTAIN N5',
        'STASTAIN N6','STASTAIN SPL','STASTAIN RYG','STASTAIN CLR');
    res := res || jsonb_build_object('test','T2c all nine chart product names resolve','pass', n = 9, 'detail', n);

    SELECT count(*) INTO n FROM public.product_versions
     WHERE product_id IN (SELECT id FROM public.professional_products WHERE company_id = c_company);
    res := res || jsonb_build_object('test','T2d each product has exactly one staging version','pass', n = 9, 'detail', n);

    -- =================================================================
    -- 3. SHA-256 dedupe / idempotency of the source
    -- =================================================================
    SELECT count(*) INTO n FROM public.source_documents WHERE file_hash = c_hash;
    res := res || jsonb_build_object('test','T3a the chart hash exists exactly once','pass', n = 1, 'detail', n);

    BEGIN
      INSERT INTO public.source_documents (document_title, document_type, file_hash)
      VALUES ('Duplicate STAS chart attempt', 'spotting_chart', c_hash);
      ok := true;
    EXCEPTION WHEN unique_violation THEN ok := false; END;
    SELECT count(*) INTO n FROM public.source_documents WHERE file_hash = c_hash;
    res := res || jsonb_build_object('test','T3b re-importing the same file creates no second source','pass',
      ok = false AND n = 1, 'detail', n);

    SELECT count(*) INTO rc FROM public.product_source_documents WHERE source_document_id = c_doc;
    BEGIN
      INSERT INTO public.product_source_documents (product_id, product_version_id, source_document_id,
             document_role, verification_status)
      VALUES (n2, n2_v, c_doc, 'manufacturer_spotting_chart', 'unverified');
      ok := true;
    EXCEPTION WHEN unique_violation THEN ok := false; END;
    SELECT count(*) INTO n FROM public.product_source_documents WHERE source_document_id = c_doc;
    res := res || jsonb_build_object('test','T3c a repeat evidence link is rejected, no duplicate','pass',
      ok = false AND n = rc AND n = 9, 'detail', n);

    BEGIN
      INSERT INTO public.quarantined_source_instructions
        (source_document_id, instruction_text, quarantine_reason)
      VALUES (c_doc, 'Rust: N5 and scrub.', 'duplicate attempt');
      ok := true;
    EXCEPTION WHEN unique_violation THEN ok := false; END;
    SELECT count(*) INTO n FROM public.quarantined_source_instructions WHERE source_document_id = c_doc;
    res := res || jsonb_build_object('test','T3d a repeat quarantined instruction is rejected','pass',
      ok = false AND n = 7, 'detail', n);

    -- =================================================================
    -- 4. Manufacturer claims stay separate from approved guidance
    -- =================================================================
    SELECT count(*) INTO n FROM public.product_manufacturer_claims
     WHERE source_document_id = c_doc AND claim_status = 'claimed_not_verified';
    res := res || jsonb_build_object('test','T4a all 72 STAS claims stored as claimed_not_verified','pass', n = 72, 'detail', n);

    SELECT count(*) INTO n FROM public.product_manufacturer_claims
     WHERE source_document_id = c_doc AND section_reference = 'page 1';
    res := res || jsonb_build_object('test','T4b nine page-one product claims recorded verbatim','pass', n = 9, 'detail', n);

    SELECT count(*) INTO n FROM public.product_manufacturer_claims
     WHERE source_document_id = c_doc AND section_reference = 'page 2 X-matrix';
    res := res || jsonb_build_object('test','T4c 63 page-two matrix marks stored as assertions only','pass', n = 63, 'detail', n);

    SELECT count(*) INTO n FROM public.product_manufacturer_claims
     WHERE source_document_id = c_doc AND (section_reference IS NULL OR source_document_id IS NULL);
    res := res || jsonb_build_object('test','T4d every claim cites its document and page','pass', n = 0, 'detail', n);

    SELECT count(*) INTO n FROM public.product_manufacturer_claims
     WHERE source_document_id = c_doc AND claim_status IN ('verified','approved');
    res := res || jsonb_build_object('test','T4e no STAS claim is verified or approved','pass', n = 0, 'detail', n);

    SELECT count(*) INTO n FROM public.product_guidance_mappings
     WHERE product_id IN (SELECT id FROM public.professional_products WHERE company_id = c_company);
    res := res || jsonb_build_object('test','T4f the 63 matrix marks became no operational mapping (1 pilot only)','pass', n = 1, 'detail', n);

    -- =================================================================
    -- 5. Page-one tips quarantined and never a procedure
    -- =================================================================
    SELECT count(*) INTO n FROM public.quarantined_source_instructions
     WHERE source_document_id = c_doc AND storage_class = 'unverified_source_instruction'
       AND user_visible = false AND operational_use_allowed = false;
    res := res || jsonb_build_object('test','T5a seven page-one tips quarantined and flagged invisible','pass', n = 7, 'detail', n);

    SELECT count(*) INTO n FROM public.product_instructions WHERE product_version_id = ANY(vids);
    res := res || jsonb_build_object('test','T5b no STAS treatment procedure exists anywhere','pass', n = 0, 'detail', n);

    BEGIN
      UPDATE public.quarantined_source_instructions SET user_visible = true WHERE source_document_id = c_doc;
      ok := true;
    EXCEPTION WHEN others THEN ok := false; END;
    res := res || jsonb_build_object('test','T5c a quarantined tip cannot be made user-visible','pass', ok = false);

    -- =================================================================
    -- 6-9. Safety interpretation
    -- =================================================================
    SELECT count(*) INTO n FROM public.product_restrictions
     WHERE condition_key = 'unquantified_temperature' AND product_version_id = ANY(vids)
       AND statement ILIKE '%warm-hot water%' AND statement ILIKE '%not a quantified%';
    res := res || jsonb_build_object('test','T6 "warm-hot water" rejected as an operational temperature on all nine','pass', n = 9, 'detail', n);

    SELECT count(*) INTO n FROM public.product_versions
     WHERE id = ANY(vids) AND (sds_version IS NOT NULL OR tds_version IS NOT NULL);
    res := res || jsonb_build_object('test','T6b no SDS or TDS version is invented','pass', n = 0, 'detail', n);

    SELECT count(*) INTO n FROM public.product_safety_data WHERE product_version_id = ANY(vids);
    res := res || jsonb_build_object('test','T6c no SDS record is invented','pass', n = 0, 'detail', n);

    SELECT count(*) INTO n FROM public.product_restrictions
     WHERE condition_key = 'mechanical_scrubbing' AND product_version_id = ANY(vids)
       AND statement ILIKE '%not acceptable as universal advice%'
       AND statement ILIKE '%delicate, printed, unknown or poorly colourfast%';
    res := res || jsonb_build_object('test','T7 scrubbing is not universal advice; textile damage warned on all nine','pass', n = 9, 'detail', n);

    SELECT count(*) INTO n FROM public.product_restrictions
     WHERE product_id = 'c0ed7dbe-75d8-4989-b061-2ae1c854d6fd'
       AND condition_key = 'unverified_chemical_identity' AND severity = 'stop'
       AND statement ILIKE '%OXY Based%' AND statement ILIKE '%not a chemical identity%';
    res := res || jsonb_build_object('test','T8a N4 is not approved from the phrase "OXY Based"','pass', n = 1, 'detail', n);

    SELECT count(*) INTO n FROM public.professional_products
     WHERE id = 'c0ed7dbe-75d8-4989-b061-2ae1c854d6fd'
       AND (status IN ('approved','published') OR verification_status = 'verified'
            OR coalesce(active_chemistry,'') NOT IN ('','Not disclosed'));
    res := res || jsonb_build_object('test','T8b no oxidiser chemistry inferred and N4 stays unapproved','pass', n = 0, 'detail', n);

    SELECT count(*) INTO n FROM public.product_restrictions
     WHERE product_id = '963887d9-127a-4a6a-a752-7881b3a42ff9'
       AND condition_key = 'unverified_chemical_identity' AND severity = 'stop'
       AND statement ILIKE '%rust and metal-oxide claim is unverified%';
    res := res || jsonb_build_object('test','T9a N5 rust/metal-oxide claim requires SDS/TDS and material restrictions','pass', n = 1, 'detail', n);

    SELECT count(*) INTO n FROM public.professional_products
     WHERE id = '963887d9-127a-4a6a-a752-7881b3a42ff9'
       AND (status IN ('approved','published') OR verification_status = 'verified'
            OR coalesce(active_chemistry,'') NOT IN ('','Not disclosed'));
    res := res || jsonb_build_object('test','T9b no acidity inferred for N5 and N5 stays unapproved','pass', n = 0, 'detail', n);

    SELECT count(*) INTO n FROM public.product_restrictions
     WHERE condition_key = 'missing_sds_tds' AND severity = 'stop'
       AND operator_override_allowed = false AND product_version_id = ANY(vids);
    res := res || jsonb_build_object('test','T9c missing SDS/TDS is a non-overridable stop on all nine','pass', n = 9, 'detail', n);

    -- =================================================================
    -- 10. Unknown fabric requires a hidden-area test, no procedure
    -- =================================================================
    SELECT count(*) INTO n FROM public.product_restrictions
     WHERE condition_key = 'unknown_fabric_identity' AND rule_kind = 'hidden_test'
       AND severity = 'required_test' AND product_version_id = ANY(vids);
    res := res || jsonb_build_object('test','T10a hidden-area compatibility test required on all nine products','pass', n = 9, 'detail', n);

    SELECT count(*) INTO n FROM public.product_guidance_mappings
     WHERE id = map_id AND mandatory_hidden_test = true
       AND suitability = 'insufficient_information' AND decision = 'not_assessed';
    res := res || jsonb_build_object('test','T10b the pilot itself demands a hidden test and asserts nothing','pass', n = 1, 'detail', n);

    -- =================================================================
    -- 11-13. The single pilot mapping
    -- =================================================================
    SELECT count(*) INTO n FROM public.product_guidance_mappings m
      JOIN public.stain_records s ON s.id = m.stain_record_id
     WHERE m.id = map_id AND s.stable_id = 'SM-CAT-04-BALLPOINT-INK' AND s.canonical_name = 'Ballpoint ink';
    res := res || jsonb_build_object('test','T11a the pilot resolves the exact existing Ball Pen Ink stable ID','pass', n = 1, 'detail', n);

    SELECT count(*) INTO n FROM public.stain_record_aliases
     WHERE stain_record_id = c_stain AND lower(alias) IN ('ball pen','ball point pen ink');
    res := res || jsonb_build_object('test','T11b identity resolved through existing "ball pen" aliases, none created','pass', n = 2, 'detail', n);

    SELECT count(*) INTO n FROM public.product_guidance_mappings m
      JOIN public.stain_records s ON s.id = m.stain_record_id
     WHERE m.product_id IN (SELECT id FROM public.professional_products WHERE company_id = c_company)
       AND (s.stable_id ILIKE '%MARKER%' OR s.stable_id LIKE 'SM-CAT-01-%'
            OR s.stable_id = 'SM-CAT-07-UNKNOWN-COMMERCIAL-INK');
    res := res || jsonb_build_object('test','T11c not mapped to generic ink, marker or a combination-stain record','pass', n = 0, 'detail', n);

    SELECT count(*) INTO n FROM public.product_guidance_mappings
     WHERE product_id IN (SELECT id FROM public.professional_products WHERE company_id = c_company);
    res := res || jsonb_build_object('test','T12a exactly one STAS mapping exists','pass', n = 1, 'detail', n);

    SELECT count(*) INTO n FROM public.product_guidance_mappings
     WHERE id = map_id AND product_id = n2 AND product_version_id = n2_v;
    res := res || jsonb_build_object('test','T12b the mapping is STASTAIN N2 to Ballpoint ink','pass', n = 1, 'detail', n);

    BEGIN
      INSERT INTO public.product_guidance_mappings(mapping_ref, product_id, product_version_id,
             stain_record_id, decision, country, evidence_level, source_document_id, source_section, review_note)
      VALUES ('MAP-STAS-N2-SM-CAT-04-BALLPOINT-INK', n2, n2_v, c_stain, 'not_assessed', 'IN',
              'manufacturer_claim', c_doc, 'pages 1-2', 'duplicate attempt');
      ok := true;
    EXCEPTION WHEN unique_violation THEN ok := false; END;
    SELECT count(*) INTO n FROM public.product_guidance_mappings
     WHERE product_id IN (SELECT id FROM public.professional_products WHERE company_id = c_company);
    res := res || jsonb_build_object('test','T12c a repeat pilot mapping is rejected, still exactly one','pass',
      ok = false AND n = 1, 'detail', n);

    SELECT count(*) INTO n FROM public.product_guidance_mappings
     WHERE id = map_id AND approval_status = 'draft' AND verification_status = 'unverified'
       AND provisional = true AND decision = 'not_assessed'
       AND suitability = 'insufficient_information'
       AND evidence_level = 'manufacturer_claim' AND source_document_id = c_doc
       AND treatment_stage_id IS NULL AND required_rinse IS NULL
       AND required_neutralisation IS NULL AND restriction IS NULL
       AND array_length(mandatory_stop_conditions, 1) = 6;
    res := res || jsonb_build_object('test','T13 pilot is draft, unverified, provisional, not assessed, no procedure','pass', n = 1, 'detail', n);

    -- =================================================================
    -- 14. Ordinary-user access under real RLS
    -- =================================================================
    FOREACH r IN ARRAY ARRAY['owner','technical_reviewer','content_admin',
                             'dry_cleaner','professional_spotter','domestic_user'] LOOP
      INSERT INTO auth.users(id, email, instance_id, aud, role)
      VALUES (gen_random_uuid(), 'zzstas-'||r||'@example.invalid',
              '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
        RETURNING id INTO tmp;
      INSERT INTO public.user_roles(user_id, role) VALUES (tmp, r::public.app_role);
      u := u || jsonb_build_object(r, tmp::text);
    END LOOP;

    FOREACH r IN ARRAY ARRAY['domestic_user','dry_cleaner','professional_spotter'] LOOP
      PERFORM pg_temp.as_user((u->>r)::uuid);
      SELECT count(*) INTO n FROM public.product_guidance_mappings WHERE id = map_id;
      res := res || jsonb_build_object('test','T14a '||r||' cannot retrieve the draft pilot mapping','pass', n = 0, 'detail', n);
      SELECT count(*) INTO n FROM public.professional_products WHERE company_id = c_company;
      res := res || jsonb_build_object('test','T14b '||r||' cannot see draft STAS product identities','pass', n = 0, 'detail', n);
      SELECT count(*) INTO n FROM public.source_documents WHERE id = c_doc;
      res := res || jsonb_build_object('test','T14c '||r||' cannot see the pending STAS chart','pass', n = 0, 'detail', n);
      SELECT count(*) INTO n FROM public.product_restrictions WHERE product_version_id = ANY(vids);
      res := res || jsonb_build_object('test','T14d '||r||' cannot see provisional STAS restrictions','pass', n = 0, 'detail', n);
      BEGIN SELECT count(*) INTO n FROM public.quarantined_source_instructions WHERE source_document_id = c_doc;
      EXCEPTION WHEN others THEN n := 0; END;
      res := res || jsonb_build_object('test','T14e '||r||' cannot read quarantined source instructions','pass', n = 0, 'detail', n);
      SELECT count(*) INTO n FROM public.product_manufacturer_claims WHERE source_document_id = c_doc;
      res := res || jsonb_build_object('test','T14f '||r||' cannot read unverified STAS manufacturer claims','pass', n = 0, 'detail', n);
      SELECT count(*) INTO n FROM public.product_source_documents WHERE source_document_id = c_doc;
      res := res || jsonb_build_object('test','T14g '||r||' cannot read STAS evidence links','pass', n = 0, 'detail', n);
    END LOOP;
    PERFORM pg_temp.as_trusted();

    EXECUTE 'RESET ROLE'; PERFORM set_config('request.jwt.claims','', true); EXECUTE 'SET LOCAL ROLE anon';
    BEGIN SELECT count(*) INTO n FROM public.product_guidance_mappings WHERE id = map_id;
    EXCEPTION WHEN others THEN n := 0; END;
    res := res || jsonb_build_object('test','T14h signed-out visitors see no STAS mapping','pass', n = 0, 'detail', n);
    BEGIN SELECT count(*) INTO n FROM public.quarantined_source_instructions;
    EXCEPTION WHEN others THEN n := 0; END;
    res := res || jsonb_build_object('test','T14i signed-out visitors see no quarantined instruction','pass', n = 0, 'detail', n);
    PERFORM pg_temp.as_trusted();

    -- a maintainer must still be able to review the draft
    PERFORM pg_temp.as_user((u->>'technical_reviewer')::uuid);
    SELECT count(*) INTO n FROM public.product_guidance_mappings WHERE id = map_id;
    SELECT count(*) + n INTO n FROM public.quarantined_source_instructions WHERE source_document_id = c_doc;
    res := res || jsonb_build_object('test','T14j a maintainer can review the draft and the quarantine','pass', n = 8, 'detail', n);
    PERFORM pg_temp.as_trusted();

    -- approval is refused while evidence is missing
    all_blocked := true;
    PERFORM pg_temp.as_user((u->>'owner')::uuid);
    FOREACH vid IN ARRAY vids LOOP
      BEGIN j := public.technically_approve_product_version(vid, 'STAS pilot approval attempt');
      EXCEPTION WHEN others THEN j := jsonb_build_object('ok', false, 'blockers', to_jsonb(ARRAY[SQLERRM])); END;
      IF coalesce((j->>'ok')::boolean, false) THEN all_blocked := false; END IF;
      IF vid = n2_v THEN err := j::text; END IF;
    END LOOP;
    PERFORM pg_temp.as_trusted();
    res := res || jsonb_build_object('test','T14k technical approval refused for all nine STAS versions','pass', all_blocked);
    res := res || jsonb_build_object('test','T14l blocker list names the missing SDS or TDS evidence','pass',
      (err ILIKE '%SDS%' OR err ILIKE '%TDS%') AND err NOT ILIKE '%malformed%', 'detail', err);

    PERFORM pg_temp.as_user((u->>'content_admin')::uuid);
    BEGIN j := public.publish_guidance_mapping(map_id, 'Publisher bypass attempt');
    EXCEPTION WHEN others THEN j := jsonb_build_object('ok', false, 'blockers', to_jsonb(ARRAY[SQLERRM])); END;
    PERFORM pg_temp.as_trusted();
    res := res || jsonb_build_object('test','T14m a publisher cannot bypass technical approval','pass',
      NOT coalesce((j->>'ok')::boolean, false) AND j::text NOT ILIKE '%malformed%', 'detail', j::text);

    -- =================================================================
    -- 15. A failed batch rolls back completely
    -- =================================================================
    SELECT count(*) INTO rc FROM public.product_restrictions;
    BEGIN
      INSERT INTO public.product_restrictions(product_id, product_version_id, rule_kind, condition_key,
             severity, statement) VALUES (n2, n2_v, 'warning', 'zz_rollback_probe_a', 'warning', 'probe a');
      INSERT INTO public.product_restrictions(product_id, product_version_id, rule_kind, condition_key,
             severity, statement) VALUES (n2, n2_v, 'not_a_valid_kind', 'zz_rollback_probe_b', 'warning', 'probe b');
      ok := true;
    EXCEPTION WHEN others THEN ok := false; END;
    SELECT count(*) INTO n FROM public.product_restrictions;
    res := res || jsonb_build_object('test','T15 a failed batch rolls back completely, no partial rows','pass',
      ok = false AND n = rc, 'detail', n);

    -- =================================================================
    -- 16-18. Baseline, neighbours, zero approvals
    -- =================================================================
    SELECT count(*) INTO n FROM public.stain_records;
    res := res || jsonb_build_object('test','T16a the 826-stain baseline is unchanged','pass', n = 826, 'detail', n);

    SELECT count(*) INTO n FROM public.stain_categories WHERE category_number IS NOT NULL;
    res := res || jsonb_build_object('test','T16b the 12-category baseline is unchanged','pass', n = 12, 'detail', n);

    SELECT count(*) INTO n FROM public.companies;
    res := res || jsonb_build_object('test','T17a still exactly three companies, none created','pass', n = 3, 'detail', n);

    SELECT count(*) INTO n FROM public.product_kits;
    res := res || jsonb_build_object('test','T17b still exactly five kits, none created','pass', n = 5, 'detail', n);

    SELECT count(*) INTO n FROM public.professional_products;
    res := res || jsonb_build_object('test','T17c still exactly 32 products, none created','pass', n = 32, 'detail', n);

    SELECT count(*) INTO n FROM public.product_guidance_mappings
     WHERE product_id NOT IN (SELECT id FROM public.professional_products WHERE company_id = c_company);
    res := res || jsonb_build_object('test','T17d the pre-existing Seitz mapping is untouched','pass', n = 1, 'detail', n);

    SELECT count(*) INTO n FROM public.product_guidance_mappings
     WHERE approval_status IN ('approved','published');
    res := res || jsonb_build_object('test','T18a zero approved or published guidance mappings','pass', n = 0, 'detail', n);

    SELECT count(*) INTO n FROM public.professional_products
     WHERE company_id = c_company AND (status IN ('approved','published') OR verification_status = 'verified');
    res := res || jsonb_build_object('test','T18b no STAS product is approved, published or verified','pass', n = 0, 'detail', n);

    SELECT count(*) INTO n FROM public.source_documents
     WHERE id = c_doc AND verification_status = 'pending_review'
       AND currentness = 'not_confirmed' AND document_state <> 'published'
       AND publication_date IS NULL AND version IS NULL;
    res := res || jsonb_build_object('test','T18c the STAS chart stays pending, not current, not published','pass', n = 1, 'detail', n);

    PERFORM pg_temp.as_trusted();
    RAISE EXCEPTION 'ZZSTAS_ROLLBACK';
  EXCEPTION WHEN others THEN
    EXECUTE 'RESET ROLE';
    IF SQLERRM <> 'ZZSTAS_ROLLBACK' THEN aborted := SQLERRM; END IF;
  END;

  SELECT count(*) FILTER (WHERE (e->>'pass')::boolean),
         count(*) FILTER (WHERE NOT (e->>'pass')::boolean)
    INTO passed, failed FROM jsonb_array_elements(res) e;

  INSERT INTO public.authorization_test_runs(total, passed, failed, aborted_with, results)
  VALUES (passed + failed, passed, failed, aborted,
          jsonb_build_object('suite','STAS-PILOT') || jsonb_build_object('tests', res));
END
$suite$;
