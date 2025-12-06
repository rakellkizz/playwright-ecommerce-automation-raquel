// ======================================================================
// logs-controller.js  —  VERSÃO 100% CORRIGIDA
// ======================================================================
// RESPONSÁVEL POR:
//
// ✔ Registrar logs por cenário em localStorage
// ✔ Abrir/fechar modal de logs
// ✔ Renderizar timeline
// ✔ Detectar incidentes (evento da IA)
// ✔ Acionar neon + alerta no card (cenario-alerta)
// ✔ Exibir botões PDF / WhatsApp / Email nos cards
// ✔ Dock flutuante de compartilhamento (padrão antigo)
// ======================================================================

import {
  montarTextoRelatorio,
  gerarPDF,
  compartilharWhatsApp,
  compartilharEmail,
  gerarTextoUltimoEvento, // ⭐ ADICIONAR ESTA LINHA
} from "./relatorio.js";

const STORAGE_KEY = "rk_playwright_logs_por_cenario";

// Carrega logs do localStorage
function carregarLogs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

// Salva logs
function salvarLogs(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

// Adiciona um log
function adicionarLog(cenario, log) {
  const todos = carregarLogs();
  if (!todos[cenario]) todos[cenario] = [];
  todos[cenario].push(log);
  salvarLogs(todos);
  return todos[cenario];
}

// Obtém logs de um cenário
function obterLogs(cenarioId) {
  const todos = carregarLogs();
  return todos[cenarioId] || [];
}
// ======================================================================
// ELEMENTOS DO MODAL + DOCK
// ======================================================================
const overlay = document.getElementById("logOverlay");
const modalFecharBtn = document.getElementById("logModalFechar");
const timelineContainer = document.getElementById("logTimelineLista");
const form = document.getElementById("logForm");

const campoCenarioId = document.getElementById("logCenarioId");
const campoTecnico = document.getElementById("logTecnico");
const campoAcao = document.getElementById("logAcao");
const campoJustificativa = document.getElementById("logJustificativa");

const tituloEl = document.getElementById("logModalTitulo");
const subtituloEl = document.getElementById("logModalSubtitulo");

const dock = document.getElementById("logDock");
const dockPdfBtn = document.getElementById("logDockPdf");
const dockWhatsappBtn = document.getElementById("logDockWhatsapp");
const dockEmailBtn = document.getElementById("logDockEmail");

let cenarioAtual = null;

// ----------------------------------------------------------------------
// Modal de confirmação de envio (WhatsApp / Email)
// ----------------------------------------------------------------------
const envioModal = document.getElementById("envioConfirmModal");
const envioModalTitulo = document.getElementById("envioModalTitulo");
const envioModalSubtitulo = document.getElementById("envioModalSubtitulo");
const envioModalPreview = document.getElementById("envioModalPreview");
const envioModalCancelar = document.getElementById("envioModalCancelar");
const envioModalConfirmar = document.getElementById("envioModalConfirmar");

// ======================================================================
// MODAL
// ======================================================================
function abrirModalLogs(cenarioId) {
  cenarioAtual = cenarioId;
  campoCenarioId.value = cenarioId;

  const bonitinho = cenarioId[0].toUpperCase() + cenarioId.slice(1);
  tituloEl.textContent = `Logs do cenário: ${bonitinho}`;
  subtituloEl.textContent =
    "Anomalias registradas, ações técnicas e justificativas.";

  renderizarTimeline(cenarioId);

  document.body.classList.add("modal-aberto");
  overlay.hidden = false;
}

function fecharModalLogs() {
  overlay.hidden = true;
  document.body.classList.remove("modal-aberto");
  cenarioAtual = null;
}

// ======================================================================
// RENDERIZA TIMELINE
// ======================================================================
function renderizarTimeline(cenarioId) {
  const logs = obterLogs(cenarioId);
  timelineContainer.innerHTML = "";

  if (!logs.length) {
    timelineContainer.innerHTML =
      `<p class="log-timeline__empty">Nenhum evento registrado.</p>`;
    return;
  }

  logs
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp)
    .forEach((log) => {
      const data = new Date(log.timestamp);
      const hora = data.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const dataBr = data.toLocaleDateString("pt-BR");

      const item = document.createElement("article");
      item.className = "log-timeline__item";

      item.innerHTML = `
        <header class="log-timeline__item-header">
          <span>${dataBr} · ${hora}</span>
          <span>${log.tecnico}</span>
          <span class="log-timeline__item-tag">
            ${log.tipo === "incidente" ? "Incidente" : "Ação técnica"}
          </span>
        </header>

        <div class="log-timeline__item-body">
          ${log.acao ? `<p><strong>Ação:</strong> ${log.acao}</p>` : ""}
          ${
            log.justificativa
              ? `<p><strong>Observações:</strong> ${log.justificativa}</p>`
              : ""
          }
        </div>
      `;

      timelineContainer.appendChild(item);
    });
}

