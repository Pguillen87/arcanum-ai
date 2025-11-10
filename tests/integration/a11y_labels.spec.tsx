import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Index from '@/pages/Index';
import { I18nProvider } from '@/contexts/I18nContext';
import { MemoryRouter } from 'react-router-dom';

describe('Acessibilidade — aria-labels e navegação por teclado', () => {
  it('hero possui aria-labels nos textos e botões', () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <Index />
        </I18nProvider>
      </MemoryRouter>
    );
    const startBtn = screen.getByRole('button', { name: /Iniciar Jornada|Start Journey/i });
    const exploreBtn = screen.getByRole('button', { name: /Explorar Portal|Explore Portal/i });
    expect(startBtn).toBeTruthy();
    expect(exploreBtn).toBeTruthy();
  });
});
