// Hook para gerenciar créditos
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creditsService, type CreditBalance, type CreditTransaction, type DebitCreditsParams, type CreditCreditsParams } from '@/services/creditsService';
import { useToast } from '@/hooks/use-toast';

export function useCredits() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: balance, isLoading, error } = useQuery({
    queryKey: ['credits', 'balance'],
    queryFn: async () => {
      try {
        const { data, error } = await creditsService.getBalance();
        if (error) {
          console.error('[useCredits] Erro ao obter saldo:', error);
          // Retornar balance padrão em vez de lançar erro
          return { user_id: '', balance: 0, updated_at: new Date().toISOString() };
        }
        return data || { user_id: '', balance: 0, updated_at: new Date().toISOString() };
      } catch (err) {
        console.error('[useCredits] Erro inesperado:', err);
        return { user_id: '', balance: 0, updated_at: new Date().toISOString() };
      }
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    retry: false,
    refetchOnWindowFocus: false,
  });

  const debitCredits = useMutation({
    mutationFn: async (params: DebitCreditsParams) => {
      const { data, error } = await creditsService.debitCredits(params);
      if (error) throw error;
      return data;
    },
    onSuccess: (newBalance) => {
      queryClient.setQueryData<CreditBalance>(['credits', 'balance'], newBalance);
      // Não mostrar toast se créditos ilimitados estão ativos (apenas dev)
      if (!newBalance?.isUnlimited) {
        toast({
          title: 'Créditos debitados',
          description: `Saldo atual: ${newBalance?.balance || 0} créditos`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao debitar créditos',
        description: error.message || 'Não foi possível debitar créditos',
        variant: 'destructive',
      });
    },
  });

  const creditCredits = useMutation({
    mutationFn: async (params: CreditCreditsParams) => {
      const { data, error } = await creditsService.creditCredits(params);
      if (error) throw error;
      return data;
    },
    onSuccess: (newBalance) => {
      queryClient.setQueryData<CreditBalance>(['credits', 'balance'], newBalance);
      toast({
        title: 'Créditos adicionados!',
        description: `Saldo atual: ${newBalance?.balance || 0} créditos`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao adicionar créditos',
        description: error.message || 'Não foi possível adicionar créditos',
        variant: 'destructive',
      });
    },
  });

  return {
    balance: balance || { user_id: '', balance: 0, updated_at: '' },
    isLoading,
    error,
    debitCredits: debitCredits.mutateAsync,
    creditCredits: creditCredits.mutateAsync,
    isDebiting: debitCredits.isPending,
    isCrediting: creditCredits.isPending,
  };
}

export function useCreditTransactions(limit: number = 50) {
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['credits', 'transactions', limit],
    queryFn: async () => {
      try {
        const { data, error } = await creditsService.getTransactions(limit);
        if (error) {
          console.error('[useCreditTransactions] Erro ao obter transações:', error);
          return [];
        }
        return data || [];
      } catch (err) {
        console.error('[useCreditTransactions] Erro inesperado:', err);
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

