// ======================================================================
// chat-ui.js — Controle visual + UX do Chat da IA
// ----------------------------------------------------------------------
// ✔ Chat flutuante
// ✔ Chat arrastável (mouse + touch)
// ✔ Botão launcher acompanha o chat
// ✔ Integração com IA híbrida (ENVIO/RESPOSTA)
// ✔ Auditoria SOC (socLog)
// ✔ Modo Sala de Crise (UX correta)
// ======================================================================


// ======================================================================
// 1) IMPORTS
// ======================================================================
import { IA } from "./ai-hibrida.js";
import { gerarPDF, compartilharWhatsApp, compartilharEmail } from "./relatorio.js";

// SOC (coletor e dashboard escutam eventos; não mexemos neles aqui)
import "./soc-collector.js";
import "./soc-dashboard.js";


// ======================================================================
// 2) SOC LOG — Auditoria técnica (não interfere no layout)
// ----------------------------------------------------------------------
// ✔ Cria window.socLog()
// ✔ Guarda em memória e localStorage
// ✔ Útil para Playwright / Allure / relatórios
// ======================================================================
(function initSocEvents() {
  if (window.__socEvents) return;

  window.__socEvents = [];

  window.socLog = function (evento) {
    const payload = { ts: Date.now(), ...evento };
    window.__socEvents.push(payload);

    if (window.__socEvents.length > 300) window.__socEvents.shift();

    try {
      localStorage.setItem("soc_events", JSON.stringify(window.__socEvents));
    } catch (_) {
      // silencioso por segurança (não quebra UX)
    }
  };
})();


// ======================================================================
// 3) CAPTURA DE ELEMENTOS
// ======================================================================
const launcher = document.getElementById("iaLauncher");
const chat = document.getElementById("iaChat");
const closeBtn = document.getElementById("iaChatClose");
const messages = document.getElementById("iaMessages");
const form = document.getElementById("iaForm");
const input = document.getElementById("iaInput");


// ======================================================================
// 3.1) GUARDAS DE SEGURANÇA (para não quebrar silenciosamente)
// ======================================================================
const hasCore = !!(launcher && chat && messages && form && input);
if (!hasCore) {
  // Se algo faltar, a gente não quebra a página. Só registra no console.
  console.warn("[chat-ui] Elementos essenciais não encontrados:", {
    launcher: !!launcher,
    chat: !!chat,
    messages: !!messages,
    form: !!form,
    input: !!input,
    closeBtn: !!closeBtn,
  });
}


// ======================================================================
// 4) ESTADO SOC (único e centralizado)
// ======================================================================
let socModoAtivo = false;
let socSalaId = null;

function gerarSocSalaId() {
  return `SOC-${Date.now()}`;
}


// ======================================================================
// 5) FUNÇÕES SOC (NÃO VISUAIS)
// ----------------------------------------------------------------------
// ✔ ativarModoSoc: liga o modo SOC e dispara evento para dashboard/coletor
// ✔ continuarAnaliseSoc: mantém SOC ativo e registra decisão (evento + log)
// ======================================================================
function ativarModoSoc(motivo = "Ativação via chat") {
  if (!socSalaId) socSalaId = gerarSocSalaId();
  socModoAtivo = true;

  // ====================================================================
  // 5.1) 🧷 SOC — sincroniza ID da sala com o socCollector (para o painel)
  // --------------------------------------------------------------------
  // ✔ Sem refatorar o collector
  // ✔ Se o collector existir, gravamos o ID oficial da sala
  // ✔ Assim o painel deixa de mostrar "Não formalizada"
  // ====================================================================
  try {
    const st = window.socCollector?.getState?.();
    if (st) st.sala = socSalaId;
  } catch (_) {
    // silencioso (não pode quebrar o chat)
  }

  // marca visual no chat (classe; CSS já decide como mostrar)
  chat?.classList.add("ia-chat--soc");

  // dispara evento para quem quiser reagir (soc-dashboard / soc-collector)
  window.dispatchEvent(
    new CustomEvent("soc:continuar_analise", {
      detail: {
        sala: socSalaId,
        decisao: motivo,
        tipoNarrativo: "decisao_soc",
        origem: "chat-ui",
      },
    })
  );

  // auditoria técnica
  window.socLog?.({
    type: "soc_ativado",
    sala: socSalaId,
    motivo,
    origem: "chat-ui",
  });

  chatAviso(`🆘 <strong>Sala de Crise ativada</strong><br/>ID: ${socSalaId}`);
}

