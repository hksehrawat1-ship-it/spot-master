-- =========================================================
-- STAIN MASTER — STEP 1: PERMANENT FOUNDATION
-- =========================================================

-- ---------- ENUMS ----------
CREATE TYPE public.app_role AS ENUM (
  'domestic_user','laundry_employee','dry_cleaner','professional_spotter',
  'trainer','learner','technical_reviewer','content_admin','system_admin'
);

CREATE TYPE public.content_status AS ENUM (
  'draft','under_review','approved','published','needs_review','suspended','archived'
);

CREATE TYPE public.risk_level AS ENUM ('green','amber','red','black');

CREATE TYPE public.verification_status AS ENUM (
  'unverified','pending_review','verified','insufficient_information','disputed'
);

CREATE TYPE public.suitability_decision AS ENUM (
  'recommended','recommended_after_testing','professional_use_only',
  'domestic_use_suitable','not_recommended','insufficient_information'
);

CREATE TYPE public.evidence_level AS ENUM (
  'manufacturer_claim','label_documented','sds_tds_documented',
  'independent_trial','textile_standard','none'
);

CREATE TYPE public.document_type AS ENUM (
  'product_label','sds','tds','manufacturer_instruction','spotting_chart',
  'equipment_manual','textile_standard','internal_trial','credible_reference'
);

CREATE TYPE public.sensitivity_level AS ENUM ('none','low','moderate','high','critical','unknown');

CREATE TYPE public.record_status AS ENUM ('active','discontinued','archived');

-- ---------- SHARED TRIGGER ----------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ---------- PROFILES ----------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  country TEXT,
  organization_id UUID,
  training_level TEXT NOT NULL DEFAULT 'none',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ---------- USER ROLES ----------
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  granted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- content maintainers = content_admin | technical_reviewer | system_admin
CREATE OR REPLACE FUNCTION public.is_content_maintainer(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('content_admin','technical_reviewer','system_admin')
  );
$$;

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'system_admin'));

CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_content_maintainer(auth.uid()));
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- ORGANIZATIONS ----------
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  organization_type TEXT,
  country TEXT,
  location TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  active_product_kits JSONB NOT NULL DEFAULT '[]'::jsonb,
  status public.record_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read organizations" ON public.organizations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage organizations" ON public.organizations
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'system_admin'))
  WITH CHECK (public.has_role(auth.uid(),'system_admin'));
CREATE TRIGGER trg_org_updated BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_organization_fk FOREIGN KEY (organization_id)
  REFERENCES public.organizations(id) ON DELETE SET NULL;

-- =========================================================
-- LAYER A: STAIN KNOWLEDGE
-- =========================================================
CREATE TABLE public.stain_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stain_categories TO anon, authenticated;
GRANT ALL ON public.stain_categories TO service_role;
ALTER TABLE public.stain_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published categories" ON public.stain_categories
  FOR SELECT USING (status IN ('published','approved'));
CREATE POLICY "Maintainers manage categories" ON public.stain_categories
  FOR ALL TO authenticated USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_cat_updated BEFORE UPDATE ON public.stain_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.stains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stain_id TEXT NOT NULL UNIQUE,
  common_name TEXT NOT NULL,
  alternative_names TEXT[] NOT NULL DEFAULT '{}',
  primary_category_id UUID REFERENCES public.stain_categories(id) ON DELETE RESTRICT,
  description TEXT,
  common_sources TEXT[] NOT NULL DEFAULT '{}',
  likely_composition TEXT,
  solubility TEXT,
  bonding_behavior TEXT,
  effect_of_heat TEXT,
  effect_of_ageing TEXT,
  effect_of_oxidation TEXT,
  effect_of_acidity TEXT,
  effect_of_alkalinity TEXT,
  treatment_principle_summary TEXT,
  first_response TEXT,
  heat_warning TEXT,
  expected_outcome TEXT,
  escalation_rule TEXT,
  identification_notes TEXT,
  status public.content_status NOT NULL DEFAULT 'draft',
  content_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stains_category ON public.stains(primary_category_id);
CREATE INDEX idx_stains_altnames ON public.stains USING GIN (alternative_names);
CREATE INDEX idx_stains_sources ON public.stains USING GIN (common_sources);
GRANT SELECT ON public.stains TO anon, authenticated;
GRANT ALL ON public.stains TO service_role;
ALTER TABLE public.stains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published stains" ON public.stains
  FOR SELECT USING (status IN ('published','approved'));
