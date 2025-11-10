// supabase/functions/brand_voice_train/index.ts
// Edge Function para treinar voz da marca a partir de samples textuais

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth } from "../_shared/auth.ts";
import { validateBrandProfileOwnership } from "../_shared/ownership.ts";
import { checkRateLimit, getRequestIP, checkIPRateLimit } from "../_shared/rateLimiter.ts";
import { getSecurityHeaders, validateUUID } from "../_shared/security.ts";
import { getBrandVoiceForUser } from "../_shared/brandVoice.ts";
import { checkDracmasBalance, debitDracmas } from "../_shared/dracmas.ts";
import { getCachedEmbedding, cacheEmbedding } from "../_shared/embeddingCache.ts";
import { fetchWithRetry } from "../_shared/retry.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const openaiKey = Deno.env.get("OPENAI_API_KEY")!;

const admin = createClient(supabaseUrl, supabaseServiceKey);

// Schemas de validação (simplificados para Edge Function)
interface TrainBrandVoiceRequest {
  brandProfileId?: string; // Compatibilidade: aceita brandProfileId ou characterId
  characterId?: string; // Novo: ID do character (se atualizando)
  name: string;
  description?: string;
  samples: string[];
  isDefault?: boolean;
  modelProvider?: 'openai' | 'anthropic';
  modelName?: string;
  // 8 Dimensões de Personalidade (opcionais para compatibilidade)
  personalityCore?: any;
  communicationTone?: any;
  motivationFocus?: any;
  socialAttitude?: any;
  cognitiveSpeed?: any;
  vocabularyStyle?: any;
  emotionalState?: any;
  valuesTendencies?: string[];
}

interface TrainingResponse {
  brandProfile: {
    id: string;
    name: string;
    description?: string;
    isDefault: boolean;
    modelProvider: string;
    modelName: string;
    createdAt: string;
  };
  stats: {
    samplesProcessed: number;
    embeddingsCreated: number;
    chunksCreated: number;
    trainingTimeMs: number;
  };
}

/**
 * Gera embedding usando OpenAI (com cache)
 */
async function generateEmbedding(text: string, model: string = 'text-embedding-3-small'): Promise<number[]> {
  // 1. Verificar cache primeiro
  const cached = await getCachedEmbedding(text, model);
  if (cached) {
    return cached;
  }

  // 2. Gerar novo embedding se não encontrado no cache
  const response = await fetchWithRetry(
    'https://api.openai.com/v1/embeddings',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model,
        input: text,
      }),
    },
    {
      maxRetries: 3,
      initialDelayMs: 1000,
      retryableStatusCodes: [429, 500, 502, 503, 504],
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao gerar embedding' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const embedding = data.data[0].embedding;

  // 3. Armazenar no cache (não bloquear se falhar)
  cacheEmbedding(text, embedding, model).catch((err) => {
    console.warn('Erro ao armazenar embedding no cache (não crítico):', err);
  });

  return embedding;
}

/**
 * Chunking básico de texto (simplificado)
 */
