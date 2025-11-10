import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMysticalChat } from '@/hooks/useMysticalChat';
import { mysticalModules } from '@/data/mysticalModules';

describe('useMysticalChat', () => {
  beforeEach(() => {
    // Reset state between tests
    vi.clearAllMocks();
  });

  it('openChat atualiza estado corretamente', () => {
    const { result } = renderHook(() => useMysticalChat());

    act(() => {
      result.current.openChat('oracle');
    });

    expect(result.current.isChatOpen).toBe(true);
    expect(result.current.currentAgent?.id).toBe('oracle');
  });

  it('isChatOpen reflete estado', () => {
    const { result } = renderHook(() => useMysticalChat());

    expect(result.current.isChatOpen).toBe(false);

    act(() => {
      result.current.openChat('numerologist');
    });

    expect(result.current.isChatOpen).toBe(true);
  });

  it('currentAgent corresponde ao módulo', () => {
    const { result } = renderHook(() => useMysticalChat());

    act(() => {
      result.current.openChat('oracle');
    });

    expect(result.current.currentAgent).toEqual(
      mysticalModules.find((m) => m.id === 'oracle')
    );
  });

  it('fecha chat ao chamar openChat(null)', () => {
    const { result } = renderHook(() => useMysticalChat());

    act(() => {
      result.current.openChat('oracle');
    });

    expect(result.current.isChatOpen).toBe(true);

    act(() => {
      result.current.openChat(null);
    });

    expect(result.current.isChatOpen).toBe(false);
    expect(result.current.currentAgent).toBeNull();
  });

  it('closeChat fecha o chat', () => {
    const { result } = renderHook(() => useMysticalChat());

    act(() => {
      result.current.openChat('astrologer');
    });

    expect(result.current.isChatOpen).toBe(true);

    act(() => {
      result.current.closeChat();
    });

    expect(result.current.isChatOpen).toBe(false);
    expect(result.current.currentAgent).toBeNull();
  });

  describe('Edge Cases', () => {
    it('módulo inexistente retorna null graciosamente', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { result } = renderHook(() => useMysticalChat());

      act(() => {
        result.current.openChat('nonexistent-module');
      });

      expect(result.current.isChatOpen).toBe(true);
      expect(result.current.currentAgent).toBeNull();
      
      // Em desenvolvimento, deve logar warning
      if (import.meta.env.DEV) {
        expect(consoleSpy).toHaveBeenCalledWith('Module nonexistent-module not found');
      }
      
      consoleSpy.mockRestore();
    });

    it('múltiplas aberturas rápidas (última prevalece)', () => {
      const { result } = renderHook(() => useMysticalChat());

      act(() => {
        result.current.openChat('oracle');
        result.current.openChat('numerologist');
        result.current.openChat('astrologer');
      });

      expect(result.current.currentAgent?.id).toBe('astrologer');
    });
  });

  describe('Otimização com useMemo', () => {
    it('currentAgent não recalcula desnecessariamente', () => {
      const { result, rerender } = renderHook(() => useMysticalChat());

      act(() => {
        result.current.openChat('oracle');
      });

      const firstAgent = result.current.currentAgent;

      // Re-render sem mudanças
      rerender();

      // currentAgent deve ser a mesma referência (useMemo)
      expect(result.current.currentAgent).toBe(firstAgent);
    });

    it('currentAgent recalcula quando currentModuleId muda', () => {
      const { result } = renderHook(() => useMysticalChat());

      act(() => {
        result.current.openChat('oracle');
      });

      const firstAgent = result.current.currentAgent;

      act(() => {
        result.current.openChat('numerologist');
      });

      // Deve ser diferente agora
      expect(result.current.currentAgent).not.toBe(firstAgent);
      expect(result.current.currentAgent?.id).toBe('numerologist');
    });
  });

  describe('Warning em Desenvolvimento', () => {
    it('log warning apenas em desenvolvimento', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const originalEnv = import.meta.env.DEV;
      
      // Mock DEV = true
      Object.defineProperty(import.meta, 'env', {
        value: { ...import.meta.env, DEV: true },
        writable: true,
      });

      const { result } = renderHook(() => useMysticalChat());

      act(() => {
        result.current.openChat('nonexistent');
      });

      expect(consoleSpy).toHaveBeenCalled();
      
      // Restore
      Object.defineProperty(import.meta, 'env', {
        value: { ...import.meta.env, DEV: originalEnv },
        writable: true,
      });
      consoleSpy.mockRestore();
    });
  });
});

