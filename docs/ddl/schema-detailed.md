# DDL Detalhada — Schema do Banco de Dados Arcanum AI

**Data:** 2025-01-08  
**Versão:** 1.0  
**Banco:** PostgreSQL (Supabase)

---

## Visão Geral

Este documento descreve em detalhes todas as tabelas, índices, constraints, triggers, RPCs e views do banco de dados Arcanum AI.

---

## Tabelas Principais

### 1. `profiles`

**Descrição:** Perfis de usuários (1:1 com `auth.users`)

**Estrutura:**
```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  username text NOT NULL,
  avatar_url text,
  brand_voice jsonb, -- Voz da marca (tone, style, examples, preferences)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT profiles_username_unique UNIQUE (lower(username))
);
```

**Índices:**
- `profiles_username_lower_idx` - Índice único funcional em `lower(username)`

**Triggers:**
- `set_updated_at_profiles` - Atualiza `updated_at` automaticamente
- `handle_new_user` - Cria perfil automaticamente ao criar usuário

**RLS:**
- Owner-only (usuário só acessa seu próprio perfil)
- VIEW `public_profiles` expõe apenas `username` e `avatar_url` (sem PII)

---

### 2. `projects`

**Descrição:** Projetos de usuários (agrupamento lógico de assets e transformations)

**Estrutura:**
```sql
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

**Índices:**
- `projects_user_id_idx` - Por `user_id` (consultas por usuário)
- `projects_created_at_idx` - Por `created_at` (ordenação)

**Triggers:**
- `set_updated_at_projects` - Atualiza `updated_at` automaticamente

**RLS:**
- Owner-only (usuário só acessa seus próprios projetos)

---

### 3. `assets`

**Descrição:** Assets de conteúdo (texto, áudio, vídeo)

**Estrutura:**
```sql
CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  storage_path text NOT NULL,
  type public.asset_type NOT NULL, -- 'text', 'audio', 'video'
  size_bytes bigint,
  duration_seconds numeric(10, 2),
  mimetype text,
  status public.asset_status DEFAULT 'uploading' NOT NULL, -- 'uploading', 'ready', 'processing', 'failed'
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

**Enums:**
- `asset_type`: 'text', 'audio', 'video'
- `asset_status`: 'uploading', 'ready', 'processing', 'failed'

**Índices:**
- `assets_project_id_idx` - Por `project_id`
- `assets_user_id_idx` - Por `user_id`
- `assets_status_idx` - Por `status`

**Triggers:**
- `set_updated_at_assets` - Atualiza `updated_at` automaticamente

**RLS:**
- Owner-only (usuário só acessa seus próprios assets)

---

### 4. `transcriptions`

**Descrição:** Jobs de transcrição de áudio/vídeo

