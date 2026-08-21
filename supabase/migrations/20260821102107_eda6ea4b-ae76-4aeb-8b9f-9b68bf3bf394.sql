-- =====================================================================
-- STAS STASTAIN-N CONTROLLED PILOT  (all-or-nothing, idempotent)
-- Identities resolved from live DB before writing:
--   company  65b42a5e-75f1-4d3c-80bf-f210b7b5e1a1  STAS
--   kit      2636f972-07cb-40d0-bcd9-82a750352cba  STASTAIN-N KIT
--   source   62011b81-523e-4541-8db2-16e2b020ff9c  SRC-STAS-001
--   stain    807c7f5b-cbe9-4143-8c42-e3e5ea3d63ba  SM-CAT-04-BALLPOINT-INK
-- =====================================================================

-- 1. Quarantine store for unverified source instructions (maintainer-only)
CREATE TABLE IF NOT EXISTS public.quarantined_source_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id uuid NOT NULL REFERENCES public.source_documents(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  kit_id uuid REFERENCES public.product_kits(id) ON DELETE SET NULL,
  page_reference text,
  storage_class text NOT NULL DEFAULT 'quarantined_source_claim',
  instruction_text text NOT NULL,
  user_visible boolean NOT NULL DEFAULT false,
  operational_use_allowed boolean NOT NULL DEFAULT false,
  quarantine_reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quarantined_source_instructions_uq UNIQUE (source_document_id, instruction_text),
  CONSTRAINT quarantined_never_visible CHECK (user_visible = false AND operational_use_allowed = false)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quarantined_source_instructions TO authenticated;
GRANT ALL ON public.quarantined_source_instructions TO service_role;

ALTER TABLE public.quarantined_source_instructions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Maintainers manage quarantined source instructions" ON public.quarantined_source_instructions;
CREATE POLICY "Maintainers manage quarantined source instructions"
ON public.quarantined_source_instructions
TO authenticated
USING (public.is_content_maintainer(auth.uid()) OR public.is_product_maintainer(auth.uid()))
WITH CHECK (public.is_content_maintainer(auth.uid()) OR public.is_product_maintainer(auth.uid()));

DROP TRIGGER IF EXISTS trg_quarantined_source_instructions_updated ON public.quarantined_source_instructions;
CREATE TRIGGER trg_quarantined_source_instructions_updated
BEFORE UPDATE ON public.quarantined_source_instructions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Complete the source document identity + SHA-256 dedupe key
UPDATE public.source_documents SET
  kit_id = '2636f972-07cb-40d0-bcd9-82a750352cba',
  document_type = 'spotting_chart',
  issuer = 'STAS Chem Technologies Pvt Ltd',
  issuing_organization = 'STAS Chem Technologies Pvt Ltd',
  issuer_uncertain = false,
  country = 'IN',
  language = 'en',
  file_hash = 'b15749bcfd7d11b7b79cc1a1f760341d91d40d77a5d469a0702c99332c33f02f',
  printed_identifier = 'www.staschemgroup.com',
  source_role = 'manufacturer_spotting_chart',
  currentness = 'not_confirmed',
  document_state = 'quarantined_pending_review',
  verification_status = 'pending_review',
  notes = 'STASH Laundrycare brand. 2 pages. No publication date or version printed; currentness not confirmed. Document limitations: no SDS supplied; no TDS supplied; no verified current product labels; no fabric compatibility table; no PPE or ventilation instructions; no quantified temperature limits. Manufacturer evidence only - not approved Stain Master guidance.'
WHERE id = '62011b81-523e-4541-8db2-16e2b020ff9c';

-- 3. Evidence links: chart -> all nine products / versions
INSERT INTO public.product_source_documents
  (product_id, product_version_id, source_document_id, document_role, claim_scope, source_section, page_reference, verification_status, notes)
SELECT p.id, v.id, '62011b81-523e-4541-8db2-16e2b020ff9c', 'manufacturer_spotting_chart',
       'manufacturer_claim', 'STASTAIN-N KIT spotting chart', 'pages 1-2', 'unverified',
       'Attributed manufacturer evidence. Does not replace current label, SDS or TDS.'
FROM public.professional_products p
JOIN public.product_versions v ON v.product_id = p.id
WHERE p.company_id = '65b42a5e-75f1-4d3c-80bf-f210b7b5e1a1'
ON CONFLICT DO NOTHING;

-- 4a. Page-one product claims, preserved verbatim
INSERT INTO public.product_manufacturer_claims
  (product_id, product_version_id, claimed_stain, claimed_category, source_document_id,
   source_description, section_reference, country, claim_status, notes)
SELECT p.id, v.id, c.claim, 'manufacturer_stated_application',
       '62011b81-523e-4541-8db2-16e2b020ff9c',
       'STASTAIN-N KIT chart, manufacturer wording preserved verbatim', 'page 1', 'IN',
       'claimed_not_verified',
       'Manufacturer assertion only. No chemistry inferred from product name or colour.'
FROM (VALUES
  ('PRD-STAS-N1','Blood, protein stains, grass, milk, etc.'),
  ('PRD-STAS-N2','Ink stains.'),
  ('PRD-STAS-N3','Oil, food stains, grease, etc.'),
  ('PRD-STAS-N4','OXY Based for yellow-colour stain removal.'),
  ('PRD-STAS-N5','Rust, metal oxide stains.'),
  ('PRD-STAS-N6','General stain remover.'),
  ('PRD-STAS-SPL','Specialty stain remover.'),
  ('PRD-STAS-RYG','Tobacco, gutka, collar stains.'),
  ('PRD-STAS-CLR','Colour stains.')
) AS c(ref, claim)
JOIN public.professional_products p ON p.product_ref = c.ref
JOIN public.product_versions v ON v.product_id = p.id
ON CONFLICT DO NOTHING;

-- 4b. Page-two X-matrix: manufacturer applicability assertions only (no operational mappings)
INSERT INTO public.product_manufacturer_claims
  (product_id, product_version_id, claimed_stain, claimed_category, source_document_id,
   source_description, section_reference, country, claim_status, notes)
SELECT p.id, v.id, m.stain, 'manufacturer_matrix_assertion',
       '62011b81-523e-4541-8db2-16e2b020ff9c',
       'STASTAIN-N KIT chart page 2 applicability matrix', 'page 2 X-matrix', 'IN',
       'claimed_not_verified',
       'Applicability mark only. Not a complete or approved procedure; no dosage, temperature or fabric compatibility supplied.'
FROM (VALUES
  ('Adhesives','STASTAIN N6'),
  ('Ball Pen Ink','STASTAIN N2'),('Ball Pen Ink','STASTAIN N4'),
  ('Beer','STASTAIN N1'),('Beer','STASTAIN N4'),('Beer','STASTAIN SPL'),
  ('Blood','STASTAIN N1'),('Blood','STASTAIN N4'),
  ('Carbon','STASTAIN N4'),('Carbon','STASTAIN SPL'),
  ('Chocolate','STASTAIN N1'),('Chocolate','STASTAIN N4'),('Chocolate','STASTAIN SPL'),
  ('Coffee','STASTAIN N1'),('Coffee','STASTAIN N4'),('Coffee','STASTAIN SPL'),
  ('Cosmetics','STASTAIN N2'),('Cosmetics','STASTAIN N3'),('Cosmetics','STASTAIN N4'),('Cosmetics','STASTAIN N6'),('Cosmetics','STASTAIN CLR'),
  ('Color Stains','STASTAIN RYG'),('Color Stains','STASTAIN CLR'),
  ('Cuff & Collar','STASTAIN N4'),('Cuff & Collar','STASTAIN SPL'),('Cuff & Collar','STASTAIN RYG'),
  ('Food','STASTAIN N3'),('Food','STASTAIN N4'),('Food','STASTAIN RYG'),
  ('Grass','STASTAIN N1'),('Grass','STASTAIN N4'),('Grass','STASTAIN N6'),
  ('Grease/Fat/Oil','STASTAIN N3'),('Grease/Fat/Oil','STASTAIN N6'),('Grease/Fat/Oil','STASTAIN SPL'),
  ('Ketchup','STASTAIN N1'),('Ketchup','STASTAIN N4'),
  ('Metal Oxides','STASTAIN N5'),
  ('Milk','STASTAIN N1'),('Milk','STASTAIN N3'),('Milk','STASTAIN N6'),
  ('Mud','STASTAIN N4'),('Mud','STASTAIN N6'),('Mud','STASTAIN SPL'),
  ('Perfume/Deo','STASTAIN N4'),('Perfume/Deo','STASTAIN N6'),('Perfume/Deo','STASTAIN RYG'),
  ('Perspiration','STASTAIN N1'),('Perspiration','STASTAIN N4'),('Perspiration','STASTAIN N6'),('Perspiration','STASTAIN RYG'),
  ('Rust','STASTAIN N5'),
  ('Tea','STASTAIN N1'),('Tea','STASTAIN N4'),('Tea','STASTAIN N6'),('Tea','STASTAIN SPL'),
  ('Tobacco','STASTAIN N1'),('Tobacco','STASTAIN N4'),('Tobacco','STASTAIN N6'),('Tobacco','STASTAIN RYG'),
  ('Urine','STASTAIN N1'),('Urine','STASTAIN N6'),('Urine','STASTAIN RYG')
) AS m(stain, product_name)
JOIN public.professional_products p ON p.product_name = m.product_name
  AND p.company_id = '65b42a5e-75f1-4d3c-80bf-f210b7b5e1a1'
JOIN public.product_versions v ON v.product_id = p.id
ON CONFLICT DO NOTHING;

-- 5. Page-one treatment tips: quarantined, never operational
INSERT INTO public.quarantined_source_instructions
  (source_document_id, company_id, kit_id, page_reference, storage_class, instruction_text, quarantine_reason)
SELECT '62011b81-523e-4541-8db2-16e2b020ff9c',
       '65b42a5e-75f1-4d3c-80bf-f210b7b5e1a1',
       '2636f972-07cb-40d0-bcd9-82a750352cba',
       'page 1', 'unverified_source_instruction', t.txt,
       'Unverified manufacturer tip. "Warm-hot" is not a quantified temperature and scrubbing may damage unknown, delicate, printed or poorly colourfast textiles. Not displayable and not convertible into a procedure.'
FROM (VALUES
  ('Blood: warm-hot water in STASH SRL for 15 minutes, then N1; alternative N4 then N1 and scrub.'),
  ('Food/haldi: N1 then N6 and scrub; warm-hot water in STASH SRL for 15 minutes.'),
  ('Rust: N5 and scrub.'),
  ('Oil/food: N3 then N6 and scrub; warm-hot water for 15 minutes if required.'),
  ('Collar/deo: N4, then RYG and scrub; repeat N4 if needed.'),
  ('Gutka/tobacco: warm-hot water for 15 minutes, then RYG and SPL.'),
  ('Colour: CLR then SPL and scrub.')
) AS t(txt)
ON CONFLICT DO NOTHING;

-- 6. Safety restrictions on every STAS product version
INSERT INTO public.product_restrictions
  (product_id, product_version_id, source_document_id, page_reference, rule_kind, condition_key,
   severity, statement, operator_override_allowed, verification_status, provisional, notes)
SELECT p.id, v.id, '62011b81-523e-4541-8db2-16e2b020ff9c', 'pages 1-2',
       r.rule_kind, r.condition_key, r.severity, r.statement, false, 'pending_review', true, r.note
FROM public.professional_products p
JOIN public.product_versions v ON v.product_id = p.id
CROSS JOIN (VALUES
  ('hidden_test','unknown_fabric_identity','required_test',
   'Fabric identity and dye compatibility are unknown for this product. A hidden-area compatibility test is mandatory before any contact with the garment.',
   'Stain Master safety control: source supplies no fabric compatibility table.'),
  ('stop','missing_sds_tds','stop',
   'No SDS or TDS has been supplied for this product. Use, dosage, PPE and ventilation cannot be specified, so no operational procedure may be issued.',
   'Approval blocker recorded from pilot package.'),
  ('warning','unquantified_temperature','warning',
   'The source states "warm-hot water" only. This is not a quantified or verified temperature and must not be used as an operational specification.',
   'Temperature rejected as unusable.'),
  ('warning','mechanical_scrubbing','warning',
   'The source states "scrub". Scrubbing is not acceptable as universal advice and may damage delicate, printed, unknown or poorly colourfast textiles.',
   'Mechanical action restricted.')
) AS r(rule_kind, condition_key, severity, statement, note)
WHERE p.company_id = '65b42a5e-75f1-4d3c-80bf-f210b7b5e1a1'
ON CONFLICT DO NOTHING;

INSERT INTO public.product_restrictions
  (product_id, product_version_id, source_document_id, page_reference, rule_kind, condition_key,
   severity, statement, operator_override_allowed, verification_status, provisional, notes)
SELECT p.id, v.id, '62011b81-523e-4541-8db2-16e2b020ff9c', 'page 1',
       'stop', 'unverified_chemical_identity', 'stop', r.statement, false, 'pending_review', true, r.note
FROM (VALUES
  ('PRD-STAS-N4','The source phrase "OXY Based" is preserved as manufacturer wording only. It is not a chemical identity. Approval requires SDS/TDS plus fabric and colourfastness restrictions.',
   'No oxidiser chemistry inferred from the printed phrase.'),
  ('PRD-STAS-N5','The rust and metal-oxide claim is unverified. Approval requires SDS/TDS and material restrictions; no acidity or any other chemistry is inferred.',
   'No acid chemistry inferred from the product name or application claim.')
) AS r(ref, statement, note)
JOIN public.professional_products p ON p.product_ref = r.ref
JOIN public.product_versions v ON v.product_id = p.id
ON CONFLICT DO NOTHING;

-- 7. The single controlled pilot mapping: STASTAIN N2 -> existing "Ballpoint ink"
INSERT INTO public.product_guidance_mappings
  (mapping_ref, product_id, product_version_id, stain_record_id, decision, suitability, risk_level,
   user_capability, country, language, mandatory_hidden_test, mandatory_stop_conditions,
   evidence_level, evidence_note, source_document_id, source_section,
   approval_status, verification_status, provisional, review_note)
SELECT 'MAP-STAS-N2-SM-CAT-04-BALLPOINT-INK',
       p.id, v.id, '807c7f5b-cbe9-4143-8c42-e3e5ea3d63ba',
       'not_assessed', 'insufficient_information', 'amber', 'professional', 'IN', 'en',
       true,
       ARRAY['No SDS or TDS supplied','No verified current product label','No fabric or dye compatibility data','No PPE or ventilation instructions','No quantified temperature limits','No qualified technical reviewer approval'],
       'manufacturer_claim',
       'Manufacturer chart claim only (page 1 "Ink stains."; page 2 matrix mark for Ball Pen Ink). Stain identity resolved through the existing alias "ball pen" on SM-CAT-04-BALLPOINT-INK. No procedure, dosage, temperature or compatibility statement is recorded.',
       '62011b81-523e-4541-8db2-16e2b020ff9c', 'pages 1-2',
       'draft', 'unverified', true,
       'Controlled STAS pilot record. Must remain draft, unverified and provisional until every approval blocker is cleared by a qualified technical reviewer.'
FROM public.professional_products p
JOIN public.product_versions v ON v.product_id = p.id
WHERE p.product_ref = 'PRD-STAS-N2'
ON CONFLICT (mapping_ref) DO NOTHING;

-- 8. Audit trail
INSERT INTO public.product_audit_log
  (entity_table, entity_id, product_id, action, field_key, previous_value, new_value, reason,
   justification_required, source_document_id, safety_critical)
SELECT 'product_guidance_mappings', m.id, m.product_id, 'stas_pilot_import', 'approval_status', NULL, 'draft',
       'STAS STASTAIN-N controlled pilot: manufacturer chart imported as attributed evidence only. One draft, unverified, provisional mapping created. Nothing approved or published.',
       true, '62011b81-523e-4541-8db2-16e2b020ff9c', true
FROM public.product_guidance_mappings m
WHERE m.mapping_ref = 'MAP-STAS-N2-SM-CAT-04-BALLPOINT-INK'
  AND NOT EXISTS (SELECT 1 FROM public.product_audit_log a WHERE a.entity_id = m.id AND a.action = 'stas_pilot_import');