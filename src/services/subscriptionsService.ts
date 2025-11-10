// Service para gerenciar subscriptions
// Gerencia planos e assinaturas de usuários
import { supabase } from '@/integrations/supabase/client';
import { Observability } from '@/lib/observability';

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused';

export interface Subscription {
  id: string;
  user_id: string;
  plan_code: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  provider_subscription_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionParams {
  userId: string;
  planCode: string;
  providerSubscriptionId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateSubscriptionParams {
  subscriptionId: string;
  status?: SubscriptionStatus;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, any>;
}

export interface SubscriptionsService {
  createSubscription: (params: CreateSubscriptionParams) => Promise<{ data: Subscription | null; error?: any }>;
  getSubscription: (subscriptionId: string) => Promise<{ data: Subscription | null; error?: any }>;
  getActiveSubscription: (userId: string) => Promise<{ data: Subscription | null; error?: any }>;
  updateSubscription: (params: UpdateSubscriptionParams) => Promise<{ data: Subscription | null; error?: any }>;
  cancelSubscription: (subscriptionId: string, cancelAtPeriodEnd?: boolean) => Promise<{ data: Subscription | null; error?: any }>;
  listSubscriptions: (userId?: string) => Promise<{ data: Subscription[] | null; error?: any }>;
}

export const subscriptionsService: SubscriptionsService = {
  async createSubscription(params) {
    try {
      const { userId, planCode, providerSubscriptionId, metadata = {} } = params;

      // Calcular período (exemplo: 30 dias)
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + 30);

      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_code: planCode,
          status: 'trialing',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          provider_subscription_id: providerSubscriptionId || null,
          metadata,
        })
        .select()
        .single();

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as Subscription, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async getSubscription(subscriptionId) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as Subscription, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async getActiveSubscription(userId) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as Subscription | null, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async updateSubscription(params) {
    try {
      const { subscriptionId, status, currentPeriodEnd, cancelAtPeriodEnd, metadata } = params;

      const updates: Record<string, any> = {};
      if (status !== undefined) updates.status = status;
      if (currentPeriodEnd !== undefined) updates.current_period_end = currentPeriodEnd;
      if (cancelAtPeriodEnd !== undefined) updates.cancel_at_period_end = cancelAtPeriodEnd;
      if (metadata !== undefined) updates.metadata = metadata;

      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as Subscription, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
    try {
      const updates: Record<string, any> = {
        cancel_at_period_end: cancelAtPeriodEnd,
      };

      if (!cancelAtPeriodEnd) {
        updates.status = 'canceled';
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as Subscription, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async listSubscriptions(userId) {
    try {
      let query = supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as Subscription[], error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },
};

