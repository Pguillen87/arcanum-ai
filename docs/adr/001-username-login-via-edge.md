# ADR 001: Autenticação por Username via Edge Function

## Status

Aceito

## Contexto

O Supabase Auth suporta autenticação por email/senha nativamente, mas não por username. Para permitir que usuários façam login usando seu nome de usuário (sem expor o email), precisamos de uma solução customizada.

## Decisão

Implementar uma Edge Function (`username-login`) que:
1. Recebe `username` e `password` do cliente
2. Usa service role para fazer lookup do email via tabela `profiles`
3. Executa `signInWithPassword` usando o email encontrado
4. Retorna a sessão sem expor o email ao cliente

## Alternativas Consideradas

### 1. Modificar GoTrue diretamente
- **Prós**: Solução nativa
- **Contras**: Requer fork do Supabase, manutenção complexa, não escalável

### 2. RPC no banco de dados
- **Prós**: Mais simples que Edge Function
- **Contras**: Não pode executar `signInWithPassword` (requer client Supabase), menos flexível para rate limit/auditoria

### 3. Edge Function (escolhida)
- **Prós**: Isolamento, rate limit, auditoria, não expõe email, usa service role apenas no servidor
- **Contras**: Endpoint adicional para manter

## Consequências

### Positivas
- Usuários podem fazer login sem expor email
- Rate limiting e auditoria centralizados
- Segurança: service role nunca exposta ao cliente
- Flexibilidade para adicionar features (2FA, etc)

### Negativas
- Endpoint adicional para manter e testar
- Dependência de Edge Functions do Supabase
- Rate limit em memória (KV recomendado para produção)

## Implementação

- Edge Function: `supabase/functions/username-login/index.ts`
- Rate limit: 5 tentativas por 15 minutos (por IP e username)
- Auditoria: Logs scrubbed (sem PII)
- CORS: Configurado para frontend

## Referências

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Auth Admin API](https://supabase.com/docs/reference/javascript/auth-admin-api)

