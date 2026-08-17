CREATE POLICY "Users read own garment photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'garment-assessments' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_content_maintainer(auth.uid())));

CREATE POLICY "Users upload own garment photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'garment-assessments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own garment photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'garment-assessments' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'garment-assessments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own garment photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'garment-assessments' AND auth.uid()::text = (storage.foldername(name))[1]);