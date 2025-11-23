-- Align orders/order_items/payments RLS with smooth inserts from POS and product page
-- Adds created_by and policies that check ownership directly

-- Add created_by to orders for ownership checks
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS created_by UUID NOT NULL DEFAULT auth.uid();

-- Enable RLS (idempotent)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies if they exist
DROP POLICY IF EXISTS "Users can manage their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can manage their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can manage their own payments" ON public.payments;

-- Orders policies: ownership via created_by
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='orders' AND policyname='Orders select by owner'
  ) THEN
    CREATE POLICY "Orders select by owner" ON public.orders
      FOR SELECT USING (created_by = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='orders' AND policyname='Orders insert by owner'
  ) THEN
    CREATE POLICY "Orders insert by owner" ON public.orders
      FOR INSERT WITH CHECK (created_by = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='orders' AND policyname='Orders update by owner'
  ) THEN
    CREATE POLICY "Orders update by owner" ON public.orders
      FOR UPDATE USING (created_by = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='orders' AND policyname='Orders delete by owner'
  ) THEN
    CREATE POLICY "Orders delete by owner" ON public.orders
      FOR DELETE USING (created_by = auth.uid());
  END IF;
END $$;

-- Order items policies: owner via parent order
-- Payments policies: owner via parent order
-- Helper to avoid RLS recursion; runs as definer once
CREATE OR REPLACE FUNCTION public.is_order_owner(o_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = o_id AND o.created_by = auth.uid()
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_order_owner(uuid) TO authenticated, anon, service_role;

-- Recreate order_items and payments policies using the helper to avoid recursion
DROP POLICY IF EXISTS "Order items by order owner" ON public.order_items;
CREATE POLICY "Order items by order owner" ON public.order_items
  FOR ALL USING (public.is_order_owner(order_id));

DROP POLICY IF EXISTS "Payments by order owner" ON public.payments;
CREATE POLICY "Payments by order owner" ON public.payments
  FOR ALL USING (public.is_order_owner(order_id));
