-- STEP 8 — treatment stages, pathways and product mappings (additive, reversible)

CREATE TABLE IF NOT EXISTS public.treatment_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_code text NOT NULL UNIQUE,
  stage_number integer NOT NULL UNIQUE,
  stage_key text NOT NULL UNIQUE,
  name text NOT NULL,
  plain_name text NOT NULL,
  technical_description text NOT NULL,
  purpose text,
  applicable_categories text[] NOT NULL DEFAULT '{}',
  applicable_components text[] NOT NULL DEFAULT '{}',
  required_inputs text[] NOT NULL DEFAULT '{}',
  required_preconditions text[] NOT NULL DEFAULT '{}',
  prohibited_conditions text[] NOT NULL DEFAULT '{}',
  required_roles text[] NOT NULL DEFAULT '{}',
  required_training text[] NOT NULL DEFAULT '{}',
  required_equipment text[] NOT NULL DEFAULT '{}',
  required_ppe text[] NOT NULL DEFAULT '{}',
  required_inspection boolean NOT NULL DEFAULT true,
  exit_conditions text[] NOT NULL DEFAULT '{}',
  stop_conditions text[] NOT NULL DEFAULT '{}',
  next_allowed_stages integer[] NOT NULL DEFAULT '{}',
  evidence_requirement text NOT NULL DEFAULT 'no_chemistry_required',
  actionable boolean NOT NULL DEFAULT false,
  status content_status NOT NULL DEFAULT 'published',
  version text NOT NULL DEFAULT 'step8-stages-v1',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treatment_stages TO authenticated;
GRANT ALL ON public.treatment_stages TO service_role;
ALTER TABLE public.treatment_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "treatment_stages_read" ON public.treatment_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "treatment_stages_manage" ON public.treatment_stages FOR ALL TO authenticated
  USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_treatment_stages_updated BEFORE UPDATE ON public.treatment_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.treatment_pathways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pathway_code text NOT NULL UNIQUE,
  pathway_key text NOT NULL UNIQUE,
  name text NOT NULL,
  plain_name text NOT NULL,
  description text,
  categories text[] NOT NULL DEFAULT '{}',
  completion_requirements text[] NOT NULL DEFAULT '{}',
  professional_only boolean NOT NULL DEFAULT true,
  status content_status NOT NULL DEFAULT 'published',
  version text NOT NULL DEFAULT 'step8-stages-v1',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treatment_pathways TO authenticated;
GRANT ALL ON public.treatment_pathways TO service_role;
ALTER TABLE public.treatment_pathways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "treatment_pathways_read" ON public.treatment_pathways FOR SELECT TO authenticated USING (true);
CREATE POLICY "treatment_pathways_manage" ON public.treatment_pathways FOR ALL TO authenticated
  USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_treatment_pathways_updated BEFORE UPDATE ON public.treatment_pathways
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.pathway_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pathway_id uuid NOT NULL REFERENCES public.treatment_pathways(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES public.treatment_stages(id) ON DELETE RESTRICT,
  position integer NOT NULL,
  optional boolean NOT NULL DEFAULT false,
  condition_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pathway_id, position)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pathway_stages TO authenticated;
GRANT ALL ON public.pathway_stages TO service_role;
ALTER TABLE public.pathway_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pathway_stages_read" ON public.pathway_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "pathway_stages_manage" ON public.pathway_stages FOR ALL TO authenticated
  USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE TABLE IF NOT EXISTS public.product_stage_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_code text NOT NULL UNIQUE,
  product_id uuid REFERENCES public.professional_products(id) ON DELETE CASCADE,
  product_version_id uuid REFERENCES public.product_versions(id) ON DELETE RESTRICT,
  product_key text NOT NULL,
  product_version_key text NOT NULL,
  company_key text NOT NULL,
  kit_key text,
  stage_id uuid REFERENCES public.treatment_stages(id) ON DELETE RESTRICT,
  stage_number integer NOT NULL,
  specificity text NOT NULL DEFAULT 'category',
  stain_key text,
  category_key text,
  component_key text,
  source_type text,
  country text NOT NULL,
  ventilation_requirement text NOT NULL DEFAULT 'insufficient_information',
  required_prior_stage integer,
  required_following_stage integer,
  prohibited_prior_chemistry text[] NOT NULL DEFAULT '{}',
  repetition_rule text NOT NULL DEFAULT 'insufficient_information',
  stop_conditions text[] NOT NULL DEFAULT '{}',
  manufacturer_claim text,
  verified_use boolean NOT NULL DEFAULT false,
  decision suitability_decision NOT NULL DEFAULT 'insufficient_information',
  not_recommended_reason text,
  evidence_level text NOT NULL DEFAULT 'insufficient_information',
  source_document_keys text[] NOT NULL DEFAULT '{}',
  reviewer text,
  approval_status text NOT NULL DEFAULT 'draft',
  effective_date date,
  review_date date,
  version integer NOT NULL DEFAULT 1,
  supersedes_mapping_code text,
  provisional boolean NOT NULL DEFAULT true,
  notes text,
  flags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_stage_mappings TO authenticated;
