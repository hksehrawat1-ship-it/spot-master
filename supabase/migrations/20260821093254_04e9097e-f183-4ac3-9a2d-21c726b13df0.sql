
ALTER TABLE public.product_source_documents
  DROP CONSTRAINT product_source_documents_document_role_check;

ALTER TABLE public.product_source_documents
  ADD CONSTRAINT product_source_documents_document_role_check
  CHECK (document_role = ANY (ARRAY[
    'manufacturer_label','manufacturer_tds','manufacturer_sds','manufacturer_spotting_chart',
    'manufacturer_brochure','distributor_guide','training_guide','internal_gilm_guide',
    'regulatory_source','superseded_document']));
