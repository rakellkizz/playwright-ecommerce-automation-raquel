// ====================================================================================
// 🛒 Testes de Carrinho – SauceDemo
// ------------------------------------------------------------------------------------
// OBJETIVO DO ARQUIVO:
// - Validar adição de item ao carrinho
// - Validar atualização do badge (indicador de quantidade)
// - Validar remoção do item
// - Validar carrinho vazio após remover o item
// ====================================================================================

// Importa as funções essenciais do Playwright Test
import { test, expect } from '@playwright/test';

// Credenciais padrão do SauceDemo
const USER = "standard_user";
const PASSWORD = "secret_sauce";

// ====================================================================================
// 🔐 Função auxiliar de login (utilizada em todos os testes abaixo)
// ====================================================================================
async function login(page) {

  // Acessa o site base (configurado no playwright.config com baseURL)
  await page.goto("/");

  // Preenche o usuário
  await page.fill("#user-name", USER);

  // Preenche a senha
  await page.fill("#password", PASSWORD);

  // Clica no botão de login
  await page.click("#login-button");

  // Valida se o login redirecionou corretamente para /inventory
  await expect(page).toHaveURL(/inventory/);
}

// ====================================================================================
// 🧪 TESTE 1 — Adicionar item ao carrinho
// ====================================================================================

test("Adicionar item ao carrinho", async ({ page }) => {

  // 1. Realiza login
  await login(page);

  // 2. Captura o primeiro botão "Add to cart" da lista
  const addButton = page.locator(".inventory_item button").first();

  // 3. Clica no botão para adicionar o item
  await addButton.click();

  // 4. Badge do carrinho deve aparecer com o número "1"
  const badge = page.locator(".shopping_cart_badge");
  await expect(badge).toHaveText("1");
});

// ====================================================================================
// 🧪 TESTE 2 — Remover item do carrinho
// ====================================================================================

test("Remover item do carrinho", async ({ page }) => {

  // 1. Login padrão
  await login(page);

  // 2. Adiciona o primeiro item à sacola
  const addButton = page.locator(".inventory_item button").first();
  await addButton.click();

  // 3. Abre o carrinho clicando no ícone superior direito
  await page.click(".shopping_cart_link");

  // 4. Localiza o botão "Remove" (o ID sempre contém "remove")
  const removeButton = page.locator("button[id*='remove']");
  await removeButton.click();

  // 5. O badge deve desaparecer (pois não há mais itens)
  const badge = page.locator(".shopping_cart_badge");
  await expect(badge).toHaveCount(0);

  // 6. Valida que nenhum item está listado no carrinho
  const cartItem = page.locator(".cart_item");
  await expect(cartItem).toHaveCount(0);
});
