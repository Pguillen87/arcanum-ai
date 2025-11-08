// Deno Edge Function: transform_text
// Transformação de texto usando OpenAI GPT
// Requer SUPABASE_URL, SUPABASE_SERVICE_ROLE e OPENAI_API_KEY no ambiente
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL")!;
const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE")!;
const openaiKey = Deno.env.get("OPENAI_API_KEY")!;
const admin = createClient(url, serviceRole);

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 2000;
const DEFAULT_TIMEOUT_MS = 60000;

type TransformationType = "post" | "resumo" | "newsletter" | "roteiro";
type TransformationStatus = "queued" | "processing" | "completed" | "failed";

interface TransformParams {
  projectId: string;
  type: TransformationType;
  inputText?: string;
  sourceAssetId?: string;
  tone?: string;
  length?: "short" | "long";
  idempotencyKey?: string;
  brandVoice?: any;
}

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

// Construir prompt baseado no tipo de transformação
function buildPrompt(params: TransformParams, inputText: string): string {
  const typePrompts: Record<TransformationType, string> = {
    post: "Transforme o seguinte texto em um post para redes sociais, mantendo a essência e tornando-o envolvente e conciso.",
    resumo: "Crie um resumo objetivo e claro do seguinte texto, destacando os pontos principais.",
    newsletter: "Transforme o seguinte conteúdo em uma newsletter profissional e informativa, com estrutura clara e tom adequado.",
    roteiro: "Crie um roteiro estruturado baseado no seguinte conteúdo, com cenas, diálogos e direções quando apropriado.",
  };

  const basePrompt = typePrompts[params.type] || typePrompts.post;
  const lengthInstruction = params.length === "short" ? " Mantenha o conteúdo conciso." : " Pode ser mais detalhado.";
  const toneInstruction = params.tone ? ` Use um tom ${params.tone}.` : "";

  return `${basePrompt}${lengthInstruction}${toneInstruction}\n\nTexto original:\n${inputText}`;
}

// Aplicar Voz da Marca ao prompt
function applyBrandVoice(prompt: string, brandVoice: any): string {
  if (!brandVoice || typeof brandVoice !== 'object') return prompt;

  const tone = brandVoice.tone || "";
  const style = brandVoice.style || "";
  const examples = brandVoice.examples || [];
  const preferences = brandVoice.preferences || {};

  let enhancedPrompt = prompt;
  let brandInstructions = [];

  if (tone) {
    brandInstructions.push(`Tom: ${tone}`);
  }

  if (style) {
    brandInstructions.push(`Estilo: ${style}`);
  }

  // Aplicar preferências
  if (preferences.length) {
    const lengthMap: Record<string, string> = {
      short: "conciso e direto",
      medium: "equilibrado",
      long: "detalhado e completo"
    };
    brandInstructions.push(`Tamanho preferido: ${lengthMap[preferences.length] || 'equilibrado'}`);
  }

  if (preferences.formality) {
    const formalityMap: Record<string, string> = {
      formal: "formal e profissional",
      neutral: "neutro",
      casual: "casual e descontraído"
    };
    brandInstructions.push(`Formalidade: ${formalityMap[preferences.formality] || 'neutro'}`);
  }

  if (preferences.creativity) {
    const creativityMap: Record<string, string> = {
      low: "mais direto e objetivo",
      medium: "equilibrado",
      high: "mais criativo e inovador"
    };
    brandInstructions.push(`Criatividade: ${creativityMap[preferences.creativity] || 'equilibrado'}`);
  }

  if (brandInstructions.length > 0) {
    enhancedPrompt = `Voz da Marca:\n${brandInstructions.join("\n")}\n\n${enhancedPrompt}`;
  }

  if (examples.length > 0) {
    enhancedPrompt = `Exemplos de textos no estilo desejado:\n${examples.slice(0, 3).join("\n\n")}\n\n${enhancedPrompt}`;
  }

  return enhancedPrompt;
}

// Chamar OpenAI API
async function callOpenAI(prompt: string): Promise<{ text: string; usage?: any }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: "Você é um assistente especializado em transformação de conteúdo criativo." },
          { role: "user", content: prompt },
        ],
        temperature: DEFAULT_TEMPERATURE,
        max_tokens: DEFAULT_MAX_TOKENS,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Erro desconhecido" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      text: data.choices[0]?.message?.content || "",
      usage: data.usage,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    throw error;
  }
}

