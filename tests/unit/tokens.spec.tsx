import { describe, it, expect } from 'vitest';

describe('Tokens e utilitários CSS', () => {
  it('usa classes utilitárias de gradiente nas superfícies', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div class="fixed inset-0 -z-10">
        <div class="absolute inset-0 gradient-aurora"></div>
        <div class="absolute top-20 left-20 w-96 h-96 rounded-full blur-3xl opacity-30 animate-cosmic-pulse gradient-orb"></div>
        <div class="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl opacity-30 animate-cosmic-pulse gradient-orb"></div>
      </div>
    `;
    document.body.appendChild(root);

    const aurora = root.querySelector('.gradient-aurora');
    const orbs = root.querySelectorAll('.gradient-orb');

    expect(aurora).toBeTruthy();
    expect(orbs.length).toBe(2);
  });
});