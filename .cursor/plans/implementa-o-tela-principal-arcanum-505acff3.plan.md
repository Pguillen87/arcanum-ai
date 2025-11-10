<!-- 505acff3-7901-48b4-bc76-ccd050c75b98 38ca7d39-df06-4afc-8745-a013d7ad8bcb -->
# Plano Técnico: Módulo "Voz da Marca" com Embeddings e Múltiplos Modelos IA

## 1. Arquitetura Geral

### 1.1 Visão de Alto Nível

```
┌─────────────────┐
│   Frontend      │
│   (React)       │
│                 │
│  useBrandVoice  │
│  Hook           │
└────────┬────────┘
         │
         │ HTTP POST
         ▼
┌─────────────────────────────────────┐
│   Edge Function                     │
│   /brand_voice_train                │
│   /brand_voice_transform            │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Model Provider Pattern       │ │
│  │  - OpenAI Provider (Free)     │ │
│  │  - Anthropic Provider (Premium)│ │
│  └───────────────────────────────┘ │
└────────┬────────────────────────────┘
         │
         ├──► Supabase Postgres
         │    - brand_profiles (múltiplas vozes)
         │    - brand_embeddings (vector store)
         │    - brand_samples (textos de treino)
         │
         ├──► OpenAI API
         │    - Embeddings (text-embedding-3-small)
         │    - GPT-4o (freemium)
         │
         └──► Anthropic API
       - Claude 3.5 Sonnet (premium)
       - Claude 3 Opus (premium)
```

### 1.2 Componentes Principais

**Frontend:**

- `useBrandVoice` hook (expandido)
- `BrandVoiceTrainer` component
- `BrandVoiceSelector` component
- `BrandVoicePreview` component

**Edge Functions:**

- `/brand_voice_train` - Treina voz a partir de samples
- `/brand_voice_transform` - Aplica voz em transformações

**Services:**

- `brandVoiceService.ts` (expandido)
- `embeddingService.ts` (novo)
- `aiProviderService.ts` (novo - abstração de modelos)

**Database:**

- `brand_profiles` - Perfis de voz (múltiplos por usuário)
- `brand_embeddings` - Vector store (pgvector)
- `brand_samples` - Samples textuais de treino

### 1.3 Fluxo de Dados

**Treinamento (Training):**

1. Usuário envia samples textuais via frontend
2. Edge Function `/brand_voice_train` recebe samples
3. Gera embeddings via OpenAI Embeddings API
4. Armazena embeddings no Supabase (pgvector)
5. Cria/atualiza perfil de voz em `brand_profiles`
6. Retorna perfil treinado ao frontend

**Transformação (Inference):**

1. Usuário solicita transformação com voz específica
2. Edge Function `/brand_voice_transform` recebe request
3. Identifica modelo baseado em plano (free/premium)
4. Busca embeddings da voz no vector store
5. Enriquece prompt com contexto da voz
6. Chama provider apropriado (OpenAI ou Anthropic)
7. Retorna resultado transformado

## 2. Banco de Dados

### 2.1 Tabelas Necessárias

#### 2.1.1 `brand_profiles` (Nova Tabela)

```sql
CREATE TABLE public.brand_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL, -- Nome da voz (ex: "Voz Profissional", "Voz Criativa")
  description text,
  is_default boolean DEFAULT false, -- Voz padrão do usuário
  model_provider text NOT NULL DEFAULT 'openai', -- 'openai' | 'anthropic'
  model_name text NOT NULL DEFAULT 'gpt-4o', -- 'gpt-4o' | 'claude-3-5-sonnet' | 'claude-3-opus'
  metadata jsonb, -- Configurações específicas do modelo
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT brand_profiles_user_default_unique UNIQUE (user_id, is_default) 
    WHERE is_default = true
);

-- Índices
CREATE INDEX brand_profiles_user_id_idx ON brand_profiles(user_id);
CREATE INDEX brand_profiles_user_default_idx ON brand_profiles(user_id, is_default) 
  WHERE is_default = true;

-- RLS
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand profiles"
  ON brand_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand profiles"
  ON brand_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand profiles"
  ON brand_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand profiles"
  ON brand_profiles FOR DELETE
  USING (auth.uid() = user_id);
```

