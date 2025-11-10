import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface CleanupResult {
  timestamp: string;
  orphan_files_deleted: number;
  errors: string[];
}

serve(async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  const errors: string[] = [];
  let orphanFilesDeleted = 0;

  try {
    // CORS
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Apenas POST
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ code: "METHOD_NOT_ALLOWED", message: "Método não permitido" }),
        { status: 405, headers: { "content-type": "application/json" } }
      );
    }

    // Autenticação: verificar Authorization header (service role ou token válido)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ code: "UNAUTHORIZED", message: "Token de autenticação necessário" }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    if (token !== SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ code: "FORBIDDEN", message: "Token inválido" }),
        { status: 403, headers: { "content-type": "application/json" } }
      );
    }

    // Buscar todos os assets válidos (com referência em projetos)
    const { data: validAssets, error: assetsError } = await admin
      .from("assets")
      .select("storage_path, type");

    if (assetsError) {
      throw new Error(`Erro ao buscar assets: ${assetsError.message}`);
    }

    const validPaths = new Set(validAssets?.map((a) => a.storage_path) || []);

    // Listar arquivos em cada bucket e verificar se são órfãos
    const buckets = ["text", "audio", "video"];

    for (const bucket of buckets) {
      try {
        const { data: files, error: listError } = await admin.storage
          .from(bucket)
          .list("", { limit: 1000, sortBy: { column: "created_at", order: "desc" } });

        if (listError) {
          errors.push(`Erro ao listar arquivos em ${bucket}: ${listError.message}`);
          continue;
        }

        // Verificar cada arquivo
        for (const file of files || []) {
          const filePath = file.name;

          // Ignorar pastas
          if (filePath.endsWith("/")) {
            continue;
          }

          // Verificar se arquivo tem referência válida
          if (!validPaths.has(filePath)) {
            try {
              // Tentar deletar arquivo órfão
              const { error: deleteError } = await admin.storage
                .from(bucket)
                .remove([filePath]);

              if (deleteError) {
                errors.push(`Erro ao deletar ${filePath} em ${bucket}: ${deleteError.message}`);
              } else {
                orphanFilesDeleted++;
              }
            } catch (err: any) {
              errors.push(`Erro ao processar ${filePath}: ${err.message}`);
            }
          }
        }
      } catch (err: any) {
        errors.push(`Erro ao processar bucket ${bucket}: ${err.message}`);
      }
    }

    const duration = Date.now() - startTime;
    const result: CleanupResult = {
      timestamp: new Date().toISOString(),
      orphan_files_deleted: orphanFilesDeleted,
      errors: errors.length > 0 ? errors : [],
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    const duration = Date.now() - startTime;
    return new Response(
      JSON.stringify({
        code: "INT_500",
        message: "Erro interno",
        error: err.message,
        duration,
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

