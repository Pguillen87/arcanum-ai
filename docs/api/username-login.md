# API: username-login

Edge Function para autenticação por nome de usuário sem expor email ao cliente.

## Endpoint

```
POST /functions/v1/username-login
```

## Autenticação

Não requer autenticação (endpoint público).

## Rate Limit

- **Limite**: 5 tentativas por 15 minutos
- **Escopo**: Por IP e por username
- **Resposta 429**: Inclui header `Retry-After` com segundos até reset

## Request

### Headers

```
Content-Type: application/json
```

### Body

```json
{
  "username": "string",
  "password": "string"
}
```

**Campos:**
- `username` (string, obrigatório): Nome de usuário (case-insensitive)
- `password` (string, obrigatório): Senha do usuário

## Response

### Sucesso (200)

```json
{
  "session": {
    "access_token": "string",
    "refresh_token": "string",
    "expires_in": 3600,
    "expires_at": 1234567890,
    "token_type": "bearer",
    "user": {
      "id": "uuid",
      "email": "string",
      // ... outros campos do usuário
    }
  }
}
```

### Erros

#### 400 - Validação

```json
{
  "code": "VAL_400",
  "message": "Credenciais obrigatórias"
}
```

#### 401 - Credenciais Inválidas

```json
{
  "code": "AUTH_401",
  "message": "Credenciais inválidas"
}
```

#### 404 - Usuário Não Encontrado

```json
{
  "code": "AUTH_404",
  "message": "Usuário não encontrado"
}
```

#### 405 - Método Não Suportado

```json
{
  "code": "VAL_405",
  "message": "Método não suportado"
}
```

#### 429 - Rate Limit Excedido

```json
{
  "code": "RATE_429",
  "message": "Muitas tentativas. Tente novamente mais tarde.",
  "resetAt": 1234567890
}
```

Headers:
- `Retry-After`: Segundos até poder tentar novamente

#### 500 - Erro Interno

```json
{
  "code": "INT_500",
  "message": "Erro interno"
}
```

## Segurança

- **Email não exposto**: O email do usuário nunca é retornado na resposta
- **Auditoria sem PII**: Logs são scrubbed (emails, tokens, UUIDs mascarados)
- **Rate limiting**: Proteção contra brute force
- **CORS**: Configurado para permitir requisições do frontend

## Exemplo de Uso

```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/username-login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'meu_usuario',
    password: 'minha_senha',
  }),
});

if (response.ok) {
  const { session } = await response.json();
  // Usar session.access_token para autenticar requisições
} else {
  const error = await response.json();
  console.error(error.message);
}
```

## Notas de Implementação

- Usa service role internamente para lookup de email
- Rate limit implementado em memória (KV recomendado para produção)
- Auditoria registra eventos sem PII (emails/tokens mascarados)

