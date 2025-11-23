-- Track product page views
DO $$ BEGIN
  PERFORM 1 FROM pg_extension WHERE extname = 'pgcrypto';
  IF NOT FOUND THEN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  viewer_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='product_views' AND policyname='Product views are viewable by everyone'
  ) THEN
    CREATE POLICY "Product views are viewable by everyone" ON public.product_views FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='product_views' AND policyname='Anyone can insert product views'
  ) THEN
    CREATE POLICY "Anyone can insert product views" ON public.product_views FOR INSERT WITH CHECK (true);
  END IF;
END $$;

