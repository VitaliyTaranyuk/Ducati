import { test, expect } from '@playwright/test';

test.describe('оформление — билет', () => {
  test('иконка заказа открывает билет, без отдельной корзины', async ({ page }) => {
    await page.goto('/drink/americano');
    await page.getByTestId('add-to-cart').click();
    await expect(page.getByTestId('add-to-cart')).toHaveText('Добавлено');
    await page.getByRole('link', { name: 'Заказ' }).click();

    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.getByRole('heading', { name: 'Заберу' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Меню' })).toBeVisible();
    await expect(page.getByTestId('checkout-ticket')).toBeVisible();
    await expect(page.getByTestId('checkout-asap')).toContainText(/15/);
    await expect(page.getByTestId('checkout-drinks')).toContainText('Американо');
    await expect(page.getByTestId('checkout-submit')).toHaveText('Подтвердить заказ');
    await expect(page.getByText('Оплата на месте при получении')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Оформить' })).toHaveCount(0);

    await page.getByTestId('checkout-to-time').click();
    await expect(page.getByTestId('checkout-wheels')).toBeVisible();
    await expect(page.getByTestId('ready-time-sheet')).toHaveCount(0);
    await expect(page.getByTestId('checkout-submit')).toContainText(/Подтвердить · к \d{2}:\d{2}/);

    await page.getByTestId('checkout-to-asap').click();
    await expect(page.getByTestId('checkout-asap')).toBeVisible();
    await expect(page.getByTestId('checkout-submit')).toHaveText('Подтвердить заказ');

    await page.goto('/cart');
    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.getByRole('link', { name: 'Меню' })).toBeVisible();
  });

  test('сегодня и завтра доступны после выбора точного времени', async ({ page }) => {
    await page.goto('/drink/americano');
    await page.getByTestId('add-to-cart').click();
    await page.goto('/checkout');
    await page.getByTestId('checkout-to-time').click();
    const today = page.getByTestId('checkout-day-today');
    const tomorrow = page.getByTestId('checkout-day-tomorrow');
    const submit = page.getByTestId('checkout-submit');
    await expect(submit).toContainText(/Подтвердить · к \d{2}:\d{2}/);
    if (await today.isEnabled()) {
      await tomorrow.click();
      await expect(submit).toContainText(/Подтвердить · к \d{2}:\d{2}/);
      await today.click();
      await expect(submit).toContainText(/Подтвердить · к \d{2}:\d{2}/);
    } else {
      await expect(today).toBeDisabled();
      await expect(submit).toContainText(/Подтвердить · к \d{2}:\d{2}/);
    }
  });
});
