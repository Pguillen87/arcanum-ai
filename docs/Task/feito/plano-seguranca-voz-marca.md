# Plano de Segurança: Módulo "Voz da Marca"

**Data:** 2025-01-XX  
**Autor:** Arquitetura de Segurança Arcanum AI  
**Baseado em:** Plano técnico + Melhorias identificadas + Padrões do projeto

---

## 📋 Resumo Executivo

Este documento apresenta um plano abrangente de segurança para o módulo "Voz da Marca", cobrindo autenticação, autorização, validação de dados, proteção de informações sensíveis, rate limiting, auditoria e conformidade com padrões de segurança estabelecidos no projeto Arcanum AI.

---

## 🎯 Objetivos de Segurança

1. **Proteção de Dados Sensíveis:** Embeddings, samples textuais e configurações de voz
2. **Prevenção de Abuso:** Rate limiting e validação de limites por plano
3. **Isolamento de Dados:** RLS policies garantindo acesso apenas aos próprios dados
4. **Auditoria Completa:** Logs estruturados sem PII para rastreabilidade
5. **Validação Robusta:** Prevenção de injection attacks e dados maliciosos
6. **Proteção de APIs:** Autenticação forte e validação de tokens

---

## 🔒 Categorias de Segurança

### 1. Autenticação e Autorização

#### 1.1 Validação de Autenticação em Edge Functions

**Problema Identificado:**
- Edge Functions devem validar autenticação em todas as requisições
- Tokens JWT devem ser verificados antes de processar

**Solução:**

```typescript
// src/utils/auth.ts (novo arquivo ou expandir existente)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export interface AuthResult {
  userId: string;
  email?: string;
  plan: 'free' | 'premium';
  isValid: boolean;
}

export async function validateAuth(
  authHeader: string | null
): Promise<AuthResult> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token de autenticação ausente ou inválido');
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Criar cliente Supabase com service role para validar token
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Verificar token e obter usuário
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Token inválido ou expirado');
  }

  // Obter plano do usuário
  const plan = await getUserPlan(user.id);

  return {
    userId: user.id,
    email: user.email,
    plan,
    isValid: true,
  };
}

// Helper para validar em Edge Functions
export async function requireAuth(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  
  try {
    return await validateAuth(authHeader);
  } catch (error: any) {
    throw new Error(`Autenticação falhou: ${error.message}`);
  }
}
```

**Uso em Edge Functions:**

```typescript
// supabase/functions/brand_voice_train/index.ts

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { requireAuth } from '@/utils/auth.ts';

serve(async (req: Request) => {
  try {
    // Validar autenticação ANTES de processar
    const auth = await requireAuth(req);
    
    if (!auth.isValid) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    // ... resto do processamento
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

#### 1.2 Row Level Security (RLS) Policies

**Problema Identificado:**
- Tabelas `brand_profiles`, `brand_samples`, `brand_embeddings` precisam de RLS
- Usuários só podem acessar seus próprios dados

**Solução:**

```sql
-- RLS para brand_profiles
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas seus próprios perfis
CREATE POLICY "Users can view own brand profiles"
  ON brand_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Usuários podem criar apenas para si mesmos
CREATE POLICY "Users can insert own brand profiles"
  ON brand_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem atualizar apenas seus próprios perfis
CREATE POLICY "Users can update own brand profiles"
  ON brand_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem deletar apenas seus próprios perfis
CREATE POLICY "Users can delete own brand profiles"
  ON brand_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- RLS para brand_samples
ALTER TABLE brand_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand samples"
  ON brand_samples FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand samples"
  ON brand_samples FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand samples"
  ON brand_samples FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand samples"
  ON brand_samples FOR DELETE
  USING (auth.uid() = user_id);

-- RLS para brand_embeddings
ALTER TABLE brand_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand embeddings"
  ON brand_embeddings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand embeddings"
  ON brand_embeddings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand embeddings"
  ON brand_embeddings FOR DELETE
  USING (auth.uid() = user_id);

-- IMPORTANTE: brand_embeddings não deve ter UPDATE (imutável)
-- Embeddings são regenerados, não atualizados
```

#### 1.3 Validação de Ownership

**Problema Identificado:**
- Edge Functions devem validar que `brandProfileId` pertence ao usuário
- Prevenir acesso não autorizado a vozes de outros usuários

**Solução:**

```typescript
// src/utils/ownership.ts (novo arquivo)

