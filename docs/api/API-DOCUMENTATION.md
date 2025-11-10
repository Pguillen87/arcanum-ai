# Documentação de APIs — Arcanum AI

**Versão:** 1.0  
**Data:** 2025-01-08  
**Base URL:** `https://giozhrukzcqoopssegby.supabase.co/functions/v1`

---

## Visão Geral

A API Arcanum AI é composta por Edge Functions do Supabase que processam transformações de conteúdo, transcrições e gerenciam autenticação e pagamentos.

### Autenticação

Todas as requisições (exceto webhooks) requerem autenticação via Bearer Token:

```http
Authorization: Bearer <access_token>
```

O token é obtido via Supabase Auth (`signIn`, `signUp`, `signInWithGoogle`).

---

## Edge Functions

### 1. `/username-login`

**Descrição:** Login por username (alternativa ao email)

**Método:** `POST`

**Request Body:**
```json
{
  "username": "usuario123",
  "password": "senha123"
}
```

**Response Success (200):**
```json
{
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_in": 3600,
    "token_type": "bearer"
  }
}
```

**Response Errors:**
- `400` - Credenciais ausentes
- `401` - Credenciais inválidas
- `404` - Username não encontrado
- `429` - Rate limit excedido (5 tentativas por 15 minutos)

**Características:**
- Rate limiting por IP e username
- PII scrubbing em logs
- Auditoria de tentativas

**Exemplo:**
```bash
curl -X POST https://giozhrukzcqoopssegby.supabase.co/functions/v1/username-login \
  -H "Content-Type: application/json" \
  -d '{"username": "usuario123", "password": "senha123"}'
```

---

### 2. `/transform_text`

**Descrição:** Transforma texto em diferentes formatos (post, resumo, newsletter, roteiro)

**Método:** `POST`

**Headers:**
- `Authorization: Bearer <token>` (obrigatório)
- `Idempotency-Key: <key>` (opcional, para idempotência)

**Request Body:**
```json
{
  "projectId": "uuid-do-projeto",
  "type": "text_to_post",
  "inputText": "Texto a ser transformado...",
  "sourceAssetId": "uuid-do-asset", // Opcional (alternativa a inputText)
  "tone": "formal", // Opcional
  "length": "short", // Opcional: "short" | "long"
  "brandVoice": { // Opcional (busca do perfil se não fornecido)
    "tone": "profissional",
    "style": "formal",
    "examples": ["exemplo 1"],
    "preferences": {
      "length": "medium",
      "formality": "neutral",
      "creativity": "medium"
    }
  },
  "idempotencyKey": "chave-unica" // Opcional
}
```

**Tipos de Transformação:**
- `text_to_post` - Post para redes sociais
- `text_to_resumo` - Resumo objetivo
- `text_to_newsletter` - Newsletter profissional
- `text_to_roteiro` - Roteiro estruturado

**Response Success (200):**
```json
{
  "jobId": "uuid-do-job",
  "status": "completed",
  "output": {
    "text": "Texto transformado...",
    "variants": ["Texto transformado..."]
  }
}
```

**Response Errors:**
- `400` - Parâmetros inválidos
- `401` - Não autenticado
- `404` - Projeto não encontrado
- `500` - Erro interno

**Características:**
- Busca `brand_voice` automaticamente do perfil se não fornecido
- Débito de créditos apenas após entrega (`status: completed`)
- Idempotência via `Idempotency-Key` header
- PII scrubbing em logs

**Exemplo:**
```bash
curl -X POST https://giozhrukzcqoopssegby.supabase.co/functions/v1/transform_text \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-key-123" \
  -d '{
    "projectId": "uuid",
    "type": "text_to_post",
    "inputText": "Meu texto..."
  }'
```

---

### 3. `/transcribe_audio`

**Descrição:** Transcreve áudio/vídeo usando OpenAI Whisper

**Método:** `POST`

**Headers:**
- `Authorization: Bearer <token>` (obrigatório)
- `Idempotency-Key: <key>` (opcional)

**Request Body:**
```json
{
  "projectId": "uuid-do-projeto",
  "assetId": "uuid-do-asset-audio",
  "language": "pt" // Opcional, padrão: "pt"
}
```

**Response Success (200):**
```json
{
  "jobId": "uuid-do-job",
  "status": "completed",
  "text": "Texto transcrito do áudio..."
}
```

**Response Errors:**
- `400` - Parâmetros inválidos
- `401` - Não autenticado
- `404` - Asset não encontrado
- `500` - Erro interno

**Características:**
- Suporta formatos: mp3, wav, m4a, mp4
- Débito de créditos após entrega
- Idempotência via `Idempotency-Key`
- Notificações automáticas (sucesso/falha/débito)

**Exemplo:**
```bash
curl -X POST https://giozhrukzcqoopssegby.supabase.co/functions/v1/transcribe_audio \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "uuid",
    "assetId": "uuid-do-audio",
    "language": "pt"
  }'
```

---

### 4. `/video_short`

**Descrição:** Gera vídeos curtos a partir de vídeo longo (mock inicial)

**Método:** `POST`

**Headers:**
- `Authorization: Bearer <token>` (obrigatório)
- `Idempotency-Key: <key>` (opcional)