function chunkText(text: string): string[] {
  const maxChunkSize = 800 * 4; // ~800 tokens = ~3200 caracteres
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + maxChunkSize;
    
    // Tentar quebrar em ponto de frase
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastExclamation = text.lastIndexOf('!', end);
      const lastQuestion = text.lastIndexOf('?', end);
      const lastBreak = Math.max(lastPeriod, lastExclamation, lastQuestion);
      
      if (lastBreak > start + maxChunkSize * 0.5) {
        end = lastBreak + 1;
      }
    }
    
    chunks.push(text.slice(start, end).trim());
    start = end - 200; // Overlap de ~200 caracteres
  }
  
  return chunks.filter(chunk => chunk.length >= 50);
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getSecurityHeaders(req.headers.get('origin')),
    });
  }

  const startTime = Date.now();
  const origin = req.headers.get('origin');

  // Scrub PII para logs
  function scrubPII(input: any): any {
    const str = typeof input === 'string' ? input : JSON.stringify(input);
    if (!str) return input;
    let out = str;
    out = out.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '***@***');
    out = out.replace(/Bearer\s+[A-Za-z0-9\-_.]+/gi, 'Bearer ***');
    out = out.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, '***-uuid-***');
    try {
      return JSON.parse(out);
    } catch {
      return out;
    }
  }

  function auditLog(event: string, metadata: Record<string, any> = {}) {
    const safe = scrubPII(metadata);
    console.log(JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      ...safe
    }));
  }

  try {
    // 1. Validar autenticação
    const auth = await requireAuth(req);
    
    auditLog('brand_voice_training_started', {
      userId: auth.userId,
      plan: auth.plan,
    });
    
    if (!auth.isValid) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        {
          status: 401,
          headers: getSecurityHeaders(origin),
        }
      );
    }

    // 2. Rate limiting por IP
    const ip = getRequestIP(req);
    if (!checkIPRateLimit(ip)) {
      return new Response(
        JSON.stringify({ error: 'Muitas requisições deste IP' }),
        {
          status: 429,
          headers: getSecurityHeaders(origin),
        }
      );
    }

    // 3. Rate limiting por usuário
    const rateLimit = await checkRateLimit(auth.userId, 'training', auth.plan);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit excedido',
          resetAt: rateLimit.resetAt.toISOString(),
        }),
        {
          status: 429,
          headers: {
            ...getSecurityHeaders(origin),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
          },
        }
      );
    }

    // 4. Validar e parsear body
    const body: TrainBrandVoiceRequest = await req.json();

    // Validações básicas
    if (!body.name || body.name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nome é obrigatório' }),
        { status: 400, headers: getSecurityHeaders(origin) }
      );
    }

    if (!body.samples || !Array.isArray(body.samples) || body.samples.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Adicione pelo menos um exemplo de texto' }),
        { status: 400, headers: getSecurityHeaders(origin) }
      );
    }

    if (body.samples.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Máximo de 50 samples permitido' }),
        { status: 400, headers: getSecurityHeaders(origin) }
      );
    }

    // Validar tamanho de cada sample (apenas máximo)
    for (const sample of body.samples) {
      if (sample.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: 'Todos os exemplos devem conter texto' }),
          { status: 400, headers: getSecurityHeaders(origin) }
        );
      }
      if (sample.length > 10000) {
        return new Response(
          JSON.stringify({ error: 'Cada exemplo deve ter no máximo 10000 caracteres' }),
          { status: 400, headers: getSecurityHeaders(origin) }
        );
      }
    }

    // 5. Calcular custo e verificar saldo de Dracmas
    // Custo: 10 Dracmas base + 1 Dracma por sample
    const baseCost = 10;
    const perSampleCost = 1;
    const totalCost = baseCost + (body.samples.length * perSampleCost);

    const { hasEnough, currentBalance, error: dracmasCheckError } = await checkDracmasBalance(
      auth.userId,
      totalCost
    );

    if (dracmasCheckError || !hasEnough) {
      return new Response(
        JSON.stringify({
          error: dracmasCheckError?.message || `Dracmas insuficientes. Necessário: ${totalCost}, Disponível: ${currentBalance}`,
        }),
        { status: 402, headers: getSecurityHeaders(origin) }
      );
    }

    // Validação de limites removida - apenas Dracmas são necessários

    // 7. Determinar se estamos usando characters ou brand_profiles
    const isUsingCharacters = !!(body.characterId || body.personalityCore);
    const targetId = body.characterId || body.brandProfileId;

    // Validar ownership se ID fornecido
    if (targetId) {
      if (!validateUUID(targetId)) {
        return new Response(
          JSON.stringify({ error: 'ID inválido' }),
          { status: 400, headers: getSecurityHeaders(origin) }
        );
      }

      if (isUsingCharacters && body.characterId) {
        // Validar ownership de character
        const { data: character } = await admin
          .from('characters')
          .select('user_id')
          .eq('id', body.characterId)
          .eq('user_id', auth.userId)
          .single();
        
        if (!character) {
          return new Response(
            JSON.stringify({ error: 'Personagem não encontrado ou acesso negado' }),
            { status: 403, headers: getSecurityHeaders(origin) }
          );
        }
      } else if (body.brandProfileId) {
        // Validar ownership de brand_profile (compatibilidade)
        const isOwner = await validateBrandProfileOwnership(auth.userId, body.brandProfileId);
        if (!isOwner) {
          return new Response(
            JSON.stringify({ error: 'Perfil não encontrado ou acesso negado' }),
            { status: 403, headers: getSecurityHeaders(origin) }
          );
        }
      }
    }

    // 8. Processar samples e gerar embeddings
    let samplesProcessed = 0;
    let embeddingsCreated = 0;
    let chunksCreated = 0;

    // Criar ou atualizar character/brand_profile
    let characterId: string | null = null;
    let brandProfileId: string | null = null;

    if (isUsingCharacters) {
      // Usar tabela characters
      if (body.characterId) {
        // Atualizar character existente
        const { error: updateError } = await admin
          .from('characters')
          .update({
            name: body.name.trim(),
            description: body.description?.trim(),
            is_default: body.isDefault,
            model_provider: body.modelProvider || 'openai',
            model_name: body.modelName || 'gpt-4o',
            personality_core: body.personalityCore || {},
            communication_tone: body.communicationTone || {},
            motivation_focus: body.motivationFocus || {},
            social_attitude: body.socialAttitude || {},
            cognitive_speed: body.cognitiveSpeed || {},
            vocabulary_style: body.vocabularyStyle || {},
            emotional_state: body.emotionalState || {},
            values_tendencies: body.valuesTendencies || [],
          })
          .eq('id', body.characterId);

        if (updateError) {
          throw new Error(`Erro ao atualizar personagem: ${updateError.message}`);
        }
        characterId = body.characterId;
      } else {
        // Criar novo character
        const { data: newCharacter, error: createError } = await admin
          .from('characters')
          .insert({
            user_id: auth.userId,
            name: body.name.trim(),
            description: body.description?.trim(),
            is_default: body.isDefault || false,
            model_provider: body.modelProvider || 'openai',
            model_name: body.modelName || 'gpt-4o',
            personality_core: body.personalityCore || {},
            communication_tone: body.communicationTone || {},
            motivation_focus: body.motivationFocus || {},
            social_attitude: body.socialAttitude || {},
            cognitive_speed: body.cognitiveSpeed || {},
            vocabulary_style: body.vocabularyStyle || {},
            emotional_state: body.emotionalState || {},
            values_tendencies: body.valuesTendencies || [],
          })
          .select()
          .single();

        if (createError) {
          throw new Error(`Erro ao criar personagem: ${createError.message}`);
        }
        characterId = newCharacter.id;
      }
    } else {
      // Usar tabela brand_profiles (compatibilidade)
      if (body.brandProfileId) {
        // Atualizar perfil existente
        const { error: updateError } = await admin
          .from('brand_profiles')
          .update({
            name: body.name.trim(),
            description: body.description?.trim(),
            is_default: body.isDefault,
            model_provider: body.modelProvider,
            model_name: body.modelName,
          })
          .eq('id', body.brandProfileId);

        if (updateError) {
          throw new Error(`Erro ao atualizar perfil: ${updateError.message}`);
        }
        brandProfileId = body.brandProfileId;
      } else {
        // Criar novo perfil
        const { data: newProfile, error: createError } = await admin
          .from('brand_profiles')
          .insert({
            user_id: auth.userId,
            name: body.name.trim(),
            description: body.description?.trim(),
            is_default: body.isDefault || false,
            model_provider: body.modelProvider || 'openai',
            model_name: body.modelName || 'gpt-4o',
            metadata: {},
          })
          .select()
          .single();

        if (createError) {
          throw new Error(`Erro ao criar perfil: ${createError.message}`);
        }
        brandProfileId = newProfile.id;
      }
    }

    // 9. Processar samples e criar embeddings
    for (const sampleText of body.samples) {
      const chunks = chunkText(sampleText);
      chunksCreated += chunks.length;

      // Criar registro de sample (characters ou brand_profiles)
      let sampleId: string;
      
      if (isUsingCharacters && characterId) {
        const { data: sample, error: sampleError } = await admin
          .from('character_samples')
          .insert({
            character_id: characterId,
            user_id: auth.userId,
            text_content: sampleText,
            source_type: 'manual',
          })
          .select()
          .single();

        if (sampleError) {
          console.error('Erro ao criar sample:', sampleError);
          continue;
        }
        sampleId = sample.id;
      } else if (brandProfileId) {
        const { data: sample, error: sampleError } = await admin
          .from('brand_samples')
          .insert({
            brand_profile_id: brandProfileId,
            user_id: auth.userId,
            text_content: sampleText,
            source_type: 'manual',
          })
          .select()
          .single();

        if (sampleError) {
          console.error('Erro ao criar sample:', sampleError);
          continue;
        }
        sampleId = sample.id;
      } else {
        continue;
      }

      // Gerar embeddings para cada chunk
      for (let i = 0; i < chunks.length; i++) {
        try {
          const embedding = await generateEmbedding(chunks[i]);
          embeddingsCreated++;

          // Verificar se pgvector está disponível
          let pgvectorAvailable = false;
          try {
            const { data } = await admin.rpc('pgvector_available');
            pgvectorAvailable = data === true;
          } catch {
            pgvectorAvailable = false;
          }
          
          if (isUsingCharacters && characterId) {
            // Usar character_embeddings
            if (pgvectorAvailable) {
              await admin
                .from('character_embeddings')
                .insert({
                  character_id: characterId,
                  character_sample_id: sampleId,
                  user_id: auth.userId,
                  embedding: `[${embedding.join(',')}]`,
                  text_chunk: chunks[i],
                  chunk_index: i,
                });
            } else {
              await admin
                .from('character_embeddings')
                .insert({
                  character_id: characterId,
                  character_sample_id: sampleId,
                  user_id: auth.userId,
                  embedding: embedding,
                  text_chunk: chunks[i],
                  chunk_index: i,
                });
            }
          } else if (brandProfileId) {
            // Usar brand_embeddings (compatibilidade)
            if (pgvectorAvailable) {
              await admin
                .from('brand_embeddings')
                .insert({
                  brand_profile_id: brandProfileId,
                  brand_sample_id: sampleId,
                  user_id: auth.userId,
                  embedding: `[${embedding.join(',')}]`,
                  text_chunk: chunks[i],
                  chunk_index: i,
                });
            } else {
              await admin
                .from('brand_embeddings')
                .insert({
                  brand_profile_id: brandProfileId,
                  brand_sample_id: sampleId,
                  user_id: auth.userId,
                  embedding: embedding,
                  text_chunk: chunks[i],
                  chunk_index: i,
                });
            }
          }
        } catch (embeddingError) {
          console.error('Erro ao gerar embedding:', embeddingError);
          // Continuar com próximo chunk
        }
      }

      samplesProcessed++;
    }

    // 10. Buscar character/brand_profile atualizado
    let resultProfile: any;
    
    if (isUsingCharacters && characterId) {
      const { data: character, error: fetchError } = await admin
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .single();

      if (fetchError || !character) {
        throw new Error('Erro ao buscar personagem criado');
      }
      resultProfile = character;
    } else if (brandProfileId) {
      const { data: brandProfile, error: fetchError } = await admin
        .from('brand_profiles')
        .select('*')
        .eq('id', brandProfileId)
        .single();

      if (fetchError || !brandProfile) {
        throw new Error('Erro ao buscar perfil criado');
      }
      resultProfile = brandProfile;
    } else {
      throw new Error('Nenhum perfil ou personagem criado');
    }

    const trainingTimeMs = Date.now() - startTime;

    // 11. Debitar Dracmas APÓS treinamento bem-sucedido (conforme ADR 003)
    const { data: updatedBalance, error: debitError } = await debitDracmas(
      auth.userId,
      totalCost,
      `Treinamento ${isUsingCharacters ? 'de Personagem' : 'de Brand Voice'}: ${body.name}`,
      isUsingCharacters ? 'character_training' : 'brand_voice_training',
      resultProfile.id
    );

    if (debitError) {
      // Rollback: deletar character/perfil criado se débito falhar
      auditLog(`${isUsingCharacters ? 'character' : 'brand_voice'}_training_rollback`, {
        userId: auth.userId,
        [isUsingCharacters ? 'characterId' : 'brandProfileId']: resultProfile.id,
        reason: 'Falha ao debitar Dracmas',
        error: debitError.message,
      });

      // Tentar deletar character/perfil criado (apenas se foi criado nesta requisição)
      if (!targetId) {
        if (isUsingCharacters && characterId) {
          await admin
            .from('characters')
            .delete()
            .eq('id', characterId)
            .catch((err) => {
              console.error('Erro ao fazer rollback do personagem:', err);
            });
        } else if (brandProfileId) {
          await admin
            .from('brand_profiles')
            .delete()
            .eq('id', brandProfileId)
            .catch((err) => {
              console.error('Erro ao fazer rollback do perfil:', err);
            });
        }
      }

      return new Response(
        JSON.stringify({
          error: `Erro ao debitar Dracmas: ${debitError.message || 'Erro desconhecido'}`,
        }),
        { status: 500, headers: getSecurityHeaders(origin) }
      );
    }

    // 12. Log de sucesso
    auditLog(`${isUsingCharacters ? 'character' : 'brand_voice'}_training_completed`, {
      userId: auth.userId,
      [isUsingCharacters ? 'characterId' : 'brandProfileId']: resultProfile.id,
      samplesProcessed,
      embeddingsCreated,
      chunksCreated,
      trainingTimeMs,
      dracmasDebited: totalCost,
      remainingBalance: updatedBalance?.balance || 0,
    });

    // 13. Retornar resposta (compatível com ambos os formatos)
    const response: TrainingResponse = {
      brandProfile: {
        id: resultProfile.id,
        name: resultProfile.name,
        description: resultProfile.description || undefined,
        isDefault: resultProfile.is_default,
        modelProvider: resultProfile.model_provider,
        modelName: resultProfile.model_name,
        createdAt: resultProfile.created_at,
      },
      stats: {
        samplesProcessed,
        embeddingsCreated,
        chunksCreated,
        trainingTimeMs,
      },
    };
    
    // Adicionar character ao response se for character
    if (isUsingCharacters) {
      (response as any).character = resultProfile;
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: getSecurityHeaders(origin),
      }
    );

  } catch (error: any) {
    console.error('Erro em brand_voice_train:', error);
    
    // Log de erro (sem PII)
    auditLog('brand_voice_training_failed', {
      error: error.message || 'Erro desconhecido',
      errorType: error.name || 'UnknownError',
    });
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro interno do servidor',
      }),
      {
        status: 500,
        headers: getSecurityHeaders(origin),
      }
    );
  }
});

