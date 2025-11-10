import { supabase } from '@/integrations/supabase/client';
import { Observability } from '@/lib/observability';

export type NotificationType = 
  | 'job_completed' 
  | 'job_failed' 
  | 'credits_debited' 
  | 'credits_credited' 
  | 'payment_completed' 
  | 'subscription_updated' 
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  payload: Record<string, any>;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationParams {
  user_id: string;
  type: NotificationType;
  payload?: Record<string, any>;
}

export interface NotificationsService {
  createNotification(params: CreateNotificationParams): Promise<{ data: Notification | null; error: any }>;
  listNotifications(userId: string, limit?: number, unreadOnly?: boolean): Promise<{ data: Notification[] | null; error: any }>;
  markAsRead(notificationId: string, userId: string): Promise<{ error: any }>;
  markAllAsRead(userId: string): Promise<{ error: any }>;
  getUnreadCount(userId: string): Promise<{ data: number; error: any }>;
}

export const notificationsService: NotificationsService = {
  async createNotification(params) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: params.user_id,
          type: params.type,
          payload: params.payload || {},
        })
        .select()
        .single();

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as Notification, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async listNotifications(userId: string, limit = 50, unreadOnly = false) {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (unreadOnly) {
        query = query.is('read_at', null);
      }

      const { data, error } = await query;

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as Notification[], error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async markAsRead(notificationId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        Observability.trackError(error);
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { error };
    }
  },

  async markAllAsRead(userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);

      if (error) {
        Observability.trackError(error);
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { error };
    }
  },

  async getUnreadCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null);

      if (error) {
        Observability.trackError(error);
        return { data: 0, error };
      }

      return { data: count || 0, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: 0, error };
    }
  },
};

