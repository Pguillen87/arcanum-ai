<!-- Evidências consolidadas em 2025-11-10 para o plano de ajustes de transcrição de áudio -->

# Evidências — Transcrição de Áudio (Dev)

- **Data:** 2025-11-10  
- **Responsável:** GPT-5 Codex (suporte ao plano `task_transcricao_audio_ajustes`)

## 1. Fluxo atual observado

- A função Edge `supabase/functions/transcribe_audio/index.ts` cria um registro na tabela `transcriptions` com `status = 'queued'` e retorna apenas `{ jobId, status: 'queued' }`.
- O serviço frontend `src/services/transcriptionService.ts` espera `transcriptionId` e `text` na resposta imediata para criar histórico e exibir cards — quando ausentes, nenhum conteúdo aparece, confirmando a hipótese **H1 (contrato inconsistente)**.
- O Hook `useTranscription` possui `useTranscriptionStatus` com polling por `transcriptionId`, mas o fluxo principal não utiliza esse hook após chamar `transcribeAudio`, deixando a UI sem atualização.
- O componente `AudioTranscribeTab` invalida o history, mas não dispõe de dados até que `transcriptionService` retorne `text`, reforçando o hiato entre backend e frontend.

## 2. Logs e artefatos coletados

- Requisição DevTools (simulada via inspeção de código):  
  - **Request:** `POST /functions/v1/transcribe_audio`  
  - **Body:** `{ assetId, language, characterId?, applyTransformation?, ... }`  
  - **Response (atual):** `200 OK` com body `{"jobId":"<uuid>","status":"queued"}`
- Tabelas relevantes (referência `docs/ddl/schema-detailed.md`):
  - `transcriptions` exige `user_id` e possui campos `text`, `error`, `job_id`.
  - `transcription_history` depende de `transcription_id` + `original_text`.

## 3. Hipóteses confirmadas/descartadas

- ✅ **H1 (Contrato inconsistente)** — Confirmado: backend não devolve `transcriptionId`/`text`, mas frontend exige ambos.
- ⚠️ **H2 (Bearer ausente)** — Ainda não testado em tempo real; código usa `Authorization` com token válido, porém a função aceita `userId = null`, o que pode violar `NOT NULL`. Precisamos validar após ajustes de contrato.
- ⏳ **Demais hipóteses (H3–H5)** — Dependentes de correções subsequentes (transformação, layout, validação do botão).

## 4. Próximos passos (alinhamento de contrato)

1. Ajustar `transcribe_audio` para retornar `transcriptionId` (registro criado) além de `jobId/status`, garantindo que o frontend possa iniciar polling.
2. Atualizar `transcriptionService` para:
   - Tratar respostas assíncronas (`queued`, sem `text`).
   - Registrar apenas metadados iniciais e delegar criação de histórico para quando `text` estiver disponível.
3. Adaptar hook/componente para consumir `transcriptionId` e usar polling até `status = 'completed'`.

> Observação: manter `traceId` e eventos `audio_transcription_*` ao longo do fluxo para atender aos critérios de observabilidade.


