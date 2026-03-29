create table if not exists public.flights (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  airline text not null,
  flight_number text not null,
  departure_airport text not null,
  arrival_airport text not null,
  departure_datetime timestamptz not null,
  arrival_datetime timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists flights_trip_id_idx on public.flights (trip_id);
create index if not exists flights_created_at_idx on public.flights (created_at desc);
create index if not exists flights_user_id_idx on public.flights (user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_flights_updated_at on public.flights;
create trigger set_flights_updated_at
before update on public.flights
for each row
execute function public.set_updated_at();

alter table public.flights enable row level security;

drop policy if exists "Flights select own trips" on public.flights;
create policy "Flights select own trips"
on public.flights
for select
to authenticated
using (
  exists (
    select 1
    from public.trips t
    where t.id = flights.trip_id
      and t.owner_id = auth.uid()
  )
);

drop policy if exists "Flights insert own trips" on public.flights;
create policy "Flights insert own trips"
on public.flights
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.trips t
    where t.id = flights.trip_id
      and t.owner_id = auth.uid()
  )
);

drop policy if exists "Flights update own trips" on public.flights;
create policy "Flights update own trips"
on public.flights
for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.trips t
    where t.id = flights.trip_id
      and t.owner_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.trips t
    where t.id = flights.trip_id
      and t.owner_id = auth.uid()
  )
);

drop policy if exists "Flights delete own trips" on public.flights;
create policy "Flights delete own trips"
on public.flights
for delete
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.trips t
    where t.id = flights.trip_id
      and t.owner_id = auth.uid()
  )
);