**Estrutura:**
```sql
CREATE TABLE public.transcriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  language text DEFAULT 'pt' NOT NULL,
  status public.transcription_status DEFAULT 'queued' NOT NULL, -- 'queued', 'processing', 'completed', 'failed'
  text text,
  error text,
  job_id text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

**Enums:**
- `transcription_status`: 'queued', 'processing', 'completed', 'failed'

**Índices:**
- `transcriptions_asset_id_idx` - Por `asset_id`
- `transcriptions_user_id_idx` - Por `user_id`
- `transcriptions_status_idx` - Por `status`

**Triggers:**
- `set_updated_at_transcriptions` - Atualiza `updated_at` automaticamente

**RLS:**
- Owner-only (usuário só acessa suas próprias transcrições)

---

### 5. `transformations`

**Descrição:** Jobs de transformação de conteúdo

**Estrutura:**
```sql
CREATE TABLE public.transformations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  source_asset_id uuid REFERENCES public.assets(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type public.transformation_type NOT NULL, -- 'text_to_post', 'text_to_resumo', 'text_to_newsletter', 'text_to_roteiro'
  params jsonb NOT NULL DEFAULT '{}', -- Parâmetros da transformação
  outputs jsonb, -- Resultados (text, variants)
  status public.transformation_status DEFAULT 'queued' NOT NULL, -- 'queued', 'processing', 'completed', 'failed'
  error text,
  cost_credits numeric(10, 2) DEFAULT 0,
  idempotency_key text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT transformations_idempotency UNIQUE (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL
);
```

**Enums:**
- `transformation_type`: 'text_to_post', 'text_to_resumo', 'text_to_newsletter', 'text_to_roteiro'
- `transformation_status`: 'queued', 'processing', 'completed', 'failed'

**Índices:**
- `transformations_project_id_idx` - Por `project_id`
- `transformations_user_id_idx` - Por `user_id`
- `transformations_status_idx` - Por `status`
- `transformations_idempotency_key_idx` - Por `idempotency_key` (único)

**Triggers:**
- `set_updated_at_transformations` - Atualiza `updated_at` automaticamente

**RLS:**
- Owner-only (usuário só acessa suas próprias transformações)

---

### 6. `credits`

**Descrição:** Saldo de créditos por usuário

**Estrutura:**
```sql
CREATE TABLE public.credits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric(10, 2) DEFAULT 0 NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT credits_balance_non_negative CHECK (balance >= 0)
);
```

**Triggers:**
- `set_updated_at_credits` - Atualiza `updated_at` automaticamente
- `apply_credit_transaction` - Atualiza `balance` automaticamente ao inserir em `credit_transactions`

**RLS:**
- Owner-only (usuário só lê seu próprio saldo)
- Usuário não pode inserir/atualizar diretamente (apenas via RPC/Edge)

---

### 7. `credit_transactions`

**Descrição:** Ledger de transações de créditos (imutável)

**Estrutura:**
```sql
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  delta numeric(10, 2) NOT NULL, -- Positivo = crédito, Negativo = débito
  reason text NOT NULL,
  ref_type public.credit_ref_type NOT NULL, -- 'transformation', 'transcription', 'purchase', 'refund', etc.
  ref_id uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT credit_transactions_idempotency UNIQUE (user_id, ref_type, ref_id)
);
```

**Enums:**
- `credit_ref_type`: 'transformation', 'transcription', 'purchase', 'refund', 'test', 'manual'

**Índices:**
- `credit_transactions_user_id_idx` - Por `user_id`
- `credit_transactions_user_id_created_at_idx` - Por `user_id, created_at DESC`
- `credit_transactions_ref_idx` - Por `ref_type, ref_id`

**Triggers:**
- `apply_credit_transaction_trigger` - Atualiza `credits.balance` automaticamente

**RLS:**
- Owner-only (usuário só lê suas próprias transações)
- Usuário não pode inserir diretamente (apenas via RPC/Edge)

---

### 8. `subscriptions`

**Descrição:** Assinaturas de usuários

**Estrutura:**
```sql
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_code text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'trialing', 'canceled', 'past_due', 'unpaid')),
  provider text NOT NULL DEFAULT 'stripe' CHECK (provider IN ('stripe', 'mercadopago')),
  provider_subscription_id text,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT subscriptions_user_id_plan_code_unique UNIQUE (user_id, plan_code) DEFERRABLE INITIALLY DEFERRED
);
```

**Índices:**
- `subscriptions_user_id_idx` - Por `user_id`
- `subscriptions_status_idx` - Por `status`
- `subscriptions_provider_subscription_id_idx` - Por `provider_subscription_id`
- `subscriptions_current_period_end_idx` - Por `current_period_end`

**Triggers:**
- `set_updated_at_subscriptions` - Atualiza `updated_at` automaticamente

**RLS:**
- Owner-only (usuário só acessa suas próprias assinaturas)

---

### 9. `payments`

**Descrição:** Registros de pagamentos

**Estrutura:**
```sql
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL CHECK (provider IN ('stripe', 'mercadopago')),
  event_id text NOT NULL,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  status text NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT payments_provider_event_id_unique UNIQUE (provider, event_id)
);
```

**Índices:**
- `payments_user_id_idx` - Por `user_id`
- `payments_provider_idx` - Por `provider`
- `payments_event_id_idx` - Por `event_id` (idempotência)
- `payments_status_idx` - Por `status`
- `payments_created_at_idx` - Por `created_at`

**Triggers:**
- `set_updated_at_payments` - Atualiza `updated_at` automaticamente

**RLS:**
- Owner-only (usuário só acessa seus próprios pagamentos)
- Service role pode inserir/atualizar (para webhooks)

---

### 10. `notifications`

**Descrição:** Notificações de usuários

**Estrutura:**
```sql
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('job_completed', 'job_failed', 'credits_debited', 'credits_credited', 'payment_completed', 'subscription_updated', 'system')),
  payload jsonb NOT NULL DEFAULT '{}',
  read_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