// ======================================================================
// LISTENERS DO MODAL
// ======================================================================
document.querySelectorAll("[data-open-log]").forEach((btn) => {
  btn.addEventListener("click", () => abrirModalLogs(btn.dataset.openLog));
});

modalFecharBtn?.addEventListener("click", fecharModalLogs);

overlay?.addEventListener("click", (ev) => {
  if (ev.target === overlay) fecharModalLogs();
});

window.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && !overlay.hidden) fecharModalLogs();
});

// ======================================================================
// FORMULÁRIO DE REGISTRO DE AÇÃO
// ======================================================================
form?.addEventListener("submit", (ev) => {
  ev.preventDefault();

  const cenarioId = campoCenarioId.value;
  const log = {
    tipo: "acao",
    timestamp: Date.now(),
    tecnico: campoTecnico.value.trim(),
    acao: campoAcao.value.trim(),
    justificativa: campoJustificativa.value.trim(),
  };

  const logsAtualizados = adicionarLog(cenarioId, log);

  renderizarTimeline(cenarioId);
  campoAcao.value = "";
  campoJustificativa.value = "";

  mostrarDock(cenarioId, logsAtualizados);
});

// ======================================================================
// INTEGRAÇÃO COM A IA — INCIDENTES
// ======================================================================
window.addEventListener("cenario:diagnostico", (ev) => {
  const d = ev.detail;
  if (!d?.id) return;

  const cid = d.id;

  // Marca visual no card (NEON VOLTA AQUI)
  marcarCenarioComoCritico(cid);

  // Log automático
  const log = {
    tipo: "incidente",
    timestamp: d.timestamp || Date.now(),
    tecnico: "IA · Diagnóstico automático",
    severidade: d.severidade,
    impacto: d.impacto,
    causaProvavel: d.causaProvavel,
    acaoRecomendada: d.acaoRecomendada,
    acao:
      "Incidente detectado automaticamente pela IA com base na descrição enviada.",
    justificativa: "",
  };

  const logsAtualizados = adicionarLog(cid, log);
  mostrarDock(cid, logsAtualizados);

  if (cenarioAtual === cid) renderizarTimeline(cid);
});

// ======================================================================
// NOVO — Deixar card em AMARELO quando o técnico marcar "manutenção"
// ======================================================================
function marcarCenarioComoManutencao(cenarioId) {
  const card = document.querySelector(
    `.cenario-card[data-cenario="${cenarioId}"]`
  );
  if (!card) return;

  // remove estados anteriores
  card.classList.remove("cenario-alerta", "cenario-resolvido");

  // coloca o amarelo
  card.classList.add("cenario-manutencao");

  const alerta = document.getElementById(`alert-${cenarioId}`);
  if (alerta) {
    alerta.hidden = false;
    alerta.textContent = "🟡 Em manutenção";
  }
}
// ======================================================================
// NOVO — Deixar card em VERDE quando for resolvido
// ======================================================================
function marcarCenarioComoResolvido(cenarioId) {
  const card = document.querySelector(
    `.cenario-card[data-cenario="${cenarioId}"]`
  );
  if (!card) return;

  // apaga estados anteriores
  card.classList.remove("cenario-alerta", "cenario-manutencao");

  // coloca o verde
  card.classList.add("cenario-resolvido");

  const alerta = document.getElementById(`alert-${cenarioId}`);
  if (alerta) {
    alerta.hidden = false;
    alerta.textContent = "🟢 Resolvido";
  }
}

