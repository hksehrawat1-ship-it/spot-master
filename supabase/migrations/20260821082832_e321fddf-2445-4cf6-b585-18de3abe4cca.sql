DO $suite$
DECLARE
  res jsonb := '[]'::jsonb; ok boolean; err text; rc integer; n integer; j jsonb;
  u jsonb := '{}'::jsonb; r text; aborted text;
  f1 uuid[]; f2 uuid[]; f3 uuid[]; f4 uuid[]; f5 uuid[]; f6 uuid[];
  stain_ok uuid; map6 uuid; map4 uuid; audit_id uuid; tmp uuid;
  passed int := 0; failed int := 0;
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
  EXECUTE $f$
    CREATE FUNCTION pg_temp.mkfix(sfx text) RETURNS uuid[] AS $b$
    DECLARE cid uuid; kid uuid; pid uuid; vid uuid; did uuid;
    BEGIN
      INSERT INTO public.companies(company_name, verification_status)
        VALUES ('ZZTEST Co '||sfx, 'verified') RETURNING id INTO cid;
      INSERT INTO public.product_kits(company_id, kit_name, source_status)
        VALUES (cid, 'ZZTEST Kit '||sfx, 'verified') RETURNING id INTO kid;
      INSERT INTO public.professional_products(company_id, kit_id, product_name, product_ref,
             verification_status, status, provisional, safety_warnings, ppe)
        VALUES (cid, kid, 'ZZTEST Product '||sfx, 'ZZTEST-'||sfx,
             'verified', 'draft', false, 'Test safety warning', 'Nitrile gloves') RETURNING id INTO pid;
      INSERT INTO public.kit_products(kit_id, product_id) VALUES (kid, pid);
      INSERT INTO public.source_documents(document_title, document_type, company_id, product_id, verification_status)
        VALUES ('ZZTEST Doc '||sfx, 'tds', cid, pid, 'verified') RETURNING id INTO did;
      INSERT INTO public.product_versions(product_id, version_ref, country, verification_status,
             approval_status, provisional, reviewer, tds_version, label_version)
        VALUES (pid, 'v1-'||sfx, 'IN', 'verified', 'draft', false, 'ZZTEST Reviewer', '1.0', '1.0')
        RETURNING id INTO vid;
      INSERT INTO public.product_source_documents(product_id, product_version_id, source_document_id,
             document_role, verification_status)
        VALUES (pid, vid, did, 'tds', 'verified');
      INSERT INTO public.product_manufacturer_claims(product_id, product_version_id, claimed_stain,
             source_document_id, claim_status)
        VALUES (pid, vid, 'ZZTEST stain', did, 'verified');
      INSERT INTO public.product_safety_data(product_version_id, source_document_id, verification_status)
        VALUES (vid, did, 'verified');
      INSERT INTO public.product_instructions(product_version_id, application_stage, source_document_id, approval_status)
        VALUES (vid, 'pretreatment', did, 'approved');
      RETURN ARRAY[cid, kid, pid, vid, did];
    END $b$ LANGUAGE plpgsql;
  $f$;

  BEGIN
    INSERT INTO auth.users(id, email) VALUES (gen_random_uuid(), 'zztest-bootstrap@example.invalid')
      RETURNING id INTO tmp;

    PERFORM pg_temp.as_user(tmp);
    BEGIN PERFORM public.bootstrap_first_owner(tmp, 'test'); ok := true;
    EXCEPTION WHEN others THEN ok := false; END;
    res := res || jsonb_build_object('test','B1 bootstrap rejected for a signed-in user','pass', ok = false);

    EXECUTE 'RESET ROLE'; EXECUTE 'SET LOCAL ROLE anon';
    BEGIN PERFORM public.bootstrap_first_owner(tmp, 'test'); ok := true;
    EXCEPTION WHEN others THEN ok := false; END;
    res := res || jsonb_build_object('test','B2 bootstrap rejected for anonymous','pass', ok = false);

    PERFORM pg_temp.as_trusted();
    BEGIN PERFORM public.bootstrap_first_owner('00000000-0000-0000-0000-000000000000','test reason'); ok := true;
    EXCEPTION WHEN others THEN ok := false; err := SQLERRM; END;
    res := res || jsonb_build_object('test','B3 bootstrap rejects an unknown account','pass',
                   ok = false AND err LIKE '%No account exists%');

    BEGIN PERFORM public.bootstrap_first_owner(tmp, '   '); ok := true;
    EXCEPTION WHEN others THEN ok := false; err := SQLERRM; END;
    res := res || jsonb_build_object('test','B4 bootstrap rejects an empty reason','pass',
                   ok = false AND err LIKE '%written reason%');

    BEGIN j := public.bootstrap_first_owner(tmp, 'Recovery step 1 integration test');
          ok := (j->>'ok')::boolean; err := NULL;
    EXCEPTION WHEN others THEN ok := false; err := SQLERRM; END;
    res := res || jsonb_build_object('test','B5 bootstrap grants exactly one owner and writes one audit entry','pass',
                   ok AND (SELECT count(*) FROM public.user_roles WHERE role='owner') = 1
                      AND (SELECT count(*) FROM public.security_audit_log WHERE action='bootstrap_first_owner') = 1,
                   'detail', err);

    SELECT count(*) INTO n FROM pg_locks
     WHERE locktype='advisory' AND ((classid::bigint << 32) | objid::bigint) = 748213590017;
    res := res || jsonb_build_object('test','B6 bootstrap holds a transaction advisory lock (a concurrent call blocks)','pass', n >= 1);

    BEGIN PERFORM public.bootstrap_first_owner(tmp, 'second attempt'); ok := true;
    EXCEPTION WHEN others THEN ok := false; err := SQLERRM; END;
    res := res || jsonb_build_object('test','B7 a second bootstrap attempt is rejected','pass',
                   ok = false AND err LIKE '%once%');

    DELETE FROM public.user_roles;
    DELETE FROM public.security_audit_log;

    FOREACH r IN ARRAY ARRAY['owner','technical_reviewer','administrator','content_admin',
                             'content_editor','system_admin','auditor','professional_spotter',
                             'dry_cleaner','laundry_employee','trainer','domestic_user','learner'] LOOP
      INSERT INTO auth.users(id, email) VALUES (gen_random_uuid(), 'zztest-role-'||r||'@example.invalid')
        RETURNING id INTO tmp;
      INSERT INTO public.user_roles(user_id, role) VALUES (tmp, r::public.app_role);
      u := u || jsonb_build_object(r, tmp::text);
    END LOOP;

    f1 := pg_temp.mkfix('F1'); f2 := pg_temp.mkfix('F2'); f3 := pg_temp.mkfix('F3');
    f4 := pg_temp.mkfix('F4'); f5 := pg_temp.mkfix('F5'); f6 := pg_temp.mkfix('F6');

    PERFORM set_config('app.approval_ctx','on', true);
    UPDATE public.product_versions
       SET approval_status='approved', technically_approved_by=(u->>'owner')::uuid,
           technically_approved_at=now(), immutable=true
     WHERE id = f3[4];
    UPDATE public.product_versions SET approval_status='approved', verification_status='pending_review'
     WHERE id = f5[4];
    UPDATE public.product_versions SET approval_status='published' WHERE id = f6[4];
    PERFORM set_config('app.approval_ctx','off', true);
    UPDATE public.professional_products SET status='published' WHERE id IN (f5[3], f6[3]);

    SELECT id INTO stain_ok FROM public.stain_records
     WHERE reroute_pending = false AND publication_status='published' LIMIT 1;

    INSERT INTO public.product_guidance_mappings(mapping_ref, product_id, product_version_id, stain_record_id,
           decision, country, evidence_level, source_document_id, source_section, review_note,
           verification_status, provisional, reviewer, reviewed_at)
      VALUES ('ZZTEST-MAP-F6', f6[3], f6[4], stain_ok, 'recommended', 'IN', 'sds_tds_documented',
              f6[5], 'Section 1', 'Test note', 'verified', false, (u->>'owner')::uuid, now())
      RETURNING id INTO map6;
    INSERT INTO public.product_guidance_mappings(mapping_ref, product_id, product_version_id, stain_record_id,
           decision, country, evidence_level, source_document_id, source_section, review_note,
           verification_status, provisional, reviewer, reviewed_at)
      VALUES ('ZZTEST-MAP-F4', f4[3], f4[4], stain_ok, 'recommended', 'IN', 'sds_tds_documented',
              f4[5], 'Section 1', 'Test note', 'verified', false, (u->>'owner')::uuid, now())
      RETURNING id INTO map4;
    PERFORM set_config('app.approval_ctx','on', true);
    UPDATE public.product_guidance_mappings SET approval_status='published' WHERE id IN (map6, map4);
    PERFORM set_config('app.approval_ctx','off', true);

    INSERT INTO public.product_audit_log(entity_table, entity_id, product_id, action, reason)
      VALUES ('professional_products', f6[3], f6[3], 'test', 'integration test') RETURNING id INTO audit_id;

    FOREACH r IN ARRAY ARRAY['owner','technical_reviewer','administrator','content_admin',
                             'content_editor','system_admin','auditor','professional_spotter','domestic_user'] LOOP
      PERFORM pg_temp.as_user((u->>r)::uuid);
      BEGIN
        EXECUTE format('UPDATE public.professional_products SET odour_description = %L WHERE id = %L','zz '||r,f1[3]);
        GET DIAGNOSTICS rc = ROW_COUNT;
      EXCEPTION WHEN others THEN rc := -1; END;
      res := res || jsonb_build_object('test','D '||r||' may edit a draft product record',
        'pass', (rc = 1) = (r IN ('owner','technical_reviewer','administrator','content_admin','content_editor')),
        'rows', rc);
    END LOOP;
    PERFORM pg_temp.as_trusted();

    PERFORM pg_temp.as_user((u->>'owner')::uuid);
    BEGIN j := public.technically_approve_product_version(f1[4],'Owner technical approval test');
          ok := (j->>'ok')::boolean; err := j::text;
    EXCEPTION WHEN others THEN ok := false; err := SQLERRM; END;
    res := res || jsonb_build_object('test','A1 owner technically approves a version','pass', ok, 'detail', err);

    BEGIN j := public.publish_product_version(f1[4],'Owner publication test');
          ok := (j->>'ok')::boolean; err := j::text;
    EXCEPTION WHEN others THEN ok := false; err := SQLERRM; END;
    res := res || jsonb_build_object('test','A2 owner publishes an approved version','pass', ok, 'detail', err);

    PERFORM pg_temp.as_user((u->>'technical_reviewer')::uuid);
    BEGIN j := public.technically_approve_product_version(f2[4],'Reviewer technical approval test');
          ok := (j->>'ok')::boolean; err := j::text;
    EXCEPTION WHEN others THEN ok := false; err := SQLERRM; END;
    res := res || jsonb_build_object('test','A3 technical reviewer technically approves a version','pass', ok, 'detail', err);

    BEGIN PERFORM public.publish_product_version(f2[4],'Reviewer publication attempt'); ok := true;
    EXCEPTION WHEN others THEN ok := false; err := SQLERRM; END;
    res := res || jsonb_build_object('test','A4 technical reviewer cannot publish','pass', ok = false, 'detail', err);

    PERFORM pg_temp.as_user((u->>'administrator')::uuid);
    BEGIN PERFORM public.technically_approve_product_version(f3[4],'Administrator approval attempt'); ok := true;
    EXCEPTION WHEN others THEN ok := false; err := SQLERRM; END;
    res := res || jsonb_build_object('test','A5 administrator cannot technically approve','pass', ok = false, 'detail', err);

    BEGIN j := public.publish_product_version(f2[4],'Administrator publication test');
          ok := (j->>'ok')::boolean; err := j::text;
    EXCEPTION WHEN others THEN ok := false; err := SQLERRM; END;
    res := res || jsonb_build_object('test','A6 administrator publishes an approved version','pass', ok, 'detail', err);

    PERFORM pg_temp.as_user((u->>'content_admin')::uuid);
    BEGIN PERFORM public.technically_approve_product_version(f3[4],'Content admin approval attempt'); ok := true;
    EXCEPTION WHEN others THEN ok := false; err := SQLERRM; END;
    res := res || jsonb_build_object('test','A7 content administrator cannot technically approve','pass', ok = false, 'detail', err);

    BEGIN j := public.publish_product_version(f3[4],'Content admin publication test');
          ok := (j->>'ok')::boolean; err := j::text;
    EXCEPTION WHEN others THEN ok := false; err := SQLERRM; END;
    res := res || jsonb_build_object('test','A8 content administrator publishes an approved version','pass', ok, 'detail', err);

    PERFORM pg_temp.as_user((u->>'content_editor')::uuid);
    BEGIN PERFORM public.technically_approve_product_version(f4[4],'Editor approval attempt'); ok := true;
    EXCEPTION WHEN others THEN ok := false; END;
    res := res || jsonb_build_object('test','A9 content editor cannot technically approve','pass', ok = false);
    BEGIN PERFORM public.publish_product_version(f4[4],'Editor publication attempt'); ok := true;
    EXCEPTION WHEN others THEN ok := false; END;
    res := res || jsonb_build_object('test','A10 content editor cannot publish','pass', ok = false);

    PERFORM pg_temp.as_user((u->>'system_admin')::uuid);
    BEGIN PERFORM public.technically_approve_product_version(f4[4],'System admin approval attempt'); ok := true;
    EXCEPTION WHEN others THEN ok := false; END;
    res := res || jsonb_build_object('test','A11 system administrator cannot technically approve','pass', ok = false);
    BEGIN PERFORM public.publish_product_version(f4[4],'System admin publication attempt'); ok := true;
    EXCEPTION WHEN others THEN ok := false; END;
    res := res || jsonb_build_object('test','A12 system administrator cannot publish','pass', ok = false);

    PERFORM pg_temp.as_user((u->>'owner')::uuid);
    BEGIN j := public.publish_product_version(f4[4],'Publication without technical approval');
          ok := (j->>'ok')::boolean; err := j::text;
    EXCEPTION WHEN others THEN ok := false; err := SQLERRM; END;
    res := res || jsonb_build_object('test','A13 publication refused when the version was never technically approved',
                   'pass', ok = false, 'detail', err);

    BEGIN PERFORM public.approve_product_version(f4[4],'draft'::public.content_status,'x'); ok := true;
    EXCEPTION WHEN others THEN ok := false; END;
    res := res || jsonb_build_object('test','A14 the compatibility entry point refuses other target statuses','pass', ok = false);

    PERFORM pg_temp.as_user((u->>'content_editor')::uuid);
    BEGIN PERFORM public.technically_approve_guidance_mapping(map4,'Editor mapping approval'); ok := true;
    EXCEPTION WHEN others THEN ok := false; END;
    res := res || jsonb_build_object('test','A15 content editor cannot technically approve a guidance mapping','pass', ok = false);

    PERFORM pg_temp.as_user((u->>'administrator')::uuid);
    BEGIN PERFORM public.technically_approve_guidance_mapping(map4,'Administrator mapping approval'); ok := true;
    EXCEPTION WHEN others THEN ok := false; err := SQLERRM; END;
    res := res || jsonb_build_object('test','A16 administrator cannot technically approve a guidance mapping','pass', ok = false, 'detail', err);

    PERFORM pg_temp.as_user((u->>'technical_reviewer')::uuid);
    BEGIN PERFORM public.publish_guidance_mapping(map4,'Reviewer mapping publication'); ok := true;
    EXCEPTION WHEN others THEN ok := false; err := SQLERRM; END;
    res := res || jsonb_build_object('test','A17 technical reviewer cannot publish a guidance mapping','pass', ok = false, 'detail', err);

    PERFORM pg_temp.as_trusted();

    FOREACH r IN ARRAY ARRAY['professional_spotter','dry_cleaner','laundry_employee','trainer'] LOOP
      PERFORM pg_temp.as_user((u->>r)::uuid);
      SELECT count(*) INTO n FROM public.product_versions WHERE id = f6[4];
      res := res || jsonb_build_object('test','P '||r||' reads a fully released version','pass', n = 1);
      SELECT count(*) INTO n FROM public.product_versions WHERE id = f4[4];
      res := res || jsonb_build_object('test','P '||r||' cannot read a draft version','pass', n = 0);
      SELECT count(*) INTO n FROM public.product_versions WHERE id = f5[4];
      res := res || jsonb_build_object('test','P '||r||' cannot read an approved but unverified version','pass', n = 0);
      SELECT count(*) INTO n FROM public.product_source_documents WHERE product_version_id = f4[4];
      res := res || jsonb_build_object('test','P '||r||' cannot read a verified evidence link on an unapproved product','pass', n = 0);
      SELECT count(*) INTO n FROM public.product_source_documents WHERE product_version_id = f6[4];
      res := res || jsonb_build_object('test','P '||r||' reads a released evidence link','pass', n = 1);
      SELECT count(*) INTO n FROM public.product_manufacturer_claims WHERE product_version_id = f4[4];
      res := res || jsonb_build_object('test','P '||r||' cannot read claims on an unapproved product','pass', n = 0);
      SELECT count(*) INTO n FROM public.product_safety_data WHERE product_version_id = f4[4];
      res := res || jsonb_build_object('test','P '||r||' cannot read safety data on an unapproved product','pass', n = 0);
      SELECT count(*) INTO n FROM public.product_instructions WHERE product_version_id = f4[4];
      res := res || jsonb_build_object('test','P '||r||' cannot read instructions on an unapproved product','pass', n = 0);
      SELECT count(*) INTO n FROM public.product_guidance_mappings WHERE id = map6;
      res := res || jsonb_build_object('test','P '||r||' reads a released guidance mapping','pass', n = 1);
      SELECT count(*) INTO n FROM public.product_guidance_mappings WHERE id = map4;
      res := res || jsonb_build_object('test','P '||r||' cannot read guidance on an unapproved product','pass', n = 0);
      BEGIN
        EXECUTE format('UPDATE public.professional_products SET odour_description = %L WHERE id = %L','zz',f6[3]);
        GET DIAGNOSTICS rc = ROW_COUNT;
      EXCEPTION WHEN others THEN rc := -1; END;
      res := res || jsonb_build_object('test','P '||r||' cannot edit product records','pass', rc <> 1);
    END LOOP;

    FOREACH r IN ARRAY ARRAY['domestic_user','learner'] LOOP
      PERFORM pg_temp.as_user((u->>r)::uuid);
      SELECT count(*) INTO n FROM public.product_versions WHERE id = f6[4];
      res := res || jsonb_build_object('test','N '||r||' cannot read professional versions','pass', n = 0);
      SELECT count(*) INTO n FROM public.product_guidance_mappings WHERE id = map6;
      res := res || jsonb_build_object('test','N '||r||' cannot read guidance mappings','pass', n = 0);
      SELECT count(*) INTO n FROM public.product_audit_log WHERE id = audit_id;
      res := res || jsonb_build_object('test','N '||r||' cannot read the product audit log','pass', n = 0);
    END LOOP;

    PERFORM pg_temp.as_user((u->>'auditor')::uuid);
    SELECT count(*) INTO n FROM public.product_audit_log WHERE id = audit_id;
    res := res || jsonb_build_object('test','G auditor reads the product audit log','pass', n = 1);
    BEGIN
      EXECUTE format('UPDATE public.professional_products SET odour_description = %L WHERE id = %L','zz',f6[3]);
      GET DIAGNOSTICS rc = ROW_COUNT;
    EXCEPTION WHEN others THEN rc := -1; END;
    res := res || jsonb_build_object('test','G auditor cannot edit product records','pass', rc <> 1);

    EXECUTE 'RESET ROLE'; PERFORM set_config('request.jwt.claims','', true); EXECUTE 'SET LOCAL ROLE anon';
    BEGIN SELECT count(*) INTO n FROM public.product_versions; ok := (n = 0);
    EXCEPTION WHEN others THEN ok := true; END;
    res := res || jsonb_build_object('test','X anonymous cannot read product versions','pass', ok);
    BEGIN SELECT count(*) INTO n FROM public.product_guidance_mappings; ok := (n = 0);
    EXCEPTION WHEN others THEN ok := true; END;
    res := res || jsonb_build_object('test','X anonymous cannot read guidance mappings','pass', ok);

    EXECUTE 'RESET ROLE'; EXECUTE 'SET LOCAL ROLE authenticated';
    PERFORM set_config('request.jwt.claims','', true);
    BEGIN SELECT count(*) INTO n FROM public.product_versions; EXCEPTION WHEN others THEN n := 0; END;
    res := res || jsonb_build_object('test','X a signed-in session with no identity fails closed','pass', n = 0);

    PERFORM pg_temp.as_trusted();

    RAISE EXCEPTION 'ZZTEST_ROLLBACK';
  EXCEPTION WHEN others THEN
    EXECUTE 'RESET ROLE';
    IF SQLERRM <> 'ZZTEST_ROLLBACK' THEN aborted := SQLERRM; END IF;
  END;

  SELECT count(*) FILTER (WHERE (e->>'pass')::boolean),
         count(*) FILTER (WHERE NOT (e->>'pass')::boolean)
    INTO passed, failed FROM jsonb_array_elements(res) e;

  INSERT INTO public.authorization_test_runs(total, passed, failed, aborted_with, results)
  VALUES (passed + failed, passed, failed, aborted, res);
END
$suite$;