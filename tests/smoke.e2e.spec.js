// ====================================================================================
// 🧪 Smoke Test – SauceDemo (E-commerce Oficial para Automação)
// ====================================================================================

import { test, expect } from '@playwright/test';

// Dados de login válidos (SauceDemo fornece estes usuários oficiais)
const USER = "standard_user";
const PASSWORD = "secret_sauce";

test("Login funciona com sucesso", async ({ page }) => {
  // 1. Acessa a página inicial
  await page.goto("/");

  // 2. Preenche usuário e senha
  await page.fill("#user-name", USER);
  await page.fill("#password", PASSWORD);

  // 3. Clica no botão de login
  await page.click("#login-button");

  // 4. Valida que caiu na página de inventário (produtos)
  await expect(page).toHaveURL(/inventory/);
});

test("Home lista produtos com sucesso", async ({ page }) => {
  // 1. Login
  await page.goto("/");
  await page.fill("#user-name", USER);
  await page.fill("#password", PASSWORD);
  await page.click("#login-button");

  // 2. Verifica que existe pelo menos 1 produto
  const firstProduct = page.locator(".inventory_item").first();
  await expect(firstProduct).toBeVisible();
});