export async function validateBrandProfileOwnership(
  userId: string,
  brandProfileId: string
): Promise<boolean> {
  const { data, error } = await admin
    .from('brand_profiles')
    .select('id')
    .eq('id', brandProfileId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

// Uso em Edge Functions
async function transformWithBrandVoice(params: TransformParams, userId: string) {
  // Validar ownership ANTES de processar
  const isOwner = await validateBrandProfileOwnership(userId, params.brandProfileId);
  
  if (!isOwner) {
    throw new Error('Perfil de voz não encontrado ou acesso negado');
  }

  // ... continuar processamento
}
```

---

### 2. Validação e Sanitização de Entradas

#### 2.1 Validação com Zod (Já Proposta)

**Implementação Segura:**

```typescript
// src/schemas/brandVoice.ts (expandir com validações de segurança)

import { z } from 'zod';

// Sanitizar strings para prevenir XSS
const sanitizeString = (str: string): string => {
  return str
    .trim()
    .replace(/[<>]/g, '') // Remover tags HTML básicas
    .slice(0, 10000); // Limitar tamanho máximo
};

// Schema com sanitização
export const BrandVoiceSchema = z.object({
  tone: z.string()
    .max(100)
    .transform(sanitizeString)
    .optional(),
  style: z.string()
    .max(100)
    .transform(sanitizeString)
    .optional(),
  examples: z.array(
    z.string()
      .min(50)
      .max(10000)
      .transform(sanitizeString)
  )
    .max(50) // Limite máximo de exemplos
    .optional(),
  preferences: z.object({
    length: z.enum(['short', 'medium', 'long']).optional(),
    formality: z.enum(['formal', 'neutral', 'casual']).optional(),
    creativity: z.enum(['low', 'medium', 'high']).optional(),
  }).optional(),
});

export const TrainBrandVoiceRequestSchema = z.object({
  brandProfileId: z.string().uuid().optional(),
  name: z.string()
    .min(1)
    .max(100)
    .transform(sanitizeString),
  description: z.string()
    .max(500)
    .transform(sanitizeString)
    .optional(),
  samples: z.array(
    z.string()
      .min(50)
      .max(10000)
      .transform(sanitizeString)
  )
    .min(3)
    .max(50),
  isDefault: z.boolean().optional(),
  modelProvider: z.enum(['openai', 'anthropic']).optional(),
  modelName: z.string()
    .max(100)
    .transform(sanitizeString)
    .optional(),
});

export const TransformWithBrandVoiceRequestSchema = z.object({
  brandProfileId: z.string().uuid(),
  inputText: z.string()
    .min(10)
    .max(50000)
    .transform(sanitizeString),
  transformationType: z.enum(['post', 'resumo', 'newsletter', 'roteiro']),
  tone: z.string()
    .max(100)
    .transform(sanitizeString)
    .optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  useSimilaritySearch: z.boolean().optional().default(true),
  similarityThreshold: z.number()
    .min(0)
    .max(1)
    .optional()
    .default(0.7),
  maxSimilarChunks: z.number()
    .min(1)
    .max(20)
    .optional()
    .default(5),
});
```

#### 2.2 Prevenção de SQL Injection

**Problema Identificado:**
- Queries SQL devem usar parâmetros preparados
- Supabase Client já protege, mas validar uso correto

**Solução:**

```typescript
// ✅ CORRETO: Usar Supabase Client (protege automaticamente)
const { data } = await admin
  .from('brand_profiles')
  .select('*')
  .eq('user_id', userId) // Parâmetro seguro
  .eq('id', brandProfileId); // Parâmetro seguro

// ❌ ERRADO: Nunca fazer isso
// const query = `SELECT * FROM brand_profiles WHERE user_id = '${userId}'`;
// await admin.rpc('exec_sql', { query }); // PERIGOSO!
```

#### 2.3 Prevenção de NoSQL Injection

**Problema Identificado:**
- JSONB queries podem ser vulneráveis se não validadas
- Validar estrutura antes de inserir em JSONB

**Solução:**

```typescript
// Validar estrutura JSONB antes de inserir
function validateBrandVoiceJSONB(data: any): BrandVoice {
  // Validar com Zod antes de inserir
  return BrandVoiceSchema.parse(data);
}

// Uso seguro
const validatedData = validateBrandVoiceJSONB(params.brandVoice);
await admin
  .from('brand_profiles')
  .insert({
    user_id: userId,
    metadata: validatedData, // Dados validados
  });
```

---

### 3. Rate Limiting e Prevenção de Abuso

#### 3.1 Rate Limiting por Usuário

**Problema Identificado:**
- Prevenir abuso de APIs
- Limitar requisições por usuário e por IP

**Solução:**

```typescript
// src/utils/rateLimiter.ts (novo arquivo)

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Janela de tempo em milissegundos
}

const RATE_LIMITS = {
  training: {
    free: { maxRequests: 2, windowMs: 24 * 60 * 60 * 1000 }, // 2 por dia
    premium: { maxRequests: 20, windowMs: 24 * 60 * 60 * 1000 }, // 20 por dia
  },
  transformation: {
    free: { maxRequests: 50, windowMs: 24 * 60 * 60 * 1000 }, // 50 por dia
    premium: { maxRequests: 500, windowMs: 24 * 60 * 60 * 1000 }, // 500 por dia
  },
  embedding: {
    free: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 por hora
    premium: { maxRequests: 1000, windowMs: 60 * 60 * 1000 }, // 1000 por hora
  },
} as const;

export async function checkRateLimit(
  userId: string,
  operation: 'training' | 'transformation' | 'embedding',
  plan: 'free' | 'premium'
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const config = RATE_LIMITS[operation][plan];
  const windowStart = new Date(Date.now() - config.windowMs);

  // Contar requisições na janela de tempo
  const { count } = await admin
    .from('credit_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('reason', `brand_voice_${operation}`)
    .gte('created_at', windowStart.toISOString());

  const currentCount = count || 0;
  const allowed = currentCount < config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - currentCount);
  const resetAt = new Date(Date.now() + config.windowMs);

  return { allowed, remaining, resetAt };
}

// Uso em Edge Functions
async function brandVoiceTrain(req: Request, userId: string, plan: UserPlan) {
  // Verificar rate limit ANTES de processar
  const rateLimit = await checkRateLimit(userId, 'training', plan);
  
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit excedido',
        resetAt: rateLimit.resetAt.toISOString(),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
        },
      }
    );
  }

  // ... continuar processamento
}
```

#### 3.2 Rate Limiting por IP

**Problema Identificado:**
- Prevenir abuso mesmo sem autenticação
- Proteger contra ataques distribuídos

**Solução:**

```typescript
// Rate limiting por IP (usar KV store ou Redis em produção)
const ipRateLimits = new Map<string, { count: number; resetAt: number }>();

