CREATE TABLE IF NOT EXISTS public.stain_identifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  organization_id UUID,
  fabric_assessment_id UUID,
  local_case_ref TEXT,
  entry_route TEXT,
  search_terms TEXT[] NOT NULL DEFAULT '{}',
  selected_stain_key TEXT,
  selected_source_key TEXT,
  selected_category_key TEXT,
  local_name_used TEXT,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  hazard_answers TEXT[] NOT NULL DEFAULT '{}',
  damage_answers TEXT[] NOT NULL DEFAULT '{}',
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  image_quality JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_model_version TEXT,
  candidates JSONB NOT NULL DEFAULT '[]'::jsonb,
  confirmed_stain_key TEXT,
  rejected_stain_keys TEXT[] NOT NULL DEFAULT '{}',
  identification_confidence SMALLINT CHECK (identification_confidence BETWEEN 0 AND 10),
  confidence_explanation TEXT,
  primary_category_key TEXT,
  secondary_component_keys TEXT[] NOT NULL DEFAULT '{}',
  stain_age TEXT,
  previous_treatment TEXT[] NOT NULL DEFAULT '{}',
  outcome TEXT,
  risk_before TEXT,
  risk_after TEXT,
  risk_rule TEXT,
  gate_before TEXT,
  gate_after TEXT,
  documentation_only BOOLEAN NOT NULL DEFAULT false,
  next_action TEXT,
  assessment_version TEXT NOT NULL DEFAULT 'stain-id-v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stain_identifications TO authenticated;
GRANT ALL ON public.stain_identifications TO service_role;
ALTER TABLE public.stain_identifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own stain identifications"
  ON public.stain_identifications FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Maintainers can view all stain identifications"
  ON public.stain_identifications FOR SELECT TO authenticated
  USING (public.is_content_maintainer(auth.uid()));

CREATE TRIGGER trg_stain_identifications_updated
  BEFORE UPDATE ON public.stain_identifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_stain_ident_user ON public.stain_identifications(user_id);
CREATE INDEX IF NOT EXISTS idx_stain_ident_assessment ON public.stain_identifications(fabric_assessment_id);

CREATE TABLE IF NOT EXISTS public.stain_identification_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identification_id UUID NOT NULL REFERENCES public.stain_identifications(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users ON DELETE SET NULL,
  reason TEXT NOT NULL,
  corrected_stain_key TEXT,
  previous_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.stain_identification_reviews TO authenticated;
GRANT ALL ON public.stain_identification_reviews TO service_role;
ALTER TABLE public.stain_identification_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Maintainers can view identification reviews"
  ON public.stain_identification_reviews FOR SELECT TO authenticated
  USING (public.is_content_maintainer(auth.uid()));

CREATE POLICY "Maintainers can add identification reviews"
  ON public.stain_identification_reviews FOR INSERT TO authenticated
  WITH CHECK (public.is_content_maintainer(auth.uid()) AND reviewer_id = auth.uid());