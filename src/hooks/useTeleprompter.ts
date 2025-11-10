// src/hooks/useTeleprompter.ts
// Hook para gerenciar sessões de teleprompter

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  teleprompterService,
  type TeleprompterSession,
  type CreateTeleprompterSession,
  type UpdateTeleprompterSession,
  type LoadProjectContent,
} from '@/services/teleprompterService';

export function useTeleprompter() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query para listar sessões
  const {
    data: sessions,
    isLoading: isLoadingSessions,
    error: errorSessions,
  } = useQuery({
    queryKey: ['teleprompter_sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await teleprompterService.listSessions(user.id);
      if (error && error.status !== 404) {
        throw error;
      }
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 segundos
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (session: CreateTeleprompterSession) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      const { data, error } = await teleprompterService.createSession(user.id, session);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teleprompter_sessions', user?.id] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (session: UpdateTeleprompterSession) => {
      const { data, error } = await teleprompterService.updateSession(session.id!, session);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teleprompter_sessions', user?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await teleprompterService.deleteSession(sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teleprompter_sessions', user?.id] });
    },
  });

  const loadProjectContentMutation = useMutation({
    mutationFn: async (params: LoadProjectContent) => {
      const { data, error } = await teleprompterService.loadProjectContent(params);
      if (error) throw error;
      return data;
    },
  });

  const saveVideoMutation = useMutation({
    mutationFn: async ({ sessionId, videoBlob }: { sessionId: string; videoBlob: Blob }) => {
      const { data, error } = await teleprompterService.saveVideoRecording(sessionId, videoBlob);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teleprompter_sessions', user?.id] });
    },
  });

  return {
    // Dados
    sessions: sessions || [],
    isLoadingSessions,
    errorSessions,
    
    // Mutations
    createSession: createMutation.mutateAsync,
    updateSession: updateMutation.mutateAsync,
    deleteSession: deleteMutation.mutateAsync,
    loadProjectContent: loadProjectContentMutation.mutateAsync,
    saveVideoRecording: saveVideoMutation.mutateAsync,
    
    // Estados de loading
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isLoadingContent: loadProjectContentMutation.isPending,
    isSavingVideo: saveVideoMutation.isPending,
  };
}

