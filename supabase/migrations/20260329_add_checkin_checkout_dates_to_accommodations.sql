alter table if exists public.accommodations
  add column if not exists check_in_date date,
  add column if not exists check_out_date date;
