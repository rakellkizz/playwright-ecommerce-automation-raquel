// ============================================================== 
// cards-status.js — Controle visual dos cards durante os testes
// ----------------------------------------------------------------------
//  ✔ LED verde pulsando enquanto testes estão rodando
//  ✔ Card entra em “modo análise” quando o temporizador inicia
//  ✔ Recebe anomalias e ativa alerta (P3 → amarelo)
//  ✔ Recebe erro crítico e ativa alerta vermelho (P1)
//  ✔ Recebe manutenção manual (amarelo)
//  ✔ Sai do modo testes quando o temporizador termina
//  ✔ NÃO remove pulsação
//  ✔ NÃO interfere no logs-controller.js nem no chat
// ======================================================================


// ======================================================================
// 🛡️ GUARD GLOBAL — Anti-duplicação (load/import acidental 2x)
// ----------------------------------------------------------------------
// Por que isso existe?
// • Em projetos com muitos <script type="module"> (e principalmente quando
//   alguém duplica uma tag no HTML), é comum o mesmo arquivo ser executado
//   duas vezes.
// • Isso causa:
//   - listeners duplicados
//   - estados “indo e voltando”
//   - logs repetidos
//   - comportamento imprevisível
//
// Regra:
// • Se este arquivo já rodou uma vez, ele NÃO registra tudo de novo.
// ======================================================================
if (window.__cardsStatusLoaded) {
  // Se já carregou, não faz nada.
  // (Mantém o sistema estável e evita duplicação de listeners)
} else {
  window.__cardsStatusLoaded = true;

  // ============================================================
  // 🔒 PROTEÇÃO DE ESTADO — REGRA MESTRA DO SISTEMA
  // ------------------------------------------------------------
  // • Manutenção é SOBERANA
  // • Automação NÃO sobrescreve técnico
  // • Anomalia NÃO some sozinha
  // ============================================================
  function podeAlterarEstado(card, novoStatus) {
    const estadoAtual = card.dataset.status;

    // 🚫 Se está em manutenção, ninguém muda
    if (estadoAtual === "manutencao" && novoStatus !== "manutencao") {
      return false;
    }

    return true;
  }


  // ============================================================
  // 1) BADGE — reflete estado (OK / Manutenção / Anomalia / Crise)
  // ============================================================
  function atualizarBadgeCenario(card, status) {
    if (!card) return;

    const badge = card.querySelector("[data-cenario-badge]");
    if (!badge) return;

    // Limpa variações visuais do badge (sem mexer em layout)
    badge.classList.remove(
      "cenario-badge--ok",
      "cenario-badge--manutencao",
      "cenario-badge--critico"
    );

    // 🔴 Crise (P1 confirmado)
    if (status === "critico") {
      badge.textContent = "🚨 Crise";
      badge.classList.add("cenario-badge--critico");
      return;
    }

    // 🟡 Manutenção (P2) — soberana
    if (status === "manutencao") {
      badge.textContent = "🟡 Manutenção";
      badge.classList.add("cenario-badge--manutencao");
      return;
    }

    // 🟡 Anomalia (P3) — usa mesma “família visual” da manutenção
    // (Você optou por reaproveitar a classe do amarelo, perfeito)
    if (status === "anomalia") {
      badge.textContent = "⚠️ Anomalia detectada";
      badge.classList.add("cenario-badge--manutencao");
      return;
    }

    // 🟢 OK
    badge.textContent = "✅ Cenário OK";
    badge.classList.add("cenario-badge--ok");
  }


  // ======================================================================
  // 2) SOC LOG — registra SOMENTE quando status muda
  // ----------------------------------------------------------------------
  // Importante:
  // • Este método já é um "de-dup" natural: só loga se mudou.
  // • Mantemos como fonte única de auditoria via window.socLog().
  // ======================================================================
  function socSetStatus(cenarioId, novoStatus, origem = "cards-status") {
    const card = document.querySelector(`.cenario-card[data-cenario="${cenarioId}"]`);
    if (!card) return false;

    const atual = card.dataset.status || "";
    if (atual === novoStatus) return false;

    // Atualiza o dataset do card (estado corrente)
    card.dataset.status = novoStatus;

    // Auditoria técnica (se existir)
    try {
      if (typeof window.socLog === "function") {
        window.socLog({
          type: "card_status",
          cenario: cenarioId,
          status: novoStatus,
          origem
        });
      }
    } catch (_) {}

    return true;
  }


  // ======================================================================
  // LED VERDE — indica execução de testes (pulsação CSS)
  // ======================================================================
  function ativarLEDVerde(card) {
    if (!card) return;
    if (card.querySelector(".cenario-led")) return;

    const led = document.createElement("div");
    led.className = "cenario-led";
    card.prepend(led);
  }

  function removerLED(card) {
    const led = card.querySelector(".cenario-led");
    if (led) led.remove();
  }


  // ======================================================================
  // MODO ANÁLISE — testes rodando
  // ======================================================================
  function ativarModoAnalise(cenarioId) {
    const card = document.querySelector(`.cenario-card[data-cenario="${cenarioId}"]`);
    if (!card) return;

    if (!podeAlterarEstado(card, "analise")) return;

    // Limpa estados visuais anteriores
    card.classList.remove(
      "cenario-alerta",
      "cenario-manutencao",
      "cenario-ok",
      "cenario-critico"
    );

    // Sinaliza testes rodando
    ativarLEDVerde(card);

    // Estado do card
    card.dataset.status = "analise";
    socSetStatus(cenarioId, "analise", "ativarModoAnalise");

    // Badge em OK enquanto analisa (design: análise ≠ incidente)
    atualizarBadgeCenario(card, "ok");
  }


  // ======================================================================
  // ANOMALIA — P3 (automação / sistema) → AMARELO
  // ======================================================================
  function ativarAnomalia(cenarioId) {
    const card = document.querySelector(`.cenario-card[data-cenario="${cenarioId}"]`);
    if (!card) return;

    if (!podeAlterarEstado(card, "anomalia")) return;

    removerLED(card);

    // 🟡 LIMPA ESTADOS CRÍTICOS, mas NÃO vira vermelho
    card.classList.remove(
      "cenario-alerta",
      "cenario-ok",
      "cenario-critico"
    );

    // Reusa classe amarela já existente
    card.classList.add("cenario-manutencao");

    // Estado lógico
    card.dataset.status = "anomalia";

    socSetStatus(cenarioId, "anomalia", "ativarAnomalia");
    atualizarBadgeCenario(card, "anomalia");
  }


  // ======================================================================
  // ERRO CRÍTICO — P1 (confirmado)
  // ======================================================================
  function ativarErroCritico(cenarioId) {
    const card = document.querySelector(`.cenario-card[data-cenario="${cenarioId}"]`);
    if (!card) return;

    if (!podeAlterarEstado(card, "erro")) return;

    removerLED(card);

    // Remove amarelo/ok antes de virar crítico
    card.classList.remove(
      "cenario-manutencao",
      "cenario-ok"
    );

    // 🔴 Crise
    card.classList.add("cenario-alerta");
    card.dataset.status = "erro";

    socSetStatus(cenarioId, "erro", "ativarErroCritico");
    atualizarBadgeCenario(card, "critico");
  }


  // ======================================================================
  // MANUTENÇÃO — amarelo (técnico)
  // ======================================================================
  function ativarManutencao(cenarioId) {
    const card = document.querySelector(`.cenario-card[data-cenario="${cenarioId}"]`);
    if (!card) return;

    if (!podeAlterarEstado(card, "manutencao")) return;

    removerLED(card);

    card.classList.remove(
      "cenario-alerta",
      "cenario-ok",
      "cenario-critico"
    );

    card.classList.add("cenario-manutencao");
    card.dataset.status = "manutencao";

    socSetStatus(cenarioId, "manutencao", "ativarManutencao");
    atualizarBadgeCenario(card, "manutencao");
  }


  // ======================================================================
  // OK — somente quando realmente permitido
  // ----------------------------------------------------------------------
  // Regra:
  // • erro (P1) não volta sozinho
  // • manutencao (P2) não volta sozinho
  // • anomalia (P3) também NÃO volta sozinha (persistência)
  //   -> OBS: esse bloqueio é garantido pelo evento "testes:finalizar"
  // ======================================================================
  function marcarOK(cenarioId) {
    const card = document.querySelector(`.cenario-card[data-cenario="${cenarioId}"]`);
    if (!card) return;

    if (
      card.dataset.status === "erro" ||
      card.dataset.status === "manutencao"
    ) {
      return;
    }

    removerLED(card);

    card.classList.remove(
      "cenario-alerta",
      "cenario-manutencao",
      "cenario-critico"
    );

    card.classList.add("cenario-ok");
    card.dataset.status = "ok";

    socSetStatus(cenarioId, "ok", "marcarOK");
    atualizarBadgeCenario(card, "ok");
  }


  // ======================================================================
  // EVENTOS — Orquestração de estados dos cards (SOC-aware)
  // ----------------------------------------------------------------------
  // Regras importantes:
  // • Eventos controlam APENAS o estado visual dos cards
  // • Nenhum evento resolve incidentes automaticamente
  // • Temporizador controla execução, NÃO resolução
  // • Anomalias persistem até ação humana
  // ======================================================================


  // ======================================================================
  // TESTES:INICIAR
  // ----------------------------------------------------------------------
  // Disparado quando o temporizador inicia um ciclo de testes
  // Comportamento esperado:
  // • Todos os cenários entram em "modo análise"
  // • LED verde pulsante é ativado
  // • NÃO limpa anomalias antigas (proteção via podeAlterarEstado)
  // ======================================================================
  addEventListener("testes:iniciar", () => {
    document.querySelectorAll(".cenario-card").forEach(card => {
      ativarModoAnalise(card.dataset.cenario);
    });
  });


  // ======================================================================
  // TESTES:ANOMALIA  (P3)
  // ----------------------------------------------------------------------
  // Disparado automaticamente pelo sistema / IA / SOC Collector
  // Representa:
  // • Anomalia detectada
  // • Ainda NÃO confirmada como incidente crítico
  // Comportamento:
  // • Card fica AMARELO
  // • Estado persiste após o fim do temporizador
  // ======================================================================
  addEventListener("testes:anomalia", (ev) => {
    const id = ev.detail?.cenario;
    if (!id) return;

    ativarAnomalia(id);
  });


  // ======================================================================
  // TESTES:ERRO-CRITICO  (P1)
  // ----------------------------------------------------------------------
  // Disparado quando há confirmação de impacto real
  // Exemplos:
  // • Erro 500 em produção
  // • Checkout fora do ar
  // • Pagamento indisponível
  // Comportamento:
  // • Card fica VERMELHO
  // • Estado persiste até resolução explícita
  // ======================================================================
  addEventListener("testes:erro-critico", (ev) => {
    const id = ev.detail?.cenario;
    if (!id) return;

    ativarErroCritico(id);
  });


  // ======================================================================
  // TESTES:MANUTENCAO  (P2)
  // ----------------------------------------------------------------------
  // Disparado por ação humana (técnico)
  // Representa:
  // • Incidente/anomalia sob investigação
  // • Trabalho em andamento
  // Regra SOC:
  // • Manutenção é SOBERANA
  // • Automação NÃO sobrescreve manutenção
  // Comportamento:
  // • Card fica AMARELO
  // • Estado persiste após o fim do temporizador
  // ======================================================================
  addEventListener("testes:manutencao", (ev) => {
    const id = ev.detail?.cenario;
    if (!id) return;

    ativarManutencao(id);
  });


  // ======================================================================
  // TESTES:FINALIZAR
  // ----------------------------------------------------------------------
  // Disparado quando o temporizador encerra o ciclo de testes
  //
  // ⚠️ REGRA SOC FUNDAMENTAL:
  // • O fim dos testes NÃO resolve problemas
  // • Anomalias, manutenções e incidentes DEVEM persistir
  //
  // Comportamento correto:
  // • Apenas cenários em "analise" voltam para OK
  // • Estados P3 (anomalia), P2 (manutenção) e P1 (erro crítico) permanecem
  // ======================================================================
  addEventListener("testes:finalizar", () => {
    document.querySelectorAll(".cenario-card").forEach(card => {
      const status = card.dataset.status;

      // ✅ Apenas análise automática é finalizada
      if (status === "analise") {
        marcarOK(card.dataset.cenario);
      }

      // ❌ NÃO faz nada para:
      // - anomalia (P3)
      // - manutencao (P2)
      // - erro (P1)
    });
  });


  // ======================================================================
  // Exposição para testes manuais
  // ----------------------------------------------------------------------
  // Mantemos exatamente como você já usa.
  // (Útil para debug, e o painel SOC Ops pode chamar isso também)
  // ======================================================================
  window.cardsStatus = {
    ativarModoAnalise,
    ativarAnomalia,
    ativarErroCritico,
    ativarManutencao,
    marcarOK
  };

  // ======================================================================
  // Fim do cards-status.js
  // ======================================================================
}
