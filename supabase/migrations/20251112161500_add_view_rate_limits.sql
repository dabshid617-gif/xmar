-- View rate limits / dedupe
--
-- Explanation:
-- In Postgres, expression indexes require only IMMUTABLE functions. For TIMESTAMPTZ,
-- functions like extract(), date_trunc(), timezone(), to_char(), etc. are marked STABLE,
-- so an expression index such as extract(epoch from created_at)/86400 fails with 42P17.
--
-- Solution:
-- Store the UTC day bucket in a dedicated column kept in sync by a trigger, and build
-- the unique index on that stored column. This avoids non-immutable expressions in the index.

-- Clean up any previously-attempted index names (harmless if they never existed)
DROP INDEX IF EXISTS uniq_product_views_day;
DROP INDEX IF EXISTS uniq_profile_views_day;

-- Add day bucket columns (UTC)
ALTER TABLE public.product_views
  ADD COLUMN IF NOT EXISTS view_day_utc DATE;

ALTER TABLE public.profile_views
  ADD COLUMN IF NOT EXISTS view_day_utc DATE;

-- Backfill existing rows
UPDATE public.product_views
SET view_day_utc = timezone('utc', created_at)::date
WHERE view_day_utc IS NULL;

UPDATE public.profile_views
SET view_day_utc = timezone('utc', created_at)::date
WHERE view_day_utc IS NULL;

-- Ensure not-null after backfill
ALTER TABLE public.product_views
  ALTER COLUMN view_day_utc SET NOT NULL;

ALTER TABLE public.profile_views
  ALTER COLUMN view_day_utc SET NOT NULL;

-- Trigger function to maintain buckets from created_at
CREATE OR REPLACE FUNCTION public.set_view_day_utc()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.view_day_utc := timezone('utc', NEW.created_at)::date;
  RETURN NEW;
END;
$$;

-- Triggers for product_views
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_product_views_set_view_day_utc'
  ) THEN
    CREATE TRIGGER trg_product_views_set_view_day_utc
    BEFORE INSERT OR UPDATE OF created_at ON public.product_views
    FOR EACH ROW EXECUTE FUNCTION public.set_view_day_utc();
  END IF;
END $$;

-- Triggers for profile_views
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_profile_views_set_view_day_utc'
  ) THEN
    CREATE TRIGGER trg_profile_views_set_view_day_utc
    BEFORE INSERT OR UPDATE OF created_at ON public.profile_views
    FOR EACH ROW EXECUTE FUNCTION public.set_view_day_utc();
  END IF;
END $$;

-- Unique indexes using stored day buckets
CREATE UNIQUE INDEX IF NOT EXISTS uniq_product_views_day
  ON public.product_views (
    product_id,
    viewer_id,
    view_day_utc
  );

CREATE UNIQUE INDEX IF NOT EXISTS uniq_profile_views_day
  ON public.profile_views (
    profile_id,
    viewer_id,
    view_day_utc
  );
