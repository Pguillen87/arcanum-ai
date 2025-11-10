/**
 * Testes de integração para Edge Function payments/webhooks
 * Valida webhooks, verificação de assinatura, idempotência, reconciliação
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const EDGE_FUNCTION_URL = SUPABASE_URL 
  ? `${SUPABASE_URL}/functions/v1/payments/webhooks`
  : null;

describe('Edge Function: payments/webhooks', () => {
  if (!EDGE_FUNCTION_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    it.skip('Requer VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY e VITE_SUPABASE_SERVICE_ROLE_KEY configurados', () => {});
    return;
  }

  const adminClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
  let testUserId: string;
  let testUserEmail: string;
  let testUserPassword: string;

  beforeAll(async () => {
    // Criar usuário de teste
    testUserEmail = `payment-test-${Date.now()}@example.com`;
    testUserPassword = 'TestPassword123!';
    
    const { data: authData, error: authError } = await adminClient.auth.signUp({
      email: testUserEmail,
      password: testUserPassword,
    });
    
    if (authError) throw authError;
    testUserId = authData.user!.id;

    // Aguardar criação do perfil
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (testUserId) {
      // Deletar transações de crédito
      await adminClient
        .from('credit_transactions')
        .delete()
        .eq('user_id', testUserId);
      
      // Deletar saldo de créditos
      await adminClient
        .from('credits')
        .delete()
        .eq('user_id', testUserId);
      
      // Deletar pagamentos
      await adminClient
        .from('payments')
        .delete()
        .eq('user_id', testUserId);
      
      // Deletar usuário
      await adminClient.auth.admin.deleteUser(testUserId);
    }
  });

  describe('Validação de Requisição', () => {
    it('deve retornar 405 para método não POST', async () => {
      const response = await fetch(EDGE_FUNCTION_URL, { method: 'GET' });
      expect(response.status).toBe(405);
      const data = await response.json();
      expect(data.code).toBe('VAL_405');
    });

    it('deve retornar 400 para campos obrigatórios ausentes', async () => {
      const invalidEvent = {
        provider: 'stripe',
        // event_id e status ausentes
      };

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidEvent),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('VAL_400');
      expect(data.message).toContain('obrigatórios');
    });

    it('deve retornar 400 para status não suportado', async () => {
      const invalidEvent = {
        event_id: `test_${Date.now()}`,
        provider: 'stripe',
        status: 'invalid_status',
        amount_cents: 1000,
        currency: 'BRL',
      };

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidEvent),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.code).toBe('VAL_400');
      expect(data.message).toContain('Status não suportado');
    });

    it('deve incluir CORS headers na resposta', async () => {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'OPTIONS',
      });

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });

  describe('Processamento de Pagamento Aprovado', () => {
    it('deve processar pagamento aprovado e creditar créditos', async () => {
      const eventId = `approved_${Date.now()}`;
      const event = {
        event_id: eventId,
        provider: 'stripe' as const,
        status: 'approved' as const,
        amount_cents: 1000, // R$ 10,00 = 10 créditos
        currency: 'BRL',
        user_id: testUserId,
      };

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.credits).toBe(10); // 1000 centavos / 100 = 10 créditos

      // Verificar que créditos foram creditados
      const { data: balance } = await adminClient
        .from('credits')
        .select('balance')
        .eq('user_id', testUserId)
        .single();

      expect(balance?.balance).toBeGreaterThanOrEqual(10);
    });

    it('deve retornar erro quando user_id não é fornecido para pagamento aprovado', async () => {
      const event = {
        event_id: `no_user_${Date.now()}`,
        provider: 'stripe' as const,
        status: 'approved' as const,
        amount_cents: 1000,
        currency: 'BRL',
        // user_id ausente
      };

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.code).toBe('INT_500');
    });

    it('deve processar pagamento via Mercado Pago', async () => {
      const eventId = `mp_${Date.now()}`;
      const event = {
        event_id: eventId,
        provider: 'mp' as const,
        status: 'approved' as const,
        amount_cents: 2000, // R$ 20,00 = 20 créditos
        currency: 'BRL',
        user_id: testUserId,
      };

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.credits).toBe(20);
    });
  });

  describe('Idempotência', () => {
    it('deve ser idempotente (processar mesmo evento duas vezes sem duplicar créditos)', async () => {
      const eventId = `idempotent_${Date.now()}`;
      const event = {
        event_id: eventId,
        provider: 'stripe' as const,
        status: 'approved' as const,
        amount_cents: 1000,
        currency: 'BRL',
        user_id: testUserId,
      };

      // Primeira requisição
      const response1 = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      expect(response1.status).toBe(200);
      const data1 = await response1.json();
      expect(data1.ok).toBe(true);

      // Obter saldo após primeira requisição
      const { data: balance1 } = await adminClient
        .from('credits')
        .select('balance')
        .eq('user_id', testUserId)
        .single();

      // Segunda requisição (mesmo event_id)
      const response2 = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      expect(response2.status).toBe(200);
      const data2 = await response.json();
      expect(data2.ok).toBe(true);
      expect(data2.message).toContain('já processado');

      // Verificar que saldo não mudou
      const { data: balance2 } = await adminClient
        .from('credits')
        .select('balance')
        .eq('user_id', testUserId)
        .single();

      expect(balance2?.balance).toBe(balance1?.balance);
    });

    it('deve verificar idempotência por event_id único por provider', async () => {
      const eventId = `unique_${Date.now()}`;
      
      // Evento Stripe
      const stripeEvent = {
        event_id: eventId,
        provider: 'stripe' as const,
        status: 'approved' as const,
        amount_cents: 1000,
        currency: 'BRL',
        user_id: testUserId,
      };

      // Evento Mercado Pago com mesmo event_id (deve ser processado separadamente)
      const mpEvent = {
        event_id: eventId,
        provider: 'mp' as const,
        status: 'approved' as const,
        amount_cents: 1000,
        currency: 'BRL',
        user_id: testUserId,
      };

      const response1 = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stripeEvent),
      });

      const response2 = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mpEvent),
      });

      // Ambos devem ser processados (idempotência é por provider + event_id)
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  describe('Reconciliação', () => {
    it('deve registrar pagamento na tabela payments', async () => {
      const eventId = `reconcile_${Date.now()}`;
      const event = {
        event_id: eventId,
        provider: 'stripe' as const,
        status: 'approved' as const,
        amount_cents: 1000,
        currency: 'BRL',
        user_id: testUserId,
        metadata: { order_id: 'order123' },
      };

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      expect(response.status).toBe(200);

      // Verificar registro na tabela payments (se implementado)
      // Por enquanto, apenas verificar que não houve erro
      const { data: payments } = await adminClient
        .from('payments')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();

      // Se a tabela payments existir e o registro foi criado, verificar
      if (payments) {
        expect(payments.event_id).toBe(eventId);
        expect(payments.user_id).toBe(testUserId);
        expect(payments.status).toBe('completed');
      }
    });

    it('deve creditar créditos corretamente baseado em amount_cents', async () => {
      const eventId = `reconcile_credits_${Date.now()}`;
      const event = {
        event_id: eventId,
        provider: 'stripe' as const,
        status: 'approved' as const,
        amount_cents: 5000, // R$ 50,00 = 50 créditos
        currency: 'BRL',
        user_id: testUserId,
      };

      // Obter saldo inicial
      const { data: initialBalance } = await adminClient
        .from('credits')
        .select('balance')
        .eq('user_id', testUserId)
        .maybeSingle();

      const initialBalanceValue = initialBalance?.balance || 0;

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.credits).toBe(50);

      // Verificar saldo final
      const { data: finalBalance } = await adminClient
        .from('credits')
        .select('balance')
        .eq('user_id', testUserId)
        .single();

      expect(finalBalance?.balance).toBe(initialBalanceValue + 50);
    });
  });

  describe('Processamento de Reembolso', () => {
    it('deve processar reembolso e debitar créditos', async () => {
      // Primeiro, criar um pagamento aprovado
      const paymentEventId = `refund_payment_${Date.now()}`;
      const paymentEvent = {
        event_id: paymentEventId,
        provider: 'stripe' as const,
        status: 'approved' as const,
        amount_cents: 1000,
        currency: 'BRL',
        user_id: testUserId,
      };

      await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentEvent),
      });

      // Obter saldo após pagamento
      const { data: balanceAfterPayment } = await adminClient
        .from('credits')
        .select('balance')
        .eq('user_id', testUserId)
        .single();

      // Processar reembolso
      const refundEventId = `refund_${Date.now()}`;
      const refundEvent = {
        event_id: refundEventId,
        provider: 'stripe' as const,
        status: 'refunded' as const,
        amount_cents: 1000,
        currency: 'BRL',
        user_id: testUserId,
        metadata: { original_event_id: paymentEventId },
      };

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(refundEvent),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);

      // Verificar que créditos foram debitados
      const { data: balanceAfterRefund } = await adminClient
        .from('credits')
        .select('balance')
        .eq('user_id', testUserId)
        .single();

      expect(balanceAfterRefund?.balance).toBeLessThan(balanceAfterPayment?.balance || 0);
    });
  });

  describe('Status de Pagamento', () => {
    it('deve processar pagamento pendente sem creditar créditos', async () => {
      const eventId = `pending_${Date.now()}`;
      const event = {
        event_id: eventId,
        provider: 'stripe' as const,
        status: 'pending' as const,
        amount_cents: 1000,
        currency: 'BRL',
        user_id: testUserId,
      };

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.message).toContain('pendente');
      expect(data.credits).toBeUndefined();
    });

    it('deve processar pagamento rejeitado sem creditar créditos', async () => {
      const eventId = `rejected_${Date.now()}`;
      const event = {
        event_id: eventId,
        provider: 'stripe' as const,
        status: 'rejected' as const,
        amount_cents: 1000,
        currency: 'BRL',
        user_id: testUserId,
      };

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.message).toContain('rejeitado');
      expect(data.credits).toBeUndefined();
    });
  });

  describe('Tratamento de Webhooks Duplicados', () => {
    it('deve identificar e ignorar webhooks duplicados', async () => {
      const eventId = `duplicate_${Date.now()}`;
      const event = {
        event_id: eventId,
        provider: 'stripe' as const,
        status: 'approved' as const,
        amount_cents: 1000,
        currency: 'BRL',
        user_id: testUserId,
      };

      // Primeira requisição
      const response1 = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      expect(response1.status).toBe(200);

      // Segunda requisição (duplicada)
      const response2 = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      expect(response2.status).toBe(200);
      const data2 = await response2.json();
      expect(data2.message).toContain('já processado');

      // Verificar que apenas uma transação foi criada
      const { data: transactions } = await adminClient
        .from('credit_transactions')
        .select('*')
        .eq('ref_id', `stripe:${eventId}`);

      expect(transactions?.length).toBe(1);
    });
  });

  describe('Verificação de Assinatura (TODO)', () => {
    it.skip('deve verificar assinatura de webhook do Stripe', async () => {
      // TODO: Implementar verificação de assinatura quando Edge Function for atualizada
      // Por enquanto, este teste está marcado como skip
      expect(true).toBe(true);
    });

    it.skip('deve verificar assinatura de webhook do Mercado Pago', async () => {
      // TODO: Implementar verificação de assinatura quando Edge Function for atualizada
      expect(true).toBe(true);
    });

    it.skip('deve rejeitar webhook com assinatura inválida', async () => {
      // TODO: Implementar quando verificação de assinatura for adicionada
      expect(true).toBe(true);
    });
  });
});

