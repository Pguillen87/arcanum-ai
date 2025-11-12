import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROJECT_URL = Deno.env.get("PROJECT_URL");
const WORKER_TOKEN = Deno.env.get("WORKER_TOKEN");

// Simple in-memory rate limiter (per user or IP). Not perfect for multi-instance scaling but protects basic abuse.
const RATE_LIMIT_MAX = 6; // requests
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const rateMap = new Map<string, { count: number; resetAt: number }>();

function allowedToProceed(key: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ code: 'AUTH_401', message: 'Missing Authorization header' }), { status: 401, headers: { 'content-type': 'application/json', ...corsHeaders } });
    }

    // Validate token by calling Supabase auth user endpoint
    const userResp = await fetch(`${PROJECT_URL}/auth/v1/user`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
    });

    if (!userResp.ok) {
      return new Response(JSON.stringify({ code: 'AUTH_401', message: 'Invalid session' }), { status: 401, headers: { 'content-type': 'application/json', ...corsHeaders } });
    }

    // Determine rate-limit key: prefer user id when available
    const userJsonRaw = await userResp.json().catch(() => ({}));
    const userJson = typeof userJsonRaw === 'object' && userJsonRaw !== null ? (userJsonRaw as Record<string, unknown>) : {};
    const userId = typeof userJson.id === 'string' ? userJson.id : undefined;
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const key = userId ? `user:${userId}` : `ip:${ip}`;

    if (!allowedToProceed(key)) {
      return new Response(JSON.stringify({ code: 'RATE_LIMIT', message: 'Too many requests' }), { status: 429, headers: { 'content-type': 'application/json', ...corsHeaders } });
    }

    // Forward the body to whisper_processor with internal worker token
    const bodyText = await req.text();
    const forwardResp = await fetch(`${PROJECT_URL}/functions/v1/whisper_processor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(WORKER_TOKEN ? { 'x-edge-token': WORKER_TOKEN } : {}),
      },
      body: bodyText,
    });

    const forwardText = await forwardResp.text();
    return new Response(forwardText, { status: forwardResp.status, headers: { 'content-type': forwardResp.headers.get('content-type') ?? 'application/json', ...corsHeaders } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[trigger_whisper] error', message);
    return new Response(JSON.stringify({ code: 'INT_500', message }), { status: 500, headers: { 'content-type': 'application/json', ...corsHeaders } });
  }
});
