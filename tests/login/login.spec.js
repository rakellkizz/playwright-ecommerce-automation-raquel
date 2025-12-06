// ============================================================================
// 🔐 LOGIN — Testes unitários do login
// Focado em validações específicas
// ============================================================================

import { test, expect } from '@playwright/test';

import { LoginPage } from '../../src/pages/LoginPage.js';
import { InventoryPage } from '../../src/pages/InventoryPage.js';

test.describe('🔐 Login – Testes individuais', () => {

    test('Login com usuário bloqueado deve falhar', async ({ page }) => {
        const login = new LoginPage(page);

        await page.goto('https://www.saucedemo.com');
        await login.login('locked_out_user', 'secret_sauce');

        await expect(login.validarErro()).toHaveText(/locked out/i);
    });

});
