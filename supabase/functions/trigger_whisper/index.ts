import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-authorization, x-client-info, apikey, content-type",
};

const PROJECT_URL = Deno.env.get("PROJECT_URL");
const WORKER_TOKEN = Deno.env.get("WORKER_TOKEN");
const SERVICE_ROLE = Deno.env.get("SERVICE_ROLE_KEY");

const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX = 10;

const admin = SERVICE_ROLE && PROJECT_URL ? createClient(PROJECT_URL, SERVICE_ROLE) : null;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authorizationPresent = Boolean(req.headers.get("authorization"));
    const userAgent = req.headers.get("user-agent") ?? null;
    const remoteIp = req.headers.get("x-forwarded-for") ?? null;
    console.log("[trigger_whisper] request_received", { method: req.method, url: req.url, authorizationPresent, userAgent, remoteIp });
    const authHeader = req.headers.get("authorization") || req.headers.get("x-authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ code: 'AUTH_401', message: 'Missing Authorization header', hint: 'Faça login novamente e tente enviar com Authorization: Bearer' }), { status: 401, headers: { 'content-type': 'application/json', ...corsHeaders } });
    }
    if (!admin) {
      return new Response(JSON.stringify({ code: 'INT_500', message: 'Admin client not configured' }), { status: 500, headers: { 'content-type': 'application/json', ...corsHeaders } });
    }
    const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData?.user?.id) {
      console.warn("[trigger_whisper] session_validation_failed", { error: userErr?.message, hasUser: Boolean(userData?.user?.id) });
      return new Response(JSON.stringify({ code: 'AUTH_401', message: 'Invalid session', hint: 'Sessão expirada ou inválida. Refaça o login.' }), { status: 401, headers: { 'content-type': 'application/json', ...corsHeaders } });
    }
    const userId: string = userData.user.id;

    // Rate limiting (per-user) using worker_rate_limits table
    if (admin) {
      const now = new Date();
      const windowStart = new Date(Math.floor(now.getTime() / (RATE_LIMIT_WINDOW_SECONDS * 1000)) * RATE_LIMIT_WINDOW_SECONDS * 1000).toISOString();

      const { data: existing } = await admin
        .from('worker_rate_limits')
        .select('user_id, window_start, request_count')
        .eq('user_id', userId)
        .single();

      if (existing && typeof existing.window_start === 'string') {
        const existingWindow = new Date(existing.window_start).toISOString();
        if (existingWindow === windowStart) {
          // same window
          if ((existing.request_count ?? 0) >= RATE_LIMIT_MAX) {
            console.warn('[trigger_whisper] rate_limited', { userId, windowStart, requestCount: existing.request_count, max: RATE_LIMIT_MAX });
            return new Response(JSON.stringify({ code: 'RATE_LIMIT', message: 'Too many requests', hint: `Tente novamente em até ${RATE_LIMIT_WINDOW_SECONDS}s` }), { status: 429, headers: { 'content-type': 'application/json', ...corsHeaders } });
          }
          // increment
          await admin.from('worker_rate_limits').upsert({ user_id: userId, window_start: windowStart, request_count: (existing.request_count ?? 0) + 1, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
        } else {
          // new window: reset
          await admin.from('worker_rate_limits').upsert({ user_id: userId, window_start: windowStart, request_count: 1, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
        }
      } else {
        // no existing row
        await admin.from('worker_rate_limits').insert([{ user_id: userId, window_start: windowStart, request_count: 1 }]);
      }
    }

    // Forward the body to whisper_processor with internal worker token
    const bodyText = await req.text();
    try {
      const parsed = JSON.parse(bodyText || '{}');
      console.log('[trigger_whisper] forward_payload', { userId, transcriptionId: parsed?.transcriptionId ?? null });
    } catch {
      console.log('[trigger_whisper] forward_payload_unparsed');
    }
    const forwardHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(WORKER_TOKEN ? { 'x-edge-token': WORKER_TOKEN } : {}),
    };
    console.log('[trigger_whisper] forwarding', { workerTokenConfigured: Boolean(WORKER_TOKEN), includeEdgeToken: Boolean(WORKER_TOKEN) });
    const forwardResp = await fetch(`${PROJECT_URL}/functions/v1/whisper_processor`, {
      method: 'POST',
      headers: forwardHeaders,
      body: bodyText,
    });

    const forwardText = await forwardResp.text();
    console.log('[trigger_whisper] forwarded', { status: forwardResp.status });
    return new Response(forwardText, { status: forwardResp.status, headers: { 'content-type': forwardResp.headers.get('content-type') ?? 'application/json', ...corsHeaders } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[trigger_whisper] error', message);
    return new Response(JSON.stringify({ code: 'INT_500', message }), { status: 500, headers: { 'content-type': 'application/json', ...corsHeaders } });
  }
});
