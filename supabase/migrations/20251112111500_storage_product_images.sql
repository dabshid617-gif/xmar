-- Ensure storage bucket for product images exists and is public
-- Some projects may not have storage.create_bucket() available; fall back to direct upsert
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'product-images') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('product-images', 'product-images', true);
  ELSE
    UPDATE storage.buckets SET public = true WHERE name = 'product-images';
  END IF;
END $$;

-- Basic policies: public read; authenticated write
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read product images'
  ) THEN
    CREATE POLICY "Public read product images" ON storage.objects
      FOR SELECT
      USING (bucket_id = 'product-images');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated upload product images'
  ) THEN
    CREATE POLICY "Authenticated upload product images" ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated update product images'
  ) THEN
    CREATE POLICY "Authenticated update product images" ON storage.objects
      FOR UPDATE
      USING (bucket_id = 'product-images' AND auth.role() = 'authenticated')
      WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
  END IF;
END $$;
