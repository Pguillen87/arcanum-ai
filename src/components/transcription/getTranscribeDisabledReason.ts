interface DisabledReasonParams {
  selectedFile: File | null;
  projectId?: string;
  validationMessage?: string | null;
  isUploading: boolean;
  isTranscribing: boolean;
  isJobRunning: boolean;
  isTransforming: boolean;
  applyTransformation: boolean;
  selectedCharacterId?: string;
  hasCharacters: boolean;
  isRecording?: boolean;
}

export function getTranscribeDisabledReason({
  selectedFile,
  projectId,
  validationMessage,
  isUploading,
  isTranscribing,
  isJobRunning,
  isTransforming,
  applyTransformation,
  selectedCharacterId,
  hasCharacters,
  isRecording,
}: DisabledReasonParams): string | null {
  if (isUploading) {
    return "Aguarde o término do upload do arquivo.";
  }

  if (isTranscribing) {
    return "Estamos enviando o áudio para transcrição. Isso leva alguns instantes.";
  }

  if (isJobRunning) {
    return "A transcrição está em processamento. Assim que o texto estiver pronto, exibiremos nos cards.";
  }

  if (isTransforming) {
    return "O personagem está manifestando a transformação. Aguarde a conclusão antes de reenviar.";
  }

  if (isRecording) {
    return "Finalize ou cancele a gravação para prosseguir.";
  }

  if (!projectId) {
    return "Selecione um projeto para associar o áudio antes de transcrever.";
  }

  if (validationMessage) {
    return validationMessage;
  }

  if (!selectedFile) {
    return "Selecione um arquivo de áudio válido para iniciar.";
  }

  if (applyTransformation) {
    if (!hasCharacters) {
      return "Crie um personagem na Essência para habilitar a transformação automática.";
    }

    if (!selectedCharacterId) {
      return "Escolha qual personagem aplicará a transformação antes de continuar.";
    }
  }

  return null;
}


