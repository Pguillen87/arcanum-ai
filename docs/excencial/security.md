# Arcanum AI — Segurança e Privacidade

## Princípios
- RLS (Row Level Security) para todas as tabelas sensíveis.
- Criptografia de dados sensíveis (em repouso e em trânsito).
- Sanitização de inputs e auditoria de ações críticas.

## RLS (exemplos)
- Políticas por `user_id` (e `organization_id` se multi‑tenant):
  - `assets`, `projects`, `transformations`, `transcriptions`, `credits`, `payments`.
- Acesso de leitura/escrita estritamente ao proprietário e papéis autorizados.

## LGPD/GDPR
- Consentimento para processamento de dados.
- Exportação de dados do usuário em 1 clique.
- Exclusão de conta e remoção de dados pessoais.
- Retenção e minimização: guardar apenas o necessário; políticas de expiração.

## Webhooks & Idempotência
- Assinatura/verificação de origem (Stripe/Mercado Pago).
- Idempotência por `eventId` para evitar duplicidade em créditos/pagamentos.

## Logs & Auditoria
- Registro de login/logout, compras de créditos, transformações e falhas.
- Trilhas de auditoria para alterações em `profiles` e configurações.