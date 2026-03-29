create table if not exists public.accommodations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  location text not null,
  link text,
  check_in_time text,
  check_out_time text,
  description text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists accommodations_trip_id_idx on public.accommodations (trip_id);
create index if not exists accommodations_created_at_idx on public.accommodations (created_at desc);
create index if not exists accommodations_user_id_idx on public.accommodations (user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_accommodations_updated_at on public.accommodations;
create trigger set_accommodations_updated_at
before update on public.accommodations
for each row
execute function public.set_updated_at();

alter table public.accommodations enable row level security;

drop policy if exists "Accommodations select own trips" on public.accommodations;
create policy "Accommodations select own trips"
on public.accommodations
for select
to authenticated
using (
  exists (
    select 1
    from public.trips t
    where t.id = accommodations.trip_id
      and t.owner_id = auth.uid()
  )
);

drop policy if exists "Accommodations insert own trips" on public.accommodations;
create policy "Accommodations insert own trips"
on public.accommodations
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.trips t
    where t.id = accommodations.trip_id
      and t.owner_id = auth.uid()
  )
);

drop policy if exists "Accommodations update own trips" on public.accommodations;
create policy "Accommodations update own trips"
on public.accommodations
for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.trips t
    where t.id = accommodations.trip_id
      and t.owner_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.trips t
    where t.id = accommodations.trip_id
      and t.owner_id = auth.uid()
  )
);

drop policy if exists "Accommodations delete own trips" on public.accommodations;
create policy "Accommodations delete own trips"
on public.accommodations
for delete
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.trips t
    where t.id = accommodations.trip_id
      and t.owner_id = auth.uid()
  )
);
