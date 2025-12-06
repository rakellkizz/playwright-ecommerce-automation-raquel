// ======================================================================
// telemetry.js — Coleta de dados dos testes em tempo real
// ----------------------------------------------------------------------
//  ✔ Conta quantas anomalias ocorreram no ciclo
//  ✔ Armazena quais cenários deram erro
//  ✔ Armazena quantidade de verificações por cenário
//  ✔ No final do ciclo → dispara resumo automatizado
// ======================================================================

// 🚫 REMOVIDO: import inválido que quebrava tudo
// import { __telemetry as telemetry } from "./telemetry.js";

let telemetria = {
  totalChecks: 0,          // quantas verificações o engine executou
  erros: {},               // { checkout: 2, login: 1, ... }
  checksPorCenario: {},    // { checkout: 5, login: 5, ... }
};


// ======================================================================
// RESET — chamado sempre que o temporizador inicia
// ======================================================================
function resetarTelemetria() {
  telemetria = {
    totalChecks: 0,
    erros: {},
    checksPorCenario: {}
  };
}


// ======================================================================
// REGISTRAR CHECK NORMAL (sem erro)
// ======================================================================
function registrarCheck(cenario) {
  telemetria.totalChecks++;

  if (!telemetria.checksPorCenario[cenario]) {
    telemetria.checksPorCenario[cenario] = 0;
  }

  telemetria.checksPorCenario[cenario]++;
}


// ======================================================================
// REGISTRAR ERRO
// ======================================================================
function registrarErro(cenario) {
  telemetria.totalChecks++;

  if (!telemetria.erros[cenario]) {
    telemetria.erros[cenario] = 0;
  }
  telemetria.erros[cenario]++;

  registrarCheck(cenario);
}


// ======================================================================
// GERAR RESUMO FINAL — usado pelo ia-tests-bridge.js
// ======================================================================
function gerarResumoFinal() {
  const totalErros = Object.values(telemetria.erros).reduce((a, b) => a + b, 0);

  return {
    horario: new Date().toLocaleString("pt-BR"),
    totalChecks: telemetria.totalChecks,
    totalErros,
    errosPorCenario: telemetria.erros,
    checksPorCenario: telemetria.checksPorCenario,
    sucesso: totalErros === 0
  };
}


// ======================================================================
// EXPOSE GLOBAL (como seus outros módulos esperam)
// Agora tests-engine.js pode usar window.__telemetry sem erro
// ======================================================================
window.__telemetry = {
  resetarTelemetria,
  registrarCheck,
  registrarErro,
  gerarResumoFinal
};