**Índices:**
- `notifications_user_id_idx` - Por `user_id`
- `notifications_read_at_idx` - Por `read_at`
- `notifications_created_at_idx` - Por `created_at`
- `notifications_user_unread_idx` - Por `user_id, read_at` WHERE `read_at IS NULL`

**Triggers:**
- `set_updated_at_notifications` - Atualiza `updated_at` automaticamente

**RLS:**
- Owner-only (usuário só acessa suas próprias notificações)
- Service role pode inserir (para Edge Functions)

**Realtime:**
- Habilitado via `ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;`

---

### 11. `user_roles`

**Descrição:** Roles de usuários (RBAC)

**Estrutura:**
```sql
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  
  UNIQUE (user_id, role)
);
```

**Enums:**
- `app_role`: 'user', 'admin', 'moderator'

**RLS:**
- Owner-only

---

### 12. `protection_settings`

**Descrição:** Configurações de proteção de conteúdo por usuário

**Estrutura:**
```sql
CREATE TABLE public.protection_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  auto_moderation boolean DEFAULT true,
  offensive_filter boolean DEFAULT true,
  brand_verification boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Triggers:**
- `set_updated_at_protection` - Atualiza `updated_at` automaticamente

**RLS:**
- Owner-only

---

## Views

### `public_profiles`

**Descrição:** VIEW pública controlada (apenas campos não-PII)

```sql
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT username, avatar_url 
FROM public.profiles 
WHERE username IS NOT NULL;
```

**RLS:**
- Leitura pública permitida (sem autenticação)
- Apenas campos seguros expostos (sem email, id, full_name)

---

## Funções e RPCs

### `set_updated_at()`

**Descrição:** Função utilitária para atualizar `updated_at` automaticamente

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

---

### `apply_credit_transaction()`

**Descrição:** Atualiza saldo de créditos ao inserir transação

```sql
CREATE OR REPLACE FUNCTION public.apply_credit_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance numeric(10, 2);
  new_balance numeric(10, 2);
BEGIN
  -- Obter saldo atual (ou criar se não existir)
  SELECT balance INTO current_balance
  FROM public.credits
  WHERE user_id = NEW.user_id;
  
  IF current_balance IS NULL THEN
    current_balance := 0;
    INSERT INTO public.credits (user_id, balance)
    VALUES (NEW.user_id, 0);
  END IF;
  
  -- Calcular novo saldo
  new_balance := current_balance + NEW.delta;
  
  -- Validar saldo não negativo
  IF new_balance < 0 THEN
    RAISE EXCEPTION 'Saldo insuficiente. Saldo atual: %, Tentativa de débito: %', current_balance, NEW.delta;
  END IF;
  
  -- Atualizar saldo
  UPDATE public.credits
  SET balance = new_balance
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;
```

**Trigger:**
- `apply_credit_transaction_trigger` - Executa após INSERT em `credit_transactions`

---

### `handle_new_user()`

**Descrição:** Cria perfil automaticamente ao criar usuário

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username text;
  final_username text;
  counter integer := 0;
BEGIN
  -- Gerar username baseado em email ou ID
  base_username := lower(split_part(NEW.email, '@', 1));
  base_username := regexp_replace(base_username, '[^a-z0-9_]', '', 'g');
  
  -- Garantir username único
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(final_username)) LOOP
    counter := counter + 1;
    final_username := base_username || '_' || counter;
  END LOOP;
  
  -- Criar perfil
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (NEW.id, final_username, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'));
  
  -- Criar role padrão
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Criar configurações de proteção padrão
  INSERT INTO public.protection_settings (user_id)
  VALUES (NEW.id);
  
  -- Criar registro de créditos inicial
  INSERT INTO public.credits (user_id, balance)
  VALUES (NEW.id, 0);
  
  RETURN NEW;
END;
$$;
```

