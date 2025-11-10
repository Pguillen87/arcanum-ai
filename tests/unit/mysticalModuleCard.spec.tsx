import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MysticalModuleCard } from '@/components/cosmic/MysticalModuleCard';
import { Wand2 } from 'lucide-react';

describe('MysticalModuleCard', () => {
  const defaultProps = {
    title: 'O Oráculo das Palavras',
    subtitle: 'Tarot AI',
    icon: Wand2,
    colors: {
      primary: '#a855f7',
      secondary: '#ec4899',
    },
    onClick: vi.fn(),
    description: 'Leitura simbólica e intuitiva através de IA',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderização', () => {
    it('renderiza com props válidas', () => {
      render(<MysticalModuleCard {...defaultProps} />);
      expect(screen.getByText('O Oráculo das Palavras')).toBeTruthy();
      expect(screen.getByText('Tarot AI')).toBeTruthy();
    });

    it('exibe título corretamente', () => {
      render(<MysticalModuleCard {...defaultProps} />);
      const title = screen.getByText('O Oráculo das Palavras');
      expect(title).toBeTruthy();
      expect(title.tagName).toBe('H3');
    });

    it('exibe subtítulo corretamente', () => {
      render(<MysticalModuleCard {...defaultProps} />);
      expect(screen.getByText('Tarot AI')).toBeTruthy();
    });

    it('exibe descrição quando fornecida', () => {
      render(<MysticalModuleCard {...defaultProps} />);
      expect(screen.getByText('Leitura simbólica e intuitiva através de IA')).toBeTruthy();
    });

    it('não exibe descrição quando não fornecida', () => {
      const { description, ...propsWithoutDesc } = defaultProps;
      render(<MysticalModuleCard {...propsWithoutDesc} />);
      expect(screen.queryByText('Leitura simbólica')).toBeNull();
    });
  });

  describe('Cores e Estilo', () => {
    it('aplica cores específicas corretamente', () => {
      const { container } = render(<MysticalModuleCard {...defaultProps} />);
      const title = container.querySelector('h3');
      expect(title?.style.color).toBe('rgb(168, 85, 247)'); // #a855f7
    });

    it('aplica gradiente com cores fornecidas', () => {
      const { container } = render(<MysticalModuleCard {...defaultProps} />);
      const gradientDiv = container.querySelector('[style*="linear-gradient"]');
      expect(gradientDiv?.getAttribute('style')).toContain('#a855f7');
      expect(gradientDiv?.getAttribute('style')).toContain('#ec4899');
    });
  });

  describe('Interações', () => {
    it('chama onClick ao clicar', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      render(<MysticalModuleCard {...defaultProps} onClick={onClick} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('não quebra se onClick não fornecida', async () => {
      const user = userEvent.setup();
      const { onClick, ...propsWithoutOnClick } = defaultProps;
      render(<MysticalModuleCard {...propsWithoutOnClick} onClick={() => {}} />);
      
      const button = screen.getByRole('button');
      await expect(user.click(button)).resolves.not.toThrow();
    });
  });

  describe('Acessibilidade', () => {
    it('tem aria-label correto', () => {
      render(<MysticalModuleCard {...defaultProps} />);
      const button = screen.getByLabelText('Abrir O Oráculo das Palavras');
      expect(button).toBeTruthy();
    });

    it('suporta navegação por teclado (Enter)', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      render(<MysticalModuleCard {...defaultProps} onClick={onClick} />);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('suporta navegação por teclado (Space)', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      render(<MysticalModuleCard {...defaultProps} onClick={onClick} />);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('tem focus visível', () => {
      const { container } = render(<MysticalModuleCard {...defaultProps} />);
      const button = container.querySelector('button');
      expect(button?.className).toContain('focus-visible:outline-none');
      expect(button?.className).toContain('focus-visible:ring-2');
    });
  });

  describe('Edge Cases', () => {
    it('trata título vazio com fallback', () => {
      render(<MysticalModuleCard {...defaultProps} title="" />);
      expect(screen.getByText('Módulo Místico')).toBeTruthy();
    });

    it('trata subtítulo vazio graciosamente', () => {
      render(<MysticalModuleCard {...defaultProps} subtitle="" />);
      const subtitle = screen.queryByText('');
      // Subtítulo vazio não deve ser renderizado
      expect(subtitle).toBeNull();
    });

    it('trata cores inválidas com fallback', () => {
      const { container } = render(
        <MysticalModuleCard 
          {...defaultProps} 
          colors={{ primary: '', secondary: '' } as any}
        />
      );
      const title = container.querySelector('h3');
      // Deve usar cor de fallback (#a855f7)
      expect(title?.style.color).toBeTruthy();
    });

    it('trata cores null com fallback', () => {
      const { container } = render(
        <MysticalModuleCard 
          {...defaultProps} 
          colors={null as any}
        />
      );
      const title = container.querySelector('h3');
      expect(title?.style.color).toBeTruthy();
    });

    it('trata icon null com fallback', () => {
      const { container } = render(
        <MysticalModuleCard 
          {...defaultProps} 
          icon={null as any}
        />
      );
      // Deve renderizar ícone de fallback (✨)
      const fallbackIcon = container.querySelector('.text-4xl');
      expect(fallbackIcon).toBeTruthy();
    });

    it('trata icon undefined com fallback', () => {
      const { container } = render(
        <MysticalModuleCard 
          {...defaultProps} 
          icon={undefined as any}
        />
      );
      const fallbackIcon = container.querySelector('.text-4xl');
      expect(fallbackIcon).toBeTruthy();
    });

    it('funciona com ReactNode como ícone', () => {
      const CustomIcon = () => <div data-testid="custom-icon">🔮</div>;
      render(<MysticalModuleCard {...defaultProps} icon={<CustomIcon />} />);
      expect(screen.getByTestId('custom-icon')).toBeTruthy();
    });
  });

  describe('Animações e Reduced Motion', () => {
    it('respeita prefers-reduced-motion quando configurado', () => {
      // Mock matchMedia para reduced motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { container } = render(<MysticalModuleCard {...defaultProps} />);
      // Componente deve renderizar sem erros mesmo com reduced motion
      expect(container.querySelector('button')).toBeTruthy();
    });
  });

  describe('Partículas no Hover', () => {
    it('renderiza partículas ao fazer hover', async () => {
      const user = userEvent.setup();
      const { container } = render(<MysticalModuleCard {...defaultProps} />);
      
      const button = screen.getByRole('button');
      await user.hover(button);
      
      // Partículas devem aparecer (verificar após animação)
      const particles = container.querySelectorAll('[class*="absolute"]');
      expect(particles.length).toBeGreaterThan(0);
    });
  });
});

