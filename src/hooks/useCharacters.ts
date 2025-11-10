// src/hooks/useCharacters.ts
// Hook para gerenciar Characters (substitui useBrandVoice)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { 
  characterService, 
  type Character, 
  type CharacterSample,
  type CreateCharacter,
  type UpdateCharacter,
  type TrainCharacterRequest,
  type TransformWithCharacterRequest,
} from '@/services/characterService';
import { useState, useEffect } from 'react';

export function useCharacters() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [migrationRequired, setMigrationRequired] = useState<boolean | null>(null);

  // Verificar se migration é necessária (apenas uma vez, com timeout)
  useEffect(() => {
    if (!user?.id) {
      setMigrationRequired(null);
      return;
    }

    let cancelled = false;

    // Timeout para evitar verificação muito longa
    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        console.warn('Verificação de migration demorou muito. Assumindo que pode ser necessária.');
        setMigrationRequired(true);
      }
    }, 3000);

    // Verificar se tabela characters existe
    characterService.listCharacters(user.id)
      .then((result) => {
        if (!cancelled) {
          clearTimeout(timeoutId);
          if (!result.error) {
            setMigrationRequired(false);
            return;
          }

          const message = result.error.message ?? '';
          const needsMigration =
            message.includes('relation "characters" does not exist') ||
            message.includes('relation "public.characters" does not exist') ||
            message.includes("Could not find the table 'public.characters'");

          setMigrationRequired(needsMigration);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          clearTimeout(timeoutId);
          console.error('Erro ao verificar migration:', error);
          // Em caso de erro, assumir que migration pode ser necessária
          setMigrationRequired(true);
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [user?.id]);

  // Query para listar characters
  const {
    data: characters,
    isLoading: isLoadingCharacters,
    error: errorCharacters,
  } = useQuery({
    queryKey: ['characters', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await characterService.listCharacters(user.id);
      if (error && error.status !== 404 && error.code !== 'PGRST116') {
        throw error;
      }
      return data || [];
    },
    enabled: !!user?.id && migrationRequired === false,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000,
  });

  // Query para character padrão
  const {
    data: defaultCharacter,
    isLoading: isLoadingDefault,
  } = useQuery({
    queryKey: ['character', 'default', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await characterService.getDefaultCharacter(user.id);
      if (error && error.status !== 404 && error.code !== 'PGRST116') {
        throw error;
      }
      return data;
    },
    enabled: !!user?.id && migrationRequired === false,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (character: CreateCharacter) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      const { data, error } = await characterService.createCharacter(user.id, character);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['character', 'default', user?.id] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (character: UpdateCharacter) => {
      const { data, error } = await characterService.updateCharacter(character.id!, character);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['character', 'default', user?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (characterId: string) => {
      const { error } = await characterService.deleteCharacter(characterId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['character', 'default', user?.id] });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (characterId: string) => {
      const { error } = await characterService.setDefaultCharacter(characterId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['character', 'default', user?.id] });
    },
  });

  const trainMutation = useMutation({
    mutationFn: async (params: TrainCharacterRequest) => {
      const { data, error } = await characterService.trainCharacter(params);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['character', 'default', user?.id] });
    },
  });

  const transformMutation = useMutation({
    mutationFn: async (params: TransformWithCharacterRequest) => {
      const { data, error } = await characterService.transformWithCharacter(params);
      if (error) throw error;
      return data;
    },
  });

  return {
    // Dados
    characters: (migrationRequired === true ? [] : (characters || [])),
    defaultCharacter: (migrationRequired === true ? null : (defaultCharacter || null)),
    isLoadingCharacters: migrationRequired === true ? false : isLoadingCharacters,
    errorCharacters,
    migrationRequired: migrationRequired ?? false,
    
    // Mutations
    createCharacter: createMutation.mutateAsync,
    updateCharacter: updateMutation.mutateAsync,
    deleteCharacter: deleteMutation.mutateAsync,
    setDefaultCharacter: setDefaultMutation.mutateAsync,
    trainCharacter: trainMutation.mutateAsync,
    transformWithCharacter: transformMutation.mutateAsync,
    
    // Estados de loading
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSettingDefault: setDefaultMutation.isPending,
    isTraining: trainMutation.isPending,
    isTransforming: transformMutation.isPending,
  };
}
