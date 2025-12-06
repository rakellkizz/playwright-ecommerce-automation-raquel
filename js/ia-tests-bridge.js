// ======================================================================
// ia-tests-bridge.js — Integração dos testes automáticos com IA + Logs
// ----------------------------------------------------------------------
//  ✔ Quando o tests-engine detecta anomalia → IA registra como incidente
//  ✔ Quando ciclo termina → IA envia resumo opcional (futuro)
//  ✔ NÃO altera logs-controller.js
//  ✔ NÃO altera chat-ui.js
// ======================================================================


// ======================================================================
// FUNÇÃO: registrar incidente automaticamente
// ----------------------------------------------------------------------
// Envia um evento idêntico ao que a IA já gera hoje:
//   window.dispatchEvent(new CustomEvent("cenario:diagnostico", {...}))
// ======================================================================
function registrarIncidenteIA(cenarioId) {
  const payload = {
    id: cenarioId,
    timestamp: Date.now(),

    // Conteúdo simbólico (pode ser evoluído depois)
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
// EVENTO: Quando engine detecta anomalia
// ======================================================================
addEventListener("testes:anomalia", (ev) => {
  const id = ev.detail?.cenario;
  if (!id) return;

  // IA registra incidente no sistema de logs
  registrarIncidenteIA(id);
});


// ======================================================================
// EVENTO: Quando engine finaliza ciclo
// ======================================================================
addEventListener("testes:finalizar", () => {
  console.log("📘 [IA] Testes finalizados. IA pronta para relatório futuro.");
});


// ======================================================================
// Debug opcional para técnicos
// ======================================================================
window.__iaTests = {
  registrarIncidenteIA
};
// ======================================================================
// RESUMO FINAL — enviado pela telemetria automaticamente
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

  // Mensagem bonita no chat
  window.chatAviso(msg);
});
