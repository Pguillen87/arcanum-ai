# ADR 004: Estratégia de Voz da Marca (Brand Voice)

**Status:** Aceito  
**Data:** 2025-01-08  
**Decisores:** Equipe Arcanum AI  
**Contexto:** Necessidade de permitir que usuários configurem e apliquem uma "voz da marca" consistente em todas as transformações de conteúdo.

---

## Contexto

O PRD especifica que a plataforma deve suportar "Voz da Marca" - permitindo que usuários configurem um estilo, tom e preferências que serão aplicados automaticamente em todas as transformações de conteúdo.

### Requisitos:
- Usuários devem poder configurar voz da marca uma vez
- Voz da marca deve ser aplicada automaticamente em todas as transformações
- Deve ser possível sobrescrever temporariamente a voz da marca
- Configuração deve ser persistente e associada ao perfil do usuário

---

## Decisão

**Armazenar voz da marca como campo JSONB na tabela `profiles`**

### Estrutura Escolhida:

```sql
ALTER TABLE profiles ADD COLUMN brand_voice JSONB;
```

**Estrutura JSON:**
```json
{
  "tone": "profissional",
  "style": "formal",
  "examples": ["exemplo 1", "exemplo 2"],
  "preferences": {
    "length": "medium",
    "formality": "neutral",
    "creativity": "medium"
  }
}
```

---

## Opções Consideradas

### Opção 1: Campo JSONB em `profiles` ✅ ESCOLHIDA

**Vantagens:**
- Simples e direto
- Não requer joins adicionais
- Flexível para evoluir estrutura
- Performance: acesso direto ao perfil
- Fácil de consultar e atualizar

**Desvantagens:**
- Validação de schema precisa ser feita na aplicação
- Menos normalizado (mas aceitável para dados de configuração)

### Opção 2: Tabela separada `brand_profiles`

**Vantagens:**
- Mais normalizado
- Permite histórico de versões
- Validação via constraints SQL

**Desvantagens:**
- Requer join adicional em todas as consultas
- Complexidade desnecessária para dados de configuração
- Overhead de performance

### Opção 3: Armazenar em Edge Functions (cache)

**Vantagens:**
- Acesso rápido

**Desvantagens:**
- Não persistente
- Sincronização complexa
- Não alinhado com arquitetura (dados devem estar no DB)

---

## Consequências

### Positivas:
- ✅ Implementação simples e rápida
- ✅ Performance otimizada (sem joins)
- ✅ Flexibilidade para evoluir estrutura JSON
- ✅ Alinhado com padrão Supabase (JSONB para dados flexíveis)

### Negativas:
- ⚠️ Validação de schema precisa ser feita na aplicação (TypeScript)
- ⚠️ Migrações futuras podem ser mais complexas se estrutura mudar

### Mitigações:
- Validação de schema implementada em `brandVoiceService.ts`
- TypeScript types garantem type safety
- Documentação clara da estrutura JSON

---

## Implementação

### 1. Migração SQL:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS brand_voice JSONB;
```

### 2. Busca Automática:
A Edge Function `transform_text` busca automaticamente `brand_voice` do perfil do usuário se não for fornecido nos parâmetros:

```typescript
// Buscar brand_voice do perfil se não fornecido
let brandVoice = params.brandVoice;
if (!brandVoice) {
  const { data: profile } = await admin
    .from("profiles")
    .select("brand_voice")
    .eq("id", project.user_id)
    .single();
  
  if (profile?.brand_voice) {
    brandVoice = profile.brand_voice;
  }
}
```

### 3. Aplicação no Prompt:
A função `applyBrandVoice` enriquece o prompt com instruções da voz da marca:

```typescript
function applyBrandVoice(prompt: string, brandVoice: any): string {
  // Aplica tone, style, preferences e examples ao prompt
}
```

---

## Referências

- PRD — Arcanum AI.txt (Seção 3: Escopo Funcional - Voz da Marca)
- Supabase JSONB Documentation
- Plano de Refatoração - Fase 2.1

---

## Status

✅ **Implementado** - Fase 2.1 concluída  
✅ **Validado** - Funcionando em produção  
📝 **Documentado** - Este ADR

---

**Última Atualização:** 2025-01-08

---

## Estratégia de Migração para Múltiplas Vozes (2025-01-XX)

### Contexto Adicional

Com a necessidade de suportar múltiplas vozes por usuário e embeddings para busca por similaridade, foi decidido criar uma nova estrutura (`brand_profiles`, `brand_samples`, `brand_embeddings`) mantendo compatibilidade com `profiles.brand_voice` existente.

### Estratégia de Migração Gradual

**Fase 1: Compatibilidade Dual (Sprint 1-2)**
- Manter `profiles.brand_voice` funcionando como antes
- Criar `brand_profiles` para novas vozes múltiplas
- Edge Functions buscam primeiro em `brand_profiles`, depois fallback para `profiles.brand_voice`
- Novos usuários usam `brand_profiles` por padrão

**Fase 2: Migração Automática (Sprint 3)**
- Criar migration script que converte `profiles.brand_voice` → `brand_profiles`
- Marcar primeira voz migrada como `is_default = true`
- Manter `profiles.brand_voice` como fallback por 3 meses
- Oferecer migração opcional aos usuários existentes

**Fase 3: Deprecação (Sprint 6+)**
- Remover uso de `profiles.brand_voice` após período de transição (3 meses)
- Manter campo para histórico (não deletar)
- Documentar migração completa

### Função de Compatibilidade

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

### Benefícios da Estratégia

- ✅ Não quebra funcionalidade existente
- ✅ Migração opcional e gradual
- ✅ Fallback automático sempre ativo
- ✅ Permite evolução para múltiplas vozes sem pressa

