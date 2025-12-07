// ======================================================================
// chat-ui.js — Controle visual + UX do Chat da IA
// ----------------------------------------------------------------------
//   ✔ Abrir / fechar chat
//   ✔ Exibir mensagens do usuário e da IA
//   ✔ Animação "digitando"
//   ✔ Scroll automático
//   ✔ Chat arrastável (mouse + touch)
//   ✔ Botão flutuante acompanha o chat ao arrastar
//   ✔ Sem treta com aria-hidden / foco
// ======================================================================

// ======================================================================
// 1) IMPORTA IA HÍBRIDA + Funções de Relatório
// ======================================================================
import { IA } from "./ai-hibrida.js";
import {
  gerarPDF,
  compartilharWhatsApp,
  compartilharEmail,
} from "./relatorio.js";

// ======================================================================
// 2) CAPTURA DOS ELEMENTOS DO CHAT
// ======================================================================

// Botão flutuante que abre a janela
const launcher = document.getElementById("iaLauncher");

// Janela inteira do chat
const chat = document.getElementById("iaChat");

// Botão para fechar o chat
const closeBtn = document.getElementById("iaChatClose");

// Área onde mensagens novas aparecem
const messages = document.getElementById("iaMessages");

// Formulário de envio de texto
const form = document.getElementById("iaForm");

// Campo onde o usuário digita
const input = document.getElementById("iaInput");

// ======================================================================
// 3) ABRIR CHAT (sem brigar com aria-hidden / foco)
// ======================================================================
if (launcher && chat) {
  launcher.addEventListener("click", () => {
    chat.classList.add("ia-chat--open");
    chat.style.pointerEvents = "auto";
    chat.setAttribute("aria-hidden", "false");

    if (input) {
      input.focus();
    }
  });
}
launcher.addEventListener("click", () => {
  chat.classList.add("ia-chat--open");

  // gruda no botão AO ABRIR
  const rect = launcher.getBoundingClientRect();
  chat.style.left = `${rect.left}px`;
  chat.style.top = `${rect.top - chat.offsetHeight - 12}px`;

  chat.style.right = "auto";
  chat.style.bottom = "auto";
});
// ======================================================================
// 4) FECHAR CHAT (remove foco ANTES de esconder)
// ======================================================================
if (closeBtn && chat) {
  closeBtn.addEventListener("click", () => {
    if (input) {
      input.blur();
    }

    chat.classList.remove("ia-chat--open");

    setTimeout(() => {
      chat.style.pointerEvents = "none";
      chat.setAttribute("aria-hidden", "true");
    }, 120);
  });
}
// ⚠️ SEM "fechar ao clicar fora" para não dar conflito com o arraste.

// ======================================================================
// 5) addMessage() — Cria mensagens na interface do chat
// ======================================================================
function addMessage(texto, sender = "ia") {
  if (!messages) return;

  const div = document.createElement("div");
  div.className =
    sender === "user" ? "ia-msg ia-msg--user" : "ia-msg ia-msg--ia";

  div.innerHTML = `
    <div class="ia-msg__avatar ${
      sender === "user" ? "ia-msg__avatar--user" : "ia-msg__avatar--ia"
    }">
      ${sender === "user" ? "R" : "AI"}
    </div>

    <div class="ia-msg__bubble">${texto}</div>
  `;

  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

// ======================================================================
// 6) ENVIO DA MENSAGEM (submit do formulário)
// ======================================================================
if (form && input) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const texto = input.value.trim();
    if (!texto) return;

    // mostra mensagem do usuário
    addMessage(texto, "user");
    input.value = "";

    // animação "digitando..."
    const typing = document.createElement("div");
    typing.className = "ia-msg ia-msg--typing";
    typing.innerHTML = `
      <div class="ia-msg__avatar ia-msg__avatar--ia">AI</div>
      <div class="ia-msg__bubble">
        <div class="ia-dot"></div>
        <div class="ia-dot"></div>
        <div class="ia-dot"></div>
      </div>
    `;
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    // chama IA híbrida
    const resposta = await IA(texto);

    // troca "digitando" pela resposta real
    typing.remove();
    addMessage(resposta);

    // Se resposta parecer diagnóstico, sugere PDF
    if (
      resposta.includes("Severidade:") ||
      resposta.includes("Impacto:") ||
      resposta.includes("Ação recomendada:")
    ) {
      chatAviso("📄 Deseja gerar PDF do incidente? Digite: gerar pdf");
    }
  });
}

