// Deno Edge Function: whisper_processor
// Processa jobs de transcrição (Whisper via OpenAI) e persiste texto/status
// Requer PROJECT_URL, SERVICE_ROLE_KEY e OPENAI_API_KEY no ambiente de execução
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  // permitir o header x-edge-token para reprocessamento via front-end
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-edge-token",
};

const url = Deno.env.get("PROJECT_URL");
const serviceRole = Deno.env.get("SERVICE_ROLE_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const WORKER_TOKEN = Deno.env.get("WORKER_TOKEN");
const FFmpegPath = Deno.env.get("FFMPEG_PATH") ?? "/usr/bin/ffmpeg";

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

async function convertToWav(blob: Blob, sourceMime: string): Promise<Blob> {
  const supportedConversions: Array<{ match: string; extension: string }> = [
    { match: "webm", extension: "webm" },
    { match: "ogg", extension: "ogg" },
    { match: "mp4", extension: "mp4" },
    { match: "m4a", extension: "m4a" },
    { match: "m4b", extension: "m4b" },
    { match: "quicktime", extension: "mov" },
  ];

  const normalizedMime = sourceMime.toLowerCase();
  const match = supportedConversions.find((candidate) => normalizedMime.includes(candidate.match));
  if (!match) {
    return blob;
  }

  const tmpDir = await Deno.makeTempDir({ prefix: "whisper_" });
  const inputPath = `${tmpDir}/input.${match.extension}`;
  const outputPath = `${tmpDir}/output.wav`;
  const inputBuffer = await blob.arrayBuffer();
  await Deno.writeFile(inputPath, new Uint8Array(inputBuffer));

  const process = Deno.run({
    cmd: [FFmpegPath, "-i", inputPath, "-vn", "-ar", "16000", "-ac", "1", "-y", outputPath],
    stdout: "piped",
    stderr: "piped",
  });
  const status = await process.status();
  if (!status.success) {
    const errorOutput = new TextDecoder().decode(await process.stderrOutput());
    process.close();
    await Deno.remove(inputPath).catch(() => {});
    await Deno.remove(outputPath).catch(() => {});
    await Deno.remove(tmpDir, { recursive: true }).catch(() => {});
    throw new Error(`Falha ao converter audio para wav (${sourceMime}): ${errorOutput}`);
  }
  process.close();

  const wavBytes = await Deno.readFile(outputPath);
  await Deno.remove(inputPath).catch(() => {});
  await Deno.remove(outputPath).catch(() => {});
  await Deno.remove(tmpDir, { recursive: true }).catch(() => {});

  return new Blob([wavBytes], { type: "audio/wav" });
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestId = crypto.randomUUID();
    const startedAt = Date.now();
    const edgeToken = req.headers.get("x-edge-token");
    const authHeader = req.headers.get("authorization");

    console.log("[whisper_processor] request_received", {
      requestId,
      method: req.method,
      edgeTokenPresent: Boolean(edgeToken),
      authHeaderPresent: Boolean(authHeader),
      url: req.url,
    });

    // Autorização simples via token (se configurado)
    if (WORKER_TOKEN && edgeToken !== WORKER_TOKEN) {
      console.warn("[whisper_processor] invalid_token", {
        requestId,
        reason: edgeToken ? "mismatch" : "missing",
      });
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
    console.log("[whisper_processor] payload_parsed", {
      requestId,
      transcriptionId: tid ?? null,
      jobId: jobId ?? null,
    });

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
    console.log("[whisper_processor] transcription_loaded", {
      requestId,
      transcriptionId: transcription.id,
      jobId: jobId ?? null,
      status: transcription.status,
      assetId: transcription.asset_id,
    });

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
      console.error("[whisper_processor] asset_not_found", {
        requestId,
        transcriptionId: transcription.id,
        reason: assetError?.message ?? "not_found",
      });
      return new Response(JSON.stringify({ code: "BUS_404", message: "Asset não encontrado" }), {
        status: 404,
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }
    console.log("[whisper_processor] asset_loaded", {
      requestId,
      transcriptionId: transcription.id,
      assetId: asset.id,
      mimetype: asset.mimetype,
      type: asset.type,
      storagePath: asset.storage_path,
    });

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

    const filename = asset.storage_path.split("/").pop() || "audio";
    let blob = await downloadAsset("audio", asset.storage_path);
    console.log("[whisper_processor] asset baixado", {
      transcriptionId: transcription.id,
      assetId: asset.id,
      sizeBytes: blob.size,
      blobType: blob.type,
      mimetype: asset.mimetype,
    });

    const supportedMimeTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/x-wav",
      "audio/m4a",
      "audio/x-m4a",
      "audio/m4b",
      "audio/x-m4b",
      "audio/mp4",
      "audio/ogg",
      "audio/webm",
      "audio/flac",
      "video/mp4",
      "video/quicktime",
    ];

    const extension = filename.split(".").pop()?.toLowerCase() ?? "";
    const extensionMap: Record<string, string> = {
      mp3: "audio/mpeg",
      wav: "audio/wav",
      webm: "audio/webm",
      ogg: "audio/ogg",
      m4a: "audio/m4a",
      m4b: "audio/m4b",
      mp4: "audio/mp4",
      mov: "video/quicktime",
      flac: "audio/flac",
    };

    let effectiveMime = asset.mimetype ?? "";
    if ((!effectiveMime || effectiveMime === "application/octet-stream") && blob.type) {
      effectiveMime = blob.type;
    }
    if (!effectiveMime && extension && extensionMap[extension]) {
      effectiveMime = extensionMap[extension];
    }

    // normalize and strip parameters (e.g. "audio/webm;codecs=opus" -> "audio/webm")
    const normalizedMime = (effectiveMime || "").split(";")[0].trim().toLowerCase();

    if (!normalizedMime) {
      console.warn("[whisper_processor] mime_detection_failed", {
        requestId,
        transcriptionId: transcription.id,
        assetId: asset.id,
        extension,
        blobType: blob.type,
        rawMime: effectiveMime,
      });
    }

    if (!normalizedMime || !supportedMimeTypes.includes(normalizedMime)) {
      await admin
        .from("transcriptions")
        .update({ status: "failed", error: "Formato de áudio não suportado" })
        .eq("id", transcription.id);
      return new Response(JSON.stringify({ code: "BUS_415", message: "Formato de áudio não suportado" }), {
        status: 422,
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    if (!asset.mimetype || asset.mimetype !== normalizedMime) {
      console.log("[whisper_processor] updating_asset_mimetype", {
        requestId,
        assetId: asset.id,
        previous: asset.mimetype ?? null,
        detected: normalizedMime,
      });
      await admin
        .from("assets")
        .update({ mimetype: normalizedMime })
        .eq("id", asset.id);
    }

    if (normalizedMime.includes("webm") || normalizedMime.includes("ogg")) {
      // Some Edge runtimes don't support Deno.run (no ffmpeg). Detect and fallback.
      if (typeof (globalThis as unknown as Record<string, unknown>).Deno === "object" && typeof (globalThis as unknown as Record<string, unknown>).Deno!.run === "function") {
        try {
          blob = await convertToWav(blob, normalizedMime);
          console.log("[whisper_processor] asset convertido para wav", {
            transcriptionId: transcription.id,
            assetId: asset.id,
            sizeBytes: blob.size,
            blobType: blob.type,
          });
        } catch (conversionError) {
          const message = conversionError instanceof Error ? conversionError.message : String(conversionError);
          console.error("[whisper_processor] erro na conversão", {
            transcriptionId: transcription.id,
            assetId: asset.id,
            message,
          });
          await admin
            .from("transcriptions")
            .update({ status: "failed", error: message })
            .eq("id", transcription.id);
          return new Response(
            JSON.stringify({ code: "CONVERSION_ERROR", message }),
            { status: 422, headers: { "content-type": "application/json", ...corsHeaders } },
          );
        }
      } else {
        // Fallback: runtime cannot spawn ffmpeg. Try sending the original blob to OpenAI (they accept webm/ogg).
        console.warn("[whisper_processor] conversion_skipped_no_deno_run", {
          requestId,
          transcriptionId: transcription.id,
          assetId: asset.id,
          detectedMime: normalizedMime,
        });
      }
    }

    let text: string;
    try {
      const mimeForTranscription = blob.type ? blob.type : normalizedMime ?? undefined;
      text = await transcribeWithOpenAI(blob, filename, mimeForTranscription, transcription.language ?? "pt");
    } catch (openAiError) {
      const humanMessage = openAiError instanceof Error ? openAiError.message : String(openAiError);
      console.error("[whisper_processor] OpenAI falhou", {
        transcriptionId: transcription.id,
        assetId: asset.id,
        message: humanMessage,
      });

      await admin
        .from("transcriptions")
        .update({
          status: "failed",
          error: humanMessage,
        })
        .eq("id", transcription.id);

      return new Response(
        JSON.stringify({ code: "OPENAI_400", message: humanMessage }),
        {
          status: 422,
          headers: { "content-type": "application/json", ...corsHeaders },
        },
      );
    }

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

    console.log("[whisper_processor] transcription_completed", {
      requestId,
      transcriptionId: transcription.id,
      durationMs: Date.now() - startedAt,
      textLength: text.length,
    });

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

