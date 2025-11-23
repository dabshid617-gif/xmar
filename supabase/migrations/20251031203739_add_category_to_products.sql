-- Add category and subcategory columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- Update RLS policies to include new columns
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create own products" ON public.products;
CREATE POLICY "Users can create own products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own products" ON public.products;
CREATE POLICY "Users can update own products"
  ON public.products FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own products" ON public.products;
CREATE POLICY "Users can delete own products"
  ON public.products FOR DELETE
  USING (auth.uid() = user_id);