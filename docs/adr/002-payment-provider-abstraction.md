# ADR 002: Abstração de Provedor de Pagamentos

## Status
Aceito

## Contexto
A plataforma precisa suportar múltiplos provedores de pagamento (Stripe, Mercado Pago) para atender diferentes mercados. A integração deve ser flexível e permitir troca de provedor sem refatoração significativa.

## Decisão
Implementar uma camada de abstração genérica que:
1. Define interface comum para eventos de pagamento
2. Processa webhooks de forma idempotente via Edge Function
3. Armazena metadados do provedor em `payments.metadata`
4. Permite múltiplos provedores simultaneamente

## Consequências

### Positivas
- Flexibilidade para adicionar novos provedores
- Idempotência garantida via `event_id` único
- Fácil migração entre provedores
- Suporte a múltiplos provedores simultaneamente

### Negativas
- Abstração pode ocultar features específicas de cada provedor
- Requer mapeamento de eventos entre provedores
- Pode precisar de lógica específica por provedor no futuro

## Implementação
- Edge Function `payments/webhooks` processa eventos genéricos
- Tabela `payments` armazena `provider` e `event_id` para idempotência
- Service `paymentsService` fornece interface unificada
- Integração específica de cada provedor pode ser adicionada posteriormente