CREATE POLICY "Maintainers manage stains" ON public.stains
  FOR ALL TO authenticated USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_stains_updated BEFORE UPDATE ON public.stains
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  tag_group TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tags TO anon, authenticated;
GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Maintainers manage tags" ON public.tags
  FOR ALL TO authenticated USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE TABLE public.stain_tags (
  stain_id UUID NOT NULL REFERENCES public.stains(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (stain_id, tag_id)
);
GRANT SELECT ON public.stain_tags TO anon, authenticated;
GRANT ALL ON public.stain_tags TO service_role;
ALTER TABLE public.stain_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read stain tags" ON public.stain_tags FOR SELECT USING (true);
CREATE POLICY "Maintainers manage stain tags" ON public.stain_tags
  FOR ALL TO authenticated USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));

-- =========================================================
-- LAYER B: GARMENT & TEXTILE RISK
-- =========================================================
CREATE TABLE public.fabrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fabric_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  common_names TEXT[] NOT NULL DEFAULT '{}',
  material_family TEXT NOT NULL,
  general_properties TEXT,
  water_sensitivity public.sensitivity_level NOT NULL DEFAULT 'unknown',
  solvent_sensitivity public.sensitivity_level NOT NULL DEFAULT 'unknown',
  acid_sensitivity public.sensitivity_level NOT NULL DEFAULT 'unknown',
  alkali_sensitivity public.sensitivity_level NOT NULL DEFAULT 'unknown',
  oxidation_sensitivity public.sensitivity_level NOT NULL DEFAULT 'unknown',
  reduction_sensitivity public.sensitivity_level NOT NULL DEFAULT 'unknown',
  heat_sensitivity public.sensitivity_level NOT NULL DEFAULT 'unknown',
  mechanical_action_sensitivity public.sensitivity_level NOT NULL DEFAULT 'unknown',
  colourfastness_concerns TEXT,
  professional_referral_notes TEXT,
  status public.content_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fabrics TO anon, authenticated;
GRANT ALL ON public.fabrics TO service_role;
ALTER TABLE public.fabrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published fabrics" ON public.fabrics
  FOR SELECT USING (status IN ('published','approved'));
CREATE POLICY "Maintainers manage fabrics" ON public.fabrics
  FOR ALL TO authenticated USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_fabrics_updated BEFORE UPDATE ON public.fabrics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.garment_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  garment_type TEXT,
  known_fibre TEXT,
  suspected_material_family TEXT,
  material_confidence SMALLINT CHECK (material_confidence BETWEEN 0 AND 10),
  colour_group TEXT,
  multicoloured BOOLEAN NOT NULL DEFAULT false,
  surface_print BOOLEAN NOT NULL DEFAULT false,
  lining BOOLEAN NOT NULL DEFAULT false,
  interlining BOOLEAN NOT NULL DEFAULT false,
  coating BOOLEAN NOT NULL DEFAULT false,
  waterproof_finish BOOLEAN NOT NULL DEFAULT false,
  lamination BOOLEAN NOT NULL DEFAULT false,
  adhesive_construction BOOLEAN NOT NULL DEFAULT false,
  embroidery BOOLEAN NOT NULL DEFAULT false,
  beads BOOLEAN NOT NULL DEFAULT false,
  sequins BOOLEAN NOT NULL DEFAULT false,
  metallic_thread BOOLEAN NOT NULL DEFAULT false,
  leather_or_suede_components BOOLEAN NOT NULL DEFAULT false,
  garment_value TEXT,
  sentimental_value BOOLEAN NOT NULL DEFAULT false,
  existing_damage TEXT,
  previous_successful_cleaning_method TEXT,
  care_label_available BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.garment_profiles TO authenticated;
GRANT ALL ON public.garment_profiles TO service_role;
ALTER TABLE public.garment_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own garments" ON public.garment_profiles
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_garment_updated BEFORE UPDATE ON public.garment_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- LAYER C: TREATMENT PRINCIPLES
-- =========================================================
CREATE TABLE public.treatment_principles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  principle_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  applicable_stain_categories UUID[] NOT NULL DEFAULT '{}',
  required_conditions TEXT[] NOT NULL DEFAULT '{}',
  prohibited_conditions TEXT[] NOT NULL DEFAULT '{}',
  heat_rule TEXT,
  mechanical_action_rule TEXT,
  flushing_principle TEXT,
  neutralization_principle TEXT,
  inspection_requirement TEXT,
  stop_conditions TEXT[] NOT NULL DEFAULT '{}',
  professional_skill_requirement TEXT,
  treatment_stage TEXT,
  status public.content_status NOT NULL DEFAULT 'draft',
  evidence_level public.evidence_level NOT NULL DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.treatment_principles TO anon, authenticated;
