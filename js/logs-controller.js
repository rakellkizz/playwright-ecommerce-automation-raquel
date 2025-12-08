// ======================================================================
// 1. IMPORTAÇÕES
// ======================================================================

import {
  montarTextoRelatorio,
  gerarPDF,
  compartilharWhatsApp,
  compartilharEmail,
  gerarTextoUltimoEvento, // ⭐ ADICIONAR ESTA LINHA
} from "./relatorio.js";


// ======================================================================
// 2. LOCALSTORAGE — CARREGAR, SALVAR E GERENCIAR LOGS
// ======================================================================

// 2.1 — Chave usada no localStorage
const STORAGE_KEY = "rk_playwright_logs_por_cenario";

// 2.2 — Carrega logs do localStorage
function carregarLogs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

// 2.3 — Salva logs
function salvarLogs(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

// 2.4 — Adiciona um log
function adicionarLog(cenario, log) {
  const todos = carregarLogs();
  if (!todos[cenario]) todos[cenario] = [];
  todos[cenario].push(log);
  salvarLogs(todos);
  return todos[cenario];
}

// 2.5 — Obtém logs de um cenário
function obterLogs(cenarioId) {
  const todos = carregarLogs();
  return todos[cenarioId] || [];
}


// ======================================================================
// 3. ELEMENTOS DO MODAL + DOCK
// ======================================================================

// 3.1 — Elementos principais do modal
const overlay = document.getElementById("logOverlay");
const modalFecharBtn = document.getElementById("logModalFechar");
const timelineContainer = document.getElementById("logTimelineLista");
const form = document.getElementById("logForm");

// 3.2 — Campos do formulário
const campoCenarioId = document.getElementById("logCenarioId");
const campoTecnico = document.getElementById("logTecnico");
const campoAcao = document.getElementById("logAcao");
const campoJustificativa = document.getElementById("logJustificativa");

// 3.3 — Títulos do modal
const tituloEl = document.getElementById("logModalTitulo");
const subtituloEl = document.getElementById("logModalSubtitulo");

// 3.4 — Dock flutuante (antigo)
const dock = document.getElementById("logDock");
const dockPdfBtn = document.getElementById("logDockPdf");
const dockWhatsappBtn = document.getElementById("logDockWhatsapp");
const dockEmailBtn = document.getElementById("logDockEmail");

// 3.5 — Controle do cenário atual
let cenarioAtual = null;

// 3.6 — Modal de confirmação de envio
const envioModal = document.getElementById("envioConfirmModal");
const envioModalTitulo = document.getElementById("envioModalTitulo");
const envioModalSubtitulo = document.getElementById("envioModalSubtitulo");
const envioModalPreview = document.getElementById("envioModalPreview");
const envioModalCancelar = document.getElementById("envioModalCancelar");
const envioModalConfirmar = document.getElementById("envioModalConfirmar");
// ======================================================================
// 4. MODAL — ABRIR E FECHAR
// ======================================================================

// 4.1 — Abre o modal de logs
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

// 4.2 — Fecha o modal
function fecharModalLogs() {
  overlay.hidden = true;
  document.body.classList.remove("modal-aberto");
  cenarioAtual = null;
}



// ======================================================================
// 5. TIMELINE — RENDERIZAÇÃO DOS EVENTOS
// ======================================================================

// 5.1 — Renderiza lista de eventos no modal
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
// 6. LISTENERS — ABERTURA, FECHAMENTO E ESCAPE
// ======================================================================

// 6.1 — Botões que abrem o modal
document.querySelectorAll("[data-open-log]").forEach((btn) => {
  btn.addEventListener("click", () => abrirModalLogs(btn.dataset.openLog));
});

// 6.2 — Botão "X" fecha o modal
modalFecharBtn?.addEventListener("click", fecharModalLogs);

// 6.3 — Clique fora do modal fecha também
overlay?.addEventListener("click", (ev) => {
  if (ev.target === overlay) fecharModalLogs();
});

// 6.4 — ESC fecha o modal
window.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && !overlay.hidden) fecharModalLogs();
});
// ======================================================================
// 7. FORMULÁRIO — REGISTRO DE AÇÃO TÉCNICA
// ======================================================================