**Request Body:**
```json
{
  "projectId": "uuid-do-projeto",
  "assetId": "uuid-do-asset-video",
  "options": {
    "maxDuration": 60, // segundos
    "includeSubtitles": true
  }
}
```

**Response Success (200):**
```json
{
  "jobId": "uuid-do-job",
  "status": "completed",
  "outputs": {
    "videoUrl": "url-do-video-gerado.mp4"
  }
}
```

**Status:** ⚠️ Mock inicial (não processa vídeo real ainda)

---

### 5. `/payments/webhooks`

**Descrição:** Endpoint para receber webhooks de provedores de pagamento

**Método:** `POST`

**Headers:**
- `X-Webhook-Signature: <signature>` (verificação de origem)
- `Content-Type: application/json`

**Request Body (exemplo Stripe):**
```json
{
  "event_id": "evt_123456",
  "provider": "stripe",
  "type": "payment_intent.succeeded",
  "data": {
    "user_id": "uuid-do-usuario",
    "amount_cents": 1000,
    "currency": "BRL"
  }
}
```

**Response Success (200):**
```json
{
  "received": true,
  "eventId": "evt_123456"
}
```

**Características:**
- Verificação de assinatura (segurança)
- Idempotência por `event_id`
- Reconciliação automática (crédito de créditos, atualização de assinatura)
- PII scrubbing em logs

**Tipos de Eventos Suportados:**
- `payment_intent.succeeded` - Pagamento aprovado
- `payment_intent.failed` - Pagamento falhou
- `charge.refunded` - Reembolso

---

## Códigos de Erro Padrão

### Códigos Comuns:

- `AUTH_401` - Não autenticado
- `AUTH_403` - Não autorizado
- `VALIDATION_400` - Parâmetros inválidos
- `NOT_FOUND_404` - Recurso não encontrado
- `RATE_LIMIT_429` - Rate limit excedido
- `IDEMPOTENT` - Operação já executada (mesmo idempotency_key)
- `INT_500` - Erro interno do servidor

### Formato de Erro:

```json
{
  "code": "VALIDATION_400",
  "message": "Parâmetros inválidos",
  "error": "projectId é obrigatório"
}
```

---

## Idempotência

Todas as operações que modificam estado suportam idempotência via header `Idempotency-Key`:

```http
Idempotency-Key: unique-key-123
```

**Comportamento:**
- Primeira requisição: processa normalmente
- Requisições subsequentes com mesma chave: retorna resultado da primeira (sem reprocessar)

**Exemplo:**
```bash
# Primeira chamada
curl -X POST ... -H "Idempotency-Key: abc123"
# Retorna: { "jobId": "job-1", ... }

# Segunda chamada (mesma chave)
curl -X POST ... -H "Idempotency-Key: abc123"
# Retorna: { "code": "IDEMPOTENT", "jobId": "job-1", ... }
```

---

## Rate Limiting

### `/username-login`:
- **Limite:** 5 tentativas por 15 minutos
- **Escopo:** Por IP e por username
- **Response:** `429 Too Many Requests`

### Outras Edge Functions:
- Rate limiting pode ser configurado conforme necessidade
- Recomendado: 100 requisições por minuto por usuário

---

## CORS

Todas as Edge Functions retornam headers CORS:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, Idempotency-Key
```

---

## Observabilidade

### Logs:
- Todas as Edge Functions fazem log estruturado
- PII (emails, senhas, tokens) são removidos automaticamente
- Logs incluem: `jobId`, `duration`, `status`, `error`

### Auditoria:
- Eventos críticos são registrados em `audit_logs` (se configurado)
- Inclui: autenticação, transformações, débitos de créditos

---

## PostgREST Endpoints

Além das Edge Functions, a API expõe endpoints PostgREST para acesso direto às tabelas:

### Base URL:
```
https://giozhrukzcqoopssegby.supabase.co/rest/v1
```

### Endpoints Principais:

- `GET /projects` - Listar projetos do usuário autenticado
- `POST /projects` - Criar projeto
- `GET /assets` - Listar assets do usuário autenticado
- `GET /transformations` - Listar transformações do usuário
- `GET /transcriptions` - Listar transcrições do usuário
- `GET /credits` - Obter saldo de créditos
- `GET /notifications` - Listar notificações do usuário

**Autenticação:** Via header `Authorization: Bearer <token>`

**RLS:** Todas as tabelas têm RLS owner-only (usuário só acessa seus próprios dados)

---

## Exemplos de Uso

### Fluxo Completo: Transformação de Texto

```typescript
// 1. Autenticar
const { data: { session } } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// 2. Criar projeto (se necessário)
const { data: project } = await supabase
  .from('projects')
  .insert({ name: 'Meu Projeto' })
  .select()
  .single();

// 3. Transformar texto
const response = await fetch(
  'https://giozhrukzcqoopssegby.supabase.co/functions/v1/transform_text',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `transform-${Date.now()}`
    },
    body: JSON.stringify({
      projectId: project.id,
      type: 'text_to_post',
      inputText: 'Meu texto a transformar...'
    })
  }
);

const result = await response.json();
console.log(result.output.text);
```

---

## Referências

- **OpenAPI Spec:** `docs/api/openapi-v1.yaml`
- **Supabase Docs:** https://supabase.com/docs
- **Edge Functions:** https://supabase.com/docs/guides/functions

---

**Última Atualização:** 2025-01-08