// ======================================================================
// 🔥 Controle VISUAL dos cartões de cenário
// ======================================================================
function atualizarEstadoVisualDoCard(cenarioId, estado) {
  const card = document.querySelector(`.cenario-card[data-cenario="${cenarioId}"]`);
  if (!card) return;

  // Remove estados anteriores
  card.classList.remove("cenario-alerta");   // vermelho crítico
  card.classList.remove("cenario-manutencao"); // amarelo manutenção
  card.classList.remove("cenario-ok");      // verde

  // Aplica o estado atual
  switch (estado) {
    case "erro":
    case "incidente":
      card.classList.add("cenario-alerta");
      break;

    case "manutencao":
      card.classList.add("cenario-manutencao");
      break;

    case "resolvido":
      card.classList.add("cenario-ok");
      break;

    default:
      break;
  }
}
// ======================================================================
// BOTÕES DE AÇÕES DENTRO DOS CARDS (PDF / Whats / Email)
// Desativei pois essa funcão adiciona os botões PDF, WhatSap e E-mail
// na frente dos cards, mas se precisar no futuro usaremos. Kell
// ======================================================================
// anexarAcoesNoCard(cenarioId);  // 🚫 Desativado — botões agora só aparecem no modal

/*function anexarAcoesNoCard(cenarioId) {
  if (!cenarioId) return;

  const card = document.querySelector(
    `.cenario-card[data-cenario="${cenarioId}"]`
  );
  if (!card) return;

  // evita duplicação
  if (card.querySelector('[data-relatorio-bar="card"]')) return;

  const barra = document.createElement("div");
  barra.classList.add("log-card-actions");
  barra.dataset.relatorioBar = "card";

  barra.innerHTML = `
    <p class="log-card-actions__title">
      <strong>[Alerta crítico detectado]</strong>
      <span class="log-card-actions__hint">Compartilhar este incidente:</span>
    </p>

    <div class="log-card-actions__buttons">
      <button data-relatorio-acao="pdf" data-relatorio-cenario="${cenarioId}">
        📄 PDF
      </button>
      <button data-relatorio-acao="whatsapp" data-relatorio-cenario="${cenarioId}">
        💬 WhatsApp
      </button>
      <button data-relatorio-acao="email" data-relatorio-cenario="${cenarioId}">
        ✉️ Email
      </button>
    </div>
  `;

  card.appendChild(barra);
}*/
// ======================================================================
// DOCK FLUTUANTE (DESATIVADO — CONTINUA FUNCIONANDO SE ATIVAR)
// ======================================================================
function mostrarDock(cenarioId, logs) {
  if (!dock || !logs.length) return;
  dock.dataset.cenarioId = cenarioId;
  dock.hidden = false;
}
// Mostra os botões inline dentro do formulário
function mostrarInline(cenarioId, logs) {
  const box = document.getElementById("logActionsInline");
  if (!box) return;

  if (!logs || !logs.length) {
    box.hidden = true;
    return;
  }

  box.dataset.cenarioId = cenarioId;
  box.hidden = false;
}
// ======================================================================
// CLIQUES NOS BOTÕES — POR DELEGAÇÃO
// ======================================================================
document.addEventListener("click", (ev) => {
  const btn = ev.target.closest("[data-relatorio-acao]");
  if (!btn) return;

  const acao = btn.dataset.relatorioAcao;
  const cenarioId = btn.dataset.relatorioCenario;

  const logs = obterLogs(cenarioId);
  if (!logs.length) return;

  const texto = montarTextoRelatorio(cenarioId, logs);

  if (acao === "pdf") gerarPDF(cenarioId, logs, texto);
  if (acao === "whatsapp") {
    const ultimo = gerarTextoUltimoEvento(cenarioId, logs);
    compartilharWhatsApp(ultimo);
}
  if (acao === "email") compartilharEmail(texto);
});

// Expor debug opcional
window.__logsDebug = {
  carregarLogs,
  salvarLogs,
  adicionarLog,
  obterLogs,
};

// ======================================================================
// BOTÕES DE ESTADO (Resolvido / Manutenção / Erro)
// Disparam logs automáticos com justificativa do técnico
// ======================================================================

// capturados pelo atributo data-estado-btn no HTML
const btnResolvido = document.querySelector("[data-estado-btn='resolvido']");
const btnManutencao = document.querySelector("[data-estado-btn='manutencao']");
const btnErro = document.querySelector("[data-estado-btn='erro']");

/**
 * Registra uma ação especial de estado (resolvido / manutencao / erro)
 * e, se for resolvido, já abre o PDF com o relatório atualizado.
 */
