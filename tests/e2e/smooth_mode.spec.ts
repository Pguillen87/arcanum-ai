import { test, expect } from '@playwright/test';

test.describe('Modo Suave — degrada animações e blur', () => {
  test('aplica classe modo-suave e reduz duração da animação', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('modo_suave', 'true');
    });
    await page.goto('/');

    // Classe aplicada
    const hasSuave = await page.evaluate(() => document.documentElement.classList.contains('modo-suave'));
    expect(hasSuave).toBeTruthy();

    // Elemento com animate-cosmic-pulse deve ter duração aumentada (6s no modo suave)
    const el = page.locator('.animate-cosmic-pulse').first();
    await expect(el).toBeVisible();
    const duration = await el.evaluate((node) => getComputedStyle(node as Element).animationDuration);
    expect(duration).toBe('6s');
  });
});

