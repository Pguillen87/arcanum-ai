import { supabase } from '@/integrations/supabase/client';
import { Observability } from '@/lib/observability';

export interface BrandVoice {
  tone?: string; // tom (ex: 'profissional', 'descontraído', 'místico')
  style?: string; // estilo (ex: 'formal', 'casual', 'poético')
  examples?: string[]; // exemplos de textos no estilo desejado
  preferences?: {
    length?: 'short' | 'medium' | 'long';
    formality?: 'formal' | 'neutral' | 'casual';
    creativity?: 'low' | 'medium' | 'high';
    [key: string]: any;
  };
}

export interface BrandProfile {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_default: boolean;
  model_provider: 'openai' | 'anthropic';
  model_name: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TrainBrandVoiceParams {
  brandProfileId?: string;
  name: string;
  description?: string;
  samples: string[];
  isDefault?: boolean;
  modelProvider?: 'openai' | 'anthropic';
  modelName?: string;
}

export interface TransformWithBrandVoiceParams {
  brandProfileId: string;
  inputText: string;
  transformationType: 'post' | 'resumo' | 'newsletter' | 'roteiro';
  tone?: string;
  length?: 'short' | 'medium' | 'long';
  useSimilaritySearch?: boolean;
  similarityThreshold?: number;
  maxSimilarChunks?: number;
}

export interface BrandVoiceService {
  // Métodos legados (compatibilidade com profiles.brand_voice)
  getBrandVoice(userId: string): Promise<{ data: BrandVoice | null; error: any }>;
  updateBrandVoice(userId: string, brandVoice: BrandVoice): Promise<{ data: BrandVoice | null; error: any }>;
  deleteBrandVoice(userId: string): Promise<{ error: any }>;
  
