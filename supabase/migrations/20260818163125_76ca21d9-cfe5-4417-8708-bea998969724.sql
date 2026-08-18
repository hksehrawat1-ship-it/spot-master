-- 1. Reroute normalisation ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stain_record_reroutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stain_record_id uuid NOT NULL REFERENCES public.stain_records(id) ON DELETE CASCADE,
  target_category_id uuid NOT NULL REFERENCES public.stain_categories(id) ON DELETE RESTRICT,
  routing_note text,
  sort_order integer NOT NULL DEFAULT 0,
  review_status text NOT NULL DEFAULT 'approved',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stain_record_reroutes_unique UNIQUE (stain_record_id, target_category_id)
);

GRANT SELECT ON public.stain_record_reroutes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stain_record_reroutes TO authenticated;
GRANT ALL ON public.stain_record_reroutes TO service_role;

ALTER TABLE public.stain_record_reroutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read stain record reroutes"
  ON public.stain_record_reroutes FOR SELECT USING (true);

CREATE POLICY "Maintainers manage stain record reroutes"
  ON public.stain_record_reroutes FOR ALL TO authenticated
  USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE TRIGGER trg_stain_record_reroutes_updated
  BEFORE UPDATE ON public.stain_record_reroutes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_stain_record_reroutes_record
  ON public.stain_record_reroutes(stain_record_id);

-- Backfill from free text. Only exact "Category N", canonical name or slug matches are accepted.
DO $backfill$
DECLARE
  rec RECORD;
  tok text;
  cat_id uuid;
  idx int;
  ok boolean;
  ids uuid[];
BEGIN
  FOR rec IN
    SELECT id, reroute_target FROM public.stain_records
    WHERE reroute_target IS NOT NULL AND btrim(reroute_target) <> ''
  LOOP
    ok := true;
    idx := 0;
    ids := ARRAY[]::uuid[];
    FOREACH tok IN ARRAY string_to_array(rec.reroute_target, ',')
    LOOP
      tok := btrim(tok);
      CONTINUE WHEN tok = '';
      cat_id := NULL;
      IF tok ~* '^category\s+\d+$' THEN
        SELECT c.id INTO cat_id FROM public.stain_categories c
        WHERE c.category_number = (regexp_replace(tok, '\D', '', 'g'))::int;
      ELSE
        SELECT c.id INTO cat_id FROM public.stain_categories c
        WHERE c.category_number IS NOT NULL
          AND (lower(c.canonical_name) = lower(tok) OR lower(c.slug) = lower(tok));
      END IF;
      IF cat_id IS NULL THEN
        ok := false;
        EXIT;
      END IF;
      idx := idx + 1;
      ids := ids || cat_id;
    END LOOP;

    IF ok AND array_length(ids, 1) > 0 THEN
      FOR idx IN 1..array_length(ids, 1) LOOP
        INSERT INTO public.stain_record_reroutes (stain_record_id, target_category_id, routing_note, sort_order, review_status)
        VALUES (rec.id, ids[idx], rec.reroute_target, idx, 'approved')
        ON CONFLICT (stain_record_id, target_category_id) DO NOTHING;
      END LOOP;
      UPDATE public.stain_records SET reroute_pending = false WHERE id = rec.id;
    ELSE
      UPDATE public.stain_records SET reroute_pending = true WHERE id = rec.id;
    END IF;
  END LOOP;
END
$backfill$;

-- 2. Alias governance ---------------------------------------------------------
ALTER TABLE public.stain_record_aliases
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS source_note text;

-- 3. Legacy category control ---------------------------------------------------
ALTER TABLE public.stain_categories
  ADD COLUMN IF NOT EXISTS is_legacy boolean NOT NULL DEFAULT false;

UPDATE public.stain_categories SET is_legacy = true WHERE category_number IS NULL;
UPDATE public.stain_categories SET is_legacy = false WHERE category_number IS NOT NULL;