function continuarAnaliseSoc() {
  if (!socModoAtivo) return;

  // dispara evento (uma única vez) para manter o painel/estado em análise
  window.dispatchEvent(
    new CustomEvent("soc:continuar_analise", {
      detail: {
        sala: socSalaId,
        decisao: "Manter incidente em análise (SOC)",
        tipoNarrativo: "decisao_soc",
        origem: "chat-ui",
      },
    })
  );

  // auditoria técnica
  window.socLog?.({
    type: "soc_continuar",
    sala: socSalaId,
    origem: "chat-ui",
  });

  chatAviso("🔎 Análise continuará em modo SOC.");
}

// expõe para testes / console
window.ativarModoSoc = ativarModoSoc;
window.continuarAnaliseSoc = continuarAnaliseSoc;

// ======================================================================
// 6) ABRIR / FECHAR CHAT (com sincronização ao abrir)
// ----------------------------------------------------------------------
// PROBLEMA que você estava sentindo:
// - chat "des-sincroniza" do launcher ao abrir
// SOLUÇÃO:
// - ao abrir, posiciona o chat "grudado" no launcher atual (onde ele estiver)
// - não cria handlers duplicados
// ======================================================================
if (launcher && chat) {
  launcher.addEventListener("click", (ev) => {
    ev.preventDefault();

    // abre
    chat.classList.add("ia-chat--open");
    chat.style.pointerEvents = "auto";
    chat.setAttribute("aria-hidden", "false");

    // garante que estamos usando left/top (evita conflitos com CSS right/bottom)
    chat.style.right = "auto";
    chat.style.bottom = "auto";

    // posiciona o chat em relação ao launcher (onde ele estiver)
    const rect = launcher.getBoundingClientRect();

    // chat acima do launcher (12px)
    chat.style.left = `${rect.left}px`;
    chat.style.top = `${rect.top - chat.offsetHeight - 12}px`;

    // foco no input após layout estabilizar
    setTimeout(() => input?.focus(), 0);
  });
}

if (closeBtn && chat) {
  closeBtn.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();

    input?.blur();

    chat.classList.remove("ia-chat--open");

    // pequena espera para CSS animar sem "tranco"
    setTimeout(() => {
      chat.style.pointerEvents = "none";
      chat.setAttribute("aria-hidden", "true");
    }, 120);
  });
}


// ======================================================================
// 7) HELPERS DE TEXTO (para evitar quebra por caracteres especiais)
// ----------------------------------------------------------------------
// OBS: chatAviso usa HTML (bold/br), então não escapamos msg do sistema.
// Para texto do usuário, escapamos para não “injetar” HTML sem querer.
// ======================================================================
function escapeHtml(texto = "") {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}


// ======================================================================
// 8) MENSAGENS — addMessage()
// ----------------------------------------------------------------------
// ✔ Mantém sua estrutura visual
// ✔ Usuário é escapado para segurança/estabilidade
// ✔ IA pode usar HTML simples se você quiser (mantemos como veio)
// ======================================================================
function addMessage(texto, sender = "ia") {
  if (!messages) return;

  const div = document.createElement("div");
  div.className = sender === "user" ? "ia-msg ia-msg--user" : "ia-msg ia-msg--ia";

  const conteudo = sender === "user" ? escapeHtml(texto) : texto;

  div.innerHTML = `
    <div class="ia-msg__avatar">${sender === "user" ? "R" : "AI"}</div>
    <div class="ia-msg__bubble">${conteudo}</div>
  `;

  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}


// ======================================================================
// 9) CHAT AVISO (sistema)
// ----------------------------------------------------------------------
// ✔ Continua disponível globalmente: window.chatAviso
// ======================================================================
export function chatAviso(msg) {
  addMessage(msg, "ia");
}
window.chatAviso = chatAviso;