async function registrarAcaoDeEstado(tipoEstado) {
  if (!cenarioAtual) {
    alert("Abra os logs de um cenário antes de registrar o estado.");
    return;
  }

  let pergunta = "";
  let tipoLog = "acao";
  let acaoTexto = "";

  switch (tipoEstado) {
    case "resolvido":
      pergunta = "O que foi feito para resolver este cenário?";
      acaoTexto = "Cenário resolvido pelo técnico.";
      break;

    case "manutencao":
      pergunta = "O que está sendo feito / quais pendências existem?";
      acaoTexto = "Cenário colocado em manutenção.";
      break;

    case "erro":
      pergunta = "Explique o motivo do estado de erro:";
      acaoTexto = "Erro forçado manualmente pelo técnico.";
      tipoLog = "incidente";
      break;

    default:
      return;
  }

  // Abre o modal bonito para o técnico escrever
  const descricao = await abrirModalEstado(tipoEstado, pergunta);
  if (!descricao) return;

  const agora = Date.now();

  const log = {
    tipo: tipoLog,
    timestamp: agora,
    tecnico: (campoTecnico.value || "").trim() || "Raquel Souza",
    acao: acaoTexto,
    justificativa: descricao.trim(),
    estadoFinal: tipoEstado,
  };

  const logsAtualizados = adicionarLog(cenarioAtual, log);
  renderizarTimeline(cenarioAtual);

  // Efeito visual: só o botão atual fica com glow
  document
    .querySelectorAll(".btn-estado-pill")
    .forEach((b) => b.classList.remove("btn-estado-pill--ativo"));

  document
    .querySelector(`[data-estado-btn="${tipoEstado}"]`)
    ?.classList.add("btn-estado-pill--ativo");

  // Se marcou como resolvido, já gera o PDF com relatório completo
  if (tipoEstado === "resolvido") {
    const textoRel = montarTextoRelatorio(cenarioAtual, logsAtualizados);
    gerarPDF(cenarioAtual, logsAtualizados, textoRel);
  }
}

// listeners dos botões de estado
btnResolvido?.addEventListener("click", () =>
  registrarAcaoDeEstado("resolvido")
);
btnManutencao?.addEventListener("click", () =>
  registrarAcaoDeEstado("manutencao")
);
btnErro?.addEventListener("click", () =>
  registrarAcaoDeEstado("erro")
);
// ================================================================
// DESATIVAR DOCK FLUTUANTE (porque agora usamos apenas botões inline)
// ================================================================
if (dock) {
  dock.style.display = "none"; // totalmente invisível
}

// ======================================================================
// MODAL BONITO DE CONFIRMAÇÃO DE ENVIO
// Retorna uma Promise<boolean> → true = pode enviar
// (MESMO CÓDIGO QUE VOCÊ JÁ TINHA)
// ======================================================================
function abrirModalConfirmacaoEnvio(tipo, texto) {
  // Se, por algum motivo, o modal não existir, cai no confirm nativo
  if (!envioModal || !envioModalPreview) {
    const msgBase =
      tipo === "whatsapp"
        ? "Confirmar envio para WhatsApp?"
        : "Confirmar envio por e-mail?";
    const ok = window.confirm(msgBase + "\n\n" + texto);
    return Promise.resolve(ok);
  }

  return new Promise((resolve) => {
    envioModalTitulo.textContent =
      tipo === "whatsapp"
        ? "Confirmar envio para WhatsApp"
        : "Confirmar envio por e-mail";

    envioModalSubtitulo.textContent =
      "Revise a mensagem abaixo antes de enviar para os gestores.";

    envioModalPreview.value = texto;

    envioModal.classList.remove("hidden");

    const fechar = (confirmado) => {
      envioModal.classList.add("hidden");
      envioModalCancelar.removeEventListener("click", onCancelar);
      envioModalConfirmar.removeEventListener("click", onConfirmar);
      resolve(confirmado);
    };

    const onCancelar = () => fechar(false);
    const onConfirmar = () => fechar(true);

    envioModalCancelar.addEventListener("click", onCancelar);
    envioModalConfirmar.addEventListener("click", onConfirmar);
  });
}

