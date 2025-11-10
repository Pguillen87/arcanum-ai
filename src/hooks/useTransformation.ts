// Hook para gerenciar transformações de texto
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transformService, type Transformation, type CreateTextTransformParams } from '@/services/transformService';
import { useToast } from '@/hooks/use-toast';

export function useTransformation(jobId: string | null) {
  const { data: transformation, isLoading, error, refetch } = useQuery({
    queryKey: ['transformation', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      try {
        const { data, error } = await transformService.getTextTransform(jobId);
        if (error) {
          console.error('[useTransformation] Erro ao obter transformação:', error);
          return null;
        }
        return data;
      } catch (err) {
        console.error('[useTransformation] Erro inesperado:', err);
        return null;
      }
    },
    enabled: !!jobId,
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: (data) => {
      // Polling enquanto estiver processando
      if (data?.status === 'queued' || data?.status === 'processing') {
        return 2000; // 2 segundos
      }
      return false;
    },
  });

  return {
    transformation,
    isLoading,
    error,
    refetch,
  };
}

export function useCreateTransformation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createTransformation = useMutation({
    mutationFn: async (params: CreateTextTransformParams) => {
      const { data, error } = await transformService.createTextTransform(params);
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.jobId) {
        // Iniciar polling do job
        queryClient.setQueryData(['transformation', data.jobId], {
          id: data.jobId,
          status: 'queued',
        } as Transformation);
      }
      toast({
        title: 'Transformação iniciada!',
        description: 'Seu conteúdo está sendo processado.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar transformação',
        description: error.message || 'Não foi possível iniciar a transformação',
        variant: 'destructive',
      });
    },
  });

  return {
    createTransformation: createTransformation.mutateAsync,
    isCreating: createTransformation.isPending,
  };
}

