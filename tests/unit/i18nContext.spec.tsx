import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider, useI18n } from '@/contexts/I18nContext';

// Componente de teste que usa o hook
const TestComponent = () => {
  const { locale, setLocale } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <button onClick={() => setLocale('en')}>Set English</button>
      <button onClick={() => setLocale('pt-BR')}>Set Portuguese</button>
    </div>
  );
};

describe('I18nContext - Persistência de Idioma', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('salva locale no localStorage ao mudar', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    const setEnglishButton = screen.getByText('Set English');
    await user.click(setEnglishButton);

    await waitFor(() => {
      expect(localStorage.getItem('locale')).toBe('en');
    });
  });

  it('carrega locale salvo ao inicializar', () => {
    localStorage.setItem('locale', 'en');
    
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    expect(screen.getByTestId('locale').textContent).toBe('en');
  });

  it('fallback para pt-BR se não houver salvo', () => {
    localStorage.removeItem('locale');
    
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    // Deve usar pt-BR como padrão ou detectar do navigator
    const locale = screen.getByTestId('locale').textContent;
    expect(['pt-BR', 'en']).toContain(locale);
  });

  describe('Edge Cases', () => {
    it('funciona quando localStorage está indisponível (SSR)', () => {
      // Simula localStorage indisponível
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = vi.fn(() => {
        throw new Error('localStorage not available');
      });

      // Não deve quebrar
      expect(() => {
        render(
          <I18nProvider>
            <TestComponent />
          </I18nProvider>
        );
      }).not.toThrow();

      // Restaura
      Storage.prototype.getItem = originalGetItem;
    });

    it('trata valor inválido no localStorage', () => {
      localStorage.setItem('locale', 'invalid-locale');
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      // Deve usar fallback
      const locale = screen.getByTestId('locale').textContent;
      expect(['pt-BR', 'en']).toContain(locale);
    });

    it('persiste mudanças corretamente', async () => {
      const user = userEvent.setup();
      localStorage.setItem('locale', 'pt-BR');
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('locale').textContent).toBe('pt-BR');

      await user.click(screen.getByText('Set English'));
      
      await waitFor(() => {
        expect(localStorage.getItem('locale')).toBe('en');
        expect(screen.getByTestId('locale').textContent).toBe('en');
      });
    });

    it('múltiplas mudanças atualizam localStorage', async () => {
      const user = userEvent.setup();
      
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await user.click(screen.getByText('Set English'));
      await waitFor(() => {
        expect(localStorage.getItem('locale')).toBe('en');
      });

      await user.click(screen.getByText('Set Portuguese'));
      await waitFor(() => {
        expect(localStorage.getItem('locale')).toBe('pt-BR');
      });
    });
  });
});

