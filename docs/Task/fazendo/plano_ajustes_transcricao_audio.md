# Plano de Ajustes — Transcrição de Áudio (Arcanum.AI)

id: task_transcricao_audio_ajustes
status: em_andamento
responsavel: admin
criado_em: 2025-11-09
referencias:
- docs/excencial/Visao de saas.md
- docs/excencial/desing.md
- src/components/transcription/AudioTranscribeTab.tsx
- src/services/transcriptionService.ts
- src/hooks/useTranscription.ts
- supabase/functions/transcribe_audio

## Objetivo
- Mapear e corrigir problemas de UX/funcionalidade na transcrição de áudio para entregar experiência equivalente à transmutação de texto: dois cards (texto original e versão do personagem com refresh), feedbacks claros, layout sem barra de rolagem “feia” e hint explicativa quando o botão estiver desabilitado.

## Escopo e restrições
- Não alterar código imediatamente; primeiro coletar informações, validar hipóteses e priorizar correções.
- Documentar sintomas, causas prováveis e critérios de aceitação. Só depois implementar.

## Problemas observados (diagnóstico inicial)
1) Após mandar transcrever, o sistema indica sucesso (“ok”), porém não exibe o resultado (nenhum texto aparece).
2) Desejo de exibir dois cards: (1) Texto Original (em Markdown bonito), (2) Versão do Personagem com botão Refresh — igual à experiência de “Transmutar Texto”.
3) Barra de rolagem vertical “feia” aparece na tela; expectativa é usar o estilo do site (scroll discreto ou infinito suave) e evitar overflow não intencional.
4) Botão “Transcrever Áudio” desabilitado sem explicar o motivo; desejo de exibir hint (tooltip) com a causa (ex.: arquivo ausente, projeto não selecionado, excedeu tamanho, extensão inválida, etc.).

## Como reproduzir (passo a passo)
- Ambiente: dev, com VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY configurados.
- Passos:
  1. Abrir Energia → Transmutação Criativa → aba “Transcrever Áudio”.
  2. Selecionar arquivo válido (MP3/WAV/M4A) com idioma PT.
  3. Opcional: selecionar personagem, tipo e tamanho.
  4. Clicar “Transcrever Áudio”.
  5. Observar: toast indica sucesso, mas a tela não exibe o conteúdo transcrito.

## Coleta de informações (logs e artefatos)
- Browser (DevTools):
  - Console logs e erros.
  - Network: request/response para /functions/v1/transcribe_audio (headers, corpo e status), e chamadas subsequentes (histórico/listagem, transform). 
- Edge Functions (Supabase Dashboard):
  - Logs de execução da função transcribe_audio.
- Banco (Supabase → PostgREST ou SQL editor):
  - Verificar se há inserção em transcriptions (status, text, job_id), e se o histórico (transcription_history) é criado após o retorno.
- Observability interno:
  - Eventos “audio_transcription_*” (attempt/success/failure) com traceId.

## Hipóteses de causa (ordenadas por probabilidade)
- H1: Contrato Backend↔Frontend inconsistente — função transcribe_audio retorna apenas { jobId, status: 'queued' }, enquanto o frontend espera { transcriptionId, text } para exibir imediatamente. Sem polling, nenhum texto aparece.
- H2: Falta de associação do usuário (Bearer) na invocação — Authorization ausente ou inválida → user_id null; histórico não vinculado ao usuário → UI não encontra item.
- H3: applyTransformation selecionado sem personagem/params válidos — tentativa de transformar falha silenciosamente e histórico não é criado.
- H4: Layout/overflow — container pai com overflow-y auto/scroll sem estilização; scrollbar padrão do OS aparece em páginas altas.
- H5: Validação do botão “Transcrever Áudio” muito rígida — fica desabilitado por múltiplas condições e não há hint para o usuário.

## Critérios de aceitação (ao finalizar implementação)
- Após transcrever, a UI exibe:
  - Card 1: Texto Original
    - Renderizado em Markdown bonito (títulos/listas/code inline), com toggle “Ler em Markdown”.
    - Botão “Copiar” funcional.
  - Card 2: Versão do Personagem
    - Resultado transformado com botão “Refresh” (regera com personagem/tipo/tamanho atuais).
    - Placeholder de “gerando” quando em processamento (acessível, aria-live).
- Barra de rolagem: não há scroll feio; o layout usa o estilo do site (scroll discreto, container adequado, sem overflow indesejado).
- Botão “Transcrever Áudio”:
  - Quando desabilitado, exibe hint (tooltip) com motivo (arquivo ausente, projeto não configurado, tamanho excedido, extensão inválida, etc.).
