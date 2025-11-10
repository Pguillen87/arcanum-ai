-- Migration: Create notifications table
-- Created: 2025-01-08
-- Description: Table for managing user notifications with Realtime support

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('job_completed', 'job_failed', 'credits_debited', 'credits_credited', 'payment_completed', 'subscription_updated', 'system')),
  payload jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para notifications
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_read_at_idx on public.notifications(read_at);
create index if not exists notifications_created_at_idx on public.notifications(created_at);
create index if not exists notifications_user_unread_idx on public.notifications(user_id, read_at) where read_at is null;

-- Habilitar RLS
alter table public.notifications enable row level security;

-- Políticas RLS: owner-only
create policy "Users can view their own notifications"
  on public.notifications
  for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own notifications"
  on public.notifications
  for delete
  using (auth.uid() = user_id);

-- Service role pode inserir notificações (para Edge Functions)
create policy "Service role can insert notifications"
  on public.notifications
  for insert
  with check (auth.role() = 'service_role');

-- Trigger para atualizar updated_at
drop trigger if exists set_updated_at_notifications on public.notifications;
create trigger set_updated_at_notifications
  before update on public.notifications
  for each row
  execute function public.set_updated_at();

-- Habilitar Realtime para notifications
alter publication supabase_realtime add table public.notifications;

-- Comentários
comment on table public.notifications is 'User notifications for jobs, credits, payments, and system events';
comment on column public.notifications.type is 'Type of notification (job_completed, credits_debited, etc.)';
comment on column public.notifications.payload is 'Notification data (job_id, amount, etc.)';
comment on column public.notifications.read_at is 'Timestamp when notification was read (null = unread)';

