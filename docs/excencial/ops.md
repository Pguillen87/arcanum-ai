# Arcanum AI — Operações, Observabilidade e SLOs

## Observabilidade
- Logs estruturados por job (`jobId`, `type`, `status`, `duration`, `cost`).
- Métricas: tempo de transmutação, taxa de erro por operação, consumo de créditos, filas.
- Tracing de jobs e dependências (upload → transcrição → transformação → exportação).
- Dashboards para throughput, latência e falhas.

## SLOs (propostos)
- Texto → Post: TMT (tempo médio) < 10–15s, erro < 2%.
- Áudio → Transcrição (30 min): conclusão < 5–7 min, erro < 3%.
- Vídeo longo (60 min) → cortes: preview < 10 min; render final conforme fila.
- Webhooks de pagamento: processamento < 30s; idempotência garantida.

## Filas e Reprocessamento
- Estados: `queued`, `processing`, `completed`, `failed`.
- Retries exponenciais (máx. 3) e marcação de erros permanentes.
- Idempotência por `jobId` e `assetId`.
- Reprocessamento sob demanda com retenção de contexto.

## Operação e Suporte
- Alertas: erro acima de limiar, fila acima de `N`, tempo médio acima do SLO.
- Runbooks: transcrição lenta, falhas de render, instabilidade de provider.
- Custos: monitorar custo por request IA (< 20% receita unitária).