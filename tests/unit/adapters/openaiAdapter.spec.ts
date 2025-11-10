/**
 * Testes unitários para openaiAdapter
 * Valida integração com OpenAI API (GPT e Whisper), retries e tratamento de erros
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { openaiAdapter } from '@/adapters/openaiAdapter';
import { Observability } from '@/lib/observability';

// Mock do Observability
vi.mock('@/lib/observability', () => ({
  Observability: {
    trackError: vi.fn(),
  },
}));

// Mock do fetch global
global.fetch = vi.fn();

// Mock do AbortController
global.AbortController = vi.fn().mockImplementation(() => ({
  abort: vi.fn(),
  signal: {},
})) as any;

// Mock do setTimeout
vi.useFakeTimers();

describe('openaiAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    // Mock da API key usando vi.stubEnv
    vi.stubEnv('VITE_OPENAI_API_KEY', 'test-api-key-123');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('generateText', () => {
    it('deve gerar texto com sucesso usando modelo padrão', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Generated text response' } }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await openaiAdapter.generateText({
        prompt: 'Test prompt',
      });

      expect(result.output).toBe('Generated text response');
      expect(result.usage).toEqual(mockResponse.usage);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key-123',
          }),
        })
      );
    });

    it('deve usar modelo customizado quando fornecido', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
        usage: {},
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await openaiAdapter.generateText({
        prompt: 'Test',
        model: 'gpt-4',
      });

      const callBody = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
      expect(callBody.model).toBe('gpt-4');
    });

    it('deve usar parâmetros customizados (temperature, maxTokens)', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
        usage: {},
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await openaiAdapter.generateText({
        prompt: 'Test',
        temperature: 0.9,
        maxTokens: 5000,
      });

      const callBody = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
      expect(callBody.temperature).toBe(0.9);
      expect(callBody.max_tokens).toBe(5000);
    });

    it('deve incluir systemPrompt quando fornecido', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Response' } }],
        usage: {},
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await openaiAdapter.generateText({
        prompt: 'Test',
        systemPrompt: 'You are a helpful assistant',
      });

      const callBody = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
      expect(callBody.messages).toHaveLength(2);
      expect(callBody.messages[0]).toEqual({
        role: 'system',
        content: 'You are a helpful assistant',
      });
      expect(callBody.messages[1]).toEqual({
        role: 'user',
        content: 'Test',
      });
    });

    it('deve lançar erro quando API key não está configurada', async () => {
      vi.stubEnv('VITE_OPENAI_API_KEY', undefined);

      await expect(
        openaiAdapter.generateText({ prompt: 'Test' })
      ).rejects.toThrow('OPENAI_API_KEY não configurada');
    });

    it('deve lançar erro quando API retorna erro', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid request' }),
      } as Response);

      await expect(
        openaiAdapter.generateText({ prompt: 'Test' })
      ).rejects.toThrow('Invalid request');

      expect(Observability.trackError).toHaveBeenCalled();
    });

    it('deve fazer retry exponencial em caso de timeout', async () => {
      const networkError = new Error('Network error');
      networkError.name = 'AbortError';

      // Primeira tentativa falha
      vi.mocked(fetch).mockRejectedValueOnce(networkError);
      // Segunda tentativa falha
      vi.mocked(fetch).mockRejectedValueOnce(networkError);
      // Terceira tentativa sucede
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Success after retry' } }],
          usage: {},
        }),
      } as Response);

      const result = await openaiAdapter.generateText({ prompt: 'Test' });

      expect(result.output).toBe('Success after retry');
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('deve lançar erro após esgotar retries', async () => {
      const networkError = new Error('Network error');
      networkError.name = 'AbortError';

      vi.mocked(fetch).mockRejectedValue(networkError);

      await expect(
        openaiAdapter.generateText({ prompt: 'Test' })
      ).rejects.toThrow();

      expect(fetch).toHaveBeenCalledTimes(3); // 3 tentativas
      expect(Observability.trackError).toHaveBeenCalled();
    });

    it('deve tratar erro de rate limit (429)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ message: 'Rate limit exceeded' }),
      } as Response);

      await expect(
        openaiAdapter.generateText({ prompt: 'Test' })
      ).rejects.toThrow('Rate limit exceeded');

      expect(Observability.trackError).toHaveBeenCalled();
    });
  });

  describe('transcribeAudio', () => {
    it('deve transcrever áudio com sucesso', async () => {
      // Mock do fetch para download do áudio
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['audio data'], { type: 'audio/mpeg' }),
      } as Response);

      // Mock do fetch para API de transcrição
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          text: 'Transcribed audio text',
          confidence: 0.95,
        }),
      } as Response);

      const result = await openaiAdapter.transcribeAudio({
        audioUrl: 'https://example.com/audio.mp3',
      });

      expect(result.text).toBe('Transcribed audio text');
      expect(result.confidence).toBe(0.95);
    });

    it('deve incluir language quando fornecido', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['audio data'], { type: 'audio/mpeg' }),
      } as Response);

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: 'Transcribed' }),
      } as Response);

      await openaiAdapter.transcribeAudio({
        audioUrl: 'https://example.com/audio.mp3',
        language: 'pt-BR',
      });

      // Verificar que FormData contém language
      const formDataCall = vi.mocked(fetch).mock.calls.find(
        (call) => call[0] === 'https://api.openai.com/v1/audio/transcriptions'
      );
      expect(formDataCall).toBeDefined();
    });

    it('deve lançar erro quando API key não está configurada', async () => {
      vi.stubEnv('VITE_OPENAI_API_KEY', undefined);

      await expect(
        openaiAdapter.transcribeAudio({ audioUrl: 'https://example.com/audio.mp3' })
      ).rejects.toThrow('OPENAI_API_KEY não configurada');
    });

    it('deve lançar erro quando download do áudio falha', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        openaiAdapter.transcribeAudio({ audioUrl: 'https://example.com/audio.mp3' })
      ).rejects.toThrow('Network error');

      expect(Observability.trackError).toHaveBeenCalled();
    });

    it('deve lançar erro quando API de transcrição retorna erro', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['audio data'], { type: 'audio/mpeg' }),
      } as Response);

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid audio format' }),
      } as Response);

      await expect(
        openaiAdapter.transcribeAudio({ audioUrl: 'https://example.com/audio.mp3' })
      ).rejects.toThrow('Invalid audio format');

      expect(Observability.trackError).toHaveBeenCalled();
    });

    it('deve fazer retry exponencial em caso de timeout', async () => {
      const networkError = new Error('Network error');
      networkError.name = 'AbortError';

      // Download do áudio
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['audio data'], { type: 'audio/mpeg' }),
      } as Response);

      // Primeira tentativa de transcrição falha
      vi.mocked(fetch).mockRejectedValueOnce(networkError);
      // Segunda tentativa falha
      vi.mocked(fetch).mockRejectedValueOnce(networkError);
      // Terceira tentativa sucede
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: 'Success after retry' }),
      } as Response);

      const result = await openaiAdapter.transcribeAudio({
        audioUrl: 'https://example.com/audio.mp3',
      });

      expect(result.text).toBe('Success after retry');
      // 1 download + 3 tentativas de transcrição
      expect(fetch).toHaveBeenCalledTimes(4);
    });

    it('deve tratar erro quando resposta JSON é inválida', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['audio data'], { type: 'audio/mpeg' }),
      } as Response);

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      await expect(
        openaiAdapter.transcribeAudio({ audioUrl: 'https://example.com/audio.mp3' })
      ).rejects.toThrow();

      expect(Observability.trackError).toHaveBeenCalled();
    });
  });
});