#### 2.1.2 `brand_samples` (Nova Tabela)

```sql
CREATE TABLE public.brand_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_profile_id uuid REFERENCES brand_profiles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text_content text NOT NULL, -- Sample textual
  source_type text, -- 'manual' | 'imported' | 'transformation'
  source_asset_id uuid REFERENCES assets(id) ON DELETE SET NULL,
  metadata jsonb, -- Metadados adicionais (tipo de conteúdo, data, etc.)
  created_at timestamptz DEFAULT now() NOT NULL,
  
  CONSTRAINT brand_samples_text_length CHECK (char_length(text_content) >= 50)
);

-- Índices
CREATE INDEX brand_samples_brand_profile_id_idx ON brand_samples(brand_profile_id);
CREATE INDEX brand_samples_user_id_idx ON brand_samples(user_id);

-- RLS
ALTER TABLE brand_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand samples"
  ON brand_samples FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand samples"
  ON brand_samples FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand samples"
  ON brand_samples FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand samples"
  ON brand_samples FOR DELETE
  USING (auth.uid() = user_id);
```

#### 2.1.3 `brand_embeddings` (Nova Tabela - Vector Store)

```sql
-- Habilitar extensão pgvector (executar como superuser)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.brand_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_profile_id uuid REFERENCES brand_profiles(id) ON DELETE CASCADE NOT NULL,
  brand_sample_id uuid REFERENCES brand_samples(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  embedding vector(1536) NOT NULL, -- OpenAI text-embedding-3-small = 1536 dims
  text_chunk text NOT NULL, -- Chunk do texto original
  chunk_index integer DEFAULT 0, -- Índice do chunk (para textos longos)
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Índices para busca vetorial
CREATE INDEX brand_embeddings_brand_profile_id_idx ON brand_embeddings(brand_profile_id);
CREATE INDEX brand_embeddings_user_id_idx ON brand_embeddings(user_id);
CREATE INDEX brand_embeddings_vector_idx ON brand_embeddings 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100); -- Ajustar conforme volume de dados

-- RLS
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
```

#### 2.1.4 Atualização da Tabela `profiles`

```sql
-- Manter compatibilidade com sistema atual
-- O campo brand_voice em profiles será usado como fallback
-- Mas preferir brand_profiles para múltiplas vozes

-- Adicionar campo para referenciar voz padrão (opcional)
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS default_brand_profile_id uuid 
  REFERENCES brand_profiles(id) ON DELETE SET NULL;
```

### 2.2 Funções SQL Helper

