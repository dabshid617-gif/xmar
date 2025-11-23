-- Receipt customization settings per seller profile
DO $$ BEGIN
  PERFORM 1 FROM pg_extension WHERE extname = 'pgcrypto';
  IF NOT FOUND THEN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.receipt_settings (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  footer_note TEXT,
  show_order_number BOOLEAN DEFAULT true,
  theme TEXT DEFAULT 'light',
  accent_color TEXT,
  paper_width_mm INT DEFAULT 80,
  include_tax BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.receipt_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='receipt_settings' AND policyname='Receipt settings are viewable by owner'
  ) THEN
    CREATE POLICY "Receipt settings are viewable by owner" ON public.receipt_settings
      FOR SELECT USING (auth.uid() = profile_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='receipt_settings' AND policyname='Owner can upsert receipt settings'
  ) THEN
    CREATE POLICY "Owner can upsert receipt settings" ON public.receipt_settings
      FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
  END IF;
END $$;
