// ======================================================================
// allure-bridge.js — Ponte entre Allure Reports e o sistema de monitoramento
// ----------------------------------------------------------------------
//   ✔ Fornece números de sucesso/falha para o frontend
//   ✔ Permite abrir o relatório real do Allure
//   ✔ Integra futuramente com leitura de JSON real do allure-results/
//   ✔ Não altera nenhum arquivo Playwright nem workflow
// ======================================================================


// ======================================================================
// DADOS MOCKADOS (temporário até ler allure-results/.json)
// ----------------------------------------------------------------------
// Aqui colocamos números simbólicos que depois serão substituídos pelos reais
// ======================================================================
let allureStatus = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  lastRun: null
};


// ======================================================================
// FUNÇÃO: Atualizar status do Allure (mock por enquanto)
// ----------------------------------------------------------------------
// No futuro: ler JSON do Allure automaticamente via fetch() local
// ======================================================================
function atualizarStatusAllureMock() {
  // POR ENQUANTO → valores simulados
  allureStatus.total = 42;
  allureStatus.passed = 39;
  allureStatus.failed = 3;
  allureStatus.skipped = 0;
  allureStatus.lastRun = new Date().toLocaleString("pt-BR");

  dispatchEvent(new CustomEvent("allure:status-atualizado", {
    detail: allureStatus
  }));
}


// ======================================================================
// FUNÇÃO: Abrir relatório real do Allure (HTML já no GitHub Pages)
// ======================================================================
function abrirAllureReport() {
  window.open("./allure-report/index.html", "_blank");
}


// ======================================================================
// EXPOR PÚBLICO
// ======================================================================
window.__allureBridge = {
  atualizarStatusAllureMock,
  abrirAllureReport,
  get status() {
    return allureStatus;
  }
};
// ======================================================================