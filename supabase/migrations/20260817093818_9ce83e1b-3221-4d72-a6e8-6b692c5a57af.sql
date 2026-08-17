-- STEP 7: Professional Product Database. Additive only.

-- 1. Extend existing companies -------------------------------------------------
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS company_ref text UNIQUE,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS trading_name text,
  ADD COLUMN IF NOT EXISTS company_roles text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS parent_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS parent_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS headquarters text,
  ADD COLUMN IF NOT EXISTS official_email text,
  ADD COLUMN IF NOT EXISTS official_phone text,
  ADD COLUMN IF NOT EXISTS is_manufacturer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_distributor boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS countries_served text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS company_verification text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verification_source text,
  ADD COLUMN IF NOT EXISTS logo_ref text;

CREATE TABLE public.company_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  related_company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  related_company_name text,
  relationship_type text NOT NULL,
  claim_text text,
  claim_source text,
  verification text NOT NULL DEFAULT 'relationship_unverified',
  reviewer text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Extend existing kits ------------------------------------------------------
ALTER TABLE public.product_kits
  ADD COLUMN IF NOT EXISTS kit_ref text UNIQUE,
  ADD COLUMN IF NOT EXISTS kit_display_name text,
  ADD COLUMN IF NOT EXISTS kit_edition text,
  ADD COLUMN IF NOT EXISTS product_count_claimed int,
  ADD COLUMN IF NOT EXISTS product_count_verified int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS intended_market text,
  ADD COLUMN IF NOT EXISTS intended_processes text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS pack_configuration text,
  ADD COLUMN IF NOT EXISTS included_accessories text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS official_kit_document uuid,
  ADD COLUMN IF NOT EXISTS effective_date date,
  ADD COLUMN IF NOT EXISTS review_date date,
  ADD COLUMN IF NOT EXISTS notes text;

-- 3. Extend existing products --------------------------------------------------
ALTER TABLE public.professional_products
  ADD COLUMN IF NOT EXISTS product_ref text UNIQUE,
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS alternative_names text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS previous_names text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS replacement_product_id uuid REFERENCES public.professional_products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS product_type text,
  ADD COLUMN IF NOT EXISTS physical_form text,
  ADD COLUMN IF NOT EXISTS odour_description text,
  ADD COLUMN IF NOT EXISTS intended_professional_use text,
  ADD COLUMN IF NOT EXISTS intended_processes text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS country_formulation text,
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS discontinued_date date,
  ADD COLUMN IF NOT EXISTS provisional boolean NOT NULL DEFAULT true;

CREATE TABLE public.kit_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id uuid NOT NULL REFERENCES public.product_kits(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.professional_products(id) ON DELETE CASCADE,
  position int,
  bottle_label text,
  claimed_pack_size text,
  pack_size_verified boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kit_id, product_id)
);

-- 4. Immutable product versions -------------------------------------------------
CREATE TABLE public.product_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.professional_products(id) ON DELETE CASCADE,
  version_ref text NOT NULL,
  formulation_identifier text,
  country text NOT NULL,
  market text,
  effective_date date,
  end_date date,
  product_code text,
  label_version text,
  sds_version text,
  tds_version text,
  instruction_version text,
  known_formulation_change boolean NOT NULL DEFAULT false,
  change_summary text,
  verification_status verification_status NOT NULL DEFAULT 'unverified',
  reviewer text,
  approval_status content_status NOT NULL DEFAULT 'draft',
  superseded_by uuid REFERENCES public.product_versions(id) ON DELETE SET NULL,
  immutable boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, version_ref, country)
);

