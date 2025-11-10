# ADR 003: Sistema de Ledger para Créditos

## Status
Aceito

## Contexto
Precisa-se de um sistema justo de créditos que:
1. Cobra apenas após entrega concluída
2. Garante idempotência
3. Mantém auditoria completa
4. Previne saldo negativo

## Decisão
Implementar sistema de ledger com duas tabelas:
- **credits**: Saldo atual (cache para performance)
- **credit_transactions**: Ledger imutável (fonte da verdade)

Trigger automático atualiza `credits.balance` a partir de `credit_transactions`.

## Consequências

### Positivas
- Auditoria completa via ledger
- Idempotência garantida (unique constraint)
- Performance otimizada (saldo em cache)
- Prevenção de saldo negativo (check constraint + trigger)

### Negativas
- Complexidade adicional (duas tabelas)
- Necessidade de sincronização via trigger
- Possível inconsistência se trigger falhar (mitigado com transações)

## Implementação
- Constraint único em `(user_id, ref_type, ref_id)` para idempotência
- Trigger `apply_credit_transaction()` atualiza saldo automaticamente
- Check constraint garante `balance >= 0`
- Service `creditsService` abstrai lógica de negócio

