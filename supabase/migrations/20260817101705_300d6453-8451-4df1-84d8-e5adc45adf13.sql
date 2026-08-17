CREATE TABLE public.safety_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code text NOT NULL UNIQUE,
  name text NOT NULL,
  plain_title text NOT NULL,
  technical_description text NOT NULL DEFAULT '',
  category text NOT NULL,
  band text NOT NULL,
  severity text NOT NULL,
  effects text[] NOT NULL DEFAULT '{}',
  risk_effect text,
  gate_effect text,
  product_eligibility_effect text,
  trigger_description text NOT NULL DEFAULT '',
  required_data text[] NOT NULL DEFAULT '{}',
  excluded_conditions text[] NOT NULL DEFAULT '{}',
  warning text NOT NULL,
  required_action text,
  stop_condition text,
  evidence_source text NOT NULL DEFAULT '',
  countries text[] NOT NULL DEFAULT ARRAY['all'],
  roles text[] NOT NULL DEFAULT ARRAY['all'],
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  review_date date,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft',
  content_owner text NOT NULL DEFAULT 'technical_content',
  technical_reviewer text,
  overridable boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.safety_rules TO authenticated;
GRANT ALL ON public.safety_rules TO service_role;
ALTER TABLE public.safety_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can read safety rules" ON public.safety_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Maintainers manage safety rules" ON public.safety_rules FOR ALL TO authenticated USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER update_safety_rules_updated_at BEFORE UPDATE ON public.safety_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.safety_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  case_key text NOT NULL,
  case_version integer NOT NULL DEFAULT 1,
  case_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  engine_version text NOT NULL,
  ruleset_version text NOT NULL,
  rule_versions jsonb NOT NULL DEFAULT '{}'::jsonb,
  outcome text NOT NULL,
  risk_level text NOT NULL,
  gate_status text NOT NULL,
  product_eligibility text NOT NULL,
  blocked boolean NOT NULL DEFAULT false,
  domestic_allowed boolean NOT NULL DEFAULT false,
  fired_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  suppressed_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  determining_rule_code text,
  warnings text[] NOT NULL DEFAULT '{}',
  required_actions text[] NOT NULL DEFAULT '{}',
  explanation text[] NOT NULL DEFAULT '{}',
  engine_failure text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.safety_evaluations TO authenticated;
GRANT ALL ON public.safety_evaluations TO service_role;
ALTER TABLE public.safety_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their own safety evaluations" ON public.safety_evaluations FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_content_maintainer(auth.uid()));
CREATE POLICY "Users create their own safety evaluations" ON public.safety_evaluations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_safety_evaluations_updated_at BEFORE UPDATE ON public.safety_evaluations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.safety_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code text NOT NULL,
  case_key text NOT NULL,
  reason text NOT NULL,
  approved_by uuid REFERENCES auth.users ON DELETE SET NULL,
  approved_by_name text NOT NULL DEFAULT '',
  approved_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.safety_overrides TO authenticated;
GRANT ALL ON public.safety_overrides TO service_role;
ALTER TABLE public.safety_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Maintainers manage safety overrides" ON public.safety_overrides FOR ALL TO authenticated USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE TABLE public.safety_rule_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code text NOT NULL,
  action text NOT NULL,
  field text,
  previous_value text,
  new_value text,
  justification text NOT NULL,
  changed_by uuid REFERENCES auth.users ON DELETE SET NULL,
  changed_by_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.safety_rule_audit TO authenticated;
GRANT ALL ON public.safety_rule_audit TO service_role;
ALTER TABLE public.safety_rule_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Maintainers read safety rule audit" ON public.safety_rule_audit FOR SELECT TO authenticated USING (public.is_content_maintainer(auth.uid()));
CREATE POLICY "Maintainers write safety rule audit" ON public.safety_rule_audit FOR INSERT TO authenticated WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE INDEX idx_safety_evaluations_case ON public.safety_evaluations (case_key, created_at DESC);
CREATE INDEX idx_safety_overrides_rule ON public.safety_overrides (rule_code, case_key);