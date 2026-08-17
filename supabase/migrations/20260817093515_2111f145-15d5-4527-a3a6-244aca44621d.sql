-- STEP 6: Master Stain Database. Purely additive; no existing table is modified.

CREATE TABLE public.master_stains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stain_id text NOT NULL UNIQUE,
  record_key text NOT NULL UNIQUE,
  canonical_name text NOT NULL,
  display_singular text NOT NULL,
  display_plural text,
  technical_name text,
  short_description text,
  icon text,
  search_keywords text[] NOT NULL DEFAULT '{}',
  canonical_parent_id uuid REFERENCES public.master_stains(id) ON DELETE SET NULL,
  variant_notes text,
  added_components text[] NOT NULL DEFAULT '{}',
  primary_category text NOT NULL,
  classification_confidence int NOT NULL DEFAULT 0,
  classification_explanation text,
  secondary_components jsonb NOT NULL DEFAULT '[]'::jsonb,
  component_confidence int NOT NULL DEFAULT 0,
  source_types text[] NOT NULL DEFAULT '{}',
  condition_tags text[] NOT NULL DEFAULT '{}',
  risk_tags text[] NOT NULL DEFAULT '{}',
  classification_evidence text,
  classification_reviewer text,
  classification_version int NOT NULL DEFAULT 1,
  is_damage_diagnosis boolean NOT NULL DEFAULT false,
  damage_interpretation text,
  science jsonb NOT NULL DEFAULT '{}'::jsonb,
  science_plain text,
  identification jsonb NOT NULL DEFAULT '{}'::jsonb,
  domestic_status text NOT NULL DEFAULT 'no_domestic_treatment',
  domestic_confidence int NOT NULL DEFAULT 0,
  technical_content jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_owner text,
  technical_reviewer text,
  source_documents text[] NOT NULL DEFAULT '{}',
  countries text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}',
  last_reviewed date,
  next_review date,
  approval_status content_status NOT NULL DEFAULT 'draft',
  is_published boolean NOT NULL DEFAULT false,
  content_version int NOT NULL DEFAULT 1,
  revision_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.master_stains TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.master_stains TO authenticated;
GRANT ALL ON public.master_stains TO service_role;
ALTER TABLE public.master_stains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published master stains are viewable by everyone"
  ON public.master_stains FOR SELECT
  USING (is_published = true AND approval_status = 'published');
CREATE POLICY "Maintainers can view all master stains"
  ON public.master_stains FOR SELECT TO authenticated
  USING (public.is_content_maintainer(auth.uid()));
CREATE POLICY "Maintainers can manage master stains"
  ON public.master_stains FOR ALL TO authenticated
  USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_master_stains_updated BEFORE UPDATE ON public.master_stains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Child sections -----------------------------------------------------------

CREATE TABLE public.stain_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_stain_id uuid NOT NULL REFERENCES public.master_stains(id) ON DELETE CASCADE,
  alias text NOT NULL,
  alias_type text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  country text,
  script text,
  transliteration text,
  search_priority int NOT NULL DEFAULT 5,
  approval_status content_status NOT NULL DEFAULT 'draft',
  requires_label_check boolean NOT NULL DEFAULT false,
  source text,
  reviewer text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (master_stain_id, alias, language)
);

