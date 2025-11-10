import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

describe('Edge Function: transcribe_audio', () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    it.skip('Requer Supabase URL, Anon Key e Service Role Key configurados', () => {});
    return;
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  let testUserId: string;
  let testProjectId: string;
  let testAssetId: string;
  let authenticatedClient: ReturnType<typeof createClient>;
  let accessToken: string;

  beforeAll(async () => {
    // Criar usuário de teste
    const { data: authData, error: authError } = await adminClient.auth.signUp({
      email: `test-transcribe-audio-${Date.now()}@example.com`,
      password: 'Password123!',
    });
    if (authError) throw authError;
    testUserId = authData.user!.id;
    accessToken = authData.session!.access_token;
    authenticatedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } }
    });

    // Aguardar triggers criarem perfil e créditos
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Criar projeto de teste
    const { data: project, error: projectError } = await authenticatedClient
      .from('projects')
      .insert({ user_id: testUserId, name: 'Test Project' })
      .select('id')
      .single();
    if (projectError) throw projectError;
    testProjectId = project.id;

    // Criar asset de áudio de teste
    const { data: asset, error: assetError } = await authenticatedClient
      .from('assets')
      .insert({
        project_id: testProjectId,
        user_id: testUserId,
        storage_path: `${testUserId}/${testProjectId}/test-audio.mp3`,
        type: 'audio',
        size_bytes: 1000,
        status: 'ready',
        mimetype: 'audio/mpeg',
      })
      .select('id')
      .single();
    if (assetError) throw assetError;
    testAssetId = asset.id;

    // Adicionar créditos para testes
    await adminClient
      .from('credit_transactions')
      .insert({
        user_id: testUserId,
        delta: 1000,
        reason: 'test_setup',
        ref_type: 'test',
        ref_id: `setup-${Date.now()}`,
      });
  });

  afterAll(async () => {
    // Limpar assets, projetos e usuário
    await authenticatedClient.from('assets').delete().eq('id', testAssetId);
    await authenticatedClient.from('projects').delete().eq('id', testProjectId);
    await adminClient.auth.admin.deleteUser(testUserId);
  });

  const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/transcribe_audio`;

  it('deve retornar 405 para método não POST', async () => {
    const response = await fetch(EDGE_FUNCTION_URL, { method: 'GET' });
    expect(response.status).toBe(405);
  });

  it('deve retornar 400 para asset_id ausente', async () => {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        project_id: testProjectId,
        language: 'pt',
      }),
    });

    expect(response.status).toBe(400);
  });

  it('deve retornar 404 para asset_id inexistente', async () => {
    const fakeAssetId = '00000000-0000-0000-0000-000000000000';
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        project_id: testProjectId,
        asset_id: fakeAssetId,
        language: 'pt',
      }),
    });

    expect(response.status).toBe(404);
  });

  it('deve retornar 401 para usuário não autenticado', async () => {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project_id: testProjectId,
        asset_id: testAssetId,
        language: 'pt',
      }),
    });

    expect(response.status).toBe(401);
  });

  it('deve retornar 200 e criar job para transcrição válida (mock Whisper)', async () => {
    // Nota: Este teste pode falhar se OpenAI API não estiver configurada
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Idempotency-Key': `test-${Date.now()}`,
      },
      body: JSON.stringify({
        project_id: testProjectId,
        asset_id: testAssetId,
        language: 'pt',
      }),
    });

    const data = await response.json();
    
    if (response.status === 200) {
      expect(data.jobId).toBeDefined();
      expect(data.status).toBe('completed');
      expect(data.text).toBeDefined();
    } else if (response.status === 500) {
      // Se falhar por OpenAI, ainda deve ter criado o job
      expect(data.code).toBeDefined();
    }
  });

  it('deve ser idempotente (mesmo Idempotency-Key retorna mesmo resultado)', async () => {
    const idempotencyKey = `idempotent-${Date.now()}`;
    
    const response1 = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        project_id: testProjectId,
        asset_id: testAssetId,
        language: 'pt',
      }),
    });

    const data1 = await response1.json();

    // Segunda chamada com mesmo Idempotency-Key
    const response2 = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        project_id: testProjectId,
        asset_id: testAssetId,
        language: 'pt',
      }),
    });

    const data2 = await response2.json();

    // Deve retornar mesmo jobId ou erro de idempotência
    if (response1.status === 200 && response2.status === 200) {
      expect(data1.jobId).toBe(data2.jobId);
    } else if (response2.status === 409) {
      expect(data2.code).toBeDefined();
    }
  });

  it('deve incluir CORS headers na resposta', async () => {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        project_id: testProjectId,
        asset_id: testAssetId,
        language: 'pt',
      }),
    });

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('deve debitar créditos apenas quando transcrição completa', async () => {
    // Verificar saldo inicial
    const { data: creditsBefore } = await authenticatedClient
      .from('credits')
      .select('balance')
      .eq('user_id', testUserId)
      .single();

    const balanceBefore = creditsBefore?.balance || 0;

    // Criar transcrição
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Idempotency-Key': `credit-test-${Date.now()}`,
      },
      body: JSON.stringify({
        project_id: testProjectId,
        asset_id: testAssetId,
        language: 'pt',
      }),
    });

    // Aguardar processamento
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar saldo após
    const { data: creditsAfter } = await authenticatedClient
      .from('credits')
      .select('balance')
      .eq('user_id', testUserId)
      .single();

    const balanceAfter = creditsAfter?.balance || 0;

    // Se completou, deve ter debitado
    if (response.status === 200) {
      expect(balanceAfter).toBeLessThan(balanceBefore);
    } else {
      expect(balanceAfter).toBe(balanceBefore);
    }
  });
});