CREATE TABLE public.product_actives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_version_id uuid NOT NULL REFERENCES public.product_versions(id) ON DELETE CASCADE,
  ingredient text NOT NULL DEFAULT 'Not disclosed',
  concentration text,
  chemical_family text NOT NULL DEFAULT 'Not disclosed',
  solvent_family text NOT NULL DEFAULT 'Not disclosed',
  ph_value text,
  physical_properties text,
  flash_point text,
  enzyme_present text NOT NULL DEFAULT 'not_disclosed',
  oxidizing text NOT NULL DEFAULT 'not_disclosed',
  reducing text NOT NULL DEFAULT 'not_disclosed',
  acidic text NOT NULL DEFAULT 'not_disclosed',
  alkaline text NOT NULL DEFAULT 'not_disclosed',
  surfactant_type text NOT NULL DEFAULT 'Not disclosed',
  hazardous_components text[] NOT NULL DEFAULT '{}',
  disclosure_source text,
  disclosure_confidence text NOT NULL DEFAULT 'none',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_manufacturer_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.professional_products(id) ON DELETE CASCADE,
  product_version_id uuid REFERENCES public.product_versions(id) ON DELETE SET NULL,
  claimed_stain text NOT NULL,
  claimed_category text,
  source_document_id uuid REFERENCES public.source_documents(id) ON DELETE SET NULL,
  source_description text,
  document_version text,
  country text,
  section_reference text,
  claim_status text NOT NULL DEFAULT 'claimed_not_verified',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_use_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid REFERENCES public.product_manufacturer_claims(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.professional_products(id) ON DELETE CASCADE,
  verification_status verification_status NOT NULL DEFAULT 'unverified',
  evidence_level evidence_level NOT NULL DEFAULT 'none',
  internal_trial_reference text,
  reviewer text,
  restriction text,
  approval_status content_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_textile_compatibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_version_id uuid NOT NULL REFERENCES public.product_versions(id) ON DELETE CASCADE,
  target_kind text NOT NULL,
  target_key text NOT NULL,
  suitability text NOT NULL DEFAULT 'insufficient_information',
  main_risk text,
  required_test text,
  source text,
  country text,
  reviewer text,
  approval_status content_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_version_id, target_kind, target_key)
);

CREATE TABLE public.product_process_compatibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_version_id uuid NOT NULL REFERENCES public.product_versions(id) ON DELETE CASCADE,
  process_key text NOT NULL,
  permitted text NOT NULL DEFAULT 'process_not_established',
  rinsing_destination text,
  machine_entry_restriction text,
  required_equipment text,
  source_document_id uuid REFERENCES public.source_documents(id) ON DELETE SET NULL,
  source text,
  country text,
  verification_status verification_status NOT NULL DEFAULT 'unverified',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_version_id, process_key)
);

CREATE TABLE public.product_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_version_id uuid NOT NULL REFERENCES public.product_versions(id) ON DELETE CASCADE,
  application_stage text NOT NULL,
  step_order int NOT NULL DEFAULT 1,
  surface_preparation text,
  product_quantity text,
  dilution text,
  application_method text,
  mechanical_action text,
  contact_time text,
  temperature text,
  moisture_requirement text,
  reapplication_rule text,
  rinsing text,
  flushing text,
  neutralization text,
  drying text,
  inspection_point text,
  maximum_attempts text,
  stop_conditions text[] NOT NULL DEFAULT '{}',
  required_equipment text,
  training_requirement text,
  instruction_origin text NOT NULL DEFAULT 'unverified',
  source_document_id uuid REFERENCES public.source_documents(id) ON DELETE SET NULL,
  source_description text,
  document_type document_type,
  document_version text,
  country text,
  section_reference text,
  reviewer text,
  approval_status content_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_safety_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_version_id uuid NOT NULL REFERENCES public.product_versions(id) ON DELETE CASCADE,
  signal_word text,
  pictograms text[] NOT NULL DEFAULT '{}',
  hazard_statements text[] NOT NULL DEFAULT '{}',
  precautionary_statements text[] NOT NULL DEFAULT '{}',
  routes_of_exposure text[] NOT NULL DEFAULT '{}',
  first_aid_summary text,
  spill_response text,
  storage text,
  disposal text,
  transport_classification text,
  environmental_precautions text,
  incompatible_materials text[] NOT NULL DEFAULT '{}',
  exposure_limits text,
  emergency_contact text,
  sds_country text,
  sds_language text,
  sds_revision_date date,
  sds_version text,
  source_document_id uuid REFERENCES public.source_documents(id) ON DELETE SET NULL,
  verification_status verification_status NOT NULL DEFAULT 'unverified',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_ppe_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_version_id uuid NOT NULL REFERENCES public.product_versions(id) ON DELETE CASCADE,
  ppe_kind text NOT NULL,
  requirement_level text NOT NULL DEFAULT 'not_established',
  material text,
  breakthrough_time text,
  task_or_process text,
  source text,
  country text,
  reviewer text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_incompatibilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_version_id uuid NOT NULL REFERENCES public.product_versions(id) ON DELETE CASCADE,
  incompatible_kind text NOT NULL,
  incompatible_with text NOT NULL,
  incompatible_product_id uuid REFERENCES public.professional_products(id) ON DELETE SET NULL,
  incompatibility_type text NOT NULL,
  severity text NOT NULL DEFAULT 'important',
  required_separation text,
  source text,
  reviewer text,
  approval_status content_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Documents -----------------------------------------------------------------
