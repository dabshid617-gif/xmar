-- Reviews on products; aggregated per seller profile
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='Reviews are viewable by everyone')
  THEN
    CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
  END IF;
END $$;

-- Authenticated users can create reviews for any product
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='Users can create reviews')
  THEN
    CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
  END IF;
END $$;

-- Reviewers can update/delete their own reviews
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='Users can update own reviews')
  THEN
    CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = reviewer_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='Users can delete own reviews')
  THEN
    CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = reviewer_id);
  END IF;
END $$;

-- View aggregating reviews per seller profile (owner of the product)
CREATE OR REPLACE VIEW public.profile_reviews AS
SELECT
  p.user_id AS profile_id,
  ROUND(AVG(r.rating)::numeric, 2) AS avg_rating,
  COUNT(r.id)::int AS review_count
FROM public.reviews r
JOIN public.products p ON p.id = r.product_id
GROUP BY p.user_id;

