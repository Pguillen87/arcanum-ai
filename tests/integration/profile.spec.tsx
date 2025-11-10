import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Profile from '@/pages/Profile';
import { MemoryRouter } from 'react-router-dom';

describe('Profile — Essência Pessoal', () => {
  it('renderiza título, campos e botão de salvar', () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    expect(screen.getByText('Essência Pessoal')).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Nome Completo')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Salvar Alterações|Salvando/i })).toBeTruthy();
  });
});

