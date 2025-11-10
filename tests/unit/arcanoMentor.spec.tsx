import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ArcanoMentor } from '@/components/cosmic/ArcanoMentor';
import userEvent from '@testing-library/user-event';

describe('ArcanoMentor — FSM e preferências', () => {
  it('abre overlay e percorre passos do wizard', async () => {
    render(<ArcanoMentor section="dashboard" />);
    const user = userEvent.setup();

    // Abre guia
    const abrir = screen.getByRole('button', { name: 'Abrir Guia Mago' });
    await user.click(abrir);

    // Boas vindas — valida texto em overlay
    expect(screen.getByText(/Bem-vinda\(o\)!/)).toBeTruthy();
    const avancar = screen.getByRole('button', { name: /Avançar/i });
    await user.click(avancar);

    // Explorar → Ação → Conclusão
    const avancar2 = screen.getByRole('button', { name: /Avançar/i });
    await user.click(avancar2);
    // Conclusão — valida texto de encerramento e fecha
    expect(await screen.findByText(/Conclusão do ritual/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /Fechar/i }));
  });

  it('persiste personalidade e intensidade em localStorage', async () => {
    localStorage.removeItem('arcanoMentorPrefs');
    render(<ArcanoMentor section="dashboard" />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Abrir Guia Mago' }));

    await user.click(screen.getByRole('button', { name: 'Bruxa das Brumas' }));
    await user.click(screen.getByRole('button', { name: 'Profundo' }));

    const raw = localStorage.getItem('arcanoMentorPrefs');
    expect(raw).toBeTruthy();
    const prefs = JSON.parse(raw || '{}');
    expect(prefs.personalidade).toBe('bruxa_brumas');
    expect(prefs.intensidade).toBe('profundo');
  });

  it('som arcano só ativa após gesto do usuário', async () => {
    render(<ArcanoMentor section="dashboard" />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Abrir Guia Mago' }));

    const toggleSom = screen.getByRole('button', { name: 'Alternar Som Arcano' });
    await user.click(toggleSom);
    // Verifica flag no storage
    const raw = localStorage.getItem('arcanoMentorPrefs');
    const prefs = JSON.parse(raw || '{}');
    expect(prefs.somAtivo).toBe(true);
  });
});