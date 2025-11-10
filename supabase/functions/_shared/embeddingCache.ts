// Utilitário compartilhado para cache de embeddings
// Evita regenerar embeddings para textos idênticos (TTL: 30 dias)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(supabaseUrl, supabaseServiceKey);

const CACHE_TTL_DAYS = 30;

/**
 * Gera hash SHA-256 do texto para uso como chave de cache
 */
async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Busca embedding no cache
 * Retorna null se não encontrado ou expirado
 */
export async function getCachedEmbedding(
  text: string,
  model: string = 'text-embedding-3-small'
): Promise<number[] | null> {
  try {
    const textHash = await hashText(text);

    const { data, error } = await admin
      .from('embedding_cache')
      .select('embedding, embedding_jsonb, expires_at')
      .eq('text_hash', textHash)
      .eq('model_name', model)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    // Se expirado, retornar null
    if (new Date(data.expires_at) < new Date()) {
      return null;
    }

    // Retornar embedding (pgvector ou JSONB)
    if (data.embedding) {
      // Se é string (pgvector), converter para array
      if (typeof data.embedding === 'string') {
        try {
          return JSON.parse(data.embedding);
        } catch {
          // Se falhar, tentar extrair do formato [1,2,3]
          const match = data.embedding.match(/\[(.*?)\]/);
          if (match) {
            return match[1].split(',').map(Number);
          }
        }
      }
      // Se já é array, retornar diretamente
      if (Array.isArray(data.embedding)) {
        return data.embedding;
      }
    }

    // Fallback: usar JSONB
    if (data.embedding_jsonb && Array.isArray(data.embedding_jsonb)) {
      return data.embedding_jsonb;
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar cache de embedding:', error);
    return null;
  }
}

/**
 * Armazena embedding no cache
 */
export async function cacheEmbedding(
  text: string,
  embedding: number[],
  model: string = 'text-embedding-3-small'
): Promise<void> {
  try {
    const textHash = await hashText(text);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);

    // Verificar se pgvector está disponível
    let pgvectorAvailable = false;
    try {
      const { data } = await admin.rpc('pgvector_available');
      pgvectorAvailable = data === true;
    } catch {
      pgvectorAvailable = false;
    }

    const cacheData: any = {
      text_hash: textHash,
      text_content: text.substring(0, 1000), // Limitar tamanho para evitar problemas
      model_name: model,
      expires_at: expiresAt.toISOString(),
      embedding_jsonb: embedding, // Sempre armazenar em JSONB como fallback
    };

    if (pgvectorAvailable) {
      // Formato string para pgvector
      cacheData.embedding = `[${embedding.join(',')}]`;
    }

    // Usar upsert para atualizar se já existir
    const { error } = await admin
      .from('embedding_cache')
      .upsert(cacheData, {
        onConflict: 'text_hash',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('Erro ao armazenar cache de embedding:', error);
      // Não lançar erro - cache é opcional
    }
  } catch (error) {
    console.error('Erro ao armazenar cache de embedding:', error);
    // Não lançar erro - cache é opcional
  }
}

/**
 * Limpa cache expirado (chamado periodicamente)
 */
export async function cleanupExpiredCache(): Promise<number> {
  try {
    const { data, error } = await admin.rpc('cleanup_expired_embeddings');
    
    if (error) {
      console.error('Erro ao limpar cache expirado:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Erro ao limpar cache expirado:', error);
    return 0;
  }
}

