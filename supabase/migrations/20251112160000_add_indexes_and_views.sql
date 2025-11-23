-- Performance indexes for analytics tables
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_created ON public.profile_views(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_views_product_created ON public.product_views(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cart_adds_product_created ON public.product_cart_adds(product_id, created_at DESC);

-- Tailored view to fetch product views for the current seller's products
-- Note: relies on products being viewable (existing policy) and uses auth.uid() in view.
CREATE OR REPLACE VIEW public.my_product_views AS
SELECT
  pv.created_at,
  pv.viewer_id,
  p.id AS product_id,
  p.title AS product_title,
  p.user_id AS seller_id
FROM public.product_views pv
JOIN public.products p ON p.id = pv.product_id
WHERE p.user_id = auth.uid();

