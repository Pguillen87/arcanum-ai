import type { Mock } from "vitest";
import { beforeEach, afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { transcriptionService } from "../transcriptionService";

const originalFetch = global.fetch;

const mockGetSession = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

vi.mock("@/lib/observability", () => ({
  Observability: {
    trackError: vi.fn(),
    trackEvent: vi.fn(),
  },
}));

describe("transcriptionService.transcribeAudio — contrato assíncrono", () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: "token-123",
          user: { id: "user-1" },
        },
      },
    });
    mockFrom.mockReset();
    global.fetch = vi.fn() as unknown as typeof global.fetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("normaliza respostas que retornam apenas jobId e status queued", async () => {
    (global.fetch as unknown as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        jobId: "job-1",
        transcriptionId: "transcription-1",
        status: "queued",
        language: "pt",
      }),
    });

    const { data, error } = await transcriptionService.transcribeAudio({
      assetId: "asset-1",
      language: "pt",
    });

    expect(error).toBeNull();
    expect(data).toMatchObject({
      transcriptionId: "transcription-1",
      status: "queued",
      text: "",
      language: "pt",
    });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/functions/v1/transcribe_audio"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer token-123",
        }),
      }),
    );
  });

  it("retorna erro quando backend não envia identificadores válidos", async () => {
    (global.fetch as unknown as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "queued",
      }),
    });

    const { data, error } = await transcriptionService.transcribeAudio({
      assetId: "asset-1",
      language: "pt",
    });

    expect(data).toBeNull();
    expect(error?.message).toContain("Resposta inválida");
  });
});


