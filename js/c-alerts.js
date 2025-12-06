// ======================================================================
// c-alerts.js — Sistema de Alertas Inteligentes (Módulo C)
// ----------------------------------------------------------------------
// OBJETIVO:
//   • Detectar automaticamente quando a IA reconhece risco, instabilidade,
//     aumento de incidentes ou padrões repetitivos.
//   • Enviar mensagens automáticas ao chat (chatAviso).
//   • Reagir em tempo real aos dados processados no ia-monitor.js.
//
// INTEGRAÇÃO:
//   • Requer window.chatAviso (exposto pelo chat-ui.js).
//   • Reage ao resultado da função IAMonitor.analisarLote().
//   • Não altera layout, HUD ou IA — apenas dispara alertas.
//
// ESTE MÓDULO É ISOLADO:
//   ✔ Não modifica DOM diretamente (só usa chatAviso).
//   ✔ Não depende de tempo real ou timers.
//   ✔ É seguro para uso em produção.
// ======================================================================

// Evita erro se chatAviso não existir (exemplo: carregamento fora de ordem)
function enviarParaChat(msg) {
  if (window.chatAviso && typeof window.chatAviso === "function") {
    window.chatAviso(msg);
  } else {
    console.warn("c-alerts.js: chatAviso não disponível ainda.");
  }
}

// ======================================================================
// IAAlerts — Objeto principal do módulo
// • Mantém memória de alertas já disparados (para evitar spam)
// • Analisa resultado bruto vindo do IA Monitor
// • Dispara apenas quando algo realmente importante muda
// ======================================================================

export const IAAlerts = {
  // Memória de últimos estados para evitar repetição de alertas
  ultimoRisco: null,
  ultimaTendencia: null,
  ultimoPicoIncidentes: null,
  ultimoInsight: null,

  // ------------------------------------------------------------------
  // ANALISAR (chamado automaticamente após IAMonitor.analisarLote)
  // Recebe:
  //   resultado = {
  //      logsEnriquecidos: [...],
  //      tendencia: {
  //         nivelRisco: "Baixo|Médio|Alto|Crítico",
  //         variacaoIncidentes: Number,
  //         janelaAnterior: {...},
  //         janelaRecente: {...},
  //         insights: []
  //      }
  //   }
  // ------------------------------------------------------------------
  analisar(resultado) {
    if (!resultado || !resultado.tendencia) return;

    const t = resultado.tendencia;

    // ---------------------------------------------------------------
    // 1) ALERTA DE RISCO — Mudou risco? Envia alerta.
    // ---------------------------------------------------------------
    if (t.nivelRisco !== this.ultimoRisco) {
      this.ultimoRisco = t.nivelRisco;

      switch (t.nivelRisco) {
        case "Crítico":
          enviarParaChat("🔴 *Risco crítico detectado!* A IA recomenda ação imediata.");
          break;

        case "Alto":
          enviarParaChat("🟠 A IA identificou risco elevado — monitore de perto o cenário.");
          break;

        case "Médio":
          enviarParaChat("🟡 Há sinais de instabilidade. Continue acompanhando.");
          break;

        case "Baixo":
          enviarParaChat("🟢 Cenário saudável no momento.");
          break;
      }
    }

    // ---------------------------------------------------------------
    // 2) TENDÊNCIA DE INCIDENTES — Subindo ou descendo?
    // ---------------------------------------------------------------
    if (t.variacaoIncidentes !== this.ultimaTendencia) {
      this.ultimaTendencia = t.variacaoIncidentes;

      if (t.variacaoIncidentes > 50) {
        enviarParaChat("📈 *Aumento acelerado de incidentes!* (+50%). Risco potencial.");
      } else if (t.variacaoIncidentes > 20) {
        enviarParaChat("📊 Incidentes apresentando leve aumento.");
      } else if (t.variacaoIncidentes < -20) {
        enviarParaChat("📉 Redução significativa de incidentes. Cenário melhorando.");
      }
    }

    // ---------------------------------------------------------------
    // 3) PICO DE INCIDENTES RECENTES
    //    Se janela recente tiver muitos incidentes → alerta
    // ---------------------------------------------------------------
    const recentes = t.janelaRecente.incidentes;

    if (recentes >= 4 && this.ultimoPicoIncidentes !== recentes) {
      this.ultimoPicoIncidentes = recentes;

      enviarParaChat(
        `🔥 *Pico de incidentes detectado!* ${recentes} ocorrências recentes.`
      );
    }

    // ---------------------------------------------------------------
    // 4) INSIGHTS IMPORTANTES — Seleciona o mais relevante
    // ---------------------------------------------------------------
    if (Array.isArray(t.insights) && t.insights.length > 0) {
      const insightPrincipal = t.insights[0];

      if (insightPrincipal !== this.ultimoInsight) {
        this.ultimoInsight = insightPrincipal;

        enviarParaChat(`🔮 Insight da IA: ${insightPrincipal}`);
      }
    }
  },
};

// Torna o módulo acessível globalmente (ia-monitor.js usa isto)
window.IAAlerts = IAAlerts;

console.log("✨ Módulo de alertas inteligentes (C-alerts) carregado com sucesso.");
