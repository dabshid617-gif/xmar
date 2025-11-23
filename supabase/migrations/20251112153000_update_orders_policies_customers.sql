-- Allow customers to view their own orders and items
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='orders' AND policyname='Customers can view their orders'
  ) THEN
    CREATE POLICY "Customers can view their orders" ON public.orders
      FOR SELECT USING (auth.uid() = customer_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='order_items' AND policyname='Customers can view their order items'
  ) THEN
    CREATE POLICY "Customers can view their order items" ON public.order_items
      FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid()
      ));
  END IF;
END $$;

