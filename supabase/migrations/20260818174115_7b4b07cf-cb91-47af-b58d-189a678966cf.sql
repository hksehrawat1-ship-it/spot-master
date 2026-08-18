-- 1. Governance columns
ALTER TABLE public.stain_record_reroutes
  ADD COLUMN IF NOT EXISTS evidence_note text,
  ADD COLUMN IF NOT EXISTS is_suggestion boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE public.stain_record_aliases
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- 2. Deterministic spelling normalisation for search
CREATE OR REPLACE FUNCTION public.stain_norm(t text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT btrim(regexp_replace(
    replace(replace(replace(replace(replace(replace(lower(coalesce(t, '')),
      'colour', 'color'), 'mould', 'mold'), 'centre', 'center'), 'grey', 'gray'),
      'aluminium', 'aluminum'), 'sulphur', 'sulfur'),
    '[^a-z0-9]+', ' ', 'g'))
$$;

REINDEX INDEX public.idx_stain_records_norm_trgm;
REINDEX INDEX public.idx_stain_aliases_norm_trgm;

-- 3. Resolve pending reroutes that are unambiguous in the approved source wording
WITH m(stable_id, cat_number, sort_order) AS (
  VALUES
    ('SM-CAT-03-APPLE-JUICE', 4, 1),
    ('SM-CAT-03-COLOURED-SPORTS-DRINK', 4, 1),
    ('SM-CAT-03-COLOURED-SPORTS-DRINK', 1, 2),
    ('SM-CAT-03-DILUTED-BLOOD-SERUM', 5, 1),
    ('SM-CAT-03-DILUTED-LEMONADE', 4, 1),
    ('SM-CAT-03-DILUTED-LEMONADE', 1, 2),
    ('SM-CAT-03-FABRIC-SOFTENER', 1, 1),
    ('SM-CAT-03-FABRIC-SOFTENER', 2, 2),
    ('SM-CAT-03-HAIR-CONDITIONER', 1, 1),
    ('SM-CAT-03-HAIR-CONDITIONER', 2, 2),
    ('SM-CAT-03-MUDDY-WATER-HALO', 6, 1),
    ('SM-CAT-03-MUDDY-WATER-HALO', 1, 2),
    ('SM-CAT-03-NASAL-MUCUS', 5, 1),
    ('SM-CAT-03-ORANGE-JUICE', 1, 1),
    ('SM-CAT-03-ORANGE-JUICE', 4, 2),
    ('SM-CAT-03-SALIVA', 5, 1),
    ('SM-CAT-03-WATER-BASED-MOISTURIZER', 1, 1),
    ('SM-CAT-03-WATER-BASED-MOISTURIZER', 2, 2)
)
INSERT INTO public.stain_record_reroutes
  (stain_record_id, target_category_id, routing_note, sort_order, review_status, is_suggestion, evidence_note, reviewed_at)
SELECT r.id, c.id, r.reroute_target, m.sort_order, 'approved', false,
       'Resolved from the approved source reroute wording, which names this category explicitly.', now()
FROM m
JOIN public.stain_records r ON r.stable_id = m.stable_id
JOIN public.stain_categories c ON c.category_number = m.cat_number AND c.is_legacy = false
ON CONFLICT (stain_record_id, target_category_id) DO NOTHING;

-- 4. Evidence-based, explicitly unapproved suggestions for the records that stay pending
WITH s(stable_id, cat_number, evidence) AS (
  VALUES
    ('SM-CAT-03-MANGO-DRINK', 1, 'Source wording says "Use combination/pigment". "Combination" matches category 1, but the residue is a food carotenoid, not a paint pigment, so category 7 cannot be confirmed. Human decision required.'),
    ('SM-CAT-03-TOMATO-JUICE', 1, 'Source wording says "Use combination/pigment". "Combination" matches category 1, but the residue is a food carotenoid, not a paint pigment, so category 7 cannot be confirmed. Human decision required.'),
    ('SM-CAT-03-TOOTHPASTE', 6, 'Source wording is a procedure ("Remove loose particulate first"), not a routing instruction. Particulate handling is implied but the destination category is not stated.'),
    ('SM-CAT-03-VEGETABLE-JUICE', 6, 'Source wording explicitly states the composition is uncertain ("Identify the dominant pigment/particulate; stop when composition is uncertain"). No destination can be confirmed.')
)
INSERT INTO public.stain_record_reroutes
  (stain_record_id, target_category_id, routing_note, sort_order, review_status, is_suggestion, evidence_note)
SELECT r.id, c.id, r.reroute_target, 99, 'suggested', true, s.evidence
FROM s
JOIN public.stain_records r ON r.stable_id = s.stable_id
JOIN public.stain_categories c ON c.category_number = s.cat_number AND c.is_legacy = false
ON CONFLICT (stain_record_id, target_category_id) DO NOTHING;

-- 5. Clear the pending flag only for the fully resolved records
UPDATE public.stain_records r
SET reroute_pending = false
WHERE r.reroute_pending = true
  AND EXISTS (SELECT 1 FROM public.stain_record_reroutes x
              WHERE x.stain_record_id = r.id AND x.review_status = 'approved')
  AND NOT EXISTS (SELECT 1 FROM public.stain_record_reroutes x
                  WHERE x.stain_record_id = r.id AND x.is_suggestion = true);

-- 6. Audit trail
INSERT INTO public.content_audit_log (table_name, record_id, action, changed_by, previous_data, new_data)
SELECT 'stain_record_reroutes', x.stain_record_id,
       CASE WHEN x.is_suggestion THEN 'SUGGEST' ELSE 'RESOLVE' END,
       NULL,
       jsonb_build_object('reroute_target', r.reroute_target, 'reroute_pending', true),
       jsonb_build_object('target_category', c.canonical_name, 'review_status', x.review_status,
                          'evidence', x.evidence_note, 'source_document_id', r.source_document_id,
                          'resolved_at', now())
FROM public.stain_record_reroutes x
JOIN public.stain_records r ON r.id = x.stain_record_id
JOIN public.stain_categories c ON c.id = x.target_category_id
WHERE x.reviewed_at IS NOT NULL OR x.is_suggestion = true;

-- 7. Product-guidance feature flag: true only when an approved, active mapping exists
CREATE OR REPLACE FUNCTION public.product_guidance_available(_company_id uuid, _stain_record_id uuid)
RETURNS boolean LANGUAGE sql STABLE SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.product_mappings pm
    JOIN public.professional_products pp ON pp.id = pm.product_id
    WHERE pp.company_id = _company_id
      AND pm.approval_status IN ('approved', 'published')
  ) AND EXISTS (
    SELECT 1 FROM public.product_stain_mappings psm
    WHERE psm.stain_record_id = _stain_record_id
      AND psm.verification_status = 'verified'
  );
$$;