/// ======================================================================
// 9.1) MENSAGEM SOC INTERATIVA — Sugestão de Sala de Crise no chat
// ----------------------------------------------------------------------
// ✔ Renderiza um bloco SOC com 2 botões:
//    - 🆘 Abrir Sala (ativa SOC de fato)
//    - 🔎 Continuar Análise (mantém em análise sem “formalizar sala”)
// ✔ Blindado contra:
//    - submit acidental (se estiver dentro de form)
//    - fechamento do chat / propagação de clique
// ======================================================================
function addMensagemSocAcao() {
  // Segurança: se não tem área de mensagens, não faz nada
  if (!messages) return;

  // --------------------------------------------------------------------
  // 1) Cria o bloco visual (não muda layout existente do chat)
  // --------------------------------------------------------------------
  const bloco = document.createElement("div");
  bloco.className = "ia-msg ia-msg--ia ia-msg--soc";

  // ⚠️ IMPORTANTE:
  // - type="button" evita virar submit em qualquer cenário
  // - data-* permite localizar sem depender de ordem
  bloco.innerHTML = `
    <div class="ia-msg__avatar">AI</div>
    <div class="ia-msg__bubble ia-msg__bubble--soc">
      <strong>🆘 Situação crítica detectada</strong><br/>
      Deseja abrir uma Sala de Crise?
      <div class="ia-msg__actions">
        <button type="button" class="ia-btn ia-btn--danger" data-soc-abrir>
          🆘 Abrir Sala
        </button>
        <button type="button" class="ia-btn ia-btn--ghost" data-soc-continuar>
          🔎 Continuar Análise
        </button>
      </div>
    </div>
  `;

  // Coloca no chat e garante scroll
  messages.appendChild(bloco);
  messages.scrollTop = messages.scrollHeight;

  // --------------------------------------------------------------------
  // 2) Captura dos botões (sem depender de ordem)
  // --------------------------------------------------------------------
  const btnAbrir = bloco.querySelector("[data-soc-abrir]");
  const btnContinuar = bloco.querySelector("[data-soc-continuar]");

  // --------------------------------------------------------------------
  // 3) Handler blindado — Abrir Sala
  // --------------------------------------------------------------------
  if (btnAbrir) {
    btnAbrir.addEventListener("click", (e) => {
      // impede submit / propagação / efeitos colaterais no chat
      e.preventDefault();
      e.stopPropagation();

      // Auditoria técnica (se existir)
      try {
        window.socLog?.({
          type: "soc_ui_click",
          acao: "abrir_sala",
          origem: "chat-ui:addMensagemSocAcao",
          ts: Date.now(),
        });
      } catch (_) {}

      // Ação principal
      try {
        ativarModoSoc("Abertura via sugestão da IA");
      } catch (_) {
        // Se algo falhar, avisa sem quebrar o chat
        chatAviso("⚠️ Não foi possível ativar a Sala de Crise (verifique o console).");
      }
    });
  }

  // --------------------------------------------------------------------
  // 4) Handler blindado — Continuar análise
  // --------------------------------------------------------------------
  if (btnContinuar) {
    btnContinuar.addEventListener("click", (e) => {
      // impede submit / propagação / efeitos colaterais no chat
      e.preventDefault();
      e.stopPropagation();

      // Auditoria técnica (se existir)
      try {
        window.socLog?.({
          type: "soc_ui_click",
          acao: "continuar_analise",
          origem: "chat-ui:addMensagemSocAcao",
          ts: Date.now(),
        });
      } catch (_) {}

      // Ação principal
      try {
        continuarAnaliseSoc();
      } catch (_) {
        chatAviso("⚠️ Não foi possível continuar a análise (verifique o console).");
      }
    });
  }
}

// Expor global para debug/console (como você já faz)
window.addMensagemSocAcao = addMensagemSocAcao;

