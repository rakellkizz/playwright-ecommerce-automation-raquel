// ====================================================================================
// 🎭 Arquivo de Configuração Playwright – Projeto Raquel
// ------------------------------------------------------------------------------------
// Aqui definimos:
// - URL base
// - Browsers
// - Configurações mobile e desktop
// - Tempo limite
// ====================================================================================

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  // 🌐 URL base usada pelo page.goto("/")
  use: {
    baseURL: 'https://demo.playwright.dev/',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  // 🧪 Executar em dois perfis: Desktop + Mobile
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
