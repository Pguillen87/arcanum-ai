# Análise e Melhorias: Plano Técnico - Módulo "Voz da Marca"

**Data:** 2025-01-XX  
**Analista:** Arquitetura Arcanum AI  
**Baseado em:** Plano técnico existente + Documentação do projeto

---

## 📋 Resumo Executivo

Este documento apresenta análise crítica do plano técnico para implementação do módulo "Voz da Marca" com embeddings e múltiplos modelos IA, identificando melhorias baseadas em padrões arquiteturais já estabelecidos no projeto Arcanum AI.

---

## 🔍 Análise do Contexto Existente

### 1. Sistema de Assinaturas Já Implementado

**Descoberta:**
- ✅ Tabela `subscriptions` existe com `plan_code` e `status`
- ✅ Service `subscriptionsService.ts` com métodos `getActiveSubscription()`
- ✅ Suporte a múltiplos planos via `plan_code`

**Impacto no Plano:**
- O plano menciona "plano do usuário (free/premium)" mas não especifica como determinar isso
- Precisa integrar com `subscriptionsService.getActiveSubscription()`

### 2. Brand Voice Atual (ADR 004)

**Descoberta:**
- ✅ Campo `brand_voice` JSONB já existe em `profiles`
- ✅ Edge Function `transform_text` já busca `brand_voice` automaticamente
- ✅ Função `applyBrandVoice()` já implementada
- ✅ ADR 004 documenta decisão de usar JSONB em `profiles` (não tabela separada)

**Impacto no Plano:**
- O plano propõe nova tabela `brand_profiles` (contradiz ADR 004)
- Precisa estratégia de migração ou compatibilidade
- Deve manter retrocompatibilidade com sistema atual

### 3. Padrão de Abstração de Providers (ADR 002)

**Descoberta:**
- ✅ ADR 002 estabelece padrão para abstração de providers (pagamentos)
- ✅ Padrão: Interface comum + metadata JSONB + múltiplos providers simultâneos

**Impacto no Plano:**
- O plano segue padrão similar (✅ bom)
- Pode alinhar nomenclatura e estrutura com ADR 002

### 4. Sistema de Créditos (ADR 003)

**Descoberta:**
- ✅ Sistema de ledger com `credits` e `credit_transactions`
- ✅ Idempotência via `(user_id, ref_type, ref_id)`
- ✅ Cobrança pós-entrega

**Impacto no Plano:**
- O plano não menciona integração com sistema de créditos
- Treinamentos e transformações devem debitar créditos
- Precisa definir custos em créditos por operação

### 5. Observabilidade e Logging

**Descoberta:**
- ✅ `Observability.trackError()` e `Observability.trackEvent()` existem
- ✅ PII scrubbing implementado em Edge Functions
- ✅ Logs estruturados com `auditLog()`

**Impacto no Plano:**
- O plano menciona monitoramento mas não especifica integração
- Deve usar `Observability` existente

---

## 🎯 Melhorias Propostas

### 1. Integração com Sistema de Assinaturas

**Problema Identificado:**
- Plano não especifica como determinar se usuário é free ou premium
- Não há integração com `subscriptionsService`

**Solução Proposta:**

```typescript
// src/utils/userPlan.ts (novo arquivo)

import { subscriptionsService } from '@/services/subscriptionsService';

export type UserPlan = 'free' | 'premium';

export async function getUserPlan(userId: string): Promise<UserPlan> {
  const { data: subscription } = await subscriptionsService.getActiveSubscription(userId);
  
  if (!subscription || subscription.status !== 'active') {
    return 'free';
  }
  
  // Planos premium têm plan_code começando com 'premium_' ou 'pro_'
  const premiumPlans = ['premium_monthly', 'premium_yearly', 'pro_monthly', 'pro_yearly'];
  return premiumPlans.includes(subscription.plan_code) ? 'premium' : 'free';
}

// Helper para verificar se usuário pode usar Anthropic
export async function canUseAnthropic(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  return plan === 'premium';
}
```

**Atualização no Plano:**
- Adicionar seção "Determinação de Plano do Usuário"
- Integrar `getUserPlan()` em Edge Functions antes de escolher provider
- Validar acesso a Anthropic antes de processar requests premium

