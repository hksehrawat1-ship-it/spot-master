CREATE TABLE public.treatment_outcomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  outcome_id TEXT NOT NULL UNIQUE,
  version INTEGER NOT NULL DEFAULT 1,
  record_type TEXT NOT NULL,
  client_record_key TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  baseline JSONB NOT NULL DEFAULT '{}'::jsonb,
  attempts JSONB NOT NULL DEFAULT '[]'::jsonb,
  approved_method JSONB,
  immediate_inspection JSONB NOT NULL DEFAULT '{}'::jsonb,
  post_rinse JSONB,
  post_drying JSONB,
  follow_up JSONB,
  remaining_mark TEXT,
  failure_hypotheses TEXT[] NOT NULL DEFAULT '{}',
  classification TEXT,
  severity INTEGER,
  evidence_stage TEXT NOT NULL DEFAULT 'raw_report',
  closure_state TEXT,
  closure_exception_reason TEXT,
  corrects_outcome_id TEXT,
  superseded BOOLEAN NOT NULL DEFAULT false,
  reported_by UUID,
  organization_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (client_record_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.treatment_outcomes TO authenticated;
GRANT ALL ON public.treatment_outcomes TO service_role;
ALTER TABLE public.treatment_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own outcomes" ON public.treatment_outcomes
  FOR SELECT TO authenticated
  USING (reported_by = auth.uid() OR public.is_content_maintainer(auth.uid()));
CREATE POLICY "Users create own outcomes" ON public.treatment_outcomes
  FOR INSERT TO authenticated
  WITH CHECK (reported_by = auth.uid());
CREATE POLICY "Maintainers update outcomes" ON public.treatment_outcomes
  FOR UPDATE TO authenticated
  USING (public.is_content_maintainer(auth.uid()) OR reported_by = auth.uid())
  WITH CHECK (public.is_content_maintainer(auth.uid()) OR reported_by = auth.uid());
CREATE POLICY "Maintainers delete outcomes" ON public.treatment_outcomes
  FOR DELETE TO authenticated
  USING (public.is_content_maintainer(auth.uid()));

CREATE TRIGGER trg_treatment_outcomes_updated
  BEFORE UPDATE ON public.treatment_outcomes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.outcome_adverse_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  adverse_id TEXT NOT NULL UNIQUE,
  outcome_id TEXT NOT NULL,
  severity INTEGER NOT NULL,
  case_version INTEGER NOT NULL DEFAULT 1,
  product_key TEXT,
  product_batch TEXT,
  operator TEXT,
  garment_description TEXT NOT NULL,
  stain_key TEXT,
  approved_method_key TEXT,
  actual_method_summary TEXT NOT NULL,
  deviation TEXT,
  immediate_symptoms TEXT[] NOT NULL DEFAULT '{}',
  damage_types TEXT[] NOT NULL DEFAULT '{}',
  photos TEXT[] NOT NULL DEFAULT '{}',
  required_first_response TEXT,
  escalation_route TEXT,
  reviewer UUID,
  investigation_status TEXT NOT NULL DEFAULT 'open',
  root_cause_conclusion TEXT,
  corrective_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  closure_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.outcome_adverse_records TO authenticated;
GRANT ALL ON public.outcome_adverse_records TO service_role;
ALTER TABLE public.outcome_adverse_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read adverse outcomes" ON public.outcome_adverse_records
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated report adverse outcomes" ON public.outcome_adverse_records
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Maintainers update adverse outcomes" ON public.outcome_adverse_records
  FOR UPDATE TO authenticated
  USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE TRIGGER trg_outcome_adverse_updated
  BEFORE UPDATE ON public.outcome_adverse_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.outcome_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id TEXT NOT NULL UNIQUE,
  outcome_id TEXT NOT NULL,
  trigger TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  conclusion TEXT,
  corrective_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  reviewer UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.outcome_reviews TO authenticated;
GRANT ALL ON public.outcome_reviews TO service_role;
ALTER TABLE public.outcome_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read outcome reviews" ON public.outcome_reviews
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Maintainers manage outcome reviews" ON public.outcome_reviews
  FOR ALL TO authenticated
  USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE TRIGGER trg_outcome_reviews_updated
  BEFORE UPDATE ON public.outcome_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.outcome_evidence_promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  outcome_id TEXT NOT NULL,
  from_stage TEXT NOT NULL,
  to_stage TEXT NOT NULL,
  decision TEXT NOT NULL,
  reason TEXT NOT NULL,
  reviewer UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.outcome_evidence_promotions TO authenticated;
GRANT ALL ON public.outcome_evidence_promotions TO service_role;
ALTER TABLE public.outcome_evidence_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read promotions" ON public.outcome_evidence_promotions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Maintainers create promotions" ON public.outcome_evidence_promotions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE TABLE public.outcome_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  outcome_id TEXT NOT NULL,
  action TEXT NOT NULL,
  field TEXT,
  previous_value TEXT,
  new_value TEXT,
  reason TEXT NOT NULL,
  changed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.outcome_audit_log TO authenticated;
GRANT ALL ON public.outcome_audit_log TO service_role;
ALTER TABLE public.outcome_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Maintainers read outcome audit" ON public.outcome_audit_log
  FOR SELECT TO authenticated
  USING (public.is_content_maintainer(auth.uid()));
CREATE POLICY "Authenticated write outcome audit" ON public.outcome_audit_log
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_treatment_outcomes_stain ON public.treatment_outcomes ((context->>'stainKey'));
CREATE INDEX idx_outcome_reviews_status ON public.outcome_reviews (status);
CREATE INDEX idx_outcome_audit_outcome ON public.outcome_audit_log (outcome_id);