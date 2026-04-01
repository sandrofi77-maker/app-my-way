-- Ensure check_in_date and check_out_date exist on accommodations
-- (fixes PostgREST schema cache issue when ALTER TABLE migration was not applied)

ALTER TABLE public.accommodations
  ADD COLUMN IF NOT EXISTS check_in_date date,
  ADD COLUMN IF NOT EXISTS check_out_date date;
