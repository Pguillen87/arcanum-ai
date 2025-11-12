# T-001 — Análise de Escalabilidade e Performance para Arcanum AI

🎯 **Objective:**
Analisar se a estrutura atual (Supabase gerenciado + VPS com EasyPanel) suporta crescimento e oferecer recomendações concretas de arquitetura, otimização e plano de ação para escalar com eficiência.

📋 **Acceptance Criteria:**
- Análise detalhada de comportamento com aumento de carga (CPU, memória, rede, I/O).
- Lista de gargalos potenciais e soluções técnicas para concorrência e recursos críticos.
- Recomendações de otimização específicas (DB, caching, filas, transcodificação, transcrição).
- Plano de próximos passos para testes de carga, dimensionamento de VPS e POC de Whisper.

🚫 **Scope Boundaries (CRITICAL):**
- **Included:** análise arquitetural, recomendações e plano de ação. Não inclui implementação automática de mudanças.
- **Excluded:** deployment automático de infra, mudanças de código sem aprovação explícita.
- **Clarification Required:** acesso a métricas atuais (usage do Supabase: requests/s, storage, número de usuários ativos), especificações da VPS (vCPU, RAM, disco, banda), e volume esperado de uploads/transcrições por dia.

🔧 **Technical Requirements:**
- Revisar `src/integrations/supabase/client.ts` e diretório `supabase/` para entender acoplamento.
- Avaliar opções: Supabase SaaS vs self-host vs Postgres+API.
- Recomendar tecnologias: Redis, MinIO, Celery/BullMQ, nginx/traefik, Prometheus/Grafana.

📁 **Files/Components:**
- Review: `src/integrations/supabase/client.ts` (already present)
- Review: `supabase/migrations/` and `supabase/functions/`
- Deliverable: `docs/operations/scale-plan.md` (create if approved)

🧪 **Testing Requirements:**
- Load tests (k6 or Artillery) para endpoints críticos (uploads, transcriptions, transforms).
- Testes de carga para Postgres (pgbench) e simulações de workers (concurrency).
- Métricas: CPU, memória, I/O, latência 95/99 percentis, erros/segundos.

⚠️ **Edge Cases:**
- Picos massivos (ex.: campanhas promocionais) — mitigar com rate limiting e circuit breakers.
- Uploads malformados e grandes arquivos — usar chunked uploads e validação no edge.
- Falha da VPS única — plano de rollback para Supabase SaaS.

📚 **Dependencies:** None (pesquisa inicial).
