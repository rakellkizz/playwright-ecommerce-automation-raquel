// ======================================================================
// cards-status.js — Controle visual dos cards durante os testes
// ----------------------------------------------------------------------
//  ✔ LED verde pulsando enquanto testes estão rodando
//  ✔ Card entra em “modo análise” quando o temporizador inicia
//  ✔ Recebe anomalias e ativa o alerta vermelho
//  ✔ Sai do modo testes quando o temporizador termina
//  ✔ Não interfere no logs-controller.js nem no chat
// ======================================================================

//  ============================================================
// 1) BADGE — atualiza o “Cenário OK” sem mexer no pulsar/LED
// ============================================================
function atualizarBadgeCenario(card, status) {
  if (!card) return;

  const badge = card.querySelector("[data-cenario-badge]");
  if (!badge) return;

  badge.classList.remove("cenario-badge--ok", "cenario-badge--manutencao", "cenario-badge--critico");

  if (status === "critico" || status === "erro") {
    badge.textContent = "🚨 Crise";
    badge.classList.add("cenario-badge--critico");
    return;
  }

  if (status === "manutencao") {
    badge.textContent = "🟡 Manutenção";
    badge.classList.add("cenario-badge--manutencao");
    return;
  }

  // padrão: ok / analise
  badge.textContent = "✅ Cenário OK";
  badge.classList.add("cenario-badge--ok");
}

// ======================================================================
// 2) SOC LOG — helper central (registra SOMENTE quando status muda)
// ======================================================================
function socSetStatus(cenarioId, novoStatus, origem = "cards-status") {
  const card = document.querySelector(
    `.cenario-card[data-cenario="${cenarioId}"]`
  );
  if (!card) return false;

  const atual = card.dataset.status || "";
  if (atual === novoStatus) return false; // 👈 evita duplicação

  card.dataset.status = novoStatus;

  try {
    if (typeof window.socLog === "function") {
      window.socLog({
        type: "card_status",
        cenario: cenarioId,
        status: novoStatus,
        origem: origem
      });
    }
  } catch (_) {}

  return true;
}
// ======================================================================
// FUNÇÃO: Ativar LED verde (indicando testes em execução)
// ======================================================================
function ativarLEDVerde(card) {
  if (!card) return;

  // Evita duplicar LED
  if (card.querySelector(".cenario-led")) return;

  const led = document.createElement("div");
  led.className = "cenario-led"; // classe que o CSS vai animar
  card.prepend(led);
}


// ======================================================================
// FUNÇÃO: Remover LED verde (quando testes acabam)
// ======================================================================
function removerLED(card) {
  const led = card.querySelector(".cenario-led");
  if (led) led.remove();
}


// ======================================================================
// FUNÇÃO: Entrar em MODO ANÁLISE (testes rodando)
// ======================================================================
function ativarModoAnalise(cenarioId) {
  const card = document.querySelector(`.cenario-card[data-cenario="${cenarioId}"]`);
  if (!card) return;

  // Remove erros anteriores
  card.classList.remove("cenario-alerta", "cenario-erro", "cenario-manutencao", "cenario-ok");

  // Coloca o LED verde
  ativarLEDVerde(card);

  // Estado interno visual opcional
  card.dataset.status = "analise";

  // SOC: registrando que o card entrou em análise
  socSetStatus(cenarioId, "analise", "ativarModoAnalise");

  // Atualiza badge para OK (padrão)
  atualizarBadgeCenario(card, "ok");
  }
  

// ======================================================================
// FUNÇÃO: Marcar como ANOMALIA DETECTADA
// ======================================================================
function ativarAnomalia(cenarioId) {
  const card = document.querySelector(`.cenario-card[data-cenario="${cenarioId}"]`);
  if (!card) return;

  removerLED(card);
  card.classList.add("cenario-alerta");
  card.dataset.status = "erro";

    // SOC: registrando que o card entrou em erro/anomalia
  socSetStatus(cenarioId, "erro", "ativarAnomalia");

    // Atualiza badge para Crítico
  atualizarBadgeCenario(card, "critico");

}