GRANT ALL ON public.treatment_principles TO service_role;
ALTER TABLE public.treatment_principles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published principles" ON public.treatment_principles
  FOR SELECT USING (status IN ('published','approved'));
CREATE POLICY "Maintainers manage principles" ON public.treatment_principles
  FOR ALL TO authenticated USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_principles_updated BEFORE UPDATE ON public.treatment_principles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- LAYER D: PROFESSIONAL PRODUCTS
-- =========================================================
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL UNIQUE,
  legal_name TEXT,
  country TEXT,
  manufacturer_or_distributor TEXT,
  website TEXT,
  verification_status public.verification_status NOT NULL DEFAULT 'unverified',
  notes TEXT,
  status public.record_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read companies" ON public.companies
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Maintainers manage companies" ON public.companies
  FOR ALL TO authenticated USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.product_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  kit_name TEXT NOT NULL,
  kit_version TEXT,
  number_of_products INT,
  intended_users TEXT[] NOT NULL DEFAULT '{}',
  country_availability TEXT[] NOT NULL DEFAULT '{}',
  source_status public.verification_status NOT NULL DEFAULT 'unverified',
  status public.record_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_kits TO authenticated;
GRANT ALL ON public.product_kits TO service_role;
ALTER TABLE public.product_kits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read kits" ON public.product_kits
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Maintainers manage kits" ON public.product_kits
  FOR ALL TO authenticated USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_kits_updated BEFORE UPDATE ON public.product_kits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.professional_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  kit_id UUID REFERENCES public.product_kits(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_code TEXT,
  product_colour TEXT,
  pack_sizes TEXT[] NOT NULL DEFAULT '{}',
  active_chemistry TEXT NOT NULL DEFAULT 'Not disclosed',
  chemical_family TEXT NOT NULL DEFAULT 'Not disclosed',
  intended_stain_categories UUID[] NOT NULL DEFAULT '{}',
  intended_stains UUID[] NOT NULL DEFAULT '{}',
  compatible_materials TEXT[] NOT NULL DEFAULT '{}',
  prohibited_materials TEXT[] NOT NULL DEFAULT '{}',
  applicable_colours TEXT[] NOT NULL DEFAULT '{}',
  dilution_instruction TEXT NOT NULL DEFAULT 'Not disclosed',
  contact_time TEXT NOT NULL DEFAULT 'Not disclosed',
  temperature_limits TEXT NOT NULL DEFAULT 'Not disclosed',
  application_method TEXT NOT NULL DEFAULT 'Not disclosed',
  rinsing_instruction TEXT NOT NULL DEFAULT 'Not disclosed',
  neutralization_instruction TEXT NOT NULL DEFAULT 'Not disclosed',
  ppe TEXT,
  ventilation TEXT,
  storage TEXT,
  incompatibilities TEXT,
  safety_warnings TEXT,
  training_requirement TEXT,
  manufacturer_claims TEXT,
  verified_performance_evidence TEXT,
  cost_per_use NUMERIC,
  country_availability TEXT[] NOT NULL DEFAULT '{}',
  label_version TEXT,
  sds_version TEXT,
  tds_version TEXT,
  verification_status public.verification_status NOT NULL DEFAULT 'unverified',
  status public.content_status NOT NULL DEFAULT 'draft',
  record_state public.record_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_company ON public.professional_products(company_id);
GRANT SELECT ON public.professional_products TO authenticated;
GRANT ALL ON public.professional_products TO service_role;
ALTER TABLE public.professional_products ENABLE ROW LEVEL SECURITY;
-- Only verified + approved/published product info is readable by professionals; maintainers see everything.
CREATE POLICY "Professionals read approved products" ON public.professional_products
  FOR SELECT TO authenticated USING (
    (status IN ('approved','published') AND verification_status = 'verified' AND (
      public.has_role(auth.uid(),'professional_spotter') OR
      public.has_role(auth.uid(),'dry_cleaner') OR
      public.has_role(auth.uid(),'laundry_employee') OR
      public.has_role(auth.uid(),'trainer')
    ))
    OR public.is_content_maintainer(auth.uid())
  );
CREATE POLICY "Maintainers manage products" ON public.professional_products
  FOR ALL TO authenticated USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.professional_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- LAYER G: SOURCE DOCUMENTS
-- =========================================================
CREATE TABLE public.source_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.professional_products(id) ON DELETE SET NULL,
  document_type public.document_type NOT NULL,
  document_title TEXT NOT NULL,
  file_or_url TEXT,
  issuing_organization TEXT,
  country TEXT,
  publication_date DATE,
  revision_date DATE,
  version TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  verification_status public.verification_status NOT NULL DEFAULT 'unverified',
  supersedes_document_id UUID REFERENCES public.source_documents(id) ON DELETE SET NULL,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.source_documents TO authenticated;
GRANT ALL ON public.source_documents TO service_role;
ALTER TABLE public.source_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Maintainers read documents" ON public.source_documents
  FOR SELECT TO authenticated USING (public.is_content_maintainer(auth.uid()));
CREATE POLICY "Maintainers manage documents" ON public.source_documents
  FOR ALL TO authenticated USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_docs_updated BEFORE UPDATE ON public.source_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- LAYER E: PRODUCT ↔ TREATMENT MAPPING
-- =========================================================
CREATE TABLE public.product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.professional_products(id) ON DELETE CASCADE,
  stain_id UUID REFERENCES public.stains(id) ON DELETE SET NULL,
  stain_category_id UUID REFERENCES public.stain_categories(id) ON DELETE SET NULL,
  treatment_principle_id UUID REFERENCES public.treatment_principles(id) ON DELETE SET NULL,
  treatment_stage TEXT,
  fabric_id UUID REFERENCES public.fabrics(id) ON DELETE SET NULL,
  material_family TEXT,
  colour_condition TEXT,
  garment_construction TEXT,
  risk_level public.risk_level NOT NULL DEFAULT 'amber',
  user_capability public.app_role,
  country TEXT,
  suitability public.suitability_decision NOT NULL DEFAULT 'insufficient_information',
  restriction TEXT,
  evidence_level public.evidence_level NOT NULL DEFAULT 'none',
  source_document_id UUID REFERENCES public.source_documents(id) ON DELETE SET NULL,
  reviewer UUID,
  approval_status public.content_status NOT NULL DEFAULT 'draft',
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_mapping_product ON public.product_mappings(product_id);
CREATE INDEX idx_mapping_stain ON public.product_mappings(stain_id);
GRANT SELECT ON public.product_mappings TO authenticated;
GRANT ALL ON public.product_mappings TO service_role;
ALTER TABLE public.product_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Professionals read approved mappings" ON public.product_mappings
  FOR SELECT TO authenticated USING (
    (approval_status IN ('approved','published') AND (
      public.has_role(auth.uid(),'professional_spotter') OR
      public.has_role(auth.uid(),'dry_cleaner') OR
      public.has_role(auth.uid(),'laundry_employee') OR
      public.has_role(auth.uid(),'trainer')
    ))
    OR public.is_content_maintainer(auth.uid())
  );
CREATE POLICY "Maintainers manage mappings" ON public.product_mappings
  FOR ALL TO authenticated USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_mappings_updated BEFORE UPDATE ON public.product_mappings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- LAYER F: DOMESTIC TREATMENTS
-- =========================================================
CREATE TABLE public.domestic_treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stain_id UUID NOT NULL REFERENCES public.stains(id) ON DELETE CASCADE,
  title TEXT,
  eligible_fabrics TEXT[] NOT NULL DEFAULT '{}',
  prohibited_fabrics TEXT[] NOT NULL DEFAULT '{}',
  eligible_colours TEXT[] NOT NULL DEFAULT '{}',
  required_materials TEXT[] NOT NULL DEFAULT '{}',
  hidden_area_test TEXT,
  method TEXT,
  maximum_attempts SMALLINT NOT NULL DEFAULT 1,
  actions_to_avoid TEXT[] NOT NULL DEFAULT '{}',
  stop_conditions TEXT[] NOT NULL DEFAULT '{}',
  escalation_point TEXT,
  confidence_score SMALLINT NOT NULL DEFAULT 0 CHECK (confidence_score BETWEEN 0 AND 10),
  source TEXT,
  country_applicability TEXT[] NOT NULL DEFAULT '{}',
  reviewer UUID,
  approval_status public.content_status NOT NULL DEFAULT 'draft',
  review_date DATE,
  next_review_date DATE,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.domestic_treatments TO anon, authenticated;
GRANT ALL ON public.domestic_treatments TO service_role;
ALTER TABLE public.domestic_treatments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read publishable domestic treatments" ON public.domestic_treatments
  FOR SELECT USING (approval_status IN ('approved','published') AND confidence_score >= 9);
CREATE POLICY "Maintainers manage domestic treatments" ON public.domestic_treatments
  FOR ALL TO authenticated USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_domestic_updated BEFORE UPDATE ON public.domestic_treatments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Publication guard: cannot publish below confidence 9
CREATE OR REPLACE FUNCTION public.enforce_domestic_confidence()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.approval_status IN ('approved','published') AND NEW.confidence_score < 9 THEN
    RAISE EXCEPTION 'Domestic treatment is not recommended: confidence score must be at least 9 to publish.';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_domestic_confidence BEFORE INSERT OR UPDATE ON public.domestic_treatments
FOR EACH ROW EXECUTE FUNCTION public.enforce_domestic_confidence();

-- =========================================================
-- LAYER H: CASES
-- =========================================================
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_type public.app_role NOT NULL DEFAULT 'domestic_user',
  garment_profile_id UUID REFERENCES public.garment_profiles(id) ON DELETE SET NULL,
  garment_information JSONB NOT NULL DEFAULT '{}'::jsonb,
  care_label_information TEXT,
  care_label_confidence SMALLINT CHECK (care_label_confidence BETWEEN 0 AND 10),
  fabric_confidence SMALLINT CHECK (fabric_confidence BETWEEN 0 AND 10),
  stain_source TEXT,
  suspected_stains UUID[] NOT NULL DEFAULT '{}',
  stain_identification_confidence SMALLINT CHECK (stain_identification_confidence BETWEEN 0 AND 10),
  treatment_selection_confidence SMALLINT CHECK (treatment_selection_confidence BETWEEN 0 AND 10),
  domestic_suitability_confidence SMALLINT CHECK (domestic_suitability_confidence BETWEEN 0 AND 10),
  product_document_confidence SMALLINT CHECK (product_document_confidence BETWEEN 0 AND 10),
  stain_age TEXT,
  previous_treatments TEXT,
  available_products TEXT[] NOT NULL DEFAULT '{}',
  available_equipment TEXT[] NOT NULL DEFAULT '{}',
  risk_level public.risk_level NOT NULL DEFAULT 'black',
  damage_risks TEXT[] NOT NULL DEFAULT '{}',
  recommended_route TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cases TO authenticated;
GRANT ALL ON public.cases TO service_role;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cases" ON public.cases
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_cases_updated BEFORE UPDATE ON public.cases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.treatment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  treatment_stage TEXT,
  product_or_method TEXT,
  product_id UUID REFERENCES public.professional_products(id) ON DELETE SET NULL,
  operator TEXT,
  attempt_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  pre_test_result TEXT,
  actions_taken TEXT,
  result TEXT,
  colour_change TEXT,
  fibre_damage TEXT,
  texture_change TEXT,
  ring_formation TEXT,
  shrinkage TEXT,
  odour TEXT,
  residue TEXT,
  result_after_drying TEXT,
  repeatability TEXT,
  stop_reason TEXT,
  reviewer UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treatment_attempts TO authenticated;
GRANT ALL ON public.treatment_attempts TO service_role;
ALTER TABLE public.treatment_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own attempts" ON public.treatment_attempts
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_id AND c.user_id = auth.uid()));
CREATE TRIGGER trg_attempts_updated BEFORE UPDATE ON public.treatment_attempts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- GOVERNANCE: AUDIT TRAIL
-- =========================================================
CREATE TABLE public.content_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  changed_by UUID,
  previous_data JSONB,
  new_data JSONB,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_record ON public.content_audit_log(table_name, record_id);