serve(async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  let transformationId: string | null = null;
  let params: TransformParams | null = null;

  try {
    // CORS
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ code: "VAL_405", message: "Método não suportado" }),
        { status: 405, headers: { "content-type": "application/json" } }
      );
    }

    params = await req.json() as TransformParams;

    // Validações
    if (!params.projectId || !params.type) {
      return new Response(
        JSON.stringify({ code: "VAL_400", message: "projectId e type são obrigatórios" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    if (!params.inputText && !params.sourceAssetId) {
      return new Response(
        JSON.stringify({ code: "VAL_400", message: "inputText ou sourceAssetId é obrigatório" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // Obter texto de entrada
    let inputText = params.inputText || "";

    if (params.sourceAssetId && !inputText) {
      // Buscar asset e obter texto (se for texto) ou transcrição (se for áudio/vídeo)
      const { data: asset, error: assetError } = await admin
        .from("assets")
        .select("type, storage_path")
        .eq("id", params.sourceAssetId)
        .single();

      if (assetError || !asset) {
        return new Response(
          JSON.stringify({ code: "ASSET_404", message: "Asset não encontrado" }),
          { status: 404, headers: { "content-type": "application/json" } }
        );
      }

      // TODO: Se for áudio/vídeo, buscar transcrição
      // Por enquanto, assumimos que é texto ou já tem transcrição
      inputText = "Texto do asset"; // Placeholder
    }

    if (!inputText || inputText.trim().length === 0) {
      return new Response(
        JSON.stringify({ code: "VAL_400", message: "Texto de entrada não pode estar vazio" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // Obter user_id do projeto
    const { data: project, error: projectError } = await admin
      .from("projects")
      .select("user_id")
      .eq("id", params.projectId)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ code: "PROJECT_404", message: "Projeto não encontrado" }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }

    // Verificar idempotência
    if (params.idempotencyKey) {
      const { data: existing } = await admin
        .from("transformations")
        .select("id")
        .eq("idempotency_key", params.idempotencyKey)
        .eq("user_id", project.user_id)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ code: "IDEMPOTENT", message: "Transformação já existe", jobId: existing.id }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }
    }

    // Criar job (status: queued)
    const { data: transformation, error: createError } = await admin
      .from("transformations")
      .insert({
        project_id: params.projectId,
        source_asset_id: params.sourceAssetId || null,
        user_id: project.user_id,
        type: params.type,
        params: {
          tone: params.tone,
          length: params.length,
          brandVoice: params.brandVoice,
        },
        status: "queued",
        idempotency_key: params.idempotencyKey || null,
      })
      .select()
      .single();

    if (createError || !transformation) {
      auditLog("transform_text_create_failed", { transformationId: null, error: createError });
      return new Response(
        JSON.stringify({ code: "INT_500", message: "Erro ao criar job" }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    transformationId = transformation.id;

    // Atualizar status: queued → processing
    await admin
      .from("transformations")
      .update({ status: "processing" })
      .eq("id", transformationId);

    // Buscar brand_voice do perfil do usuário se não fornecido
    let brandVoice = params.brandVoice;
    if (!brandVoice) {
      const { data: profile } = await admin
        .from("profiles")
        .select("brand_voice")
        .eq("id", project.user_id)
        .single();
      
      if (profile?.brand_voice) {
        brandVoice = profile.brand_voice;
      }
    }

    // Construir prompt
    let prompt = buildPrompt(params, inputText);
    if (brandVoice) {
      prompt = applyBrandVoice(prompt, brandVoice);
    }

    // Chamar OpenAI
    const { text: output, usage } = await callOpenAI(prompt);

    // Calcular custo (exemplo: 1 crédito por transformação)
    const costCredits = 1;

    // Atualizar status: processing → completed
    const { error: updateError } = await admin
      .from("transformations")
      .update({
        status: "completed",
        outputs: {
          text: output,
          variants: [output], // Por enquanto, uma variante
        },
        cost_credits: costCredits,
      })
      .eq("id", transformationId);

    if (updateError) {
      auditLog("transform_text_update_failed", { transformationId, error: updateError });
    }

    // Criar notificação de job concluído
    await admin.from("notifications").insert({
      user_id: project.user_id,
      type: "job_completed",
      payload: {
        jobId: transformationId,
        jobType: "transformation",
        transformationType: params.type,
        message: `Transformação "${params.type}" concluída com sucesso`,
      },
    });

    // Débito de créditos (após entrega)
    const { error: debitError } = await admin
      .from("credit_transactions")
      .insert({
        user_id: project.user_id,
        delta: -costCredits,
        reason: `Transformação ${params.type}`,
        ref_type: "transformation",
        ref_id: transformationId,
      });

    if (debitError) {
      auditLog("transform_text_debit_failed", { transformationId, error: debitError });
      // Não falhar o job se débito falhar (será reconciliado depois)
    }

    const duration = Date.now() - startTime;
    auditLog("transform_text_success", {
      transformationId,
      type: params.type,
      duration,
      tokens: usage?.total_tokens,
    });

    return new Response(
      JSON.stringify({
        jobId: transformationId,
        status: "completed",
        output: {
          text: output,
          variants: [output],
        },
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err: any) {
    const duration = Date.now() - startTime;
    auditLog("transform_text_error", {
      transformationId,
      error: err.message,
      duration,
    });

    // Se temos transformationId, marcar como failed
    if (transformationId) {
      await admin
        .from("transformations")
        .update({
          status: "failed",
          error: err.message,
        })
        .eq("id", transformationId)
        .catch(() => {}); // Ignorar erro se não conseguir atualizar

      // Criar notificação de job falhou (se temos user_id)
      if (params?.projectId) {
        try {
          const { data: project } = await admin
            .from("projects")
            .select("user_id")
            .eq("id", params.projectId)
            .single();

          if (project?.user_id) {
            await admin.from("notifications").insert({
              user_id: project.user_id,
              type: "job_failed",
              payload: {
                jobId: transformationId,
                jobType: "transformation",
                error: err.message,
                message: `Transformação falhou: ${err.message}`,
              },
            });
          }
        } catch (notifError) {
          // Ignorar erro de notificação
        }
      }
    }

    return new Response(
      JSON.stringify({ code: "INT_500", message: "Erro interno", error: err.message }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    );
  }
});

