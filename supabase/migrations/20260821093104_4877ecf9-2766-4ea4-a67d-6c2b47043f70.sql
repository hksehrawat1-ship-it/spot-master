
ALTER TABLE public.source_documents
  ADD COLUMN IF NOT EXISTS source_role text,
  ADD COLUMN IF NOT EXISTS printed_identifier text,
  ADD COLUMN IF NOT EXISTS currentness text;

CREATE UNIQUE INDEX IF NOT EXISTS source_documents_file_hash_key
  ON public.source_documents (file_hash) WHERE file_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS product_source_documents_unique_link
  ON public.product_source_documents (product_id, product_version_id, source_document_id, document_role);

CREATE UNIQUE INDEX IF NOT EXISTS product_manufacturer_claims_unique_claim
  ON public.product_manufacturer_claims (product_version_id, claimed_stain, source_document_id);

CREATE UNIQUE INDEX IF NOT EXISTS product_guidance_mappings_mapping_ref_key
  ON public.product_guidance_mappings (mapping_ref);

CREATE TABLE IF NOT EXISTS public.product_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.professional_products(id) ON DELETE CASCADE,
  product_version_id uuid NOT NULL REFERENCES public.product_versions(id) ON DELETE CASCADE,
  source_document_id uuid REFERENCES public.source_documents(id),
  page_reference text,
  rule_kind text NOT NULL,
  condition_key text NOT NULL,
  severity text NOT NULL,
  statement text NOT NULL,
  operator_override_allowed boolean NOT NULL DEFAULT false,
  verification_status public.verification_status NOT NULL DEFAULT 'pending_review',
  provisional boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_restrictions_rule_kind_check
    CHECK (rule_kind IN ('hidden_test','stop','warning')),
  CONSTRAINT product_restrictions_severity_check
    CHECK (severity IN ('required_test','stop','warning'))
);

CREATE UNIQUE INDEX IF NOT EXISTS product_restrictions_unique_rule
  ON public.product_restrictions (product_version_id, condition_key);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_restrictions TO authenticated;
GRANT ALL ON public.product_restrictions TO service_role;

ALTER TABLE public.product_restrictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Maintainers manage product restrictions"
  ON public.product_restrictions FOR ALL TO authenticated
  USING (public.is_product_maintainer(auth.uid()))
  WITH CHECK (public.is_product_maintainer(auth.uid()));

CREATE POLICY "Professionals read released product restrictions"
  ON public.product_restrictions FOR SELECT TO authenticated
  USING (
    public.can_read_professional_guidance(auth.uid())
    AND public.product_version_releasable(product_version_id)
    AND verification_status = 'verified'
    AND provisional = false
  );

CREATE TRIGGER trg_product_restrictions_updated
  BEFORE UPDATE ON public.product_restrictions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
