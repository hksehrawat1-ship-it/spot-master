CREATE TABLE public.master_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_reference text NOT NULL,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  working_level text NOT NULL DEFAULT 'master',
  garment jsonb NOT NULL DEFAULT '{}'::jsonb,
  fibre jsonb NOT NULL DEFAULT '{}'::jsonb,
  construction jsonb NOT NULL DEFAULT '{}'::jsonb,
  dye_colour jsonb NOT NULL DEFAULT '{}'::jsonb,
  trims_finishes jsonb NOT NULL DEFAULT '{}'::jsonb,
  stain_diagnosis jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  selected_kits jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_products jsonb NOT NULL DEFAULT '[]'::jsonb,
  test_results jsonb NOT NULL DEFAULT '{}'::jsonb,
  photographs jsonb NOT NULL DEFAULT '{}'::jsonb,
  safety_decisions jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_versions jsonb NOT NULL DEFAULT '[]'::jsonb,
  outcome text,
  adverse_event text,
  escalation_reason text,
  final_disposition text,
  customer_notes text,
  operator_notes text,
  supervisor_notes text,
  record_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.master_cases TO authenticated;
GRANT ALL ON public.master_cases TO service_role;

ALTER TABLE public.master_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their master cases"
ON public.master_cases FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Organisation members read organisation master cases"
ON public.master_cases FOR SELECT TO authenticated
USING (
  organization_id IS NOT NULL
  AND organization_id IN (
    SELECT p.organization_id FROM public.profiles p WHERE p.id = auth.uid()
  )
);

CREATE POLICY "Reviewers and administrators read all master cases"
ON public.master_cases FOR SELECT TO authenticated
USING (public.is_platform_admin(auth.uid()) OR public.is_content_maintainer(auth.uid()));

CREATE TRIGGER trg_master_cases_updated
BEFORE UPDATE ON public.master_cases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.master_treatment_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.master_cases(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  entry_order integer NOT NULL DEFAULT 1,
  stage_key text,
  stage_number integer,
  component_key text,
  product_id uuid REFERENCES public.professional_products(id) ON DELETE SET NULL,
  product_name text,
  manufacturer text,
  amount text,
  dilution text,
  temperature text,
  contact_time text,
  mechanical_action text,
  steam_used boolean NOT NULL DEFAULT false,
  vacuum_used boolean NOT NULL DEFAULT false,
  spotting_board_used boolean NOT NULL DEFAULT false,
  rinse_performed boolean NOT NULL DEFAULT false,
  neutralization_performed boolean NOT NULL DEFAULT false,
  drying_or_heat text,
  visible_response text,
  colour_movement text,
  texture_change text,
  inspection_result text,
  operator_observation boolean NOT NULL DEFAULT false,
  notes text,
  performed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.master_treatment_ledger TO authenticated;
GRANT ALL ON public.master_treatment_ledger TO service_role;

ALTER TABLE public.master_treatment_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their ledger entries"
ON public.master_treatment_ledger FOR ALL TO authenticated
USING (
  owner_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.master_cases c WHERE c.id = case_id AND c.owner_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.master_cases c WHERE c.id = case_id AND c.owner_id = auth.uid())
);

CREATE POLICY "Organisation members read organisation ledger entries"
ON public.master_treatment_ledger FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.master_cases c
    WHERE c.id = case_id
      AND c.organization_id IS NOT NULL
      AND c.organization_id IN (SELECT p.organization_id FROM public.profiles p WHERE p.id = auth.uid())
  )
);

CREATE POLICY "Reviewers and administrators read all ledger entries"
ON public.master_treatment_ledger FOR SELECT TO authenticated
USING (public.is_platform_admin(auth.uid()) OR public.is_content_maintainer(auth.uid()));

CREATE TRIGGER trg_master_ledger_updated
BEFORE UPDATE ON public.master_treatment_ledger
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_master_ledger_case ON public.master_treatment_ledger(case_id, entry_order);

CREATE TABLE public.master_case_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.master_cases(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  event_kind text NOT NULL,
  status text,
  summary text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.master_case_events TO authenticated;
GRANT ALL ON public.master_case_events TO service_role;

ALTER TABLE public.master_case_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners record and read their case events"
ON public.master_case_events FOR SELECT TO authenticated
USING (
  owner_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.master_cases c WHERE c.id = case_id AND c.owner_id = auth.uid())
);

CREATE POLICY "Owners insert their case events"
ON public.master_case_events FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.master_cases c WHERE c.id = case_id AND c.owner_id = auth.uid())
);

CREATE POLICY "Reviewers and administrators read all case events"
ON public.master_case_events FOR SELECT TO authenticated
USING (public.is_platform_admin(auth.uid()) OR public.is_content_maintainer(auth.uid()));

CREATE INDEX idx_master_case_events_case ON public.master_case_events(case_id, created_at DESC);