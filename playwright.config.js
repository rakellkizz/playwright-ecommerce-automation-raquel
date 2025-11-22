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

  use: {
    baseURL: 'https://demo.playwright.dev/ecommerce',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

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
