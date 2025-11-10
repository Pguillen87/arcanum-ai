// src/utils/textChunking.ts
// Estratégia de chunking inteligente para textos longos

const CHUNK_SIZE_TOKENS = 800; // ~1000 caracteres, deixando margem
const CHUNK_OVERLAP_TOKENS = 100; // Overlap para contexto

/**
 * Divide um texto em chunks menores para processamento
 * Tenta quebrar em pontos de frase quando possível
 */
export function chunkText(text: string): string[] {
  // Estimativa: 1 token ≈ 4 caracteres
  const estimatedTokens = Math.ceil(text.length / 4);
  
  if (estimatedTokens <= CHUNK_SIZE_TOKENS) {
    return [text]; // Texto cabe em um chunk
  }
  
  const chunks: string[] = [];
  const chunkSizeChars = CHUNK_SIZE_TOKENS * 4;
  const overlapChars = CHUNK_OVERLAP_TOKENS * 4;
  
  let start = 0;
  while (start < text.length) {
    let end = start + chunkSizeChars;
    
    // Tentar quebrar em ponto de frase (., !, ?)
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastExclamation = text.lastIndexOf('!', end);
      const lastQuestion = text.lastIndexOf('?', end);
      const lastBreak = Math.max(lastPeriod, lastExclamation, lastQuestion);
      
      // Se encontrou um ponto de frase em pelo menos 50% do chunk, usar ele
      if (lastBreak > start + chunkSizeChars * 0.5) {
        end = lastBreak + 1; // Incluir o ponto
      }
    }
    
    chunks.push(text.slice(start, end).trim());
    start = end - overlapChars; // Overlap para contexto
  }
  
  // Filtrar chunks muito pequenos (menos de 50 caracteres)
  return chunks.filter(chunk => chunk.length >= 50);
}

/**
 * Estima o número de tokens em um texto
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Verifica se um texto precisa ser chunked
 */
export function needsChunking(text: string): boolean {
  return estimateTokens(text) > CHUNK_SIZE_TOKENS;
}

