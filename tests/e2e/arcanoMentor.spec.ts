import { test, expect } from '@playwright/test';

test.describe('ArcanoMentor — fluxo completo e som via gesto (mobile)', () => {
  test('fluxo wizard: textos e animações presentes', async ({ page }) => {
    await page.goto('/');

    // Abrir guia
    await page.getByText('Abrir Guia Mago').click();

    // Boas-vindas
    await expect(page.getByText('Bem-vinda(o)! Eu sou seu guia místico. Vamos explorar?')).toBeVisible();

    // Verifica presença de animações (classe animate-rune-pulse)
    const runas = page.locator('.animate-rune-pulse');
    await expect(runas.first()).toBeVisible();

    // Avança passos
    await page.getByRole('button', { name: 'Avançar' }).click(); // explorar
    await page.getByRole('button', { name: 'Avançar' }).click(); // ação

    // Conclusão
    await page.getByRole('button', { name: /Concluir/ }).click();
    await page.getByRole('button', { name: /Fechar/ }).click();
  });

  test('som via gesto: sem autoplay; ativa ao clicar', async ({ page }) => {
    await page.goto('/');

    // Confere que som está desativado inicialmente
    let prefs = await page.evaluate(() => JSON.parse(localStorage.getItem('arcanoMentorPrefs') || '{}'));
    expect(prefs?.somAtivo ?? false).toBeFalsy();

    // Abre guia e habilita som via gesto
    await page.getByText('Abrir Guia Mago').click();
    await page.getByRole('button', { name: 'Alternar Som Arcano' }).click();

    // Verifica que somAtivo agora é true
    prefs = await page.evaluate(() => JSON.parse(localStorage.getItem('arcanoMentorPrefs') || '{}'));
    expect(prefs?.somAtivo).toBeTruthy();
  });
});