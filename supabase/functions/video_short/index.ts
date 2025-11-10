// Deno Edge Function: video_short
// Geração de vídeos curtos (mock inicial)
// Requer SUPABASE_URL e SUPABASE_SERVICE_ROLE no ambiente
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL")!;
const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE")!;
const admin = createClient(url, serviceRole);

type TransformationStatus = "queued" | "processing" | "completed" | "failed";

interface VideoShortParams {
  projectId: string;
  sourceAssetId: string;
  cuts?: boolean;
  subtitles?: boolean;
  style?: string;
  idempotencyKey?: string;
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

serve(async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  let transformationId: string | null = null;
  let params: VideoShortParams | null = null;

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

    params = await req.json() as VideoShortParams;

    // Validações
    if (!params.projectId || !params.sourceAssetId) {
      return new Response(
        JSON.stringify({ code: "VAL_400", message: "projectId e sourceAssetId são obrigatórios" }),
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

    // Verificar se asset existe e é vídeo
    const { data: asset, error: assetError } = await admin
      .from("assets")
      .select("id, type, status")
      .eq("id", params.sourceAssetId)
      .single();

    if (assetError || !asset) {
      return new Response(
        JSON.stringify({ code: "ASSET_404", message: "Asset não encontrado" }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }

    if (asset.type !== "video") {
      return new Response(
        JSON.stringify({ code: "VAL_400", message: "Asset deve ser do tipo video" }),
        { status: 400, headers: { "content-type": "application/json" } }
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
        source_asset_id: params.sourceAssetId,
        user_id: project.user_id,
        type: "video_short",
        params: {
          cuts: params.cuts || false,
          subtitles: params.subtitles || false,
          style: params.style || "default",
        },
        status: "queued",
        idempotency_key: params.idempotencyKey || null,
      })
      .select()
      .single();

    if (createError || !transformation) {
      auditLog("video_short_create_failed", { projectId: params.projectId, error: createError });
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

    // MOCK: Simular processamento de vídeo
    // Em produção, isso seria integrado com serviço de processamento de vídeo
    auditLog("video_short_processing_start", { transformationId });
    
    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 2000));

    // MOCK: Gerar outputs simulados
    const mockOutputs = {
      video_url: `https://storage.example.com/videos/${transformationId}/short.mp4`,
      preview_url: `https://storage.example.com/videos/${transformationId}/preview.jpg`,
      duration: 30, // segundos
      cuts: params.cuts ? [
        { start: 0, end: 10, description: "Introdução" },
        { start: 10, end: 20, description: "Desenvolvimento" },
        { start: 20, end: 30, description: "Conclusão" },
      ] : null,
      subtitles: params.subtitles ? {
        srt_url: `https://storage.example.com/videos/${transformationId}/subtitles.srt`,
        vtt_url: `https://storage.example.com/videos/${transformationId}/subtitles.vtt`,
      } : null,
    };

    // Calcular custo (exemplo: 2 créditos por vídeo curto)
    const costCredits = 2;

    // Atualizar status: processing → completed
    const { error: updateError } = await admin
      .from("transformations")
      .update({
        status: "completed",
        outputs: mockOutputs,
        cost_credits: costCredits,
      })
      .eq("id", transformationId);

    if (updateError) {
      auditLog("video_short_update_failed", { transformationId, error: updateError });
    }

    // Débito de créditos (após entrega)
    const { error: debitError } = await admin
      .from("credit_transactions")
      .insert({
        user_id: project.user_id,
        delta: -costCredits,
        reason: "Vídeo curto",
        ref_type: "video_short",
        ref_id: transformationId,
      });

    if (debitError) {
      auditLog("video_short_debit_failed", { transformationId, error: debitError });
      // Não falhar o job se débito falhar (será reconciliado depois)
    }

    const duration = Date.now() - startTime;
    auditLog("video_short_success", {
      transformationId,
      duration,
      cuts: params.cuts,
      subtitles: params.subtitles,
    });

    return new Response(
      JSON.stringify({
        jobId: transformationId,
        status: "completed",
        outputs: mockOutputs,
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
    auditLog("video_short_error", {
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

