import { test, expect } from '@playwright/test';

// ====================================================================================
// 🧪 Smoke Tests – Playwright E-commerce Demo
// Oficial: https://demo.playwright.dev/ecommerce
// ====================================================================================

// Selectors reais da nova interface
const searchInput = 'input[placeholder="Search products"]';
const productCard = '.product-card';
const productTitle = '.product-details h1';

test("Home carrega com sucesso", async ({ page }) => {
  await page.goto("/");

  // Verifica titulo da página
  await expect(page).toHaveTitle(/Playwright Demo/);

  // Verifica que tem produtos na home
  await expect(page.locator(productCard).first()).toBeVisible();
});

test("Busca um produto e abre a página de detalhes", async ({ page }) => {
  await page.goto("/");

  // Digitar "laptop"
  await page.fill(searchInput, "laptop");
  await page.keyboard.press("Enter");

  // Deve aparecer resultados
  await expect(page.locator(productCard).first()).toBeVisible();

  // Clicar no primeiro produto
  await page.locator(productCard).first().click();

  // Verificar que abriu a página de produto
  await expect(page.locator(productTitle)).toBeVisible();
});