// ======================================================================
// ⭐ ATIVAÇÃO DOS BOTÕES INLINE DO MODAL
// PDF · WhatsApp · Email
// ======================================================================
document.addEventListener("DOMContentLoaded", () => {
  const inlinePdf = document.querySelector("[data-inline-acao='pdf']");
  const inlineWhats = document.querySelector("[data-inline-acao='whatsapp']");
  const inlineEmail = document.querySelector("[data-inline-acao='email']");

  function obterLogsDoModal() {
    if (!cenarioAtual) return null;
    const logs = obterLogs(cenarioAtual);
    return logs && logs.length ? logs : null;
  }

  // PDF
  if (inlinePdf) {
    inlinePdf.addEventListener("click", () => {
      const logs = obterLogsDoModal();
      if (!logs) return;
      const texto = montarTextoRelatorio(cenarioAtual, logs);
      gerarPDF(cenarioAtual, logs, texto);
    });
  }

  // WhatsApp — com confirmação bonitinha
  if (inlineWhats) {
    inlineWhats.addEventListener("click", async () => {
      const logs = obterLogsDoModal();
      if (!logs) return;

      const texto = montarTextoRelatorio(cenarioAtual, logs);
      const ok = await abrirModalConfirmacaoEnvio("whatsapp", texto);
      if (!ok) return;

      compartilharWhatsApp(texto);

      if (window.chatAviso) {
        window.chatAviso(
          `Relatório do cenário "${cenarioAtual}" foi enviado via WhatsApp.`
        );
      }
    });
  }

  // Email — idem
  if (inlineEmail) {
    inlineEmail.addEventListener("click", async () => {
      const logs = obterLogsDoModal();
      if (!logs) return;

      const texto = montarTextoRelatorio(cenarioAtual, logs);
      const ok = await abrirModalConfirmacaoEnvio("email", texto);
      if (!ok) return;

      compartilharEmail(texto);

      if (window.chatAviso) {
        window.chatAviso(
          `Relatório do cenário "${cenarioAtual}" foi enviado por e-mail.`
        );
      }
    });
  }
});

// ======================================================================
// SISTEMA DE ARRASTE — Chat (#iaChat) e Temporizador (#timerHud)
// (MESMO CÓDIGO QUE JÁ ESTAVA FUNCIONANDO)
// ======================================================================
(function () {
  function makeDraggable(element, handle) {
    let offsetX = 0;
    let offsetY = 0;
    let dragging = false;

    const startDrag = (e) => {
      dragging = true;
      element.classList.add("dragging");

      const rect = element.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;

      e.preventDefault();
    };

    const duringDrag = (e) => {
      if (!dragging) return;

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      let left = clientX - offsetX;
      let top = clientY - offsetY;

      left = Math.max(5, Math.min(left, window.innerWidth - element.offsetWidth - 5));
      top = Math.max(5, Math.min(top, window.innerHeight - element.offsetHeight - 5));

      element.style.left = `${left}px`;
      element.style.top = `${top}px`;

      element.style.right = "auto";
      element.style.bottom = "auto";
    };

    const stopDrag = () => {
      dragging = false;
      element.classList.remove("dragging");
    };

    handle.addEventListener("mousedown", startDrag);
    handle.addEventListener("touchstart", startDrag);

    window.addEventListener("mousemove", duringDrag);
    window.addEventListener("touchmove", duringDrag);

    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("touchend", stopDrag);
  }

  window.addEventListener("DOMContentLoaded", () => {
    const chat = document.getElementById("iaChat");
    const chatHeader = document.querySelector(".ia-chat__header");
    const hud = document.getElementById("timerHud");

    if (chat && chatHeader) makeDraggable(chat, chatHeader);
    if (hud) makeDraggable(hud, hud);
  });
})();

// ======================================================================
// MODAL PERSONALIZADO PARA AÇÕES DE ESTADO
// (usado por registrarAcaoDeEstado acima)
// ======================================================================
function abrirModalEstado(estado, pergunta) {
  return new Promise((resolve) => {
    const modal = document.getElementById("modalEstado");
    const titulo = document.getElementById("modalEstadoTitulo");
    const textarea = document.getElementById("modalEstadoTexto");
    const okBtn = document.getElementById("modalEstadoOk");
    const cancelBtn = document.getElementById("modalEstadoCancelar");

    titulo.textContent = pergunta;
    textarea.value = "";

    modal.classList.remove("hidden");

    okBtn.onclick = () => {
      modal.classList.add("hidden");
      resolve(textarea.value.trim());
    };

    cancelBtn.onclick = () => {
      modal.classList.add("hidden");
      resolve(null);
    };
  });
}
// ======================================================================
// 🔮 SINCRONIZAÇÃO AUTOMÁTICA DOS CARDS COM OS LOGS
// Define cor, alerta, neon e estado visual com base no último evento.
// ======================================================================