---

### 2. Estratégia de Migração e Compatibilidade

**Problema Identificado:**
- Plano propõe `brand_profiles` mas ADR 004 decidiu usar `profiles.brand_voice`
- Sistema atual já funciona com `brand_voice` em `profiles`

**Solução Proposta:**

**Fase 1: Compatibilidade Dual (Sprint 1-2)**
- Manter `profiles.brand_voice` funcionando
- Criar `brand_profiles` para novas vozes múltiplas
- Edge Functions buscam primeiro em `brand_profiles`, depois fallback para `profiles.brand_voice`

**Fase 2: Migração Automática (Sprint 3)**
- Criar migration script que converte `profiles.brand_voice` → `brand_profiles`
- Marcar primeira voz migrada como `is_default = true`
- Manter `profiles.brand_voice` como fallback por 3 meses

**Fase 3: Deprecação (Sprint 6+)**
- Remover uso de `profiles.brand_voice` após período de transição
- Manter campo para histórico (não deletar)

**Código de Compatibilidade:**

```typescript
// Edge Function: buscar voz com fallback
async function getBrandVoiceForUser(userId: string, brandProfileId?: string) {
  // 1. Se brandProfileId fornecido, buscar em brand_profiles
  if (brandProfileId) {
    const { data: profile } = await admin
      .from('brand_profiles')
      .select('*')
      .eq('id', brandProfileId)
      .eq('user_id', userId)
      .single();
    
    if (profile) return { source: 'brand_profiles', data: profile };
  }
  
  // 2. Buscar voz padrão em brand_profiles
  const { data: defaultProfile } = await admin
    .from('brand_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single();
  
  if (defaultProfile) return { source: 'brand_profiles', data: defaultProfile };
  
  // 3. Fallback para profiles.brand_voice (compatibilidade)
  const { data: profile } = await admin
    .from('profiles')
    .select('brand_voice')
    .eq('id', userId)
    .single();
  
  if (profile?.brand_voice) {
    return { 
      source: 'profiles.brand_voice', 
      data: { brand_voice: profile.brand_voice } 
    };
  }
  
  return null;
}
```

---

### 3. Integração com Sistema de Créditos

**Problema Identificado:**
- Plano não menciona débito de créditos por treinamento/transformação
- Não há definição de custos em créditos

**Solução Proposta:**

**Custos em Créditos:**

```typescript
// src/constants/brandVoiceCosts.ts (novo arquivo)

export const BRAND_VOICE_COSTS = {
  training: {
    free: 10, // 10 créditos por treinamento (free)
    premium: 5, // 5 créditos por treinamento (premium - desconto)
  },
  transformation: {
    free: {
      base: 5, // 5 créditos base
      perChunk: 1, // +1 crédito por chunk de similaridade usado
    },
    premium: {
      base: 3, // 3 créditos base (premium)
      perChunk: 0.5, // +0.5 crédito por chunk
    },
  },
  embedding: {
    perSample: 1, // 1 crédito por sample processado
  },
} as const;
```

**Integração em Edge Functions:**

```typescript
// Edge Function: debitar créditos após treinamento bem-sucedido
import { creditsService } from '@/services/creditsService';

// Após criar brand_profile com sucesso
const cost = await getUserPlan(userId) === 'premium' 
  ? BRAND_VOICE_COSTS.training.premium 
  : BRAND_VOICE_COSTS.training.free;

const { error: creditError } = await creditsService.debitCredits({
  userId,
  amount: cost,
  reason: 'brand_voice_training',
  refType: 'brand_profile',
  refId: brandProfile.id,
});

if (creditError) {
  // Rollback: deletar brand_profile criado
  await admin.from('brand_profiles').delete().eq('id', brandProfile.id);
  throw new Error('Créditos insuficientes');
}
```

**Atualização no Plano:**
- Adicionar seção "Integração com Sistema de Créditos"
- Definir custos por operação
- Implementar débito pós-entrega (conforme ADR 003)

---

### 4. Validação de Limites por Plano

**Problema Identificado:**
- Plano menciona limites mas não especifica validação
- Não há verificação de limites antes de processar

**Solução Proposta:**

