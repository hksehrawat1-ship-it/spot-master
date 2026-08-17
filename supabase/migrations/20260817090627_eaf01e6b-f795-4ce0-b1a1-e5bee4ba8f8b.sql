CREATE TYPE public.component_relevance AS ENUM ('primary','major','minor','possible');
CREATE TYPE public.classification_evidence AS ENUM (
  'manufacturer_documented','recognized_technical_reference','internal_trial_verified',
  'professional_consensus','user_reported_source','ai_suggested','inferred','insufficient_information'
);
CREATE TYPE public.classification_tag_kind AS ENUM ('condition','risk');

CREATE TABLE public.stain_primary_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key text NOT NULL UNIQUE,
  name text NOT NULL UNIQUE,
  icon text,
  plain_description text NOT NULL,
  examples text[] NOT NULL DEFAULT '{}',
  important_limitation text,
  heat_warning text,
  technical_only boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stain_primary_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stain_primary_categories TO authenticated;
GRANT ALL ON public.stain_primary_categories TO service_role;
ALTER TABLE public.stain_primary_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read primary categories" ON public.stain_primary_categories FOR SELECT USING (true);
CREATE POLICY "Maintainers manage primary categories" ON public.stain_primary_categories FOR ALL TO authenticated
USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_primary_categories_updated BEFORE UPDATE ON public.stain_primary_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.stain_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component_key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  technical_only boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stain_components TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stain_components TO authenticated;
GRANT ALL ON public.stain_components TO service_role;
ALTER TABLE public.stain_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read components" ON public.stain_components FOR SELECT USING (true);
CREATE POLICY "Maintainers manage components" ON public.stain_components FOR ALL TO authenticated
USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_components_updated BEFORE UPDATE ON public.stain_components
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.stain_source_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text NOT NULL UNIQUE,
  label text NOT NULL,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stain_source_types TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stain_source_types TO authenticated;
GRANT ALL ON public.stain_source_types TO service_role;
ALTER TABLE public.stain_source_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read source types" ON public.stain_source_types FOR SELECT USING (true);
CREATE POLICY "Maintainers manage source types" ON public.stain_source_types FOR ALL TO authenticated
USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_source_types_updated BEFORE UPDATE ON public.stain_source_types
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.classification_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_key text NOT NULL UNIQUE,
  label text NOT NULL,
  kind classification_tag_kind NOT NULL,
  description text,
  raises_risk risk_level,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.classification_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classification_tags TO authenticated;
GRANT ALL ON public.classification_tags TO service_role;
ALTER TABLE public.classification_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read classification tags" ON public.classification_tags FOR SELECT USING (true);
CREATE POLICY "Maintainers manage classification tags" ON public.classification_tags FOR ALL TO authenticated
USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_classification_tags_updated BEFORE UPDATE ON public.classification_tags
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.damage_interpretations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  damage_key text NOT NULL UNIQUE,
  label text NOT NULL,
  plain_description text,
  is_stain boolean NOT NULL DEFAULT false,
  requires_professional boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.damage_interpretations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.damage_interpretations TO authenticated;
