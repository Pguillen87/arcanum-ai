import { test, expect } from '@playwright/test';

test.describe('PWA Offline Fallback', () => {
  test('exibe página offline estilizada quando sem rede', async ({ page, context }) => {
    // Navega online para instalar service worker
    await page.goto('/');
    await page.waitForFunction(() => !!navigator.serviceWorker);
    await page.waitForTimeout(1000);

    // Entra em modo offline
    await context.setOffline(true);
    // Navega para uma rota qualquer para acionar navigateFallback do SW
    await page.goto('/fallback-test');
    await expect(page.getByText('Você está entre portais')).toBeVisible();
    await expect(page.locator('.badge')).toBeVisible();

    // Retorna online para não afetar outros testes
    await context.setOffline(false);
  });
});