function atualizarEstadoDosCards() {
  const todos = carregarLogs();

  Object.keys(todos).forEach((cenarioId) => {
    const logs = todos[cenarioId];
    const card = document.querySelector(`.cenario-card[data-cenario="${cenarioId}"]`);
    const alerta = document.getElementById(`alert-${cenarioId}`);

    if (!card) return;

    // limpa classes antigas
    card.classList.remove("cenario-alerta", "cenario-ok", "cenario-manutencao");
    if (alerta) alerta.hidden = true;

    if (!logs.length) {
      card.classList.add("cenario-ok");
      return;
    }

    const ultimo = logs[logs.length - 1];

    // ------------------------------
    // Estado: ERRO / INCIDENTE
    // ------------------------------
    if (ultimo.tipo === "incidente") {
      card.classList.add("cenario-alerta");
      if (alerta) alerta.hidden = false;
      return;
    }

    // ------------------------------
    // Estado: MANUTENÇÃO
    // ------------------------------
    if (ultimo.estadoFinal === "manutencao") {
      card.classList.add("cenario-manutencao");
      return;
    }

    // ------------------------------
    // Estado: RESOLVIDO
    // ------------------------------
    if (ultimo.estadoFinal === "resolvido") {
      card.classList.add("cenario-ok");
      return;
    }

    // Ações comuns → OK
    card.classList.add("cenario-ok");
  });
}

// ======================================================================
// Chamado automaticamente ao carregar a página
// ======================================================================
window.addEventListener("DOMContentLoaded", atualizarEstadoDosCards);

// ======================================================================
// Atualiza estado dos cards SEMPRE que salvar log
// ======================================================================
function syncDepoisDoLog() {
  atualizarEstadoDosCards();
  if (cenarioAtual) renderizarTimeline(cenarioAtual);
}

// substitui chamadas antigas
const _adicionarLogOriginal = adicionarLog;
adicionarLog = function (cenario, log) {
  const resp = _adicionarLogOriginal(cenario, log);
  syncDepoisDoLog();
  return resp;
};
/*
// ======================================================================
// Marca visualmente um cenário como CRÍTICO nos cards
// ======================================================================
function marcarCenarioComoCritico(id) {
  const card =
    document.querySelector(`[data-cenario="${id}"]`) ||
    document.getElementById(id);

  if (!card) {
    console.warn("⚠️ marcarCenarioComoCritico: card não encontrado:", id);
    return;
  }

  card.classList.remove("cenario-ok", "cenario-instavel");
  card.classList.add("cenario-critico");

  console.log(`🔥 Cenário crítico marcado: ${id}`);
}
*/
// ======================================================================
// CONTROLE VISUAL COMPLETO DOS CARDS (OK / ALERTA / CRÍTICO / INSTÁVEL)
// ======================================================================

const ESTADOS = {
  ok: "cenario-ok",
  alerta: "cenario-alerta",
  critico: "cenario-critico",
  instavel: "cenario-instavel"
};

// Remove qualquer estado antigo
function limparEstados(card) {
  card.classList.remove(
    ESTADOS.ok,
    ESTADOS.alerta,
    ESTADOS.critico,
    ESTADOS.instavel
  );
}

// 🟩 OK
function marcarCenarioComoOk(id) {
  const card = document.querySelector(`[data-cenario="${id}"]`);
  if (!card) return;

  limparEstados(card);
  card.classList.add(ESTADOS.ok);
}

// 🟧 ALERTA
function marcarCenarioComoAlerta(id) {
  const card = document.querySelector(`[data-cenario="${id}"]`);
  if (!card) return;

  limparEstados(card);
  card.classList.add(ESTADOS.alerta);
}

// 🟥 CRÍTICO — ESTA ERA A FUNÇÃO QUE ESTAVA FALTANDO PADRONIZAR
function marcarCenarioComoCritico(id) {
  const card = document.querySelector(`[data-cenario="${id}"]`);
  if (!card) return;

  limparEstados(card);
  card.classList.add(ESTADOS.critico);

  console.log(`🔥 Cenário crítico marcado: ${id}`);
}

// 🟦 INSTÁVEL
function marcarCenarioComoInstavel(id) {
  const card = document.querySelector(`[data-cenario="${id}"]`);
  if (!card) return;

  limparEstados(card);
  card.classList.add(ESTADOS.instavel);
}

// Expor globalmente (IA + engine precisam disso)
window.marcarCenarioComoOk = marcarCenarioComoOk;
window.marcarCenarioComoAlerta = marcarCenarioComoAlerta;
window.marcarCenarioComoCritico = marcarCenarioComoCritico;
window.marcarCenarioComoInstavel = marcarCenarioComoInstavel;
// ======================================================================
// FIM DO ARQUIVO — Controle de logs, modal e integração com IA
// ======================================================================
