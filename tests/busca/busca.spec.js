// ============================================================================
// 🔍 BUSCA — Teste totalmente estável para GitHub Actions
// ============================================================================

import { test, expect } from '@playwright/test';

import { LoginPage } from '../../src/pages/LoginPage.js';
import { InventoryPage } from '../../src/pages/InventoryPage.js';
import { ProductPage } from '../../src/pages/ProductPage.js';

test.describe('🔍 Busca e navegação de produtos', () => {

    test('Deve abrir detalhes de um produto', async ({ page }) => {

        const login = new LoginPage(page);
        const inventario = new InventoryPage(page);
        const produto = new ProductPage(page);

        // 1. Entra no site
        await page.goto('https://www.saucedemo.com');

        // 2. Login
        await login.login('standard_user', 'secret_sauce');

        // 3. Aguarda inventário carregar REALMENTE
        await inventario.tituloProdutos().waitFor({ state: "visible", timeout: 10000 });
        await page.waitForSelector('.inventory_item', { timeout: 10000 });

        // 4. Agora sim, acessa o produto pela URL
        await page.goto('https://www.saucedemo.com/inventory-item.html?id=4');

        // 5. Espera o título do produto aparecer (super importante)
        await produto.tituloProduto().waitFor({ state: "visible", timeout: 10000 });

        // 6. Valida visualização
        await expect(produto.tituloProduto()).toBeVisible();
    });

});
