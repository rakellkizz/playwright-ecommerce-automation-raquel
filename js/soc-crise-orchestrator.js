// ======================================================================
// soc-crise-orchestrator.js — Orquestrador de Crise SOC
// ----------------------------------------------------------------------
// OBJETIVO:
// • Conectar eventos técnicos (P1 / erro crítico) às ações operacionais
// • Disparar automaticamente o fluxo de crise no CHAT e no SOC
// • Eliminar uso de F12 / console
//
// O QUE ESTE ARQUIVO NÃO FAZ:
// • NÃO muda layout
// • NÃO muda cards
// • NÃO altera collector
// • NÃO cria estado próprio
//
// REGRA DE OURO:
// • Apenas escuta eventos
// • Apenas dispara eventos já existentes
// ======================================================================


// ======================================================================
// 🛡️ GUARD GLOBAL — impede execução dupla do orquestrador
// ----------------------------------------------------------------------
// Cenário real:
// • HTML duplicado
// • Hot reload
// • Import acidental
//
// Resultado:
// • Nada quebra
// • Nenhum listener duplica
// ======================================================================
if (window.__socCriseOrchestratorLoaded) {
  // Já carregado → não faz nada
} else {
  window.__socCriseOrchestratorLoaded = true;

  // ====================================================================
  // 1) HELPERS — utilidades internas (sem estado)
  // ====================================================================

  /**
   * Dispara evento CustomEvent de forma segura
   */
  function emitirEvento(nome, detail = {}) {
    try {
      window.dispatchEvent(new CustomEvent(nome, { detail }));
    } catch (_) {
      // silencioso por segurança
    }
  }

  /**
   * Envia mensagem operacional para o chat SOC
   * Usa API EXISTENTE do chat (não cria nada novo)
   */
  function enviarMensagemChatSoc(texto) {
    try {
      if (typeof window.addMensagemSocAcao === "function") {
        window.addMensagemSocAcao(texto);
      }
    } catch (_) {}
  }

  /**
   * Gera ID simples de sala (fallback)
   */
  function gerarSalaId() {
    return `SOC-${new Date().toISOString().slice(0, 10)}-${Math.floor(Math.random() * 9999)}`;
  }

  // ====================================================================
  // 2) FLUXO DE CRISE — função central
  // --------------------------------------------------------------------
  // Essa função representa:
  // "⚠️ Temos uma crise → iniciar resposta operacional"
  // ====================================================================
  function iniciarFluxoDeCrise(origem = "sistema", cenario = null) {
    const salaAtual = window.socCollector?.getState()?.sala || gerarSalaId();

    // ------------------------------------------------------------
    // 2.1) Dispara evento SOC → continuar análise
    // (SOC Collector já sabe lidar com isso)
    // ------------------------------------------------------------
    emitirEvento("soc:continuar_analise", {
      sala: salaAtual,
      decisao: "crise_detectada",
      origem,
      tipoNarrativo: "abertura_crise"
    });

    // ------------------------------------------------------------
    // 2.2) Injeta mensagem operacional no chat
    // ------------------------------------------------------------
    enviarMensagemChatSoc(
      `🆘 <strong>CRISE DETECTADA</strong><br/>
       ${cenario ? `Cenário afetado: <strong>${cenario}</strong><br/>` : ""}
       Sala de crise preparada.<br/>
       Selecione uma ação abaixo para continuar.`
    );

    // ------------------------------------------------------------
    // 2.3) (Opcional) Log técnico SOC
    // ------------------------------------------------------------
    try {
      window.socLog?.({
        type: "soc_crise_orquestrada",
        cenario,
        origem,
        sala: salaAtual
      });
    } catch (_) {}
  }

  // ====================================================================
  // 3) LISTENERS — conexão real com o sistema
  // ====================================================================

  // ====================================================================
  // 3.1) TESTES:ERRO-CRITICO  (P1)
  // --------------------------------------------------------------------
  // Este é o gatilho PRINCIPAL.
  //
  // Quando:
  // • cards-status detecta erro crítico
  // • IA confirma impacto real
  //
  // Então:
  // • Orquestrador inicia crise automaticamente
  // ====================================================================
  window.addEventListener("testes:erro-critico", (ev) => {
    const cenario = ev?.detail?.cenario || null;

    iniciarFluxoDeCrise("testes:erro-critico", cenario);
  });


  // ====================================================================
  // 3.2) SOC:SEVERIDADE_UPDATE  (opcional, redundância segura)
  // --------------------------------------------------------------------
  // Se por algum motivo o erro crítico vier via severidade (P1),
  // garantimos que o fluxo também seja iniciado.
  //
  // REGRA:
  // • Só reage se subir para P1
  // ====================================================================
  window.addEventListener("soc_severidade_update", (ev) => {
    const para = ev?.detail?.para;

    if (para === "P1") {
      iniciarFluxoDeCrise("soc_severidade_update", null);
    }
  });


  // ====================================================================
  // 3.3) DEBUG CONTROLADO (SEM F12)
  // --------------------------------------------------------------------
  // Permite simular crise via URL:
  // index.html?debug=crise
  //
  // NÃO afeta produção
  // NÃO roda se não for solicitado
  // ====================================================================
  (function debugPorURL() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("debug") === "crise") {
        iniciarFluxoDeCrise("debug:url", "simulado");
      }
    } catch (_) {}
  })();


  // ====================================================================
  // 4) EXPOSIÇÃO CONTROLADA (opcional)
  // --------------------------------------------------------------------
  // NÃO é para uso comum
  // Útil para testes automatizados (Playwright / Allure)
  // ====================================================================
  window.__socCrise = {
    iniciar: iniciarFluxoDeCrise
  };

  // ======================================================================
