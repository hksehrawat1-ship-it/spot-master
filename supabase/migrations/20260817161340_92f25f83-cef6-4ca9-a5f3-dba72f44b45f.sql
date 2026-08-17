REVOKE ALL ON FUNCTION public.has_any_role(uuid, app_role[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_platform_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.can_publish_content(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_publish_content(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.ensure_default_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_default_role() TO authenticated;