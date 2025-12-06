// ======================================================================
// tests-engine.js — Motor simbólico dos testes automáticos
// ======================================================================
//  ✔ Ouve eventos do temporizador (start/tick/finish)
//  ✔ Marca cenários como OK ou Erro
//  ✔ Simula checagem de cada card por segundo
//  ✔ Emite "testes:anomalia" quando detectar erro
//  ✔ Emite "testes:falso-positivo" corretamente
// ======================================================================


// ======================================================================
// CONFIGURAÇÃO DOS CENÁRIOS
// ======================================================================
const cenarios = [
  "checkout",
  "login",
  "estoque",
  "carrinho",
  "busca",
  "pagamento"
];

let testesAtivos = false;


// ======================================================================
// FUNÇÃO: Iniciar rodada de testes
// ======================================================================
function iniciarTestes(totalSegundos) {
  testesAtivos = true;

  console.log(`🔵 [tests-engine] Iniciando rodada de testes (${totalSegundos}s)`);

  // marca todos como "análise"
  cenarios.forEach((id) => {
    dispatchEvent(new CustomEvent("testes:mudar-status", {
      detail: { cenario: id, status: "analise" }
    }));
  });

  // reinicia telemetria
  if (window.__telemetry?.resetarTelemetria) {
    window.__telemetry.resetarTelemetria();
  }
}


// ======================================================================
// FUNÇÃO: Executar passo por segundo — com telemetria
// ======================================================================
function executarPassoDoTeste(segundoAtual) {
  if (!testesAtivos) return;

  // escolhe o cenário
  const id = cenarios[segundoAtual % cenarios.length];

  console.log(`⏱️ [tests-engine] Verificando cenário: ${id}`);

  // Telemetria registra check
  if (window.__telemetry?.registrarCheck) {
    window.__telemetry.registrarCheck(id);
  }

  // Simulação de erro eventual
  const erro = Math.random() < 0.08;

  if (erro) {
    if (window.__telemetry?.registrarErro) {
      window.__telemetry.registrarErro(id);
    }

    console.warn(`🚨 [tests-engine] Anomalia detectada em: ${id}`);

    dispatchEvent(new CustomEvent("testes:anomalia", {
      detail: { cenario: id }
    }));

    return;
  }

  // ============================================================
  // DETECÇÃO DE FALSO POSITIVO (AGORA 100% CORRETO E SEGURO)
  // ============================================================
  if (
    window.__telemetry &&
    window.__telemetry.erros &&
    typeof id !== "undefined"
  ) {
    const erros = window.__telemetry.erros[id] || 0;

    // Regra: teve 1 erro, e agora voltou ao normal → falso positivo
    if (erros === 1) {
      dispatchEvent(new CustomEvent("testes:falso-positivo", {
        detail: { cenario: id }
      }));
    }
  }

  // OK parcial (nenhum erro no ciclo)
  dispatchEvent(new CustomEvent("testes:ok-parcial", {
    detail: { cenario: id }
  }));
}


// ======================================================================
// FUNÇÃO: Finalizar testes
// ======================================================================
function finalizarTestes() {
  testesAtivos = false;

  console.log("🟢 [tests-engine] Testes finalizados.");

  cenarios.forEach((id) => {
    dispatchEvent(new CustomEvent("testes:mudar-status", {
      detail: { cenario: id, status: "ok" }
    }));
  });

  // Gera resumo final
  if (window.__telemetry?.gerarResumoFinal) {
    const resumo = window.__telemetry.gerarResumoFinal();

    dispatchEvent(new CustomEvent("testes:resumo", {
      detail: resumo
    }));
  }
}


// ======================================================================
// EVENTOS DO TEMPORIZADOR
// ======================================================================

addEventListener("testes:iniciar", (ev) => {
  const total = ev.detail?.total ?? 0;
  iniciarTestes(total);
});

addEventListener("testes:tick", (ev) => {
  const restante = ev.detail?.restante ?? 0;
  const total = ev.detail?.total ?? 1;

  const segundoAtual = total - restante;
  executarPassoDoTeste(segundoAtual);
});

addEventListener("testes:finalizar", () => {
  finalizarTestes();
});


// ======================================================================
// Debug
// ======================================================================
window.__testsEngine = {
  iniciarTestes,
  executarPassoDoTeste,
  finalizarTestes
};
