CREATE TABLE public.variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variants are viewable by everyone"
  ON public.variants FOR SELECT
  USING (true);

CREATE POLICY "Users can create variants for their own products"
  ON public.variants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE id = product_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update variants for their own products"
  ON public.variants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE id = product_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete variants for their own products"
  ON public.variants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE id = product_id AND user_id = auth.uid()
    )
  );
