// tests/smoke.e2e.spec.js
// 💜 Módulo 1 – Smoke Test Web + Msite
// Objetivo: garantir que o fluxo básico do usuário funciona:
//
// 1. Abrir a home do site
// 2. Verificar se carregou sem erro
// 3. Buscar um produto (termo configurável)
// 4. Confirmar que há resultados de busca
// 5. Abrir a página do primeiro produto
//
// ⚠ IMPORTANTE: NESTE MÓDULO NÃO FINALIZAMOS COMPRA.
// NÃO chegamos em "comprar", "finalizar pedido" etc.
// É um teste seguro, de navegação e experiência.

import { test, expect } from "@playwright/test";
import { siteConfig } from "../config/siteConfig.js";

const {
  defaultSearchTerm,
  selectors: { searchInput, searchButton, searchResultItem, firstProductLink }
} = siteConfig;

// 🔹 Helper: pequena espera visual opcional (pode tirar depois)
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 🧪 Teste 1 – Home carrega corretamente (Desktop + Mobile)
test("Módulo 1 – Home carrega com sucesso (Web + Msite)", async ({ page }) => {
  // 1. Acessa a home usando baseURL do config
  await page.goto("/");

  // 2. Valida que o título da página não está vazio
  const title = await page.title();
  console.log("Título da página:", title);
  await expect(title).not.toEqual("");

  // 3. Verifica se algum elemento de navegação está presente (header, menu, etc.)
  const hasHeader = await page.locator("header, nav").first().isVisible().catch(() => false);

  expect(hasHeader).toBeTruthy();
});

// 🧪 Teste 2 – Busca produto e abre página de produto
test("Módulo 1 – Busca produto e abre página de produto", async ({ page }) => {
  // 1. Acessa a home
  await page.goto("/");

  // 2. Localiza campo de busca
  const searchInputLocator = page.locator(searchInput).first();

  await expect(searchInputLocator).toBeVisible();
  await searchInputLocator.fill(defaultSearchTerm);

  // 3. Dispara a busca
  if (searchButton) {
    const searchButtonLocator = page.locator(searchButton).first();
    if (await searchButtonLocator.isVisible().catch(() => false)) {
      await searchButtonLocator.click();
    } else {
      // Se botão não existir ou não aparecer, manda Enter
      await page.keyboard.press("Enter");
    }
  } else {
    // fallback: só Enter
    await page.keyboard.press("Enter");
  }

  // 4. Aguarda resultados aparecerem
  const results = page.locator(searchResultItem).first();
  await expect(results).toBeVisible();

  // 5. Abre o primeiro produto
  const firstProduct = page.locator(firstProductLink).first();
  await expect(firstProduct).toBeVisible();

  // Scrollzinho suave antes de clicar (mais "humano")
  await firstProduct.scrollIntoViewIfNeeded();
  await wait(500);

  await firstProduct.click();

  // 6. Valida que a página de produto carregou (tem título, ou botão de comprar, etc.)
  const productTitle = page.locator("h1, [data-testid*='product-name'], .product-title").first();
  await expect(productTitle).toBeVisible();

  // Aqui NÃO clicamos em "comprar". É só validação de navegação.
});
