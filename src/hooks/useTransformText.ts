import { useCallback, useMemo, useState } from "react";
import type { Character } from "@/schemas/character";

export type TransformationType = "post" | "resumo" | "newsletter" | "roteiro";
export type TransformationLength = "short" | "medium" | "long";

export interface TransformRequest {
  characterId?: string | null;
  inputText: string;
  transformationType: TransformationType;
  tone?: string;
  length: TransformationLength;
  traceId?: string;
  refinementHints?: string[];
  currentOutput?: string;
  isRefresh?: boolean;
}

export interface TransformSuccess {
  transformedText: string;
  metadata?: Record<string, unknown>;
  traceId?: string;
  isRefresh?: boolean;
}

export interface UseTransformTextOptions {
  characters?: Character[] | null;
  executeCharacterTransform: (payload: TransformRequest & { characterId: string; traceId: string }) => Promise<string>;
  generateTraceId?: () => string;
  hashCharacterId?: (characterId: string) => string;
  trackEvent?: (name: string, payload?: Record<string, unknown>) => void;
  onSuccess?: (result: TransformSuccess) => void;
  onError?: (error: unknown) => void;
}

export interface UseTransformTextResult {
  isTransforming: boolean;
  transformedText: string | null;
  error: unknown;
  lastTraceId: string | null;
  lastRequest: TransformRequest | null;
  transform: (request: TransformRequest) => Promise<TransformSuccess>;
  refresh: (options?: { refinementHints?: string[]; currentOutput?: string }) => Promise<TransformSuccess>;
  reset: () => void;
}

