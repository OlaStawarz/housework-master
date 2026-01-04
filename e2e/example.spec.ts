import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Oczekujemy przekierowania na stronę logowania dla niezalogowanego użytkownika
  await expect(page).toHaveTitle(/Logowanie | Housework Master/);
});

