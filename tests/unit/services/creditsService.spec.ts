/**
 * Testes unitários para creditsService
 * Valida gerenciamento de créditos: saldo, débito, crédito e transações
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { creditsService } from '@/services/creditsService';
import { supabase } from '@/integrations/supabase/client';
import { Observability } from '@/lib/observability';

// Mock do Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

// Mock do Observability
vi.mock('@/lib/observability', () => ({
  Observability: {
    trackError: vi.fn(),
  },
}));

describe('creditsService', () => {
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
  };

  const mockBalance: any = {
    user_id: 'user123',
    balance: 100,
    updated_at: '2025-01-08T00:00:00Z',
  };

  const mockTransaction: any = {
    id: 'tx123',
    user_id: 'user123',
    delta: -10,
    reason: 'Test transaction',
    ref_type: 'transformation',
    ref_id: 'trans123',
    created_at: '2025-01-08T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock padrão de getUser retornando usuário autenticado
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as any);
  });

  describe('getBalance', () => {
    it('deve retornar saldo quando usuário está autenticado', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockBalance,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await creditsService.getBalance();

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockBalance);
      expect(supabase.from).toHaveBeenCalledWith('credits');
    });

    it('deve criar registro com saldo zero quando não existe', async () => {
      let callCount = 0;
      const mockQuery1 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      };
      const mockQuery2 = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockBalance, balance: 0 },
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) return mockQuery1 as any;
        if (callCount === 2) return mockQuery2 as any;
        return mockQuery1 as any;
      });

      const result = await creditsService.getBalance();

      expect(result.error).toBeNull();
      expect(result.data?.balance).toBe(0);
    });

    it('deve retornar erro quando usuário não está autenticado', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await creditsService.getBalance();

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Usuário não autenticado');
      expect(result.data).toBeNull();
    });

    it('deve tratar erros de rede', async () => {
      const networkError = new Error('Network error');
      vi.mocked(supabase.auth.getUser).mockRejectedValue(networkError);

      const result = await creditsService.getBalance();

      expect(result.error).toBe(networkError);
      expect(result.data).toBeNull();
      expect(Observability.trackError).toHaveBeenCalledWith(networkError);
    });
  });

  describe('debitCredits', () => {
    it('deve debitar créditos quando saldo é suficiente', async () => {
      let balanceCallCount = 0;
      const mockBalanceQuery1 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockBalance,
          error: null,
        }),
      };
      const mockBalanceQuery2 = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockBalance, balance: 90 },
          error: null,
        }),
      };
      const mockTransactionQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockTransaction,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'credit_transactions') {
          return mockTransactionQuery as any;
        }
        if (table === 'credits') {
          balanceCallCount++;
          // Primeira chamada: getBalance interno
          // Segunda chamada: getBalance após débito
          return balanceCallCount === 1 ? mockBalanceQuery1 as any : mockBalanceQuery2 as any;
        }
        return mockBalanceQuery1 as any;
      });

      const result = await creditsService.debitCredits({
        amount: 10,
        ref: { ref_type: 'transformation', ref_id: 'trans123' },
        reason: 'Test debit',
      });

      expect(result.error).toBeNull();
      expect(result.data?.balance).toBe(90);
    });

    it('deve retornar erro quando saldo é insuficiente', async () => {
      const mockBalanceQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockBalance, balance: 5 },
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockBalanceQuery as any);

      const result = await creditsService.debitCredits({
        amount: 10,
        ref: { ref_type: 'transformation', ref_id: 'trans123' },
        reason: 'Test debit',
      });

      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('INSUFFICIENT_BALANCE');
      expect(result.error?.message).toContain('Saldo insuficiente');
      expect(result.data).toBeNull();
    });

    it('deve retornar erro quando valor é inválido (<= 0)', async () => {
      const result = await creditsService.debitCredits({
        amount: 0,
        ref: { ref_type: 'transformation', ref_id: 'trans123' },
        reason: 'Test debit',
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Valor deve ser maior que zero');
      expect(result.data).toBeNull();
    });

    it('deve retornar erro quando valor é muito alto (> 1.000.000)', async () => {
      const result = await creditsService.debitCredits({
        amount: 2000000,
        ref: { ref_type: 'transformation', ref_id: 'trans123' },
        reason: 'Test debit',
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Valor muito alto (máximo: 1.000.000)');
      expect(result.data).toBeNull();
    });

    it('deve tratar idempotência (erro 23505)', async () => {
      let callCount = 0;
      const mockBalanceQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockBalance,
          error: null,
        }),
      };
      const mockTransactionQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '23505', message: 'Duplicate key' },
        }),
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        if (table === 'credits') {
          return mockBalanceQuery as any;
        }
        if (table === 'credit_transactions') {
          return mockTransactionQuery as any;
        }
        return mockBalanceQuery as any;
      });

      const result = await creditsService.debitCredits({
        amount: 10,
        ref: { ref_type: 'transformation', ref_id: 'trans123' },
        reason: 'Test debit',
      });

      // Deve retornar saldo atual sem erro (idempotência)
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    });

    it('deve retornar erro quando usuário não está autenticado', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await creditsService.debitCredits({
        amount: 10,
        ref: { ref_type: 'transformation', ref_id: 'trans123' },
        reason: 'Test debit',
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Usuário não autenticado');
      expect(result.data).toBeNull();
    });
  });

  describe('creditCredits', () => {
    it('deve creditar créditos com sucesso', async () => {
      let callCount = 0;
      const mockTransactionQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockTransaction, delta: 50 },
          error: null,
        }),
      };
      const mockBalanceQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockBalance, balance: 150 },
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        if (table === 'credit_transactions') {
          return mockTransactionQuery as any;
        }
        if (table === 'credits') {
          return mockBalanceQuery as any;
        }
        return mockBalanceQuery as any;
      });

      const result = await creditsService.creditCredits({
        amount: 50,
        reason: 'Test credit',
        ref: { ref_type: 'purchase', ref_id: 'purchase123' },
      });

      expect(result.error).toBeNull();
      expect(result.data?.balance).toBe(150);
    });

    it('deve usar ref_type padrão "bonus" quando não fornecido', async () => {
      let callCount = 0;
      const mockTransactionQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockTransaction, delta: 20, ref_type: 'bonus' },
          error: null,
        }),
      };
      const mockBalanceQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockBalance, balance: 120 },
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        if (table === 'credit_transactions') {
          return mockTransactionQuery as any;
        }
        if (table === 'credits') {
          return mockBalanceQuery as any;
        }
        return mockBalanceQuery as any;
      });

      const result = await creditsService.creditCredits({
        amount: 20,
        reason: 'Test credit',
      });

      expect(result.error).toBeNull();
      expect(result.data?.balance).toBe(120);
    });

    it('deve retornar erro quando valor é inválido', async () => {
      const result = await creditsService.creditCredits({
        amount: -10,
        reason: 'Test credit',
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Valor deve ser maior que zero');
    });

    it('deve retornar erro quando usuário não está autenticado', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await creditsService.creditCredits({
        amount: 50,
        reason: 'Test credit',
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Usuário não autenticado');
      expect(result.data).toBeNull();
    });

    it('deve tratar erros de inserção', async () => {
      const insertError = { message: 'Insert failed', code: 'PGRST301' };
      const mockTransactionQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: insertError,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockTransactionQuery as any);

      const result = await creditsService.creditCredits({
        amount: 50,
        reason: 'Test credit',
      });

      expect(result.error).toEqual(insertError);
      expect(result.data).toBeNull();
      expect(Observability.trackError).toHaveBeenCalledWith(insertError);
    });
  });

  describe('getTransactions', () => {
    it('deve retornar lista de transações', async () => {
      const mockTransactions = [mockTransaction, { ...mockTransaction, id: 'tx456' }];
      const limitSpy = vi.fn().mockResolvedValue({
        data: mockTransactions,
        error: null,
      });
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: limitSpy,
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await creditsService.getTransactions();

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockTransactions);
      expect(result.data?.length).toBe(2);
    });

    it('deve respeitar limite de transações', async () => {
      const limitSpy = vi.fn().mockResolvedValue({
        data: [mockTransaction],
        error: null,
      });
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: limitSpy,
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await creditsService.getTransactions(10);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(limitSpy).toHaveBeenCalledWith(10);
    });

    it('deve usar limite padrão de 50 quando não fornecido', async () => {
      const limitSpy = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: limitSpy,
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await creditsService.getTransactions();

      expect(limitSpy).toHaveBeenCalledWith(50);
    });

    it('deve retornar erro quando usuário não está autenticado', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await creditsService.getTransactions();

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Usuário não autenticado');
      expect(result.data).toBeNull();
    });

    it('deve tratar erros de consulta', async () => {
      const queryError = { message: 'Query failed', code: 'PGRST301' };
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: null,
                error: queryError,
              }),
            }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue(mockFrom() as any);

      const result = await creditsService.getTransactions();

      expect(result.error).toEqual(queryError);
      expect(result.data).toBeNull();
      expect(Observability.trackError).toHaveBeenCalledWith(queryError);
    });
  });
});

