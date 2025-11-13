// src/hooks/useTranscription.ts
// Hook para gerenciar transcrições integradas com characters

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  transcriptionService,
  type TranscriptionResult,
  type TransformTranscription,
} from '@/services/transcriptionService';
import {
  type TranscribeRequest,
  type TranscriptionHistory,
  type CreateTranscriptionHistory,
} from '@/schemas/transcription';

export function useTranscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query para histórico de transcrições
  const {
    data: history,
    isLoading: isLoadingHistory,
    error: errorHistory,
  } = useQuery({
    queryKey: ['transcription_history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await transcriptionService.listHistory(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 segundos
  });

  // Mutation para transcrever áudio/vídeo
  const transcribeMutation = useMutation({
    mutationFn: async (params: TranscribeRequest) => {
      const { data, error } = await transcriptionService.transcribeAudio(params);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transcription_history', user?.id] });
    },
  });

  // Mutation para transformar transcrição
  const transformMutation = useMutation({
    mutationFn: async (params: TransformTranscription) => {
      const { data, error } = await transcriptionService.transformTranscription(params);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transcription_history', user?.id] });
    },
  });

  return {
    // Dados
    history: history || [],
    isLoadingHistory,
    errorHistory,
    
    // Mutations
    transcribeAudio: transcribeMutation.mutateAsync,
    transformTranscription: transformMutation.mutateAsync,
    
    // Estados de loading
    isTranscribing: transcribeMutation.isPending,
    isTransforming: transformMutation.isPending,
  };
}

/**
 * Hook para uma transcrição específica (polling enquanto processa)
 */
export function useTranscriptionStatus(transcriptionId: string | null) {
  const {
    data: transcription,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['transcription', transcriptionId],
    queryFn: async () => {
      if (!transcriptionId) return null;
      
      // Buscar na tabela transcriptions
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('id', transcriptionId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!transcriptionId,
    refetchInterval: (query) => {
      // Polling enquanto estiver processando
      const data = query.state.data;
      if (data?.status === 'queued' || data?.status === 'processing') {
        return 2000; // 2 segundos
      }
      return false;
    },
  });

  return {
    transcription,
    isLoading,
    error,
  };
}

