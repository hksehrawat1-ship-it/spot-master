CREATE TABLE public.stain_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  fabric TEXT,
  colour TEXT,
  stain_source TEXT,
  stain_age TEXT,
  notes TEXT,
  image_path TEXT,
  model TEXT,
  result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.stain_analyses TO authenticated;
GRANT ALL ON public.stain_analyses TO service_role;

ALTER TABLE public.stain_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stain analyses"
  ON public.stain_analyses FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stain analyses"
  ON public.stain_analyses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stain analyses"
  ON public.stain_analyses FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_stain_analyses_user_created ON public.stain_analyses (user_id, created_at DESC);

CREATE TRIGGER trg_stain_analyses_updated
  BEFORE UPDATE ON public.stain_analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();