```sql
-- Função para buscar embeddings similares
CREATE OR REPLACE FUNCTION match_brand_embeddings(
  query_embedding vector(1536),
  profile_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  brand_sample_id uuid,
  text_chunk text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    be.id,
    be.brand_sample_id,
    be.text_chunk,
    1 - (be.embedding <=> query_embedding) as similarity
  FROM brand_embeddings be
  WHERE be.brand_profile_id = profile_id
    AND 1 - (be.embedding <=> query_embedding) > match_threshold
  ORDER BY be.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

## 3. Edge Functions

### 3.1 `/brand_voice_train`

**Responsabilidade:** Treinar uma voz da marca a partir de samples textuais

**Endpoint:** `POST /functions/v1/brand_voice_train`

**Request Body:**

```typescript
interface TrainBrandVoiceRequest {
  brandProfileId?: string; // Se fornecido, atualiza perfil existente
  name: string;
  description?: string;
  samples: string[]; // Array de textos de exemplo (mínimo 3, máximo 50)
  isDefault?: boolean;
  modelProvider?: 'openai' | 'anthropic'; // Default: baseado em plano do usuário
  modelName?: string; // Default: baseado em provider
}
```

**Fluxo:**

1. Validar autenticação e permissões
2. Verificar plano do usuário (free/premium)
3. Validar samples (mínimo 3, máximo 50, mínimo 50 caracteres cada)
4. Gerar embeddings para cada sample via OpenAI Embeddings API
5. Chunking de textos longos (>1000 tokens) em chunks menores
6. Armazenar embeddings no Supabase
7. Criar/atualizar perfil em `brand_profiles`
8. Retornar perfil criado com estatísticas

**Response:**

```typescript
interface TrainBrandVoiceResponse {
  brandProfile: BrandProfile;
  stats: {
    samplesProcessed: number;
    embeddingsCreated: number;
    chunksCreated: number;
    trainingTimeMs: number;
  };
}
```

### 3.2 `/brand_voice_transform`

**Responsabilidade:** Aplicar voz da marca em transformação de texto

**Endpoint:** `POST /functions/v1/brand_voice_transform`

**Request Body:**

```typescript
interface TransformWithBrandVoiceRequest {
  brandProfileId: string;
  inputText: string;
  transformationType: 'post' | 'resumo' | 'newsletter' | 'roteiro';
  tone?: string; // Override temporário
  length?: 'short' | 'medium' | 'long';
  useSimilaritySearch?: boolean; // Usar busca por similaridade (default: true)
  similarityThreshold?: number; // Default: 0.7
  maxSimilarChunks?: number; // Default: 5
}
```

**Fluxo:**

1. Validar autenticação e permissões
2. Buscar perfil de voz em `brand_profiles`
3. Se `useSimilaritySearch = true`:

                        - Gerar embedding do `inputText`
                        - Buscar chunks similares via função SQL `match_brand_embeddings`
                        - Incluir chunks similares no contexto do prompt

4. Determinar provider baseado em `brand_profile.model_provider` e plano do usuário
5. Construir prompt enriquecido com:

                        - Contexto da voz (nome, descrição)
                        - Chunks similares encontrados
                        - Instruções de estilo baseadas em metadata

6. Chamar provider apropriado (OpenAI ou Anthropic)
7. Retornar texto transformado

**Response:**

```typescript
interface TransformWithBrandVoiceResponse {
  transformedText: string;
  metadata: {
    modelUsed: string;
    provider: string;
    tokensUsed?: number;
    similarityChunksUsed: number;
    processingTimeMs: number;
  };
}
```

## 4. Provider Pattern (Abstração de Modelos)

### 4.1 Interface de Provider

```typescript
// src/adapters/aiProvider.ts

export interface AIProvider {
  name: 'openai' | 'anthropic';
  generateText(params: GenerateTextParams): Promise<GenerateTextResponse>;
  generateEmbedding(text: string): Promise<number[]>;
}

export interface GenerateTextParams {
  prompt: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface GenerateTextResponse {
  text: string;
  tokensUsed?: number;
  model: string;
  provider: string;
}
```

### 4.2 Implementação OpenAI Provider

```typescript
// src/adapters/openaiProvider.ts

import OpenAI from 'openai';
import { AIProvider, GenerateTextParams, GenerateTextResponse } from './aiProvider';

export class OpenAIProvider implements AIProvider {
  name = 'openai' as const;
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateText(params: GenerateTextParams): Promise<GenerateTextResponse> {
    const response = await this.client.chat.completions.create({
      model: params.model || 'gpt-4o',
      messages: [
        ...(params.systemPrompt ? [{ role: 'system', content: params.systemPrompt }] : []),
        { role: 'user', content: params.prompt }
      ],
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 2000,
    });

    return {
      text: response.choices[0]?.message?.content || '',
      tokensUsed: response.usage?.total_tokens,
      model: params.model || 'gpt-4o',
      provider: 'openai',
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  }
}
```

### 4.3 Implementação Anthropic Provider

```typescript
// src/adapters/anthropicProvider.ts

import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, GenerateTextParams, GenerateTextResponse } from './aiProvider';

export class AnthropicProvider implements AIProvider {
  name = 'anthropic' as const;
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateText(params: GenerateTextParams): Promise<GenerateTextResponse> {
    const systemPrompt = params.systemPrompt || '';
    const userPrompt = params.prompt;

    const response = await this.client.messages.create({
      model: params.model || 'claude-3-5-sonnet-20241022',
      max_tokens: params.maxTokens ?? 2000,
      temperature: params.temperature ?? 0.7,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    });

    const text = response.content
      .filter((c): c is Anthropic.TextBlock => c.type === 'text')
      .map(c => c.text)
      .join('');

    return {
      text,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      model: params.model || 'claude-3-5-sonnet-20241022',
      provider: 'anthropic',
    };
  }

