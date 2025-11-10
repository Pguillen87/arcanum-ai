import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useAudioValidation,
  MAX_AUDIO_SIZE_MB,
} from "../useAudioValidation";
import { AUDIO_MIME_TYPES, AUDIO_EXTENSIONS } from "@/constants/mediaFormats";

const createFile = (name: string, sizeBytes: number, type = "") =>
  new File([new Uint8Array(sizeBytes)], name, { type });

describe("useAudioValidation", () => {
  it("retorna erro quando nenhum arquivo é informado", () => {
    const { result } = renderHook(() => useAudioValidation());
    const validation = result.current.validateAudio(null);

    expect(validation.isValid).toBe(false);
    expect(validation.error?.code).toBe("no_file");
  });

  it("aceita arquivos com MIME permitido", () => {
    const { result } = renderHook(() => useAudioValidation());
    const file = createFile("voz.mp3", 1024 * 1024, AUDIO_MIME_TYPES[0]);

    const validation = result.current.validateAudio(file);

    expect(validation.isValid).toBe(true);
    expect(validation.metadata?.extension).toBe(".mp3");
    expect(validation.metadata?.mimeType).toBe(AUDIO_MIME_TYPES[0]);
  });

  it("aceita arquivos com extensão válida mesmo sem MIME", () => {
    const { result } = renderHook(() => useAudioValidation());
    const file = createFile(`voz${AUDIO_EXTENSIONS[1]}`, 512 * 1024, "");

    const validation = result.current.validateAudio(file);

    expect(validation.isValid).toBe(true);
    expect(validation.metadata?.extension).toBe(AUDIO_EXTENSIONS[1]);
  });

  it("rejeita arquivos com formato inválido", () => {
    const { result } = renderHook(() => useAudioValidation());
    const file = createFile("script.exe", 1000, "application/x-msdownload");

    const validation = result.current.validateAudio(file);

    expect(validation.isValid).toBe(false);
    expect(validation.error?.code).toBe("invalid_type");
  });

  it("rejeita arquivos acima do limite de tamanho", () => {
    const limiteTesteMB = 1;
    const { result } = renderHook(() => useAudioValidation({ maxSizeMB: limiteTesteMB }));
    const file = createFile("voz.wav", (limiteTesteMB + 1) * 1024 * 1024, AUDIO_MIME_TYPES[2]);

    const validation = result.current.validateAudio(file);

    expect(validation.isValid).toBe(false);
    expect(validation.error?.code).toBe("invalid_size");
  });

  it("rejeita nomes suspeitos com extensão dupla", () => {
    const { result } = renderHook(() => useAudioValidation());
    const file = createFile("voz.mp3.exe", 1024 * 1024, "application/x-msdownload");

    const validation = result.current.validateAudio(file);

    expect(validation.isValid).toBe(false);
    expect(validation.error?.code).toBe("suspicious_name");
  });

  it("retorna metadados sanitizados", () => {
    const { result } = renderHook(() => useAudioValidation());
    const file = createFile("voz<alert>.m4a", 1024 * 1024, "audio/x-m4a");

    const validation = result.current.validateAudio(file);

    expect(validation.isValid).toBe(true);
    expect(validation.metadata?.sanitizedName).not.toContain("<");
    expect(validation.metadata?.sanitizedName).not.toContain(">");
    expect(validation.metadata?.sanitizedName).toContain("&lt;alert&gt;");
  });
});

