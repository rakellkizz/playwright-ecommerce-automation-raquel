// ======================================================================
// 1. ia-tests-bridge.js — Ponte entre ENGINE de testes, IA e LOGS
// ----------------------------------------------------------------------
// O QUE ESTE ARQUIVO FAZ:
//   • 1.1 Quando a engine detecta anomalia → dispara incidente IA (C1).
//   • 1.2 Quando a engine finaliza ciclo   → gera resumo bonito no chat.
//   • 1.3 Quando a engine envia "testes:resumo":
//         - Busca logs do localStorage (logs-controller.js)
//         - Chama IAMonitor.analisarLote (C1 + C2)
//         - Gera mensagem inteligente de risco/tendência no chat.
// ----------------------------------------------------------------------
// NÃO ALTERA:
//   ✘ Layout
//   ✘ CSS
//   ✘ Estrutura do modal
//   ✘ Temporizador
// ======================================================================


// ======================================================================
// 2. Incident helper — registrar incidente IA automaticamente (C1)
// ======================================================================
function registrarIncidenteIA(cenarioId) {
  const payload = {
    id: cenarioId,
    timestamp: Date.now(),

    // 2.1 — Conteúdo simbólico (já compatível com logs-controller.js)
    severidade: "alta",
    impacto: "Automação detectou instabilidade funcional.",
    causaProvavel: "Comportamento inesperado no cenário automatizado.",
    acaoRecomendada: "Revisar passos do teste e validar fluxo de negócio."
  };

  // 2.2 — Evento padrão já entendido pelo logs-controller.js
  window.dispatchEvent(
    new CustomEvent("cenario:diagnostico", { detail: payload })
  );
}


// ======================================================================
// 3. Evento: testes:anomalia
// ----------------------------------------------------------------------
// Disparado pela engine (tests-engine.js) quando um cenário falha.
// Aqui a IA registra o incidente automaticamente no sistema de logs.
// ======================================================================
addEventListener("testes:anomalia", (ev) => {
  const id = ev.detail?.cenario;
  if (!id) return;

  registrarIncidenteIA(id);
});


// ======================================================================
// 4. Evento: testes:finalizar
// ----------------------------------------------------------------------
// Apenas log informativo (pode ser usado futuramente).
// ======================================================================
addEventListener("testes:finalizar", () => {
  console.log("📘 [IA] Testes finalizados. IA pronta para análise do resumo.");
});


// ======================================================================
// 5. Função auxiliar — montar resumo simples no chat
// ----------------------------------------------------------------------
// Usa somente os dados do evento testes:resumo (já existia antes).
// ======================================================================
function montarResumoBasico(resumo) {
  let msg = `📊 *Resumo do ciclo de testes*\n`;
  msg += `🕒 Horário: ${resumo.horario}\n`;
  msg += `🔍 Verificações: ${resumo.totalChecks}\n`;
  msg += `❌ Erros: ${resumo.totalErros}\n\n`;

  for (const c in resumo.errosPorCenario) {
    msg += `• ${c}: ${resumo.errosPorCenario[c]} falhas\n`;
  }

  return msg;
}


// ======================================================================
// 6. Função auxiliar — coletar LOGS para o IAMonitor (C1 + C2)
// ----------------------------------------------------------------------
// Usa a API exposta por logs-controller.js:
//   window.__logsDebug.carregarLogs()
// Estrutura esperada:
//   { login: [logs...], carrinho: [logs...], ... }
// ======================================================================
function coletarLogsParaIA() {
  if (!window.__logsDebug || typeof window.__logsDebug.carregarLogs !== "function") {
    return [];
  }

  const todos = window.__logsDebug.carregarLogs();
  const resultado = [];

  Object.keys(todos).forEach((cenarioId) => {
    const lista = todos[cenarioId] || [];
    lista.forEach((log) => {
      // 6.1 — Enriquecemos com o ID do cenário para o IAMonitor
      resultado.push({
        ...log,
        cenario: cenarioId
      });
    });
  });

  return resultado;
}


// ======================================================================
// 7. Função auxiliar — montar mensagem inteligente da IA (C2)
// ----------------------------------------------------------------------
// Entrada: objeto retornado por window.IAMonitor.analisarLote(lote)
// ======================================================================
function montarResumoInteligente(resultadoIA) {
  if (!resultadoIA || !resultadoIA.tendencia) {
    return "🤖 IA Monitor: ainda não há dados suficientes para análise de tendência.";
  }

  const t = resultadoIA.tendencia;

  const incAnt = t.janelaAnterior?.incidentes ?? 0;
  const incRec = t.janelaRecente?.incidentes ?? 0;
  const variacao = Math.round(t.variacaoIncidentes || 0);

  let msg = "🤖 *IA Monitor — Análise de Tendência*\n";
  msg += `⚠️ Nível de risco: *${t.nivelRisco}*\n`;
  msg += `📈 Incidentes (anterior → recente): ${incAnt} → ${incRec}\n`;
  msg += `📊 Variação de incidentes: ${variacao}%\n\n`;

  msg += "🔎 Leitura rápida:\n";

  switch (t.nivelRisco) {
    case "Crítico":
      msg += "• Muitos incidentes graves em pouco tempo. Priorizar investigação imediata.\n";
      break;
    case "Alto":
      msg += "• Aumento relevante de falhas. Recomenda-se revisão dos cenários instáveis.\n";
      break;
    case "Médio":
      msg += "• Pequena oscilação com alguns incidentes. Manter monitoramento próximo.\n";
      break;
    default:
      msg += "• Cenário estável com poucas falhas recentes.\n";
      break;
  }

  return msg;
}


// ======================================================================
// 8. Evento: testes:resumo
// ----------------------------------------------------------------------
// Disparado pela engine ao final de um ciclo.
// Aqui unificamos:
//   • resumo básico dos testes
//   • análise inteligente da IA (se disponível)
//   • entrega tudo no chat (chatAviso), sem quebrar nada existente.
// ======================================================================
addEventListener("testes:resumo", (ev) => {
  const resumo = ev.detail;
  if (!resumo) return;

  // 8.1 — Primeiro: resumo padrão do ciclo
  const msgBasico = montarResumoBasico(resumo);

  if (window.chatAviso) {
    window.chatAviso(msgBasico);
  } else {
    console.log("[IA Tests Bridge] chatAviso não disponível. Resumo básico:", msgBasico);
  }

  // 8.2 — Depois: se houver IAMonitor + logs, gera análise C1/C2
  if (window.IAMonitor && typeof window.IAMonitor.analisarLote === "function") {
    const lote = coletarLogsParaIA();

    if (lote.length) {
      try {
        const resultadoIA = window.IAMonitor.analisarLote(lote);
        const msgIA = montarResumoInteligente(resultadoIA);

        if (window.chatAviso) {
          window.chatAviso(msgIA);
        } else {
          console.log("[IA Tests Bridge] Resumo IA:", msgIA);
        }
      } catch (e) {
        console.warn("IA Tests Bridge: falha ao analisar lote no IAMonitor:", e);
      }
    }
  }
});


// ======================================================================
// 9. Debug opcional para técnicos
// ----------------------------------------------------------------------
// Permite testar manualmente no console, ex.:
//   __iaTests.registrarIncidenteIA("login")
// ======================================================================
window.__iaTests = {
  registrarIncidenteIA
};
