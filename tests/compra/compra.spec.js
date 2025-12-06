// ============================================================================
// 💳 CHECKOUT — Fluxo completo de compra
// Objetivo: validar todo o processo de compra — login → adicionar produto →
// carrinho → checkout → finalização → confirmação.
// É um teste E2E completo cobrindo toda a jornada do usuário.
// ============================================================================

// Importa as funções base do Playwright Test (estrutura de testes e assertivas)
import { test, expect } from '@playwright/test';

// Importa os Page Objects necessários para o fluxo de compra
// OBS: "../../" sobe duas pastas até a raiz do projeto,
// depois entra em src/pages onde ficam os arquivos reais.
import { LoginPage } from '../../src/pages/LoginPage.js';
import { InventoryPage } from '../../src/pages/InventoryPage.js';
import { CartPage } from '../../src/pages/CartPage.js';
import { CheckoutPage } from '../../src/pages/CheckoutPage.js';


// ============================================================================
// 🧪 SUITE — Fluxo de compra completo
// ============================================================================

test.describe('💳 Fluxo de compra completo', () => {

    // ------------------------------------------------------------------------
    // 🛒 TESTE — Simula a compra de ponta a ponta
    // ------------------------------------------------------------------------
    test('Checkout completo', async ({ page }) => {

        // Instancia TODOS os Page Objects necessários para o fluxo
        const login = new LoginPage(page);       // Tela de login
        const inventario = new InventoryPage(page); // Lista de produtos
        const carrinho = new CartPage(page);        // Página do carrinho
        const checkout = new CheckoutPage(page);    // Etapas do checkout

        // --------------------------------------------------------------------
        // 🌐 1. Abre o site principal
        // --------------------------------------------------------------------
        await page.goto('https://www.saucedemo.com');

        // --------------------------------------------------------------------
        // 🔐 2. Realiza login com usuário válido
        // --------------------------------------------------------------------
        await login.login('standard_user', 'secret_sauce');

        // --------------------------------------------------------------------
        // 🧥 3. Adiciona um produto específico ao carrinho
        //    "Sauce Labs Fleece Jacket" é um dos itens oficinais do site
        // --------------------------------------------------------------------
        await inventario.addProduto('Sauce Labs Fleece Jacket');

        // --------------------------------------------------------------------
        // 🛒 4. Acessa o carrinho para continuar o processo
        // --------------------------------------------------------------------
        await inventario.irParaCarrinho();

        // --------------------------------------------------------------------
        // 📦 5. Inicia o processo de checkout
        // --------------------------------------------------------------------
        await carrinho.prosseguirCompra();

        // --------------------------------------------------------------------
        // 📝 6. Preenche os dados do formulário (nome, sobrenome e CEP)
        // --------------------------------------------------------------------
        await checkout.preencherFormulario('Raquel', 'Souza', '12345');

        // --------------------------------------------------------------------
        // 🏁 7. Finaliza a compra clicando no botão "Finish"
        // --------------------------------------------------------------------
        await checkout.finalizarCompra();

        // --------------------------------------------------------------------
        // 🎉 8. Valida que a tela final de confirmação realmente apareceu
        // --------------------------------------------------------------------
        await expect(checkout.confirmacao()).toBeVisible();
    });

});
