-- Add company and contact fields to profiles so sellers can share business info
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_number TEXT;