```typescript
// src/utils/brandVoiceLimits.ts (novo arquivo)

export const BRAND_VOICE_LIMITS = {
  free: {
    maxProfiles: 1, // Apenas 1 voz (em brand_profiles ou profiles.brand_voice)
    maxSamplesPerTraining: 10,
    maxTrainingsPerDay: 2,
    maxTransformationsPerDay: 50,
    maxSimilarityChunks: 3, // Máximo de chunks similares por transformação
  },
  premium: {
    maxProfiles: 10,
    maxSamplesPerTraining: 50,
    maxTrainingsPerDay: 20,
    maxTransformationsPerDay: 500,
    maxSimilarityChunks: 10,
  },
} as const;

// Função de validação
export async function validateBrandVoiceLimits(
  userId: string,
  operation: 'training' | 'transformation',
  params?: { samplesCount?: number; similarityChunks?: number }
): Promise<{ allowed: boolean; reason?: string }> {
  const plan = await getUserPlan(userId);
  const limits = BRAND_VOICE_LIMITS[plan];
  
  // Validar número de perfis
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
    
    // Validar número de samples
    if (params?.samplesCount && params.samplesCount > limits.maxSamplesPerTraining) {
      return { 
        allowed: false, 
        reason: `Máximo de ${limits.maxSamplesPerTraining} samples por treinamento` 
      };
    }
    
    // Validar rate limit diário
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayCount } = await admin
      .from('credit_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('reason', 'brand_voice_training')
      .gte('created_at', today.toISOString());
    
    if ((todayCount || 0) >= limits.maxTrainingsPerDay) {
      return { 
        allowed: false, 
        reason: `Limite diário de ${limits.maxTrainingsPerDay} treinamentos atingido` 
      };
    }
  }
  
  return { allowed: true };
}
```

---

### 5. Alinhamento com Padrão de Abstração (ADR 002)

**Problema Identificado:**
- Provider pattern está bom, mas pode alinhar nomenclatura com ADR 002
- Metadata deve seguir padrão similar ao `payments.metadata`

**Solução Proposta:**

```typescript
// Alinhar estrutura de metadata com padrão de payments
interface BrandProfileMetadata {
  provider: 'openai' | 'anthropic';
  model: string;
  trainingConfig?: {
    temperature?: number;
    maxTokens?: number;
    similarityThreshold?: number;
  };
  usage?: {
    totalTrainings: number;
    totalTransformations: number;
    lastUsedAt?: string;
  };
  // Similar ao payments.metadata (flexível para evoluir)
  [key: string]: any;
}
```

---

### 6. Integração com Observabilidade

**Problema Identificado:**
- Plano menciona monitoramento mas não especifica uso de `Observability`

**Solução Proposta:**

```typescript
// Edge Functions: usar Observability existente
import { Observability } from '@/lib/observability';

// Em brand_voice_train
Observability.trackEvent('brand_voice_training_started', {
  userId,
  samplesCount: samples.length,
  plan: await getUserPlan(userId),
});

// Em brand_voice_transform
Observability.trackEvent('brand_voice_transformation', {
  userId,
  brandProfileId,
  provider: selectedProvider,
  model: selectedModel,
  tokensUsed,
  similarityChunksUsed,
});

// Erros
Observability.trackError(error, {
  context: 'brand_voice_training',
  userId,
  samplesCount: samples.length,
});
```

---

### 7. Validação de Schema com Zod

**Problema Identificado:**
- Plano não especifica validação de schemas
- Projeto já usa Zod (visto em `package.json`)

**Solução Proposta:**

```typescript
// src/schemas/brandVoice.ts (novo arquivo)

import { z } from 'zod';

export const BrandVoiceSchema = z.object({
  tone: z.string().optional(),
  style: z.string().optional(),
  examples: z.array(z.string().min(50)).optional(),
  preferences: z.object({
    length: z.enum(['short', 'medium', 'long']).optional(),
    formality: z.enum(['formal', 'neutral', 'casual']).optional(),
    creativity: z.enum(['low', 'medium', 'high']).optional(),
  }).optional(),
});

export const TrainBrandVoiceRequestSchema = z.object({
  brandProfileId: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  samples: z.array(z.string().min(50).max(10000)).min(3).max(50),
  isDefault: z.boolean().optional(),
  modelProvider: z.enum(['openai', 'anthropic']).optional(),
  modelName: z.string().optional(),
});

export const TransformWithBrandVoiceRequestSchema = z.object({
  brandProfileId: z.string().uuid(),
  inputText: z.string().min(10).max(50000),
  transformationType: z.enum(['post', 'resumo', 'newsletter', 'roteiro']),
  tone: z.string().optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  useSimilaritySearch: z.boolean().optional().default(true),
  similarityThreshold: z.number().min(0).max(1).optional().default(0.7),
  maxSimilarChunks: z.number().min(1).max(20).optional().default(5),
});
```