// ======================================================================
// 10.) 🔔 Gatilho padrão — sugerir Sala de Crise via evento
// ----------------------------------------------------------------------
// Qualquer módulo pode disparar:
// window.dispatchEvent(new CustomEvent("soc:sugerir_crise", { detail: {...} }))
// ======================================================================
window.addEventListener("soc:sugerir_crise", (ev) => {
  try {
    const d = ev?.detail || {};

    // 1) Mostra a UI de decisão (botões) dentro do chat
    addMensagemSocAcao();

    // 2) Auditoria técnica (para Allure/Playwright)
    window.socLog?.({
      type: "soc_sugestao_crise",
      origem: d.origem || "sistema",
      motivo: d.motivo || "Sem motivo informado",
      cenarioId: d.cenarioId || "geral",
    });

    // 3) Registro narrativo (para entrar no relatório/PDF)
    window.dispatchEvent(
      new CustomEvent("logs:add", {
        detail: {
          id: d.cenarioId || "geral",
          log: {
            tipo: "soc_sugestao",
            timestamp: Date.now(),
            tecnico: "Sistema · SOC",
            acao: "🆘 Sugestão: abrir Sala de Crise",
            justificativa: d.motivo || "Sinal crítico detectado.",
          },
        },
      })
    );
  } catch (_) {
    // silencioso para não quebrar UX
  }
});
// ======================================================================
// 11) ENVIO DE MENSAGEM (FORM SUBMIT) — ESTE ERA O PONTO QUEBRADO
// ----------------------------------------------------------------------
// PROBLEMA anterior:
// - não existia listener de submit -> o browser recarregava a página
// - ao recarregar, o chat “fecha” e nada aparece
// SOLUÇÃO:
// - e.preventDefault() + fluxo completo (user -> typing -> IA -> resposta)
// - mantém chat aberto e foco no input
// ======================================================================
if (form && input) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const texto = input.value.trim();
    if (!texto) return;

    const textoLower = texto.toLowerCase();

    // ---------------------------------------------------------------
    // 11.1) Comando rápido pra testar SOC sem depender do analyzer:
    //       Digite: /soc
    // ---------------------------------------------------------------
    if (textoLower === "/soc") {
      input.value = "";
      addMensagemSocAcao();
      setTimeout(() => input?.focus(), 0);
      return;
    }

    // ---------------------------------------------------------------
    // 11.2) Fluxo normal: usuário -> IA
    // ---------------------------------------------------------------
    addMessage(texto, "user");
    input.value = "";

    // evento humano (se sua IA investigativa usar)
    window.dispatchEvent(
      new CustomEvent("ia:resposta_humana", {
        detail: { texto, timestamp: Date.now() },
      })
    );

    // animação "digitando..."
    const typing = document.createElement("div");
    typing.className = "ia-msg ia-msg--typing";
    typing.innerHTML = `
      <div class="ia-msg__avatar">AI</div>
      <div class="ia-msg__bubble">
        <div class="ia-dot"></div>
        <div class="ia-dot"></div>
        <div class="ia-dot"></div>
      </div>
    `;
    messages?.appendChild(typing);
    messages && (messages.scrollTop = messages.scrollHeight);

    try {
      const resposta = await IA(texto);

      typing.remove();
      addMessage(resposta, "ia");
    } catch (err) {
      typing.remove();
      addMessage("⚠️ Não consegui responder agora. Tente novamente.", "ia");

      // auditoria mínima sem quebrar UX
      window.socLog?.({
        type: "chat_ia_erro",
        erro: String(err?.message || err),
      });
    } finally {
      // mantém chat aberto e foco depois de enviar (evita "fecha" visual)
      setTimeout(() => input?.focus(), 0);
    }
  });
}


