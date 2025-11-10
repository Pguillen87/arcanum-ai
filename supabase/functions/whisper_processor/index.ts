// Deno Edge Function: whisper_processor
// Processa jobs de transcrição (Whisper via OpenAI) e persiste texto/status
// Requer PROJECT_URL, SERVICE_ROLE_KEY e OPENAI_API_KEY no ambiente de execução
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const url = Deno.env.get("PROJECT_URL");
const serviceRole = Deno.env.get("SERVICE_ROLE_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const WORKER_TOKEN = Deno.env.get("WORKER_TOKEN");
if (!url || !serviceRole) {
  console.error("Missing PROJECT_URL or SERVICE_ROLE_KEY env vars");
}
const admin = createClient(url!, serviceRole!);

type ProcessBody = {
  transcriptionId?: string;
  jobId?: string;
};

async function downloadAsset(bucket: string, path: string) {
  const { data, error } = await admin.storage.from(bucket).download(path);
  if (error) throw new Error(`Falha ao baixar asset: ${error.message}`);
  return data as Blob; // supabase-js v2 retorna Blob em Deno
}

async function transcribeWithOpenAI(blob: Blob, filename: string, mimeType?: string, language?: string): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY não configurada");
  const file = new File([blob], filename || "audio", { type: mimeType || "audio/mpeg" });
  const form = new FormData();
  form.append("file", file);
  form.append("model", "whisper-1");
  if (language) form.append("language", language);

  const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenAI Whisper falhou: ${resp.status} ${err}`);
  }
  const json = await resp.json();
  const text: string = json?.text ?? "";
  if (!text || typeof text !== "string") throw new Error("OpenAI não retornou texto válido");
  return text;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Autorização simples via token (se configurado)
    const edgeToken = req.headers.get("x-edge-token");
    if (WORKER_TOKEN && edgeToken !== WORKER_TOKEN) {
      return new Response(JSON.stringify({ code: "AUTH_401", message: "Token de execução inválido" }), {
        status: 401,
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ code: "VAL_405", message: "Método não suportado" }), {
        status: 405,
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    const body = (await req.json()) as ProcessBody;
    const { transcriptionId: tid, jobId } = body || {};

    if (!tid && !jobId) {
      return new Response(JSON.stringify({ code: "VAL_400", message: "Informe transcriptionId ou jobId" }), {
        status: 400,
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    // Localizar transcrição
    const { data: transcription, error: findError } = await admin
      .from("transcriptions")
      .select("id, asset_id, user_id, language, status")
      .eq(tid ? "id" : "job_id", tid ?? jobId)
      .single();

    if (findError || !transcription) {
      return new Response(JSON.stringify({ code: "VAL_404", message: "Transcrição não encontrada" }), {
        status: 404,
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    if (transcription.status === "completed") {
      return new Response(JSON.stringify({ status: "completed", transcriptionId: transcription.id }), {
        status: 200,
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    // Marcar processing
    await admin
      .from("transcriptions")
      .update({ status: "processing" })
      .eq("id", transcription.id);

    // Buscar asset
    const { data: asset, error: assetError } = await admin
      .from("assets")
      .select("id, project_id, storage_path, type, mimetype")
      .eq("id", transcription.asset_id)
      .single();

    if (assetError || !asset) {
      await admin
        .from("transcriptions")
        .update({ status: "failed", error: assetError?.message ?? "Asset não encontrado" })
        .eq("id", transcription.id);
      return new Response(JSON.stringify({ code: "BUS_404", message: "Asset não encontrado" }), {
        status: 404,
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    if (asset.type !== "audio") {
      // MVP: processar apenas áudio
      await admin
        .from("transcriptions")
        .update({ status: "failed", error: "Tipo de asset não suportado no MVP" })
        .eq("id", transcription.id);
      return new Response(JSON.stringify({ code: "BUS_422", message: "Tipo de asset não suportado" }), {
        status: 422,
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    // Validação de mimetype suportado para evitar erros 500 da OpenAI
    const supportedMimeTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/x-wav",
      "audio/m4a",
      "audio/mp4",
      "audio/ogg",
      "audio/webm",
      "audio/flac",
    ];
    if (asset.mimetype && !supportedMimeTypes.includes(asset.mimetype)) {
      await admin
        .from("transcriptions")
        .update({ status: "failed", error: "Formato de áudio não suportado" })
        .eq("id", transcription.id);
      return new Response(JSON.stringify({ code: "BUS_415", message: "Formato de áudio não suportado" }), {
        status: 422,
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    const filename = asset.storage_path.split("/").pop() || "audio";
    const blob = await downloadAsset("audio", asset.storage_path);
    const text = await transcribeWithOpenAI(blob, filename, asset.mimetype ?? undefined, transcription.language ?? "pt");

    // Persistir resultado
    const { error: upError } = await admin
      .from("transcriptions")
      .update({ status: "completed", text, error: null })
      .eq("id", transcription.id);

    if (upError) {
      throw new Error(`Falha ao atualizar transcrição: ${upError.message}`);
    }

    // Criar histórico básico
    const { error: histError } = await admin.from("transcription_history").insert({
      user_id: transcription.user_id,
      source_type: asset.type,
      source_asset_id: asset.id,
      transcription_id: transcription.id,
      project_id: asset.project_id,
      original_text: text,
      status: "completed",
    });

    if (histError) {
      // não falhar a resposta, mas registrar
      console.warn("Falha ao inserir transcription_history:", histError.message);
    }

    return new Response(
      JSON.stringify({ transcriptionId: transcription.id, status: "completed", text }),
      { status: 200, headers: { "content-type": "application/json", ...corsHeaders } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    console.error("whisper_processor erro:", message);
    return new Response(JSON.stringify({ code: "INT_500", message }), {
      status: 500,
      headers: { "content-type": "application/json", ...corsHeaders },
    });
  }
});

