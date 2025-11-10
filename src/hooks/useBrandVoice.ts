import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { 
  brandVoiceService, 
  type BrandVoice, 
  type BrandProfile,
  type TrainBrandVoiceParams,
  type TransformWithBrandVoiceParams,
} from '@/services/brandVoiceService';
import { checkBrandVoiceSchema } from '@/utils/checkBrandVoiceSchema';
import { useState, useEffect } from 'react';

export function useBrandVoice() {
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

    checkBrandVoiceSchema()
      .then((status) => {
        if (!cancelled) {
          clearTimeout(timeoutId);
          setMigrationRequired(status === 'migration_required');
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

  // Query legada (compatibilidade com profiles.brand_voice)
  const {
    data: brandVoice,
    isLoading: isLoadingLegacy,
    error: errorLegacy,
  } = useQuery({
    queryKey: ['brandVoice', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await brandVoiceService.getBrandVoice(user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Query para listar perfis (brand_profiles)
  // IMPORTANTE: Só executar se migration não for necessária E verificação já completou
  const {
    data: profiles,
    isLoading: isLoadingProfiles,
    error: errorProfiles,
  } = useQuery({
    queryKey: ['brandProfiles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await brandVoiceService.listProfiles(user.id);
      // Não propagar erro 404 (tabela não existe) - já tratado no service
      if (error && error.status !== 404 && error.code !== 'PGRST116') {
        throw error;
      }
      return data || [];
    },
    enabled: !!user?.id && migrationRequired === false, // Só executar se migration NÃO for necessária (false, não null)
    retry: false, // Não tentar novamente se erro 404
    refetchOnWindowFocus: false, // Evitar refetch desnecessário
    refetchOnMount: false, // Evitar refetch ao montar se já tentou antes
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos para evitar requisições excessivas
  });

  // Query para perfil padrão
  // IMPORTANTE: Só executar se migration não for necessária E verificação já completou
  const {
    data: defaultProfile,
    isLoading: isLoadingDefault,
  } = useQuery({
    queryKey: ['brandProfile', 'default', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await brandVoiceService.getDefaultProfile(user.id);
      // Não propagar erro 404 (tabela não existe) - já tratado no service
      if (error && error.status !== 404 && error.code !== 'PGRST116') {
        throw error;
      }
      return data;
    },
    enabled: !!user?.id && migrationRequired === false, // Só executar se migration NÃO for necessária (false, não null)
    retry: false, // Não tentar novamente se erro 404
    refetchOnWindowFocus: false, // Evitar refetch desnecessário
    refetchOnMount: false, // Evitar refetch ao montar se já tentou antes
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos para evitar requisições excessivas
  });

  // Mutations legadas (compatibilidade)
  const updateMutation = useMutation({
    mutationFn: async (voice: BrandVoice) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      const { data, error } = await brandVoiceService.updateBrandVoice(user.id, voice);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brandVoice', user?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      const { error } = await brandVoiceService.deleteBrandVoice(user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brandVoice', user?.id] });
    },
  });

  // Mutations para brand_profiles
  const trainMutation = useMutation({
    mutationFn: async (params: TrainBrandVoiceParams) => {
      const { data, error } = await brandVoiceService.trainBrandVoice(params);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brandProfiles', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['brandProfile', 'default', user?.id] });
    },
  });

  const transformMutation = useMutation({
    mutationFn: async (params: TransformWithBrandVoiceParams) => {
      const { data, error } = await brandVoiceService.transformWithBrandVoice(params);
      if (error) throw error;
      return data;
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await brandVoiceService.deleteProfile(profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brandProfiles', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['brandProfile', 'default', user?.id] });
    },
  });

  const setDefaultProfileMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await brandVoiceService.setDefaultProfile(profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brandProfiles', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['brandProfile', 'default', user?.id] });
    },
  });

  return {
    // Dados legados (compatibilidade)
    brandVoice: brandVoice || null,
    isLoading: isLoadingLegacy,
    error: errorLegacy,
    
    // Novos dados (brand_profiles)
    profiles: (migrationRequired === true ? [] : (profiles || [])), // Retornar array vazio se migration necessária
    defaultProfile: (migrationRequired === true ? null : (defaultProfile || null)), // Retornar null se migration necessária
    isLoadingProfiles: migrationRequired === true ? false : isLoadingProfiles, // Não mostrar loading se migration necessária
    errorProfiles,
    migrationRequired: migrationRequired ?? false, // Flag para indicar se migration é necessária
    
    // Mutations legadas
    updateBrandVoice: updateMutation.mutateAsync,
    deleteBrandVoice: deleteMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Novas mutations
    trainBrandVoice: trainMutation.mutateAsync,
    transformWithBrandVoice: transformMutation.mutateAsync,
    deleteProfile: deleteProfileMutation.mutateAsync,
    setDefaultProfile: setDefaultProfileMutation.mutateAsync,
    isTraining: trainMutation.isPending,
    isTransforming: transformMutation.isPending,
    isDeletingProfile: deleteProfileMutation.isPending,
    isSettingDefault: setDefaultProfileMutation.isPending,
  };
}

