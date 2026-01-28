// ======================================================================
// timer-controller.js — Controlador principal do temporizador
// ----------------------------------------------------------------------
// ✔ Faz a ponte entre HUD, barra inferior, tests-engine e telemetria
// ✔ Controla INICIAR / PARAR manual
// ✔ Controla modo AUTOMÁTICO ON/OFF
// ✔ Permite duração configurável pelo técnico
// ✔ Permite intervalo automático configurável
// ✔ Atualiza barra inferior + HUD em tempo real
// ✔ Dispara eventos para o tests-engine.js
//
// 🔒 AJUSTES APLICADOS:
// ✔ Resize manual REAL (sem enganar cursor)
// ✔ Guard contra conflito entre drag e resize
// ✔ Persistência de tamanho funcionando
// ✔ Sem alterar layout, IDs ou estrutura
// ======================================================================


// ======================================================================
// ELEMENTOS DO HUD (todos EXISTENTES no seu HTML — nada criado aqui)
// ======================================================================

// HUD principal
const hud = document.getElementById("timerHud");
const hudTime = document.getElementById("timerHudTime");
const hudStatus = document.getElementById("timerHudStatus");

// Botões
const btnStart = document.getElementById("timerHudStart");
const btnStop = document.getElementById("timerHudStop");
const btnAutoToggle = document.getElementById("timerAutoToggle");

// Inputs do técnico
const inputDuracao = document.getElementById("timerDuracao");
const inputAutoIntervalo = document.getElementById("timerAutoIntervalo");

// HUD automático
const autoNextWrapper = document.getElementById("autoNextWrapper");
const autoNextFill = document.getElementById("autoNextFill");
const autoNextTime = document.getElementById("autoNextTime");

// Barra inferior
const bar = document.getElementById("timerBar");
const barFill = document.getElementById("timerBarFill");
const barLabel = document.getElementById("timerBarLabel");


// ======================================================================
// ESTADO INTERNO DO TEMPORIZADOR
// ======================================================================
let intervaloPrincipal = null;
let tempoRestante = 0;
let duracaoCiclo = 60;
let automaticoAtivo = false;
let intervaloAutoMin = 30;

let proximoCountdownSeg = 0;
let autoIntervalId = null;


// ======================================================================
// FORMATAÇÃO DE TEMPO (mm:ss)
// ======================================================================
function formatar(seg) {
  const m = String(Math.floor(seg / 60)).padStart(2, "0");
  const s = String(seg % 60).padStart(2, "0");
  return `${m}:${s}`;
}


// ======================================================================
// STOP SAFE — evita crashes ao parar automático
// ======================================================================
function pararCountdownAutomatico() {
  try {
    if (autoIntervalId) {
      clearInterval(autoIntervalId);
      autoIntervalId = null;
    }

    proximoCountdownSeg = 0;

    if (autoNextWrapper) {
      autoNextWrapper.hidden = true;
      autoNextWrapper.classList.remove("auto-next--blink");
    }
  } catch (_) {}
}


// ======================================================================
// INICIAR CICLO MANUAL
// ======================================================================
function iniciarCicloManual() {
  duracaoCiclo = Math.max(5, Number(inputDuracao.value) || 60);
  tempoRestante = duracaoCiclo;

  hudStatus.textContent = "Executando testes…";
  hudTime.textContent = formatar(tempoRestante);
  barLabel.textContent = "Ciclo de testes em execução…";
  barFill.style.width = "0%";

  dispatchEvent(new CustomEvent("testes:iniciar", {
    detail: { total: duracaoCiclo }
  }));

  pararCountdownAutomatico();
  iniciarLoopPrincipal();
}


// ======================================================================
// LOOP PRINCIPAL (1s)
// ======================================================================
function iniciarLoopPrincipal() {
  clearInterval(intervaloPrincipal);

  intervaloPrincipal = setInterval(() => {
    tempoRestante--;

    hudTime.textContent = formatar(tempoRestante);

    const progresso = ((duracaoCiclo - tempoRestante) / duracaoCiclo) * 100;
    barFill.style.width = `${progresso}%`;

    dispatchEvent(new CustomEvent("testes:tick", {
      detail: { total: duracaoCiclo, restante: tempoRestante }
    }));

    if (tempoRestante <= 0) finalizarCiclo();
  }, 1000);
}


