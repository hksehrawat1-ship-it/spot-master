REVOKE ALL ON FUNCTION public.log_content_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_domestic_confidence() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_content_maintainer(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_content_maintainer(uuid) TO authenticated, service_role;