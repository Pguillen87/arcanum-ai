-- Migration: Criar sistema de créditos (ledger)
-- Sistema justo: cobra apenas após entrega concluída
begin;

-- Criar enum para tipo de referência (para idempotência)
create type public.credit_ref_type as enum ('transformation', 'transcription', 'video_short', 'purchase', 'refund', 'bonus');

-- Criar tabela credits (saldo por usuário)
create table if not exists public.credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance numeric(10, 2) default 0 not null,
  updated_at timestamptz default now() not null,
  
  constraint credits_balance_non_negative check (balance >= 0)
);

-- Criar tabela credit_transactions (ledger)
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  delta numeric(10, 2) not null,
  reason text not null,
  ref_type public.credit_ref_type not null,
  ref_id uuid,
  created_at timestamptz default now() not null,
  
  -- Idempotência: mesmo ref_type + ref_id não pode ser duplicado
  constraint credit_transactions_idempotency unique (user_id, ref_type, ref_id)
);

-- Habilitar RLS
alter table public.credits enable row level security;
alter table public.credit_transactions enable row level security;

-- Políticas RLS: owner-only
create policy credits_select_owner
  on public.credits for select
  to authenticated
  using (auth.uid() = user_id);

create policy credits_update_owner
  on public.credits for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy credit_transactions_select_owner
  on public.credit_transactions for select
  to authenticated
  using (auth.uid() = user_id);

create policy credit_transactions_insert_owner
  on public.credit_transactions for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Índices para performance
create index if not exists credit_transactions_user_id_idx on public.credit_transactions(user_id);
create index if not exists credit_transactions_user_id_created_at_idx on public.credit_transactions(user_id, created_at desc);
create index if not exists credit_transactions_ref_idx on public.credit_transactions(ref_type, ref_id) where ref_id is not null;

-- Trigger para atualizar updated_at em credits
drop trigger if exists set_updated_at_credits on public.credits;
create trigger set_updated_at_credits
  before update on public.credits
  for each row
  execute function public.set_updated_at();

-- Função: aplicar transação de crédito (atualizar saldo)
create or replace function public.apply_credit_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_balance numeric(10, 2);
  new_balance numeric(10, 2);
begin
  -- Obter saldo atual (ou criar se não existir)
  select balance into current_balance
  from public.credits
  where user_id = new.user_id;
  
  if current_balance is null then
    -- Primeira transação: criar registro
    insert into public.credits (user_id, balance)
    values (new.user_id, 0)
    on conflict (user_id) do nothing;
    current_balance := 0;
  end if;
  
  -- Calcular novo saldo
  new_balance := current_balance + new.delta;
  
  -- Validar: saldo não pode ficar negativo
  if new_balance < 0 then
    raise exception 'Saldo insuficiente. Saldo atual: %, tentativa de débito: %', current_balance, abs(new.delta);
  end if;
  
  -- Atualizar saldo
  update public.credits
  set balance = new_balance,
      updated_at = now()
  where user_id = new.user_id;
  
  return new;
end;
$$;

-- Trigger: aplicar transação ao inserir credit_transactions
drop trigger if exists apply_credit_transaction_trigger on public.credit_transactions;
create trigger apply_credit_transaction_trigger
  after insert on public.credit_transactions
  for each row
  execute function public.apply_credit_transaction();

commit;

