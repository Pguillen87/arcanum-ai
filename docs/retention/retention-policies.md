# Políticas de Retenção e Limpeza - Arcanum AI

## Visão Geral

Este documento descreve as políticas de retenção de dados implementadas para conformidade com LGPD/GDPR e otimização de performance.

## Políticas de Retenção

### Dados de Usuário Ativo
- **Profiles**: Mantidos enquanto usuário estiver ativo
- **Projects**: Mantidos enquanto usuário estiver ativo
- **Assets**: Mantidos enquanto projeto existir
- **Transformations/Transcriptions**: Mantidos enquanto projeto existir

### Dados de Usuário Inativo
- **Após 2 anos de inatividade**: Usuário pode ser arquivado
- **Após 3 anos de inatividade**: Dados podem ser deletados (após notificação)

### Jobs Completados
- **Transformations completadas**: Arquivar após 1 ano
- **Transcriptions completadas**: Arquivar após 1 ano
- **Jobs falhados**: Manter por 30 dias para análise

### Dados Financeiros
- **Payments**: Retenção mínima de 5 anos (conformidade fiscal)
- **Credit Transactions**: Retenção mínima de 5 anos
- **Subscriptions**: Retenção mínima de 5 anos

### Logs e Auditoria
- **Logs de erro**: 90 dias
- **Logs de auditoria**: 1 ano
- **Métricas agregadas**: 1 ano

## Implementação

### Funções Disponíveis

1. **cleanup_orphaned_data()**
   - Limpa dados órfãos (sem referências válidas)
   - Executar manualmente ou via cron job

2. **archive_old_completed_jobs()**
   - Arquiva jobs completados há mais de 1 ano
   - Retorna contagem de jobs arquivados
   - Executar mensalmente

3. **delete_user_data(user_id)**
   - Deleta todos os dados de um usuário (LGPD)
   - Requer confirmação explícita
   - Executar apenas após solicitação do usuário

### Agendamento Recomendado

```sql
-- Executar semanalmente
SELECT public.cleanup_orphaned_data();

-- Executar mensalmente
SELECT public.archive_old_completed_jobs();
```

### Conformidade LGPD/GDPR

- **Direito ao esquecimento**: Função `delete_user_data()` implementada
- **Exportação de dados**: Implementar via API (futuro)
- **Consentimento**: Gerenciado via `protection_settings`
- **Retenção mínima**: Respeitada conforme políticas acima

## Próximos Passos

1. Implementar tabela de arquivo para dados antigos
2. Criar API para exportação de dados (LGPD)
3. Configurar cron jobs para limpeza automática
4. Implementar notificações antes de deletar dados inativos

