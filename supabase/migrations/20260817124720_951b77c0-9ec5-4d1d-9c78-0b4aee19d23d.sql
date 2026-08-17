-- Step 12: domestic treatment system (additive, reversible)

CREATE TABLE IF NOT EXISTS public.household_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_key text NOT NULL UNIQUE,
  household_product_id text NOT NULL UNIQUE,
  brand text NOT NULL,
  product_name text NOT NULL,
  product_type text NOT NULL,
  country text NOT NULL,
  pack_size text,
  label_version text,
  ingredient_disclosure text,
  intended_textile_use text[] NOT NULL DEFAULT '{}',
  intended_stain_use text[] NOT NULL DEFAULT '{}',
  fabric_restrictions text[] NOT NULL DEFAULT '{}',
  colour_restrictions text[] NOT NULL DEFAULT '{}',
  application_instructions text,
  quantity text,
  dilution text,
  contact_time text,
  temperature text,
  rinsing text,
  warnings text[] NOT NULL DEFAULT '{}',
  incompatibilities text[] NOT NULL DEFAULT '{}',
  storage text,
  source_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  verification_status verification_status NOT NULL DEFAULT 'unverified',
  review_date date,
  status record_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.household_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.household_products TO authenticated;
GRANT ALL ON public.household_products TO service_role;
ALTER TABLE public.household_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Verified household products are readable"
  ON public.household_products FOR SELECT
  USING (status = 'active' AND verification_status = 'verified');
CREATE POLICY "Maintainers manage household products"
  ON public.household_products FOR ALL TO authenticated
  USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_household_products_updated BEFORE UPDATE ON public.household_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.domestic_treatments
  ADD COLUMN IF NOT EXISTS domestic_treatment_id text,
  ADD COLUMN IF NOT EXISTS workflow_status text;

CREATE TABLE IF NOT EXISTS public.domestic_treatment_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domestic_treatment_id text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  treatment_key text NOT NULL,
  treatment_name text NOT NULL,
  stain_key text NOT NULL,
  stain_variant text,
  intended_condition text[] NOT NULL DEFAULT '{}',
  eligible_roles text[] NOT NULL DEFAULT '{}',
  eligible_countries text[] NOT NULL DEFAULT '{}',
  eligible_fabrics text[] NOT NULL DEFAULT '{}',
  prohibited_fabrics text[] NOT NULL DEFAULT '{}',
  eligible_colours text[] NOT NULL DEFAULT '{}',
  prohibited_colours text[] NOT NULL DEFAULT '{}',
  eligible_constructions text[] NOT NULL DEFAULT '{}',
  prohibited_constructions text[] NOT NULL DEFAULT '{}',
  care_label_requirements text[] NOT NULL DEFAULT '{}',
  minimum_stain_confidence smallint NOT NULL DEFAULT 9,
  fabric_confidence_requirement text NOT NULL DEFAULT 'high',
  maximum_risk_level risk_level NOT NULL DEFAULT 'green',
  required_materials jsonb NOT NULL DEFAULT '[]'::jsonb,
  household_product_key text,
  product_label_requirement text,
  hidden_area_test jsonb,
  preparation jsonb NOT NULL DEFAULT '[]'::jsonb,
  method_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  drying_restrictions text[] NOT NULL DEFAULT '{}',
  maximum_attempts smallint,
  inspection_points text[] NOT NULL DEFAULT '{}',
  actions_to_avoid text[] NOT NULL DEFAULT '{}',
  stop_conditions text[] NOT NULL DEFAULT '{}',
  escalation_point text,
  expected_outcome text,
  confidence_factors jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence_score smallint NOT NULL DEFAULT 0,
  technical_reviewer text,
  safety_reviewer text,
  workflow_status text NOT NULL DEFAULT 'draft',
  last_reviewed_date date,
  next_review_date date,
  revision_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (domestic_treatment_id, version)
);
GRANT SELECT ON public.domestic_treatment_versions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.domestic_treatment_versions TO authenticated;
GRANT ALL ON public.domestic_treatment_versions TO service_role;
ALTER TABLE public.domestic_treatment_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published domestic methods are readable"
  ON public.domestic_treatment_versions FOR SELECT
  USING (workflow_status = 'published' AND confidence_score >= 9);
CREATE POLICY "Maintainers manage domestic method versions"
  ON public.domestic_treatment_versions FOR ALL TO authenticated
  USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_domestic_versions_updated BEFORE UPDATE ON public.domestic_treatment_versions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.domestic_treatment_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domestic_treatment_id text NOT NULL,
  claim text NOT NULL,
  source text NOT NULL,
  source_type document_type,
  issuer text,
  country text,
  publication_date date,
  source_version text,
  relevant_section text,
  fabric_tested text,
  colour_tested text,
  stain_condition text,
  method text,
  control text,
  result text,
  damage_observed text,
  repeatability text,
  reviewer text,
  verification_status verification_status NOT NULL DEFAULT 'unverified',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.domestic_treatment_evidence TO authenticated;
