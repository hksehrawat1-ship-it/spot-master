REVOKE ALL ON FUNCTION public.product_publicly_releasable(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.product_version_releasable(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.source_document_releasable(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.product_publicly_releasable(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.product_version_releasable(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.source_document_releasable(uuid) TO authenticated, service_role;