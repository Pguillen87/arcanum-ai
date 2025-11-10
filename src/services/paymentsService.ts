// Service para gerenciar pagamentos
// Integra com provedores de pagamento (Stripe/Mercado Pago) via webhooks
import { supabase } from '@/integrations/supabase/client';
import { Observability } from '@/lib/observability';

export type PaymentProvider = 'stripe' | 'mp';
export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'refunded' | 'failed';

export interface PaymentEvent {
  event_id: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount_cents: number;
  currency?: string;
  user_id?: string;
  metadata?: Record<string, any>;
}

export interface Payment {
  id: string;
  user_id: string;
  provider: PaymentProvider;
  provider_payment_id: string | null;
  event_id: string;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PurchaseCreditsIntentParams {
  userId: string;
  plan: {
    plan_code: string;
    amount_cents: number;
    credits: number;
  };
  provider?: PaymentProvider;
}

export interface PaymentsService {
  webhookHandler: (event: PaymentEvent) => Promise<{ ok: boolean; error?: any }>;
  reconcilePayment: (eventId: string, provider: PaymentProvider) => Promise<{ ok: boolean; error?: any }>;
  purchaseCreditsIntent: (params: PurchaseCreditsIntentParams) => Promise<{ data: { intentId: string; checkoutUrl?: string } | null; error?: any }>;
  listPayments: (limit?: number) => Promise<{ data: Payment[] | null; error?: any }>;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://giozhrukzcqoopssegby.supabase.co';

export const paymentsService: PaymentsService = {
  async webhookHandler(event) {
    try {
      // Chamar Edge Function para processar webhook
      const edgeUrl = `${SUPABASE_URL}/functions/v1/payments/webhooks`;

      const response = await fetch(edgeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return { ok: data.ok || false };
    } catch (error: any) {
      Observability.trackError(error);
      return { ok: false, error };
    }
  },

  async reconcilePayment(eventId, provider) {
    try {
      // Buscar pagamento pelo event_id
      const { data: payment, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('event_id', eventId)
        .eq('provider', provider)
        .single();

      if (fetchError || !payment) {
        return { ok: false, error: { message: 'Pagamento não encontrado' } };
      }

      // Se já foi processado, retornar sucesso
      if (payment.status === 'approved' || payment.status === 'refunded') {
        return { ok: true };
      }

      // Reprocessar webhook
      const event: PaymentEvent = {
        event_id: payment.event_id,
        provider: payment.provider,
        status: payment.status,
        amount_cents: payment.amount_cents,
        currency: payment.currency,
        user_id: payment.user_id,
        metadata: payment.metadata,
      };

      return await this.webhookHandler(event);
    } catch (error: any) {
      Observability.trackError(error);
      return { ok: false, error };
    }
  },

  async purchaseCreditsIntent(params) {
    try {
      const { userId, plan, provider = 'stripe' } = params;

      // Criar registro de pagamento pendente
      const eventId = `intent_${Date.now()}_${crypto.randomUUID()}`;

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: userId,
          provider,
          event_id: eventId,
          amount_cents: plan.amount_cents,
          currency: 'BRL',
          status: 'pending',
          metadata: {
            plan_code: plan.plan_code,
            credits: plan.credits,
          },
        })
        .select()
        .single();

      if (paymentError || !payment) {
        Observability.trackError(paymentError);
        return { data: null, error: paymentError };
      }

      // Em produção, aqui seria feita a integração com Stripe/Mercado Pago
      // Por enquanto, retornar intentId para uso futuro
      return {
        data: {
          intentId: payment.id,
          // checkoutUrl seria gerado pela integração com o provedor
        },
        error: null,
      };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async listPayments(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as Payment[], error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },
};