---

### 8. Estratégia de Chunking Inteligente

**Problema Identificado:**
- Plano menciona chunking mas não especifica estratégia
- Textos podem ter tamanhos variados

**Solução Proposta:**

```typescript
// src/utils/textChunking.ts (novo arquivo)

const CHUNK_SIZE_TOKENS = 800; // ~1000 caracteres, deixando margem
const CHUNK_OVERLAP_TOKENS = 100; // Overlap para contexto

export function chunkText(text: string): string[] {
  // Estimativa: 1 token ≈ 4 caracteres
  const estimatedTokens = Math.ceil(text.length / 4);
  
  if (estimatedTokens <= CHUNK_SIZE_TOKENS) {
    return [text]; // Texto cabe em um chunk
  }
  
  const chunks: string[] = [];
  const chunkSizeChars = CHUNK_SIZE_TOKENS * 4;
  const overlapChars = CHUNK_OVERLAP_TOKENS * 4;
  
  let start = 0;
  while (start < text.length) {
    let end = start + chunkSizeChars;
    
    // Tentar quebrar em ponto de frase (., !, ?)
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastExclamation = text.lastIndexOf('!', end);
      const lastQuestion = text.lastIndexOf('?', end);
      const lastBreak = Math.max(lastPeriod, lastExclamation, lastQuestion);
      
      if (lastBreak > start + chunkSizeChars * 0.5) {
        end = lastBreak + 1; // Incluir o ponto
      }
    }
    
    chunks.push(text.slice(start, end).trim());
    start = end - overlapChars; // Overlap para contexto
  }
  
  return chunks.filter(chunk => chunk.length >= 50); // Filtrar chunks muito pequenos
}
```

---

### 9. Cache de Embeddings com TTL

**Problema Identificado:**
- Plano menciona cache mas não especifica estratégia
- Embeddings podem ser reutilizados mas também podem ficar desatualizados

**Solução Proposta:**

```typescript
// Adicionar campo updated_at em brand_embeddings
// Cache válido por 30 dias (após isso, regenerar se necessário)

// Edge Function: verificar se embedding está atualizado
async function getOrCreateEmbedding(
  text: string,
  brandProfileId: string,
  brandSampleId: string
): Promise<number[]> {
  // Buscar embedding existente (últimos 30 dias)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: existing } = await admin
    .from('brand_embeddings')
    .select('embedding')
    .eq('brand_profile_id', brandProfileId)
    .eq('brand_sample_id', brandSampleId)
    .eq('text_chunk', text)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .single();
  
  if (existing) {
    return existing.embedding as number[];
  }
  
  // Gerar novo embedding
  const embedding = await openaiProvider.generateEmbedding(text);
  
  // Armazenar
  await admin.from('brand_embeddings').insert({
    brand_profile_id: brandProfileId,
    brand_sample_id: brandSampleId,
    text_chunk: text,
    embedding: JSON.stringify(embedding), // pgvector aceita array ou string JSON
  });
  
  return embedding;
}
```

---

### 10. Tratamento de Erros e Fallbacks

**Problema Identificado:**
- Plano não especifica estratégia de fallback quando Anthropic falha
- Não há tratamento para rate limits de APIs

**Solução Proposta:**

