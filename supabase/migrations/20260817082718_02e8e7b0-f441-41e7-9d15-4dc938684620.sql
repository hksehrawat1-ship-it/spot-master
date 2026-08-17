-- ============ Enums ============
DO $$ BEGIN
  CREATE TYPE public.fabric_confidence_level AS ENUM ('high','moderate','low','unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.fabric_risk_group AS ENUM ('group_a','group_b','group_c','group_d');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.treatment_gate_status AS ENUM (
    'proceed','proceed_with_testing','professional_only',
    'blocked_pending_identification','blocked_existing_damage','specialist_material_route');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.label_status AS ENUM ('available','no_label','unclear','unconfirmed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.assessment_state AS ENUM ('in_progress','completed','abandoned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.assessment_photo_kind AS ENUM (
    'fibre_composition_label','care_symbol_label','garment_front','garment_back',
    'existing_damage','stain_area','professional_test');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ fabric_assessments ============
CREATE TABLE public.fabric_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  organization_id uuid REFERENCES public.organizations(id),
  case_id uuid REFERENCES public.cases(id) ON DELETE SET NULL,
  user_type public.app_role NOT NULL DEFAULT 'domestic_user',
  state public.assessment_state NOT NULL DEFAULT 'in_progress',
  current_stage text,
  -- label
  label_status public.label_status NOT NULL DEFAULT 'unconfirmed',
  label_language text,
  raw_label_text text,
  extracted_label jsonb NOT NULL DEFAULT '{}'::jsonb,
  confirmed_label jsonb NOT NULL DEFAULT '{}'::jsonb,
  label_extraction_confidence smallint CHECK (label_extraction_confidence BETWEEN 0 AND 100),
  label_user_confirmed boolean NOT NULL DEFAULT false,
  unresolved_label_items text[] NOT NULL DEFAULT '{}',
  -- garment
  garment_type text,
  garment_type_other text,
  cleaning_history text[] NOT NULL DEFAULT '{}',
  cleaning_history_notes jsonb NOT NULL DEFAULT '{}'::jsonb,
  fabric_appearance text[] NOT NULL DEFAULT '{}',
  colour_description text[] NOT NULL DEFAULT '{}',
  colour_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  construction_features text[] NOT NULL DEFAULT '{}',
  stain_touches_feature boolean,
  existing_damage text[] NOT NULL DEFAULT '{}',
  garment_importance text[] NOT NULL DEFAULT '{}',
  -- results
  suspected_material_family text,
  fabric_confidence public.fabric_confidence_level NOT NULL DEFAULT 'unknown',
  fabric_confidence_reason text,
  risk_group public.fabric_risk_group,
  risk_level public.risk_level NOT NULL DEFAULT 'amber',
  risk_reason text,
  risk_score integer NOT NULL DEFAULT 0,
  risk_factors jsonb NOT NULL DEFAULT '[]'::jsonb,
  damage_risks text[] NOT NULL DEFAULT '{}',
  safety_overrides jsonb NOT NULL DEFAULT '[]'::jsonb,
  treatment_gate public.treatment_gate_status NOT NULL DEFAULT 'blocked_pending_identification',
  recommended_next_action text,
  rules_version text NOT NULL DEFAULT 'v1',
  assessment_version integer NOT NULL DEFAULT 1,
  -- admin
  admin_override_applied boolean NOT NULL DEFAULT false,
  admin_override_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fabric_assessments TO authenticated;
GRANT ALL ON public.fabric_assessments TO service_role;
ALTER TABLE public.fabric_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own assessments" ON public.fabric_assessments
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Maintainers read all assessments" ON public.fabric_assessments
  FOR SELECT TO authenticated
  USING (public.is_content_maintainer(auth.uid()));

CREATE POLICY "Maintainers review assessments" ON public.fabric_assessments
  FOR UPDATE TO authenticated
  USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE INDEX idx_fabric_assessments_user ON public.fabric_assessments(user_id);
CREATE INDEX idx_fabric_assessments_gate ON public.fabric_assessments(treatment_gate);
CREATE INDEX idx_fabric_assessments_risk ON public.fabric_assessments(risk_level);

CREATE TRIGGER update_fabric_assessments_updated_at
  BEFORE UPDATE ON public.fabric_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ photos ============
CREATE TABLE public.fabric_assessment_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.fabric_assessments(id) ON DELETE CASCADE,
  user_id uuid,
  kind public.assessment_photo_kind NOT NULL,
  storage_path text,
  quality_notes text,
  extracted_text text,
  extraction_confidence smallint CHECK (extraction_confidence BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fabric_assessment_photos TO authenticated;
GRANT ALL ON public.fabric_assessment_photos TO service_role;
ALTER TABLE public.fabric_assessment_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own assessment photos" ON public.fabric_assessment_photos
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.fabric_assessments a WHERE a.id = assessment_id AND a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.fabric_assessments a WHERE a.id = assessment_id AND a.user_id = auth.uid()));

