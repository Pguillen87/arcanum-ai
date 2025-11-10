// supabase/functions/brand_voice_transform/index.ts
// Edge Function para transformar texto usando voz da marca

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
const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

const admin = createClient(supabaseUrl, supabaseServiceKey);

interface TransformWithBrandVoiceRequest {
  brandProfileId?: string; // Compatibilidade: aceita brandProfileId ou characterId
  characterId?: string; // Novo: ID do character
  inputText: string;
  transformationType: 'post' | 'resumo' | 'newsletter' | 'roteiro';
  tone?: string;
  length?: 'short' | 'medium' | 'long';
  useSimilaritySearch?: boolean;
  similarityThreshold?: number;
  maxSimilarChunks?: number;
  traceId?: string;
  refinementHints?: string[];
  currentOutput?: string;
  isRefresh?: boolean;
}

interface TransformResponse {
  transformedText: string;
  metadata: {
    modelUsed: string;
    provider: string;
    tokensUsed?: number;
    similarityChunksUsed: number;
    processingTimeMs: number;
    isRefresh?: boolean;
    hintsApplied?: number;
  };
}

function sanitizeRefinementHints(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((hint) => (typeof hint === 'string' ? hint.trim() : ''))
    .filter((hint) => hint.length > 0)
    .slice(0, 5)
    .map((hint) => hint.slice(0, 240));
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
 * Busca chunks similares usando embeddings
 */
async function findSimilarChunks(
  queryEmbedding: number[],
  targetId: string,
  threshold: number = 0.7,
  maxChunks: number = 5,
  isUsingCharacters: boolean = false
): Promise<string[]> {
  try {
    // Verificar se pgvector está disponível
    const { data: pgvectorAvailable } = await admin.rpc('pgvector_available').catch(() => ({ data: false }));
    
    if (pgvectorAvailable) {
      if (isUsingCharacters) {
        // Usar função SQL match_character_embeddings
        const { data, error } = await admin.rpc('match_character_embeddings', {
          query_embedding: `[${queryEmbedding.join(',')}]`,
          character_id_param: targetId,
          match_threshold: threshold,
          match_count: maxChunks,
        }).catch(() => ({ data: null, error: { message: 'Função não encontrada' } }));

        if (error) {
          console.error('Erro ao buscar chunks similares:', error);
          // Fallback para busca simples
          return await findSimilarChunksFallback(targetId, maxChunks, true);
        }

        return (data || []).map((item: any) => item.text_chunk);
      } else {
        // Usar função SQL match_brand_embeddings (compatibilidade)
        const { data, error } = await admin.rpc('match_brand_embeddings', {
          query_embedding: `[${queryEmbedding.join(',')}]`,
          profile_id: targetId,
          match_threshold: threshold,
          match_count: maxChunks,
        });

        if (error) {
          console.error('Erro ao buscar chunks similares:', error);
          return await findSimilarChunksFallback(targetId, maxChunks, false);
        }

        return (data || []).map((item: any) => item.text_chunk);
      }
    } else {
      // Fallback: buscar chunks aleatórios (sem busca por similaridade)
      return await findSimilarChunksFallback(targetId, maxChunks, isUsingCharacters);
    }
  } catch (error) {
    console.error('Erro ao buscar chunks similares:', error);
    return [];
  }
}

async function findSimilarChunksFallback(
  targetId: string,
  maxChunks: number,
  isUsingCharacters: boolean
): Promise<string[]> {
  if (isUsingCharacters) {
    const { data, error } = await admin
      .from('character_embeddings')
      .select('text_chunk')
      .eq('character_id', targetId)
      .limit(maxChunks);

    if (error) {
      console.error('Erro ao buscar chunks:', error);
      return [];
    }

    return (data || []).map((item: any) => item.text_chunk);
  } else {
    const { data, error } = await admin
      .from('brand_embeddings')
      .select('text_chunk')
      .eq('brand_profile_id', targetId)
      .limit(maxChunks);

    if (error) {
      console.error('Erro ao buscar chunks:', error);
      return [];
    }

    return (data || []).map((item: any) => item.text_chunk);
  }
}

/**
 * Gera texto usando OpenAI
 */
async function generateTextWithOpenAI(
  prompt: string,
  systemPrompt?: string,
  model: string = 'gpt-4o'
): Promise<{ text: string; tokensUsed?: number }> {
  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    { role: 'user', content: prompt },
  ];

  const response = await fetchWithRetry(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    },
    {
      maxRetries: 2,
      initialDelayMs: 1000,
      retryableStatusCodes: [429, 500, 502, 503, 504],
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao gerar texto' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.choices[0]?.message?.content || '',
    tokensUsed: data.usage?.total_tokens,
  };
}

