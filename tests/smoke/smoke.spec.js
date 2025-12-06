// ============================================================================
// 🔥 SMOKE TEST — Verifica rapidamente se o fluxo principal do site funciona
// Objetivo: Garantir que o site está no ar, faz login e chega na página de produtos
// ============================================================================

// Importa as funções básicas do Playwright Test (estrutura de testes e asserções)
import { test, expect } from '@playwright/test';

// Importa o Page Object da página de Login
// OBS: "../../" sobe duas pastas a partir do arquivo de teste,
// e depois entra em src/pages/LoginPage.js
import { LoginPage } from '../../src/pages/LoginPage.js';

// Importa o Page Object da página de Inventário (lista de produtos)
import { InventoryPage } from '../../src/pages/InventoryPage.js';


// ============================================================================
// 🧪 TESTE SMOKE — Testa o fluxo essencial: entrar no site → logar → ver produtos
// ============================================================================

test('🔥 Smoke — Login e navegação até produtos', async ({ page }) => {

    // Instancia o Page Object de Login e passa a página do Playwright
    const login = new LoginPage(page);

    // Instancia o Page Object de Inventário
    // (a página para onde o usuário é redirecionado após logar)
    const inventario = new InventoryPage(page);


    // ------------------------------------------------------------------------
    // 🌐 1. Acessa o site principal usando Playwright
    // ------------------------------------------------------------------------
    await page.goto('https://www.saucedemo.com');


    // ------------------------------------------------------------------------
    // 🔐 2. Executa o login usando o método definido no Page Object
    //    Aqui usamos usuário e senha válidos da aplicação
    // ------------------------------------------------------------------------
    await login.login('standard_user', 'secret_sauce');


    // ------------------------------------------------------------------------
    // 📦 3. Valida se o título da página de produtos está aparecendo
    //    Isso confirma que o login foi bem-sucedido e que o usuário chegou
    //    corretamente na tela de inventário
    // ------------------------------------------------------------------------
    await expect(inventario.tituloProdutos()).toBeVisible();
});