function defaultTraceIdFactory() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `trace-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function defaultHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function resolveCharacterId(request: TransformRequest, characters?: Character[] | null): string | null {
  const trimmed = request.characterId?.trim();
  if (trimmed) {
    return trimmed;
  }
  if (!characters || characters.length === 0) {
    return null;
  }
  const fallback = characters.find((char) => char?.is_default) ?? characters[0];
  return fallback?.id ?? null;
}

function sanitizeHints(hints?: string[] | null): string[] | undefined {
  if (!Array.isArray(hints)) {
    return undefined;
  }

  const sanitized = hints
    .map((hint) => (typeof hint === "string" ? hint.trim() : ""))
    .filter((hint) => hint.length > 0)
    .slice(0, 5)
    .map((hint) => hint.slice(0, 240));

  return sanitized.length > 0 ? sanitized : undefined;
}

export function useTransformText({
  characters,
  executeCharacterTransform,
  generateTraceId = defaultTraceIdFactory,
  hashCharacterId = defaultHash,
  trackEvent,
  onSuccess,
  onError,
}: UseTransformTextOptions): UseTransformTextResult {
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformedText, setTransformedText] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [lastTraceId, setLastTraceId] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<TransformRequest | null>(null);

  const availableCharacters = useMemo(() => characters ?? [], [characters]);

  const runTransform = useCallback(
    async (
      request: TransformRequest,
      options?: {
        refinementHints?: string[];
        isRefresh?: boolean;
      }
    ): Promise<TransformSuccess> => {
      const characterId = resolveCharacterId(request, availableCharacters);
      if (!characterId) {
        const missingError = new Error("Nenhum characterId disponível");
        setError(missingError);
        onError?.(missingError);
        throw missingError;
      }

      const sanitizedHints = sanitizeHints(options?.refinementHints ?? request.refinementHints);
      const isRefreshOperation = options?.isRefresh ?? request.isRefresh ?? false;
      const traceId = generateTraceId();
      const previousTraceId = lastTraceId;
      const startedAt = typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : Date.now();
      const characterHash = hashCharacterId(characterId);

      if (isRefreshOperation) {
        trackEvent?.("character_transform_refresh_attempt", {
          traceId,
          baseTraceId: previousTraceId,
          transformationType: request.transformationType,
          length: request.length,
          characterIdHash: characterHash,
          hintsCount: sanitizedHints?.length ?? 0,
        });
      } else {
        trackEvent?.("metric.character_transform_success_rate", {
          traceId,
          hasCharacter: true,
          outcome: "attempt",
          transformationType: request.transformationType,
          length: request.length,
          characterIdHash: characterHash,
        });
      }

      setIsTransforming(true);
      setError(null);
      setLastTraceId(traceId);

      try {
        const payload = await executeCharacterTransform({
          ...request,
          characterId,
          traceId,
          refinementHints: sanitizedHints,
          currentOutput: request.currentOutput,
          isRefresh: isRefreshOperation,
        });

        if (!payload) {
          const emptyResponseError = new Error("Resposta inválida do servidor");
          throw emptyResponseError;
        }

        const finishedAt = typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : Date.now();
        const duration = Math.max(0, Math.round(finishedAt - startedAt));

        setTransformedText(payload);

        const baseForNext: TransformRequest = {
          ...request,
          characterId,
          currentOutput: payload,
          traceId: undefined,
          refinementHints: undefined,
          isRefresh: undefined,
        };
        setLastRequest(baseForNext);

        const success: TransformSuccess = {
          transformedText: payload,
          traceId,
          isRefresh: isRefreshOperation,
          metadata: {
            characterIdHash: characterHash,
            requestDurationMs: duration,
            hintsApplied: sanitizedHints ?? [],
            baseTraceId: previousTraceId ?? null,
          },
        };

        if (isRefreshOperation) {
          trackEvent?.("character_transform_refresh_success", {
            traceId,
            baseTraceId: previousTraceId,
            transformationType: request.transformationType,
            length: request.length,
            characterIdHash: characterHash,
            hintsCount: sanitizedHints?.length ?? 0,
            requestDurationMs: duration,
          });
        } else {
          trackEvent?.("metric.character_transform_success_rate", {
            traceId,
            hasCharacter: true,
            outcome: "success",
            transformationType: request.transformationType,
            length: request.length,
            characterIdHash: characterHash,
            requestDurationMs: duration,
          });
        }

        onSuccess?.(success);
        return success;
      } catch (cause) {
        const finishedAt = typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : Date.now();
        const duration = Math.max(0, Math.round(finishedAt - startedAt));
        const failureMessage = cause instanceof Error ? cause.message : typeof cause === "string" ? cause : "Erro desconhecido";

        if (isRefreshOperation) {
          trackEvent?.("character_transform_refresh_failure", {
            traceId,
            baseTraceId: previousTraceId,
            transformationType: request.transformationType,
            length: request.length,
            characterIdHash: characterHash,
            hintsCount: sanitizedHints?.length ?? 0,
            requestDurationMs: duration,
            reason: failureMessage,
          });
        } else {
          trackEvent?.("metric.character_transform_success_rate", {
            traceId,
            hasCharacter: true,
            outcome: "failure",
            reason: failureMessage,
            transformationType: request.transformationType,
            length: request.length,
            characterIdHash: characterHash,
            requestDurationMs: duration,
          });
        }

        setError(cause);
        onError?.(cause);
        throw cause;
      } finally {
        setIsTransforming(false);
      }
    },
    [
      availableCharacters,
      executeCharacterTransform,
      generateTraceId,
      hashCharacterId,
      lastTraceId,
      onError,
      onSuccess,
      trackEvent,
    ]
  );

  const transform = useCallback(
    (request: TransformRequest) =>
      runTransform(
        {
          ...request,
          isRefresh: false,
        },
        { refinementHints: request.refinementHints, isRefresh: false }
      ),
    [runTransform]
  );

  const refresh = useCallback(
    async (options: { refinementHints?: string[]; currentOutput?: string } = {}) => {
      if (!lastRequest) {
        const refreshError = new Error("Nenhuma transformação disponível para refresh");
        setError(refreshError);
        onError?.(refreshError);
        throw refreshError;
      }

      return runTransform(
        {
          ...lastRequest,
          currentOutput: options.currentOutput ?? transformedText ?? lastRequest.currentOutput,
          refinementHints: options.refinementHints ?? lastRequest.refinementHints,
          isRefresh: true,
        },
        {
          refinementHints: options.refinementHints ?? lastRequest.refinementHints,
          isRefresh: true,
        }
      );
    },
    [lastRequest, onError, runTransform, transformedText]
  );

  const reset = useCallback(() => {
    setTransformedText(null);
    setError(null);
    setLastTraceId(null);
    setLastRequest(null);
  }, []);

  return {
    isTransforming,
    transformedText,
    error,
    lastTraceId,
    lastRequest,
    transform,
    refresh,
    reset,
  };
}
