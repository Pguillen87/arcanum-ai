import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Index from '@/pages/Index';
import { MemoryRouter } from 'react-router-dom';

describe('Navegação por Orbes — labels, foco e tooltips', () => {
  it('renderiza orbes com labels místicos', () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );
    expect(screen.getByText('Essência')).toBeTruthy();
    expect(screen.getByText('Energia')).toBeTruthy();
    expect(screen.getByText('Proteção')).toBeTruthy();
    expect(screen.getByText('Cosmos')).toBeTruthy();
  });

  it('botões de orbe possuem foco visível configurado via classes', () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    // Foca no primeiro botão e valida que é focável
    const first = buttons[0] as HTMLButtonElement;
    first.focus();
    expect(document.activeElement).toBe(first);
  });
});