```typescript
// Estratégia de fallback em Edge Functions
async function generateTextWithFallback(
  params: GenerateTextParams,
  preferredProvider: 'openai' | 'anthropic',
  userPlan: UserPlan
): Promise<GenerateTextResponse> {
  let provider = preferredProvider;
  
  // Se usuário é free mas pediu Anthropic, usar OpenAI
  if (preferredProvider === 'anthropic' && userPlan === 'free') {
    provider = 'openai';
  }
  
  try {
    const aiProvider = createProvider(provider, getApiKey(provider));
    return await aiProvider.generateText(params);
  } catch (error: any) {
    // Se Anthropic falhar e usuário é premium, tentar OpenAI como fallback
    if (provider === 'anthropic' && userPlan === 'premium') {
      Observability.trackError(error, {
        context: 'anthropic_fallback',
        originalProvider: 'anthropic',
        fallbackProvider: 'openai',
      });
      
      const openaiProvider = createProvider('openai', getApiKey('openai'));
      return await openaiProvider.generateText(params);
    }
    
    throw error;
  }
}
```

---

### 11. Migração Incremental de pgvector

**Problema Identificado:**
- Plano assume pgvector já habilitado
- Pode não estar disponível em todos os ambientes Supabase

**Solução Proposta:**

```sql
-- Migration: Habilitar pgvector com verificação
DO $$
BEGIN
  -- Tentar criar extensão (pode falhar se não tiver permissão)
  CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION
  WHEN OTHERS THEN
    -- Log erro mas não quebrar migration
    RAISE NOTICE 'pgvector não disponível: %', SQLERRM;
END $$;

-- Verificar se extensão está disponível antes de criar tabela
CREATE TABLE IF NOT EXISTS public.brand_embeddings (
  -- ... campos ...
  embedding vector(1536), -- Só funciona se pgvector estiver habilitado
  -- ...
);

-- Função helper para verificar disponibilidade
CREATE OR REPLACE FUNCTION pgvector_available()
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  );
END;
$$;
```

---

### 12. Documentação de API Atualizada

**Problema Identificado:**
- Plano não menciona atualização de `openapi-v1.yaml`
- Documentação de API deve incluir novos endpoints

**Solução Proposta:**

- Adicionar endpoints `/brand_voice_train` e `/brand_voice_transform` em `docs/api/openapi-v1.yaml`
- Seguir padrão existente de documentação (ver `docs/api/API-DOCUMENTATION.md`)
- Incluir exemplos de request/response
- Documentar códigos de erro específicos

---

## 📊 Tabela Comparativa: Plano Original vs. Melhorado

| Aspecto | Plano Original | Plano Melhorado |
|---------|----------------|-----------------|
| **Determinação de Plano** | Não especificado | Integração com `subscriptionsService` |
| **Compatibilidade** | Nova tabela apenas | Migração gradual + fallback |
| **Créditos** | Não mencionado | Integração completa com ledger |
| **Validação** | Básica | Zod schemas + limites por plano |
| **Observabilidade** | Genérico | Integração com `Observability` existente |
| **Fallbacks** | Não especificado | Fallback OpenAI se Anthropic falhar |
| **Chunking** | Mencionado | Estratégia detalhada com overlap |
| **Cache** | Mencionado | TTL de 30 dias + verificação |

---

## 🚀 Plano de Implementação Revisado

### Sprint 0: Preparação (Semana 0)
- [ ] Criar `src/utils/userPlan.ts` com `getUserPlan()`
- [ ] Criar `src/constants/brandVoiceCosts.ts`
- [ ] Criar `src/utils/brandVoiceLimits.ts`
- [ ] Criar `src/schemas/brandVoice.ts` com Zod
- [ ] Criar `src/utils/textChunking.ts`
- [ ] Atualizar ADR 004 com estratégia de migração

### Sprint 1: Fundação (Semana 1-2) - **ATUALIZADO**
- [ ] Criar migrations com verificação de pgvector
- [ ] Implementar função de compatibilidade `getBrandVoiceForUser()`
- [ ] Implementar OpenAI Provider
- [ ] Criar Edge Function `/brand_voice_train` com validação de limites e créditos
- [ ] Integrar com `Observability` e `subscriptionsService`
- [ ] Testes unitários com mocks

### Sprint 2: Treinamento (Semana 3-4) - **ATUALIZADO**
- [ ] Completar Edge Function `/brand_voice_train` com chunking inteligente
- [ ] Implementar cache de embeddings com TTL
- [ ] Migração automática de `profiles.brand_voice` → `brand_profiles`
- [ ] Frontend: Componente `BrandVoiceTrainer` com validação Zod
- [ ] Testes de integração incluindo débito de créditos

