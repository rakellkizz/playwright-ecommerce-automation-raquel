// ======================================================================
// SOC MONITORING — TESTE BASE
// ----------------------------------------------------------------------
// Este teste NÃO valida UI.
// NÃO altera layout.
// NÃO interfere no sistema.
//
// Ele existe APENAS para:
//   • abrir a aplicação
//   • permitir que o SOC gere eventos
//   • coletar soc_events
//   • anexar no relatório Allure
// ======================================================================

import { test } from "@playwright/test";
import { anexarSocEvents } from "../helpers/allure-soc.js";


// ======================================================================
// TESTE ÚNICO — Monitoramento SOC
// ======================================================================
test("SOC | Monitoramento de eventos do sistema", async ({ page }, testInfo) => {

  // ====================================================================
  // 1. ABRE A APLICAÇÃO
  // --------------------------------------------------------------------
  // Use a URL real do seu projeto (local ou GitHub Pages)
  // ====================================================================
  await page.goto("http://localhost:3000"); 
  // ou:
  // await page.goto("https://seu-usuario.github.io/seu-repo/");


  // ====================================================================
  // 2. AGUARDA O SISTEMA ESTABILIZAR
  // --------------------------------------------------------------------
  // Pequena espera para:
  //   • scripts carregarem
  //   • SOC inicializar
  //   • listeners registrarem eventos
  // ====================================================================
  await page.waitForTimeout(3000);


  // ====================================================================
  // 3. DISPARO LEVE DE EVENTOS (SEM ALTERAR UI)
  // --------------------------------------------------------------------
  // Simples navegação/refresh já costuma gerar eventos SOC.
  // Não clica em nada sensível.
  // ====================================================================
  await page.reload();
  await page.waitForTimeout(2000);


  // ====================================================================
  // 4. ANEXA OS EVENTOS SOC NA ALLURE
  // --------------------------------------------------------------------
  // Aqui acontece a mágica:
  //   • coleta localStorage["soc_events"]
  //   • anexa no teste ativo
  // ====================================================================
  await anexarSocEvents(page, testInfo);


  // ====================================================================
  // 5. FIM DO TESTE
  // --------------------------------------------------------------------
  // O teste passa sempre, a menos que o Playwright falhe.
  // O objetivo é observabilidade, não validação.
  // ====================================================================
});
