-- Drop the existing policy
DROP POLICY "Users can manage their own orders" ON public.orders;

-- Create a new policy that allows any authenticated user to create orders
CREATE POLICY "Allow authenticated users to create orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (true);

-- Create a policy that allows users to view their own orders
CREATE POLICY "Allow users to view their own orders" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.order_items oi
      JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = public.orders.id
        AND p.user_id = auth.uid()
    )
  );
