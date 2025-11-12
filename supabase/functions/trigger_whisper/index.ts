import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const userJson = await userResp.json();
    const userId: string | undefined = userJson?.id;
    if (!userId) {
      return new Response(JSON.stringify({ code: 'AUTH_401', message: 'Invalid session' }), { status: 401, headers: { 'content-type': 'application/json', ...corsHeaders } });
    }

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
            return new Response(JSON.stringify({ code: 'RATE_LIMIT', message: 'Too many requests' }), { status: 429, headers: { 'content-type': 'application/json', ...corsHeaders } });
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
