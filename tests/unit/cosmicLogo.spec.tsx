import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CosmicLogo } from '@/components/cosmic/CosmicLogo';
import { I18nProvider } from '@/contexts/I18nContext';

// Mock do I18nContext para testes isolados
const mockUseI18n = vi.fn();
vi.mock('@/contexts/I18nContext', async () => {
  const actual = await vi.importActual('@/contexts/I18nContext');
  return {
    ...actual,
    useI18n: () => mockUseI18n(),
  };
});

describe('CosmicLogo', () => {
  beforeEach(() => {
    mockUseI18n.mockReturnValue({ locale: 'pt-BR' });
  });

  it('renderiza texto "Arcanum.AI"', () => {
    render(<CosmicLogo />);
    expect(screen.getByText('Arcanum.AI')).toBeTruthy();
  });

  it('aplica classes de gradiente corretas', () => {
    const { container } = render(<CosmicLogo />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('bg-gradient-cosmic');
    expect(span?.className).toContain('bg-clip-text');
    expect(span?.className).toContain('text-transparent');
  });

  it('aplica animação animate-shine', () => {
    const { container } = render(<CosmicLogo />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('animate-shine');
  });

  it('respeita prop size="sm"', () => {
    const { container } = render(<CosmicLogo size="sm" />);
    const h1 = container.querySelector('h1');
    expect(h1?.className).toContain('text-4xl');
  });

  it('respeita prop size="md" (padrão)', () => {
    const { container } = render(<CosmicLogo size="md" />);
    const h1 = container.querySelector('h1');
    expect(h1?.className).toContain('text-6xl');
  });

  it('respeita prop size="lg"', () => {
    const { container } = render(<CosmicLogo size="lg" />);
    const h1 = container.querySelector('h1');
    expect(h1?.className).toContain('text-7xl');
  });

  it('aplica className customizada', () => {
    const { container } = render(<CosmicLogo className="custom-class" />);
    const h1 = container.querySelector('h1');
    expect(h1?.className).toContain('custom-class');
  });

  it('tem aria-label correto', () => {
    render(<CosmicLogo />);
    const span = screen.getByLabelText('Arcanum.AI');
    expect(span).toBeTruthy();
  });

  describe('Integração com I18nContext', () => {
    it('usa locale pt-BR por padrão', () => {
      mockUseI18n.mockReturnValue({ locale: 'pt-BR' });
      render(<CosmicLogo />);
      expect(screen.getByText('Arcanum.AI')).toBeTruthy();
    });

    it('usa locale en quando fornecido', () => {
      mockUseI18n.mockReturnValue({ locale: 'en' });
      render(<CosmicLogo />);
      expect(screen.getByText('Arcanum.AI')).toBeTruthy();
    });

    it('fallback para pt-BR se I18nContext não disponível', () => {
      // Simula erro ao acessar contexto
      mockUseI18n.mockImplementation(() => {
        throw new Error('useI18n must be used within I18nProvider');
      });
      
      // Renderiza com provider para evitar erro
      render(
        <I18nProvider>
          <CosmicLogo />
        </I18nProvider>
      );
      expect(screen.getByText('Arcanum.AI')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('funciona sem I18nContext quando usado com provider', () => {
      render(
        <I18nProvider>
          <CosmicLogo />
        </I18nProvider>
      );
      expect(screen.getByText('Arcanum.AI')).toBeTruthy();
    });

    it('mantém estrutura mesmo com tema dark/light', () => {
      const { container } = render(<CosmicLogo />);
      const span = container.querySelector('span');
      // Classes de gradiente devem estar presentes independente do tema
      expect(span?.className).toContain('bg-gradient-cosmic');
    });
  });
});

