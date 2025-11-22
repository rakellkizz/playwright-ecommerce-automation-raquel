// ====================================================================================
// 🎭 Configuração do Playwright – Projeto Raquel
// E-commerce oficial para automação: https://www.saucedemo.com/
// ====================================================================================

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  use: {
  baseURL: 'https://www.saucedemo.com/',
  headless: true,

  // ⭐ Gere artefatos SEMPRE (mesmo quando passa)
  screenshot: 'on',
  video: 'on',
  trace: 'on',

  // Diretório onde serão salvos
  outputDir: 'test-results/',
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
