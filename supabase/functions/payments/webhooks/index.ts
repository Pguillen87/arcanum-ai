// Deno Edge Function: payments/webhooks
// Webhook handler para pagamentos (Stripe/Mercado Pago)
// Requer SUPABASE_URL e SUPABASE_SERVICE_ROLE no ambiente
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL")!;
const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE")!;
const admin = createClient(url, serviceRole);

type PaymentProvider = "stripe" | "mp"; // mp = Mercado Pago
type PaymentStatus = "pending" | "approved" | "rejected" | "refunded";

interface PaymentEvent {
  event_id: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount_cents: number;
  currency: string;
  user_id?: string;
  metadata?: Record<string, any>;
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

// Verificar idempotência do webhook
async function isEventProcessed(eventId: string, provider: PaymentProvider): Promise<boolean> {
  const { data } = await admin
    .from("credit_transactions")
    .select("id")
    .eq("ref_type", "purchase")
    .eq("ref_id", `${provider}:${eventId}`)
    .maybeSingle();

  return !!data;
}

// Processar pagamento aprovado
async function processApprovedPayment(event: PaymentEvent) {
  if (!event.user_id) {
    throw new Error("user_id é obrigatório para processar pagamento");
  }

  // Converter centavos para créditos (exemplo: 100 centavos = 1 crédito)
  const credits = Math.floor(event.amount_cents / 100);

  // Verificar idempotência
  const eventKey = `${event.provider}:${event.event_id}`;
  const processed = await isEventProcessed(event.event_id, event.provider);
  if (processed) {
    auditLog("payment_already_processed", { eventId: event.event_id, provider: event.provider });
    return { ok: true, message: "Evento já processado" };
  }

  // Creditar créditos
  const { error: creditError } = await admin
    .from("credit_transactions")
    .insert({
      user_id: event.user_id,
      delta: credits,
      reason: `Pagamento aprovado via ${event.provider}`,
      ref_type: "purchase",
      ref_id: eventKey,
    });

  if (creditError) {
    auditLog("payment_credit_failed", { eventId: event.event_id, error: creditError });
    throw creditError;
  }

  auditLog("payment_approved", {
    eventId: event.event_id,
    provider: event.provider,
    amountCents: event.amount_cents,
    credits,
    userId: event.user_id,
  });

  return { ok: true, credits };
}

// Processar reembolso
async function processRefund(event: PaymentEvent) {
  if (!event.user_id) {
    throw new Error("user_id é obrigatório para processar reembolso");
  }

  const credits = Math.floor(event.amount_cents / 100);
  const eventKey = `${event.provider}:${event.event_id}`;

  // Verificar idempotência
  const processed = await isEventProcessed(event.event_id, event.provider);
  if (processed) {
    auditLog("refund_already_processed", { eventId: event.event_id });
    return { ok: true, message: "Reembolso já processado" };
  }

  // Debitar créditos (ou creditar negativo)
  const { error: refundError } = await admin
    .from("credit_transactions")
    .insert({
      user_id: event.user_id,
      delta: -credits,
      reason: `Reembolso via ${event.provider}`,
      ref_type: "refund",
      ref_id: eventKey,
    });

  if (refundError) {
    auditLog("payment_refund_failed", { eventId: event.event_id, error: refundError });
    throw refundError;
  }

  auditLog("payment_refunded", {
    eventId: event.event_id,
    provider: event.provider,
    amountCents: event.amount_cents,
    credits,
    userId: event.user_id,
  });

  return { ok: true };
}

serve(async (req: Request): Promise<Response> => {
  const startTime = Date.now();

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

    // Parse do evento (formato genérico)
    const event: PaymentEvent = await req.json();

    // Validações básicas
    if (!event.event_id || !event.provider || !event.status) {
      return new Response(
        JSON.stringify({ code: "VAL_400", message: "event_id, provider e status são obrigatórios" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    auditLog("payment_webhook_received", {
      eventId: event.event_id,
      provider: event.provider,
      status: event.status,
    });

    // Processar baseado no status
    let result;
    switch (event.status) {
      case "approved":
        result = await processApprovedPayment(event);
        break;
      case "refunded":
        result = await processRefund(event);
        break;
      case "pending":
        auditLog("payment_pending", { eventId: event.event_id });
        result = { ok: true, message: "Pagamento pendente, aguardando confirmação" };
        break;
      case "rejected":
        auditLog("payment_rejected", { eventId: event.event_id });
        result = { ok: true, message: "Pagamento rejeitado, nenhuma ação necessária" };
        break;
      default:
        return new Response(
          JSON.stringify({ code: "VAL_400", message: `Status não suportado: ${event.status}` }),
          { status: 400, headers: { "content-type": "application/json" } }
        );
    }

    const duration = Date.now() - startTime;
    auditLog("payment_webhook_processed", {
      eventId: event.event_id,
      duration,
      result,
    });

    return new Response(
      JSON.stringify({ ok: true, ...result }),
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
    auditLog("payment_webhook_error", {
      error: err.message,
      duration,
    });

    return new Response(
      JSON.stringify({ code: "INT_500", message: "Erro interno", error: err.message }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    );
  }
});