### Sprint 3: Transformação (Semana 5-6) - **ATUALIZADO**
- [ ] Criar Edge Function `/brand_voice_transform` com fallbacks
- [ ] Implementar busca por similaridade com limites por plano
- [ ] Integrar com sistema de transformação existente (manter compatibilidade)
- [ ] Frontend: Componente `BrandVoiceSelector` com múltiplas vozes
- [ ] Testes E2E incluindo cenários de fallback

### Sprint 4: Premium (Semana 7-8) - **ATUALIZADO**
- [ ] Implementar Anthropic Provider com fallback para OpenAI
- [ ] Validação de plano antes de usar Anthropic
- [ ] Atualizar Edge Functions com `getUserPlan()` e validações
- [ ] Testes de alternância de modelos e fallbacks
- [ ] Documentar comportamento de fallback

### Sprint 5: Múltiplas Vozes (Semana 9-10) - **MANTIDO**
- [ ] Suporte a múltiplas vozes com limites por plano
- [ ] UI para gerenciar vozes
- [ ] Migração completa de usuários existentes
- [ ] Validações de limites

### Sprint 6: Otimização e Polish (Semana 11-12) - **ATUALIZADO**
- [ ] Otimização de cache de embeddings
- [ ] Batching de requests com rate limiting
- [ ] Monitoramento completo com `Observability`
- [ ] Documentação de API atualizada (`openapi-v1.yaml`)
- [ ] Performance tuning e métricas
- [ ] Remover deprecação de `profiles.brand_voice` (após 3 meses)

---

## ✅ Checklist de Validação Revisado

- [ ] Migrations aplicadas com verificação de pgvector
- [ ] `getUserPlan()` integrado e testado
- [ ] Compatibilidade com `profiles.brand_voice` funcionando
- [ ] Débito de créditos funcionando em todas as operações
- [ ] Validação de limites por plano implementada
- [ ] Fallback OpenAI → Anthropic testado
- [ ] Observability integrado em todas as Edge Functions
- [ ] Zod schemas validando todos os inputs
- [ ] Cache de embeddings com TTL funcionando
- [ ] Documentação de API atualizada
- [ ] Testes de migração de `profiles.brand_voice` passando
- [ ] Performance aceitável (<2s treinamento, <5s transformação)

---

## 📝 Notas de Implementação

### Compatibilidade com Sistema Atual

**Importante:** O sistema atual já funciona com `profiles.brand_voice`. A implementação deve:

1. **Não quebrar funcionalidade existente** - Edge Function `transform_text` deve continuar funcionando
2. **Migração opcional** - Usuários podem continuar usando `profiles.brand_voice` ou migrar para `brand_profiles`
3. **Fallback automático** - Sistema sempre tenta `brand_profiles` primeiro, depois `profiles.brand_voice`

### Estratégia de Rollout

1. **Fase 1 (Sprint 1-2):** Sistema dual funcionando, novos usuários usam `brand_profiles`
2. **Fase 2 (Sprint 3):** Migração automática oferecida aos usuários existentes
3. **Fase 3 (Sprint 6+):** Deprecação gradual de `profiles.brand_voice` (após 3 meses)

### Considerações de Segurança

- Validar `user_id` em todas as queries (RLS já cobre, mas double-check)
- Rate limiting por usuário e por IP
- Validação de limites antes de processar (prevenir abuso)
- PII scrubbing em logs (já implementado, manter)

---

## 🔗 Referências

- ADR 002: Abstração de Provedor de Pagamentos (padrão a seguir)
- ADR 003: Sistema de Ledger para Créditos (integração necessária)
- ADR 004: Estratégia de Voz da Marca (compatibilidade necessária)
- `docs/api/API-DOCUMENTATION.md` (padrão de documentação)
- `src/services/subscriptionsService.ts` (integração de planos)
- `src/lib/observability.ts` (integração de monitoramento)

---

**Próximos Passos:**

1. ✅ Revisar e aprovar melhorias
2. ✅ Atualizar plano técnico com melhorias
3. ✅ Criar issues no GitHub para cada sprint revisado
4. ✅ Iniciar Sprint 0: Preparação