/**
 * Gera texto usando Anthropic
 */
async function generateTextWithAnthropic(
  prompt: string,
  systemPrompt?: string,
  model: string = 'claude-3-5-sonnet-20241022'
): Promise<{ text: string; tokensUsed?: number }> {
  if (!anthropicKey) {
    throw new Error('ANTHROPIC_API_KEY não configurada');
  }

  const response = await fetchWithRetry(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        temperature: 0.7,
        system: systemPrompt || '',
        messages: [
          { role: 'user', content: prompt },
        ],
      }),
    },
    {
      maxRetries: 2,
      initialDelayMs: 1000,
      retryableStatusCodes: [429, 500, 502, 503, 504],
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro ao gerar texto' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const text = data.content
    .filter((c: any) => c.type === 'text')
    .map((c: any) => c.text)
    .join('');

  return {
    text,
    tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens,
  };
}

/**
 * Constrói prompt enriquecido com contexto da voz
 */
function buildEnrichedPrompt(
  inputText: string,
  transformationType: string,
  profile: any, // character ou brandProfile
  similarChunks: string[],
  tone?: string,
  length?: string,
  isUsingCharacters: boolean = false,
  refinementHints: string[] = [],
  currentOutput?: string | null,
  isRefresh: boolean = false
): string {
  const typePrompts: Record<string, string> = {
    post: "Transforme o seguinte texto em um post para redes sociais, mantendo a essência e tornando-o envolvente e conciso.",
    resumo: "Crie um resumo objetivo e claro do seguinte texto, destacando os pontos principais.",
    newsletter: "Transforme o seguinte conteúdo em uma newsletter profissional e informativa, com estrutura clara e tom adequado.",
    roteiro: "Crie um roteiro estruturado baseado no seguinte conteúdo, com cenas, diálogos e direções quando apropriado.",
  };

  let prompt = typePrompts[transformationType] || typePrompts.post;
  
  if (isUsingCharacters && profile) {
    // Construir prompt baseado nas 8 dimensões de personalidade
    prompt += `\n\nPersonagem: ${profile.name || 'Personagem'}`;
    if (profile.description) {
      prompt += `\nDescrição: ${profile.description}`;
    }
    
    // Dimensões de personalidade
    const personality = profile.personality_core || {};
    const communication = profile.communication_tone || {};
    const motivation = profile.motivation_focus || {};
    const social = profile.social_attitude || {};
    const cognitive = profile.cognitive_speed || {};
    const vocabulary = profile.vocabulary_style || {};
    const emotional = profile.emotional_state || {};
    const values = profile.values_tendencies || [];
    
    prompt += `\n\nPersonalidade do Personagem:`;
    
    if (personality.robotic_human !== undefined) {
      const humanLevel = personality.robotic_human > 70 ? 'muito humano' : personality.robotic_human < 30 ? 'mais técnico/robótico' : 'equilibrado';
      prompt += `\n- Nível de humanidade: ${humanLevel} (${personality.robotic_human}%)`;
    }
    
    if (personality.clown_serious !== undefined) {
      const seriousness = personality.clown_serious > 70 ? 'sério' : personality.clown_serious < 30 ? 'brincalhão' : 'equilibrado';
      prompt += `\n- Seriedade: ${seriousness} (${personality.clown_serious}%)`;
    }
    
    if (communication.formality) {
      prompt += `\n- Formalidade: ${communication.formality === 'formal' ? 'formal' : communication.formality === 'casual' ? 'casual' : 'neutro'}`;
    }
    
    if (communication.enthusiasm) {
      prompt += `\n- Entusiasmo: ${communication.enthusiasm}`;
    }
    
    if (communication.use_emojis) prompt += `\n- Use emojis quando apropriado`;
    if (communication.use_slang) prompt += `\n- Use gírias e linguagem coloquial`;
    if (communication.use_metaphors) prompt += `\n- Use metáforas e linguagem figurada`;
    
    if (motivation.focus) {
      prompt += `\n- Foco principal: ${motivation.focus}`;
    }
    
    if (motivation.seeks) {
      prompt += `\n- Busca: ${motivation.seeks}`;
    }
    
    if (social.type) {
      prompt += `\n- Atitude social: ${social.type === 'proactive' ? 'proativo' : 'reativo'}`;
    }
    
    if (social.curiosity) {
      prompt += `\n- Curiosidade: ${social.curiosity}`;
    }
    
    if (social.reserved_expansive !== undefined) {
      const expansiveness = social.reserved_expansive > 70 ? 'expansivo' : social.reserved_expansive < 30 ? 'reservado' : 'equilibrado';
      prompt += `\n- Reservado/Expansivo: ${expansiveness} (${social.reserved_expansive}%)`;
    }
    
    if (cognitive.speed) {
      prompt += `\n- Velocidade cognitiva: ${cognitive.speed}`;
    }
    
    if (cognitive.depth) {
      prompt += `\n- Profundidade: ${cognitive.depth}`;
    }
    
    if (vocabulary.style) {
      prompt += `\n- Estilo de vocabulário: ${vocabulary.style}`;
    }
    
    if (vocabulary.complexity) {
      prompt += `\n- Complexidade: ${vocabulary.complexity}`;
    }
    
    if (vocabulary.use_figures) prompt += `\n- Use figuras de linguagem`;
    
    if (emotional.current) {
      prompt += `\n- Estado emocional atual: ${emotional.current}`;
    }
    
    if (values.length > 0) {
      prompt += `\n- Valores e tendências: ${values.join(', ')}`;
    }
  } else {
    // Compatibilidade: usar formato antigo de brand_profile
    if (profile.name) {
      prompt += `\n\nVoz da marca: ${profile.name}`;
    }
    if (profile.description) {
      prompt += `\nDescrição: ${profile.description}`;
    }
  }
  
  // Adicionar chunks similares como exemplos
  if (similarChunks.length > 0) {
    prompt += `\n\nExemplos de estilo ${isUsingCharacters ? 'do personagem' : 'da voz'}:\n${similarChunks.slice(0, 3).join('\n\n')}`;
  }
  
  // Adicionar instruções de tom e tamanho
  if (tone) {
    prompt += `\n\nUse um tom ${tone}.`;
  }
  
  const lengthMap: Record<string, string> = {
    short: "Mantenha o conteúdo conciso.",
    medium: "Mantenha um tamanho equilibrado.",
    long: "Pode ser mais detalhado.",
  };
  
  if (length) {
    prompt += `\n${lengthMap[length] || lengthMap.medium}`;
  }

  const effectiveCurrentOutput = currentOutput && currentOutput.trim().length > 0 ? currentOutput : null;

  if (isRefresh) {
    prompt += `\n\nTexto original fornecido pelo usuário (referência):\n${inputText}`;
    prompt += `\n\nTexto atual a ser refinado (mantenha a essência e ajuste apenas o que for solicitado):\n${effectiveCurrentOutput ?? inputText}`;
  } else {
    prompt += `\n\nTexto original:\n${inputText}`;
  }

  if (refinementHints.length > 0) {
    prompt += `\n\nInstruções específicas a serem obedecidas:`;
    refinementHints.forEach((hint, index) => {
      prompt += `\n${index + 1}. ${hint}`;
    });
    prompt += `\n\nGaranta que o texto final siga todas as instruções sem alterar o significado central.`;
  }

  prompt += `\n\nRegras obrigatórias:`;
  prompt += `\n- Não utilize saudações ou apresentações como "Oi", "Olá", "Eu sou" ou "Meu nome é".`;
  prompt += `\n- Comece diretamente com o conteúdo solicitado.`;
  prompt += `\n- Preserve a voz e o estilo definidos acima.`;

  prompt += `\n\nEntregue apenas o texto final ajustado, sem explicações adicionais.`;

  return prompt;
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
  let requestTraceId: string | null = null;

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
    const rateLimit = await checkRateLimit(auth.userId, 'transformation', auth.plan);
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
    const body: TransformWithBrandVoiceRequest = await req.json();
    requestTraceId = body.traceId ?? null;
    const isRefreshOperation = body.isRefresh === true;
    const refinementHints = sanitizeRefinementHints(body.refinementHints);
    body.refinementHints = refinementHints;
    body.currentOutput = typeof body.currentOutput === 'string' ? body.currentOutput.slice(0, 50000) : undefined;
 
    // Validações básicas
    const targetId = body.characterId || body.brandProfileId;
    if (!targetId || !validateUUID(targetId)) {
      return new Response(
        JSON.stringify({ error: 'characterId ou brandProfileId inválido' }),
        { status: 400, headers: getSecurityHeaders(origin) }
      );
    }

    // Se characterId está presente, garantir que será usado (não cair no fallback)
    if (body.characterId && !body.brandProfileId) {
      // Forçar uso do fluxo de characters
      body.brandProfileId = undefined;
    }

    if (!body.inputText || body.inputText.length < 10 || body.inputText.length > 50000) {
      return new Response(
        JSON.stringify({ error: 'inputText deve ter entre 10 e 50000 caracteres' }),
        { status: 400, headers: getSecurityHeaders(origin) }
      );
    }

    // 5. Determinar se estamos usando characters ou brand_profiles
    const isUsingCharacters = !!body.characterId;

    // Validar ownership
    if (isUsingCharacters) {
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
    } else {
      const isOwner = await validateBrandProfileOwnership(auth.userId, body.brandProfileId!);
      if (!isOwner) {
        return new Response(
          JSON.stringify({ error: 'Perfil não encontrado ou acesso negado' }),
          { status: 403, headers: getSecurityHeaders(origin) }
        );
      }
    }

    // 6. Buscar character ou brand_profile
    let character: any = null;
    let brandProfile: any = null;
    
    if (isUsingCharacters) {
      const { data: charData, error: charError } = await admin
        .from('characters')
        .select('*')
        .eq('id', body.characterId)
        .eq('user_id', auth.userId)
        .single();
      
      if (charError || !charData) {
        return new Response(
          JSON.stringify({ error: 'Personagem não encontrado' }),
          { status: 404, headers: getSecurityHeaders(origin) }
        );
      }
      character = charData;
    } else {
      const brandVoiceResult = await getBrandVoiceForUser(auth.userId, body.brandProfileId);
      if (!brandVoiceResult) {
        return new Response(
          JSON.stringify({ error: 'Perfil de voz não encontrado' }),
          { status: 404, headers: getSecurityHeaders(origin) }
        );
      }
      brandProfile = brandVoiceResult.data;
    }

    // 7. Calcular custo estimado (antes de processar)
    // Custo base: 5 Dracmas
    // + custo por chunk de similaridade: 1 Dracma/chunk
    // Estimativa inicial: assumir máximo de chunks (será ajustado após busca)
    const maxChunks = body.maxSimilarChunks || 5;
    const baseCost = isRefreshOperation ? 0 : 5;
    const perChunkCost = isRefreshOperation ? 0 : 1;
    const estimatedMaxCost = baseCost + (maxChunks * perChunkCost);

    // Verificar saldo antes de iniciar transformação
    const { hasEnough, currentBalance, error: dracmasCheckError } = await checkDracmasBalance(
      auth.userId,
      estimatedMaxCost
    );

    if (dracmasCheckError || !hasEnough) {
      return new Response(
        JSON.stringify({
          error: dracmasCheckError?.message || `Dracmas insuficientes. Necessário: ${estimatedMaxCost}, Disponível: ${currentBalance}`,
        }),
        { status: 402, headers: getSecurityHeaders(origin) }
      );
    }

    // 9. Buscar chunks similares se solicitado
    let similarChunks: string[] = [];
    if (!isRefreshOperation && body.useSimilaritySearch !== false) {
      try {
        const queryEmbedding = await generateEmbedding(body.inputText);
        similarChunks = await findSimilarChunks(
          queryEmbedding,
          targetId,
          body.similarityThreshold || 0.7,
          body.maxSimilarChunks || 5,
          isUsingCharacters
        );
      } catch (error) {
        console.error('Erro ao buscar chunks similares:', error);
        // Continuar sem chunks similares
      }
    }

    // Calcular custo real baseado em chunks realmente usados
    let actualCost = isRefreshOperation ? 0 : baseCost + (similarChunks.length * perChunkCost);

    // Validação de limites removida - apenas Dracmas são necessários

    // 10. Determinar provider e modelo
    let provider: 'openai' | 'anthropic' = 'openai';
    let model = 'gpt-4o';

    const profileData = isUsingCharacters ? character : brandProfile;
    
    if (profileData.model_provider === 'anthropic' && auth.plan === 'premium' && anthropicKey) {
      provider = 'anthropic';
      model = profileData.model_name || 'claude-3-5-sonnet-20241022';
    } else {
      provider = 'openai';
      model = profileData.model_name || 'gpt-4o';
    }

    // 11. Construir prompt enriquecido
    const enrichedPrompt = buildEnrichedPrompt(
      body.inputText,
      body.transformationType,
      isUsingCharacters ? character : brandProfile,
      similarChunks,
      body.tone,
      body.length,
      isUsingCharacters,
      refinementHints,
      body.currentOutput ?? null,
      isRefreshOperation
    );

    // 12. Gerar texto transformado
    let result: { text: string; tokensUsed?: number };
    try {
      if (provider === 'anthropic') {
        result = await generateTextWithAnthropic(enrichedPrompt, undefined, model);
      } else {
        result = await generateTextWithOpenAI(enrichedPrompt, undefined, model);
      }
    } catch (error: any) {
      // Fallback: se Anthropic falhar, tentar OpenAI
      if (provider === 'anthropic' && auth.plan === 'premium') {
        auditLog('anthropic_fallback_to_openai', {
          userId: auth.userId,
          brandProfileId: body.brandProfileId,
          error: error.message,
        });
        
        provider = 'openai';
        model = 'gpt-4o';
        result = await generateTextWithOpenAI(enrichedPrompt, undefined, model);
      } else {
        throw error;
      }
    }

    const forbiddenIntroRegex = /^\s*(oi|olá|ola|saudações|e aí|eu sou|meu nome|fala galera|oi pessoal)/i;
    if (forbiddenIntroRegex.test(result.text)) {
      auditLog('brand_voice_transformation_rewrite_due_to_intro', {
        userId: auth.userId,
        [isUsingCharacters ? 'characterId' : 'brandProfileId']: targetId,
        traceId: requestTraceId,
        provider,
        model,
      });

      const enforcementPrompt = `${enrichedPrompt}\n\nATENÇÃO: você iniciou com saudação ou apresentação. Reescreva o texto começando diretamente pelo conteúdo, sem saudações ou apresentação do personagem.`;

      if (provider === 'anthropic') {
        result = await generateTextWithAnthropic(enforcementPrompt, undefined, model);
      } else {
        result = await generateTextWithOpenAI(enforcementPrompt, undefined, model);
      }

      if (forbiddenIntroRegex.test(result.text)) {
        result.text = result.text.replace(forbiddenIntroRegex, '').replace(/^[\s,.!-]+/, '');
      }
    }
 
    const processingTimeMs = Date.now() - startTime;

    // 13. Debitar Dracmas APÓS transformação bem-sucedida (conforme ADR 003)
    let updatedBalance = null;
    if (actualCost > 0) {
      const debitResult = await debitDracmas(
        auth.userId,
        actualCost,
        `Transformação ${isUsingCharacters ? 'com Personagem' : 'Brand Voice'}: ${body.transformationType}`,
        isUsingCharacters ? 'character_transform' : 'brand_voice_transform',
        targetId
      );

      updatedBalance = debitResult.data;

      if (debitResult.error) {
        auditLog(`${isUsingCharacters ? 'character' : 'brand_voice'}_transformation_debit_failed`, {
          userId: auth.userId,
          [isUsingCharacters ? 'characterId' : 'brandProfileId']: targetId,
          reason: 'Falha ao debitar Dracmas após transformação',
          error: debitResult.error.message,
          cost: actualCost,
          traceId: requestTraceId,
          isRefresh: isRefreshOperation,
        });
      }
    }
 
    // 14. Log de sucesso
    auditLog(`${isUsingCharacters ? 'character' : 'brand_voice'}_transformation_completed`, {
      userId: auth.userId,
      [isUsingCharacters ? 'characterId' : 'brandProfileId']: targetId,
      provider,
      model,
      tokensUsed: result.tokensUsed,
      similarityChunksUsed: similarChunks.length,
      processingTimeMs,
      dracmasDebited: actualCost,
      remainingBalance: updatedBalance?.balance || null,
      traceId: requestTraceId,
      isRefresh: isRefreshOperation,
      hintsApplied: refinementHints.length,
    });

    // 15. Retornar resposta
    const response: TransformResponse = {
      transformedText: result.text,
      metadata: {
        modelUsed: model,
        provider,
        tokensUsed: result.tokensUsed,
        similarityChunksUsed: similarChunks.length,
        processingTimeMs,
        isRefresh: isRefreshOperation,
        hintsApplied: refinementHints.length,
      },
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: getSecurityHeaders(origin),
      }
    );

  } catch (error: any) {
    console.error('Erro em brand_voice_transform:', error);
    
    // Log de erro (sem PII)
    auditLog('brand_voice_transformation_failed', {
      error: error.message || 'Erro desconhecido',
      errorType: error.name || 'UnknownError',
      traceId: requestTraceId,
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

