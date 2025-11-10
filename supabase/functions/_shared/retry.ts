// Utilitário compartilhado para retry com exponential backoff
// Usado em Edge Functions para chamadas de API externas

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableStatusCodes?: number[];
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [429, 500, 502, 503, 504], // Rate limit e erros temporários
};

/**
 * Executa uma função com retry e exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | null = null;
  let delay = opts.initialDelayMs;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Se não é tentativa final e erro é retryable, tentar novamente
      if (attempt < opts.maxRetries) {
        // Verificar se é erro HTTP retryable
        const isRetryable = 
          error.status && opts.retryableStatusCodes.includes(error.status) ||
          error.message?.includes('timeout') ||
          error.message?.includes('network') ||
          error.name === 'AbortError';

        if (!isRetryable) {
          // Erro não é retryable, lançar imediatamente
          throw error;
        }

        // Aguardar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Aumentar delay para próxima tentativa (exponential backoff)
        delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
      } else {
        // Última tentativa falhou, lançar erro
        throw error;
      }
    }
  }

  // Nunca deve chegar aqui, mas TypeScript precisa disso
  throw lastError || new Error('Retry failed');
}

/**
 * Wrapper para fetch com retry automático
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return retryWithBackoff(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Se status code indica erro retryable, lançar erro para trigger retry
      if (!response.ok && retryOptions.retryableStatusCodes?.includes(response.status)) {
        const error: any = new Error(`HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }

      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw error;
    }
  }, retryOptions);
}

