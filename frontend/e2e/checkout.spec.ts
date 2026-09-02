import { test, expect } from '@playwright/test';

test.describe('оформление — билет Заберу', () => {
  test('корзина ведёт на билет с часом и сводкой напитка', async ({ page }) => {
    await page.goto('/drink/americano');
    await page.getByTestId('add-to-cart').click();
    await expect(page.getByTestId('add-to-cart')).toHaveText('Добавлено');
    await page.goto('/cart');
    await page.getByRole('link', { name: 'Оформить' }).click();

    await expect(page.getByRole('heading', { name: 'Заберу' })).toBeVisible();
    await expect(page.getByTestId('checkout-ticket')).toBeVisible();
    await expect(page.getByTestId('checkout-clock')).toHaveText(/\d{2}:\d{2}/);
    await expect(page.getByTestId('checkout-drinks')).toContainText('Американо');
    await expect(page.getByTestId('checkout-submit')).toContainText('Подтвердить');
    await expect(page.getByText('Оплата на месте при получении')).toBeVisible();

    await page.getByTestId('checkout-hour').click();
    await expect(page.getByTestId('ready-time-sheet')).toBeVisible();
    await page.getByRole('button', { name: /Готово/ }).click();
    await expect(page.getByTestId('ready-time-sheet')).toHaveCount(0);
  });

  test('сегодня и завтра переключают подпись кнопки', async ({ page }) => {
    await page.goto('/drink/americano');
    await page.getByTestId('add-to-cart').click();
    await page.goto('/checkout');
    const today = page.getByTestId('checkout-day-today');
    const tomorrow = page.getByTestId('checkout-day-tomorrow');
    const submit = page.getByTestId('checkout-submit');
    if (await today.isEnabled()) {
      await tomorrow.click();
      await expect(submit).toContainText(/завтра к/);
      await today.click();
      await expect(submit).toContainText(/к \d{2}:\d{2}/);
      await expect(submit).not.toContainText('завтра');
    } else {
      await expect(today).toBeDisabled();
      await expect(submit).toContainText(/завтра к/);
    }
  });
});
