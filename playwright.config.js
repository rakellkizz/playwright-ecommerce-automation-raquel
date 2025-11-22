// playwright.config.js
// ⚙️ Configuração do Playwright Test
// Aqui definimos 2 projetos:
//  - desktop-chrome → simula navegador desktop
//  - mobile-chrome  → simula navegador mobile (msite)

import { defineConfig, devices } from "@playwright/test";
import { siteConfig } from "./config/siteConfig.js";

export default defineConfig({
  // 📁 Onde ficam os testes
  testDir: "./tests",

  // ⏱️ Tempo máximo por teste (ajustável)
  timeout: 60 * 1000,

  // 🔁 Repetir testes flaky automaticamente (0 = desativado)
  retries: 0,

  // 🌐 URL base do site (vem do config central)
  use: {
    baseURL: siteConfig.baseURL,
    // Screenshot em caso de erro (útil pra portfólio)
    screenshot: "only-on-failure",
    // Salvar trace em falhas
    trace: "on-first-retry"
  },

  // 📊 Relatório em HTML
  reporter: [["html", { outputFolder: "playwright-report" }]],

  // 🖥️ + 📱 Projetos (desktop e mobile)
  projects: [
    {
      name: "desktop-chrome",
      use: {
        ...devices["Desktop Chrome"]
      }
    },
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 7"]   // emula Chrome mobile (msite)
      }
    }
  ]
});