- Observabilidade: eventos e métricas são emitidos sem PII (traceId presente), ajudando depurar falhas.

## Especificação de UI (cards)
- Card “Texto Original”
  - Cabeçalho: título + botão “Copiar”.
  - Corpo: visualizador Markdown + toggle “Ler em Markdown”; fallback textarea monoespaçada.
- Card “Versão do Personagem”
  - Cabeçalho: título + botões “Copiar” e “Refresh”.
  - Corpo: resultado em Markdown; placeholder amigável quando aguardando regeneração; acessibilidade (aria-live). 
- Ticker místico (opcional): faixa com “receitas de magia” (desing.md) rolando suavemente no topo da seção, sem comprometer foco/legibilidade.

## Especificação UX — barra de rolagem
- Evitar overflow não intencional em containers principais.
- Scrollbars com estilo do tema (tailwind-typography + classe utilitária): width leve, thumb com cor sutil, sem bordas agressivas.
- Áreas de texto grandes usam overflow-y com padding e borda discreta, mantendo coerência visual.

## Hint no botão “Transcrever Áudio”
- Condições típicas que desabilitam:
  - Arquivo não selecionado.
  - ProjetoId não definido.
  - Extensão/MIME inválido.
  - Tamanho > limite.
  - Processo de upload/transcrição em andamento.
- Ao hover/focus do botão desabilitado, mostrar tooltip com a primeira causa detectada + como resolver.

## Tarefas (checklist)
- [X] Criar plano de ajustes e diagnosticar problemas iniciais.
- [ ] Registrar evidências: capturas do DevTools (Console/Network) em um arquivo de suporte (docs/observability/setup.md ou pasta suporte/).
- [ ] Conferir contratos (payloads/retornos) entre transcribe_audio e transcriptionService; alinhar formato esperado (jobId vs transcriptionId/text) e definir polling/atualização.
- [ ] Mapear pontos de falha de criação do histórico (transcription_history) e vinculação ao user_id.
- [ ] Especificar CSS utilitário para scrollbars e containers, propondo remoção do overflow “feio” e adoção do estilo do site.
- [ ] Desenhar a lógica do hint no botão desabilitado: função getDisabledReason(params) e integração com Tooltip.
- [ ] Definir testes (unit/integration/e2e) para os cenários: sucesso sem transformação, sucesso com transformação, refresh, erros de validação, e UX de hint.
- [ ] Aprovação do plano; só então implementar.

## Plano de testes
- Unit (React):
  - [x] Função getDisabledReason(parameters) retorna a causa correta.
  - Renderização dos cards com toggles (Markdown/textarea) e botões Copy/Refresh.
- Integração:
  - [x] Invocação de transcribe_audio em sucesso (job queued) e falha de contrato.
  - [ ] Histórico populado; transformTranscription com retorno esperado.
  - Polling de status: filas/processing/completed → UI atualiza adequadamente.
- E2E (Playwright):
  - Seleção de arquivo válido → “Transcrever Áudio” → exibe dois cards.
  - Hint visível ao deixar o botão desabilitado por falta de arquivo/projeto.
  - Scrollbar discreta e sem overflow feio.

## Riscos e mitigação
- Variabilidade de resposta da função (assíncrono vs síncrono): adotar polling com timeouts e feedbacks amigáveis.
- Tamanhos de áudio grandes: validar fortemente antes do upload; mostrar motivo quando rejeitado.
- CORS/preflight: garantir que funções Edge respondam OPTIONS com headers adequados.

## Próximos passos
- Coletar evidências dos fluxos e validar hipóteses H1–H5.
- Reunir os “agentes” (dev/ux/qa) para aprovar o plano de correção.
- Após aprovação, implementar em etapas pequenas, com testes e observabilidade.

## Rollout controlado
- Variável de feature flag no frontend: `VITE_FEATURE_AUDIO_TRANSCRIPTION_V2` (`true` habilita nova experiência, `false` ativa fallback legado).
- Pipeline sugerido:
  1. Habilitar `VITE_FEATURE_AUDIO_TRANSCRIPTION_V2=false` em `staging`, validar fallback.
  2. Ativar `true` apenas para time interno (via variável em ambiente ou segmentação se disponível).
  3. Monitorar métricas (`audio_transcription_status_update`, `metric.audio_transcription_success_rate`) por 24h.
  4. Habilitar gradualmente em produção com rollback simples ajustando a mesma flag.
- Documentar mudanças e janela de ativação no canal de release.