GRANT ALL ON public.domestic_treatment_evidence TO service_role;
ALTER TABLE public.domestic_treatment_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Maintainers manage domestic evidence"
  ON public.domestic_treatment_evidence FOR ALL TO authenticated
  USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_domestic_evidence_updated BEFORE UPDATE ON public.domestic_treatment_evidence
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.domestic_treatment_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id text NOT NULL UNIQUE,
  domestic_treatment_id text NOT NULL,
  method_version integer NOT NULL DEFAULT 1,
  stain_key text,
  fabric text,
  fabric_colour text,
  fabric_finish text,
  household_product_key text,
  method text,
  control_sample text,
  stain_age text,
  stain_quantity text,
  result text,
  damage_observed text,
  drying_result text,
  result_after_laundering text,
  odour text,
  residue text,
  ring_formation boolean NOT NULL DEFAULT false,
  repeatability text,
  decision text,
  reviewer text,
  photographs text[] NOT NULL DEFAULT '{}',
  test_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.domestic_treatment_tests TO authenticated;
GRANT ALL ON public.domestic_treatment_tests TO service_role;
ALTER TABLE public.domestic_treatment_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Maintainers manage domestic tests"
  ON public.domestic_treatment_tests FOR ALL TO authenticated
  USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_domestic_tests_updated BEFORE UPDATE ON public.domestic_treatment_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.domestic_treatment_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domestic_treatment_id text NOT NULL,
  method_version integer NOT NULL DEFAULT 1,
  case_id text,
  user_id uuid,
  attempt_number smallint NOT NULL DEFAULT 1,
  outcome text NOT NULL,
  ring_formed boolean NOT NULL DEFAULT false,
  colour_changed boolean NOT NULL DEFAULT false,
  texture_changed boolean NOT NULL DEFAULT false,
  garment_damaged boolean NOT NULL DEFAULT false,
  odour_remains boolean NOT NULL DEFAULT false,
  user_stopped boolean NOT NULL DEFAULT false,
  professional_referral_used boolean NOT NULL DEFAULT false,
  household_product_key text,
  product_version text,
  photographs text[] NOT NULL DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.domestic_treatment_feedback TO authenticated;
GRANT ALL ON public.domestic_treatment_feedback TO service_role;
ALTER TABLE public.domestic_treatment_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users submit their own domestic feedback"
  ON public.domestic_treatment_feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read their own domestic feedback"
  ON public.domestic_treatment_feedback FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_content_maintainer(auth.uid()));
CREATE POLICY "Maintainers manage domestic feedback"
  ON public.domestic_treatment_feedback FOR UPDATE TO authenticated
  USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE TABLE IF NOT EXISTS public.domestic_adverse_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domestic_treatment_id text NOT NULL,
  method_version integer NOT NULL DEFAULT 1,
  case_id text,
  reported_by uuid,
  damage_type text NOT NULL,
  observations text,
  photographs text[] NOT NULL DEFAULT '{}',
  household_product_key text,
  product_version text,
  case_access_blocked boolean NOT NULL DEFAULT true,
  review_status text NOT NULL DEFAULT 'pending_review',
  reviewer text,
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.domestic_adverse_events TO authenticated;
GRANT ALL ON public.domestic_adverse_events TO service_role;
ALTER TABLE public.domestic_adverse_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users report their own adverse outcomes"
  ON public.domestic_adverse_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reported_by);
CREATE POLICY "Adverse outcomes readable by reporter or maintainers"
  ON public.domestic_adverse_events FOR SELECT TO authenticated
  USING (auth.uid() = reported_by OR public.is_content_maintainer(auth.uid()));
CREATE POLICY "Maintainers review adverse outcomes"
  ON public.domestic_adverse_events FOR UPDATE TO authenticated
  USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_domestic_adverse_updated BEFORE UPDATE ON public.domestic_adverse_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.domestic_content_migration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_location text NOT NULL,
  original_content text NOT NULL,
  stain_key text,
  classification text NOT NULL,
  rejection_reason text,
  publicly_visible boolean NOT NULL DEFAULT false,
  reviewer text,
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.domestic_content_migration TO authenticated;
GRANT ALL ON public.domestic_content_migration TO service_role;
ALTER TABLE public.domestic_content_migration ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Maintainers manage domestic content migration audit"
  ON public.domestic_content_migration FOR ALL TO authenticated
  USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_domestic_versions_stain ON public.domestic_treatment_versions (stain_key);
CREATE INDEX IF NOT EXISTS idx_domestic_versions_status ON public.domestic_treatment_versions (workflow_status);
CREATE INDEX IF NOT EXISTS idx_domestic_evidence_treatment ON public.domestic_treatment_evidence (domestic_treatment_id);
CREATE INDEX IF NOT EXISTS idx_domestic_tests_treatment ON public.domestic_treatment_tests (domestic_treatment_id);
CREATE INDEX IF NOT EXISTS idx_domestic_feedback_treatment ON public.domestic_treatment_feedback (domestic_treatment_id);
CREATE INDEX IF NOT EXISTS idx_domestic_adverse_treatment ON public.domestic_adverse_events (domestic_treatment_id);