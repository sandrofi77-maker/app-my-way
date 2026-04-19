alter table if exists public.expenses
  add column if not exists paid_by_user_id uuid references auth.users(id) on delete set null;

create table if not exists public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  member_user_id uuid references auth.users(id) on delete set null,
  member_email text,
  amount numeric not null check (amount >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_expense_splits_trip_id on public.expense_splits(trip_id);
create index if not exists idx_expense_splits_expense_id on public.expense_splits(expense_id);
create index if not exists idx_expense_splits_member_user_id on public.expense_splits(member_user_id);

create or replace function public.update_expense_splits_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists expense_splits_updated_at on public.expense_splits;
create trigger expense_splits_updated_at
before update on public.expense_splits
for each row execute function public.update_expense_splits_updated_at();

alter table public.expense_splits enable row level security;

drop policy if exists "expense_splits_select" on public.expense_splits;
create policy "expense_splits_select" on public.expense_splits
for select using (public.user_can_access_trip(trip_id));

drop policy if exists "expense_splits_insert" on public.expense_splits;
create policy "expense_splits_insert" on public.expense_splits
for insert with check (public.user_can_edit_trip(trip_id));

drop policy if exists "expense_splits_update" on public.expense_splits;
create policy "expense_splits_update" on public.expense_splits
for update using (public.user_can_edit_trip(trip_id))
with check (public.user_can_edit_trip(trip_id));

drop policy if exists "expense_splits_delete" on public.expense_splits;
create policy "expense_splits_delete" on public.expense_splits
for delete using (public.user_can_edit_trip(trip_id));

create or replace function public.upsert_expense_with_split(
  p_trip_id uuid,
  p_expense jsonb,
  p_splits jsonb,
  p_editing_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_expense_id uuid;
  v_amount numeric;
  v_paid_by_user_id uuid;
  v_category text;
  v_currency text;
  v_description text;
  v_date date;
  v_image_url text;
  v_split_sum numeric := 0;
  v_split_count integer := 0;
  v_split jsonb;
  v_split_amount numeric;
  v_split_member_user_id uuid;
  v_split_member_email text;
begin
  if v_user_id is null then
    raise exception 'Sessao expirada';
  end if;

  if not public.user_can_edit_trip(p_trip_id) then
    raise exception 'Sem permissao para editar esta viagem' using errcode = '42501';
  end if;

  v_amount := coalesce((p_expense->>'amount')::numeric, 0);
  if v_amount <= 0 then
    raise exception 'Valor do gasto deve ser maior que zero';
  end if;

  v_category := coalesce(nullif(trim(p_expense->>'category'), ''), 'Outros');
  v_currency := coalesce(nullif(trim(p_expense->>'currency'), ''), 'R$');
  v_description := coalesce(p_expense->>'description', '');
  v_date := coalesce((p_expense->>'date')::date, current_date);
  v_image_url := nullif(p_expense->>'image_url', '');

  if coalesce(p_expense->>'paid_by_user_id', '') <> '' then
    v_paid_by_user_id := (p_expense->>'paid_by_user_id')::uuid;
  else
    v_paid_by_user_id := null;
  end if;

  if v_paid_by_user_id is not null then
    if not exists (
      select 1
      from public.trips t
      where t.id = p_trip_id
        and (
          t.owner_id = v_paid_by_user_id
          or exists (
            select 1
            from public.trip_members tm
            where tm.trip_id = p_trip_id
              and tm.user_id = v_paid_by_user_id
              and tm.status = 'accepted'
          )
        )
    ) then
      raise exception 'Pagador invalido para esta viagem';
    end if;
  end if;

  if p_editing_id is null then
    insert into public.expenses (
      trip_id,
      user_id,
      category,
      amount,
      currency,
      description,
      date,
      image_url,
      paid_by_user_id
    )
    values (
      p_trip_id,
      v_user_id,
      v_category,
      v_amount,
      v_currency,
      v_description,
      v_date,
      v_image_url,
      v_paid_by_user_id
    )
    returning id into v_expense_id;
  else
    update public.expenses
      set category = v_category,
          amount = v_amount,
          currency = v_currency,
          description = v_description,
          date = v_date,
          image_url = v_image_url,
          paid_by_user_id = v_paid_by_user_id
    where id = p_editing_id
      and trip_id = p_trip_id
    returning id into v_expense_id;

    if v_expense_id is null then
      raise exception 'Gasto nao encontrado para edicao';
    end if;

    delete from public.expense_splits where expense_id = v_expense_id;
  end if;

  if p_splits is null or jsonb_typeof(p_splits) <> 'array' then
    raise exception 'Lista de splits invalida';
  end if;

  for v_split in select value from jsonb_array_elements(p_splits) loop
    v_split_amount := coalesce((v_split->>'amount')::numeric, 0);
    if v_split_amount <= 0 then
      continue;
    end if;

    if coalesce(v_split->>'member_user_id', '') <> '' then
      v_split_member_user_id := (v_split->>'member_user_id')::uuid;
    else
      v_split_member_user_id := null;
    end if;

    v_split_member_email := nullif(trim(coalesce(v_split->>'member_email', '')), '');

    if v_split_member_user_id is null and v_split_member_email is null then
      raise exception 'Cada split precisa de member_user_id ou member_email';
    end if;

    insert into public.expense_splits (
      expense_id,
      trip_id,
      member_user_id,
      member_email,
      amount,
      notes
    )
    values (
      v_expense_id,
      p_trip_id,
      v_split_member_user_id,
      v_split_member_email,
      v_split_amount,
      nullif(v_split->>'notes', '')
    );

    v_split_sum := v_split_sum + v_split_amount;
    v_split_count := v_split_count + 1;
  end loop;

  if v_split_count = 0 then
    raise exception 'Informe ao menos um split com valor maior que zero';
  end if;

  if abs(v_split_sum - v_amount) > 0.01 then
    raise exception 'A soma dos splits deve ser igual ao valor total do gasto';
  end if;

  return v_expense_id;
end;
$$;
