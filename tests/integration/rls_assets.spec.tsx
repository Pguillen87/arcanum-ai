import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

describe('RLS Assets - Owner-only policies', () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    it.skip('Requer Supabase URL, Anon Key e Service Role Key configurados', () => {});
    return;
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  let testUserId1: string;
  let testUserId2: string;
  let authenticatedClient1: ReturnType<typeof createClient>;
  let authenticatedClient2: ReturnType<typeof createClient>;
  let testProjectId1: string;
  let testProjectId2: string;
  let testAssetId1: string;
  let testAssetId2: string;

  beforeAll(async () => {
    // Criar dois usuários de teste
    const { data: authData1, error: authError1 } = await adminClient.auth.signUp({
      email: `test-rls-assets-1-${Date.now()}@example.com`,
      password: 'Password123!',
    });
    if (authError1) throw authError1;
    testUserId1 = authData1.user!.id;
    authenticatedClient1 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${authData1.session!.access_token}` } }
    });

    const { data: authData2, error: authError2 } = await adminClient.auth.signUp({
      email: `test-rls-assets-2-${Date.now()}@example.com`,
      password: 'Password123!',
    });
    if (authError2) throw authError2;
    testUserId2 = authData2.user!.id;
    authenticatedClient2 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${authData2.session!.access_token}` } }
    });

    // Aguardar triggers criarem perfis
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Criar projetos de teste
    const { data: project1, error: projectError1 } = await authenticatedClient1
      .from('projects')
      .insert({ user_id: testUserId1, name: 'Project 1' })
      .select('id')
      .single();
    if (projectError1) throw projectError1;
    testProjectId1 = project1.id;

    const { data: project2, error: projectError2 } = await authenticatedClient2
      .from('projects')
      .insert({ user_id: testUserId2, name: 'Project 2' })
      .select('id')
      .single();
    if (projectError2) throw projectError2;
    testProjectId2 = project2.id;

    // Criar assets de teste
    const { data: asset1, error: assetError1 } = await authenticatedClient1
      .from('assets')
      .insert({
        project_id: testProjectId1,
        user_id: testUserId1,
        storage_path: `${testUserId1}/${testProjectId1}/test1.txt`,
        type: 'text',
        size_bytes: 100,
        status: 'ready',
      })
      .select('id')
      .single();
    if (assetError1) throw assetError1;
    testAssetId1 = asset1.id;

    const { data: asset2, error: assetError2 } = await authenticatedClient2
      .from('assets')
      .insert({
        project_id: testProjectId2,
        user_id: testUserId2,
        storage_path: `${testUserId2}/${testProjectId2}/test2.txt`,
        type: 'text',
        size_bytes: 100,
        status: 'ready',
      })
      .select('id')
      .single();
    if (assetError2) throw assetError2;
    testAssetId2 = asset2.id;
  });

  afterAll(async () => {
    // Limpar assets
    await authenticatedClient1.from('assets').delete().eq('id', testAssetId1);
    await authenticatedClient2.from('assets').delete().eq('id', testAssetId2);
    // Limpar projetos
    await authenticatedClient1.from('projects').delete().eq('id', testProjectId1);
    await authenticatedClient2.from('projects').delete().eq('id', testProjectId2);
    // Limpar usuários
    await adminClient.auth.admin.deleteUser(testUserId1);
    await adminClient.auth.admin.deleteUser(testUserId2);
  });

  it('deve permitir que usuário crie seu próprio asset', async () => {
    const { data, error } = await authenticatedClient1
      .from('assets')
      .insert({
        project_id: testProjectId1,
        user_id: testUserId1,
        storage_path: `${testUserId1}/${testProjectId1}/new.txt`,
        type: 'text',
        size_bytes: 50,
        status: 'ready',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.user_id).toBe(testUserId1);

    // Limpar
    if (data) await authenticatedClient1.from('assets').delete().eq('id', data.id);
  });

  it('deve permitir que usuário leia seus próprios assets', async () => {
    const { data, error } = await authenticatedClient1
      .from('assets')
      .select('*')
      .eq('id', testAssetId1)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.id).toBe(testAssetId1);
    expect(data?.user_id).toBe(testUserId1);
  });

  it('NÃO deve permitir que usuário leia assets de outro usuário', async () => {
    const { data, error } = await authenticatedClient1
      .from('assets')
      .select('*')
      .eq('id', testAssetId2)
      .single();

    expect(error).toBeDefined();
    expect(data).toBeNull();
  });

  it('deve permitir que usuário atualize seu próprio asset', async () => {
    const { data, error } = await authenticatedClient1
      .from('assets')
      .update({ status: 'processing' })
      .eq('id', testAssetId1)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.status).toBe('processing');

    // Reverter
    await authenticatedClient1
      .from('assets')
      .update({ status: 'ready' })
      .eq('id', testAssetId1);
  });

  it('NÃO deve permitir que usuário atualize asset de outro usuário', async () => {
    const { data, error } = await authenticatedClient1
      .from('assets')
      .update({ status: 'processing' })
      .eq('id', testAssetId2)
      .select()
      .single();

    expect(error).toBeDefined();
    expect(data).toBeNull();
  });

  it('deve permitir que usuário delete seu próprio asset', async () => {
    const { data: created } = await authenticatedClient1
      .from('assets')
      .insert({
        project_id: testProjectId1,
        user_id: testUserId1,
        storage_path: `${testUserId1}/${testProjectId1}/to-delete.txt`,
        type: 'text',
        size_bytes: 50,
        status: 'ready',
      })
      .select('id')
      .single();

    const { error } = await authenticatedClient1
      .from('assets')
      .delete()
      .eq('id', created.id);

    expect(error).toBeNull();
  });

  it('NÃO deve permitir que usuário delete asset de outro usuário', async () => {
    const { error } = await authenticatedClient1
      .from('assets')
      .delete()
      .eq('id', testAssetId2);

    expect(error).toBeDefined();
  });

  it('NÃO deve permitir que usuário não autenticado acesse assets', async () => {
    const unauthenticatedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await unauthenticatedClient
      .from('assets')
      .select('*')
      .limit(1);

    expect(error).toBeDefined();
    expect(data).toBeNull();
  });
});