  // Novos métodos (brand_profiles)
  listProfiles(userId: string): Promise<{ data: BrandProfile[] | null; error: any }>;
  getDefaultProfile(userId: string): Promise<{ data: BrandProfile | null; error: any }>;
  getProfile(profileId: string): Promise<{ data: BrandProfile | null; error: any }>;
  trainBrandVoice(params: TrainBrandVoiceParams): Promise<{ data: BrandProfile | null; error: any }>;
  transformWithBrandVoice(params: TransformWithBrandVoiceParams): Promise<{ data: string | null; error: any }>;
  deleteProfile(profileId: string): Promise<{ error: any }>;
  setDefaultProfile(profileId: string): Promise<{ error: any }>;
}

export const brandVoiceService: BrandVoiceService = {
  async getBrandVoice(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('brand_voice')
        .eq('id', userId)
        .single();

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: (data?.brand_voice as BrandVoice) || null, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async updateBrandVoice(userId: string, brandVoice: BrandVoice) {
    try {
      // Validação básica do schema
      if (brandVoice.tone && typeof brandVoice.tone !== 'string') {
        return { data: null, error: { message: 'tone deve ser uma string' } };
      }
      if (brandVoice.style && typeof brandVoice.style !== 'string') {
        return { data: null, error: { message: 'style deve ser uma string' } };
      }
      if (brandVoice.examples && !Array.isArray(brandVoice.examples)) {
        return { data: null, error: { message: 'examples deve ser um array' } };
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ brand_voice: brandVoice as any })
        .eq('id', userId)
        .select('brand_voice')
        .single();

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: (data?.brand_voice as BrandVoice) || null, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async deleteBrandVoice(userId: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ brand_voice: null })
        .eq('id', userId);

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

  // Novos métodos (brand_profiles)
  async listProfiles(userId: string) {
    try {
      const { data, error } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Tratar erro 404 (tabela não existe) como estado válido
      if (error) {
        const isTableNotFound = 
          error.code === 'PGRST116' || 
          error.message?.includes('relation "brand_profiles" does not exist') ||
          error.message?.includes('relation "public.brand_profiles" does not exist');

        if (isTableNotFound) {
          // Tabela não existe - retornar vazio sem erro (migration não aplicada)
          if (import.meta.env.DEV) {
            console.warn('⚠️ Tabela brand_profiles não encontrada. Aplique a migration primeiro.');
          }
          return { data: [], error: null };
        }

        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: (data as BrandProfile[]) || [], error: null };
    } catch (error: any) {
      // Verificar se é erro de tabela não encontrada
      const isTableNotFound = 
        error?.status === 404 || 
        error?.message?.includes('relation "brand_profiles" does not exist') ||
        error?.message?.includes('relation "public.brand_profiles" does not exist');

      if (isTableNotFound) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ Tabela brand_profiles não encontrada. Aplique a migration primeiro.');
        }
        return { data: [], error: null };
      }

      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async getDefaultProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .maybeSingle();

      // Tratar erro 404 (tabela não existe) como estado válido
      if (error) {
        const isTableNotFound = 
          error.code === 'PGRST116' || 
          error.message?.includes('relation "brand_profiles" does not exist') ||
          error.message?.includes('relation "public.brand_profiles" does not exist');

        if (isTableNotFound) {
          // Tabela não existe - retornar null sem erro (migration não aplicada)
          if (import.meta.env.DEV) {
            console.warn('⚠️ Tabela brand_profiles não encontrada. Aplique a migration primeiro.');
          }
          return { data: null, error: null };
        }

        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: (data as BrandProfile) || null, error: null };
    } catch (error: any) {
      // Verificar se é erro de tabela não encontrada
      const isTableNotFound = 
        error?.status === 404 || 
        error?.message?.includes('relation "brand_profiles" does not exist') ||
        error?.message?.includes('relation "public.brand_profiles" does not exist');

      if (isTableNotFound) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ Tabela brand_profiles não encontrada. Aplique a migration primeiro.');
        }
        return { data: null, error: null };
      }

      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async getProfile(profileId: string) {
    try {
      const { data, error } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) {
        // Tratar erro 404 (tabela não existe) como estado válido
        const isTableNotFound = 
          error.code === 'PGRST116' || 
          error.message?.includes('relation "brand_profiles" does not exist') ||
          error.message?.includes('relation "public.brand_profiles" does not exist');

        if (isTableNotFound) {
          if (import.meta.env.DEV) {
            console.warn('⚠️ Tabela brand_profiles não encontrada. Aplique a migration primeiro.');
          }
          return { data: null, error: null };
        }

        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as BrandProfile, error: null };
    } catch (error: any) {
      // Verificar se é erro de tabela não encontrada
      const isTableNotFound = 
        error?.status === 404 || 
        error?.message?.includes('relation "brand_profiles" does not exist') ||
        error?.message?.includes('relation "public.brand_profiles" does not exist');

      if (isTableNotFound) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ Tabela brand_profiles não encontrada. Aplique a migration primeiro.');
        }
        return { data: null, error: null };
      }

      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async trainBrandVoice(params: TrainBrandVoiceParams) {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        return { data: null, error: { message: 'Não autenticado' } };
      }

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/brand_voice_train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session.access_token}`,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erro ao treinar voz' }));
        Observability.trackError(error);
        return { data: null, error };
      }

      const result = await response.json();
      return { data: result.brandProfile as BrandProfile, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async transformWithBrandVoice(params: TransformWithBrandVoiceParams) {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        return { data: null, error: { message: 'Não autenticado' } };
      }

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/brand_voice_transform`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session.access_token}`,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erro ao transformar texto' }));
        Observability.trackError(error);
        return { data: null, error };
      }

      const result = await response.json();
      return { data: result.transformedText as string, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async deleteProfile(profileId: string) {
    try {
      const { error } = await supabase
        .from('brand_profiles')
        .delete()
        .eq('id', profileId);

      if (error) {
        // Tratar erro 404 (tabela não existe) como estado válido
        const isTableNotFound = 
          error.code === 'PGRST116' || 
          error.message?.includes('relation "brand_profiles" does not exist') ||
          error.message?.includes('relation "public.brand_profiles" does not exist');

        if (isTableNotFound) {
          if (import.meta.env.DEV) {
            console.warn('⚠️ Tabela brand_profiles não encontrada. Aplique a migration primeiro.');
          }
          return { error: null };
        }

        Observability.trackError(error);
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      // Verificar se é erro de tabela não encontrada
      const isTableNotFound = 
        error?.status === 404 || 
        error?.message?.includes('relation "brand_profiles" does not exist') ||
        error?.message?.includes('relation "public.brand_profiles" does not exist');

      if (isTableNotFound) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ Tabela brand_profiles não encontrada. Aplique a migration primeiro.');
        }
        return { error: null };
      }

      Observability.trackError(error);
      return { error };
    }
  },

  async setDefaultProfile(profileId: string) {
    try {
      // Primeiro, obter user_id do perfil
      const { data: profile, error: fetchError } = await supabase
        .from('brand_profiles')
        .select('user_id')
        .eq('id', profileId)
        .single();

      if (fetchError) {
        // Tratar erro 404 (tabela não existe) como estado válido
        const isTableNotFound = 
          fetchError.code === 'PGRST116' || 
          fetchError.message?.includes('relation "brand_profiles" does not exist') ||
          fetchError.message?.includes('relation "public.brand_profiles" does not exist');

        if (isTableNotFound) {
          if (import.meta.env.DEV) {
            console.warn('⚠️ Tabela brand_profiles não encontrada. Aplique a migration primeiro.');
          }
          return { error: null };
        }

        return { error: { message: 'Perfil não encontrado' } };
      }

      if (!profile) {
        return { error: { message: 'Perfil não encontrado' } };
      }

      // Remover is_default de todos os perfis do usuário
      const { error: unsetError } = await supabase
        .from('brand_profiles')
        .update({ is_default: false })
        .eq('user_id', profile.user_id);

      if (unsetError) {
        // Tratar erro 404 (tabela não existe) como estado válido
        const isTableNotFound = 
          unsetError.code === 'PGRST116' || 
          unsetError.message?.includes('relation "brand_profiles" does not exist') ||
          unsetError.message?.includes('relation "public.brand_profiles" does not exist');

        if (isTableNotFound) {
          if (import.meta.env.DEV) {
            console.warn('⚠️ Tabela brand_profiles não encontrada. Aplique a migration primeiro.');
          }
          return { error: null };
        }

        Observability.trackError(unsetError);
        return { error: unsetError };
      }

      // Definir este perfil como padrão
      const { error: setError } = await supabase
        .from('brand_profiles')
        .update({ is_default: true })
        .eq('id', profileId);

      if (setError) {
        // Tratar erro 404 (tabela não existe) como estado válido
        const isTableNotFound = 
          setError.code === 'PGRST116' || 
          setError.message?.includes('relation "brand_profiles" does not exist') ||
          setError.message?.includes('relation "public.brand_profiles" does not exist');

        if (isTableNotFound) {
          if (import.meta.env.DEV) {
            console.warn('⚠️ Tabela brand_profiles não encontrada. Aplique a migration primeiro.');
          }
          return { error: null };
        }

        Observability.trackError(setError);
        return { error: setError };
      }

      return { error: null };
    } catch (error: any) {
      // Verificar se é erro de tabela não encontrada
      const isTableNotFound = 
        error?.status === 404 || 
        error?.message?.includes('relation "brand_profiles" does not exist') ||
        error?.message?.includes('relation "public.brand_profiles" does not exist');

      if (isTableNotFound) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ Tabela brand_profiles não encontrada. Aplique a migration primeiro.');
        }
        return { error: null };
      }

      Observability.trackError(error);
      return { error };
    }
  },
};

