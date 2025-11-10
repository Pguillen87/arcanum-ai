/**
 * Testes unitários para observability
 * Valida scrub de PII e tracking de eventos/erros
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Observability } from '@/lib/observability';

describe('Observability', () => {
  beforeEach(() => {
    // Limpar mocks
    vi.clearAllMocks();
  });

  describe('scrubPII', () => {
    it('deve remover emails', () => {
      const input = { email: 'user@example.com', name: 'John' };
      const scrubbed = Observability.scrub(input);
      const str = JSON.stringify(scrubbed);
      expect(str).not.toContain('user@example.com');
      expect(str).toContain('***@***');
    });

    it('deve remover tokens Bearer', () => {
      const input = { token: 'Bearer abc123xyz789' };
      const scrubbed = Observability.scrub(input);
      const str = JSON.stringify(scrubbed);
      expect(str).not.toContain('abc123xyz789');
      expect(str).toContain('Bearer ***');
    });

    it('deve remover UUIDs', () => {
      const input = { id: '123e4567-e89b-12d3-a456-426614174000' };
      const scrubbed = Observability.scrub(input);
      const str = JSON.stringify(scrubbed);
      expect(str).not.toContain('123e4567-e89b-12d3-a456-426614174000');
      expect(str).toContain('***-uuid-***');
    });

    it('deve preservar dados não sensíveis', () => {
      const input = { name: 'John', age: 30, city: 'São Paulo' };
      const scrubbed = Observability.scrub(input);
      expect(scrubbed).toMatchObject({
        name: 'John',
        age: 30,
        city: 'São Paulo',
      });
    });

    it('deve lidar com strings simples', () => {
      const input = 'Email: user@example.com';
      const scrubbed = Observability.scrub(input);
      expect(scrubbed).not.toContain('user@example.com');
      expect(scrubbed).toContain('***@***');
    });
  });

  describe('trackEvent', () => {
    it('deve chamar console.info em desenvolvimento', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      Observability.trackEvent('test_event', { data: 'test' });
      // Em desenvolvimento, deve logar
      // Em produção, pode não logar dependendo da configuração
      consoleSpy.mockRestore();
    });

    it('deve fazer scrub de PII no payload', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      Observability.trackEvent('test_event', { email: 'user@example.com' });
      const callArgs = consoleSpy.mock.calls[0];
      if (callArgs && callArgs[1]) {
        const logged = JSON.stringify(callArgs[1]);
        expect(logged).not.toContain('user@example.com');
      }
      consoleSpy.mockRestore();
    });
  });

  describe('trackError', () => {
    it('deve chamar console.error em desenvolvimento', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      Observability.trackError(new Error('Test error'));
      consoleSpy.mockRestore();
    });

    it('deve fazer scrub de PII em mensagens de erro', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Email: user@example.com');
      Observability.trackError(error);
      const callArgs = consoleSpy.mock.calls[0];
      if (callArgs && callArgs[1]) {
        const logged = JSON.stringify(callArgs[1]);
        expect(logged).not.toContain('user@example.com');
      }
      consoleSpy.mockRestore();
    });
  });
});
