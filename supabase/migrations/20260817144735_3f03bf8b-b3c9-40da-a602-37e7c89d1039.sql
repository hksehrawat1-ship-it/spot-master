-- STEP 15 — content governance, review and version control (additive, reversible)

CREATE TABLE IF NOT EXISTS public.governance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stable_id TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  title TEXT NOT NULL,
  current_version TEXT NOT NULL DEFAULT '1.0',
  status TEXT NOT NULL DEFAULT 'draft',
  owner_id UUID,
  author_id UUID,
  technical_reviewer_id UUID,
  safety_reviewer_id UUID,
  country_reviewer_id UUID,
  translation_reviewer_id UUID,
  source_document_ids TEXT[] NOT NULL DEFAULT '{}',
  countries TEXT[] NOT NULL DEFAULT '{}',
  language TEXT NOT NULL DEFAULT 'en',
  risk_level TEXT NOT NULL DEFAULT 'amber',
  provisional BOOLEAN NOT NULL DEFAULT false,
  domestic_confidence INTEGER,
  recommendation_count INTEGER,
  schedule_kind TEXT NOT NULL DEFAULT 'risk_based',
  review_interval_days INTEGER,
  reason_for_change TEXT,
  revision_summary TEXT,
  approval_notes TEXT,
  suspension_reason TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  superseded_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.governance_records TO authenticated;
GRANT ALL ON public.governance_records TO service_role;
ALTER TABLE public.governance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Maintainers read governance records" ON public.governance_records
  FOR SELECT TO authenticated USING (public.is_content_maintainer(auth.uid()));
CREATE POLICY "Maintainers write governance records" ON public.governance_records
  FOR INSERT TO authenticated WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE POLICY "Maintainers update governance records" ON public.governance_records
  FOR UPDATE TO authenticated USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_governance_records_updated BEFORE UPDATE ON public.governance_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.governance_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_stable_id TEXT NOT NULL REFERENCES public.governance_records(stable_id) ON DELETE RESTRICT,
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  reason_for_change TEXT,
  revision_summary TEXT,
  approval_notes TEXT,
  change_kinds TEXT[] NOT NULL DEFAULT '{}',
  signatures JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_document_ids TEXT[] NOT NULL DEFAULT '{}',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  immutable BOOLEAN NOT NULL DEFAULT false,
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (record_stable_id, version)
);
GRANT SELECT, INSERT, UPDATE ON public.governance_versions TO authenticated;
GRANT ALL ON public.governance_versions TO service_role;
ALTER TABLE public.governance_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Maintainers read governance versions" ON public.governance_versions
  FOR SELECT TO authenticated USING (public.is_content_maintainer(auth.uid()));
CREATE POLICY "Maintainers insert governance versions" ON public.governance_versions
  FOR INSERT TO authenticated WITH CHECK (public.is_content_maintainer(auth.uid()));
-- Approved (immutable) versions can never be modified.
CREATE POLICY "Maintainers update mutable versions" ON public.governance_versions
  FOR UPDATE TO authenticated USING (public.is_content_maintainer(auth.uid()) AND immutable = false)
  WITH CHECK (public.is_content_maintainer(auth.uid()));

CREATE TABLE IF NOT EXISTS public.governance_review_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id TEXT NOT NULL UNIQUE,
  record_stable_id TEXT NOT NULL REFERENCES public.governance_records(stable_id) ON DELETE RESTRICT,
  version TEXT NOT NULL,
  review_type TEXT NOT NULL,
  assigned_reviewer UUID,
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'normal',
  risk TEXT,
  required_documents TEXT[] NOT NULL DEFAULT '{}',
  checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
  comments TEXT,
  decision TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.governance_review_tasks TO authenticated;
GRANT ALL ON public.governance_review_tasks TO service_role;
ALTER TABLE public.governance_review_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Maintainers read review tasks" ON public.governance_review_tasks
  FOR SELECT TO authenticated USING (public.is_content_maintainer(auth.uid()));
CREATE POLICY "Maintainers manage review tasks" ON public.governance_review_tasks
  FOR INSERT TO authenticated WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE POLICY "Maintainers update review tasks" ON public.governance_review_tasks
  FOR UPDATE TO authenticated USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_governance_tasks_updated BEFORE UPDATE ON public.governance_review_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.governance_change_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  reporter_id UUID,
  evidence TEXT,
  assigned_owner UUID,
  status TEXT NOT NULL DEFAULT 'open',
  resolution TEXT,
  linked_record_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.governance_change_requests TO authenticated;
GRANT ALL ON public.governance_change_requests TO service_role;
ALTER TABLE public.governance_change_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users create change requests" ON public.governance_change_requests
  FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid() OR public.is_content_maintainer(auth.uid()));
CREATE POLICY "Reporters and maintainers read change requests" ON public.governance_change_requests
  FOR SELECT TO authenticated USING (reporter_id = auth.uid() OR public.is_content_maintainer(auth.uid()));
