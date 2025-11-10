// Deno Edge Function: transcribe_audio
// Stub inicial com CORS e criação de job "queued" em transcriptions.
// Requer SUPABASE_URL e SUPABASE_SERVICE_ROLE no ambiente.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Evitar prefixo SUPABASE_ nas secrets (CLI impede). Use PROJECT_URL e SERVICE_ROLE_KEY.
const url = Deno.env.get("PROJECT_URL")!;
const serviceRole = Deno.env.get("SERVICE_ROLE_KEY")!;
const WORKER_TOKEN = Deno.env.get("WORKER_TOKEN") || "";
const admin = createClient(url, serviceRole);

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ code: "VAL_405", message: "Método não suportado" }), {
        status: 405,
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    const body = await req.json();
    const assetId = body?.assetId;
    const language = typeof body?.language === "string" ? body.language : "pt";

    if (!assetId) {
      return new Response(JSON.stringify({ code: "VAL_400", message: "assetId é obrigatório" }), {
        status: 400,
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    const jobId = crypto.randomUUID();

    // Identificar usuário invocador (se houver) via Authorization: Bearer <JWT>
    const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      const jwt = authHeader.substring(7);
      const { data: user } = await admin.auth.getUser(jwt);
      userId = user?.user?.id ?? null;
    }

    if (!userId) {
      return new Response(JSON.stringify({ code: "AUTH_401", message: "Usuário não autenticado" }), {
        status: 401,
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    // Validar ownership do asset
    const { data: asset, error: assetError } = await admin
      .from("assets")
      .select("id, user_id")
      .eq("id", assetId)
      .single();

    if (assetError || !asset || asset.user_id !== userId) {
      return new Response(JSON.stringify({ code: "VAL_404", message: "Asset inválido para o usuário informado" }), {
        status: 404,
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    // Inserir job "queued" em transcriptions
    const { data: insertion, error } = await admin
      .from("transcriptions")
      .insert({
        asset_id: assetId,
        user_id: userId,
        language,
        status: "queued",
        job_id: jobId,
      })
      .select("id, status, language")
      .single();

    if (error || !insertion) {
      return new Response(JSON.stringify({ code: "BUS_500", message: "Falha ao criar job", details: error?.message }), {
        status: 500,
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    // Disparar processamento assíncrono via whisper_processor (best-effort)
    const workerUrl = `${url}/functions/v1/whisper_processor`;
    try {
      await fetch(workerUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(WORKER_TOKEN ? { "x-edge-token": WORKER_TOKEN } : {}),
        },
        body: JSON.stringify({ transcriptionId: insertion.id }),
      });
    } catch (workerErr) {
      // Não bloquear a resposta ao cliente; apenas registrar
      console.warn("Falha ao acionar whisper_processor:", workerErr instanceof Error ? workerErr.message : workerErr);
    }

    // Retornar jobId + transcriptionId para o cliente (contrato assíncrono)
    return new Response(
      JSON.stringify({
        jobId,
        transcriptionId: insertion.id,
        status: insertion.status ?? "queued",
        language: insertion.language ?? language,
      }),
      {
        status: 200,
        headers: { "content-type": "application/json", ...corsHeaders },
      },
    );
  } catch (err) {
    return new Response(JSON.stringify({ code: "INT_500", message: "Erro interno" }), {
      status: 500,
      headers: { "content-type": "application/json", ...corsHeaders },
    });
  }
});
