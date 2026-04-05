create table if not exists public.trip_checklists (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  is_done boolean not null default false,
  category text not null default 'outros',
  created_at timestamptz not null default now()
);

create index if not exists trip_checklists_trip_id_idx on public.trip_checklists (trip_id);
create index if not exists trip_checklists_user_id_idx on public.trip_checklists (user_id);

alter table public.trip_checklists enable row level security;

drop policy if exists "Checklists select own trips" on public.trip_checklists;
create policy "Checklists select own trips"
on public.trip_checklists
for select
to authenticated
using (
  exists (
    select 1 from public.trips t
    where t.id = trip_checklists.trip_id
      and t.owner_id = auth.uid()
  )
);

drop policy if exists "Checklists insert own trips" on public.trip_checklists;
create policy "Checklists insert own trips"
on public.trip_checklists
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.trips t
    where t.id = trip_checklists.trip_id
      and t.owner_id = auth.uid()
  )
);

drop policy if exists "Checklists update own trips" on public.trip_checklists;
create policy "Checklists update own trips"
on public.trip_checklists
for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1 from public.trips t
    where t.id = trip_checklists.trip_id
      and t.owner_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.trips t
    where t.id = trip_checklists.trip_id
      and t.owner_id = auth.uid()
  )
);

drop policy if exists "Checklists delete own trips" on public.trip_checklists;
create policy "Checklists delete own trips"
on public.trip_checklists
for delete
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1 from public.trips t
    where t.id = trip_checklists.trip_id
      and t.owner_id = auth.uid()
  )
);
