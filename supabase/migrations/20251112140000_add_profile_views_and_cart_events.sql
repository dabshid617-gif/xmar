-- Track profile views and product add-to-cart events
DO $$ BEGIN
  PERFORM 1 FROM pg_extension WHERE extname = 'pgcrypto';
  IF NOT FOUND THEN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewer_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert/select views (analytics)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profile_views' AND policyname='Profile views are viewable by everyone')
  THEN
    CREATE POLICY "Profile views are viewable by everyone" ON public.profile_views FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profile_views' AND policyname='Anyone can insert profile views')
  THEN
    CREATE POLICY "Anyone can insert profile views" ON public.profile_views FOR INSERT WITH CHECK (true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.product_cart_adds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_cart_adds ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='product_cart_adds' AND policyname='Cart adds are viewable by everyone')
  THEN
    CREATE POLICY "Cart adds are viewable by everyone" ON public.product_cart_adds FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='product_cart_adds' AND policyname='Anyone can insert cart adds')
  THEN
    CREATE POLICY "Anyone can insert cart adds" ON public.product_cart_adds FOR INSERT WITH CHECK (true);
  END IF;
END $$;