**Trigger:**
- `on_auth_user_created` - Executa após INSERT em `auth.users`

---

### `auth_username_available(p_username text)`

**Descrição:** Verifica se username está disponível

```sql
CREATE OR REPLACE FUNCTION public.auth_username_available(p_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE lower(username) = lower(p_username)
  );
END;
$$;
```

---

### `username_suggest(base_name text)`

**Descrição:** Sugere username único baseado em nome base

```sql
CREATE OR REPLACE FUNCTION public.username_suggest(base_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized text;
  suggestion text;
  counter integer := 0;
BEGIN
  -- Normalizar nome base
  normalized := lower(regexp_replace(base_name, '[^a-z0-9_]', '', 'g'));
  
  -- Tentar nome base primeiro
  suggestion := normalized;
  
  -- Se não disponível, adicionar sufixo numérico
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(suggestion)) LOOP
    counter := counter + 1;
    suggestion := normalized || '_' || counter;
  END LOOP;
  
  RETURN suggestion;
END;
$$;
```

---

## Storage Buckets

### `text`

**Descrição:** Bucket para arquivos de texto

**Políticas RLS:**
- Owner-only (usuário só acessa seus próprios arquivos)
- Upload: usuário autenticado pode fazer upload em `{user_id}/{project_id}/*`
- Download: usuário autenticado pode baixar seus próprios arquivos

---

### `audio`

**Descrição:** Bucket para arquivos de áudio

**Políticas RLS:**
- Owner-only
- Upload: usuário autenticado pode fazer upload em `{user_id}/{project_id}/*`
- Download: usuário autenticado pode baixar seus próprios arquivos

---

### `video`

**Descrição:** Bucket para arquivos de vídeo

**Políticas RLS:**
- Owner-only
- Upload: usuário autenticado pode fazer upload em `{user_id}/{project_id}/*`
- Download: usuário autenticado pode baixar seus próprios arquivos

---

## Diagrama ER (Texto)

```
auth.users (1) ──┬── (1) profiles
                 │
                 ├── (1) credits
                 ├── (N) user_roles
                 ├── (1) protection_settings
                 ├── (N) projects
                 │         └── (N) assets
                 │         │     └── (N) transcriptions
                 │         └── (N) transformations
                 ├── (N) credit_transactions
                 ├── (N) subscriptions
                 ├── (N) payments
                 └── (N) notifications
```

---

## Índices Compostos Recomendados

### Para Performance de Consultas:

1. **Dashboard de usuário:**
   - `(user_id, created_at DESC)` em `projects`, `transformations`, `transcriptions`

2. **Notificações não lidas:**
   - `(user_id, read_at)` WHERE `read_at IS NULL` em `notifications`

3. **Histórico de créditos:**
   - `(user_id, created_at DESC)` em `credit_transactions`

---

## Políticas de Retenção

### Dados Temporários:
- **Jobs falhados:** Manter por 30 dias
- **Assets órfãos:** Limpar após 90 dias sem referência
- **Notificações lidas:** Manter por 90 dias

### Dados Permanentes:
- **Profiles:** Permanente (até exclusão de conta)
- **Projects:** Permanente (até exclusão de conta)
- **Credit Transactions:** Permanente (auditoria)
- **Payments:** Permanente (auditoria)

---

## Migrações Aplicadas

1. `20251107004523_ec5576e6-e595-48df-9134-3ac989392c10.sql` - Perfis, roles, protection_settings
2. `20251107021500_auth_username_profiles.sql` - Username, VIEW pública, RPCs
3. `20250108000000_create_projects.sql` - Projetos
4. `20250108000001_create_assets.sql` - Assets
5. `20250108000002_create_transcriptions.sql` - Transcrições
6. `20250108000003_create_transformations.sql` - Transformações
7. `20250108000004_create_credits_ledger.sql` - Créditos e ledger
8. `20250108000005_create_storage_buckets.sql` - Buckets de Storage
9. `20250108000006_create_subscriptions_and_payments.sql` - Assinaturas e pagamentos
10. `20250108000007_add_brand_voice_to_profiles.sql` - Brand voice
11. `20250108000008_create_notifications.sql` - Notificações

---

**Última Atualização:** 2025-01-08