export function checkIPRateLimit(
  ip: string,
  maxRequests: number = 100,
  windowMs: number = 60 * 60 * 1000 // 1 hora
): boolean {
  const now = Date.now();
  const limit = ipRateLimits.get(ip);

  if (!limit || now > limit.resetAt) {
    ipRateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (limit.count >= maxRequests) {
    return false;
  }

  limit.count++;
  return true;
}

// Uso em Edge Functions
serve(async (req: Request) => {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  if (!checkIPRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: 'Muitas requisições deste IP' }),
      { status: 429 }
    );
  }

  // ... continuar
});
```

---

### 4. Proteção de Dados Sensíveis

#### 4.1 Proteção de API Keys

**Problema Identificado:**
- API keys nunca devem ser expostas ao cliente
- Usar apenas em Edge Functions com secrets

**Solução:**

```typescript
// ✅ CORRETO: Usar secrets do Supabase
const openaiKey = Deno.env.get('OPENAI_API_KEY');
const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

// ❌ ERRADO: Nunca fazer isso
// const openaiKey = 'sk-...'; // Hardcoded
// return { apiKey: openaiKey }; // Expor ao cliente

// Configurar secrets via CLI:
// supabase secrets set OPENAI_API_KEY=sk-...
// supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

#### 4.2 Proteção de Embeddings

**Problema Identificado:**
- Embeddings são dados sensíveis (representam conteúdo do usuário)
- Não devem ser expostos em respostas de API

**Solução:**

```typescript
// Edge Function: NUNCA retornar embeddings completos
// Retornar apenas metadados ou IDs

interface TrainingResponse {
  brandProfile: {
    id: string;
    name: string;
    // ... outros campos
    // ❌ NÃO incluir: embeddings completos
  };
  stats: {
    samplesProcessed: number;
    embeddingsCreated: number;
    // ✅ OK: estatísticas são seguras
  };
}

// Buscar embeddings apenas internamente (não expor)
async function getSimilarChunks(
  queryEmbedding: number[],
  brandProfileId: string
): Promise<string[]> {
  // Buscar internamente, retornar apenas textos (não embeddings)
  const { data } = await admin.rpc('match_brand_embeddings', {
    query_embedding: JSON.stringify(queryEmbedding),
    profile_id: brandProfileId,
  });

  return data.map((item: any) => item.text_chunk); // Apenas texto, não embedding
}
```

