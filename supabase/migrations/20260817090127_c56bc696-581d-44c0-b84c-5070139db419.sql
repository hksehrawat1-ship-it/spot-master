CREATE TYPE public.readiness_status AS ENUM (
  'ready_for_classification','more_information_required','compatibility_test_required',
  'professional_only','specialist_referral_required','blocked_previous_chemical',
  'blocked_existing_damage','blocked_possible_hazard'
);

CREATE TABLE public.case_condition_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.organizations(id),
  case_id uuid REFERENCES public.cases(id),
  fabric_assessment_id uuid REFERENCES public.fabric_assessments(id),
  identification_id uuid REFERENCES public.stain_identifications(id),
  local_case_ref text,
  summary_confirmed text,
  stain_age text,
  stain_age_is_approximate boolean NOT NULL DEFAULT true,
  current_condition text[] NOT NULL DEFAULT '{}',
  heat_exposure text[] NOT NULL DEFAULT '{}',
  heat_result text[] NOT NULL DEFAULT '{}',
  heat_set_suspected boolean NOT NULL DEFAULT false,
  chemical_mixing text,
  chemical_mixing_products text,
  chemical_mixing_reaction text[] NOT NULL DEFAULT '{}',
  previous_treatment_result text[] NOT NULL DEFAULT '{}',
  stain_size text,
  penetration text[] NOT NULL DEFAULT '{}',
  buildup text,
  affected_components text[] NOT NULL DEFAULT '{}',
  most_sensitive_component text,
  colour_group text,
  stain_crosses_colours text,
  has_print text,
  dye_transferring text,
  colour_changed_after_treatment text,
  colourfastness_status text NOT NULL DEFAULT 'Untested',
  capability_context text,
  training_completed text,
  supervision_available text,
  experience_level text,
  can_run_tests boolean NOT NULL DEFAULT false,
  can_document_results boolean NOT NULL DEFAULT false,
  available_equipment text[] NOT NULL DEFAULT '{}',
  product_kits text[] NOT NULL DEFAULT '{}',
  country text,
  language text,
  product_market_country text,
  organization_location text,
  test_feasible text,
  completed_test jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes jsonb NOT NULL DEFAULT '{}'::jsonb,
  risk_before risk_level NOT NULL DEFAULT 'amber',
  risk_after risk_level NOT NULL DEFAULT 'amber',
  risk_explanation text,
  treatment_changing_factors text[] NOT NULL DEFAULT '{}',
  blockers text[] NOT NULL DEFAULT '{}',
  missing_answers text[] NOT NULL DEFAULT '{}',
  readiness readiness_status NOT NULL DEFAULT 'more_information_required',
  readiness_reason text,
  next_action text,
  assessment_version text NOT NULL DEFAULT 'readiness-v1',
  version integer NOT NULL DEFAULT 1,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_condition_assessments TO authenticated;
GRANT ALL ON public.case_condition_assessments TO service_role;
ALTER TABLE public.case_condition_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their condition assessments"
ON public.case_condition_assessments FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Maintainers read condition assessments"
ON public.case_condition_assessments FOR SELECT TO authenticated
USING (public.is_content_maintainer(auth.uid()));

CREATE TRIGGER trg_condition_assessments_updated
BEFORE UPDATE ON public.case_condition_assessments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.previous_cleaning_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.case_condition_assessments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  process text NOT NULL,
  solvent_known boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 1 CHECK (attempts >= 0),
  outcomes text[] NOT NULL DEFAULT '{}',
  heat_applied_after boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.previous_cleaning_events TO authenticated;
GRANT ALL ON public.previous_cleaning_events TO service_role;
ALTER TABLE public.previous_cleaning_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their cleaning events"
ON public.previous_cleaning_events FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Maintainers read cleaning events"
ON public.previous_cleaning_events FOR SELECT TO authenticated
USING (public.is_content_maintainer(auth.uid()));

