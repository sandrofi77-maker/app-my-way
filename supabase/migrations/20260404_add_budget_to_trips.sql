-- Adiciona campos de orçamento na tabela trips
alter table public.trips
  add column if not exists budget numeric,
  add column if not exists budget_currency text default 'R$';
