// ====================================================================================
// 🧪 SMOKE TEST — SauceDemo
// ------------------------------------------------------------------------------------
// Objetivo deste arquivo:
// - Validar rapidamente se o site funciona no essencial
// - Verificar se o login está operante
// - Confirmar se a página de produtos carrega corretamente
// ====================================================================================

// Importa as funções essenciais do Playwright Test
import { test, expect } from '@playwright/test';

// Credenciais oficiais fornecidas pelo SauceDemo
const USER = "standard_user";
const PASSWORD = "secret_sauce";


// ====================================================================================
// 🔥 TESTE 1 — Validar login básico
// ====================================================================================

test("Login funciona com sucesso", async ({ page }) => {

  // ---------------------------------------------------------------------------
  // 1. Abre o site base (usa baseURL configurado no playwright.config)
  // ---------------------------------------------------------------------------
  await page.goto("/");

  // ---------------------------------------------------------------------------
  // 2. Preenche o usuário e a senha
  //    "#user-name" e "#password" são campos identificados por ID direto
  // ---------------------------------------------------------------------------
  await page.fill("#user-name", USER);
  await page.fill("#password", PASSWORD);

  // ---------------------------------------------------------------------------
  // 3. Clica no botão de login
  // ---------------------------------------------------------------------------
  await page.click("#login-button");

  // ---------------------------------------------------------------------------
  // 4. Após login bem-sucedido, a URL deve conter "inventory"
  // ---------------------------------------------------------------------------
  await expect(page).toHaveURL(/inventory/);
});


// ====================================================================================
// 🔍 TESTE 2 — Validar que a Home exibe produtos após login
// ====================================================================================

test("Home lista produtos com sucesso", async ({ page }) => {

  // ---------------------------------------------------------------------------
  // 1. Login rápido (sem reusar função para manter arquivo simples)
  // ---------------------------------------------------------------------------
  await page.goto("/");
  await page.fill("#user-name", USER);
  await page.fill("#password", PASSWORD);
  await page.click("#login-button");

  // ---------------------------------------------------------------------------
  // 2. Seleciona o primeiro produto da lista
  //    ".inventory_item" é a classe usada para cada card de produto
  // ---------------------------------------------------------------------------
  const firstProduct = page.locator(".inventory_item").first();

  // ---------------------------------------------------------------------------
  // 3. Valida se o produto está visível na página
  //    Isso confirma que a listagem carregou corretamente
  // ---------------------------------------------------------------------------
  await expect(firstProduct).toBeVisible();
});
