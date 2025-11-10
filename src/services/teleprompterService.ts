// src/services/teleprompterService.ts
// Service para gerenciar sessões de teleprompter

import { supabase } from '@/integrations/supabase/client';
import { Observability } from '@/lib/observability';
import {
  TeleprompterSession,
  CreateTeleprompterSession,
  UpdateTeleprompterSession,
  TeleprompterSettings,
  LoadProjectContent,
} from '@/schemas/teleprompter';
import { TeleprompterSessionSchema, CreateTeleprompterSessionSchema, UpdateTeleprompterSessionSchema } from '@/schemas/teleprompter';

export interface TeleprompterService {
  // CRUD básico
  listSessions(userId: string): Promise<{ data: TeleprompterSession[] | null; error: any }>;
  getSession(sessionId: string): Promise<{ data: TeleprompterSession | null; error: any }>;
  createSession(userId: string, session: CreateTeleprompterSession): Promise<{ data: TeleprompterSession | null; error: any }>;
  updateSession(sessionId: string, session: UpdateTeleprompterSession): Promise<{ data: TeleprompterSession | null; error: any }>;
  deleteSession(sessionId: string): Promise<{ error: any }>;
  
  // Funcionalidades específicas
  loadProjectContent(params: LoadProjectContent): Promise<{ data: string | null; error: any }>;
  saveVideoRecording(sessionId: string, videoBlob: Blob): Promise<{ data: { url: string } | null; error: any }>;
}

export const teleprompterService: TeleprompterService = {
  async listSessions(userId: string) {
    try {
      const { data, error } = await supabase
        .from('teleprompter_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        const isTableNotFound = 
          error.status === 404 || 
          error.message?.includes('relation "teleprompter_sessions" does not exist');

        if (isTableNotFound) {
          if (import.meta.env.DEV) {
            console.warn('⚠️ Tabela teleprompter_sessions não encontrada. Aplique a migration primeiro.');
          }
          return { data: [], error: null };
        }

        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: (data as TeleprompterSession[]) || [], error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async getSession(sessionId: string) {
    try {
      const { data, error } = await supabase
        .from('teleprompter_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as TeleprompterSession, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async createSession(userId: string, session: CreateTeleprompterSession) {
    try {
      // Validar com Zod
      const validated = CreateTeleprompterSessionSchema.parse(session);

      const { data, error } = await supabase
        .from('teleprompter_sessions')
        .insert({
          ...validated,
          user_id: userId,
        })
        .select()
        .single();

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as TeleprompterSession, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async updateSession(sessionId: string, session: UpdateTeleprompterSession) {
    try {
      // Validar com Zod
      const validated = UpdateTeleprompterSessionSchema.parse(session);

      const { data, error } = await supabase
        .from('teleprompter_sessions')
        .update(validated)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as TeleprompterSession, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async deleteSession(sessionId: string) {
    try {
      const { error } = await supabase
        .from('teleprompter_sessions')
        .delete()
        .eq('id', sessionId);

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

  async loadProjectContent(params: LoadProjectContent) {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        return { data: null, error: { message: 'Não autenticado' } };
      }

      // Buscar projeto e suas transcrições/transformações
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('id', params.projectId)
        .eq('user_id', session.data.session.user.id)
        .single();

      if (projectError || !project) {
        return { data: null, error: { message: 'Projeto não encontrado' } };
      }

      // Se transcriptionId fornecido, buscar transcrição específica
      if (params.transcriptionId) {
        const { data: transcription, error: transcriptionError } = await supabase
          .from('transcription_history')
          .select('original_text, transformed_text')
          .eq('id', params.transcriptionId)
          .eq('user_id', session.data.session.user.id)
          .single();

        if (!transcriptionError && transcription) {
          return { 
            data: transcription.transformed_text || transcription.original_text || null, 
            error: null 
          };
        }
      }

      // Buscar última transformação do projeto
      const { data: transformation, error: transformationError } = await supabase
        .from('transformations')
        .select('outputs')
        .eq('project_id', params.projectId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!transformationError && transformation?.outputs) {
        const text = transformation.outputs.text || transformation.outputs.content || null;
        return { data: text, error: null };
      }

      return { data: null, error: { message: 'Nenhum conteúdo encontrado no projeto' } };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async saveVideoRecording(sessionId: string, videoBlob: Blob) {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        return { data: null, error: { message: 'Não autenticado' } };
      }

      // Criar nome único para o arquivo
      const fileName = `teleprompter-${sessionId}-${Date.now()}.webm`;
      const filePath = `${session.data.session.user.id}/${fileName}`;

      // Upload para Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('teleprompter-recordings')
        .upload(filePath, videoBlob, {
          contentType: 'video/webm',
          upsert: false,
        });

      if (uploadError) {
        Observability.trackError(uploadError);
        return { data: null, error: uploadError };
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('teleprompter-recordings')
        .getPublicUrl(filePath);

      const videoUrl = urlData.publicUrl;

      // Atualizar sessão com URL do vídeo
      const { error: updateError } = await supabase
        .from('teleprompter_sessions')
        .update({
          video_url: videoUrl,
          video_storage_path: filePath,
          file_size_bytes: videoBlob.size,
        })
        .eq('id', sessionId);

      if (updateError) {
        Observability.trackError(updateError);
        return { data: null, error: updateError };
      }

      return { data: { url: videoUrl }, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },
};