CREATE TABLE public.stain_common_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_stain_id uuid NOT NULL REFERENCES public.master_stains(id) ON DELETE CASCADE,
  source_name text NOT NULL,
  source_type text NOT NULL,
  typical_context text,
  countries text[] NOT NULL DEFAULT '{}',
  formulation_variable boolean NOT NULL DEFAULT false,
  likelihood text NOT NULL DEFAULT 'moderate',
  evidence_type text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stain_fabric_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_stain_id uuid NOT NULL REFERENCES public.master_stains(id) ON DELETE CASCADE,
  fabric_key text NOT NULL,
  is_component_part boolean NOT NULL DEFAULT false,
  main_risk text NOT NULL,
  why_risk text,
  test_required boolean NOT NULL DEFAULT false,
  first_response_boundary text,
  prohibited_principles text[] NOT NULL DEFAULT '{}',
  referral_condition text,
  confidence int NOT NULL DEFAULT 5,
  evidence_type text,
  reviewer text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stain_colour_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_stain_id uuid NOT NULL REFERENCES public.master_stains(id) ON DELETE CASCADE,
  colour_key text NOT NULL,
  main_risk text NOT NULL,
  colourfastness_test_required boolean NOT NULL DEFAULT true,
  dye_transfer_risk text NOT NULL DEFAULT 'moderate',
  oxidation_restricted boolean NOT NULL DEFAULT true,
  reduction_restricted boolean NOT NULL DEFAULT true,
  heat_restricted boolean NOT NULL DEFAULT true,
  referral text,
  evidence_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stain_condition_effects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_stain_id uuid NOT NULL REFERENCES public.master_stains(id) ON DELETE CASCADE,
  condition_key text NOT NULL,
  difficulty text NOT NULL DEFAULT 'harder',
  added_damage_risk text,
  assessment_requirement text,
  outcome_adjustment text,
  escalation_condition text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stain_first_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_stain_id uuid NOT NULL REFERENCES public.master_stains(id) ON DELETE CASCADE,
  eligible_roles text[] NOT NULL DEFAULT '{}',
  eligible_fabric_conditions text,
  eligible_stain_conditions text,
  action text NOT NULL,
  purpose text,
  prohibited_circumstances text[] NOT NULL DEFAULT '{}',
  max_delay_before_assessment text,
  heat_warning text,
  escalation_trigger text,
  evidence_type text,
  approval_status content_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stain_stage_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_stain_id uuid NOT NULL REFERENCES public.master_stains(id) ON DELETE CASCADE,
  stage_key text NOT NULL,
  stage_order int NOT NULL DEFAULT 1,
  preconditions text[] NOT NULL DEFAULT '{}',
  prohibited_conditions text[] NOT NULL DEFAULT '{}',
  inspection_point text,
  stop_condition text,
  evidence_type text,
  approval_status content_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stain_prohibitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_stain_id uuid NOT NULL REFERENCES public.master_stains(id) ON DELETE CASCADE,
  prohibition_type text NOT NULL,
  applies_condition text NOT NULL,
  affected_roles text[] NOT NULL DEFAULT '{}',
  reason text NOT NULL,
  severity text NOT NULL DEFAULT 'important',
  evidence_type text,
  reviewer text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stain_expected_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_stain_id uuid NOT NULL REFERENCES public.master_stains(id) ON DELETE CASCADE,
  fabric_key text,
  colour_key text,
  stain_age text,
  previously_treated boolean,
  heat_exposed boolean,
  damaged boolean,
  outcome_class text NOT NULL,
  foreign_material text,
  remaining_pigment text,
  dye_loss text,
  fibre_damage text,
  finish_damage text,
  odour_hygiene text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stain_failure_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_stain_id uuid NOT NULL REFERENCES public.master_stains(id) ON DELETE CASCADE,
  why_may_fail text[] NOT NULL DEFAULT '{}',
  residue_indicators text[] NOT NULL DEFAULT '{}',
  dye_loss_indicators text[] NOT NULL DEFAULT '{}',
  fibre_damage_indicators text[] NOT NULL DEFAULT '{}',
  finish_damage_indicators text[] NOT NULL DEFAULT '{}',
  further_attempt_safe text NOT NULL DEFAULT 'assessment_required',
  max_attempt_policy text,
  mandatory_stop text[] NOT NULL DEFAULT '{}',
  escalation_point text,
  next_assessment text,
  evidence_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stain_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_stain_id uuid NOT NULL REFERENCES public.master_stains(id) ON DELETE CASCADE,
  related_stain_id uuid REFERENCES public.master_stains(id) ON DELETE CASCADE,
  related_key text,
  relation_kind text NOT NULL,
  explanation text,
  evidence_type text,
  reviewer text,
  directional boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stain_public_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_stain_id uuid NOT NULL REFERENCES public.master_stains(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'en',
  page_title text NOT NULL,
  short_answer text,
  before_you_start text,
  why_difficult text,
  materials_cautious text[] NOT NULL DEFAULT '{}',
  materials_professional text[] NOT NULL DEFAULT '{}',
  professional_summary text,
  common_mistakes text[] NOT NULL DEFAULT '{}',
  disclaimer text,
  source_version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (master_stain_id, language)
);

