import { test, expect } from '@playwright/test';

test.describe('меню и карточка дизайна А', () => {
  test('две категории, раф и латте сгруппированы, айс отдельно', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('category-tab-classics')).toBeVisible();
    await expect(page.getByTestId('category-tab-ice')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Спешл' })).toHaveCount(0);

    await expect(page.getByRole('heading', { name: 'Раф', exact: true })).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Латте', exact: true })).toHaveCount(1);
    await expect(page.getByRole('heading', { name: /Халва/ })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /тыква/i })).toHaveCount(0);

    await page.getByTestId('category-tab-ice').click();
    await expect(page.getByRole('heading', { name: 'Бамбл' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Айс-латте' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Раф', exact: true })).toHaveCount(0);
  });

  test('ползунок: три, два и один объём', async ({ page }) => {
    await page.goto('/drink/raf');
    const raf = page.getByTestId('volume-slider');
    await expect(raf).toHaveAttribute('data-mode', 'multi');
    await expect(raf).toHaveAttribute('data-slots', '3');
    await expect(raf.getByTestId('volume-slider-option')).toHaveCount(3);
    await raf.getByTestId('volume-slider-option').nth(2).click();
    await expect(page.getByTestId('add-to-cart')).toContainText('₽');

    await page.goto('/drink/americano');
    const two = page.getByTestId('volume-slider');
    await expect(two).toHaveAttribute('data-mode', 'multi');
    await expect(two).toHaveAttribute('data-slots', '2');
    await expect(two.getByTestId('volume-slider-option')).toHaveCount(2);

    await page.goto('/drink/tea');
    const one = page.getByTestId('volume-slider');
    await expect(one).toHaveAttribute('data-mode', 'single');
    await expect(one).toHaveAttribute('data-slots', '1');
    await expect(one.getByTestId('volume-slider-option')).toHaveCount(1);
    await expect(one.getByTestId('volume-slider-option')).toContainText('250');
  });

  test('айс остаётся отдельной карточкой с одним объёмом 400 мл', async ({ page }) => {
    await page.goto('/drink/iced-latte');
    await expect(page.getByRole('heading', { name: 'Айс-латте' })).toBeVisible();
    await expect(page.getByTestId('flavor-film')).toHaveCount(0);
    const volume = page.getByTestId('volume-slider');
    await expect(volume).toHaveAttribute('data-mode', 'single');
    await expect(volume.getByTestId('volume-slider-option')).toContainText('400');
    await expect(page.getByTestId('syrup-strip')).toBeVisible();
  });

  test('молоко — тот же ползунок из двух позиций', async ({ page }) => {
    await page.goto('/drink/latte');
    const milk = page.getByTestId('milk-slider');
    await expect(milk).toHaveAttribute('data-slots', '2');
    await milk.getByTestId('milk-slider-option').nth(1).click();
    await expect(page.getByTestId('add-to-cart')).toContainText('₽');
  });

  test('прямая ссылка на айс не перебивается сохранённым горячим напитком', async ({ page }) => {
    await page.goto('/drink/raf');
    await expect(page.getByRole('heading', { name: 'Раф' })).toBeVisible();
    await page.goto('/?category=ice');
    await expect(page.getByRole('heading', { name: 'Бамбл' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Раф', exact: true })).toHaveCount(0);
  });

  test('пользователь собирает раф с вкусом и кладёт в корзину', async ({ page }) => {
    await page.goto('/drink/raf');
    await page.getByTestId('flavor-tile').filter({ hasText: 'Халва' }).click();
    await page.getByTestId('add-to-cart').click();
    await expect(page.getByTestId('add-to-cart')).toHaveText('Добавлено');
    await page.goto('/cart');
    await expect(page.getByText('Раф')).toBeVisible();
    await expect(page.getByText(/Халва/)).toBeVisible();
  });
});
