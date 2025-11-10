// Hook para gerenciar assets (arquivos de mídia)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsService, type Asset, type CreateSignedUploadUrlParams, type AssetStatus } from '@/services/assetsService';
import { useToast } from '@/hooks/use-toast';

export function useAssets(projectId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: assets, isLoading, error } = useQuery({
    queryKey: ['assets', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await assetsService.listAssets(projectId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const createUploadUrl = useMutation({
    mutationFn: async (params: CreateSignedUploadUrlParams) => {
      const { data, error } = await assetsService.createSignedUploadUrl(params);
      if (error) throw error;
      return data;
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar URL de upload',
        description: error.message || 'Não foi possível criar URL de upload',
        variant: 'destructive',
      });
    },
  });

  const updateAssetStatus = useMutation({
    mutationFn: async ({ id, status, metadata }: { id: string; status: AssetStatus; metadata?: { duration_seconds?: number; mimetype?: string } }) => {
      const { data, error } = await assetsService.updateAssetStatus(id, status, metadata);
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedAsset) => {
      queryClient.setQueryData<Asset[]>(['assets', projectId], (old) => {
        return old?.map((a) => (a.id === updatedAsset.id ? updatedAsset : a)) || [];
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar asset',
        description: error.message || 'Não foi possível atualizar o asset',
        variant: 'destructive',
      });
    },
  });

  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await assetsService.deleteAsset(id);
      if (error) throw error;
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<Asset[]>(['assets', projectId], (old) => {
        return old?.filter((a) => a.id !== deletedId) || [];
      });
      toast({
        title: 'Arquivo deletado',
        description: 'O arquivo foi removido com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao deletar arquivo',
        description: error.message || 'Não foi possível deletar o arquivo',
        variant: 'destructive',
      });
    },
  });

  return {
    assets: assets || [],
    isLoading,
    error,
    createUploadUrl: createUploadUrl.mutateAsync,
    updateAssetStatus: updateAssetStatus.mutate,
    deleteAsset: deleteAsset.mutate,
    isCreatingUrl: createUploadUrl.isPending,
    isUpdating: updateAssetStatus.isPending,
    isDeleting: deleteAsset.isPending,
  };
}

export function useAsset(id: string | null) {
  const { data: asset, isLoading, error } = useQuery({
    queryKey: ['asset', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await assetsService.getAsset(id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  return {
    asset,
    isLoading,
    error,
  };
}