GRANT ALL ON public.product_stage_mappings TO service_role;
ALTER TABLE public.product_stage_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_stage_mappings_read" ON public.product_stage_mappings FOR SELECT TO authenticated USING (true);
CREATE POLICY "product_stage_mappings_manage" ON public.product_stage_mappings FOR ALL TO authenticated
  USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_product_stage_mappings_updated BEFORE UPDATE ON public.product_stage_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_psm_stage ON public.product_stage_mappings(stage_number);
CREATE INDEX IF NOT EXISTS idx_psm_product ON public.product_stage_mappings(product_key);

CREATE TABLE IF NOT EXISTS public.mapping_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id uuid NOT NULL REFERENCES public.product_stage_mappings(id) ON DELETE CASCADE,
  condition_kind text NOT NULL, -- fabric | colour | construction | process
  target_key text NOT NULL,
  verdict text NOT NULL DEFAULT 'insufficient_information',
  note text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mapping_conditions TO authenticated;
GRANT ALL ON public.mapping_conditions TO service_role;
ALTER TABLE public.mapping_conditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mapping_conditions_read" ON public.mapping_conditions FOR SELECT TO authenticated USING (true);
CREATE POLICY "mapping_conditions_manage" ON public.mapping_conditions FOR ALL TO authenticated
  USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE TABLE IF NOT EXISTS public.mapping_role_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id uuid NOT NULL REFERENCES public.product_stage_mappings(id) ON DELETE CASCADE,
  roles text[] NOT NULL DEFAULT '{}',
  training_requirements text[] NOT NULL DEFAULT '{}',
  supervision_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mapping_role_conditions TO authenticated;
GRANT ALL ON public.mapping_role_conditions TO service_role;
ALTER TABLE public.mapping_role_conditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mapping_role_conditions_read" ON public.mapping_role_conditions FOR SELECT TO authenticated USING (true);
CREATE POLICY "mapping_role_conditions_manage" ON public.mapping_role_conditions FOR ALL TO authenticated
  USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE TABLE IF NOT EXISTS public.mapping_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id uuid NOT NULL REFERENCES public.product_stage_mappings(id) ON DELETE CASCADE,
  requirement_kind text NOT NULL, -- equipment | ppe | test
  requirement_key text NOT NULL,
  requirement_level text NOT NULL DEFAULT 'required',
  method_source text,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mapping_requirements TO authenticated;
GRANT ALL ON public.mapping_requirements TO service_role;
ALTER TABLE public.mapping_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mapping_requirements_read" ON public.mapping_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "mapping_requirements_manage" ON public.mapping_requirements FOR ALL TO authenticated
  USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE TABLE IF NOT EXISTS public.mapping_rinse_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id uuid NOT NULL REFERENCES public.product_stage_mappings(id) ON DELETE CASCADE,
  product_version_key text,
  requirement text NOT NULL DEFAULT 'insufficient_information',
  method text,
  medium text,
  quantity text,
  temperature text,
  duration text,
  equipment text,
  process_destination text,
  inspection_required boolean NOT NULL DEFAULT true,
  source_document_key text,
  document_version text,
  country text,
  reviewer text,
  fallback_text text NOT NULL DEFAULT 'Follow the current product label or technical data sheet.',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mapping_rinse_requirements TO authenticated;
GRANT ALL ON public.mapping_rinse_requirements TO service_role;
ALTER TABLE public.mapping_rinse_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mapping_rinse_read" ON public.mapping_rinse_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "mapping_rinse_manage" ON public.mapping_rinse_requirements FOR ALL TO authenticated
  USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_mapping_rinse_updated BEFORE UPDATE ON public.mapping_rinse_requirements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.mapping_quantities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id uuid NOT NULL REFERENCES public.product_stage_mappings(id) ON DELETE CASCADE,
  quantity text,
  unit text,
  dilution text,
  contact_time text,
  temperature text,
  reapplication_limit text,
  maximum_attempts text,
  source text,
  document_version text,
  country text,
  applicable_process text,
  applicable_material text,
  reviewer text,
  approval_status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mapping_quantities TO authenticated;
GRANT ALL ON public.mapping_quantities TO service_role;
ALTER TABLE public.mapping_quantities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mapping_quantities_read" ON public.mapping_quantities FOR SELECT TO authenticated USING (true);
CREATE POLICY "mapping_quantities_manage" ON public.mapping_quantities FOR ALL TO authenticated
  USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_mapping_quantities_updated BEFORE UPDATE ON public.mapping_quantities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.product_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transition_code text NOT NULL UNIQUE,
  from_product_key text,
  from_chemistry_family text,
  from_product_version_key text,
  to_product_key text,
  to_chemistry_family text,
  to_product_version_key text,
  permission text NOT NULL DEFAULT 'insufficient_information',
  required_rinse text,
  required_neutralization text,
  inspection_required boolean NOT NULL DEFAULT true,
  waiting_requirement text,
  source text NOT NULL,
  country text NOT NULL DEFAULT 'all',
  reviewer text,
  approval_status text NOT NULL DEFAULT 'draft',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_transitions TO authenticated;
