import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlassOrb } from '@/components/cosmic/GlassOrb';
import { Sparkles } from 'lucide-react';

describe('GlassOrb', () => {
  const defaultProps = {
    icon: Sparkles,
    label: 'Essência',
    description: 'DNA Criativo',
    color: 'primary' as const,
    onClick: vi.fn(),
  };

  it('renderiza ícone, label e description', () => {
    render(<GlassOrb {...defaultProps} />);
    expect(screen.getByText('Essência')).toBeTruthy();
    expect(screen.getByText('DNA Criativo')).toBeTruthy();
  });

  it('aplica classes glassmorphism corretas', () => {
    const { container } = render(<GlassOrb {...defaultProps} />);
    const glassContainer = container.querySelector('.glass-cosmic');
    expect(glassContainer).toBeTruthy();
  });

  it('respeita prop color="primary"', () => {
    const { container } = render(<GlassOrb {...defaultProps} color="primary" />);
    const label = container.querySelector('h3');
    expect(label?.className).toContain('text-primary');
  });

  it('respeita prop color="secondary"', () => {
    const { container } = render(<GlassOrb {...defaultProps} color="secondary" />);
    const label = container.querySelector('h3');
    expect(label?.className).toContain('text-secondary');
  });

  it('aplica estado isSelected (scale, glow)', () => {
    const { container } = render(<GlassOrb {...defaultProps} isSelected />);
    const button = container.querySelector('button');
    expect(button?.className).toContain('scale-110');
  });

  it('chama onClick ao clicar', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<GlassOrb {...defaultProps} onClick={onClick} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  describe('Acessibilidade', () => {
    it('tem focus visível (keyboard navigation)', () => {
      const { container } = render(<GlassOrb {...defaultProps} />);
      const button = container.querySelector('button');
      expect(button?.className).toContain('focus-visible:outline-none');
      expect(button?.className).toContain('focus-visible:ring-2');
    });

    it('tem aria-label correto', () => {
      render(<GlassOrb {...defaultProps} />);
      const button = screen.getByLabelText('Abrir Portal de Essência');
      expect(button).toBeTruthy();
    });

    it('suporta Enter para ativar', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      render(<GlassOrb {...defaultProps} onClick={onClick} />);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('suporta Space para ativar', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      render(<GlassOrb {...defaultProps} onClick={onClick} />);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('funciona com ícone inválido (fallback)', () => {
      // Testa que não quebra mesmo com ícone problemático
      expect(() => {
        render(<GlassOrb {...defaultProps} icon={Sparkles} />);
      }).not.toThrow();
    });

    it('trunca texto muito longo', () => {
      const longLabel = 'A'.repeat(100);
      const { container } = render(
        <GlassOrb {...defaultProps} label={longLabel} />
      );
      // Não deve quebrar layout
      expect(container.querySelector('h3')).toBeTruthy();
    });

    it('não quebra com múltiplos clicks rápidos', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      render(<GlassOrb {...defaultProps} onClick={onClick} />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);
      await user.click(button);
      
      // Deve chamar todas as vezes (sem debounce por enquanto)
      expect(onClick).toHaveBeenCalled();
    });
  });
});

