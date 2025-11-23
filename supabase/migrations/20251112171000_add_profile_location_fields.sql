-- Add profile location fields and display preference
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_location BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_name TEXT;

-- RLS already allows users to update their own profile via existing policy
-- "Users can update own profile" so no extra policy is needed here.