CREATE TABLE public.stain_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_stain_id uuid NOT NULL REFERENCES public.master_stains(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  audience text NOT NULL DEFAULT 'public',
  language text NOT NULL DEFAULT 'en',
  country text,
  evidence_type text,
  approval_status content_status NOT NULL DEFAULT 'draft',
  display_order int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stain_evidence_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_stain_id uuid NOT NULL REFERENCES public.master_stains(id) ON DELETE CASCADE,
  evidence_type text NOT NULL,
  source text NOT NULL,
  source_version text,
  source_date date,
  country text,
  section text NOT NULL,
  claim text NOT NULL,
  reviewer text,
  verification verification_status NOT NULL DEFAULT 'unverified',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stain_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_stain_id uuid NOT NULL REFERENCES public.master_stains(id) ON DELETE CASCADE,
  language text NOT NULL,
  country text,
  script text,
  display_name text NOT NULL,
  short_description text,
  translation_status text NOT NULL DEFAULT 'not_started',
  translator text,
  technical_review_of_translation text,
  source_version int NOT NULL DEFAULT 1,
  units text NOT NULL DEFAULT 'metric',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (master_stain_id, language, country)
);

CREATE TABLE public.stain_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_stain_id uuid NOT NULL REFERENCES public.master_stains(id) ON DELETE CASCADE,
  content_version int NOT NULL,
  changed_by text,
  reason text,
  approval_status content_status NOT NULL DEFAULT 'draft',
  sections text[] NOT NULL DEFAULT '{}',
  snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stain_review_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_stain_id uuid NOT NULL REFERENCES public.master_stains(id) ON DELETE CASCADE,
  trigger_key text NOT NULL,
  sections text[] NOT NULL DEFAULT '{}',
  note text,
  resolved boolean NOT NULL DEFAULT false,
  resolved_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Grants, RLS and policies for every child table ----------------------------

DO $$
DECLARE
  t text;
  public_readable text[] := ARRAY[
    'stain_aliases','stain_common_sources','stain_fabric_rules','stain_colour_rules',
    'stain_condition_effects','stain_first_responses','stain_expected_outcomes',
    'stain_failure_profiles','stain_relations','stain_public_contents','stain_faqs',
    'stain_translations'
  ];
  maintainer_only text[] := ARRAY[
    'stain_stage_links','stain_prohibitions','stain_evidence_claims',
    'stain_revisions','stain_review_flags'
  ];
BEGIN
  FOREACH t IN ARRAY public_readable || maintainer_only LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY "Maintainers can manage %1$s" ON public.%1$I FOR ALL TO authenticated USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()))',
      t);
  END LOOP;

  FOREACH t IN ARRAY public_readable LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
    EXECUTE format(
      'CREATE POLICY "Published stain content is viewable by everyone" ON public.%1$I FOR SELECT USING (EXISTS (SELECT 1 FROM public.master_stains m WHERE m.id = %1$I.master_stain_id AND m.is_published = true AND m.approval_status = ''published''))',
      t);
  END LOOP;

  FOREACH t IN ARRAY public_readable || maintainer_only LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%1$s_updated BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
      t);
  END LOOP;
EXCEPTION WHEN undefined_column THEN
  RAISE;
END $$;

-- stain_revisions has no updated_at column; drop the trigger created above.
DROP TRIGGER IF EXISTS trg_stain_revisions_updated ON public.stain_revisions;

CREATE INDEX idx_master_stains_status ON public.master_stains(approval_status, is_published);
CREATE INDEX idx_master_stains_category ON public.master_stains(primary_category);
CREATE INDEX idx_master_stains_parent ON public.master_stains(canonical_parent_id);
CREATE INDEX idx_stain_aliases_alias ON public.stain_aliases(lower(alias));
CREATE INDEX idx_stain_evidence_section ON public.stain_evidence_claims(master_stain_id, section);