#### 4.3 Proteção de Samples Textuais

**Problema Identificado:**
- Samples podem conter informações sensíveis do usuário
- Não devem ser expostos em logs ou respostas de erro

**Solução:**

```typescript
// Scrubbing de PII em samples
function scrubSensitiveData(text: string): string {
  // Remover emails
  text = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
  
  // Remover números de telefone
  text = text.replace(/\b\d{2,3}[-.\s]?\d{4,5}[-.\s]?\d{4}\b/g, '[PHONE]');
  
  // Remover CPF/CNPJ
  text = text.replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[CPF]');
  text = text.replace(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, '[CNPJ]');
  
  // Remover cartões de crédito
  text = text.replace(/\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/g, '[CARD]');
  
  return text;
}

// Usar em logs
Observability.trackEvent('brand_voice_training', {
  userId,
  samplesCount: samples.length,
  // ❌ NÃO incluir: samples completos
  // ✅ OK: apenas contagem
});

// Se precisar logar erro, scrubbear
Observability.trackError(error, {
  context: 'brand_voice_training',
  userId,
  samplePreview: scrubSensitiveData(samples[0]?.slice(0, 100) || ''), // Apenas preview scrubbed
});
```

---

### 5. Auditoria e Logging Seguro

#### 5.1 Logs Estruturados sem PII

**Problema Identificado:**
- Logs devem ser estruturados e não conter PII
- Seguir padrão do projeto (`Observability`)

**Solução:**

```typescript
// Usar Observability existente (já implementa PII scrubbing)
import { Observability } from '@/lib/observability';

// ✅ CORRETO: Logs estruturados sem PII
Observability.trackEvent('brand_voice_training_started', {
  userId, // ✅ OK: ID é seguro
  samplesCount: samples.length, // ✅ OK: contagem é segura
  plan, // ✅ OK: plano é seguro
  // ❌ NÃO incluir: samples completos, emails, dados sensíveis
});

Observability.trackEvent('brand_voice_transformation', {
  userId,
  brandProfileId,
  provider: selectedProvider,
  model: selectedModel,
  tokensUsed,
  similarityChunksUsed,
  // ❌ NÃO incluir: inputText completo, embeddings
});

// Logs de erro com contexto limitado
Observability.trackError(error, {
  context: 'brand_voice_training',
  userId,
  operation: 'training',
  // ❌ NÃO incluir: stack traces completos com dados sensíveis
});
```

#### 5.2 Auditoria de Ações Críticas

**Problema Identificado:**
- Ações críticas devem ser auditadas
- Rastreabilidade de mudanças

**Solução:**

```typescript
// Criar tabela de auditoria (opcional, ou usar credit_transactions)
CREATE TABLE IF NOT EXISTS brand_voice_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL, -- 'training', 'transformation', 'delete', 'update'
  brand_profile_id uuid REFERENCES brand_profiles(id) ON DELETE SET NULL,
  metadata jsonb, -- Dados adicionais (sem PII)
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS para auditoria (apenas leitura própria)
ALTER TABLE brand_voice_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
  ON brand_voice_audit FOR SELECT
  USING (auth.uid() = user_id);

-- Função helper para auditoria
async function auditAction(
  userId: string,
  action: string,
  brandProfileId: string | null,
  metadata: Record<string, any>,
  request: Request
) {
  await admin.from('brand_voice_audit').insert({
    user_id: userId,
    action,
    brand_profile_id: brandProfileId,
    metadata: {
      ...metadata,
      // Remover PII do metadata
      samples: undefined, // Não incluir samples
      inputText: undefined, // Não incluir inputText
    },
    ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
  });
}
```

---

### 6. Validação de Limites e Prevenção de Abuso

#### 6.1 Validação de Limites por Plano (Já Proposta)

**Implementação Segura:**

