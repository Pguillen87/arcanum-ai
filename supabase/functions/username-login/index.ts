// Deno Edge Function: username-login
// Autenticação por nome de usuário sem expor email ao cliente.
// Requer SUPABASE_URL e SUPABASE_SERVICE_ROLE no ambiente.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Evitar prefixo SUPABASE_ nas secrets (CLI impede). Use PROJECT_URL e SERVICE_ROLE_KEY.
const url = Deno.env.get("PROJECT_URL")!;
const serviceRole = Deno.env.get("SERVICE_ROLE_KEY")!;
const admin = createClient(url, serviceRole);

// Rate limit: janela deslizante simples em memória (KV seria ideal para produção)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const RATE_LIMIT_MAX_ATTEMPTS = 5; // 5 tentativas por janela

// Scrub PII para logs
function scrubPII(input: any): any {
  const str = typeof input === 'string' ? input : JSON.stringify(input);
  if (!str) return input;
  let out = str;
  // Emails
  out = out.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '***@***');
  // Tokens
  out = out.replace(/Bearer\s+[A-Za-z0-9\-_.]+/gi, 'Bearer ***');
  // UUIDs
  out = out.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, '***-uuid-***');
  try {
    return JSON.parse(out);
  } catch {
    return out;
  }
}

// Rate limit check
function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  
  if (!entry || entry.resetAt < now) {
    // Nova janela
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }
  
  if (entry.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS - entry.count, resetAt: entry.resetAt };
}

// Auditoria sem PII
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
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  
  try {
    // CORS headers
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
      auditLog("username_login_method_not_allowed", { method: req.method, ip });
      return new Response(
        JSON.stringify({ code: "VAL_405", message: "Método não suportado" }),
        { status: 405, headers: { "content-type": "application/json" } }
      );
    }

    const { username, password } = await req.json();
    const u = (username ?? "").trim().toLowerCase();
    
    if (!u || !password) {
      auditLog("username_login_validation_error", { ip, hasUsername: !!u });
      return new Response(
        JSON.stringify({ code: "VAL_400", message: "Credenciais obrigatórias" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // Rate limit por IP e username
    const ipLimit = checkRateLimit(`ip:${ip}`);
    const usernameLimit = checkRateLimit(`user:${u}`);
    
    if (!ipLimit.allowed || !usernameLimit.allowed) {
      auditLog("username_login_rate_limit_exceeded", { ip, username: u.substring(0, 3) + "***" });
      return new Response(
        JSON.stringify({
          code: "RATE_429",
          message: "Muitas tentativas. Tente novamente mais tarde.",
          resetAt: Math.max(ipLimit.resetAt, usernameLimit.resetAt),
        }),
        {
          status: 429,
          headers: {
            "content-type": "application/json",
            "Retry-After": String(Math.ceil((Math.max(ipLimit.resetAt, usernameLimit.resetAt) - Date.now()) / 1000)),
          },
        }
      );
    }

    const { data: profile, error } = await admin
      .from("profiles")
      .select("id, username")
      .eq("username", u)
      .maybeSingle();

    if (error || !profile) {
      auditLog("username_login_user_not_found", { ip, username: u.substring(0, 3) + "***" });
      return new Response(
        JSON.stringify({ code: "AUTH_404", message: "Usuário não encontrado" }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }

    // Obter email via admin API (não expor ao cliente)
    const { data: userRecord, error: userErr } = await admin.auth.admin.getUserById(profile.id);
    if (userErr || !userRecord?.user?.email) {
      auditLog("username_login_email_not_found", { ip, userId: profile.id.substring(0, 8) + "***" });
      return new Response(
        JSON.stringify({ code: "AUTH_404", message: "Email não encontrado" }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }

    const { data: signIn, error: signErr } = await admin.auth.signInWithPassword({
      email: userRecord.user.email,
      password,
    });

    if (signErr || !signIn?.session) {
      auditLog("username_login_invalid_credentials", { ip, username: u.substring(0, 3) + "***" });
      return new Response(
        JSON.stringify({ code: "AUTH_401", message: "Credenciais inválidas" }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
    }

    // Sucesso: auditoria sem PII
    const duration = Date.now() - startTime;
    auditLog("username_login_success", {
      ip,
      username: u.substring(0, 3) + "***",
      userId: profile.id.substring(0, 8) + "***",
      duration,
    });

    // Nunca logar senha/token; retornar apenas o necessário
    return new Response(
      JSON.stringify({ session: signIn.session }),
      {
      status: 200,
        headers: {
          "content-type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    const duration = Date.now() - startTime;
    auditLog("username_login_error", {
      ip,
      error: err instanceof Error ? err.message : "unknown",
      duration,
    });
    return new Response(
      JSON.stringify({ code: "INT_500", message: "Erro interno" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    );
  }
});
