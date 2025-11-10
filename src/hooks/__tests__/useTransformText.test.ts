import { vi, describe, it, expect, afterEach } from "vitest";

vi.mock("react-dom/test-utils", async () => {
  const actual = await vi.importActual<any>("react-dom/cjs/react-dom-test-utils.development.js");
  return actual;
});

import { renderHook, act, waitFor } from "@testing-library/react";
import type { Character } from "@/schemas/character";
import {
  useTransformText,
  type TransformRequest,
} from "../useTransformText";

const baseCharacters: Character[] = [
  {
    id: "character-1",
    user_id: "user-1",
    name: "Mago Tot",
    description: "Guardiǜo padrǜo",
    is_default: true,
    personality_core: { traits: [], robotic_human: 50, clown_serious: 50 },
    communication_tone: {
      formality: "neutral",
      enthusiasm: "medium",
      style: [],
      use_emojis: false,
      use_slang: false,
      use_metaphors: false,
    },
    motivation_focus: { focus: "help", seeks: "harmony" },
    social_attitude: { type: "reactive", curiosity: "medium", reserved_expansive: 50 },
    cognitive_speed: { speed: "medium", depth: "medium" },
    vocabulary_style: { style: "neutral", complexity: "medium", use_figures: false },
    emotional_state: null,
    values_tendencies: ["neutral"],
    model_provider: "openai",
    model_name: "gpt-4o",
    metadata: null,
    created_at: "",
    updated_at: "",
  },
];

const baseRequest: TransformRequest = {
  inputText: "texto base",
  transformationType: "post",
  length: "medium",
};

const hashCharacterId = (id: string) => `hash-${id}`;
let nowSpy: ReturnType<typeof vi.spyOn> | null = null;

afterEach(() => {
  nowSpy?.mockRestore();
  nowSpy = null;
});