ALTER TABLE public.source_documents
  ADD COLUMN IF NOT EXISTS document_ref text UNIQUE,
  ADD COLUMN IF NOT EXISTS kit_id uuid REFERENCES public.product_kits(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS issuer text,
  ADD COLUMN IF NOT EXISTS issuer_uncertain boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS publication_date date,
  ADD COLUMN IF NOT EXISTS effective_date date,
  ADD COLUMN IF NOT EXISTS expiry_or_review_date date,
  ADD COLUMN IF NOT EXISTS file_hash text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS superseded_by uuid REFERENCES public.source_documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS document_state text NOT NULL DEFAULT 'uploaded',
  ADD COLUMN IF NOT EXISTS reviewer text,
  ADD COLUMN IF NOT EXISTS review_date date;

CREATE TABLE public.product_document_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.source_documents(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.professional_products(id) ON DELETE SET NULL,
  field_key text NOT NULL,
  extracted_value text,
  page_or_section text,
  extraction_confidence numeric NOT NULL DEFAULT 0,
  user_confirmed boolean NOT NULL DEFAULT false,
  confirmed_by text,
  reviewer_approved boolean NOT NULL DEFAULT false,
  reviewer text,
  safety_critical boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.professional_products(id) ON DELETE CASCADE,
  product_version_id uuid REFERENCES public.product_versions(id) ON DELETE CASCADE,
  conflict_type text NOT NULL,
  field_key text,
  value_a text,
  source_a text,
  value_b text,
  source_b text,
  severity text NOT NULL DEFAULT 'important',
  blocks_publication boolean NOT NULL DEFAULT true,
  resolution text,
  resolved boolean NOT NULL DEFAULT false,
  reviewer text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Pack, cost, country, training, scorecard ----------------------------------
CREATE TABLE public.product_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_version_id uuid NOT NULL REFERENCES public.product_versions(id) ON DELETE CASCADE,
  pack_size numeric,
  measurement_unit text,
  container_type text,
  bottle_colour text,
  closure_type text,
  included_applicator text,
  kit_quantity int,
  case_quantity int,
  country text,
  sku text,
  barcode text,
  effective_date date,
  verification_source text,
  claimed_only boolean NOT NULL DEFAULT true,
  status record_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_version_id uuid NOT NULL REFERENCES public.product_versions(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  purchase_price numeric,
  currency text,
  tax_status text,
  shipping_allocation numeric,
  pack_size numeric,
  usable_quantity numeric,
  estimated_waste numeric,
  cost_per_unit numeric,
  verified_dose numeric,
  dose_unit text,
  dose_verified boolean NOT NULL DEFAULT false,
  cost_per_treatment numeric,
  price_source text,
  price_date date,
  country text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_country_applicability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_version_id uuid NOT NULL REFERENCES public.product_versions(id) ON DELETE CASCADE,
  country text NOT NULL,
  market_status text NOT NULL DEFAULT 'unconfirmed',
  approved_distributor text,
  label_language text,
  sds_jurisdiction text,
  regulatory_classification text,
  measurement_units text NOT NULL DEFAULT 'metric',
  emergency_contact text,
  availability text,
  import_status text,
  document_completeness text NOT NULL DEFAULT 'incomplete',
  country_mismatch boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_version_id, country)
);

CREATE TABLE public.product_training_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_version_id uuid NOT NULL REFERENCES public.product_versions(id) ON DELETE CASCADE,
  requirement_key text NOT NULL,
  required boolean NOT NULL DEFAULT true,
  detail text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_version_id, requirement_key)
);

