// src/services/transcriptionService.ts
// Service para gerenciar transcrições integradas com characters

import { supabase } from '@/integrations/supabase/client';
import { Observability } from '@/lib/observability';
import {
  TranscribeRequest,
  TransformTranscription,
  TranscriptionResult,
  TranscriptionHistory,
  CreateTranscriptionHistory,
} from '@/schemas/transcription';
import { TranscriptionHistorySchema, CreateTranscriptionHistorySchema } from '@/schemas/transcription';

export interface TranscriptionService {
  // Transcrição de áudio/vídeo
  transcribeAudio(params: TranscribeRequest): Promise<{ data: TranscriptionResult | null; error: any }>;
  
  // Transformação de transcrição com character
  transformTranscription(params: TransformTranscription): Promise<{ data: string | null; error: any }>;
  
  // Histórico
  listHistory(limit?: number): Promise<{ data: TranscriptionHistory[] | null; error: any }>;
  getHistory(historyId: string): Promise<{ data: TranscriptionHistory | null; error: any }>;
  createHistory(history: CreateTranscriptionHistory): Promise<{ data: TranscriptionHistory | null; error: any }>;
}

export const transcriptionService: TranscriptionService = {
  async transcribeAudio(params: TranscribeRequest) {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        return { data: null, error: { message: 'Não autenticado' } };
      }

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/transcribe_audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session.access_token}`,
        },
        body: JSON.stringify({
          assetId: params.assetId,
          language: params.language || 'pt',
          // Opcional: aplicar character após transcrição
          characterId: params.characterId,
          applyTransformation: params.applyTransformation,
          transformationType: params.transformationType,
          transformationLength: params.transformationLength,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erro ao transcrever áudio' }));
        Observability.trackError(error);
        return { data: null, error };
      }

      const result = await response.json();
      const transcriptionId: string | null = result?.transcriptionId ?? result?.jobId ?? null;
      const status: TranscriptionResult['status'] = (result?.status as TranscriptionResult['status']) ?? 'queued';
      const text: string = typeof result?.text === 'string' ? result.text : '';

      if (!transcriptionId) {
        const error = { message: 'Resposta inválida da função de transcrição' };
        Observability.trackError(error);
        return { data: null, error };
      }

      // Se applyTransformation estiver ativo e characterId fornecido, aplicar transformação apenas quando houver texto
      if (params.applyTransformation && params.characterId && text) {
        try {
          const transformResult = await this.transformTranscription({
            transcriptionId,
            characterId: params.characterId,
            transformationType: params.transformationType || 'post',
            transformationLength: params.transformationLength || 'medium',
          });
          
          if (transformResult.data) {
            // Criar histórico com transcrição e transformação
            await this.createHistory({
              source_type: 'audio',
              source_asset_id: params.assetId,
              transcription_id: transcriptionId,
              original_text: text,
              character_id: params.characterId,
              transformation_type: params.transformationType || 'post',
              transformation_length: params.transformationLength || 'medium',
              transformed_text: transformResult.data,
              status: 'completed',
            });
          }
        } catch (transformError) {
          console.error('Erro ao aplicar transformação após transcrição:', transformError);
          // Continuar mesmo se transformação falhar
        }
      } else if (text) {
        // Criar histórico apenas com transcrição quando texto estiver disponível
        await this.createHistory({
          source_type: 'audio',
          source_asset_id: params.assetId,
          transcription_id: transcriptionId,
          original_text: text,
          status: 'completed',
        });
      }

      return {
        data: {
          transcriptionId,
          text,
          language: result.language ?? params.language,
          duration: result.duration,
          status,
          error: result.error,
        },
        error: null,
      };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async transformTranscription(params: TransformTranscription) {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        return { data: null, error: { message: 'Não autenticado' } };
      }

      // Buscar transcrição primeiro
      const { data: transcription, error: transcriptionError } = await supabase
        .from('transcriptions')
        .select('text, asset_id')
        .eq('id', params.transcriptionId)
        .single();

      if (transcriptionError || !transcription) {
        return { data: null, error: { message: 'Transcrição não encontrada' } };
      }

      // Usar characterService para transformar
      const { characterService } = await import('./characterService');
      const transformResult = await characterService.transformWithCharacter({
        characterId: params.characterId,
        inputText: transcription.text,
        transformationType: params.transformationType,
        transformationLength: params.transformationLength,
        tone: params.tone,
      });

      if (transformResult.error) {
        return { data: null, error: transformResult.error };
      }

      // Atualizar histórico se existir
      const { data: history } = await supabase
        .from('transcription_history')
        .select('id')
        .eq('transcription_id', params.transcriptionId)
        .maybeSingle();

      if (history) {
        await supabase
          .from('transcription_history')
          .update({
            transformed_text: transformResult.data || null,
            transformation_type: params.transformationType,
            transformation_length: params.transformationLength,
            character_id: params.characterId,
          })
          .eq('id', history.id);
      } else {
        // Criar novo histórico
        await this.createHistory({
          source_type: 'audio',
          transcription_id: params.transcriptionId,
          original_text: transcription.text,
          character_id: params.characterId,
          transformation_type: params.transformationType,
          transformation_length: params.transformationLength,
          transformed_text: transformResult.data || null,
          status: 'completed',
        });
      }

      return { data: transformResult.data, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async listHistory(limit: number = 50) {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        return { data: null, error: { message: 'Não autenticado' } };
      }

      const { data, error } = await supabase
        .from('transcription_history')
        .select('*')
        .eq('user_id', session.data.session.user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        const isTableNotFound =
          error.status === 404 ||
          error.message?.includes('relation "transcription_history" does not exist');

        if (isTableNotFound) {
          if (import.meta.env.DEV) {
            console.warn('⚠️ Tabela transcription_history não encontrada. Aplique a migration primeiro.');
          }
          return { data: [], error: null };
        }

        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: (data as TranscriptionHistory[]) || [], error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async getHistory(historyId: string) {
    try {
      const { data, error } = await supabase
        .from('transcription_history')
        .select('*')
        .eq('id', historyId)
        .single();

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as TranscriptionHistory, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },

  async createHistory(history: CreateTranscriptionHistory) {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        return { data: null, error: { message: 'Nǜo autenticado' } };
      }

      // Validar com Zod
      const validated = CreateTranscriptionHistorySchema.parse(history);

      // Inserir e retornar a linha
      const { data, error } = await supabase
        .from('transcription_history')
        .insert({
          ...validated,
          user_id: session.data.session.user.id,
        })
        .select()
        .single();

      if (error) {
        Observability.trackError(error);
        return { data: null, error };
      }

      return { data: data as TranscriptionHistory, error: null };
    } catch (error: any) {
      Observability.trackError(error);
      return { data: null, error };
    }
  },
};