```typescript
// Expandir validação com verificações de segurança
export async function validateBrandVoiceLimits(
  userId: string,
  operation: 'training' | 'transformation',
  params?: { samplesCount?: number; similarityChunks?: number }
): Promise<{ allowed: boolean; reason?: string }> {
  const plan = await getUserPlan(userId);
  const limits = BRAND_VOICE_LIMITS[plan];
  
  // Validar número de perfis (prevenir criação excessiva)
  if (operation === 'training') {
    const { count } = await admin
      .from('brand_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if ((count || 0) >= limits.maxProfiles) {
      return { 
        allowed: false, 
        reason: `Limite de ${limits.maxProfiles} voz(es) atingido para plano ${plan}` 
      };
    }
    
    // Validar tamanho total de samples (prevenir upload excessivo)
    const totalSize = params?.samplesCount 
      ? params.samplesCount * 10000 // Estimativa: 10KB por sample
      : 0;
    
    const maxTotalSize = plan === 'free' ? 100000 : 500000; // 100KB free, 500KB premium
    
    if (totalSize > maxTotalSize) {
      return {
        allowed: false,
        reason: `Tamanho total de samples excede limite de ${maxTotalSize / 1000}KB`,
      };
    }
  }
  
  // Validar rate limit
  const rateLimit = await checkRateLimit(userId, operation, plan);
  if (!rateLimit.allowed) {
    return {
      allowed: false,
      reason: `Rate limit excedido. Tente novamente após ${rateLimit.resetAt.toISOString()}`,
    };
  }
  
  return { allowed: true };
}
```

---

### 7. Segurança em Edge Functions

#### 7.1 Headers de Segurança

**Problema Identificado:**
- Edge Functions devem retornar headers de segurança adequados

**Solução:**

```typescript
// Headers de segurança padrão
const SECURITY_HEADERS = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

// Uso em Edge Functions
serve(async (req: Request) => {
  try {
    // ... processamento
    
    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: SECURITY_HEADERS,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: SECURITY_HEADERS, // Mesmo em erro
      }
    );
  }
});
```

#### 7.2 Validação de CORS

**Problema Identificado:**
- CORS deve ser configurado corretamente
- Permitir apenas origens confiáveis

**Solução:**

```typescript
// Configurar CORS seguro
const ALLOWED_ORIGINS = [
  'https://arcanum-ai.vercel.app',
  'https://app.arcanum-ai.com',
  // Adicionar apenas origens de produção
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0]; // Fallback para primeira origem

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400', // 24 horas
  };
}

// Handler para OPTIONS (preflight)
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(req.headers.get('origin')),
    });
  }

  // ... resto do handler
});
```

---

### 8. Proteção contra Ataques Comuns

#### 8.1 Prevenção de CSRF

**Problema Identificado:**
- Edge Functions devem validar origem das requisições
- Tokens CSRF podem ser necessários para ações críticas

**Solução:**

```typescript
// Validar origem em Edge Functions
function validateOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  
  // Verificar se origem está na lista permitida
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }
  
  // Verificar referer como fallback
  if (referer) {
    const refererOrigin = new URL(referer).origin;
    return ALLOWED_ORIGINS.includes(refererOrigin);
  }
  
  return false;
}

// Uso em ações críticas (ex: deletar perfil)
serve(async (req: Request) => {
  if (req.method === 'DELETE') {
    if (!validateOrigin(req)) {
      return new Response(
        JSON.stringify({ error: 'Origem não autorizada' }),
        { status: 403 }
      );
    }
  }
  
  // ... continuar
});
```

#### 8.2 Prevenção de Path Traversal

**Problema Identificado:**
- Validar IDs e parâmetros para prevenir path traversal
- Usar UUIDs validados

**Solução:**

```typescript
// Validar UUIDs
import { z } from 'zod';

const UUIDSchema = z.string().uuid();

function validateUUID(id: string): boolean {
  try {
    UUIDSchema.parse(id);
    return true;
  } catch {
    return false;
  }
}

// Uso seguro
async function getBrandProfile(brandProfileId: string, userId: string) {
  // Validar UUID antes de usar
  if (!validateUUID(brandProfileId)) {
    throw new Error('ID inválido');
  }

  // Usar em query (Supabase já protege, mas validação extra não faz mal)
  const { data } = await admin
    .from('brand_profiles')
    .select('*')
    .eq('id', brandProfileId) // UUID validado
    .eq('user_id', userId);
  
  return data;
}
```

---

### 9. Checklist de Segurança

#### 9.1 Checklist de Implementação

- [ ] **Autenticação:**
  - [ ] Validação de token JWT em todas as Edge Functions
  - [ ] Verificação de autenticação antes de processar
  - [ ] Tratamento de erros de autenticação

