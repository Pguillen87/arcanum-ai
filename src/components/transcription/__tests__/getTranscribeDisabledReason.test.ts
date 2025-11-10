import { describe, expect, it } from "vitest";
import { getTranscribeDisabledReason } from "../getTranscribeDisabledReason";

const baseParams = {
  selectedFile: {} as File,
  projectId: "project-123",
  validationMessage: null,
  isUploading: false,
  isTranscribing: false,
  isJobRunning: false,
  isTransforming: false,
  applyTransformation: false,
  selectedCharacterId: undefined as string | undefined,
  hasCharacters: true,
};

describe("getTranscribeDisabledReason", () => {
  it("retorna mensagem quando upload está em andamento", () => {
    const reason = getTranscribeDisabledReason({
      ...baseParams,
      isUploading: true,
    });

    expect(reason).toMatch(/upload/);
  });

  it("retorna mensagem quando transcrição está em execução", () => {
    const reason = getTranscribeDisabledReason({
      ...baseParams,
      isTranscribing: true,
    });

    expect(reason).toMatch(/transcrição/i);
  });

  it("retorna mensagem para job ainda processando", () => {
    const reason = getTranscribeDisabledReason({
      ...baseParams,
      isJobRunning: true,
    });

    expect(reason).toMatch(/processando/);
  });

  it("obriga seleção de projeto", () => {
    const reason = getTranscribeDisabledReason({
      ...baseParams,
      projectId: undefined,
    });

    expect(reason).toMatch(/projeto/);
  });

  it("respeita mensagem de validação personalizada", () => {
    const reason = getTranscribeDisabledReason({
      ...baseParams,
      validationMessage: "Formato não suportado",
    });

    expect(reason).toBe("Formato não suportado");
  });

  it("solicita arquivo quando nenhum foi selecionado", () => {
    const reason = getTranscribeDisabledReason({
      ...baseParams,
      selectedFile: null,
    });

    expect(reason).toMatch(/arquivo/);
  });

  it("orienta criação de personagem quando transformação habilitada sem personagens", () => {
    const reason = getTranscribeDisabledReason({
      ...baseParams,
      applyTransformation: true,
      hasCharacters: false,
    });

    expect(reason).toMatch(/personagem/i);
  });

  it("solicita seleção de personagem quando transformação habilitada", () => {
    const reason = getTranscribeDisabledReason({
      ...baseParams,
      applyTransformation: true,
      hasCharacters: true,
      selectedCharacterId: undefined,
    });

    expect(reason).toMatch(/Escolha qual personagem/i);
  });

  it("retorna null quando não há bloqueios", () => {
    const reason = getTranscribeDisabledReason({
      ...baseParams,
      applyTransformation: true,
      hasCharacters: true,
      selectedCharacterId: "character-123",
    });

    expect(reason).toBeNull();
  });
});


