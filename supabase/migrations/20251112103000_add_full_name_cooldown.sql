-- Track when the profile full name was last updated so we can enforce a 7-day cooldown
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name_changed_at TIMESTAMPTZ;

