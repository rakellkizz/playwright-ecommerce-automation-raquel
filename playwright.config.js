// ====================================================================================
// 🎭 Configuração do Playwright – Projeto Raquel +Allure
// E-commerce oficial para automação: https://www.saucedemo.com/
// ====================================================================================

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 📂 Pasta onde ficam os testes
  testDir: './tests',

  // 🧾 Reporters usados:
  // - allure-playwright → gera dados para o Allure
  // - html → gera o relatório HTML do Playwright
  // - list → mostra log bonito no terminal/Actions
  reporter: [
    ['allure-playwright'],
    ['html'],
    ['list'],
  ],

  // ⚙️ Configurações padrão para todos os testes
  use: {
    baseURL: 'https://www.saucedemo.com/', // 🌐 E-commerce alvo
    headless: true,                        // ✅ Roda sem abrir janela gráfica
    screenshot: 'only-on-failure',         // 📸 Screenshot só quando falhar
    video: 'on',                           // 🎥 Grava vídeo (ótimo pro Allure)
    trace: 'on',                           // 🧬 Trace para debugar
    outputDir: 'test-results/',            // 📂 Pasta onde ficam artifacts do Playwright
  },

  // 💻 Perfis de execução (projetos)
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