CREATE TABLE public.product_scorecards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.professional_products(id) ON DELETE CASCADE,
  product_version_id uuid REFERENCES public.product_versions(id) ON DELETE CASCADE,
  checks jsonb NOT NULL DEFAULT '{}'::jsonb,
  overall_status text NOT NULL DEFAULT 'insufficient_documentation',
  can_publish_instructions boolean NOT NULL DEFAULT false,
  blocking_reasons text[] NOT NULL DEFAULT '{}',
  reviewer text,
  last_evaluated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_table text NOT NULL,
  entity_id uuid,
  product_id uuid REFERENCES public.professional_products(id) ON DELETE SET NULL,
  action text NOT NULL,
  field_key text,
  previous_value text,
  new_value text,
  reason text,
  justification_required boolean NOT NULL DEFAULT false,
  source_document_id uuid REFERENCES public.source_documents(id) ON DELETE SET NULL,
  changed_by text,
  reviewer text,
  approval_decision text,
  safety_critical boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Extend organization inventory ---------------------------------------------
ALTER TABLE public.organization_product_inventory
  ADD COLUMN IF NOT EXISTS product_version_id uuid REFERENCES public.product_versions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS batch_number text,
  ADD COLUMN IF NOT EXISTS expiry_date date,
  ADD COLUMN IF NOT EXISTS date_opened date,
  ADD COLUMN IF NOT EXISTS storage_location text,
  ADD COLUMN IF NOT EXISTS staff_permissions text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS document_availability text NOT NULL DEFAULT 'unknown';

-- 8. Grants, RLS, policies, triggers -------------------------------------------
DO $$
DECLARE
  t text;
  staff_readable text[] := ARRAY[
    'company_relationships','kit_products','product_versions','product_packs',
    'product_country_applicability','product_manufacturer_claims','product_use_verifications',
    'product_textile_compatibility','product_process_compatibility','product_training_requirements',
    'product_scorecards'
  ];
  reviewer_only text[] := ARRAY[
    'product_actives','product_instructions','product_safety_data','product_ppe_requirements',
    'product_incompatibilities','product_document_extractions','product_conflicts',
    'product_costs','product_audit_log'
  ];
BEGIN
  FOREACH t IN ARRAY staff_readable || reviewer_only LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY "Maintainers manage %1$s" ON public.%1$I FOR ALL TO authenticated USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()))',
      t);
  END LOOP;

  FOREACH t IN ARRAY staff_readable LOOP
    EXECUTE format(
      'CREATE POLICY "Signed-in users read %1$s" ON public.%1$I FOR SELECT TO authenticated USING (true)', t);
  END LOOP;

  FOREACH t IN ARRAY reviewer_only LOOP
    EXECUTE format(
      'CREATE POLICY "Professionals read %1$s" ON public.%1$I FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''professional_spotter'') OR public.has_role(auth.uid(), ''dry_cleaner'') OR public.has_role(auth.uid(), ''laundry_employee'') OR public.has_role(auth.uid(), ''trainer'') OR public.is_content_maintainer(auth.uid()))',
      t);
  END LOOP;

  FOREACH t IN ARRAY staff_readable || reviewer_only LOOP
    IF t NOT IN ('product_audit_log') THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%1$s_updated BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
        t);
    END IF;
  END LOOP;
END $$;

-- product_versions is append-only: created_at only, no updated_at trigger needed.
DROP TRIGGER IF EXISTS trg_product_versions_updated ON public.product_versions;

CREATE INDEX idx_product_versions_product ON public.product_versions(product_id, country);
CREATE INDEX idx_kit_products_product ON public.kit_products(product_id);
CREATE INDEX idx_product_conflicts_product ON public.product_conflicts(product_id, resolved);
CREATE INDEX idx_product_audit_product ON public.product_audit_log(product_id, created_at DESC);