/// ==============================================================
// cards-status.js — Controle visual dos cards durante os testes
// ================================================================
// ✔ LED verde pulsando enquanto testes estão rodando
// ✔ Card entra em “modo análise” quando o temporizador inicia
// ✔ Recebe anomalias e ativa alerta (P3 → amarelo)
// ✔ Recebe erro crítico e ativa alerta vermelho (P1)
// ✔ Recebe manutenção manual (amarelo)
// ✔ Sai do modo testes quando o temporizador termina
// ✔ NÃO remove pulsação
// ✔ NÃO interfere no logs-controller.js nem no chat
// ==============================================================

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
// 1) BADGE — reflete estado (OK / Manutenção / Anomalia)
// ============================================================
function atualizarBadgeCenario(card, status) {
  if (!card) return;

    const badge = card.querySelector("[data-cenario-badge]");
    if (!badge) return;

  badge.classList.remove(
    "cenario-badge--ok",
    "cenario-badge--manutencao",
    "cenario-badge--critico"
  );

  if (status === "erro" || status === "critico") {
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

  badge.textContent = "✅ Cenário OK";
  badge.classList.add("cenario-badge--ok");
}


// ======================================================================
// 2) SOC LOG — registra SOMENTE quando status muda
// ======================================================================
function socSetStatus(cenarioId, novoStatus, origem = "cards-status") {
  const card = document.querySelector(`.cenario-card[data-cenario="${cenarioId}"]`);
  if (!card) return false;

  const atual = card.dataset.status || "";
  if (atual === novoStatus) return false;

    // Atualiza o dataset do card (estado corrente)
    card.dataset.status = novoStatus;

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

  card.classList.remove(
    "cenario-alerta",
    "cenario-manutencao",
    "cenario-ok",
    "cenario-critico"
  );

  ativarLEDVerde(card);

  card.dataset.status = "analise";
  socSetStatus(cenarioId, "analise", "ativarModoAnalise");

  atualizarBadgeCenario(card, "ok");
}


// ======================================================================
// ANOMALIA — vermelho (automação / sistema)
// ======================================================================
function ativarAnomalia(cenarioId) {
  const card = document.querySelector(`.cenario-card[data-cenario="${cenarioId}"]`);
  if (!card) return;

  if (!podeAlterarEstado(card, "erro")) return;

  removerLED(card);

  // 🔴 LIMPA QUALQUER ESTADO ANTES DO VERMELHO
  card.classList.remove(
    "cenario-manutencao",
    "cenario-ok",
    "cenario-critico"
  );

  card.classList.add("cenario-alerta");
  card.dataset.status = "erro";

  socSetStatus(cenarioId, "erro", "ativarAnomalia");
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

  // 🟡 LIMPA QUALQUER ESTADO CRÍTICO
  card.classList.remove(
    "cenario-alerta",
    "cenario-erro",
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
// EVENTOS
// ======================================================================
addEventListener("testes:iniciar", () => {
  document.querySelectorAll(".cenario-card").forEach(card => {
    ativarModoAnalise(card.dataset.cenario);
  });
});

addEventListener("testes:anomalia", (ev) => {
  const id = ev.detail?.cenario;
  if (id) ativarAnomalia(id);
});

addEventListener("testes:manutencao", (ev) => {
  const id = ev.detail?.cenario;
  if (id) ativarManutencao(id);
});

addEventListener("testes:finalizar", () => {
  document.querySelectorAll(".cenario-card").forEach(card => {
    if (
      card.dataset.status !== "erro" &&
      card.dataset.status !== "manutencao"
    ) {
      marcarOK(card.dataset.cenario);
    }
  });
});


// ======================================================================
// Exposição para testes manuais
// ======================================================================
window.cardsStatus = {
  ativarModoAnalise,
  ativarAnomalia,
  ativarManutencao,
  marcarOK
};
