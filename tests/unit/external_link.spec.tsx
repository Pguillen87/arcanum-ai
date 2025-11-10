import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExternalLink } from '@/components/ui/ExternalLink';

describe('ExternalLink — segurança e UX', () => {
  it('aplica rel seguro e abre em nova aba', () => {
    render(<ExternalLink href="https://example.com">Link</ExternalLink>);
    const a = screen.getByText('Link');
    expect(a.getAttribute('rel')).toContain('noopener');
    expect(a.getAttribute('rel')).toContain('noreferrer');
    expect(a.getAttribute('target')).toBe('_blank');
  });

  it('bloqueia URL inválida e não navega', async () => {
    const user = userEvent.setup();
    render(<ExternalLink href="javascript:alert(1)">Bad</ExternalLink>);
    const a = screen.getByText('Bad');
    const prevent = vi.fn();
    a.addEventListener('click', (e) => { (e as any).preventDefault = prevent; });
    await user.click(a);
    expect(prevent).toHaveBeenCalled();
  });
});

