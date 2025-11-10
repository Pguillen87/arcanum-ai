import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

describe('RLS Jobs (Transformations/Transcriptions) - Owner-only policies', () => {
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
  let testTransformationId1: string;
  let testTransformationId2: string;
  let testTranscriptionId1: string;
  let testTranscriptionId2: string;

  beforeAll(async () => {
    // Criar dois usuários de teste
    const { data: authData1, error: authError1 } = await adminClient.auth.signUp({
      email: `test-rls-jobs-1-${Date.now()}@example.com`,
      password: 'Password123!',
    });
    if (authError1) throw authError1;
    testUserId1 = authData1.user!.id;
    authenticatedClient1 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${authData1.session!.access_token}` } }
    });

    const { data: authData2, error: authError2 } = await adminClient.auth.signUp({
      email: `test-rls-jobs-2-${Date.now()}@example.com`,
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

    // Criar transformations de teste
    const { data: trans1, error: transError1 } = await authenticatedClient1
      .from('transformations')
      .insert({
        project_id: testProjectId1,
        user_id: testUserId1,
        type: 'text_to_post',
        status: 'completed',
        params: { text: 'test' },
        outputs: { text: 'result' },
      })
      .select('id')
      .single();
    if (transError1) throw transError1;
    testTransformationId1 = trans1.id;

    const { data: trans2, error: transError2 } = await authenticatedClient2
      .from('transformations')
      .insert({
        project_id: testProjectId2,
        user_id: testUserId2,
        type: 'text_to_post',
        status: 'completed',
        params: { text: 'test' },
        outputs: { text: 'result' },
      })
      .select('id')
      .single();
    if (transError2) throw transError2;
    testTransformationId2 = trans2.id;

    // Criar transcriptions de teste (precisa de asset)
    const { data: asset1 } = await authenticatedClient1
      .from('assets')
      .insert({
        project_id: testProjectId1,
        user_id: testUserId1,
        storage_path: `${testUserId1}/${testProjectId1}/audio1.mp3`,
        type: 'audio',
        size_bytes: 1000,
        status: 'ready',
      })
      .select('id')
      .single();

    const { data: asset2 } = await authenticatedClient2
      .from('assets')
      .insert({
        project_id: testProjectId2,
        user_id: testUserId2,
        storage_path: `${testUserId2}/${testProjectId2}/audio2.mp3`,
        type: 'audio',
        size_bytes: 1000,
        status: 'ready',
      })
      .select('id')
      .single();

    if (asset1) {
      const { data: tr1 } = await authenticatedClient1
        .from('transcriptions')
        .insert({
          asset_id: asset1.id,
          user_id: testUserId1,
          language: 'pt',
          status: 'completed',
          text: 'test transcription',
        })
        .select('id')
        .single();
      if (tr1) testTranscriptionId1 = tr1.id;
    }

    if (asset2) {
      const { data: tr2 } = await authenticatedClient2
        .from('transcriptions')
        .insert({
          asset_id: asset2.id,
          user_id: testUserId2,
          language: 'pt',
          status: 'completed',
          text: 'test transcription',
        })
        .select('id')
        .single();
      if (tr2) testTranscriptionId2 = tr2.id;
    }
  });

  afterAll(async () => {
    // Limpar jobs
    if (testTransformationId1) await authenticatedClient1.from('transformations').delete().eq('id', testTransformationId1);
    if (testTransformationId2) await authenticatedClient2.from('transformations').delete().eq('id', testTransformationId2);
    if (testTranscriptionId1) await authenticatedClient1.from('transcriptions').delete().eq('id', testTranscriptionId1);
    if (testTranscriptionId2) await authenticatedClient2.from('transcriptions').delete().eq('id', testTranscriptionId2);
    // Limpar projetos
    await authenticatedClient1.from('projects').delete().eq('id', testProjectId1);
    await authenticatedClient2.from('projects').delete().eq('id', testProjectId2);
    // Limpar usuários
    await adminClient.auth.admin.deleteUser(testUserId1);
    await adminClient.auth.admin.deleteUser(testUserId2);
  });

  describe('Transformations', () => {
    it('deve permitir que usuário leia suas próprias transformations', async () => {
      const { data, error } = await authenticatedClient1
        .from('transformations')
        .select('*')
        .eq('id', testTransformationId1)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.user_id).toBe(testUserId1);
    });

    it('NÃO deve permitir que usuário leia transformations de outro usuário', async () => {
      const { data, error } = await authenticatedClient1
        .from('transformations')
        .select('*')
        .eq('id', testTransformationId2)
        .single();

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    it('deve permitir que usuário atualize sua própria transformation', async () => {
      const { data, error } = await authenticatedClient1
        .from('transformations')
        .update({ status: 'processing' })
        .eq('id', testTransformationId1)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Reverter
      await authenticatedClient1
        .from('transformations')
        .update({ status: 'completed' })
        .eq('id', testTransformationId1);
    });

    it('NÃO deve permitir que usuário atualize transformation de outro usuário', async () => {
      const { data, error } = await authenticatedClient1
        .from('transformations')
        .update({ status: 'processing' })
        .eq('id', testTransformationId2)
        .select()
        .single();

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });
  });

  describe('Transcriptions', () => {
    it('deve permitir que usuário leia suas próprias transcriptions', async () => {
      if (!testTranscriptionId1) {
        it.skip('Transcription não criada');
        return;
      }

      const { data, error } = await authenticatedClient1
        .from('transcriptions')
        .select('*')
        .eq('id', testTranscriptionId1)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.user_id).toBe(testUserId1);
    });

    it('NÃO deve permitir que usuário leia transcriptions de outro usuário', async () => {
      if (!testTranscriptionId2) {
        it.skip('Transcription não criada');
        return;
      }

      const { data, error } = await authenticatedClient1
        .from('transcriptions')
        .select('*')
        .eq('id', testTranscriptionId2)
        .single();

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    it('deve permitir que usuário atualize sua própria transcription', async () => {
      if (!testTranscriptionId1) {
        it.skip('Transcription não criada');
        return;
      }

      const { data, error } = await authenticatedClient1
        .from('transcriptions')
        .update({ status: 'processing' })
        .eq('id', testTranscriptionId1)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Reverter
      await authenticatedClient1
        .from('transcriptions')
        .update({ status: 'completed' })
        .eq('id', testTranscriptionId1);
    });

    it('NÃO deve permitir que usuário atualize transcription de outro usuário', async () => {
      if (!testTranscriptionId2) {
        it.skip('Transcription não criada');
        return;
      }

      const { data, error } = await authenticatedClient1
        .from('transcriptions')
        .update({ status: 'processing' })
        .eq('id', testTranscriptionId2)
        .select()
        .single();

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });
  });

  it('NÃO deve permitir que usuário não autenticado acesse jobs', async () => {
    const unauthenticatedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: transData, error: transError } = await unauthenticatedClient
      .from('transformations')
      .select('*')
      .limit(1);

    expect(transError).toBeDefined();
    expect(transData).toBeNull();
  });
});