GRANT ALL ON public.product_transitions TO service_role;
ALTER TABLE public.product_transitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_transitions_read" ON public.product_transitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "product_transitions_manage" ON public.product_transitions FOR ALL TO authenticated
  USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_product_transitions_updated BEFORE UPDATE ON public.product_transitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.prior_chemical_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
  mapping_id uuid REFERENCES public.product_stage_mappings(id) ON DELETE SET NULL,
  previous_chemistry text[] NOT NULL DEFAULT '{}',
  applied_product_keys text[] NOT NULL DEFAULT '{}',
  outcome text NOT NULL,
  blocked boolean NOT NULL DEFAULT false,
  requires_flushing boolean NOT NULL DEFAULT false,
  reasons text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prior_chemical_checks TO authenticated;
GRANT ALL ON public.prior_chemical_checks TO service_role;
ALTER TABLE public.prior_chemical_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prior_chemical_checks_read" ON public.prior_chemical_checks FOR SELECT TO authenticated USING (true);
CREATE POLICY "prior_chemical_checks_manage" ON public.prior_chemical_checks FOR ALL TO authenticated
  USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE TABLE IF NOT EXISTS public.mapping_inspection_gates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
  mapping_id uuid REFERENCES public.product_stage_mappings(id) ON DELETE SET NULL,
  stage_number integer NOT NULL,
  findings text[] NOT NULL DEFAULT '{}',
  photograph_path text,
  operator text,
  stopped boolean NOT NULL DEFAULT false,
  repeat_allowed boolean NOT NULL DEFAULT false,
  heat_allowed boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mapping_inspection_gates TO authenticated;
GRANT ALL ON public.mapping_inspection_gates TO service_role;
ALTER TABLE public.mapping_inspection_gates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mapping_inspection_gates_read" ON public.mapping_inspection_gates FOR SELECT TO authenticated USING (true);
CREATE POLICY "mapping_inspection_gates_manage" ON public.mapping_inspection_gates FOR ALL TO authenticated
  USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE TABLE IF NOT EXISTS public.mapping_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id uuid NOT NULL REFERENCES public.product_stage_mappings(id) ON DELETE CASCADE,
  evidence_level text NOT NULL,
  document_id uuid REFERENCES public.source_documents(id) ON DELETE SET NULL,
  document_key text,
  document_version text,
  description text NOT NULL,
  reviewer text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mapping_evidence TO authenticated;
GRANT ALL ON public.mapping_evidence TO service_role;
ALTER TABLE public.mapping_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mapping_evidence_read" ON public.mapping_evidence FOR SELECT TO authenticated USING (true);
CREATE POLICY "mapping_evidence_manage" ON public.mapping_evidence FOR ALL TO authenticated
  USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE TABLE IF NOT EXISTS public.mapping_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id uuid REFERENCES public.product_stage_mappings(id) ON DELETE SET NULL,
  mapping_code text NOT NULL,
  version integer NOT NULL,
  snapshot jsonb NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.mapping_versions TO authenticated;
GRANT ALL ON public.mapping_versions TO service_role;
ALTER TABLE public.mapping_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mapping_versions_read" ON public.mapping_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "mapping_versions_insert" ON public.mapping_versions FOR INSERT TO authenticated
  WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE TABLE IF NOT EXISTS public.mapping_approval_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id uuid REFERENCES public.product_stage_mappings(id) ON DELETE CASCADE,
  mapping_code text NOT NULL,
  from_status text,
  to_status text NOT NULL,
  justification text NOT NULL,
  changed_by uuid,
  safety_critical boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.mapping_approval_history TO authenticated;
GRANT ALL ON public.mapping_approval_history TO service_role;
ALTER TABLE public.mapping_approval_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mapping_approval_history_read" ON public.mapping_approval_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "mapping_approval_history_insert" ON public.mapping_approval_history FOR INSERT TO authenticated
  WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE TABLE IF NOT EXISTS public.mapping_eligibility_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
  mapping_id uuid REFERENCES public.product_stage_mappings(id) ON DELETE SET NULL,
  mapping_code text NOT NULL,
  mapping_version integer NOT NULL DEFAULT 1,
  product_key text NOT NULL,
  product_version_key text NOT NULL,
  stage_number integer NOT NULL,
  outcome text NOT NULL,
  decision suitability_decision NOT NULL DEFAULT 'insufficient_information',
  reason text NOT NULL,
  blocking_checks text[] NOT NULL DEFAULT '{}',
  passed_checks text[] NOT NULL DEFAULT '{}',
  engine_version text NOT NULL DEFAULT 'step8-v1',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.mapping_eligibility_results TO authenticated;
GRANT ALL ON public.mapping_eligibility_results TO service_role;
ALTER TABLE public.mapping_eligibility_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mapping_eligibility_read" ON public.mapping_eligibility_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "mapping_eligibility_insert" ON public.mapping_eligibility_results FOR INSERT TO authenticated
  WITH CHECK (true);