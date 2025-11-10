# Arcanum AI — Especificações Técnicas e Objetivas

## 1) Descrição objetiva do projeto
- Arcanum AI é um micro‑SaaS de repaginação de conteúdo (Content Repurposer Tool).
- Usuários enviam textos, áudios e vídeos; o sistema transforma em novos formatos: posts sociais, newsletters, resumos, roteiros e vídeos curtos.
- O processamento utiliza IA (GPT para texto, Whisper para áudio, pipeline de vídeo + legendas), com foco em simplicidade, identidade (“Voz da Marca”) e estética do tema “Arcanum AI”.

## 2) Escopo funcional principal
- Upload & ingestão de conteúdos com metadados.
- Transcrição (áudio/vídeo) e edição assistida.
- Transformação de texto em múltiplos formatos/plataformas com preview.
- Geração de vídeos curtos (cortes automáticos + legendas dinâmicas).
- Configuração da “Voz da Marca” (presets e embeddings leves).
- Sistema de créditos e planos; cobrança após entrega concluída.
- Exportação e publicação (integrações futuras com redes).

## 3) Público‑alvo e diferenciais
- Criadores, social media, freelancers, educadores/terapeutas e empreendedores criativos.
- Diferenciais: estética imersiva, “transmutação criativa” emocional, sistema de créditos justo, consistência da identidade do usuário.

## 4) Requisitos técnicos
- Frontend: Vite + React + TypeScript + Tailwind + PWA (estado atual do repo).
- Backend/Dados: Supabase (Postgres, Auth, Storage, Edge Functions) para persistência e lógica.
- IA: OpenAI (GPT/Whisper); opcional HuggingFace/Anthropic para casos específicos.
- Vídeo: FFmpeg/serviço de render para cortes e legendagem.
- Pagamentos: Stripe/Mercado Pago com webhooks idempotentes para reconciliação de créditos.
- Observabilidade: Sentry/LogRocket (ou equivalente), logs estruturados, métricas e tracing de jobs.
- CI/CD: GitHub Actions + Vercel/Infra de deploy.
- Autenticação: Email/senha (implementado). OAuth (Google/GitHub) previsto no PRD para etapas futuras.

## 5) Arquitetura e módulos
- Upload & Ingestão: armazenamento por usuário/projeto; metadados.
- Transcrição & Edição: Whisper → texto; editor com exportações (DOC/PDF/SRT).
- Transformação de Texto: geração de posts/resumos/newsletters/roteiros; controle de tom/persona/plataforma.
- Vídeos Curtos: detecção de momentos, cortes e legendas dinâmicas; preview gratuito, render final.
- Voz da Marca: presets e embeddings leves; aplicação nos jobs.
- Créditos & Planos: saldo, compra de pacotes, desconto pós‑entrega.
- Perfil & Autenticação: sessão, perfil, configurações.
- Exportação & Publicação: artefatos prontos para redes e arquivos.

## 6) Fluxos de trabalho
- Texto → Post: entrada → IA gera variantes → preview → ajustes → exportação → descontar créditos.
- Áudio → Transcrição → Conteúdo: upload → fila de transcrição → editor → IA gera saídas → exportação → descontar créditos.
- Vídeo Longo → Vídeos Curtos: upload → detecção/cortes → legendas → preview → exportação → descontar créditos.
- Voz da Marca: configurar presets/estilo → aplicar nos jobs → iterar.

## 7) APIs essenciais (propostas)
- Upload: `POST /api/upload`, `GET /api/assets/:id`.
- Transcrição: `POST /api/transcriptions`, `GET/PUT /api/transcriptions/:jobId`.
- Transformação de texto: `POST /api/transform/text`, `GET /api/transform/text/:jobId`.
- Vídeo curto: `POST /api/transform/video`, `GET /api/transform/video/:jobId`.
- Voz da Marca: `POST/GET /api/brand-profiles`.
- Projetos/Transformations: `POST/GET /api/projects`, `GET /api/transformations/:id`.
- Créditos/Pagamentos: `GET /api/credits`, `POST /api/credits/purchase`, `POST /api/payments/webhooks`.
- Autenticação: `POST /api/auth/login|signup|logout`.

## 8) Modelo de dados (resumo)
- Entidades: `users`, `profiles`, `projects`, `assets`, `transcriptions`, `transformations`, `credits`, `subscriptions`, `payments`, `notifications`.
- Relacionamentos principais: `profiles (1:1 users)`, `projects (1:N assets | 1:N transformations)`, `assets (1:N transcriptions)`.

## 9) Segurança e privacidade
- RLS para todas as tabelas sensíveis; políticas por `user_id` (e `organization_id` se multi‑tenant).
- Criptografia em repouso e trânsito; sanitização de inputs.
- LGPD/GDPR: consentimento, exportação de dados, exclusão de conta, retenção mínima.
- Webhooks: verificação de origem, idempotência por `eventId`.

## 10) Operações e SLOs
- Logs estruturados por job e tracing end‑to‑end.
- SLOs propostos: texto < 10–15s; transcrição (30 min) < 5–7 min; preview de vídeo longo < 10 min.
- Filas com estados `queued/processing/completed/failed` e retries exponenciais (máx. 3).

## 11) Limites e formatos (propostos)
- Tamanho máximo de upload: texto 2MB; áudio 200MB; vídeo 2GB.
- Formatos: texto (`.txt`, `.md`, `.docx`), áudio (`.mp3/.wav/.m4a`), vídeo (`.mp4/.mov`).
- Exportações: `.md/.txt/.json` (texto), `.srt` (legendas), `.mp4` (vídeo curto).

## 12) Critérios de aceitação/KPIs
- Conversão freemium → assinatura: 12%.
- Churn mensal < 6%.
- Custo por request IA < 20% da receita unitária.
- Satisfação de geração ≥ 70%.
- Tempo médio de transmutação < 15s (texto).

## 13) Roadmap de implementação
- Ver `docs/roadmap.md` para fases e entregas.

## 14) Ambientes (dev/test/prod)
- Configs segregadas; chaves e credenciais via `.env` seguro.
- Feature flags para habilitar providers/funcionalidades gradualmente.
- Observabilidade e alertas ativos em prod; logs verbosos em dev/test.

## 15) Dependências e integrações
- Supabase (Auth, Postgres, Storage, Edge Functions, RLS), OpenAI/Whisper, Stripe/Mercado Pago, FFmpeg, Sentry/LogRocket.

## 16) Decisões e riscos
- MVP SPA (Vite) por simplicidade; ADR para avaliar migração a Next.js caso SSR/SEO tornem‑se críticos.
- Cotas de processamento e custo de IA: monitoração contínua e otimização.
- Latência e throughput de transcrição/vídeo dependem de filas e infraestrutura.

## 17) Próximos passos
- Formalizar ADR SPA vs Next.js.
- Detalhar limites e custos de créditos por operação.
- Implementar MVP Fase 1 (Transformação de Texto) com métricas/observabilidade.

---

### O que o projeto faz (resumo)
- Repagina conteúdos com IA: transforma textos, áudios e vídeos em formatos prontos para publicação (posts, newsletters, roteiros e vídeos curtos), mantendo estilo e propósito do criador. Paga‑se apenas pelas entregas concluídas por meio de um sistema de créditos.