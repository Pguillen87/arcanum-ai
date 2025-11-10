# Dashboards e Métricas - Arcanum AI

## Visão Geral

Este documento descreve os dashboards e métricas essenciais para monitoramento da plataforma Arcanum AI.

## Dashboards Principais

### 1. Dashboard de Operações

**Métricas Principais:**
- Taxa de sucesso de transformações (texto, áudio, vídeo)
- Tempo médio de processamento por tipo
- Taxa de erro por Edge Function
- Throughput de jobs (jobs/minuto)

**Alertas:**
- Taxa de erro > 5% em qualquer Edge Function
- Tempo de processamento > SLO (texto: 15s, transcrição: 7min, vídeo: 10min)
- Falhas consecutivas > 3

### 2. Dashboard de Créditos e Pagamentos

**Métricas Principais:**
- Saldo total de créditos em circulação
- Taxa de conversão de pagamentos
- Valor médio de transação
- Taxa de reembolso
- Assinaturas ativas vs canceladas

**Alertas:**
- Taxa de reembolso > 10%
- Falhas de webhook de pagamento
- Discrepâncias entre créditos creditados e pagamentos aprovados

### 3. Dashboard de Usuários

**Métricas Principais:**
- Novos usuários por dia/semana
- Taxa de retenção (D1, D7, D30)
- Uso médio de créditos por usuário
- Distribuição de planos de assinatura

**Alertas:**
- Queda súbita em novos usuários
- Taxa de retenção D1 < 40%

### 4. Dashboard de Performance

**Métricas Principais:**
- Latência de API (p50, p95, p99)
- Taxa de erro HTTP por endpoint
- Uso de recursos (CPU, memória, storage)
- Throughput de requisições

**Alertas:**
- Latência p95 > 2s
- Taxa de erro HTTP > 1%
- Uso de storage > 80% da capacidade

### 5. Dashboard de Transcrição de Áudio

**Métricas Principais:**
- Volume diário de jobs por status (`queued`, `processing`, `completed`, `failed`)
- Tempo médio entre `queued → completed` (percentis p50/p95)
- Taxa de falha por motivo (`validation`, `upload`, `transcription`, `unexpected`)
- Tempo médio até a primeira transformação automática (quando habilitada)
- Distribuição dos motivos de desabilitação do botão (capturados via tooltip para UX)

**Fontes / Eventos:**
- Frontend: `audio_transcription_attempt`, `audio_transcription_status_update`, `audio_transcription_success`, `audio_transcription_failure`, `metric.audio_transcription_success_rate`
- Supabase Edge Function: logs estruturados da função `transcribe_audio` e métricas de storage/CPU

**Alertas Recomendados:**
- `audio_transcription_success_rate` < 90% em 15 minutos
- Jobs `processing` há mais de 10 minutos sem atualização de status
- Crescimento anormal de `audio_transcription_validation_failure` (validar limites de upload e formatos)

**Observabilidade Complementar:**
- Dashboard Supabase → monitorar `transcriptions.status` com filtros por `project_id` e `user_id`
- Tracing (Sentry) com `traceId` propagado do frontend para Edge Function
- Logs agregados no BigQuery/Supabase Analytics para correlacionar personagem, idioma e tempo de processamento

## Métricas de Negócio

### KPIs Principais
- **MRR (Monthly Recurring Revenue)**: Receita recorrente mensal
- **Churn Rate**: Taxa de cancelamento de assinaturas
- **LTV (Lifetime Value)**: Valor médio do cliente ao longo do tempo
- **CAC (Customer Acquisition Cost)**: Custo de aquisição de cliente
- **Credit Utilization**: Taxa de uso de créditos comprados

## Implementação

### Ferramentas Recomendadas
- **Sentry**: Rastreamento de erros e performance
- **LogRocket**: Sessões de usuário e replay
- **Supabase Dashboard**: Métricas de banco de dados
- **Vercel Analytics**: Métricas de frontend (se usando Vercel)

### Configuração de Alertas

Os alertas devem ser configurados via:
1. Sentry Alerts (para erros e performance)
2. Supabase Alerts (para métricas de banco)
3. Webhooks customizados (para métricas de negócio)

### Retenção de Dados

- Logs de erro: 90 dias
- Métricas de performance: 30 dias (agregadas)
- Métricas de negócio: 1 ano (agregadas)

## Próximos Passos

1. Configurar Sentry com DSN
2. Configurar LogRocket (opcional)
3. Criar dashboards no Supabase
4. Implementar webhooks de alerta
5. Configurar monitoramento de SLOs