- [ ] **Autorização:**
  - [ ] RLS policies criadas e testadas
  - [ ] Validação de ownership em operações críticas
  - [ ] Verificação de plano do usuário

- [ ] **Validação:**
  - [ ] Schemas Zod implementados e validando todos os inputs
  - [ ] Sanitização de strings (prevenção XSS)
  - [ ] Validação de UUIDs e tipos
  - [ ] Limites de tamanho de dados

- [ ] **Rate Limiting:**
  - [ ] Rate limiting por usuário implementado
  - [ ] Rate limiting por IP implementado
  - [ ] Headers de rate limit retornados nas respostas

- [ ] **Proteção de Dados:**
  - [ ] API keys em secrets (nunca expostas)
  - [ ] Embeddings não retornados em respostas
  - [ ] PII scrubbing em logs
  - [ ] Samples não incluídos em logs de erro

- [ ] **Auditoria:**
  - [ ] Logs estruturados sem PII
  - [ ] Auditoria de ações críticas
  - [ ] Rastreabilidade de mudanças

- [ ] **Headers de Segurança:**
  - [ ] Headers de segurança configurados
  - [ ] CORS configurado corretamente
  - [ ] Validação de origem

- [ ] **Prevenção de Ataques:**
  - [ ] Prevenção de SQL injection (usar Supabase Client)
  - [ ] Prevenção de NoSQL injection (validar JSONB)
  - [ ] Prevenção de CSRF
  - [ ] Prevenção de path traversal

#### 9.2 Checklist de Testes de Segurança

- [ ] **Testes de Autenticação:**
  - [ ] Requisição sem token retorna 401
  - [ ] Token inválido retorna 401
  - [ ] Token expirado retorna 401

- [ ] **Testes de Autorização:**
  - [ ] Usuário não pode acessar dados de outro usuário
  - [ ] RLS policies funcionando corretamente
  - [ ] Validação de ownership funcionando

- [ ] **Testes de Validação:**
  - [ ] Inputs inválidos são rejeitados
  - [ ] XSS attempts são bloqueados
  - [ ] Limites de tamanho são respeitados

- [ ] **Testes de Rate Limiting:**
  - [ ] Rate limit é aplicado corretamente
  - [ ] Headers de rate limit são retornados
  - [ ] Reset de rate limit funciona

- [ ] **Testes de Proteção de Dados:**
  - [ ] API keys não são expostas
  - [ ] Embeddings não são retornados
  - [ ] PII não aparece em logs

---

## 📋 Plano de Implementação de Segurança

### Fase 1: Fundação (Sprint 0-1)

- [ ] Criar `src/utils/auth.ts` com `validateAuth()` e `requireAuth()`
- [ ] Criar `src/utils/ownership.ts` com validação de ownership
- [ ] Criar `src/utils/rateLimiter.ts` com rate limiting
- [ ] Criar `src/utils/security.ts` com headers e validações
- [ ] Implementar RLS policies em migrations
- [ ] Expandir schemas Zod com sanitização

### Fase 2: Integração (Sprint 1-2)

- [ ] Integrar validação de autenticação em Edge Functions
- [ ] Integrar validação de ownership em operações críticas
- [ ] Integrar rate limiting em Edge Functions
- [ ] Implementar headers de segurança
- [ ] Configurar CORS seguro

### Fase 3: Proteção Avançada (Sprint 2-3)

- [ ] Implementar PII scrubbing em logs
- [ ] Criar tabela de auditoria (opcional)
- [ ] Implementar validação de limites com segurança
- [ ] Adicionar prevenção de CSRF
- [ ] Implementar validação de origem

### Fase 4: Testes e Validação (Sprint 3-4)

- [ ] Testes de segurança automatizados
- [ ] Penetration testing básico
- [ ] Validação de RLS policies
- [ ] Validação de rate limiting
- [ ] Auditoria de logs

---

## 🔗 Referências

- ADR 001: Autenticação por Username (padrão de autenticação)
- ADR 002: Abstração de Provedor (padrão de segurança)
- ADR 003: Sistema de Ledger (auditoria)
- OWASP Top 10: Principais vulnerabilidades web
- Supabase Security Best Practices
- `src/lib/observability.ts` (PII scrubbing)

---

**Próximos Passos:**

1. ✅ Revisar e aprovar plano de segurança
2. ✅ Integrar segurança no plano técnico principal
3. ✅ Criar issues de segurança para cada fase
4. ✅ Iniciar Fase 1: Fundação