// ======================================================================
// FINALIZAR CICLO
// ======================================================================
function finalizarCiclo() {
  clearInterval(intervaloPrincipal);

  hudStatus.textContent = "Ciclo encerrado";
  barLabel.textContent = "Ciclo de testes finalizado.";
  barFill.style.width = "100%";

  dispatchEvent(new CustomEvent("testes:finalizar"));

  if (automaticoAtivo) iniciarCountdownAutomatico();
}


// ======================================================================
// PARAR MANUAL
// ======================================================================
function pararCiclo() {
  clearInterval(intervaloPrincipal);
  hudStatus.textContent = "Interrompido pelo técnico";
  barLabel.textContent = "Execução pausada manualmente.";
}


// ======================================================================
// MODO AUTOMÁTICO ON/OFF
// ======================================================================
btnAutoToggle.addEventListener("click", () => {
  automaticoAtivo = !automaticoAtivo;

  if (automaticoAtivo) {
    btnAutoToggle.textContent = "⏱️ Automático: ON";
    btnAutoToggle.classList.add("ativo");

    intervaloAutoMin = Math.max(1, Number(inputAutoIntervalo.value) || 30);
    iniciarCountdownAutomatico();
  } else {
    btnAutoToggle.textContent = "⏱️ Automático: OFF";
    btnAutoToggle.classList.remove("ativo");
    pararCountdownAutomatico();
  }
});


// ======================================================================
// COUNTDOWN AUTOMÁTICO
// ======================================================================
function iniciarCountdownAutomatico() {
  autoNextWrapper.hidden = false;
  proximoCountdownSeg = intervaloAutoMin * 60;
  atualizarAutoNextHUD();

  clearInterval(autoIntervalId);

  autoIntervalId = setInterval(() => {
    proximoCountdownSeg--;
    atualizarAutoNextHUD();

    if (proximoCountdownSeg <= 0) {
      clearInterval(autoIntervalId);
      autoNextWrapper.hidden = true;
      iniciarCicloManual();
    }
  }, 1000);
}

function atualizarAutoNextHUD() {
  autoNextTime.textContent = formatar(proximoCountdownSeg);

  const totalSeg = intervaloAutoMin * 60;
  autoNextFill.style.width =
    `${100 - ((proximoCountdownSeg / totalSeg) * 100)}%`;
}


// ======================================================================
// EVENTOS DOS BOTÕES
// ======================================================================
btnStart.addEventListener("click", iniciarCicloManual);
btnStop.addEventListener("click", pararCiclo);


// ======================================================================
// 🔒 GUARD DE RESIZE — evita conflito drag × resize
// ----------------------------------------------------------------------
// • Detecta quando o usuário está redimensionando pela borda
// • Impede que outros guards capturem o mouse
// ======================================================================
(function () {
  if (!hud) return;

  hud.addEventListener("mousedown", (e) => {
    const r = hud.getBoundingClientRect();
    const margem = 12;

    const emResize =
      e.clientX >= r.right - margem ||
      e.clientY >= r.bottom - margem;

    if (emResize) hud.__resizing = true;
  });

  window.addEventListener("mouseup", () => {
    hud.__resizing = false;
  });
})();


// ======================================================================
// 💾 RESIZE — Persistência do tamanho do HUD
// ----------------------------------------------------------------------
// • Não cria resize (CSS faz isso)
// • Apenas salva/restaura width/height
// ======================================================================
(function () {
  if (!hud) return;

  const KEY = "timerhud:size";

  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved?.w && saved?.h) {
      hud.style.width = saved.w + "px";
      hud.style.height = saved.h + "px";
    }
  } catch (_) {}

  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(() => {
      try {
        const r = hud.getBoundingClientRect();
        localStorage.setItem(KEY, JSON.stringify({
          w: Math.round(r.width),
          h: Math.round(r.height),
        }));
      } catch (_) {}
    });
    ro.observe(hud);
  }
})();


// ======================================================================
// DEBUG CONTROLADO
// ======================================================================
window.__timerController = {
  iniciarCicloManual,
  pararCiclo,
  estado: () => ({
    tempoRestante,
    duracaoCiclo,
    automaticoAtivo,
    intervaloAutoMin
  })
};
// ======================================================================
// fim do timer-controller.js
// ======================================================================