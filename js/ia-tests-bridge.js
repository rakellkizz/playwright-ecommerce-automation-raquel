// ======================================================================
// 1. IA-TESTS-BRIDGE.JS — Integração entre:
//    • engine → IA
//    • IA → logs-controller
//    • IA → HUD SOC
//    • Relatórios automáticos
// ----------------------------------------------------------------------
//  ✔ Mantém tudo que você já tinha
//  ✔ Apenas adiciona capacidades avançadas (C1, C2, C3)
//  ✔ Não altera logs-controller.js
//  ✔ Não altera chat-ui.js
// ======================================================================


// **********************************************************************
// 2. BLOCOS ORIGINAIS DO SEU ARQUIVO (mantidos exatamente como eram)
// **********************************************************************

// ======================================================================
// 2.1 — FUNÇÃO ORIGINAL: registrar incidente automaticamente
// ======================================================================
function registrarIncidenteIA(cenarioId) {
  const payload = {
    id: cenarioId,
    timestamp: Date.now(),

    severidade: "alta",
    impacto: "Automação detectou instabilidade funcional.",
    causaProvavel: "Componente apresentou comportamento inesperado.",
    acaoRecomendada: "Revisar passo do teste e validar fluxo."
  };

  window.dispatchEvent(
    new CustomEvent("cenario:diagnostico", { detail: payload })
  );
}


// ======================================================================
// 2.2 — EVENTO ORIGINAL: tests-engine detectou anomalia
// ======================================================================
addEventListener("testes:anomalia", (ev) => {
  const id = ev.detail?.cenario;
  if (!id) return;

  registrarIncidenteIA(id);
});


// ======================================================================
// 2.3 — EVENTO ORIGINAL: ciclo finalizado
// ======================================================================
addEventListener("testes:finalizar", () => {
  console.log("📘 [IA] Testes finalizados. IA pronta para relatório futuro.");
});


// ======================================================================
// 2.4 — DEBUG ORIGINAL
// ======================================================================
window.__iaTests = {
  registrarIncidenteIA
};


// ======================================================================
// 2.5 — EVENTO ORIGINAL: resumo dos testes
// ======================================================================
addEventListener("testes:resumo", (ev) => {
  const resumo = ev.detail;

  let msg = `📊 *Resumo do ciclo de testes*\n`;
  msg += `🕒 Horário: ${resumo.horario}\n`;
  msg += `🔍 Verificações: ${resumo.totalChecks}\n`;
  msg += `❌ Erros: ${resumo.totalErros}\n\n`;

  for (const c in resumo.errosPorCenario) {
    msg += `• ${c}: ${resumo.errosPorCenario[c]} falhas\n`;
  }

  window.chatAviso(msg);
});


// **********************************************************************
// 3. NOVOS BLOCOS — C1, C2, C3 + HUD SOC
// **********************************************************************

import { obterLogs } from "./logs-controller.js";


// ======================================================================
// 3.1 — C1: CLASSIFICADOR INTELIGENTE DE INCIDENTES
// ======================================================================
export function iaDetectarIncidente(texto) {
  const t = texto.toLowerCase();

  const indicadores = [
    "falha", "erro", "timeout", "não carregou", "travou",
    "status 500", "status 400", "indisponível", "não respondeu"
  ];

  const encontrou = indicadores.some((i) => t.includes(i));

  if (!encontrou) {
    return {
      incidente: false,
      severidade: "normal",
      causaProvavel: "Nenhuma anomalia identificada."
    };
  }

  let severidade = "alta";
  if (t.includes("lento")) severidade = "media";
  if (t.includes("intermitente")) severidade = "media";

  return {
    incidente: true,
    severidade,
    causaProvavel: "Padrão de falha identificado pela IA.",
    acaoRecomendada: "Revisar fluxo e dependências."
  };
}


// ======================================================================
// 3.2 — C1: DISPARAR INCIDENTE IA PERSONALIZADO
// ======================================================================
export function dispararIncidenteIA(cenarioId, diagnostico) {
  const evento = new CustomEvent("cenario:diagnostico", {
    detail: {
      id: cenarioId,
      timestamp: Date.now(),
      ...diagnostico
    }
  });

  window.dispatchEvent(evento);
}


// ======================================================================
// 3.3 — C2: ANÁLISE DE HISTÓRICO
// ======================================================================
export function analisarHistorico(cenarioId) {
  const logs = obterLogs(cenarioId);
  if (!logs || logs.length === 0) {
    return {
      tendencia: "Sem dados",
      incidentesRecentes: 0,
      porcentagemFalha: 0,
    };
  }

  const ultimos = logs.slice(-10);
  const incidentes = ultimos.filter((l) => l.tipo === "incidente");
  const pct = Math.round((incidentes.length / ultimos.length) * 100);

  let tendencia = "Estável";
  if (pct >= 50) tendencia = "Piora acentuada";
  else if (pct >= 25) tendencia = "Instabilidade moderada";
  else if (pct === 0) tendencia = "Melhora";

  return {
    tendencia,
    incidentesRecentes: incidentes.length,
    porcentagemFalha: pct
  };
}


// ======================================================================
// 3.4 — C2: ATUALIZAR HUD SOC (a telinha que você mostrou no print)
// ======================================================================
export function atualizarHudSOC(cenarioId) {
  const dados = analisarHistorico(cenarioId);

  const elInc = document.getElementById("socIncidentesRecentes");
  const elPct = document.getElementById("socPercentFalhas");
  const elTend = document.getElementById("socTendencia");

  if (!elInc || !elPct || !elTend) return;

  elInc.textContent = dados.incidentesRecentes;
  elPct.textContent = dados.porcentagemFalha + "%";
  elTend.textContent = dados.tendencia;
}


// ======================================================================
// 3.5 — C3: RELATÓRIO AUTOMÁTICO IA
// ======================================================================
export function gerarRelatorioIA(cenarioId) {
  const logs = obterLogs(cenarioId);
  const hist = analisarHistorico(cenarioId);

  return `
📌 RELATÓRIO AUTOMÁTICO — IA
Cenário: ${cenarioId}

📍 Tendência: ${hist.tendencia}
📍 Incidentes recentes: ${hist.incidentesRecentes}
📍 % falhas: ${hist.porcentagemFalha}%

📝 Últimos eventos:
${logs
  .slice(-5)
  .map(
    (l) =>
      `• ${new Date(l.timestamp).toLocaleString()} — ${
        l.tipo
      } — ${l.acao || ""}`
  )
  .join("\n")}
  `;
}


// ======================================================================
// 3.6 — INTEGRAÇÃO: QUANDO IA detectar incidente → atualizar HUD SOC
// ======================================================================
window.addEventListener("cenario:diagnostico", (ev) => {
  const id = ev.detail.id;
  atualizarHudSOC(id);
});
