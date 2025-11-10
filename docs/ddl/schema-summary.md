# Resumo do Schema - Arcanum AI

## Visão Geral

Este documento fornece um resumo do schema do banco de dados Arcanum AI.

## Tabelas Principais

### Autenticação e Perfis
- **profiles**: Perfis de usuário (1:1 com auth.users)
  - Campos: id, username, full_name, avatar_url, brand_voice, created_at, updated_at
  - RLS: owner-only

### Projetos e Assets
- **projects**: Projetos de usuários
  - Campos: id, user_id, name, description, created_at, updated_at
  - RLS: owner-only
  
- **assets**: Arquivos de mídia (texto, áudio, vídeo)
  - Campos: id, project_id, user_id, storage_path, type, size_bytes, duration_seconds, mimetype, status, created_at
  - RLS: owner-only
  - Tipos: text, audio, video

### Processamento
- **transcriptions**: Jobs de transcrição
  - Campos: id, asset_id, user_id, language, status, text, error, job_id, created_at, updated_at
  - RLS: owner-only
  - Status: queued, processing, completed, failed
  
- **transformations**: Jobs de transformação
  - Campos: id, project_id, source_asset_id, user_id, type, params (jsonb), outputs (jsonb), status, error, cost_credits, idempotency_key, created_at, updated_at
  - RLS: owner-only
  - Tipos: post, resumo, newsletter, roteiro, video_short
  - Status: queued, processing, completed, failed

### Créditos e Pagamentos
- **credits**: Saldo de créditos por usuário
  - Campos: user_id (PK), balance, updated_at
  - RLS: owner-only
  
- **credit_transactions**: Ledger de transações de crédito
  - Campos: id, user_id, delta, reason, ref_type, ref_id, created_at
  - RLS: owner-only
  - Idempotência: unique(user_id, ref_type, ref_id)
  
- **payments**: Registros de pagamentos
  - Campos: id, user_id, provider, provider_payment_id, event_id, amount_cents, currency, status, metadata, created_at, updated_at
  - RLS: owner-only
  - Idempotência: unique(provider, event_id)
  
- **subscriptions**: Assinaturas de usuários
  - Campos: id, user_id, plan_code, status, current_period_start, current_period_end, cancel_at_period_end, provider_subscription_id, metadata, created_at, updated_at
  - RLS: owner-only

## Views

- **public_profiles**: VIEW pública com apenas username e avatar_url (sem PII)

## Funções RPC

- **auth_username_available(p_username)**: Verifica disponibilidade de username
- **username_suggest(base_name)**: Sugere username único
- **default_username(_id)**: Gera username padrão para novo usuário
- **dashboard_stats()**: Retorna estatísticas do dashboard do usuário

## Triggers

- **handle_new_user()**: Cria perfil ao registrar usuário
- **apply_credit_transaction()**: Atualiza saldo ao inserir transação
- **set_updated_at()**: Atualiza updated_at em todas as tabelas

## Enums

- **asset_type**: text, audio, video
- **asset_status**: uploading, processing, ready, failed
- **transcription_status**: queued, processing, completed, failed
- **transformation_type**: post, resumo, newsletter, roteiro, video_short
- **transformation_status**: queued, processing, completed, failed
- **credit_ref_type**: transformation, transcription, video_short, purchase, refund, bonus
- **subscription_status**: active, canceled, past_due, trialing, paused
- **payment_status**: pending, approved, rejected, refunded, failed
- **payment_provider**: stripe, mp

## Índices Críticos

Todos os índices necessários estão implementados:
- Índices em user_id para todas as tabelas
- Índices compostos para consultas frequentes (user_id + status, user_id + created_at)
- Índices GIN para busca em JSONB
- Índices únicos para idempotência

## Políticas RLS

Todas as tabelas têm RLS habilitado com políticas owner-only:
- SELECT: apenas próprio user_id
- INSERT: apenas próprio user_id
- UPDATE: apenas próprio user_id
- DELETE: apenas próprio user_id

## Migrations

Todas as migrations estão em `supabase/migrations/`:
- 20250108000000_create_projects.sql
- 20250108000001_create_assets.sql
- 20250108000002_create_transcriptions.sql
- 20250108000003_create_transformations.sql
- 20250108000004_create_credits_ledger.sql
- 20250108000005_create_storage_buckets.sql
- create_subscriptions_and_payments
- create_retention_policies