CREATE TRIGGER trg_cleaning_events_updated
BEFORE UPDATE ON public.previous_cleaning_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.applied_product_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.case_condition_assessments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  product_type text NOT NULL,
  product_name text,
  company text,
  linked_product_id uuid REFERENCES public.professional_products(id),
  product_photo_path text,
  label_photo_path text,
  reported_amount text,
  diluted text,
  reported_dilution text,
  contact_time_minutes integer CHECK (contact_time_minutes IS NULL OR contact_time_minutes >= 0),
  rinsed text,
  neutralized text,
  heat_after text,
  observed_result text,
  reported_unverified boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.applied_product_history TO authenticated;
GRANT ALL ON public.applied_product_history TO service_role;
ALTER TABLE public.applied_product_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their applied product history"
ON public.applied_product_history FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Maintainers read applied product history"
ON public.applied_product_history FOR SELECT TO authenticated
USING (public.is_content_maintainer(auth.uid()));

CREATE TRIGGER trg_applied_products_updated
BEFORE UPDATE ON public.applied_product_history
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.organization_product_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id),
  product_id uuid REFERENCES public.professional_products(id),
  kit_id uuid REFERENCES public.product_kits(id),
  product_name text NOT NULL,
  company text,
  kit_name text,
  bottle_size text,
  country text,
  label_available boolean NOT NULL DEFAULT false,
  sds_available boolean NOT NULL DEFAULT false,
  tds_available boolean NOT NULL DEFAULT false,
  expiry_or_review text,
  organization_approved boolean NOT NULL DEFAULT false,
  verification_status verification_status NOT NULL DEFAULT 'unverified',
  eligible_for_guidance boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.organization_product_inventory TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.organization_product_inventory TO authenticated;
GRANT ALL ON public.organization_product_inventory TO service_role;
ALTER TABLE public.organization_product_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users read inventory"
ON public.organization_product_inventory FOR SELECT TO authenticated USING (true);

CREATE POLICY "Maintainers manage inventory"
ON public.organization_product_inventory FOR ALL TO authenticated
USING (public.is_content_maintainer(auth.uid()))
WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE TRIGGER trg_org_inventory_updated
BEFORE UPDATE ON public.organization_product_inventory
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.readiness_risk_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.case_condition_assessments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  risk_from risk_level NOT NULL,
  risk_to risk_level NOT NULL,
  rule text NOT NULL,
  assessment_version text NOT NULL DEFAULT 'readiness-v1',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.readiness_risk_events TO authenticated;
GRANT ALL ON public.readiness_risk_events TO service_role;
ALTER TABLE public.readiness_risk_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read and add their risk events"
ON public.readiness_risk_events FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Owners insert their risk events"
ON public.readiness_risk_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Maintainers read risk events"
ON public.readiness_risk_events FOR SELECT TO authenticated
USING (public.is_content_maintainer(auth.uid()));

CREATE TABLE public.readiness_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.case_condition_assessments(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  previous_status readiness_status NOT NULL,
  new_status readiness_status NOT NULL,
  justification text NOT NULL CHECK (length(btrim(justification)) >= 10),
  previous_snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.readiness_overrides TO authenticated;
GRANT ALL ON public.readiness_overrides TO service_role;
ALTER TABLE public.readiness_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Maintainers read overrides"
ON public.readiness_overrides FOR SELECT TO authenticated
USING (public.is_content_maintainer(auth.uid()));

CREATE POLICY "Maintainers record overrides"
ON public.readiness_overrides FOR INSERT TO authenticated
WITH CHECK (public.is_content_maintainer(auth.uid()) AND reviewer_id = auth.uid());

CREATE INDEX idx_condition_assessments_user ON public.case_condition_assessments(user_id);
CREATE INDEX idx_condition_assessments_identification ON public.case_condition_assessments(identification_id);
CREATE INDEX idx_cleaning_events_assessment ON public.previous_cleaning_events(assessment_id);
CREATE INDEX idx_applied_products_assessment ON public.applied_product_history(assessment_id);
CREATE INDEX idx_risk_events_assessment ON public.readiness_risk_events(assessment_id);