CREATE POLICY "Maintainers read assessment photos" ON public.fabric_assessment_photos
  FOR SELECT TO authenticated
  USING (public.is_content_maintainer(auth.uid()));

CREATE TRIGGER update_fabric_assessment_photos_updated_at
  BEFORE UPDATE ON public.fabric_assessment_photos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ professional tests ============
CREATE TABLE public.fabric_compatibility_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.fabric_assessments(id) ON DELETE CASCADE,
  test_type text NOT NULL,
  test_location text,
  medium_used text,
  method_source text,
  result text,
  colour_transfer text,
  texture_change text,
  distortion text,
  ring_formation text,
  operator text,
  performed_at timestamptz NOT NULL DEFAULT now(),
  photo_path text,
  decision text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fabric_compatibility_tests TO authenticated;
GRANT ALL ON public.fabric_compatibility_tests TO service_role;
ALTER TABLE public.fabric_compatibility_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own compatibility tests" ON public.fabric_compatibility_tests
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.fabric_assessments a WHERE a.id = assessment_id AND a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.fabric_assessments a WHERE a.id = assessment_id AND a.user_id = auth.uid()));

CREATE POLICY "Maintainers read compatibility tests" ON public.fabric_compatibility_tests
  FOR SELECT TO authenticated
  USING (public.is_content_maintainer(auth.uid()));

CREATE TRIGGER update_fabric_compatibility_tests_updated_at
  BEFORE UPDATE ON public.fabric_compatibility_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ audit trail ============
CREATE TABLE public.fabric_assessment_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.fabric_assessments(id) ON DELETE CASCADE,
  action text NOT NULL,
  changed_by uuid,
  previous_data jsonb,
  new_data jsonb,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.fabric_assessment_audit TO authenticated;
GRANT ALL ON public.fabric_assessment_audit TO service_role;
ALTER TABLE public.fabric_assessment_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users add own assessment audit" ON public.fabric_assessment_audit
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.fabric_assessments a WHERE a.id = assessment_id AND a.user_id = auth.uid())
              OR public.is_content_maintainer(auth.uid()));

CREATE POLICY "Owners and maintainers read assessment audit" ON public.fabric_assessment_audit
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.fabric_assessments a WHERE a.id = assessment_id AND a.user_id = auth.uid())
         OR public.is_content_maintainer(auth.uid()));

-- ============ versioned risk rules ============
CREATE TABLE public.fabric_risk_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rules_version text NOT NULL,
  rule_key text NOT NULL,
  label text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'score',
  weight integer NOT NULL DEFAULT 0,
  forces_risk public.risk_level,
  is_override boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rules_version, rule_key)
);