describe("useTransformText", () => {
  it("executa transformação com personagem default, gera hash e registra duração", async () => {
    const trackEvent = vi.fn();
    const execute = vi.fn().mockResolvedValue("texto transformado");
    nowSpy = vi.spyOn(performance, "now")
      .mockReturnValueOnce(10)
      .mockReturnValueOnce(110);

    const { result } = renderHook(() =>
      useTransformText({
        characters: baseCharacters,
        executeCharacterTransform: execute,
        generateTraceId: () => "trace-123",
        hashCharacterId,
        trackEvent,
      })
    );

    let success;
    await act(async () => {
      success = await result.current.transform(baseRequest);
    });

    expect(execute).toHaveBeenCalledWith(expect.objectContaining({
      ...baseRequest,
      characterId: "character-1",
      traceId: "trace-123",
      isRefresh: false,
    }));
    expect(result.current.transformedText).toBe("texto transformado");
    expect(result.current.lastTraceId).toBe("trace-123");
    expect(result.current.lastRequest).toEqual({
      ...baseRequest,
      characterId: "character-1",
      currentOutput: "texto transformado",
      traceId: undefined,
      refinementHints: undefined,
      isRefresh: undefined,
    });
    expect(success?.metadata).toMatchObject({
      characterIdHash: "hash-character-1",
    });
    expect(success?.isRefresh).toBe(false);
    const successDuration = success?.metadata?.requestDurationMs as number | undefined;
    expect(typeof successDuration).toBe("number");
    expect((successDuration ?? 0) >= 0).toBe(true);
    expect(trackEvent).toHaveBeenNthCalledWith(
      1,
      "metric.character_transform_success_rate",
      expect.objectContaining({
        outcome: "attempt",
        traceId: "trace-123",
        characterIdHash: "hash-character-1",
      })
    );
    expect(trackEvent).toHaveBeenNthCalledWith(
      2,
      "metric.character_transform_success_rate",
      expect.objectContaining({
        outcome: "success",
        traceId: "trace-123",
        characterIdHash: "hash-character-1",
        requestDurationMs: expect.any(Number),
      })
    );
  });

  it("propaga erros e registra evento de falha com duração e hash", async () => {
    const error = new Error("brandProfileId inválido");
    const trackEvent = vi.fn();
    const execute = vi.fn().mockRejectedValue(error);
    nowSpy = vi.spyOn(performance, "now")
      .mockReturnValueOnce(5)
      .mockReturnValueOnce(55);

    const { result } = renderHook(() =>
      useTransformText({
        characters: baseCharacters,
        executeCharacterTransform: execute,
        generateTraceId: () => "trace-456",
        hashCharacterId,
        trackEvent,
      })
    );

    await act(async () => {
      await expect(result.current.transform(baseRequest)).rejects.toThrow("brandProfileId inválido");
    });

    await waitFor(() => expect(trackEvent).toHaveBeenCalledTimes(2));
    expect(trackEvent).toHaveBeenNthCalledWith(
      1,
      "metric.character_transform_success_rate",
      expect.objectContaining({
        outcome: "attempt",
        traceId: "trace-456",
        characterIdHash: "hash-character-1",
      })
    );
    expect(trackEvent).toHaveBeenNthCalledWith(
      2,
      "metric.character_transform_success_rate",
      expect.objectContaining({
        outcome: "failure",
        traceId: "trace-456",
        reason: "brandProfileId inválido",
        characterIdHash: "hash-character-1",
        requestDurationMs: expect.any(Number),
      })
    );
    expect(result.current.transformedText).toBeNull();
    expect(result.current.lastTraceId).toBe("trace-456");
    expect(result.current.lastRequest).toBeNull();
  });

  it("lança erro quando não há personagem disponível", async () => {
    const execute = vi.fn();
    const { result } = renderHook(() =>
      useTransformText({
        characters: [],
        executeCharacterTransform: execute,
        generateTraceId: () => "trace-789",
        hashCharacterId,
      })
    );

    await expect(
      act(async () => {
        await result.current.transform(baseRequest);
      })
    ).rejects.toThrow("Nenhum characterId disponível");

    expect(execute).not.toHaveBeenCalled();
    expect(result.current.lastRequest).toBeNull();
  });

  it("executa refresh reutilizando última requisição e envia hints", async () => {
    const trackEvent = vi.fn();
    const execute = vi.fn()
      .mockResolvedValueOnce("texto transformado")
      .mockResolvedValueOnce("texto ajustado");
    nowSpy = vi.spyOn(performance, "now")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(180);

    const { result } = renderHook(() =>
      useTransformText({
        characters: baseCharacters,
        executeCharacterTransform: execute,
        generateTraceId: () => (trackEvent.mock.calls.length === 0 ? "trace-base" : "trace-refresh"),
        hashCharacterId,
        trackEvent,
      })
    );

    await act(async () => {
      await result.current.transform(baseRequest);
    });

    await act(async () => {
      const refreshed = await result.current.refresh({
        refinementHints: ["Não se apresente"],
        currentOutput: "texto transformado",
      });
      expect(refreshed.isRefresh).toBe(true);
    });

    expect(execute).toHaveBeenLastCalledWith(expect.objectContaining({
      characterId: "character-1",
      isRefresh: true,
      refinementHints: ["Não se apresente"],
      currentOutput: "texto transformado",
    }));
    expect(trackEvent).toHaveBeenCalledWith(
      "character_transform_refresh_attempt",
      expect.objectContaining({
        traceId: "trace-refresh",
        hintsCount: 1,
      })
    );
    expect(trackEvent).toHaveBeenCalledWith(
      "character_transform_refresh_success",
      expect.objectContaining({
        traceId: "trace-refresh",
        hintsCount: 1,
        requestDurationMs: expect.any(Number),
      })
    );
    expect(result.current.transformedText).toBe("texto ajustado");
    expect(result.current.lastRequest).toEqual({
      ...baseRequest,
      characterId: "character-1",
      currentOutput: "texto ajustado",
      traceId: undefined,
      refinementHints: undefined,
      isRefresh: undefined,
    });
    expect(result.current.lastTraceId).toBe("trace-refresh");
    expect(result.current.lastRequest?.currentOutput).toBe("texto ajustado");
  });
});
