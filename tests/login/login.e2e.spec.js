// ============================================================================
// 📌 IMPORTAÇÕES BÁSICAS DO PLAYWRIGHT
// ============================================================================
// `test` → estrutura para escrever testes
// `expect` → permite fazer validações
import { test, expect } from '@playwright/test';

// ============================================================================
// 📌 IMPORTAÇÃO DOS PAGE OBJECTS
// ============================================================================
// Aqui buscamos as classes que representam telas reais do sistema.
// Usamos caminhos relativos porque o arquivo está em: tests/login/
import { LoginPage } from '../../src/pages/LoginPage.js';
import { InventoryPage } from '../../src/pages/InventoryPage.js';

// ============================================================================
// 🔐 SUÍTE DE TESTES: LOGIN (Fluxo E2E completo)
// ============================================================================
// test.describe → agrupa vários testes relacionados
test.describe('🔐 Login - Fluxo E2E', () => {

    // ------------------------------------------------------------------------
    // ✅ TESTE 1: Login válido
    // ------------------------------------------------------------------------
    test('Deve fazer login com sucesso', async ({ page }) => {

        // 🧱 Instancia os Page Objects passando o `page` do Playwright
        // Assim cada classe consegue interagir com a página real do navegador
        const login = new LoginPage(page);
        const inventario = new InventoryPage(page);

        // 🌍 1) Abre a página inicial do sistema
        await page.goto('https://www.saucedemo.com');

        // 🔐 2) Realiza login com o usuário padrão
        // Usando o método pronto dentro do Page Object
        await login.login('standard_user', 'secret_sauce');

        // 👀 3) Valida se o título "Products" aparece
        // Isso garante que o login funcionou
        await expect(inventario.tituloProdutos()).toBeVisible();
    });

    // ------------------------------------------------------------------------
    // ❌ TESTE 2: Login com senha incorreta
    // ------------------------------------------------------------------------
    test('Deve falhar com senha inválida', async ({ page }) => {

        // Só precisamos da tela de login aqui
        const login = new LoginPage(page);

        // 1) Acessa o site
        await page.goto('https://www.saucedemo.com');

        // 2) Tenta logar com senha errada
        await login.login('standard_user', 'senha_errada');

        // 3) Valida mensagem de erro usando o método do Page Object
        await expect(login.validarErro()).toBeVisible();
    });

});
