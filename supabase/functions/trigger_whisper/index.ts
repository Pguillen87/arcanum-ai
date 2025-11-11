import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROJECT_URL = Deno.env.get("PROJECT_URL");
const WORKER_TOKEN = Deno.env.get("WORKER_TOKEN");

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
