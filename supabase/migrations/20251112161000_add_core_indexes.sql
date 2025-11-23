-- Core indexes for receipts and orders pages
CREATE INDEX IF NOT EXISTS idx_orders_customer_created ON public.orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);

