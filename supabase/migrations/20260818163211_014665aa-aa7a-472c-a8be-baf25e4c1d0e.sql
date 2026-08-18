CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

DROP INDEX IF EXISTS public.idx_stain_records_norm_trgm;
DROP INDEX IF EXISTS public.idx_stain_aliases_norm_trgm;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

CREATE INDEX IF NOT EXISTS idx_stain_records_norm_trgm
  ON public.stain_records USING gin (public.stain_norm(canonical_name) extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_stain_aliases_norm_trgm
  ON public.stain_record_aliases USING gin (public.stain_norm(alias) extensions.gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.stain_norm(t text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT btrim(regexp_replace(
    replace(replace(replace(replace(lower(coalesce(t, '')),
      'colour', 'color'), 'mould', 'mold'), 'centre', 'center'), 'grey', 'gray'),
    '[^a-z0-9]+', ' ', 'g'))
$$;

CREATE OR REPLACE FUNCTION public.stain_category_counts()
RETURNS TABLE (category_id uuid, record_count bigint)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT r.primary_category_id, count(*)
  FROM public.stain_records r
  JOIN public.stain_categories c ON c.id = r.primary_category_id
  WHERE r.publication_status = 'published' AND c.category_number IS NOT NULL
  GROUP BY 1
$$;

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
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, extensions AS $$
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
       UNION ALL SELECT 9 WHERE length((SELECT t FROM nq)) >= 4 AND extensions.word_similarity((SELECT t FROM nq), b.n) >= 0.6
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
GRANT EXECUTE ON FUNCTION public.stain_category_counts() TO anon, authenticated;