// ======================================================================
// FUNÇÃO: Voltar para estado OK
// ======================================================================
function marcarOK(cenarioId) {
  const card = document.querySelector(`.cenario-card[data-cenario="${cenarioId}"]`);
  if (!card) return;

  removerLED(card);
  card.classList.add("cenario-ok");
  card.dataset.status = "ok";

    // SOC: registrando que o card voltou para OK
  socSetStatus(cenarioId, "ok", "marcarOK");

    // Atualiza badge para OK
  atualizarBadgeCenario(card, "ok");


  
}


// ======================================================================
// EVENTO: Quando os testes começam
// ======================================================================
addEventListener("testes:iniciar", () => {
  document.querySelectorAll(".cenario-card").forEach(card => {
    const id = card.dataset.cenario;
    ativarModoAnalise(id);
  });
});


// ======================================================================
// EVENTO: Quando ocorre um tick (1 segundo do timer)
// Podemos adicionar lógica de monitoramento futuramente
// ======================================================================
addEventListener("testes:tick", (ev) => {
  // console.log("Tick recebido: ", ev.detail);
  // Aqui pode entrar lógica avançada se você quiser no futuro
});


// ======================================================================
// EVENTO: Quando uma anomalia real é detectada POR OUTRO MÓDULO
// (exemplo: IA, testes automáticos, etc.)
// ======================================================================
addEventListener("testes:anomalia", (ev) => {
  const id = ev.detail?.cenario;
  if (!id) return;

  ativarAnomalia(id);
});


// ======================================================================
// EVENTO: Quando os testes finalizam (timer zerou)
// ======================================================================
addEventListener("testes:finalizar", () => {
  document.querySelectorAll(".cenario-card").forEach(card => {
    const id = card.dataset.cenario;
    marcarOK(id);
  });
});


// ======================================================================
// Expor para testes manuais (opcional)
// ======================================================================
window.cardsStatus = {
  ativarModoAnalise,
  ativarAnomalia,
  marcarOK
};
// ======================================================================
// INTEGRAÇÃO EXTRA — Eventos disparados pelo tests-engine
// ----------------------------------------------------------------------
//  ✔ testes:ok-parcial → marca que o cenário continua estável
//  ✔ testes:mudar-status → comando explícito do engine
// ======================================================================

// Cenário passou na verificação daquele segundo
addEventListener("testes:ok-parcial", (ev) => {
  const id = ev.detail?.cenario;
  if (!id) return;

  // Mantém LED verde, remove qualquer erro antigo
  const card = document.querySelector(`.cenario-card[data-cenario="${id}"]`);
  if (!card) return;

  if (card.dataset.status !== "erro") {
    // continua verde, estável
    ativarLEDVerde(card);
    card.classList.remove("cenario-ok", "cenario-erro", "cenario-alerta");
    card.dataset.status = "analise";
  }
});


// Comando explícito do engine → mudar status geral
addEventListener("testes:mudar-status", (ev) => {
  const id = ev.detail?.cenario;
  const status = ev.detail?.status;
  const card = document.querySelector(`.cenario-card[data-cenario="${id}"]`);
atualizarBadgeCenario(card, status);

  if (!id || !status) return;

  if (status === "analise") {
    ativarModoAnalise(id);
  }
  else if (status === "ok") {
    marcarOK(id);
  }
  else if (status === "erro") {
    ativarAnomalia(id);
  }
});
// ============================================================
// FALSO POSITIVO — animação amarela no card
// ============================================================
addEventListener("testes:falso-positivo", (ev) => {
  const id = ev.detail.cenario;
  const card = document.querySelector(`.cenario-card[data-cenario="${id}"]`);

  if (card) {
    card.classList.add("cenario-falso-positivo");

    // SOC: registrando falso positivo (alerta amarelo)
    socLogCardStatus(id, "falso_positivo", "testes:falso-positivo");


    // Remove após 3 segundos
    setTimeout(() => {
      card.classList.remove("cenario-falso-positivo");
    }, 3000);
  }
});