-- 4. Search infrastructure -----------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION public.stain_norm(t text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT btrim(regexp_replace(
    replace(replace(replace(replace(lower(coalesce(t, '')),
      'colour', 'color'), 'mould', 'mold'), 'centre', 'center'), 'grey', 'gray'),
    '[^a-z0-9]+', ' ', 'g'))
$$;

CREATE INDEX IF NOT EXISTS idx_stain_records_norm_trgm
  ON public.stain_records USING gin (public.stain_norm(canonical_name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_stain_aliases_norm_trgm
  ON public.stain_record_aliases USING gin (public.stain_norm(alias) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_stain_records_stable_id_lower
  ON public.stain_records (lower(stable_id));

CREATE OR REPLACE FUNCTION public.search_stains(q text, lim int DEFAULT 25, off int DEFAULT 0)
RETURNS TABLE (
  id uuid,
  stable_id text,
  canonical_name text,
  primary_category_id uuid,
  category_name text,
  category_slug text,
  initial_outcome_class text,
  typical_chemistry text,
  mandatory_stop_or_reroute_trigger text,
  hidden_test_required boolean,
  biological_risk boolean,
  chemical_risk boolean,
  fire_risk boolean,
  damage_suspected boolean,
  reroute_pending boolean,
  match_rank int,
  total_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
WITH nq AS (
  SELECT public.stain_norm(q) AS t
), toks AS (
  SELECT tk FROM nq, unnest(string_to_array(nq.t, ' ')) AS tk WHERE length(tk) >= 3
), base AS (
  SELECT r.*, public.stain_norm(r.canonical_name) AS n,
         c.canonical_name AS cat_name, c.slug AS cat_slug,
         public.stain_norm(c.canonical_name) AS cn
  FROM public.stain_records r
  JOIN public.stain_categories c ON c.id = r.primary_category_id
  WHERE r.publication_status = 'published' AND c.category_number IS NOT NULL
), al AS (
  SELECT a.stain_record_id, public.stain_norm(a.alias) AS an,
         (a.language <> 'en' OR a.region IS NOT NULL) AS regional
  FROM public.stain_record_aliases a
  WHERE a.is_active AND a.review_status = 'approved'
), ranked AS (
  SELECT b.*,
    (SELECT min(rk) FROM (
       SELECT 1 AS rk WHERE b.n = (SELECT t FROM nq)
       UNION ALL SELECT 2 WHERE EXISTS (SELECT 1 FROM al WHERE al.stain_record_id = b.id AND al.an = (SELECT t FROM nq))
       UNION ALL SELECT 3 WHERE b.n LIKE (SELECT t FROM nq) || '%'
       UNION ALL SELECT 4 WHERE EXISTS (SELECT 1 FROM al WHERE al.stain_record_id = b.id AND al.an LIKE (SELECT t FROM nq) || '%')
       UNION ALL SELECT 5 WHERE EXISTS (SELECT 1 FROM al WHERE al.stain_record_id = b.id AND al.regional AND al.an ~ ('\m' || (SELECT t FROM nq)))
       UNION ALL SELECT 6 WHERE b.n ~ ('\m' || (SELECT t FROM nq))
       UNION ALL SELECT 6 WHERE EXISTS (SELECT 1 FROM al WHERE al.stain_record_id = b.id AND al.an ~ ('\m' || (SELECT t FROM nq)))
       UNION ALL SELECT 7 WHERE b.cn ~ ('\m' || (SELECT t FROM nq)) OR lower(b.stable_id) = lower(q)
       UNION ALL SELECT 7 WHERE lower(b.stable_id) LIKE '%' || lower(coalesce(q, '')) || '%' AND length(coalesce(q, '')) >= 6
       UNION ALL SELECT 8 WHERE (SELECT count(*) FROM toks) > 1
                            AND EXISTS (SELECT 1 FROM toks WHERE b.n ~ ('\m' || toks.tk) OR b.cn ~ ('\m' || toks.tk))
       UNION ALL SELECT 9 WHERE length((SELECT t FROM nq)) >= 4 AND word_similarity((SELECT t FROM nq), b.n) >= 0.6
    ) s) AS rk
  FROM base b
), hits AS (
  SELECT * FROM ranked WHERE rk IS NOT NULL
)
SELECT h.id, h.stable_id, h.canonical_name, h.primary_category_id, h.cat_name, h.cat_slug,
       h.initial_outcome_class, h.typical_chemistry, h.mandatory_stop_or_reroute_trigger,
       h.hidden_test_required, h.biological_risk, h.chemical_risk, h.fire_risk,
       h.damage_suspected, h.reroute_pending, h.rk,
       (SELECT count(*) FROM hits) AS total_count
FROM hits h
ORDER BY h.rk, h.canonical_name
LIMIT greatest(coalesce(lim, 25), 1) OFFSET greatest(coalesce(off, 0), 0)
$$;

GRANT EXECUTE ON FUNCTION public.search_stains(text, int, int) TO anon, authenticated;

-- 5. Server-side category counts ------------------------------------------------
CREATE OR REPLACE FUNCTION public.stain_category_counts()
RETURNS TABLE (category_id uuid, record_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.primary_category_id, count(*)
  FROM public.stain_records r
  JOIN public.stain_categories c ON c.id = r.primary_category_id
  WHERE r.publication_status = 'published' AND c.category_number IS NOT NULL
  GROUP BY 1
$$;

GRANT EXECUTE ON FUNCTION public.stain_category_counts() TO anon, authenticated;

-- 6. Verified everyday search terms ------------------------------------------------
INSERT INTO public.stain_record_aliases (stain_record_id, alias, alias_type, language, region, review_status, is_active, source_note)
SELECT r.id, v.alias, v.alias_type, v.lang, v.region, 'approved', true, v.note
FROM (VALUES
  ('SM-CAT-01-TURMERIC-CURRY', 'haldi', 'regional_term', 'hi', 'IN', 'Common Indian term for turmeric'),
  ('SM-CAT-04-TURMERIC-POWDER-PASTE', 'haldi', 'regional_term', 'hi', 'IN', 'Common Indian term for turmeric'),
  ('SM-CAT-06-TURMERIC-POWDER', 'haldi', 'regional_term', 'hi', 'IN', 'Common Indian term for turmeric'),
  ('SM-CAT-09-CURRY-TURMERIC-AGEING', 'haldi', 'regional_term', 'hi', 'IN', 'Common Indian term for turmeric'),
  ('SM-CAT-04-BALLPOINT-INK', 'ball pen', 'alternative_name', 'en', 'IN', 'Common Indian English term for a ballpoint pen'),
  ('SM-CAT-04-BALLPOINT-INK', 'ball point pen ink', 'alternative_name', 'en', NULL, 'Spelling variant'),
  ('SM-CAT-10-DRYER-SET-GUM-ADHESIVE', 'chewing gum', 'alternative_name', 'en', NULL, 'Everyday term for set gum deposit'),
  ('SM-CAT-12-PEROXIDE-COLOUR-LOSS', 'hydrogen peroxide', 'alternative_name', 'en', NULL, 'Chemical name of the agent'),
  ('SM-CAT-12-PEROXIDE-YELLOWING', 'hydrogen peroxide', 'alternative_name', 'en', NULL, 'Chemical name of the agent')
) AS v(sid, alias, alias_type, lang, region, note)
JOIN public.stain_records r ON r.stable_id = v.sid
ON CONFLICT (stain_record_id, alias, language) DO NOTHING;