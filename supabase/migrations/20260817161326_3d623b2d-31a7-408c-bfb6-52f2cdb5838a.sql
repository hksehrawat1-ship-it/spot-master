CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feature text NOT NULL DEFAULT 'stain_analysis',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_usage_log_user_created_idx ON public.ai_usage_log (user_id, created_at DESC);

GRANT ALL ON public.ai_usage_log TO service_role;
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles));
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_any_role(_user_id, ARRAY['owner','administrator','system_admin']::app_role[]);
$$;

CREATE OR REPLACE FUNCTION public.can_publish_content(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_any_role(_user_id, ARRAY['owner','administrator','system_admin','content_admin']::app_role[]);
$$;

CREATE POLICY "Signed-in users record their own admin actions"
ON public.admin_audit_log FOR INSERT TO authenticated
WITH CHECK (actor_id = auth.uid());

CREATE POLICY "Admins and auditors read the admin audit log"
ON public.admin_audit_log FOR SELECT TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['owner','administrator','system_admin','auditor']::app_role[]));

CREATE OR REPLACE FUNCTION public.ensure_default_role()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  SELECT auth.uid(), 'domestic_user'::app_role
  WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid());
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_default_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_default_role() TO authenticated;