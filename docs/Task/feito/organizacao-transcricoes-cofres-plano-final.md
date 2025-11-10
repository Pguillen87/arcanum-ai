# Plano Final - Organização de Transcrições em Cofres Arcanos

## 1. Norte Estratégico
- Transformar “projetos” em **Cofres Arcanos** que concentram transcrições, transformações e ativos correlatos com identidade mística consistente.
- Oferecer organização automática e manual via **Filamentos (Tecidos de Memória)**, preservando contexto e narrativa.
- Garantir escalabilidade técnica, segurança corporativa de dados e experiência encantadora alinhada ao design místico.

## 2. Escopo Funcional
### 2.1 Cofre Arcano
- Metadados: nome, descrição longa, `theme_color`, `sigil_icon`, `guardian_character_id`, contadores, `last_accessed_at`.
- Ações: criar, editar, arquivar, duplicar, exportar com redaction opcional.

### 2.2 Filamentos
- Estrutura: tabela `project_filaments` com `rules` JSONB (tags, idioma, origem) e cor.
- Recursos: criação manual, pré-visualização de regras, drag & drop na timeline, log de alterações.

### 2.3 Timeline Mágica
- Exibição híbrida (lista/linha do tempo) filtrável por personagem, tags, status, faixa temporal.
- Itens exibem transcrição, status, guardião, links para transformações e favoritos/âncoras.

### 2.4 Insights & Busca
- Buscar inicialmente com `tsvector` + GIN; planejar evolução para `pgvector` conforme demanda.
- Painel lateral com highlights, transformações geradas, checklists e botão “Gerar Insight” (Edge Function).

## 3. Arquitetura Técnica
1. **Mutações de Dados**
   - Atualizar `projects`, `transcription_history` (colunas `project_id`, `filament_id`, `tags`), criar `project_filaments` e opcional `transcription_links`.
   - Triggers `set_updated_at`, campos `created_by/updated_by` para auditoria.
   - Função/Edge para classificar transcrições em filamentos em transação.
2. **Camada de Serviços**
   - `ProjectsService`, `FilamentsService`, `TranscriptionService` com casos de uso explícitos.
   - Políticas RLS reforçadas (`auth.uid()` em todas as tabelas e views).
3. **Infra & Observabilidade**
   - Métricas: contagem de transcrições por cofre, taxa de regra automática, eventos de exportação.
   - Logs críticos (criação de filamento, ajuste de regras, insights gerados) no Observability.

## 4. Segurança Corporativa
- Criptografia em repouso avaliando `pgcrypto` para campos sensíveis.
- Auditoria centralizada de acessos, histórico de mudanças, retenção configurável por cofre.
- Exportações com expiração e redaction automática.
- Rotina semestral de revisão de regras dos filamentos e secrets de Edge Functions.

## 5. Experiência do Usuário Místico
- Onboarding guiado com mentor arcano explicando Cofres/Filamentos/Timeline.
- Estados vazios narrativos, animações sutis e linguagem ritualística (“Invocar cofre”, “Tecidos de Memória”).
- Opções de densidade visual, modo daltônico, atalhos de teclado, badges de engajamento.
- Integração com guardiões: avatar e sugestões contextuais em transcrições destacadas.

## 6. Roadmap Consolidado
| Sprint | Foco | Entregas Principais |
|--------|------|---------------------|
| 1 | Fundamentos Técnicos | Migrations (projects, transcriptions, filaments), casos de uso básicos, RLS reforçada, testes automatizados. |
| 2 | UI Cofres + Timeline | Lista de cofres, página do cofre com timeline simples, seleção obrigatória de cofre ao criar transcrição, migração de dados legado (cofre padrão). |
| 3 | Filamentos Inteligentes | CRUD filamentos, regras automáticas com pré-visualização, drag & drop, auditoria de mudanças. |
| 4 | Painel de Insights | Painel lateral, favoritos/âncoras, integração com transformações, eventos observability. |
| 5 | Segurança Avançada | Auditoria centralizada, retenção/expurgo, exportação com redaction, dashboard de riscos. |
| 6 | Busca Semântica & Engajamento | Busca `tsvector` (piloto), monitoramento; badges místicos, notificações orientadas pelos guardiões. |
| 7 | Evoluções Futuras | Avaliar `pgvector`, refinar UX com base em métricas, retrospectiva geral. |

## 7. Critérios de Sucesso
- 100% das transcrições associadas a um cofre e filamento válido após migração.
- Tempo médio de localização de transcrição reduzido em ≥30% em testes de usabilidade.
- Zero falhas de RLS em testes automatizados e monitoramento.
- NPS da nova experiência de cofres ≥ 45 após primeiro ciclo de feedback.

## 8. Próximos Passos
1. Validar roadmap e esforço com times de frontend, backend, design e segurança.
2. Preparar PRD detalhada e tickets por sprint, vinculando métricas de observabilidade.
3. Iniciar Sprint 1 com foco em migrations e camada de serviços, mantendo feature flag para lançamento gradual.

_Este plano consolida todas as análises técnicas, de segurança e UX, servindo de base para execução colaborativa._
