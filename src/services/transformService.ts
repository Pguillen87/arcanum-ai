// Service para gerenciar transformações de texto
import { supabase } from '@/integrations/supabase/client';
import { Observability } from '@/lib/observability';

export type TransformationType = 'post' | 'resumo' | 'newsletter' | 'roteiro';
export type TransformationStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface Transformation {
  id: string;
  project_id: string;
  source_asset_id: string | null;
  user_id: string;
  type: TransformationType;
  params: Record<string, any>;
  outputs: Record<string, any> | null;
  status: TransformationStatus;
  error: string | null;
  cost_credits: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTextTransformParams {
  projectId: string;
  type: TransformationType;
  inputText?: string;
  sourceAssetId?: string;
  tone?: string;
  length?: 'short' | 'long';
  idempotencyKey?: string;
  brandVoice?: any;
}

export interface TransformService {
  createTextTransform: (params: CreateTextTransformParams) => Promise<{ data: { jobId: string } | null; error: any }>;
  getTextTransform: (jobId: string) => Promise<{ data: Transformation | null; error: any }>;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://giozhrukzcqoopssegby.supabase.co';

export const transformService: TransformService = {
  async createTextTransform(params) {
    try {
      const edgeUrl = `${SUPABASE_URL}/functions/v1/transform_text`;

      const response = await fetch(edgeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ code: 'UNKNOWN', message: 'Erro desconhecido' }));
        return { data: null, error: errorData };
      }

      const data = await response.json();
      return { data: { jobId: data.jobId }, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async getTextTransform(jobId: string) {
    try {
      const { data, error } = await supabase
        .from('transformations')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as Transformation, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },
};