GRANT SELECT ON public.fabric_risk_rules TO authenticated;
GRANT ALL ON public.fabric_risk_rules TO service_role;
ALTER TABLE public.fabric_risk_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed in users read risk rules" ON public.fabric_risk_rules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage risk rules" ON public.fabric_risk_rules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'system_admin') OR public.has_role(auth.uid(), 'content_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'system_admin') OR public.has_role(auth.uid(), 'content_admin'));

CREATE TRIGGER update_fabric_risk_rules_updated_at
  BEFORE UPDATE ON public.fabric_risk_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ analytics events ============
CREATE TABLE public.fabric_assessment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.fabric_assessments(id) ON DELETE CASCADE,
  user_id uuid,
  event_name text NOT NULL,
  stage text,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.fabric_assessment_events TO authenticated;
GRANT ALL ON public.fabric_assessment_events TO service_role;
ALTER TABLE public.fabric_assessment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users add own assessment events" ON public.fabric_assessment_events
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners and maintainers read assessment events" ON public.fabric_assessment_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_content_maintainer(auth.uid()));

-- ============ seed rule configuration (v1) ============
INSERT INTO public.fabric_risk_rules (rules_version, rule_key, label, description, category, weight, forces_risk, is_override) VALUES
  ('v1','no_label','No care label','Care label missing or unreadable','score',2,NULL,false),
  ('v1','label_unclear','Label unclear or conflicting','Extraction confidence low or conflicting fibre percentages','score',2,NULL,false),
  ('v1','unknown_material','Material unknown','User could not describe the fabric','score',2,NULL,false),
  ('v1','dark_bright_multi','Dark, bright or multicoloured dye','Higher colourfastness risk','score',2,NULL,false),
  ('v1','stain_crosses_colours','Stain crosses two or more colours','Bleed risk across colour boundaries','score',2,NULL,false),
  ('v1','print_surface_design','Surface print or design','Print may lift or crack','score',1,NULL,false),
  ('v1','delicate_appearance','Delicate appearance','Shiny, soft-flowing, very thin or wool-like','score',3,NULL,false),
  ('v1','stretch_content','Stretch content','Elastane distortion risk','score',1,NULL,false),
  ('v1','pile_surface','Pile surface','Velvet or fur-like pile crush risk','score',2,NULL,false),
  ('v1','structured_garment','Structured garment','Blazer, suit or unknown interlining','score',2,NULL,false),
  ('v1','no_cleaning_history','No successful cleaning history','Never cleaned or history unknown','score',1,NULL,false),
  ('v1','unknown_previous_chemical','Unknown previous chemical treatment','Previous chemical mark reported','score',2,NULL,false),
  ('v1','high_value','High garment value','Expensive, designer, bridal, sentimental or irreplaceable','score',3,'red',false),
  ('v1','embellishment','Embellishment present','Beads, sequins, stones, embroidery','score',3,'red',false),
  ('v1','metallic_thread','Metallic thread','Tarnish and damage risk','score',3,'red',false),
  ('v1','glued_decoration','Glued decoration','Adhesive failure risk','score',3,'red',false),
  ('v1','stain_on_feature','Stain on decoration, coating or adhesive','Direct contact with sensitive feature','score',3,'red',false),
  ('v1','silk_wool_no_label','Silk-like or wool-like with no label','Delicate protein or animal fibre suspected','score',3,'red',true),
  ('v1','complex_multicolour','Complex multicoloured construction','Multiple unstable dyes','score',2,'red',false),
  ('v1','active_dye_bleeding','Active dye bleeding','Colour transferring now','override',0,'black',true),
  ('v1','fibre_disintegration','Existing fibre disintegration','Thinning or holes','override',0,'black',true),
  ('v1','melted_scorched','Melted or scorched surface','Irreversible heat damage','override',0,'black',true),
  ('v1','coating_peeling','Peeling or failing coating','Coating no longer intact','override',0,'black',true),
  ('v1','delamination','Delamination','Bonded layers separating','override',0,'black',true),
  ('v1','leather_suede_fur','Leather, suede or fur-like material','Specialist material route','override',0,'black',true),
  ('v1','chemical_contamination','Unknown chemical contamination','Unidentified chemical exposure','override',0,'black',true),
  ('v1','structure_failing','Garment structure actively failing','No safe treatment boundary','override',0,'black',true);