// 5) CLIQUE EM "ABRIR SALA" — finaliza fluxo de crise
// ----------------------------------------------------------------------
// Estratégia:
// • O chat já emite uma ação SOC quando o botão é clicado
// • Aqui apenas OBSERVAMOS e CONCLUÍMOS o fluxo
// • Sem mexer no chat-ui.js
// ======================================================================

window.addEventListener("soc:abrir_sala", (ev) => {
  try {
    // Sala já criada ou em uso
    const salaId =
      ev?.detail?.sala ||
      window.socCollector?.getState()?.sala ||
      `SOC-${Date.now()}`;

    // URL simulada / padrão (pode evoluir depois)
    const salaUrl = `https://meet.google.com/${salaId}`;

    // ------------------------------------------------------------
    // Dispara evento OFICIAL que o sistema inteiro já entende
    // ------------------------------------------------------------
    window.dispatchEvent(
      new CustomEvent("crise:link", {
        detail: {
          url: salaUrl,
          origem: "soc-crise-orchestrator"
        }
      })
    );

    // ------------------------------------------------------------
    // Feedback no chat (opcional, só informativo)
    // ------------------------------------------------------------
    if (typeof window.addMensagemSocAcao === "function") {
      window.addMensagemSocAcao(
        `🔗 <strong>Sala de Crise ativada</strong><br/>
         <a href="${salaUrl}" target="_blank">${salaUrl}</a>`
      );
    }
     // ------------------------------------------------------------
    // 🔔 SINCRONIZA CHAT → SOC OPS → DASHBOARD HOLOGRAMA
    // ------------------------------------------------------------
    sincronizarSocOpsEHolograma("chat:abrir_sala");

  } catch (_) {
    // silencioso por segurança
  }
});
// ======================================================================
// 6) SINCRONIZAÇÃO COM SOC OPS (DEBUG) + DASHBOARD HOLOGRAMA
// ----------------------------------------------------------------------
// Objetivo:
// • Fazer o "Abrir Sala" do CHAT equivaler ao clique no SOC Ops
// • Forçar atualização visual do painel holograma
// • Sem duplicar lógica
// ======================================================================

function sincronizarSocOpsEHolograma(origem = "chat") {
  try {
    const resumo = window.socCollector?.gerarResumoSoc?.();
    if (!resumo) return;

    // ------------------------------------------------------------
    // 1) Evento usado pelo SOC Ops (Debug)
    // (simula acionamento operacional)
    // ------------------------------------------------------------
    window.dispatchEvent(
      new CustomEvent("soc:ops_acionado", {
        detail: {
          origem,
          sala: resumo.sala,
          salaLink: resumo.salaLink,
          severidade: resumo.severidade
        }
      })
    );

    // ------------------------------------------------------------
    // 2) Evento de refresh do Dashboard Holograma
    // ------------------------------------------------------------
    window.dispatchEvent(
      new CustomEvent("soc:dashboard_refresh", {
        detail: resumo
      })
    );

    // ------------------------------------------------------------
    // 3) Fallback universal (caso dashboard escute isso)
    // ------------------------------------------------------------
    window.dispatchEvent(
      new CustomEvent("soc:state_updated", {
        detail: resumo
      })
    );

  } catch (_) {
    // silencioso por segurança
  }
}
  // ====================================================================
  // FIM DO ORQUESTRADOR
  // ====================================================================
}
