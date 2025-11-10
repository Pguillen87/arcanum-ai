import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArcanoMentor } from '@/components/cosmic/ArcanoMentor';

describe('Permissões de mídia — solicitar e revogar', () => {
  it('solicita microfone após clique e revoga ao fechar', async () => {
    const user = userEvent.setup();
    const stop = vi.fn();
    const fakeStream: any = { getTracks: () => [{ stop }] };
    (navigator as any).mediaDevices = { getUserMedia: vi.fn().mockResolvedValue(fakeStream) };

    render(<ArcanoMentor section="dashboard" />);
    await user.click(screen.getByRole('button', { name: 'Abrir Guia Mago' }));
    await user.click(screen.getByRole('button', { name: 'Permitir Microfone' }));
    // Fecha overlay
    await user.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(stop).toHaveBeenCalled();
  });
});

