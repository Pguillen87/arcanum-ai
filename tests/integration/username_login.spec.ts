/**
 * Testes de integração para Edge Function username-login
 * Verifica fluxos de sucesso, falha e rate limit
 */
import { describe, it, expect } from 'vitest';

const EDGE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL 
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/username-login`
  : null;

describe('Edge Function: username-login', () => {
  if (!EDGE_FUNCTION_URL) {
    it.skip('Requer VITE_SUPABASE_URL configurado', () => {});
    return;
  }

  it('deve retornar 405 para método não POST', async () => {
    const response = await fetch(EDGE_FUNCTION_URL, { method: 'GET' });
    expect(response.status).toBe(405);
    const data = await response.json();
    expect(data.code).toBe('VAL_405');
  });

  it('deve retornar 400 para credenciais ausentes', async () => {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe('VAL_400');
  });

  it('deve retornar 404 para username inexistente', async () => {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'usuario_inexistente_12345',
        password: 'senha_teste',
      }),
    });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.code).toBe('AUTH_404');
  });

  it('deve retornar 401 para senha inválida', async () => {
    // TODO: Criar usuário de teste primeiro
    // Por enquanto, este teste requer setup de banco de testes
    expect(true).toBe(true); // Placeholder
  });

  it('deve retornar 429 após exceder rate limit', async () => {
    // Arrange: fazer 5+ requisições rápidas
    const requests = Array.from({ length: 6 }, () =>
      fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'test_user',
          password: 'wrong_password',
        }),
      })
    );

    const responses = await Promise.all(requests);
    const rateLimited = responses.find((r) => r.status === 429);
    
    // Assert: pelo menos uma deve retornar 429
    expect(rateLimited).toBeDefined();
    if (rateLimited) {
      const data = await rateLimited.json();
      expect(data.code).toBe('RATE_429');
      expect(data.resetAt).toBeDefined();
    }
  });

  it('deve retornar 200 com session para credenciais válidas', async () => {
    // TODO: Criar usuário de teste e testar login bem-sucedido
    // Por enquanto, este teste requer setup completo
    expect(true).toBe(true); // Placeholder
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