  // Anthropic não tem API de embeddings nativa
  // Usar OpenAI para embeddings mesmo quando provider é Anthropic
  async generateEmbedding(text: string): Promise<number[]> {
    throw new Error('Anthropic não suporta embeddings. Use OpenAI para embeddings.');
  }
}
```

### 4.4 Factory de Providers

```typescript
// src/adapters/providerFactory.ts

import { AIProvider } from './aiProvider';
import { OpenAIProvider } from './openaiProvider';
import { AnthropicProvider } from './anthropicProvider';

export function createProvider(
  providerName: 'openai' | 'anthropic',
  apiKey: string
): AIProvider {
  switch (providerName) {
    case 'openai':
      return new OpenAIProvider(apiKey);
    case 'anthropic':
      return new AnthropicProvider(apiKey);
    default:
      throw new Error(`Provider desconhecido: ${providerName}`);
  }
}

export function getDefaultProvider(userPlan: 'free' | 'premium'): 'openai' | 'anthropic' {
  return userPlan === 'premium' ? 'anthropic' : 'openai';
}

export function getDefaultModel(provider: 'openai' | 'anthropic'): string {
  switch (provider) {
    case 'openai':
      return 'gpt-4o';
    case 'anthropic':
      return 'claude-3-5-sonnet-20241022';
    default:
      return 'gpt-4o';
  }
}
```

## 5. Frontend - Hooks e Componentes

### 5.1 Hook `useBrandVoice` (Expandido)

```typescript
// src/hooks/useBrandVoice.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { brandVoiceService } from '@/services/brandVoiceService';

export interface BrandProfile {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  modelProvider: 'openai' | 'anthropic';
  modelName: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export function useBrandVoice() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Listar todas as vozes do usuário
  const { data: profiles, isLoading } = useQuery({
    queryKey: ['brandProfiles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return brandVoiceService.listProfiles(user.id);
    },
    enabled: !!user?.id,
  });

  // Buscar voz padrão
  const { data: defaultProfile } = useQuery({
    queryKey: ['brandProfile', 'default', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return brandVoiceService.getDefaultProfile(user.id);
    },
    enabled: !!user?.id,
  });

