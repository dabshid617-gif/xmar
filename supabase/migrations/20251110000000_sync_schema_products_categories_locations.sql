-- Create categories and locations lookup tables and align products schema
-- Idempotent guards to avoid errors if re-applied

-- Enable pgcrypto for gen_random_uuid if not enabled
DO $$ BEGIN
  PERFORM 1 FROM pg_extension WHERE extname = 'pgcrypto';
  IF NOT FOUND THEN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  END IF;
END $$;

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  -- view policy for everyone
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Categories are viewable by everyone'
  ) THEN
    CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
  END IF;
END $$;

-- Locations
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'locations' AND policyname = 'Locations are viewable by everyone'
  ) THEN
    CREATE POLICY "Locations are viewable by everyone" ON public.locations FOR SELECT USING (true);
  END IF;
END $$;

-- Products: add foreign keys to categories and locations (nullable)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS location TEXT; -- keep simple text for search/backfill

-- Optional backfill: create categories from existing products.category text
INSERT INTO public.categories (name)
SELECT DISTINCT category FROM public.products
WHERE category IS NOT NULL AND category <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.categories c WHERE c.name = public.products.category
  );

-- Link products.category_id from matching categories.name
UPDATE public.products p
SET category_id = c.id
FROM public.categories c
WHERE p.category_id IS NULL AND p.category IS NOT NULL AND c.name = p.category;

-- RLS: keep products policies; no change needed here beyond FKs

-- Note: app code should switch to use category_id/location_id and join to names.

