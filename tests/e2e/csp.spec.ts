import { test, expect } from '@playwright/test';

test.describe('CSP — Content Security Policy e higiene da UI', () => {
  test('meta CSP presente com diretivas essenciais', async ({ page }) => {
    await page.goto('/');
    const content = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    expect(content).toBeTruthy();
    expect(content!).toContain("default-src 'self'");
    expect(content!).toContain("frame-ancestors 'none'");
    expect(content!).toContain("connect-src 'self'");
  });
});

