// ============================================================================
// 🛒 CARRINHO — Adição e remoção de itens
// Objetivo: validar ações básicas realizadas no carrinho de compras.
// Este teste cobre: login → adicionar item → acessar carrinho → validar item.
// ============================================================================

// Importa funções fundamentais do Playwright Test
// "test" → cria blocos de teste
// "expect" → realiza validações (asserções)
import { test, expect } from '@playwright/test';

// Importa os Page Objects usados neste fluxo
// OBS: "../../" sobe duas pastas e entra em src/pages/
import { LoginPage } from '../../src/pages/LoginPage.js';
import { InventoryPage } from '../../src/pages/InventoryPage.js';
import { CartPage } from '../../src/pages/CartPage.js';


// ============================================================================
// 🧪 SUITE — Carrinho: ações básicas
// ============================================================================

test.describe('🛒 Carrinho — Ações básicas', () => {

    // ------------------------------------------------------------------------
    // 🎒 TESTE — Adicionar item ao carrinho
    // ------------------------------------------------------------------------
    test('Adicionar item ao carrinho', async ({ page }) => {

        // Instancia os Page Objects que representam cada parte do fluxo
        const login = new LoginPage(page);        // Tela de login
        const inventario = new InventoryPage(page); // Listagem de produtos
        const carrinho = new CartPage(page);        // Carrinho de compras

        // --------------------------------------------------------------------
        // 🌐 1. Acessa o site principal do SauceDemo
        // --------------------------------------------------------------------
        await page.goto('https://www.saucedemo.com');

        // --------------------------------------------------------------------
        // 🔐 2. Realiza login com usuário válido
        // --------------------------------------------------------------------
        await login.login('standard_user', 'secret_sauce');

        // --------------------------------------------------------------------
        // 👜 3. Adiciona ao carrinho o item "Sauce Labs Backpack"
        //    Esse é um produto real da loja e comum nos testes
        // --------------------------------------------------------------------
        await inventario.addProduto('Sauce Labs Backpack');

        // --------------------------------------------------------------------
        // 🛒 4. Navega para a página do carrinho para validar o item
        // --------------------------------------------------------------------
        await inventario.irParaCarrinho();

        // --------------------------------------------------------------------
        // ✔️ 5. Valida se o nome do produto está visível dentro do carrinho
        //    Isso confirma que o item foi adicionado com sucesso
        // --------------------------------------------------------------------
        await expect(carrinho.nomeProduto()).toBeVisible();
    });

});
