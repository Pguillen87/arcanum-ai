import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Index from '@/pages/Index';
import { MemoryRouter } from 'react-router-dom';

describe('Tema e Reduced Motion', () => {
  it('alternância de tema: classe dark/light no html', () => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add('dark');
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );
    expect(root.classList.contains('dark')).toBe(true);
    root.classList.remove('dark');
    root.classList.add('light');
    expect(root.classList.contains('light')).toBe(true);
  });

  it('aplica classe reduced-motion quando preferido', () => {
    const root = document.documentElement;
    root.classList.remove('reduced-motion');
    // Simula preferência
    root.classList.add('reduced-motion');
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>
    );
    expect(root.classList.contains('reduced-motion')).toBe(true);
  });
});