GRANT ALL ON public.damage_interpretations TO service_role;
ALTER TABLE public.damage_interpretations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read damage interpretations" ON public.damage_interpretations FOR SELECT USING (true);
CREATE POLICY "Maintainers manage damage interpretations" ON public.damage_interpretations FOR ALL TO authenticated
USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_damage_interpretations_updated BEFORE UPDATE ON public.damage_interpretations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.stain_library_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stain_key text NOT NULL UNIQUE,
  stain_id uuid REFERENCES public.stains(id),
  display_name text NOT NULL,
  alternative_names text[] NOT NULL DEFAULT '{}',
  local_names text[] NOT NULL DEFAULT '{}',
  primary_category_key text NOT NULL REFERENCES public.stain_primary_categories(category_key),
  primary_category_confidence smallint NOT NULL DEFAULT 5 CHECK (primary_category_confidence BETWEEN 0 AND 10),
  primary_category_reason text,
  component_confidence smallint NOT NULL DEFAULT 5 CHECK (component_confidence BETWEEN 0 AND 10),
  source_confidence smallint NOT NULL DEFAULT 5 CHECK (source_confidence BETWEEN 0 AND 10),
  damage_interpretation_confidence smallint NOT NULL DEFAULT 5 CHECK (damage_interpretation_confidence BETWEEN 0 AND 10),
  evidence_level classification_evidence NOT NULL DEFAULT 'insufficient_information',
  plain_explanation text,
  likely_composition text NOT NULL DEFAULT 'Insufficient information',
  solubility text NOT NULL DEFAULT 'Insufficient information',
  bonding_behaviour text NOT NULL DEFAULT 'Insufficient information',
  effect_of_heat text NOT NULL DEFAULT 'Not established',
  effect_of_ageing text NOT NULL DEFAULT 'Not established',
  effect_of_oxidation text NOT NULL DEFAULT 'Not established',
  effect_of_acidity text NOT NULL DEFAULT 'Not established',
  effect_of_alkalinity text NOT NULL DEFAULT 'Not established',
  treatment_principle_note text NOT NULL DEFAULT 'Defined in a later step',
  damage_default_key text REFERENCES public.damage_interpretations(damage_key),
  legacy_category text,
  country_applicability text[] NOT NULL DEFAULT '{}',
  content_owner text,
  technical_reviewer uuid,
  approval_status content_status NOT NULL DEFAULT 'draft',
  classification_version integer NOT NULL DEFAULT 1,
  taxonomy_version text NOT NULL DEFAULT 'taxonomy-v1',
  needs_review boolean NOT NULL DEFAULT false,
  review_note text,
  review_date date,
  next_review_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stain_library_classifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stain_library_classifications TO authenticated;
GRANT ALL ON public.stain_library_classifications TO service_role;
ALTER TABLE public.stain_library_classifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published classifications" ON public.stain_library_classifications
FOR SELECT USING (approval_status IN ('approved','published'));
CREATE POLICY "Maintainers read all classifications" ON public.stain_library_classifications
FOR SELECT TO authenticated USING (public.is_content_maintainer(auth.uid()));
CREATE POLICY "Maintainers manage classifications" ON public.stain_library_classifications
FOR ALL TO authenticated USING (public.is_content_maintainer(auth.uid()))
WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_library_classifications_updated BEFORE UPDATE ON public.stain_library_classifications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.stain_classification_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classification_id uuid NOT NULL REFERENCES public.stain_library_classifications(id) ON DELETE CASCADE,
  component_key text NOT NULL REFERENCES public.stain_components(component_key),
  relevance component_relevance NOT NULL DEFAULT 'possible',
  confidence smallint NOT NULL DEFAULT 5 CHECK (confidence BETWEEN 0 AND 10),
  evidence_level classification_evidence NOT NULL DEFAULT 'inferred',
  notes text,
  review_status content_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (classification_id, component_key)
);
GRANT SELECT ON public.stain_classification_components TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stain_classification_components TO authenticated;
GRANT ALL ON public.stain_classification_components TO service_role;
ALTER TABLE public.stain_classification_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read classification components" ON public.stain_classification_components FOR SELECT USING (true);
CREATE POLICY "Maintainers manage classification components" ON public.stain_classification_components FOR ALL TO authenticated
USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE TABLE public.stain_classification_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classification_id uuid NOT NULL REFERENCES public.stain_library_classifications(id) ON DELETE CASCADE,
  source_key text NOT NULL REFERENCES public.stain_source_types(source_key),
  confidence smallint NOT NULL DEFAULT 5 CHECK (confidence BETWEEN 0 AND 10),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (classification_id, source_key)
);
GRANT SELECT ON public.stain_classification_sources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stain_classification_sources TO authenticated;
GRANT ALL ON public.stain_classification_sources TO service_role;
ALTER TABLE public.stain_classification_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read classification sources" ON public.stain_classification_sources FOR SELECT USING (true);
CREATE POLICY "Maintainers manage classification sources" ON public.stain_classification_sources FOR ALL TO authenticated
USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE TABLE public.stain_classification_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classification_id uuid NOT NULL REFERENCES public.stain_library_classifications(id) ON DELETE CASCADE,
  tag_key text NOT NULL REFERENCES public.classification_tags(tag_key),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (classification_id, tag_key)
);
GRANT SELECT ON public.stain_classification_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stain_classification_tags TO authenticated;
GRANT ALL ON public.stain_classification_tags TO service_role;
ALTER TABLE public.stain_classification_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read classification tag links" ON public.stain_classification_tags FOR SELECT USING (true);
CREATE POLICY "Maintainers manage classification tag links" ON public.stain_classification_tags FOR ALL TO authenticated
USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE TABLE public.case_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.organizations(id),
  case_id uuid REFERENCES public.cases(id),
  identification_id uuid REFERENCES public.stain_identifications(id),
  condition_assessment_id uuid REFERENCES public.case_condition_assessments(id),
  library_stain_key text,
  primary_category_key text REFERENCES public.stain_primary_categories(category_key),
  primary_category_confidence smallint NOT NULL DEFAULT 0 CHECK (primary_category_confidence BETWEEN 0 AND 10),
  primary_category_reason text,
  case_components jsonb NOT NULL DEFAULT '[]'::jsonb,
  component_confidence smallint NOT NULL DEFAULT 0 CHECK (component_confidence BETWEEN 0 AND 10),
  source_keys text[] NOT NULL DEFAULT '{}',
  source_confidence smallint NOT NULL DEFAULT 0 CHECK (source_confidence BETWEEN 0 AND 10),
  condition_tags text[] NOT NULL DEFAULT '{}',
  risk_tags text[] NOT NULL DEFAULT '{}',
  damage_keys text[] NOT NULL DEFAULT '{}',
  damage_confidence smallint NOT NULL DEFAULT 0 CHECK (damage_confidence BETWEEN 0 AND 10),
  evidence_level classification_evidence NOT NULL DEFAULT 'inferred',
  plain_explanation text,
  technical_explanation text,
  unresolved_questions text[] NOT NULL DEFAULT '{}',
  user_confirmation text,
  user_correction text,
  risk_before risk_level NOT NULL DEFAULT 'amber',
  risk_after risk_level NOT NULL DEFAULT 'amber',
  gate_status text,
  readiness_status text,
  blocked boolean NOT NULL DEFAULT false,
  block_reason text,
  taxonomy_version text NOT NULL DEFAULT 'taxonomy-v1',
  classification_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_classifications TO authenticated;
