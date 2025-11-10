# Arcanum AI — Roadmap Técnico (Alinhado ao PRD)

## Fase 1 — MVP Texto
- Autenticação (email/senha) e Perfil básico.
- Transformação de Texto (`/api/transform/text`), presets iniciais e preview.
- Persistência em `projects`, `assets`, `transformations`.
- Contabilização de créditos básica (mock até pagamentos).

## Fase 2 — Áudio
- Upload de áudio; fila de transcrição (Whisper) e editor.
- Exportações (DOC/PDF/SRT) e ajustes de texto.
- Integração de créditos por transcrição e transformação.

## Fase 3 — Vídeo
- Upload de vídeo longo; detecção de momentos e cortes.
- Legendas dinâmicas e preview gratuito; render final com desconto de créditos.
- Otimizações de performance e storage.

## Fase 4 — Voz da Marca
- Configuração de presets e embeddings; aplicação nos jobs.
- Biblioteca de estilos e aprendizado incremental.

## Fase 5 — Pagamentos e Beta
- Stripe/Mercado Pago; webhooks e reconciliação de créditos.
- Beta público; analytics emocional; ajustes de UX.

## Itens Transversais
- Observabilidade/SLOs, segurança (RLS/LGPD), i18n e acessibilidade.
- ADR para decisão SPA (Vite) vs Next.js; plano de migração se necessário.