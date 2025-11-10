-- Migration: Create subscriptions and payments tables
-- Created: 2025-01-08
-- Description: Tables for managing user subscriptions and payment records

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_code text not null,
  status text not null check (status in ('active', 'trialing', 'canceled', 'past_due', 'unpaid')),
  provider text not null default 'stripe' check (provider in ('stripe', 'mercadopago')),
  provider_subscription_id text,
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_user_id_plan_code_unique unique (user_id, plan_code) deferrable initially deferred
);

-- Índices para subscriptions
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);
create index if not exists subscriptions_provider_subscription_id_idx on public.subscriptions(provider_subscription_id);
create index if not exists subscriptions_current_period_end_idx on public.subscriptions(current_period_end);

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('stripe', 'mercadopago')),
  event_id text not null,
  amount_cents integer not null,
  currency text not null default 'BRL',
  status text not null check (status in ('pending', 'completed', 'failed', 'refunded')),
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_provider_event_id_unique unique (provider, event_id)
);

-- Índices para payments
create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists payments_provider_idx on public.payments(provider);
create index if not exists payments_event_id_idx on public.payments(event_id);
create index if not exists payments_status_idx on public.payments(status);
create index if not exists payments_created_at_idx on public.payments(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;

-- Políticas RLS: owner-only para subscriptions
create policy "Users can view their own subscriptions"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own subscriptions"
  on public.subscriptions
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own subscriptions"
  on public.subscriptions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own subscriptions"
  on public.subscriptions
  for delete
  using (auth.uid() = user_id);

-- Políticas RLS: owner-only para payments
create policy "Users can view their own payments"
  on public.payments
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own payments"
  on public.payments
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own payments"
  on public.payments
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role pode inserir/atualizar payments (para webhooks)
create policy "Service role can manage payments"
  on public.payments
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para atualizar updated_at em subscriptions
drop trigger if exists set_updated_at_subscriptions on public.subscriptions;
create trigger set_updated_at_subscriptions
  before update on public.subscriptions
  for each row
  execute function public.set_updated_at();

-- Trigger para atualizar updated_at em payments
drop trigger if exists set_updated_at_payments on public.payments;
create trigger set_updated_at_payments
  before update on public.payments
  for each row
  execute function public.set_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

comment on table public.subscriptions is 'User subscription records for billing plans';
comment on table public.payments is 'Payment transaction records from payment providers';
comment on column public.subscriptions.plan_code is 'Plan identifier (e.g., free, premium_monthly, premium_yearly)';
comment on column public.subscriptions.provider_subscription_id is 'External subscription ID from payment provider';
comment on column public.payments.event_id is 'Unique event ID from payment provider (for idempotency)';
comment on column public.payments.amount_cents is 'Payment amount in cents (e.g., 1000 = R$ 10.00)';