GRANT SELECT, INSERT ON public.content_audit_log TO authenticated;
GRANT ALL ON public.content_audit_log TO service_role;
ALTER TABLE public.content_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Maintainers read audit" ON public.content_audit_log
  FOR SELECT TO authenticated USING (public.is_content_maintainer(auth.uid()));
CREATE POLICY "Maintainers write audit" ON public.content_audit_log
  FOR INSERT TO authenticated WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE OR REPLACE FUNCTION public.log_content_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.content_audit_log(table_name, record_id, action, changed_by, previous_data, new_data)
  VALUES (TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), TG_OP, auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_audit_stains AFTER UPDATE OR DELETE ON public.stains
FOR EACH ROW EXECUTE FUNCTION public.log_content_change();
CREATE TRIGGER trg_audit_products AFTER UPDATE OR DELETE ON public.professional_products
FOR EACH ROW EXECUTE FUNCTION public.log_content_change();
CREATE TRIGGER trg_audit_domestic AFTER UPDATE OR DELETE ON public.domestic_treatments
FOR EACH ROW EXECUTE FUNCTION public.log_content_change();
CREATE TRIGGER trg_audit_mappings AFTER UPDATE OR DELETE ON public.product_mappings
FOR EACH ROW EXECUTE FUNCTION public.log_content_change();

