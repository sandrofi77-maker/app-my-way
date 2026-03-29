alter table if exists public.expenses
  add column if not exists image_url text;
