-- Ensure itinerary_items has all expected columns used by the app
alter table public.itinerary_items
  add column if not exists date date,
  add column if not exists time text,
  add column if not exists location text,
  add column if not exists description text;

create index if not exists itinerary_items_date_idx on public.itinerary_items (date);