CREATE POLICY "Maintainers update change requests" ON public.governance_change_requests
  FOR UPDATE TO authenticated USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_governance_requests_updated BEFORE UPDATE ON public.governance_change_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.governance_releases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  release_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  kind TEXT NOT NULL DEFAULT 'content',
  record_ids TEXT[] NOT NULL DEFAULT '{}',
  countries TEXT[] NOT NULL DEFAULT '{}',
  languages TEXT[] NOT NULL DEFAULT '{}',
  scheduled_date DATE,
  owner_id UUID,
  validation_passed BOOLEAN NOT NULL DEFAULT false,
  validation_issues TEXT[] NOT NULL DEFAULT '{}',
  approved_by UUID,
  deployment TEXT NOT NULL DEFAULT 'pending',
  rollback_plan TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.governance_releases TO authenticated;
GRANT ALL ON public.governance_releases TO service_role;
ALTER TABLE public.governance_releases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Maintainers read releases" ON public.governance_releases
  FOR SELECT TO authenticated USING (public.is_content_maintainer(auth.uid()));
CREATE POLICY "Maintainers create releases" ON public.governance_releases
  FOR INSERT TO authenticated WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE POLICY "Maintainers update releases" ON public.governance_releases
  FOR UPDATE TO authenticated USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_governance_releases_updated BEFORE UPDATE ON public.governance_releases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.governance_case_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id TEXT NOT NULL,
  record_stable_id TEXT NOT NULL,
  version TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.governance_case_snapshots TO authenticated;
GRANT ALL ON public.governance_case_snapshots TO service_role;
ALTER TABLE public.governance_case_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Maintainers read case snapshots" ON public.governance_case_snapshots
  FOR SELECT TO authenticated USING (public.is_content_maintainer(auth.uid()));
CREATE POLICY "Authenticated pin case snapshots" ON public.governance_case_snapshots
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.governance_findings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id TEXT,
  kind TEXT NOT NULL,
  record_stable_id TEXT NOT NULL,
  detail TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  assigned_role TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.governance_findings TO authenticated;
GRANT ALL ON public.governance_findings TO service_role;
ALTER TABLE public.governance_findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Maintainers read findings" ON public.governance_findings
  FOR SELECT TO authenticated USING (public.is_content_maintainer(auth.uid()));
CREATE POLICY "Maintainers create findings" ON public.governance_findings
  FOR INSERT TO authenticated WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE POLICY "Maintainers update findings" ON public.governance_findings
  FOR UPDATE TO authenticated USING (public.is_content_maintainer(auth.uid()))
  WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE TRIGGER trg_governance_findings_updated BEFORE UPDATE ON public.governance_findings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.governance_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind TEXT NOT NULL,
  record_stable_id TEXT,
  recipient_id UUID,
  message TEXT NOT NULL,
  critical BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.governance_notifications TO authenticated;
GRANT ALL ON public.governance_notifications TO service_role;
ALTER TABLE public.governance_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recipients read notifications" ON public.governance_notifications
  FOR SELECT TO authenticated USING (recipient_id = auth.uid() OR public.is_content_maintainer(auth.uid()));
CREATE POLICY "Maintainers create notifications" ON public.governance_notifications
  FOR INSERT TO authenticated WITH CHECK (public.is_content_maintainer(auth.uid()));
CREATE POLICY "Recipients mark notifications read" ON public.governance_notifications
  FOR UPDATE TO authenticated USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.governance_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID,
  actor_role TEXT,
  action TEXT NOT NULL,
  record_stable_id TEXT,
  version TEXT,
  previous_value TEXT,
  new_value TEXT,
  reason TEXT,
  source TEXT,
  organization TEXT,
  country TEXT,
  approval_impact BOOLEAN NOT NULL DEFAULT false,
  session_meta TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Append only: no UPDATE or DELETE privilege for application users.
GRANT SELECT, INSERT ON public.governance_audit_log TO authenticated;
GRANT SELECT, INSERT ON public.governance_audit_log TO service_role;
ALTER TABLE public.governance_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Maintainers read governance audit" ON public.governance_audit_log
  FOR SELECT TO authenticated USING (public.is_content_maintainer(auth.uid()));
CREATE POLICY "Authenticated append governance audit" ON public.governance_audit_log
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_gov_records_status ON public.governance_records(status);
CREATE INDEX IF NOT EXISTS idx_gov_records_type ON public.governance_records(content_type);
CREATE INDEX IF NOT EXISTS idx_gov_records_review ON public.governance_records(next_review_at);
CREATE INDEX IF NOT EXISTS idx_gov_versions_record ON public.governance_versions(record_stable_id);
CREATE INDEX IF NOT EXISTS idx_gov_tasks_record ON public.governance_review_tasks(record_stable_id);
CREATE INDEX IF NOT EXISTS idx_gov_snapshots_record ON public.governance_case_snapshots(record_stable_id);
CREATE INDEX IF NOT EXISTS idx_gov_audit_record ON public.governance_audit_log(record_stable_id);