# Análise Detalhada - Organização de Transcrições em Cofres Arcanos

## 1. Contexto e Objetivo
- Evoluir o conceito atual de "projeto" para um contêiner mais inteligente (Cofre Arcano) que agrupe transcrições, transformações e ativos relacionados.
- Entregar uma experiência de organização dinâmica para usuários que lidam com conteúdos recorrentes (reuniões, campanhas, roteiros) dentro da esfera Essência/Energia.
- Manter aderência aos princípios de design místico e prover estrutura escalável para futuras automações (insights, curadoria com IA).

## 2. Visão Geral da Solução
- **Cofre Arcano (projects)**: entidade principal com metadados enriquecidos (cor, ícone/sigilo, personagem guardião, último acesso, contagem de itens).
- **Filamentos**: sub-agrupamentos temáticos dentro do cofre, com regras automáticas (tags, origem, idioma), permitindo organização viva sem esforço manual constante.
- **Timeline Mágica**: linha do tempo hierarquizada que exibe transcrições e transformações vinculadas, com filtros avançados (personagem, sentimento, tags alquímicas).
- **Painel de Insights**: visão lateral para highlights, ações rápidas (fixar, favoritar, gerar resumo), e ligação direta com teleprompter/transformações.

## 3. Arquitetura Técnica Proposta
### 3.1 Banco de Dados (Supabase)
- **Tabela `projects`**
  - Novos campos: `theme_color`, `sigil_icon`, `guardian_character_id`, `metadata` JSONB, `last_accessed_at`.
  - Políticas RLS já existentes continuam válidas (user_id obrigatório).
- **Tabela `transcription_history`**
  - Acrescentar `project_id` (FK -> projects) e `filament_id` (FK opcional) + `tags` (`text[]`).
  - Índices: `(project_id, created_at DESC)` + GIN em `tags`.
- **Tabela `project_filaments`** *(nova)*
  - Campos: `id`, `project_id`, `name`, `rules` (JSONB descrevendo filtros automáticos), `color`, `order`, `created_at`.
  - RLS alinhada ao `project_id`.
- **Tabela `transcription_links`** *(nova opcional)*
  - Relaciona transcrição com transformações/teleprompter gerados a partir dela (`source_transcription_id`, `target_entity`, `target_id`).
- **Busca Semântica**
  - Avaliar uso de `pgvector` com embeddings das transcrições (já temos tabela de embeddings para characters — podemos reutilizar pipeline ou criar `transcription_embeddings`).
  - Alternativa inicial: `tsvector` + índices full-text para custo reduzido.

### 3.2 Camada de Serviços
- **ProjectsService / FilamentsService**
  - Endpoints para CRUD de cofres e filamentos.
  - Função de classificação automática: ao salvar transcrição, aplicar regras dos filamentos (ex.: `rules.tags` contém `briefing`).
  - Atualizar `last_accessed_at` e contadores ao abrir um cofre ou vincular novas transcrições.
- **Transcription Pipeline**
  - Ao completar transcrição: exigir `project_id` (usuario escolhe) ou oferecer padrão via guardião.
  - Enfileirar job para gerar embeddings / highlights em background.
- **Insights Engine**
  - Edge Function opcional para gerar resumos temáticos (chamada manual via UI).

### 3.3 Frontend
- **Lista de Cofres**
  - Cards com sigilo, cor, contagem de transcrições, personagem guardião, último acesso.
  - Ações rápidas: criar, duplicar, arquivar.
- **Página do Cofre (`/essencia/cofres/:id`)**
  - **Sidebar**: filamentos (com contagem), tags frequentes, personagens ativos.
  - **Área central**: timeline em cards (data, título, origem, chips de tags). Suporte a drag & drop entre filamentos.
  - **Painel direito**: detalhes do item selecionado (transcrição + transformações derivadas + botões de ações).
  - **Top bar**: busca semântica, filtros (personagem, idioma, status), botão “Gerar Insight”.
- **Modal de Nova Transcrição**
  - Selecionar cofre + filamento antes de iniciar upload/transformação.
  - Sugestão automática do projeto padrão do personagem guardião.

## 4. Experiência do Usuário
| Necessidade | Solução | Benefício |
|-------------|---------|-----------|
| Localizar rapidamente transcrição específica | Busca semântica + filtros multidimensionais | Menos tempo em buscas manuais |
| Manter histórico organizado ao longo de campanhas | Filamentos com regras automáticas | Organização contínua sem esforço |
| Compartilhar contexto completo com equipe | Cofre reúne transcrição, transformações e notas | Comunicação mais eficiente |
| Retomar trabalho com mesma voz/personagem | Guardião define personagem padrão e highlights | Consistência narrativa |
| Priorizar itens críticos | Favoritos/âncoras + status visual | Foco no importante |

