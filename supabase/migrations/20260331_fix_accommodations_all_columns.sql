-- Ensure ALL accommodations columns exist (fixes schema cache issues)
-- Uses ADD COLUMN IF NOT EXISTS so existing data is preserved

ALTER TABLE public.accommodations
  ADD COLUMN IF NOT EXISTS link text,
  ADD COLUMN IF NOT EXISTS check_in_date date,
  ADD COLUMN IF NOT EXISTS check_out_date date,
  ADD COLUMN IF NOT EXISTS check_in_time text,
  ADD COLUMN IF NOT EXISTS check_out_time text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS image_url text;

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
