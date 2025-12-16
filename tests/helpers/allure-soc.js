// ======================================================================
// 1. IMPORTAÇÕES
// ----------------------------------------------------------------------
// Importamos o módulo nativo "fs" do Node.js.
// Ele será usado APENAS para salvar arquivos físicos
// dentro da pasta `allure-results`.
// ======================================================================
import fs from "fs";


// ======================================================================
// 2. FUNÇÃO PRINCIPAL — anexarSocEvents
// ----------------------------------------------------------------------
// Esta função faz a ponte entre:
//   • O FRONT-END (localStorage / SOC / cards / HUD)
//   • O BACK-END DE TESTES (Playwright)
//   • O RELATÓRIO (Allure)
//
// Ela NÃO altera UI, NÃO interfere nos testes,
// apenas COLETA e ENTREGA dados ao relatório.
// ======================================================================
//
// Parâmetros:
//   page      → objeto do Playwright (acesso ao browser)
//   testInfo  → objeto do Playwright com dados do teste atual
//   nome      → nome amigável do anexo na Allure (opcional)
//
// ======================================================================
export async function anexarSocEvents(page, testInfo, nome = "SOC Events") {

  // ====================================================================
  // 3. COLETA DOS EVENTOS SOC NO BROWSER
  // --------------------------------------------------------------------
  // Executamos código DENTRO do navegador usando page.evaluate.
  // Aqui buscamos exatamente o que o seu sistema já grava:
  //
  //   localStorage["soc_events"]
  //
  // Retorno esperado:
  //   • string JSON
  //   • ou null se não existir
  // ====================================================================
  const socEvents = await page.evaluate(() => {
    return localStorage.getItem("soc_events");
  });


  // ====================================================================
  // 4. PROTEÇÃO — se não houver dados, não faz nada
  // --------------------------------------------------------------------
  // Isso evita:
  //   • erro no Playwright
  //   • erro na Allure
  //   • anexos vazios desnecessários
  // ====================================================================
  if (!socEvents) return;


  // ====================================================================
  // 5. ANEXO DIRETO NO RELATÓRIO ALLURE
  // --------------------------------------------------------------------
  // Aqui usamos a API oficial do Playwright:
  //   testInfo.attach()
  //
  // Resultado:
  //   • O JSON aparece dentro do teste na Allure
  //   • Acessível pela aba "Attachments"
  //
  // IMPORTANTE:
  //   • A Allure NÃO executa esse JSON
  //   • Ela apenas exibe como evidência
  // ====================================================================
  await testInfo.attach(nome, {
    body: socEvents,                // conteúdo do anexo
    contentType: "application/json" // tipo correto para leitura
  });


  // ====================================================================
  // 6. (OPCIONAL, MAS MUITO PROFISSIONAL)
  // --------------------------------------------------------------------
  // Salvamos o mesmo conteúdo como arquivo físico
  // dentro da pasta `allure-results`.
  //
  // Benefícios:
  //   • Debug offline
  //   • Auditoria
  //   • Versionamento futuro
  //   • Integração com pipelines
  //
  // Nome do arquivo:
  //   soc-events-<timestamp>.json
  // ====================================================================
  fs.writeFileSync(
    `allure-results/soc-events-${Date.now()}.json`,
    socEvents
  );
}
