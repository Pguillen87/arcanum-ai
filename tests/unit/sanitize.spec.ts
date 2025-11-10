import { describe, it, expect } from 'vitest';
import { sanitizeHTML } from '@/lib/sanitize';

describe('sanitizeHTML', () => {
  it('remove <script>, <iframe> e <style>', () => {
    const html = '<p>ok</p><script>alert(1)</script><iframe src="x"></iframe><style>body{}</style>';
    const out = sanitizeHTML(html);
    expect(out).toContain('<p>ok</p>');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('<iframe');
    expect(out).not.toContain('<style');
  });
  it('remove atributos on* e preserva href/src seguros', () => {
    const html = '<a href="/test" onclick="evil()">link</a><img src="/icon.png" onload="x()" />';
    const out = sanitizeHTML(html);
    expect(out).toContain('<a href="/test"');
    expect(out).toContain('<img src="/icon.png"');
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('onload');
  });
});

