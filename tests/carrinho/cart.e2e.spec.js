// ============================================================================
// 🛒🧪 CARRINHO E2E — Fluxo do início ao fim
// Objetivo: validar o fluxo essencial do carrinho — login → adicionar item →
// entrar no carrinho → verificar item presente.
// ============================================================================

// Importa funções base do Playwright Test
// "test" = define os testes
// "expect" = faz validações/asserções
import { test, expect } from '@playwright/test';

// Importa os Page Objects necessários para o fluxo deste teste
// OBS: "../../" sobe duas pastas, depois entra em src/pages/
import { LoginPage } from '../../src/pages/LoginPage.js';
import { InventoryPage } from '../../src/pages/InventoryPage.js';
import { CartPage } from '../../src/pages/CartPage.js';


// ============================================================================
// 🧪 SUITE — Carrinho: fluxo E2E
// ============================================================================

test.describe('🛒 Carrinho — Fluxo E2E completo', () => {

    // ------------------------------------------------------------------------
    // 🛍️ TESTE — Login → adicionar item → verificar no carrinho
    // ------------------------------------------------------------------------
    test('Login → adicionar item → carrinho', async ({ page }) => {

        // Instancia os Page Objects passando a página do Playwright
        const login = new LoginPage(page);        // Tela de login
        const inventario = new InventoryPage(page); // Lista de produtos
        const carrinho = new CartPage(page);        // Carrinho de compras


        // --------------------------------------------------------------------
        // 🌐 1. Abre o site oficial do SauceDemo
        // --------------------------------------------------------------------
        await page.goto('https://www.saucedemo.com');


        // --------------------------------------------------------------------
        // 🔐 2. Realiza login com credenciais válidas
        // --------------------------------------------------------------------
        await login.login('standard_user', 'secret_sauce');


        // --------------------------------------------------------------------
        // 🚲 3. Adiciona um produto específico ao carrinho
        //    "Sauce Labs Bike Light" é um produto real da loja
        // --------------------------------------------------------------------
        await inventario.addProduto('Sauce Labs Bike Light');


        // --------------------------------------------------------------------
        // 🛒 4. Vai para a página do carrinho
        // --------------------------------------------------------------------
        await inventario.irParaCarrinho();


        // --------------------------------------------------------------------
        // ✔️ 5. Valida se o produto aparece dentro do carrinho
        //    O método nomeProduto() retorna o elemento que contém o nome do item
        // --------------------------------------------------------------------
        await expect(carrinho.nomeProduto()).toBeVisible();
    });

});
