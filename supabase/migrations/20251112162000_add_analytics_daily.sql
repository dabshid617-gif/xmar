-- Daily rollups table and refresh function (seller-centric)
DO $$ BEGIN
  PERFORM 1 FROM pg_extension WHERE extname = 'pgcrypto';
  IF NOT FOUND THEN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.analytics_daily (
  day DATE NOT NULL,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  PRIMARY KEY (day, seller_id, metric)
);

ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='analytics_daily' AND policyname='Seller can view own rollups') THEN
    CREATE POLICY "Seller can view own rollups" ON public.analytics_daily FOR SELECT USING (auth.uid() = seller_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.refresh_daily_rollups(p_day DATE)
RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
  d DATE := COALESCE(p_day, CURRENT_DATE);
BEGIN
  -- For each seller with activity on day d, compute rollups
  -- Profile views
  INSERT INTO public.analytics_daily(day, seller_id, metric, value)
  SELECT d as day, pv.profile_id as seller_id, 'profile_views' as metric, COUNT(*)::numeric
  FROM public.profile_views pv
  WHERE pv.created_at >= d AND pv.created_at < d + INTERVAL '1 day'
  GROUP BY pv.profile_id
  ON CONFLICT (day, seller_id, metric) DO UPDATE SET value = EXCLUDED.value;

  -- Product views per seller
  INSERT INTO public.analytics_daily(day, seller_id, metric, value)
  SELECT d as day, p.user_id as seller_id, 'product_views' as metric, COUNT(*)::numeric
  FROM public.product_views v
  JOIN public.products p ON p.id = v.product_id
  WHERE v.created_at >= d AND v.created_at < d + INTERVAL '1 day'
  GROUP BY p.user_id
  ON CONFLICT (day, seller_id, metric) DO UPDATE SET value = EXCLUDED.value;

  -- Orders count per seller (orders having at least one item from seller)
  INSERT INTO public.analytics_daily(day, seller_id, metric, value)
  SELECT d as day, p.user_id as seller_id, 'orders_count' as metric, COUNT(DISTINCT o.id)::numeric
  FROM public.orders o
  JOIN public.order_items oi ON oi.order_id = o.id
  JOIN public.products p ON p.id = oi.product_id
  WHERE o.created_at >= d AND o.created_at < d + INTERVAL '1 day'
  GROUP BY p.user_id
  ON CONFLICT (day, seller_id, metric) DO UPDATE SET value = EXCLUDED.value;

  -- Revenue total per seller
  INSERT INTO public.analytics_daily(day, seller_id, metric, value)
  SELECT d as day, p.user_id as seller_id, 'revenue_total' as metric, COALESCE(SUM(o.total),0)::numeric
  FROM public.orders o
  JOIN public.order_items oi ON oi.order_id = o.id
  JOIN public.products p ON p.id = oi.product_id
  WHERE o.created_at >= d AND o.created_at < d + INTERVAL '1 day'
  GROUP BY p.user_id
  ON CONFLICT (day, seller_id, metric) DO UPDATE SET value = EXCLUDED.value;
END;
$$;