// ======================================================================
// 7) chatAviso() — Mensagens internas do sistema
// ======================================================================
export function chatAviso(msg) {
  const area = document.getElementById("iaMessages");
  if (!area) return;

  const bloco = document.createElement("div");
  bloco.classList.add("ia-msg", "ia-msg--ia");

  bloco.innerHTML = `
    <div class="ia-msg__avatar ia-msg__avatar--ia">AI</div>
    <div class="ia-msg__bubble">
      <p class="ia-msg__text">${msg}</p>
    </div>
  `;

  area.appendChild(bloco);
  area.scrollTop = area.scrollHeight;
}

// Torna a função acessível globalmente para alertas automáticos
window.chatAviso = chatAviso;

// ======================================================================
// 8) CHAT DRAGGABLE — Chat arrastável + launcher acompanha
// ======================================================================
window.addEventListener("DOMContentLoaded", () => {
  const chatEl = document.getElementById("iaChat");
  const launcherEl = document.getElementById("iaLauncher");

  if (!chatEl || !launcherEl) return;

  // se tiver header, usamos como “alça”; senão, o próprio chat
  const handle = document.querySelector(".ia-chat__header") || chatEl;

  let isDragging = false;
  let isTouch = false;
  let offsetX = 0;
  let offsetY = 0;

  handle.style.cursor = "grab";

  // limita o elemento na viewport
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

    // tira transições pra não “pular”
    chatEl.style.transition = "none";
    launcherEl.style.transition = "none";

    // remove amarras de right/bottom (CSS) para usar left/top
    chatEl.style.right = "auto";
    chatEl.style.bottom = "auto";
    launcherEl.style.right = "auto";
    launcherEl.style.bottom = "auto";

    const rect = chatEl.getBoundingClientRect();
    offsetX = px - rect.left;
    offsetY = py - rect.top;

    // evita scroll enquanto arrasta
    chatEl.style.touchAction = "none";
  }

  function mover(px, py) {
    if (!isDragging) return;

    const pos = limitarNaTela(chatEl, px - offsetX, py - offsetY);

    // move chat
    chatEl.style.left = `${pos.x}px`;
    chatEl.style.top = `${pos.y}px`;

    // pega posição real do chat após mover
    const rect = chatEl.getBoundingClientRect();

    // move launcher logo abaixo do chat (12px)
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

    // devolve transições suaves
    chatEl.style.transition = "";
    launcherEl.style.transition = "";

    chatEl.style.touchAction = "";
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
      event.preventDefault(); // impede scroll
    },
    { passive: false }
  );

  handle.addEventListener("touchend", () => {
    if (!isDragging || !isTouch) return;
    finalizarArraste();
  });
});
// ======================================================================
// 9) BOTÃO IA DRAGGABLE — se move sozinho e puxa o chat se estiver aberto
// ======================================================================
(function () {
  const launcher = document.getElementById("iaLauncher");
  const chat = document.getElementById("iaChat");
  if (!launcher) return;

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  // cursor igual ao temporizador
  launcher.style.cursor = "grab";

  launcher.addEventListener("mousedown", (ev) => {
    dragging = true;
    launcher.style.cursor = "grabbing";

    const rect = launcher.getBoundingClientRect();
    offsetX = ev.clientX - rect.left;
    offsetY = ev.clientY - rect.top;

    // deixar o botão livre para mover
    launcher.style.right = "auto";
    launcher.style.bottom = "auto";
  });

  window.addEventListener("mousemove", (ev) => {
    if (!dragging) return;

    const x = ev.clientX - offsetX;
    const y = ev.clientY - offsetY;

    launcher.style.left = `${x}px`;
    launcher.style.top = `${y}px`;

    // se o chat estiver aberto, acompanha
    if (chat && chat.classList.contains("ia-chat--open")) {
      const h = launcher.offsetHeight + 12; // distância entre eles
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
// FIM DO ARQUIVO — Chat flutuante, arrastável, botão acompanha
// ======================================================================