## 5. Roadmap de Implementação
1. **Fase 1 – Fundamentos**
   - Atualizar tabela `projects` com campos adicionais.
   - Adicionar `project_id` em `transcription_history` + migração para dados existentes.
   - UI mínima: escolher cofre ao criar transcrição, listar na timeline simples.
2. **Fase 2 – Filamentos e Tags**
   - Criar `project_filaments` e regras básicas (match por tags/idioma/origem).
   - UI: sidebar com filamentos + drag & drop manual.
3. **Fase 3 – Painel Avançado**
   - Implementar painel lateral com transformações vinculadas e highlights.
   - Suporte a favoritos, status e notas rápidas.
4. **Fase 4 – Busca Semântica e Insights**
   - Integrar embeddings + busca por intenção.
   - Edge Function para gerar insights/resumos por cofre.

## 6. Riscos e Mitigações
- **Complexidade das Regras Automáticas**: começar simples (apenas tags/idioma) e evoluir.
- **Custo de Armazenamento/Busca**: avaliar volume real antes de indexar com vector; planejar fallback com full-text search.
- **Mudança de UX**: garantir onboarding claro (tooltips, tour) para explicar conceito de cofres/filamentos.
- **Migração de Dados**: script para mapear transcrições existentes a um cofre padrão (ex.: “Cofre Inicial”).

## 7. Próximos Passos
1. Validar com time/demais agentes o conceito de Cofre + Filamentos.
2. Definir quais campos adicionais de projeto são prioritários (cor, sigilo, guardião).
3. Estimar esforço das migrations e atualização de serviços frontend/backend.
4. Após consenso, preparar PRD/EPIC e iniciar Fase 1.

---
_Responsável: GPT-5 Codex • Data: 2025-11-09_

---

## Especialidade: Engenharia de Software Escalável

### Avaliação Arquitetural Profunda
- **Coesão de Domínio**: Promover uma camada de domínio explícita separando entidades (Cofre, Filamento, Transcrição, Transformação). Sugiro modelar casos de uso (`AssignTranscriptionToFilament`, `GenerateCofreInsight`) para orquestrar regras e facilitar testes.
- **Consistência Transacional**: Operações que criam transcrição + associam a filamento precisam ser executadas em transação para evitar objetos órfãos. Supabase permite `rpc` com `BEGIN/COMMIT` ou uso de Edge Function.
- **Escalabilidade de Leitura**: Timeline com filtros intensos pode usar *materialized view* ou cache reativo (TanStack Query + Websocket) para evitar consultas pesadas. Monitorar custos de `order by created_at` com índices adequados.

### Estratégia de Dados e Migração
- **Backfill Controlado**: Antes de adicionar `NOT NULL` em `project_id`, executar migração incremental (criar coluna nullable, popular com cofre padrão, só depois aplicar constraint). Utilizar scripts SQL idempotentes.
- **Governança de Tags**: `text[]` é flexível, porém sugiro normalizar tags críticas (tabela `project_tags`) para analytics. Manter `text[]` para tags livres e sincronizar com tabela auxiliar.
- **Auditoria**: Tabelas novas devem herdar padrão de auditoria (trigger `set_updated_at`, campos `created_by`). Ajuda na rastreabilidade de quem moveu/alterou transcrição.

### Observabilidade e Operação
- **Métricas-Chave**: instrumentar contagem de transcrições por cofre, tempo médio de processamento, taxa de reenquadramento automático. Usar Observability service existente para dashboards.
- **Alertas RLS**: test cases automáticos garantindo que policies permitem CRUD apenas para owner. Incluir suite de testes (via Supabase CLI `db test` ou k6) para evitar regressões.

### Performance e Custos
- **Busca Semântica**: iniciar com `tsvector` + index GIN (custo zero). Evoluir para `pgvector` apenas quando houver sinal claro de valor. Guardar embeddings em bucket/object storage se optar por pipeline offline.
- **Edge Functions vs. Client**: Processamentos pesados (insights, highlights) devem ir para Edge Function ou serviço workers para não impactar UX. Considerar fila (Supabase Queue, ou vercel cron) para demanda crescente.

### Roadmap Técnico Ajustado
1. **Sprint 1**: Migrations base + adaptação dos serviços (Projects, Transcriptions). Garantir cobertura de testes (`vitest`) para useCases.
2. **Sprint 2**: UI Cofres (lista + timeline simples) + migração de dados antigos com script validado.
3. **Sprint 3**: Filamentos automáticos (service + Edge) + drag & drop.
4. **Sprint 4**: Painel insights, favoritos, integrações com transformações.
5. **Sprint 5**: Pesquisa semântica piloto (tsvector). Monitorar métricas antes de adotar pgvector.

### Recomendações Finais
- Documentar contratos de API (OpenAPI/Supabase docs) para novos endpoints antes de expor UI.
- Criar feature flag para lançamento gradual (habilitar Cofres por usuário). Permite avaliar feedback sem afetar todos imediatamente.
- Planejar retrospectiva após Fase 2 para ajustar backlog conforme feedback dos demais agentes.

