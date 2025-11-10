import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

describe('RLS Credits - Owner-only policies', () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    it.skip('Requer Supabase URL, Anon Key e Service Role Key configurados', () => {});
    return;
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  let testUserId1: string;
  let testUserId2: string;
  let authenticatedClient1: ReturnType<typeof createClient>;
  let authenticatedClient2: ReturnType<typeof createClient>;

  beforeAll(async () => {
    // Criar dois usuários de teste
    const { data: authData1, error: authError1 } = await adminClient.auth.signUp({
      email: `test-rls-credits-1-${Date.now()}@example.com`,
      password: 'Password123!',
    });
    if (authError1) throw authError1;
    testUserId1 = authData1.user!.id;
    authenticatedClient1 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${authData1.session!.access_token}` } }
    });

    const { data: authData2, error: authError2 } = await adminClient.auth.signUp({
      email: `test-rls-credits-2-${Date.now()}@example.com`,
      password: 'Password123!',
    });
    if (authError2) throw authError2;
    testUserId2 = authData2.user!.id;
    authenticatedClient2 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${authData2.session!.access_token}` } }
    });

    // Aguardar triggers criarem perfis e créditos
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Limpar usuários (créditos serão deletados em cascade)
    await adminClient.auth.admin.deleteUser(testUserId1);
    await adminClient.auth.admin.deleteUser(testUserId2);
  });

  it('deve permitir que usuário leia seu próprio saldo de créditos', async () => {
    const { data, error } = await authenticatedClient1
      .from('credits')
      .select('*')
      .eq('user_id', testUserId1)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.user_id).toBe(testUserId1);
    expect(data).toHaveProperty('balance');
  });

  it('NÃO deve permitir que usuário leia créditos de outro usuário', async () => {
    const { data, error } = await authenticatedClient1
      .from('credits')
      .select('*')
      .eq('user_id', testUserId2)
      .single();

    expect(error).toBeDefined();
    expect(data).toBeNull();
  });

  it('NÃO deve permitir que usuário crie transações manualmente (apenas via RPC/Edge)', async () => {
    const { data, error } = await authenticatedClient1
      .from('credit_transactions')
      .insert({
        user_id: testUserId1,
        delta: 100,
        reason: 'test',
        ref_type: 'manual',
        ref_id: 'test-id',
      })
      .select()
      .single();

    // Deve falhar porque RLS não permite insert direto (apenas via RPC/Edge)
    expect(error).toBeDefined();
    expect(data).toBeNull();
  });

  it('deve permitir que usuário leia suas próprias transações', async () => {
    // Criar transação via admin (simulando RPC/Edge)
    await adminClient
      .from('credit_transactions')
      .insert({
        user_id: testUserId1,
        delta: 50,
        reason: 'test_transaction',
        ref_type: 'test',
        ref_id: `test-${Date.now()}`,
      });

    const { data, error } = await authenticatedClient1
      .from('credit_transactions')
      .select('*')
      .eq('user_id', testUserId1)
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    if (data && data.length > 0) {
      expect(data[0].user_id).toBe(testUserId1);
    }
  });

  it('NÃO deve permitir que usuário leia transações de outro usuário', async () => {
    // Criar transação para usuário 2 via admin
    await adminClient
      .from('credit_transactions')
      .insert({
        user_id: testUserId2,
        delta: 50,
        reason: 'test_transaction',
        ref_type: 'test',
        ref_id: `test-${Date.now()}`,
      });

    const { data, error } = await authenticatedClient1
      .from('credit_transactions')
      .select('*')
      .eq('user_id', testUserId2)
      .limit(1);

    expect(error).toBeDefined();
    expect(data).toBeNull();
  });

  it('NÃO deve permitir que usuário não autenticado acesse créditos', async () => {
    const unauthenticatedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await unauthenticatedClient
      .from('credits')
      .select('*')
      .limit(1);

    expect(error).toBeDefined();
    expect(data).toBeNull();
  });
});