GRANT ALL ON public.case_classifications TO service_role;
ALTER TABLE public.case_classifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their case classifications" ON public.case_classifications FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Maintainers read case classifications" ON public.case_classifications FOR SELECT TO authenticated
USING (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_case_classifications_updated BEFORE UPDATE ON public.case_classifications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.classification_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classification_id uuid REFERENCES public.stain_library_classifications(id) ON DELETE CASCADE,
  case_classification_id uuid REFERENCES public.case_classifications(id) ON DELETE CASCADE,
  version integer NOT NULL,
  action text NOT NULL,
  changed_by uuid,
  justification text,
  previous_primary_category text,
  new_primary_category text,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.classification_versions TO authenticated;
GRANT ALL ON public.classification_versions TO service_role;
ALTER TABLE public.classification_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read classification versions" ON public.classification_versions
FOR SELECT TO authenticated USING (true);
CREATE POLICY "Maintainers add classification versions" ON public.classification_versions
FOR INSERT TO authenticated WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE TABLE public.category_migration_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_category text NOT NULL,
  new_category_key text REFERENCES public.stain_primary_categories(category_key),
  split_category_keys text[] NOT NULL DEFAULT '{}',
  tags_added text[] NOT NULL DEFAULT '{}',
  routed_to_damage boolean NOT NULL DEFAULT false,
  records_total integer NOT NULL DEFAULT 0,
  records_migrated integer NOT NULL DEFAULT 0,
  records_needing_review integer NOT NULL DEFAULT 0,
  records_not_migrated integer NOT NULL DEFAULT 0,
  reason text,
  reviewer_status text NOT NULL DEFAULT 'pending_review',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.category_migration_map TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.category_migration_map TO authenticated;
GRANT ALL ON public.category_migration_map TO service_role;
ALTER TABLE public.category_migration_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read migration map" ON public.category_migration_map FOR SELECT USING (true);
CREATE POLICY "Maintainers manage migration map" ON public.category_migration_map FOR ALL TO authenticated
USING (public.is_content_maintainer(auth.uid())) WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_migration_map_updated BEFORE UPDATE ON public.category_migration_map
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.stain_primary_categories (category_key, name, icon, plain_description, examples, important_limitation, heat_warning, technical_only, sort_order) VALUES
('water_soluble','Water-Soluble','droplet','Stains whose important components can initially dissolve or disperse in water.','{"Sugar syrup","Clear soft drinks","Water-soluble salts","Some washable beverage residues"}','A stain containing water is not automatically water-soluble. Milk, coffee, juice, sauces and perspiration may belong to protein, tannin or combination categories.',NULL,false,1),
('oil_grease','Oil and Grease-Based','oil','Stains dominated by fats, oils, waxes or hydrocarbon-like greasy material.','{"Cooking oil","Ghee","Butter","Machine oil","Sebum"}','Pigmented cosmetics, sauces and shoe polish may be combination stains rather than simple oil stains.',NULL,false,2),
('protein','Protein-Based','egg','Stains containing proteins or albuminous material that may bind strongly and become more difficult after heat.','{"Blood","Egg","Milk","Cream","Meat juices"}','Protein stains may also contain fat, pigment, tannin, starch or biological hazards.','Heat can set protein material and make the mark far harder to improve.',false,3),
('tannin_plant','Tannin and Plant-Based','leaf','Stains dominated by plant-derived colour compounds, tannins or related natural extracts.','{"Tea","Coffee","Wine","Fruit","Grass","Tobacco"}','Coffee with milk, oily curry and sweetened beverages may require a combination classification.','Heat and ageing can deepen plant colour.',false,4),
('pigment_particulate','Pigment and Particulate','grain','Solid particles or insoluble pigments deposited on or inside the textile.','{"Mud","Clay","Soot","Charcoal","Cosmetic powder"}','Paint, printing ink and dyed cosmetics may contain polymers, oils or dyes and may require another primary category.',NULL,false,5),
('dye_ink','Dye and Ink-Based','pen','Stains dominated by natural or synthetic dyes, inks or transferred textile colour.','{"Fountain-pen ink","Marker","Food colouring","Hair dye","Textile dye transfer"}','Ballpoint ink may also contain solvent, resin and oil components. Dye transfer is a sub-type and tag inside this category, not a category of its own.',NULL,false,6),
('paint_polymer','Paint, Resin, Adhesive and Polymer','brush','Stains that form a film, harden, cure or adhere through paint binders, resins, glues or polymers.','{"Latex paint","Acrylic paint","Varnish","Adhesive","Nail polish","Chewing gum"}','Different products cure differently. Exact treatment cannot be selected from the general category alone.',NULL,false,7),
('oxidizable','Oxidizable','sparkle','Residual coloured compounds that may respond to verified oxidation after earlier compatible treatment stages have been completed.','{"Certain remaining beverage colours","Some plant colours","Selected residual yellowing"}','Oxidizable is a treatment-relevant classification, not permission to apply bleach. Fabric, dye, finish and product compatibility must be verified first.',NULL,true,8),
('reducible','Reducible','flask','Selected colour bodies that may respond to verified reducing chemistry under controlled professional conditions.','{"Specific residual dyes","Certain transferred colours","Stains identified by an approved technical process"}','Rust is not automatically reducible. Reducing chemistry is never exposed to domestic users.',NULL,true,9),
('metal_rust','Metal, Rust and Mineral','bolt','Deposits or discoloration involving metallic oxides, corrosion products or mineral residues.','{"Iron rust","Verdigris","Hard-water mineral deposits","Scale","Deodorant mineral buildup"}','Rust chemistry may damage dyes, fibres, metallic threads, trims or finishes. Classification does not authorize treatment.',NULL,false,10),
('biological','Biological','biohazard','Contamination involving mould, mildew, microorganisms or biologically hazardous material.','{"Mould","Mildew","Algae","Sewage contamination","Microbial growth"}','Biological classification includes hygiene and exposure considerations beyond visual stain removal.',NULL,false,11),
('combination_unknown','Combination or Unknown','layers','Stains containing several important components, or stains that cannot be identified confidently.','{"Curry","Gravy","Lipstick","Shoe polish","Chocolate","Unknown yellow mark"}','Unknown stains must not receive speculative chemistry or universal treatment instructions.',NULL,false,12);

INSERT INTO public.stain_components (component_key, label, technical_only) VALUES
('water_soluble','Water-soluble material',false),('sugar','Sugar',false),('salt','Salt',false),('starch','Starch',false),
('oil','Oil',false),('grease','Grease',false),('wax','Wax',false),('protein','Protein',false),('tannin','Tannin',false),
('natural_dye','Natural dye',false),('synthetic_dye','Synthetic dye',false),('ink','Ink',false),('pigment','Pigment',false),
('particulate','Particulate matter',false),('resin','Resin',true),('adhesive','Adhesive',false),('polymer','Polymer',true),
('paint_binder','Paint binder',true),('metallic_oxide','Metallic oxide',true),('mineral','Mineral',false),
('biological_material','Biological material',false),('fragrance','Fragrance',false),('surfactant_residue','Surfactant residue',true),
('cosmetic_base','Cosmetic base',false),('unknown_component','Unknown component',false);

INSERT INTO public.stain_source_types (source_key, label, sort_order) VALUES
('food','Food',1),('beverage','Beverage',2),('cooking','Cooking',3),('body_fluid','Body fluid',4),
('perspiration','Perspiration and body soil',5),('cosmetic','Cosmetic',6),('personal_care','Personal care',7),
('medicine','Medicine',8),('ink_stationery','Ink and stationery',9),('paint_construction','Paint and construction',10),
('adhesive','Adhesive',11),('machinery','Machinery and automotive',12),('soil_outdoor','Soil and outdoor dirt',13),
('plant','Plant',14),('household_chemical','Household chemical',15),('laundry_chemical','Laundry chemical',16),
('metal','Metal',17),('water_mineral','Water and mineral',18),('mould_biological','Mould and biological',19),
('smoke_fire','Smoke and fire',20),('dye_transfer','Textile dye transfer',21),('unknown_source','Unknown source',22);

INSERT INTO public.classification_tags (tag_key, label, kind, raises_risk) VALUES
('fresh','Fresh','condition',NULL),('wet','Wet','condition',NULL),('damp','Damp','condition',NULL),
('dried','Dried','condition',NULL),('aged','Aged','condition','amber'),('heat_exposed','Heat exposed','condition','amber'),
('heat_set_possible','Heat-set possible','condition','amber'),('washed','Washed','condition',NULL),
('dry_cleaned','Dry cleaned','condition',NULL),('previously_spotted','Previously spotted','condition','amber'),
('repeatedly_treated','Repeatedly treated','condition','amber'),('oxidized_by_age','Oxidized by age','condition','amber'),
('hardened','Hardened','condition',NULL),('cured','Cured','condition','amber'),('polymerized','Polymerized','condition','amber'),
('spread','Spread','condition','amber'),('ring_formed','Ring formed','condition','amber'),
('penetrated_lining','Penetrated lining','condition','amber'),('crossed_multiple_colours','Crosses multiple colours','condition','amber'),
('unknown_age','Unknown age','condition',NULL),
('domestic_candidate','Domestic candidate','risk',NULL),('domestic_not_recommended','Domestic treatment not recommended','risk','amber'),
('professional_only','Professional only','risk','red'),('specialist_only','Specialist only','risk','red'),
('colourfastness_test_required','Colourfastness test required','risk','amber'),('hidden_test_required','Hidden test required','risk','amber'),
('heat_warning','Heat warning','risk','amber'),('biological_precaution','Biological precaution','risk','amber'),
('chemical_hazard','Chemical hazard','risk','black'),('unknown_chemical','Unknown chemical','risk','red'),
('delicate_fabric_risk','Delicate fabric risk','risk','amber'),('coating_risk','Coating risk','risk','red'),
('adhesive_risk','Adhesive risk','risk','red'),('embellishment_risk','Embellishment risk','risk','red'),
('metallic_thread_risk','Metallic thread risk','risk','red'),('dye_bleeding','Dye bleeding','risk','red'),
('dye_loss_possible','Dye loss possible','risk','red'),('fibre_damage_possible','Fibre damage possible','risk','red'),
('finish_damage_possible','Finish damage possible','risk','red'),('pigment_may_remain','Pigment may remain','risk',NULL),
('professional_referral_required','Professional referral required','risk','red'),('treatment_blocked','Treatment blocked','risk','black');

INSERT INTO public.damage_interpretations (damage_key, label, plain_description, is_stain, requires_professional, sort_order) VALUES
('removable_stain_likely','Removable stain likely','This looks like added material rather than damage to the fabric itself.',true,false,1),
('dye_loss_possible','Dye loss possible','Colour may have been removed from the fabric, which is not a stain.',false,true,2),
('fibre_damage_possible','Fibre damage possible','The fibres themselves may be weakened or altered.',false,true,3),
('heat_damage_possible','Heat damage possible','Scorching, shine or melting suggests heat damage.',false,true,4),
('chemical_damage_possible','Chemical damage possible','A chemical may have altered the fabric or its colour.',false,true,5),
('finish_damage_possible','Finish damage possible','The surface finish of the fabric may be affected.',false,true,6),
('coating_damage_possible','Coating damage possible','A coating or lamination may be lifting or breaking down.',false,true,7),
('adhesive_failure_possible','Adhesive failure possible','Glued construction or decoration may be failing.',false,true,8),
('combination_stain_and_damage','Combination of stain and damage','Both added material and fabric damage appear to be present.',true,true,9),
('insufficient_information','Insufficient information','There is not enough information to say whether this is a stain or damage.',false,true,10);

INSERT INTO public.category_migration_map (legacy_category, new_category_key, split_category_keys, tags_added, routed_to_damage, reason, reviewer_status) VALUES
('Combination Stains','combination_unknown','{}','{}',false,'Direct mapping. Components recorded individually.','pending_review'),
('Oil / Grease-Based Stains','oil_grease','{}','{}',false,'Direct mapping.','pending_review'),
('Water-Based Stains','water_soluble','{}','{}',false,'Mapped only after record-level review; many entries are tannin, protein or combination.','needs_manual_review'),
('Dye-Based / Tannin Stains',NULL,'{dye_ink,tannin_plant}','{}',false,'Records split between dye/ink and tannin/plant.','needs_manual_review'),
('Protein-Based Stains','protein','{}','{}',false,'Direct mapping.','pending_review'),
('Particulate (Solid) Stains','pigment_particulate','{}','{}',false,'Direct mapping.','pending_review'),
('Pigment / Paint Stains',NULL,'{pigment_particulate,paint_polymer}','{}',false,'Records split between pigment/particulate and paint/resin/polymer.','needs_manual_review'),
('Dye Transfer / Color Bleeding','dye_ink','{}','{dye_bleeding,crossed_multiple_colours}',false,'Dye transfer handled as a sub-type and tag inside dye/ink.','pending_review'),
('Oxidizable Stains','oxidizable','{}','{}',false,'Mapped only after technical review; otherwise kept in the original chemistry category.','needs_manual_review'),
('Heat-Set / Aged Stains',NULL,'{}','{aged,heat_exposed,heat_set_possible}',false,'Not a chemistry category. Records keep their chemistry category and receive condition tags.','needs_manual_review'),
('Reducible (Metal/Rust) Stains',NULL,'{metal_rust,reducible}','{}',false,'Rust and mineral records map to metal/rust; only technically reviewed records map to reducible.','needs_manual_review'),
('Chemical Stains / Fabric Damage',NULL,'{}','{}',true,'Not a stain category. Records route to the separate damage-diagnosis structure.','needs_manual_review');

CREATE INDEX idx_library_classifications_category ON public.stain_library_classifications(primary_category_key);
CREATE INDEX idx_library_classifications_status ON public.stain_library_classifications(approval_status);
CREATE INDEX idx_classification_components_classification ON public.stain_classification_components(classification_id);
CREATE INDEX idx_case_classifications_user ON public.case_classifications(user_id);