-- =========================================================
-- SEED DATA
-- =========================================================
INSERT INTO public.stain_categories (category_key, name, sort_order, status) VALUES
 ('water_soluble','Water-Soluble',1,'published'),
 ('oil_grease','Oil and Grease-Based',2,'published'),
 ('protein','Protein-Based',3,'published'),
 ('tannin_plant','Tannin and Plant-Based',4,'published'),
 ('pigment_particulate','Pigment and Particulate',5,'published'),
 ('dye_ink','Dye and Ink-Based',6,'published'),
 ('paint_resin_polymer','Paint, Resin, Adhesive and Polymer',7,'published'),
 ('oxidizable','Oxidizable',8,'published'),
 ('reducible','Reducible',9,'published'),
 ('metal_rust_mineral','Metal, Rust and Mineral',10,'published'),
 ('biological','Biological',11,'published'),
 ('combination_unknown','Combination or Unknown',12,'published');

INSERT INTO public.tags (tag_key, label, tag_group) VALUES
 ('fresh','Fresh','condition'),
 ('dried','Dried','condition'),
 ('aged','Aged','condition'),
 ('heat_set','Heat-set','condition'),
 ('domestic_safe','Domestic safe','capability'),
 ('professional_only','Professional only','capability'),
 ('dry_clean_only','Dry clean only','care'),
 ('delicate_fabric','Delicate fabric','risk'),
 ('unknown_stain','Unknown stain','identification'),
 ('dye_transfer','Dye transfer','identification'),
 ('cosmetic','Cosmetic','identification'),
 ('biological_hazard','Biological hazard','risk'),
 ('urgent_first_response','Urgent first response','workflow'),
 ('professional_referral','Professional referral','workflow'),
 ('white_garment','White garment','colour'),
 ('coloured_garment','Coloured garment','colour'),
 ('multicoloured_garment','Multicoloured garment','colour'),
 ('pigment_residue_possible','Pigment residue possible','risk'),
 ('permanent_damage_possible','Permanent damage possible','risk');

