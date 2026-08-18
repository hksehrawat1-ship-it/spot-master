-- 1. Extend stain_categories (additive, non-destructive)
ALTER TABLE public.stain_categories
  ADD COLUMN IF NOT EXISTS category_number integer,
  ADD COLUMN IF NOT EXISTS canonical_name text,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS core_rule text,
  ADD COLUMN IF NOT EXISTS routing_note text,
  ADD COLUMN IF NOT EXISTS display_order integer,
  ADD COLUMN IF NOT EXISTS version text NOT NULL DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS active_status boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS source_document_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS stain_categories_category_number_key
  ON public.stain_categories (category_number) WHERE category_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS stain_categories_slug_key
  ON public.stain_categories (slug) WHERE slug IS NOT NULL;

-- 2. import_batches
CREATE TABLE IF NOT EXISTS public.import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_name text NOT NULL,
  batch_number integer NOT NULL UNIQUE,
  expected_document_count integer NOT NULL DEFAULT 0,
  expected_category_numbers integer[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'processing',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  total_records_imported integer NOT NULL DEFAULT 0,
  total_records_updated integer NOT NULL DEFAULT 0,
  total_duplicates_prevented integer NOT NULL DEFAULT 0,
  total_records_requiring_review integer NOT NULL DEFAULT 0,
  validation_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.import_batches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.import_batches TO authenticated;
GRANT ALL ON public.import_batches TO service_role;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read import batches" ON public.import_batches FOR SELECT USING (true);
CREATE POLICY "Maintainers manage import batches" ON public.import_batches FOR ALL TO authenticated
  USING (is_content_maintainer(auth.uid())) WITH CHECK (is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_import_batches_updated BEFORE UPDATE ON public.import_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. stain_records
CREATE TABLE IF NOT EXISTS public.stain_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stable_id text NOT NULL UNIQUE,
  canonical_name text NOT NULL,
  primary_category_id uuid NOT NULL REFERENCES public.stain_categories(id) ON DELETE RESTRICT,
  searchable_secondary_category_ids uuid[] NOT NULL DEFAULT '{}',
  typical_chemistry text,
  dominant_residue text,
  initial_outcome_class text NOT NULL,
  mandatory_stop_or_reroute_trigger text,
  aliases text[] NOT NULL DEFAULT '{}',
  regional_terms text[] NOT NULL DEFAULT '{}',
  physical_state text,
  fresh boolean NOT NULL DEFAULT false,
  dried boolean NOT NULL DEFAULT false,
  aged boolean NOT NULL DEFAULT false,
  heat_set boolean NOT NULL DEFAULT false,
  oxidized boolean NOT NULL DEFAULT false,
  cured boolean NOT NULL DEFAULT false,
  previously_treated boolean NOT NULL DEFAULT false,
  biological_risk boolean NOT NULL DEFAULT false,
  chemical_risk boolean NOT NULL DEFAULT false,
  fire_risk boolean NOT NULL DEFAULT false,
  inhalation_risk boolean NOT NULL DEFAULT false,
  contamination_risk boolean NOT NULL DEFAULT false,
  damage_suspected boolean NOT NULL DEFAULT false,
  deposit_present boolean NOT NULL DEFAULT false,
  hidden_test_required boolean NOT NULL DEFAULT false,
  reroute_target text,
  reroute_pending boolean NOT NULL DEFAULT false,
  publication_status text NOT NULL DEFAULT 'published',
  review_status text NOT NULL DEFAULT 'approved',
  source_document_id uuid,
  source_section text,
  category_version text,
  import_batch_id uuid REFERENCES public.import_batches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stain_records_outcome_chk CHECK (initial_outcome_class IN
    ('often_reducible','variable','reroute_required','high_risk','damage_permanent','blocked_initially'))
);
CREATE INDEX IF NOT EXISTS idx_stain_records_category ON public.stain_records(primary_category_id);
CREATE INDEX IF NOT EXISTS idx_stain_records_name ON public.stain_records(lower(canonical_name));
GRANT SELECT ON public.stain_records TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stain_records TO authenticated;
GRANT ALL ON public.stain_records TO service_role;
ALTER TABLE public.stain_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published stain records" ON public.stain_records FOR SELECT
  USING (publication_status = 'published');
CREATE POLICY "Maintainers manage stain records" ON public.stain_records FOR ALL TO authenticated
  USING (is_content_maintainer(auth.uid())) WITH CHECK (is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_stain_records_updated BEFORE UPDATE ON public.stain_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. stain_record_aliases (public.stain_aliases already exists for master_stains)
CREATE TABLE IF NOT EXISTS public.stain_record_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stain_record_id uuid NOT NULL REFERENCES public.stain_records(id) ON DELETE CASCADE,
  alias text NOT NULL,
  alias_type text NOT NULL DEFAULT 'alternative_name',
  language text NOT NULL DEFAULT 'en',
  region text,
  source_document_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stain_record_id, alias, language)
);
CREATE INDEX IF NOT EXISTS idx_stain_record_aliases_alias ON public.stain_record_aliases(lower(alias));
GRANT SELECT ON public.stain_record_aliases TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stain_record_aliases TO authenticated;
GRANT ALL ON public.stain_record_aliases TO service_role;
ALTER TABLE public.stain_record_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read stain record aliases" ON public.stain_record_aliases FOR SELECT USING (true);
CREATE POLICY "Maintainers manage stain record aliases" ON public.stain_record_aliases FOR ALL TO authenticated
  USING (is_content_maintainer(auth.uid())) WITH CHECK (is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_stain_record_aliases_updated BEFORE UPDATE ON public.stain_record_aliases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. category_relationships
CREATE TABLE IF NOT EXISTS public.category_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_category_id uuid NOT NULL REFERENCES public.stain_categories(id) ON DELETE CASCADE,
  to_category_number integer NOT NULL,
  to_category_id uuid REFERENCES public.stain_categories(id) ON DELETE SET NULL,
  relationship_type text NOT NULL DEFAULT 'reroute',
  status text NOT NULL DEFAULT 'active',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_category_id, to_category_number, relationship_type)
);
GRANT SELECT ON public.category_relationships TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.category_relationships TO authenticated;
GRANT ALL ON public.category_relationships TO service_role;
ALTER TABLE public.category_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read category relationships" ON public.category_relationships FOR SELECT USING (true);
CREATE POLICY "Maintainers manage category relationships" ON public.category_relationships FOR ALL TO authenticated
  USING (is_content_maintainer(auth.uid())) WITH CHECK (is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_category_relationships_updated BEFORE UPDATE ON public.category_relationships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. stop_return_rules
CREATE TABLE IF NOT EXISTS public.stop_return_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.stain_categories(id) ON DELETE CASCADE,
  rule_order integer NOT NULL DEFAULT 0,
  rule_text text NOT NULL,
  rule_type text NOT NULL DEFAULT 'stop_and_return',
  customer_wording text,
  source_document_id uuid,
  import_batch_id uuid REFERENCES public.import_batches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, rule_order, rule_type)
);
GRANT SELECT ON public.stop_return_rules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stop_return_rules TO authenticated;
GRANT ALL ON public.stop_return_rules TO service_role;
ALTER TABLE public.stop_return_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read stop return rules" ON public.stop_return_rules FOR SELECT USING (true);
CREATE POLICY "Maintainers manage stop return rules" ON public.stop_return_rules FOR ALL TO authenticated
  USING (is_content_maintainer(auth.uid())) WITH CHECK (is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_stop_return_rules_updated BEFORE UPDATE ON public.stop_return_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. manufacturers / manufacturer_products / product_stain_mappings (kept ready and empty)
CREATE TABLE IF NOT EXISTS public.manufacturers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  country text,
  website text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.manufacturers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manufacturers TO authenticated;
GRANT ALL ON public.manufacturers TO service_role;
ALTER TABLE public.manufacturers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read manufacturers" ON public.manufacturers FOR SELECT USING (true);
CREATE POLICY "Maintainers manage manufacturers" ON public.manufacturers FOR ALL TO authenticated
  USING (is_content_maintainer(auth.uid())) WITH CHECK (is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_manufacturers_updated BEFORE UPDATE ON public.manufacturers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.manufacturer_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id uuid NOT NULL REFERENCES public.manufacturers(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  product_code text,
  source_document_id uuid,
  verification_status text NOT NULL DEFAULT 'unverified',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (manufacturer_id, product_name)
);
GRANT SELECT ON public.manufacturer_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manufacturer_products TO authenticated;
GRANT ALL ON public.manufacturer_products TO service_role;
ALTER TABLE public.manufacturer_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read manufacturer products" ON public.manufacturer_products FOR SELECT USING (true);
CREATE POLICY "Maintainers manage manufacturer products" ON public.manufacturer_products FOR ALL TO authenticated
  USING (is_content_maintainer(auth.uid())) WITH CHECK (is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_manufacturer_products_updated BEFORE UPDATE ON public.manufacturer_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.product_stain_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_product_id uuid NOT NULL REFERENCES public.manufacturer_products(id) ON DELETE CASCADE,
  stain_record_id uuid NOT NULL REFERENCES public.stain_records(id) ON DELETE CASCADE,
  evidence_note text,
  source_document_id uuid,
  verification_status text NOT NULL DEFAULT 'unverified',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (manufacturer_product_id, stain_record_id)
);
GRANT SELECT ON public.product_stain_mappings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_stain_mappings TO authenticated;
GRANT ALL ON public.product_stain_mappings TO service_role;
ALTER TABLE public.product_stain_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product stain mappings" ON public.product_stain_mappings FOR SELECT USING (true);
CREATE POLICY "Maintainers manage product stain mappings" ON public.product_stain_mappings FOR ALL TO authenticated
  USING (is_content_maintainer(auth.uid())) WITH CHECK (is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_product_stain_mappings_updated BEFORE UPDATE ON public.product_stain_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();