// ======================================================================
// 12) CHAT DRAGGABLE — Chat arrastável + launcher acompanha (seu original)
// ======================================================================
window.addEventListener("DOMContentLoaded", () => {
  const chatEl = document.getElementById("iaChat");
  const launcherEl = document.getElementById("iaLauncher");

  if (!chatEl || !launcherEl) return;

  const handle = document.querySelector(".ia-chat__header") || chatEl;

  let isDragging = false;
  let isTouch = false;
  let offsetX = 0;
  let offsetY = 0;

  handle.style.cursor = "grab";

  function limitarNaTela(element, x, y) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = element.getBoundingClientRect();

    const minX = 0;
    const maxX = vw - rect.width;
    const minY = 0;
    const maxY = vh - rect.height;

    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY),
    };
  }

  function iniciarArraste(px, py, viaTouch = false) {
    isDragging = true;
    isTouch = viaTouch;

    handle.style.cursor = viaTouch ? "default" : "grabbing";

    chatEl.style.transition = "none";
    launcherEl.style.transition = "none";

    chatEl.style.right = "auto";
    chatEl.style.bottom = "auto";
    launcherEl.style.right = "auto";
    launcherEl.style.bottom = "auto";

    const rect = chatEl.getBoundingClientRect();
    offsetX = px - rect.left;
    offsetY = py - rect.top;

    chatEl.style.touchAction = "none";
  }

  function mover(px, py) {
    if (!isDragging) return;

    const pos = limitarNaTela(chatEl, px - offsetX, py - offsetY);

    chatEl.style.left = `${pos.x}px`;
    chatEl.style.top = `${pos.y}px`;

    const rect = chatEl.getBoundingClientRect();

    launcherEl.style.left = `${rect.left}px`;
    launcherEl.style.top = `${rect.bottom + 12}px`;

    launcherEl.style.right = "auto";
    launcherEl.style.bottom = "auto";
  }

  function finalizarArraste() {
    if (!isDragging) return;

    isDragging = false;
    isTouch = false;

    handle.style.cursor = "grab";

    chatEl.style.transition = "";
    launcherEl.style.transition = "";

    chatEl.style.touchAction = "";

    try {
      if (window.socLog) {
        const r = chatEl.getBoundingClientRect();
        window.socLog({
          type: "chat_drag_end",
          componente: "iaChat",
          x: Math.round(r.left),
          y: Math.round(r.top),
        });
      }
    } catch (_) {}
  }

  // MOUSE
  handle.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;
    iniciarArraste(event.clientX, event.clientY, false);
  });

  window.addEventListener("mousemove", (event) => {
    if (!isDragging || isTouch) return;
    mover(event.clientX, event.clientY);
  });

  window.addEventListener("mouseup", () => {
    if (!isDragging || isTouch) return;
    finalizarArraste();
  });

  // TOUCH
  handle.addEventListener("touchstart", (event) => {
    const touch = event.touches[0];
    iniciarArraste(touch.clientX, touch.clientY, true);
  });

  handle.addEventListener(
    "touchmove",
    (event) => {
      if (!isDragging || !isTouch) return;
      const touch = event.touches[0];
      mover(touch.clientX, touch.clientY);
      event.preventDefault();
    },
    { passive: false }
  );

  handle.addEventListener("touchend", () => {
    if (!isDragging || !isTouch) return;
    finalizarArraste();
  });
});


// ======================================================================
// 13) BOTÃO IA DRAGGABLE — se move sozinho e puxa o chat se estiver aberto
// ======================================================================
(function () {
  const launcher = document.getElementById("iaLauncher");
  const chat = document.getElementById("iaChat");
  if (!launcher) return;

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  launcher.style.cursor = "grab";

  launcher.addEventListener("mousedown", (ev) => {
    dragging = true;
    launcher.style.cursor = "grabbing";

    const rect = launcher.getBoundingClientRect();
    offsetX = ev.clientX - rect.left;
    offsetY = ev.clientY - rect.top;

    launcher.style.right = "auto";
    launcher.style.bottom = "auto";
  });

  window.addEventListener("mousemove", (ev) => {
    if (!dragging) return;

    const x = ev.clientX - offsetX;
    const y = ev.clientY - offsetY;

    launcher.style.left = `${x}px`;
    launcher.style.top = `${y}px`;

    if (chat && chat.classList.contains("ia-chat--open")) {
      const h = launcher.offsetHeight + 12;
      chat.style.left = `${x}px`;
      chat.style.top = `${y + h}px`;
      chat.style.right = "auto";
      chat.style.bottom = "auto";
    }
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
    launcher.style.cursor = "grab";
  });
})();
// ======================================================================
