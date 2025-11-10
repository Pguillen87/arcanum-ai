// Adapter para integração com OpenAI (GPT e Whisper)
// Isola chamadas à API para facilitar testes e manutenção
import { Observability } from '@/lib/observability';

export interface TranscribeAudioParams {
  audioUrl: string;
  language?: string;
}

export interface TranscribeAudioResult {
  text: string;
  confidence?: number;
}

export interface GenerateTextParams {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface GenerateTextResult {
  output: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenAIAdapter {
  transcribeAudio: (params: TranscribeAudioParams) => Promise<TranscribeAudioResult>;
  generateText: (params: GenerateTextParams) => Promise<GenerateTextResult>;
}

const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 2000;
const DEFAULT_TIMEOUT_MS = 60000; // 60 segundos

// Helper para fazer requisições com timeout e retry
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (attempt === maxRetries - 1) throw error;
      // Retry exponencial
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  throw new Error('Max retries exceeded');
}

export const openaiAdapter: OpenAIAdapter = {
  async transcribeAudio(params) {
    try {
      // Nota: Em produção, isso seria feito na Edge Function
      // Este adapter é para uso no frontend (se necessário) ou como referência
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY não configurada');
      }

      // Download do áudio (se necessário)
      const audioResponse = await fetch(params.audioUrl);
      const audioBlob = await audioResponse.blob();
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.mp3');
      formData.append('model', 'whisper-1');
      if (params.language) {
        formData.append('language', params.language);
      }

      const response = await fetchWithRetry('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        text: data.text,
        confidence: data.confidence,
      };
    } catch (error: any) {
      Observability.trackError(error);
      throw error;
    }
  },

  async generateText(params) {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY não configurada');
      }

      const messages = [
        ...(params.systemPrompt ? [{ role: 'system', content: params.systemPrompt }] : []),
        { role: 'user', content: params.prompt },
      ];

      const response = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: params.model || DEFAULT_MODEL,
          messages,
          temperature: params.temperature ?? DEFAULT_TEMPERATURE,
          max_tokens: params.maxTokens ?? DEFAULT_MAX_TOKENS,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        output: data.choices[0]?.message?.content || '',
        usage: data.usage,
      };
    } catch (error: any) {
      Observability.trackError(error);
      throw error;
    }
  },
};