INSERT INTO public.fabrics (fabric_key, name, material_family, status) VALUES
 ('cotton','Cotton','cellulosic','published'),
 ('linen','Linen','cellulosic','published'),
 ('wool','Wool','protein','published'),
 ('silk','Silk','protein','published'),
 ('viscose_rayon','Viscose / Rayon','regenerated_cellulosic','published'),
 ('polyester','Polyester','synthetic','published'),
 ('nylon_polyamide','Nylon / Polyamide','synthetic','published'),
 ('acrylic','Acrylic','synthetic','published'),
 ('acetate','Acetate','regenerated_cellulosic','published'),
 ('triacetate','Triacetate','regenerated_cellulosic','published'),
 ('elastane','Elastane','synthetic','published'),
 ('blends','Blends','blend','published'),
 ('leather','Leather','skin','published'),
 ('suede','Suede','skin','published'),
 ('fur','Fur','skin','published'),
 ('coated_fabric','Coated Fabrics','coated','published'),
 ('waterproof_fabric','Waterproof Fabrics','coated','published'),
 ('unknown_material','Unknown Material','unknown','published');

INSERT INTO public.companies (company_name, manufacturer_or_distributor, verification_status, notes) VALUES
 ('Seitz','unverified','unverified','Provisional record. No commercial or manufacturing relationship with other listed companies is assumed. All product data unverified until label/SDS/TDS reviewed.'),
 ('STAS','unverified','unverified','Provisional record. All product data unverified until label/SDS/TDS reviewed.'),
 ('Clean Craft','unverified','unverified','Provisional record. All product data unverified until label/SDS/TDS reviewed.');