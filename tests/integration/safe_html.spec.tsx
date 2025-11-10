import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SafeHtml } from '@/components/ui/SafeHtml';

describe('SafeHtml — exibição de HTML sanitizado', () => {
  it('renderiza sem scripts e handlers', () => {
    const html = '<p><strong>Olá</strong></p><script>alert(1)</script><a href="/x" onclick="evil()">x</a>';
    render(<SafeHtml html={html} />);
    const container = screen.getByText('Olá').closest('div')!;
    expect(container.innerHTML).toContain('<strong>Olá</strong>');
    expect(container.innerHTML).not.toContain('<script');
    expect(container.innerHTML).not.toContain('onclick');
  });
});