// 7.1 — Listener do formulário de nova ação
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
// 8. INTEGRAÇÃO COM A IA — INCIDENTES AUTOMÁTICOS
// ======================================================================

// 8.1 — Recebe evento "cenario:diagnostico" disparado pela IA
window.addEventListener("cenario:diagnostico", (ev) => {
  const d = ev.detail;
  if (!d?.id) return;

  const cid = d.id;

  // Marca visual no card (NEON VOLTA AQUI)
  marcarCenarioComoCritico(cid);

  // 8.2 — Log automático da IA
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
// 9. ESTADOS VISUAIS — MANUTENÇÃO / RESOLVIDO / CRÍTICO
// ======================================================================

// 9.1 — Estado: Manutenção (cor amarela)
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

// 9.2 — Estado: Resolvido (verde)
function marcarCenarioComoResolvido(cenarioId) {
  const card = document.querySelector(
    `.cenario-card[data-cenario="${cenarioId}"]`
  );
  if (!card) return;

  // apaga estados anteriores
  card.classList.remove("cenario-alerta", "cenario-manutencao");

  // verde
  card.classList.add("cenario-resolvido");

  const alerta = document.getElementById(`alert-${cenarioId}`);
  if (alerta) {
    alerta.hidden = false;
    alerta.textContent = "🟢 Resolvido";
  }
}

// 9.3 — Controle visual genérico dos cartões via "estado"
function atualizarEstadoVisualDoCard(cenarioId, estado) {
  const card = document.querySelector(`.cenario-card[data-cenario="${cenarioId}"]`);
  if (!card) return;

  // Remove estados anteriores
  card.classList.remove("cenario-alerta");
  card.classList.remove("cenario-manutencao");
  card.classList.remove("cenario-ok");

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
// 10. DOCK + BOTÕES INLINE DE RELATÓRIO (PDF / WhatsApp / Email)
// ======================================================================

// 10.1 — Mostra o dock flutuante antigo (mantido, mas desativado visualmente)
function mostrarDock(cenarioId, logs) {
  if (!dock || !logs.length) return;
  dock.dataset.cenarioId = cenarioId;
  dock.hidden = false;
}

// 10.2 — Mostra os botões inline dentro do formulário
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

// 10.3 — Clique nos botões PDF / Whats / Email (via data-relatorio-acao)
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

// 10.4 — Debug opcional
window.__logsDebug = {
  carregarLogs,
  salvarLogs,
  adicionarLog,
  obterLogs,
};



// ======================================================================
// 11. BOTÕES DE ESTADO (Resolvido / Manutenção / Erro)
// ======================================================================

// 11.1 — Seletores dos botões de estado
const btnResolvido = document.querySelector("[data-estado-btn='resolvido']");
const btnManutencao = document.querySelector("[data-estado-btn='manutencao']");
const btnErro = document.querySelector("[data-estado-btn='erro']");

// 11.2 — Registrar ação especial de estado
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

  // 11.3 — Abre modal estilizado para inserir descrição
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

  // 11.4 — Efeito visual exclusivo no botão selecionado
  document
    .querySelectorAll(".btn-estado-pill")
    .forEach((b) => b.classList.remove("btn-estado-pill--ativo"));

  document
    .querySelector(`[data-estado-btn="${tipoEstado}"]`)
    ?.classList.add("btn-estado-pill--ativo");

  // 11.5 — Se resolveu, já gera o PDF automaticamente
  if (tipoEstado === "resolvido") {
    const textoRel = montarTextoRelatorio(cenarioAtual, logsAtualizados);
    gerarPDF(cenarioAtual, logsAtualizados, textoRel);
  }
}

// 11.6 — Listeners dos botões
btnResolvido?.addEventListener("click", () =>
  registrarAcaoDeEstado("resolvido")
);
btnManutencao?.addEventListener("click", () =>
  registrarAcaoDeEstado("manutencao")
);
btnErro?.addEventListener("click", () =>
  registrarAcaoDeEstado("erro")
);

// 11.7 — Desativar dock antigo visualmente
if (dock) {
  dock.style.display = "none";
}



// ======================================================================
// 12. MODAL DE CONFIRMAÇÃO DE ENVIO (PDF / WhatsApp / Email)
// ======================================================================

// 12.1 — Abre modal de confirmação antes do envio
function abrirModalConfirmacaoEnvio(tipo, texto) {
  // fallback se modal não existir
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
// 13. BOTÕES INLINE DO MODAL (PDF · WhatsApp · Email)
// ======================================================================

document.addEventListener("DOMContentLoaded", () => {
  const inlinePdf = document.querySelector("[data-inline-acao='pdf']");
  const inlineWhats = document.querySelector("[data-inline-acao='whatsapp']");
  const inlineEmail = document.querySelector("[data-inline-acao='email']");

  // 13.1 — Captura logs do cenário atual dentro do modal
  function obterLogsDoModal() {
    if (!cenarioAtual) return null;
    const logs = obterLogs(cenarioAtual);
    return logs && logs.length ? logs : null;
  }

  // 13.2 — PDF
  if (inlinePdf) {
    inlinePdf.addEventListener("click", () => {
      const logs = obterLogsDoModal();
      if (!logs) return;
      const texto = montarTextoRelatorio(cenarioAtual, logs);
      gerarPDF(cenarioAtual, logs, texto);
    });
  }

  // 13.3 — WhatsApp (com modal de confirmação)
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

  // 13.4 — Email (com confirmação também)
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
// 14. SISTEMA DE ARRASTE — CHAT (#iaChat) E TEMPORIZADOR (#timerHud)
// ======================================================================
// (Mesmo código original, apenas numerado)

// 14.1 — Função genérica para tornar elementos arrastáveis
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

  // 14.2 — Aplicação do sistema de arraste
  window.addEventListener("DOMContentLoaded", () => {
    const chat = document.getElementById("iaChat");
    const chatHeader = document.querySelector(".ia-chat__header");
    const hud = document.getElementById("timerHud");

    if (chat && chatHeader) makeDraggable(chat, chatHeader);
    if (hud) makeDraggable(hud, hud);
  });
})();



// ======================================================================
// 15. MODAL PERSONALIZADO PARA AÇÕES DE ESTADO
// ======================================================================

// 15.1 — Modal para registrar justificativa de estado (manutenção, erro, resolvido)
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
// 16. 🔄 SINCRONIZAÇÃO AUTOMÁTICA DOS CARDS COM OS LOGS
//     - Define cor, alerta, neon e estado visual com base no último evento
// ======================================================================

function atualizarEstadoDosCards() {
  const todos = carregarLogs();

  Object.keys(todos).forEach((cenarioId) => {
    const logs = todos[cenarioId];
    const card = document.querySelector(`.cenario-card[data-cenario="${cenarioId}"]`);
    const alerta = document.getElementById(`alert-${cenarioId}`);

    if (!card) return;

    // 16.1 — Limpa estados antigos
    card.classList.remove("cenario-alerta", "cenario-ok", "cenario-manutencao");
    if (alerta) alerta.hidden = true;

    // 16.2 — Se não tem logs → OK
    if (!logs.length) {
      card.classList.add("cenario-ok");
      return;
    }

    const ultimo = logs[logs.length - 1];

    // 16.3 — ERRO / INCIDENTE → vermelho
    if (ultimo.tipo === "incidente") {
      card.classList.add("cenario-alerta");
      if (alerta) alerta.hidden = false;
      return;
    }

    // 16.4 — MANUTENÇÃO → amarelo
    if (ultimo.estadoFinal === "manutencao") {
      card.classList.add("cenario-manutencao");
      return;
    }

    // 16.5 — RESOLVIDO → verde
    if (ultimo.estadoFinal === "resolvido") {
      card.classList.add("cenario-ok");
      return;
    }

    // 16.6 — Ações comuns → OK
    card.classList.add("cenario-ok");
  });
}

// ======================================================================
// 16.7 — Chamado automaticamente ao carregar a página
// ======================================================================
window.addEventListener("DOMContentLoaded", atualizarEstadoDosCards);



// ======================================================================
// 17. 🔁 INTERCEPTAÇÃO DO adicionarLog PARA SINCRONIZAR AUTOMATICAMENTE
// ======================================================================

function syncDepoisDoLog() {
  atualizarEstadoDosCards();
  if (cenarioAtual) renderizarTimeline(cenarioAtual);
}

// guarda função original
const _adicionarLogOriginal = adicionarLog;

// 17.1 — Substitui a função, mantendo tudo igual, apenas adicionando sync
adicionarLog = function (cenario, log) {
  const resp = _adicionarLogOriginal(cenario, log); // executa original
  syncDepoisDoLog();                                 // sincroniza UI
  return resp;                                       // retorna igual
};
// ======================================================================
// 18. CONTROLE VISUAL COMPLETO DOS CARDS
//     Estados: OK / ALERTA / CRÍTICO / INSTÁVEL
//     + Exposição global para IA e engine
// ======================================================================

// 18.1 — Tabela de classes CSS usadas pelos estados
const ESTADOS = {
  ok: "cenario-ok",
  alerta: "cenario-alerta",
  critico: "cenario-critico",
  instavel: "cenario-instavel",
};

// 18.2 — Remove qualquer estado antigo antes de aplicar um novo
function limparEstados(card) {
  card.classList.remove(
    ESTADOS.ok,
    ESTADOS.alerta,
    ESTADOS.critico,
    ESTADOS.instavel
  );
}



// ======================================================================
// 18.3 — Estado OK (🟩)
// ======================================================================
function marcarCenarioComoOk(id) {
  const card = document.querySelector(`[data-cenario="${id}"]`);
  if (!card) return;

  limparEstados(card);
  card.classList.add(ESTADOS.ok);
}



// ======================================================================
// 18.4 — Estado ALERTA (🟧) — nível moderado
// ======================================================================
function marcarCenarioComoAlerta(id) {
  const card = document.querySelector(`[data-cenario="${id}"]`);
  if (!card) return;

  limparEstados(card);
  card.classList.add(ESTADOS.alerta);
}



// ======================================================================
// 18.5 — Estado CRÍTICO (🟥) — nível mais grave
// ======================================================================
function marcarCenarioComoCritico(id) {
  const card = document.querySelector(`[data-cenario="${id}"]`);
  if (!card) return;

  limparEstados(card);
  card.classList.add(ESTADOS.critico);

  console.log(`🔥 Cenário crítico marcado: ${id}`);
}



// ======================================================================
// 18.6 — Estado INSTÁVEL (🟦) — oscila entre ok/alerta
// ======================================================================
function marcarCenarioComoInstavel(id) {
  const card = document.querySelector(`[data-cenario="${id}"]`);
  if (!card) return;

  limparEstados(card);
  card.classList.add(ESTADOS.instavel);
}



// ======================================================================
// 18.7 — Exposição Global — IA e Tests Engine precisam disso
// ======================================================================
window.marcarCenarioComoOk = marcarCenarioComoOk;
window.marcarCenarioComoAlerta = marcarCenarioComoAlerta;
window.marcarCenarioComoCritico = marcarCenarioComoCritico;
window.marcarCenarioComoInstavel = marcarCenarioComoInstavel;

/// ======================================================================
//   FIM DO ARQUIVO — Controle completo de logs, modal, estados visuais
// ======================================================================

