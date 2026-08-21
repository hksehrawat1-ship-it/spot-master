ALTER VIEW public.legacy_table_replacements SET (security_invoker = on);

REVOKE ALL ON FUNCTION public.product_version_publication_readiness(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.product_version_publication_readiness(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.guidance_mapping_publication_readiness(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.guidance_mapping_publication_readiness(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.product_guidance_available(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.product_guidance_available(uuid, uuid) TO authenticated;