_Especialista responsável: GPT-5 Codex (Engenharia de Software Escalável)_

---

## Especialidade: Segurança Corporativa de Dados

### Superfície de Ameaças
- **Exposição de Conteúdo Sensível**: transcrições podem conter PII/segredos; toda API deve garantir RLS por `user_id` e auditar acessos. Avaliar necessidade de criptografia em repouso adicional (ex.: `pgcrypto` + chave gerenciada) para campos críticos.
- **Vazamento via Filamentos Automáticos**: regras mal configuradas podem mover dados para cofres incorretos. Implementar validação de regras com pré-visualização e logs de auditoria para cada alteração.
- **Funções Edge & Insights**: limitar escopo de tokens (service role) e adicionar ratelimiting por usuário para evitar abuso de funções que chamam provedores externos.

### Controles Recomendados
- **RLS Granular**: estender policies para `project_filaments`, `transcription_links` e qualquer view (`brand_profiles_with_characters`) garantindo `auth.uid() = owner`. Criar testes automatizados de RLS (SQL ou PostgREST) antes do deploy.
- **Auditoria Centralizada**: novas tabelas devem registrar `created_by`, `updated_by` via triggers. Registrar eventos críticos em Observability (criação de cofre, mudança de regra, exportações).
- **Gestão de Segredos**: se edge functions forem consumir serviços externos, armazenar secrets via Supabase Secrets com rotação trimestral. Evitar exposição em client bundles.
- **Exportação/Compartilhamento**: qualquer feature de exportar cofre deve aplicar redaction opcional (mascarar e-mails, números) e gerar link com expiração.

### Conformidade & Privacidade
- **PII Classification**: classificar campos das transcrições e permitir marcação manual de conteúdo sensível. Facilita atendimento a requisições LGPD/GDPR (direito ao esquecimento).
- **Retenção e Purga**: definir política de retenção por cofre; permitir agendamento de deleção automática e registrar confirmação para auditorias.
- **Consentimento & Logs de Acesso**: manter trilha de auditoria consultável (quem acessou qual transcrição e quando). Necessário para investigações internas e compliance.

### Plano de Segurança Incremental
1. **Sprint Segurança 1**: atualizar migrations para incluir `created_by/updated_by`, políticas RLS revisadas e testes automatizados.
2. **Sprint Segurança 2**: implementar auditoria no Observability + dashboard de acessos suspeitos.
3. **Sprint Segurança 3**: módulo de retenção/expurgo e redaction em exportações.
4. **Sprint Segurança 4**: revisão de edge functions (limites, secrets, monitoração) e revisão anual de regras de filamentos.

### Indicadores de Risco
- Taxa de falha de RLS vs. requests (deve ser 0%).
- Número de exportações/compartilhamentos por cofre (monitorar uso anômalo).
- Volume de dados marcados como sensíveis vs. total (avalia lacunas de classificação).

_Especialista responsável: GPT-5 Codex (Segurança Corporativa)_

---

## Especialidade: Experiência do Usuário Místico

### Narrativa e Identidade
- **Cofre Arcano**: reforçar o lore com animações sutis (runas que se alinham ao abrir/cofre “respira” conforme a quantidade de energia armazenada). Títulos e microtextos devem manter tom ritualístico (“Invocar cofre”, “Manter sigilo”).
- **Filamentos**: apresentar como “Tecidos de Memória” com descrição poética curta explicando o propósito (ex.: “Mantém unidas as transcrições das Grandes Conjurações Comerciais”).

### Fluxo e Descoberta
- **Onboarding Guiado**: primeiro acesso abre tour com mentor arcano explicando Cofre, Filamentos e Timeline Mágica. Utilizar Grimórios interativos na sidebar como checklists.
- **Gestão de Conteúdo**: timeline deve suportar modo grade/linha do tempo; permitir zoom por período e destacar eventos-chave com cores elementares.
- **Estados Vazios**: mensagens motivacionais personalizadas por cofre (“Este cofre aguarda suas crônicas… adicione a primeira transcrição para despertar a memória ancestral”).

### Acessibilidade e Usabilidade
- Garantir contraste adequado das cores místicas, suporte a modo daltônico, e atalhos de teclado para alternar entre filamentos. Tooltips com definições claras e links para documentação mística.
- Considerar níveis de densidade (compacto, padrão) para usuários que manipulam alto volume de transcrições.

### Engajamento Contínuo
- Scores de energia ou badges místicos por cofre (ex.: “Guardião da Constância” após X transcrições organizadas). Notificações suaves lembram o usuário de revisar filamentos inativos.
- Integração com personagens: exibir avatar do guardião ao lado das transcrições com insights rápidos (“Guardião Solar sugere transformar esta crônica em roteiro”).

_Especialista responsável: GPT-5 Codex (UX Narrativa)_