  // Treinar nova voz
  const trainMutation = useMutation({
    mutationFn: async (params: TrainBrandVoiceParams) => {
      return brandVoiceService.trainBrandVoice(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brandProfiles', user?.id] });
    },
  });

  // Transformar texto com voz
  const transformMutation = useMutation({
    mutationFn: async (params: TransformWithBrandVoiceParams) => {
      return brandVoiceService.transformWithBrandVoice(params);
    },
  });

  return {
    profiles: profiles || [],
    defaultProfile,
    isLoading,
    trainBrandVoice: trainMutation.mutateAsync,
    transformWithBrandVoice: transformMutation.mutateAsync,
    isTraining: trainMutation.isPending,
    isTransforming: transformMutation.isPending,
  };
}
```

### 5.2 Service `brandVoiceService` (Expandido)

```typescript
// src/services/brandVoiceService.ts

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface TrainBrandVoiceParams {
  brandProfileId?: string;
  name: string;
  description?: string;
  samples: string[];
  isDefault?: boolean;
  modelProvider?: 'openai' | 'anthropic';
}

export interface TransformWithBrandVoiceParams {
  brandProfileId: string;
  inputText: string;
  transformationType: 'post' | 'resumo' | 'newsletter' | 'roteiro';
  tone?: string;
  length?: 'short' | 'medium' | 'long';
}

export const brandVoiceService = {
  async listProfiles(userId: string): Promise<BrandProfile[]> {
    const { data, error } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getDefaultProfile(userId: string): Promise<BrandProfile | null> {
    const { data, error } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async trainBrandVoice(params: TrainBrandVoiceParams): Promise<BrandProfile> {
    const session = await supabase.auth.getSession();
    if (!session.data.session) throw new Error('Não autenticado');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/brand_voice_train`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.data.session.access_token}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao treinar voz');
    }

    const data = await response.json();
    return data.brandProfile;
  },

  async transformWithBrandVoice(params: TransformWithBrandVoiceParams): Promise<string> {
    const session = await supabase.auth.getSession();
    if (!session.data.session) throw new Error('Não autenticado');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/brand_voice_transform`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.data.session.access_token}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao transformar texto');
    }

    const data = await response.json();
    return data.transformedText;
  },
};
```

## 6. Configuração de Ambiente

### 6.1 Variáveis de Ambiente

**Frontend (.env):**

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

**Edge Functions (Supabase Secrets):**

```bash
# OpenAI (obrigatório)
OPENAI_API_KEY=sk-...

# Anthropic (opcional, apenas para premium)
ANTHROPIC_API_KEY=sk-ant-...

# Supabase (já configurado)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

### 6.2 Configuração de Secrets no Supabase

```bash
# Via CLI
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# Ou via Dashboard: Project Settings > Edge Functions > Secrets
```

## 7. Testabilidade

### 7.1 Mocking de APIs com MSW

```typescript
// tests/mocks/handlers.ts

import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock OpenAI API
  http.post('https://api.openai.com/v1/embeddings', () => {
    return HttpResponse.json({
      data: [{
        embedding: new Array(1536).fill(0).map(() => Math.random()),
        index: 0,
      }],
      model: 'text-embedding-3-small',
      usage: { prompt_tokens: 10, total_tokens: 10 },
    });
  }),

  http.post('https://api.openai.com/v1/chat/completions', () => {
    return HttpResponse.json({
      id: 'chatcmpl-123',
      object: 'chat.completion',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: 'Texto transformado mockado',
        },
        finish_reason: 'stop',
      }],
      usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
    });
  }),

  // Mock Anthropic API
  http.post('https://api.anthropic.com/v1/messages', () => {
    return HttpResponse.json({
      id: 'msg-123',
      type: 'message',
      role: 'assistant',
      content: [{
        type: 'text',
        text: 'Texto transformado mockado (Claude)',
      }],
      model: 'claude-3-5-sonnet-20241022',
      usage: { input_tokens: 100, output_tokens: 50 },
    });
  }),

  // Mock Edge Functions
  http.post('https://seu-projeto.supabase.co/functions/v1/brand_voice_train', () => {
    return HttpResponse.json({
      brandProfile: {
        id: 'profile-123',
        name: 'Voz Mockada',
        isDefault: true,
        modelProvider: 'openai',
        modelName: 'gpt-4o',
      },
      stats: {
        samplesProcessed: 3,
        embeddingsCreated: 3,
        chunksCreated: 3,
        trainingTimeMs: 500,
      },
    });
  }),
];
```

### 7.2 Testes Unitários

```typescript
// tests/unit/adapters/openaiProvider.test.ts

import { describe, it, expect, vi } from 'vitest';
import { OpenAIProvider } from '@/adapters/openaiProvider';

describe('OpenAIProvider', () => {
  it('deve gerar texto corretamente', async () => {
    const provider = new OpenAIProvider('test-key');
    // Mock da API OpenAI
    const result = await provider.generateText({
      prompt: 'Teste',
      model: 'gpt-4o',
    });
    expect(result.text).toBeDefined();
    expect(result.provider).toBe('openai');
  });
});
```

### 7.3 Testes de Integração

```typescript
// tests/integration/brandVoice.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBrandVoice } from '@/hooks/useBrandVoice';

describe('useBrandVoice Integration', () => {
  it('deve treinar voz e listar perfis', async () => {
    // Setup
    const queryClient = new QueryClient();
    // ... render component
    // ... trigger train mutation
    // ... assert results
  });
});
```

## 8. Escalabilidade

### 8.1 Suporte a Múltiplas Vozes

- Limite de 10 vozes por usuário (validar em Edge Function)
- Voz padrão marcada com `is_default = true`
- Seleção de voz por transformação via `brandProfileId`

### 8.2 Otimizações de Performance

**Cache de Embeddings:**

- Embeddings são gerados uma vez por sample
- Reutilizados em todas as transformações
- Cache em memória na Edge Function (opcional)

**Batching de Embeddings:**

- Processar múltiplos samples em batch (até 100 por request)
- Reduzir chamadas à API OpenAI

**Índices Vector:**

- Usar `ivfflat` index no pgvector
- Ajustar `lists` conforme volume (100-1000)

### 8.3 Rate Limiting

```typescript
// Edge Function: rate limiting por usuário
const RATE_LIMITS = {
  free: {
    trainingPerDay: 5,
    transformationsPerDay: 100,
  },
  premium: {
    trainingPerDay: 50,
    transformationsPerDay: 1000,
  },
};
```

## 9. Custos e Otimização

### 9.1 Estimativa de Custos

**OpenAI (Freemium):**

- Embeddings: $0.00002 por 1K tokens (text-embedding-3-small)
- GPT-4o: $2.50/$10.00 por 1M tokens (input/output)

**Anthropic (Premium):**

- Claude 3.5 Sonnet: $3/$15 por 1M tokens
- Claude 3 Opus: $15/$75 por 1M tokens

**Estimativa Mensal (1000 usuários ativos):**

- Treinamentos: ~5000 treinamentos/mês
                - Embeddings: ~$5/mês
                - Armazenamento: ~$2/mês (Supabase)
- Transformações: ~100K transformações/mês
                - GPT-4o (free): ~$250/mês
                - Claude Sonnet (premium 20%): ~$60/mês
- **Total estimado: ~$320/mês**

### 9.2 Estratégias de Otimização

1. **Cache de Embeddings:** Reutilizar embeddings existentes
2. **Chunking Inteligente:** Dividir textos longos em chunks otimizados
3. **Batch Processing:** Processar múltiplos samples em batch
4. **Model Selection:** Usar GPT-4o-mini para tarefas simples
5. **Token Optimization:** Limitar `max_tokens` baseado em `length`

## 10. Extras Opcionais (Futuro)

### 10.1 Integração Hugging Face

```typescript
// src/adapters/huggingFaceProvider.ts

export class HuggingFaceProvider implements AIProvider {
  // Usar modelos locais ou Inference API
  // Fallback quando APIs principais falharem
}
```

### 10.2 Integração Mistral

```typescript
// src/adapters/mistralProvider.ts

export class MistralProvider implements AIProvider {
  // Alternativa europeia (GDPR compliant)
}
```

### 10.3 Fine-tuning Customizado

- Permitir fine-tuning de modelos com dados do usuário
- Armazenar modelos fine-tuned por usuário
- Feature premium avançada

## 11. Plano de Implementação Incremental

### Sprint 1: Fundação (Semana 1-2)

- [ ] Criar migrations para `brand_profiles`, `brand_samples`, `brand_embeddings`
- [ ] Implementar OpenAI Provider
- [ ] Criar Edge Function `/brand_voice_train` (MVP básico)
- [ ] Testes unitários de providers

### Sprint 2: Treinamento (Semana 3-4)

- [ ] Completar Edge Function `/brand_voice_train`
- [ ] Implementar geração de embeddings
- [ ] Integração com pgvector
- [ ] Frontend: Componente `BrandVoiceTrainer`
- [ ] Testes de integração

### Sprint 3: Transformação (Semana 5-6)

- [ ] Criar Edge Function `/brand_voice_transform`
- [ ] Implementar busca por similaridade
- [ ] Integrar com sistema de transformação existente
- [ ] Frontend: Componente `BrandVoiceSelector`
- [ ] Testes E2E

### Sprint 4: Premium (Semana 7-8)

- [ ] Implementar Anthropic Provider
- [ ] Lógica de alternância free/premium
- [ ] Atualizar Edge Functions para suportar múltiplos providers
- [ ] Testes de alternância de modelos

### Sprint 5: Múltiplas Vozes (Semana 9-10)

- [ ] Suporte a múltiplas vozes por usuário
- [ ] UI para gerenciar vozes
- [ ] Seleção de voz por transformação
- [ ] Limites e validações

### Sprint 6: Otimização e Polish (Semana 11-12)

- [ ] Cache de embeddings
- [ ] Batching de requests
- [ ] Monitoramento e observabilidade
- [ ] Documentação completa
- [ ] Performance tuning

## 12. Checklist de Validação

- [ ] Migrations aplicadas com sucesso
- [ ] pgvector habilitado no Supabase
- [ ] Edge Functions deployadas
- [ ] Secrets configurados
- [ ] Testes unitários passando (>80% coverage)
- [ ] Testes de integração passando
- [ ] Testes E2E passando
- [ ] Documentação atualizada
- [ ] Monitoramento configurado
- [ ] Rate limiting funcionando
- [ ] RLS policies validadas
- [ ] Performance aceitável (<2s para treinamento, <5s para transformação)

---

**Próximos Passos:**

1. Revisar e aprovar este plano
2. Criar issues no GitHub para cada sprint
3. Iniciar Sprint 1: Fundação

### To-dos

- [ ] Remover HeroSection de Index.tsx e verificar que não quebra
- [ ] Criar componente CosmicLogo com testes unitários e integração
- [ ] Verificar e testar persistência de idioma em I18nContext
- [ ] Criar componente GlassOrb base com glassmorphism e testes
- [ ] Adicionar animações de hover e pulsação ao GlassOrb
- [ ] Aplicar cores específicas por esfera conforme plano
- [ ] Integrar GlassOrb em OrbNavigation com ShatterEffect
- [ ] Criar componente MysticalModuleCard com glassmorphism
- [ ] Criar arquivo de dados dos 6 módulos místicos
- [ ] Criar hook useMysticalChat para gerenciar abertura de chat
- [ ] Integrar cards místicos em Index.tsx substituindo grid atual
- [ ] Integrar CosmicLogo em Index.tsx acima das esferas
- [ ] Criar migrations SQL para brand_profiles, brand_samples e brand_embeddings com pgvector
- [ ] Implementar OpenAIProvider com suporte a GPT-4o e embeddings
- [ ] Criar Edge Function /brand_voice_train com MVP básico
- [ ] Escrever testes unitários para providers e funções helper
- [ ] Completar Edge Function /brand_voice_train com geração de embeddings e armazenamento
- [ ] Integrar pgvector no Supabase e configurar índices de busca vetorial
- [ ] Criar componente BrandVoiceTrainer no frontend
- [ ] Criar Edge Function /brand_voice_transform com busca por similaridade
- [ ] Implementar função SQL match_brand_embeddings e busca por similaridade
- [ ] Criar componente BrandVoiceSelector e integrar com sistema de transformação
- [ ] Implementar AnthropicProvider com suporte a Claude 3.5 Sonnet/Opus
- [ ] Criar factory de providers e lógica de alternância free/premium
- [ ] Atualizar Edge Functions para suportar múltiplos providers dinamicamente
- [ ] Implementar suporte a múltiplas vozes por usuário (até 10)
- [ ] Criar UI para gerenciar múltiplas vozes (criar, editar, deletar, definir padrão)
- [ ] Implementar cache de embeddings e otimizações de performance
- [ ] Implementar batching de requests para embeddings e transformações
- [ ] Configurar monitoramento, logging e observabilidade para o módulo