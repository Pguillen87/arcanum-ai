# Documentação de API - Arcanum AI

## Visão Geral

Esta documentação descreve as APIs disponíveis na plataforma Arcanum AI.

## Endpoints Principais

### Edge Functions

Todas as Edge Functions estão disponíveis em:
`https://giozhrukzcqoopssegby.supabase.co/functions/v1/{function-name}`

#### 1. Transformação de Texto
- **Endpoint**: `/transform_text`
- **Método**: POST
- **Documentação**: Ver `openapi-v1.yaml`

#### 2. Transcrição de Áudio
- **Endpoint**: `/transcribe_audio`
- **Método**: POST
- **Documentação**: Ver `openapi-v1.yaml`

#### 3. Vídeo Curto
- **Endpoint**: `/video_short`
- **Método**: POST
- **Documentação**: Ver `openapi-v1.yaml`

#### 4. Webhooks de Pagamento
- **Endpoint**: `/payments/webhooks`
- **Método**: POST
- **Documentação**: Ver `openapi-v1.yaml`

#### 5. Login com Username
- **Endpoint**: `/username-login`
- **Método**: POST
- **Documentação**: Ver `username-login.md`

## Contrato OpenAPI

O contrato completo está disponível em `openapi-v1.yaml`.

## Autenticação

Todas as APIs requerem autenticação via Supabase Auth:
- Header: `Authorization: Bearer {jwt_token}`
- Token obtido via `supabase.auth.getSession()`

## Idempotência

APIs que criam recursos suportam idempotência via:
- Header: `Idempotency-Key: {unique-key}`
- Ou parâmetro: `idempotencyKey` no body

## Rate Limiting

- Edge Functions: 5 requisições por 15 minutos por IP/usuário
- APIs de autenticação: Rate limit adicional

## Códigos de Erro

- `VAL_400`: Erro de validação
- `VAL_405`: Método não suportado
- `AUTH_404`: Usuário não encontrado
- `ASSET_404`: Asset não encontrado
- `PROJECT_404`: Projeto não encontrado
- `RATE_429`: Rate limit excedido
- `IDEMPOTENT`: Requisição idempotente (retorna recurso existente)
- `INT_500`: Erro interno

## Exemplos

Ver documentação específica de cada endpoint em:
- `username-login.md`
- `openapi-v1.yaml`

