// ====================================================================================
// 🛒 Testes de Carrinho – SauceDemo
// ------------------------------------------------------------------------------------
// Este módulo valida:
// - Adicionar item ao carrinho
// - Badge de quantidade atualiza
// - Remover item do carrinho
// - Carrinho fica vazio após remoção
// ====================================================================================

import { test, expect } from '@playwright/test';

const USER = "standard_user";
const PASSWORD = "secret_sauce";

async function login(page) {
  await page.goto("/");
  await page.fill("#user-name", USER);
  await page.fill("#password", PASSWORD);
  await page.click("#login-button");
  await expect(page).toHaveURL(/inventory/);
}

test("Adicionar item ao carrinho", async ({ page }) => {
  // 1. Login
  await login(page);

  // 2. Clicar no primeiro botão "Add to cart"
  const addButton = page.locator(".inventory_item button").first();
  await addButton.click();

  // 3. Validar que o badge mostra "1"
  const badge = page.locator(".shopping_cart_badge");
  await expect(badge).toHaveText("1");
});

test("Remover item do carrinho", async ({ page }) => {
  // 1. Login
  await login(page);

  // 2. Adicionar item
  const addButton = page.locator(".inventory_item button").first();
  await addButton.click();

  // 3. Ir para o carrinho
  await page.click(".shopping_cart_link");

  // 4. Remover o item
  const removeButton = page.locator("button[id*='remove']");
  await removeButton.click();

  // 5. Badge deve desaparecer (carrinho vazio)
  const badge = page.locator(".shopping_cart_badge");
  await expect(badge).toHaveCount(0);

  // 6. Mensagem de item removido não existe — valida pela ausência no DOM
  const cartItem = page.locator(".cart_item");
  await expect(cartItem).toHaveCount(0);
});
