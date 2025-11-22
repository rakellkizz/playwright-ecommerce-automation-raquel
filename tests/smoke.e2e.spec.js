// ====================================================================================
// 🧪 Testes Smoke – Playwright Demo Store
// ------------------------------------------------------------------------------------
// Este arquivo valida as funcionalidades básicas da loja demo oficial:
// - Home
// - Busca
// - Página de produto
// ====================================================================================

import { test, expect } from '@playwright/test';

// Selectors da página
const searchInput = '#search-input';
const productCard = '.card';
// Elemento específico da página de produto
const productTitle = 'h1';

test("Módulo 1 – Home carrega com sucesso", async ({ page }) => {
  // 1. Vai para a home definida no baseURL
  await page.goto("/");

  // 2. Valida que o título não está vazio
  const title = await page.title();
  expect(title).not.toBe("");

  // 3. Valida que existe ao menos um produto na home
  await expect(page.locator(productCard).first()).toBeVisible();
});

test("Módulo 1 – Busca produto e abre página de produto", async ({ page }) => {
  // 1. Vai para a home
  await page.goto("/");

  // 2. Digita "laptop" no campo de busca
  await page.fill(searchInput, "laptop");

  // 3. Pressiona Enter
  await page.keyboard.press("Enter");

  // 4. Valida que apareceu pelo menos 1 resultado
  await expect(page.locator(productCard).first()).toBeVisible();

  // 5. Clica no primeiro produto
  await page.locator(productCard).first().click();

  // 6. Valida que a página de produto abriu
  await expect(page.locator(productTitle)).toBeVisible();
});
