// Hook para gerenciar Dracmas
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dracmasService, type DracmaBalance, type DracmaTransaction, type DebitDracmasParams, type CreditDracmasParams } from '@/services/dracmasService';
import { useToast } from '@/hooks/use-toast';

export function useDracmas() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: balance, isLoading, error } = useQuery({
    queryKey: ['dracmas', 'balance'],
    queryFn: async () => {
      try {
        const { data, error } = await dracmasService.getBalance();
        if (error) {
          console.error('[useDracmas] Erro ao obter saldo:', error);
          // Retornar balance padrão em vez de lançar erro
          return { user_id: '', balance: 0, updated_at: new Date().toISOString() };
        }
        return data || { user_id: '', balance: 0, updated_at: new Date().toISOString() };
      } catch (err) {
        console.error('[useDracmas] Erro inesperado:', err);
        return { user_id: '', balance: 0, updated_at: new Date().toISOString() };
      }
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    retry: false,
    refetchOnWindowFocus: false,
  });

  const debitDracmas = useMutation({
    mutationFn: async (params: DebitDracmasParams) => {
      const { data, error } = await dracmasService.debitDracmas(params);
      if (error) throw error;
      return data;
    },
    onSuccess: (newBalance) => {
      queryClient.setQueryData<DracmaBalance>(['dracmas', 'balance'], newBalance);
      // Não mostrar toast se Dracmas ilimitados estão ativos (apenas dev ou criador)
      if (!newBalance?.isUnlimited) {
        toast({
          title: 'Dracmas debitados',
          description: `Saldo atual: ${newBalance?.balance || 0} Dracmas`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao debitar Dracmas',
        description: error.message || 'Não foi possível debitar Dracmas',
        variant: 'destructive',
      });
    },
  });

  const creditDracmas = useMutation({
    mutationFn: async (params: CreditDracmasParams) => {
      const { data, error } = await dracmasService.creditDracmas(params);
      if (error) throw error;
      return data;
    },
    onSuccess: (newBalance) => {
      queryClient.setQueryData<DracmaBalance>(['dracmas', 'balance'], newBalance);
      toast({
        title: 'Dracmas adicionados!',
        description: `Saldo atual: ${newBalance?.balance || 0} Dracmas`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao adicionar Dracmas',
        description: error.message || 'Não foi possível adicionar Dracmas',
        variant: 'destructive',
      });
    },
  });

  return {
    balance: balance || { user_id: '', balance: 0, updated_at: '' },
    isLoading,
    error,
    debitDracmas: debitDracmas.mutateAsync,
    creditDracmas: creditDracmas.mutateAsync,
    isDebiting: debitDracmas.isPending,
    isCrediting: creditDracmas.isPending,
  };
}

export function useDracmaTransactions(limit: number = 50) {
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['dracmas', 'transactions', limit],
    queryFn: async () => {
      try {
        const { data, error } = await dracmasService.getTransactions(limit);
        if (error) {
          console.error('[useDracmaTransactions] Erro ao obter transações:', error);
          return [];
        }
        return data || [];
      } catch (err) {
        console.error('[useDracmaTransactions] Erro inesperado:', err);
        return [];
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    transactions: transactions || [],
    isLoading,
    error,
  };
}

// Manter exports antigos para compatibilidade durante transição
export const useCredits = useDracmas;
export const useCreditTransactions = useDracmaTransactions;

