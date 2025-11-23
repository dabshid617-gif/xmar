-- Tighten view insert policies to authenticated users only
-- Product views: only authenticated can insert and must set viewer_id = auth.uid()
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='product_views' AND policyname='Anyone can insert product views'
  ) THEN
    DROP POLICY "Anyone can insert product views" ON public.product_views;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='product_views' AND policyname='Authenticated can insert product views'
  ) THEN
    CREATE POLICY "Authenticated can insert product views" ON public.product_views
      FOR INSERT TO authenticated
      WITH CHECK (viewer_id = auth.uid());
  END IF;
END $$;

-- Profile views: only authenticated can insert and must set viewer_id = auth.uid()
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profile_views' AND policyname='Anyone can insert profile views'
  ) THEN
    DROP POLICY "Anyone can insert profile views" ON public.profile_views;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profile_views' AND policyname='Authenticated can insert profile views'
  ) THEN
    CREATE POLICY "Authenticated can insert profile views" ON public.profile_views
      FOR INSERT TO authenticated
      WITH CHECK (viewer_id = auth.uid());
  END IF;
END $$;

