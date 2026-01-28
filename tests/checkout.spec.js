// ======================================================================
// 1. IMPORTAÇÕES PRINCIPAIS
// ----------------------------------------------------------------------
// Importamos:
//   • test / expect → API oficial do Playwright
//   • anexarSocEvents → helper que conecta SOC + Allure
// ======================================================================
import { test, expect } from "@playwright/test";
import { anexarSocEvents } from "../helpers/allure-soc.js";
import { limparSocEvents } from "../helpers/soc-reset.js";


// ======================================================================
// 2. DEFINIÇÃO DO TESTE
// ----------------------------------------------------------------------
// Nome do teste:
//   "Checkout completo"
//
// Esse nome aparecerá:
//   • Na Allure
//   • Nos relatórios
//   • No histórico de execuções
// ======================================================================
test("Checkout completo", async ({ page }, testInfo) => {

  // ====================================================================
  // 3. ABERTURA DO SISTEMA
  // --------------------------------------------------------------------
  // Aqui você abre o front-end REAL,
  // onde os cards, HUD, SOC e localStorage estão ativos.
  // ====================================================================
  await page.goto("http://127.0.0.1:8080");

  // 🔥 LIMPA eventos SOC do ciclo anterior
  await limparSocEvents(page);

  // agora vem:
  // login → carrinho → checkout

  // agora executa login, carrinho, checkout...

  // ====================================================================
  // 4. EXECUÇÃO DO FLUXO FUNCIONAL
  // --------------------------------------------------------------------
  // Aqui entra o que você já tem:
  //   • Login
  //   • Carrinho
  //   • Checkout
  //
  // Durante esse fluxo:
  //   • Cards mudam de estado
  //   • Timer pulsa
  //   • SOC grava eventos
  //   • localStorage["soc_events"] é alimentado
  // ====================================================================

  // EXEMPLO (ilustrativo):
  // await page.click("#login");
  // await page.click("#add-to-cart");
  // await page.click("#checkout");


  // ====================================================================
  // 5. PONTO CRÍTICO — COLETA DOS EVENTOS SOC
  // --------------------------------------------------------------------
  // ESTE É O MOMENTO CORRETO.
  //
  // Por quê?
  //   ✔ O teste já rodou
  //   ✔ O SOC já registrou tudo
  //   ✔ Os cards já mudaram de estado
  //
  // O helper:
  //   • Lê localStorage
  //   • Anexa JSON na Allure
  //   • Salva arquivo em allure-results
  // ====================================================================
  await anexarSocEvents(page, testInfo, "SOC - Checkout");


  // ====================================================================
  // 6. (OPCIONAL) ASSERTS TRADICIONAIS
  // --------------------------------------------------------------------
  // Você pode manter asserts normais se quiser.
  // Eles NÃO interferem no SOC.
  // ====================================================================
  // expect(await page.locator("text=Pedido confirmado")).toBeVisible();

});
