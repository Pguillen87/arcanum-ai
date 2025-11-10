# Configuração de Observabilidade — Arcanum AI

**Data:** 2025-01-08  
**Versão:** 1.0

---

## Visão Geral

A plataforma Arcanum AI utiliza múltiplas ferramentas de observabilidade para monitorar performance, erros e comportamento do usuário.

---

## Ferramentas Configuradas

### 1. Sentry

**Descrição:** Monitoramento de erros e performance

**Configuração:**

1. **Instalar dependências:**
```bash
npm install @sentry/react @sentry/tracing
```

2. **Configurar no `src/main.tsx`:**
```typescript
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      new BrowserTracing(),
    ],
    tracesSampleRate: 0.1, // 10% das transações
    environment: import.meta.env.MODE,
    beforeSend(event) {
      // PII scrubbing já feito em observability.ts
      return event;
    },
  });
}
```

3. **Variáveis de Ambiente:**
```env
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

**Características:**
- ✅ Rastreamento de erros automático
- ✅ Performance monitoring
- ✅ Source maps para debugging
- ✅ PII scrubbing integrado

---

### 2. LogRocket

**Descrição:** Gravação de sessões e replay de erros

**Configuração:**

1. **Instalar dependências:**
```bash
npm install logrocket
```

2. **Configurar no `src/main.tsx`:**
```typescript
import LogRocket from "logrocket";

if (import.meta.env.PROD && import.meta.env.VITE_LOGROCKET_ID) {
  LogRocket.init(import.meta.env.VITE_LOGROCKET_ID, {
    dom: {
      textSanitizer: true,
      inputSanitizer: true,
    },
    network: {
      requestSanitizer: (request) => {
        // Remover tokens de headers
        if (request.headers) {
          delete request.headers.Authorization;
        }
        return request;
      },
    },
  });
}
```

3. **Variáveis de Ambiente:**
```env
VITE_LOGROCKET_ID=xxx/xxx
```

**Características:**
- ✅ Gravação de sessões
- ✅ Replay de erros
- ✅ Network monitoring
- ✅ PII scrubbing automático

---

### 3. Observability Utility (`src/lib/observability.ts`)

**Descrição:** Utilitário centralizado para logging e tracking

**Funcionalidades:**
- ✅ PII scrubbing automático (emails, tokens, UUIDs)
- ✅ Integração com Sentry
- ✅ Integração com LogRocket
- ✅ Logs estruturados em desenvolvimento

**Uso:**
```typescript
import { Observability } from '@/lib/observability';

// Trackar evento
Observability.trackEvent('user_action', { action: 'transform_text' });

// Trackar erro
Observability.trackError(error);
```

---

## Dashboards Recomendados

### 1. Dashboard de Erros (Sentry)

**Métricas:**
- Taxa de erro por endpoint
- Erros mais frequentes
- Performance de Edge Functions
- Erros por usuário (anônimo)

**Alertas:**
- Taxa de erro > 5% em 5 minutos
- Erro crítico (500) em produção
- Performance degradada (> 10s)

---

### 2. Dashboard de Performance (Sentry)

**Métricas:**
- Tempo médio de resposta por Edge Function
- P95/P99 de latência
- Throughput (requisições/minuto)
- Taxa de sucesso

**Alertas:**
- P95 > 5s
- Taxa de sucesso < 95%

---

### 3. Dashboard de Negócio (Custom)

**Métricas:**
- Transformações por dia
- Transcrições por dia
- Créditos debitados/creditados
- Usuários ativos
- Taxa de conversão (signup → primeira transformação)

**Fonte de Dados:**
- Supabase Analytics
- Queries customizadas em `audit_logs`

---

## Alertas Configurados

### Críticos (P0):

1. **Sistema Indisponível**
   - Condição: Taxa de erro > 50% por 1 minuto
   - Ação: Notificar equipe imediatamente

2. **Edge Function Falhando**
   - Condição: Taxa de erro > 20% em uma função específica
   - Ação: Investigar logs e métricas

3. **Performance Degradada**
   - Condição: P95 > 10s por 5 minutos
   - Ação: Escalar para equipe de performance

---

### Importantes (P1):

1. **Taxa de Erro Elevada**
   - Condição: Taxa de erro > 5% por 10 minutos
   - Ação: Investigar causa raiz

2. **Créditos Não Debitados**
   - Condição: Transformação completa sem débito de créditos
   - Ação: Reconciliar manualmente

---

### Informativos (P2):

1. **Uso de Créditos Anormal**
   - Condição: Usuário usa > 1000 créditos em 1 hora
   - Ação: Verificar se é uso legítimo

2. **Storage Quase Cheio**
   - Condição: Uso > 80% do limite
   - Ação: Planejar expansão

---

## Logs Estruturados

### Formato Padrão:

```json
{
  "timestamp": "2025-01-08T10:00:00Z",
  "level": "error",
  "message": "Transformação falhou",
  "context": {
    "jobId": "uuid",
    "userId": "***-uuid-***",
    "function": "transform_text",
    "duration": 1234,
    "error": "OpenAI API error"
  }
}
```

### PII Scrubbing:

Campos automaticamente removidos/anonimizados:
- Emails: `user@example.com` → `***@***`
- Tokens: `Bearer abc123` → `Bearer ***`
- UUIDs: `123e4567-...` → `***-uuid-***`
- Senhas: Removidas completamente

---

## Integração com Edge Functions

### Logging Padrão:

Todas as Edge Functions incluem:
- `auditLog()` - Log estruturado com PII scrubbing
- Duração da requisição
- Status (sucesso/falha)
- Contexto relevante (jobId, userId, etc.)

**Exemplo:**
```typescript
const startTime = Date.now();
// ... processamento ...
const duration = Date.now() - startTime;
auditLog("transform_text_success", {
  transformationId,
  duration,
  tokens: usage?.total_tokens,
});
```

---

## Monitoramento de Saúde

### Health Check Endpoint:

**URL:** `/api/health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-08T10:00:00Z",
  "services": {
    "database": "healthy",
    "storage": "healthy",
    "openai": "healthy"
  }
}
```

---

## Métricas de Negócio

### KPIs Principais:

1. **Taxa de Conversão:**
   - Signup → Primeira Transformação: Meta > 30%

2. **Engajamento:**
   - Transformações por usuário ativo: Meta > 5/mês

3. **Satisfação:**
   - Taxa de sucesso de jobs: Meta > 95%

4. **Performance:**
   - Tempo médio de transformação: Meta < 10s

---

## Checklist de Configuração

- [ ] Sentry configurado e testado
- [ ] LogRocket configurado e testado
- [ ] Dashboards criados
- [ ] Alertas configurados
- [ ] Health check endpoint implementado
- [ ] PII scrubbing validado
- [ ] Logs estruturados funcionando

---

## Referências

- [Sentry Docs](https://docs.sentry.io/)
- [LogRocket Docs](https://docs.logrocket.com/)
- [Supabase Logs](https://supabase.com/docs/guides/platform/logs)

---

**Última Atualização:** 2025-01-08

