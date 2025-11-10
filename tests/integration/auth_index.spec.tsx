import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Auth from '@/pages/Auth';
import Index from '@/pages/Index';
import { MemoryRouter } from 'react-router-dom';

describe('Auth e Index — integração visual e acessibilidade', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('Auth: renderiza com classes utilitárias e foco/aria configurados', async () => {
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );

    // Fundo aurora presente
    const aurora = document.querySelector('.gradient-aurora');
    expect(aurora).toBeTruthy();

    // Inputs com aria
    const email = screen.getByLabelText('Email');
    const senha = screen.getByLabelText('Senha');
    expect(email.getAttribute('aria-invalid')).toBe('false');
    expect(senha.getAttribute('aria-invalid')).toBe('false');

    // Verifica foco programático no email (ambiente JSDOM)
    email.focus();
    expect(document.activeElement).toBe(email);

    // CTA usa linguagem mística
    const abrirPortal = screen.getByRole('button', { name: 'Abrir o Portal' });
    expect(abrirPortal !== null).toBe(true);
  });

  it('Index: aplica classes utilitárias de gradiente nas superfícies', () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );
    const aurora = document.querySelector('.gradient-aurora');
    const orb = document.querySelector('.gradient-orb');
    expect(aurora).toBeTruthy();
    expect(orb).toBeTruthy();
  });

  it('Auth: navegação básica de foco via teclado', async () => {
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );
    const user = userEvent.setup();
    const email = screen.getByLabelText('Email');
    const password = screen.getByLabelText('Senha');

    // Tab deve avançar o foco do email para senha
    email.focus();
    await user.tab();
    expect(document.activeElement?.getAttribute('id')).toBe('password');
  });
});