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
// ======================================================================


// ======================================================================
// ELEMENTOS DO HUD (todos EXISTENTES no seu HTML — nada criado aqui)
// ======================================================================

// HUD
const hud = document.getElementById("timerHud");
const hudTime = document.getElementById("timerHudTime");
const hudStatus = document.getElementById("timerHudStatus");

// Botões principais
const btnStart = document.getElementById("timerHudStart");
const btnStop = document.getElementById("timerHudStop");

// Configurações do técnico
const inputDuracao = document.getElementById("timerDuracao");
const inputAutoIntervalo = document.getElementById("timerAutoIntervalo");
const btnAutoToggle = document.getElementById("timerAutoToggle");

// Barra automática
const autoNextWrapper = document.getElementById("autoNextWrapper");
const autoNextFill = document.getElementById("autoNextFill");
const autoNextTime = document.getElementById("autoNextTime");

// Barra inferior global
const bar = document.getElementById("timerBar");
const barFill = document.getElementById("timerBarFill");
const barLabel = document.getElementById("timerBarLabel");


// ======================================================================
// ESTADOS INTERNOS DO TEMPORIZADOR
// ======================================================================
let intervaloPrincipal = null;
let tempoRestante = 0;
let duracaoCiclo = 60; // padrão
let automaticoAtivo = false;
let intervaloAutoMin = 30; // minutos → configurado pelo técnico

// Controle para próximo ciclo automático
let proximoCountdownSeg = 0;
let autoIntervalId = null;


// ======================================================================
// FUNÇÃO DE FORMATAÇÃO DE TEMPO (mm:ss)
// ======================================================================
function formatar(seg) {
  const m = String(Math.floor(seg / 60)).padStart(2, "0");
  const s = String(seg % 60).padStart(2, "0");
  return `${m}:${s}`;
}


// ======================================================================
// INICIAR O CICLO DE TESTES MANUALMENTE
// ======================================================================
function iniciarCicloManual() {

  // 1) Captura duração escolhida pelo técnico
  duracaoCiclo = Math.max(5, Number(inputDuracao.value) || 60);
  tempoRestante = duracaoCiclo;

  // 2) Atualiza HUD imediatamente
  hudStatus.textContent = "Executando testes…";
  hudTime.textContent = formatar(tempoRestante);
  barLabel.textContent = "Ciclo de testes em execução…";
  barFill.style.width = "0%";

  // 3) Dispara evento para tests-engine iniciar
  dispatchEvent(new CustomEvent("testes:iniciar", {
    detail: { total: duracaoCiclo }
  }));

  // 4) Garante que qualquer ciclo automático anterior pare
  if (typeof pararCountdownAutomatico === "function") {
  pararCountdownAutomatico();
}

  // 5) Ativa loop principal
  iniciarLoopPrincipal();
}


// ======================================================================
// LOOP PRINCIPAL — roda 1 vez por segundo
// ======================================================================
function iniciarLoopPrincipal() {

  clearInterval(intervaloPrincipal);

  intervaloPrincipal = setInterval(() => {
    tempoRestante--;

    // Atualiza HUD
    hudTime.textContent = formatar(tempoRestante);

    // Atualiza barra inferior global
    const progresso = ((duracaoCiclo - tempoRestante) / duracaoCiclo) * 100;
    barFill.style.width = `${progresso}%`;

    // Dispara evento de tick para o tests-engine
    dispatchEvent(new CustomEvent("testes:tick", {
      detail: {
        total: duracaoCiclo,
        restante: tempoRestante
      }
    }));

    // Quando chega a zero → ENCERRA
    if (tempoRestante <= 0) {
      finalizarCiclo();
    }

  }, 1000);
}


// ======================================================================
// FINALIZAR CICLO (manual ou automático)
// ======================================================================
function finalizarCiclo() {
  clearInterval(intervaloPrincipal);

  hudStatus.textContent = "Ciclo encerrado";
  barLabel.textContent = "Ciclo de testes finalizado.";

  // Fecha a barra
  barFill.style.width = "100%";

  // Informa ao tests-engine.js que terminou
  dispatchEvent(new CustomEvent("testes:finalizar"));

  // Caso modo automático esteja ON → começa contagem para novo ciclo
  if (automaticoAtivo) {
    iniciarCountdownAutomatico();
  }
}


// ======================================================================
// PARAR CICLO MANUALMENTE (botão Parar)
// ======================================================================
function pararCiclo() {
  clearInterval(intervaloPrincipal);
  hudStatus.textContent = "Parado pelo técnico";
  barLabel.textContent = "Execução pausada manualmente.";
}


// ======================================================================
// SISTEMA AUTOMÁTICO — ON/OFF
// ======================================================================
btnAutoToggle.addEventListener("click", () => {
  automaticoAtivo = !automaticoAtivo;

  if (automaticoAtivo) {
    btnAutoToggle.textContent = "⏱️ Automático: ON";
    btnAutoToggle.classList.add("ativo");

    // Ajusta intervalo automático
    intervaloAutoMin = Math.max(1, Number(inputAutoIntervalo.value) || 30);

    iniciarCountdownAutomatico();

  } else {
    btnAutoToggle.textContent = "⏱️ Automático: OFF";
    btnAutoToggle.classList.remove("ativo");

    pararCountdownAutomatico();
  }
});


// ======================================================================
// COUNTDOWN AUTOMÁTICO PARA PRÓXIMA RODADA
// ======================================================================
function iniciarCountdownAutomatico() {
  autoNextWrapper.hidden = false;

  // Total em segundos
  proximoCountdownSeg = intervaloAutoMin * 60;
  atualizarAutoNextHUD();

  clearInterval(autoIntervalId);

  autoIntervalId = setInterval(() => {
    proximoCountdownSeg--;

    atualizarAutoNextHUD();

    if (proximoCountdownSeg <= 0) {
      clearInterval(autoIntervalId);

      autoNextWrapper.classList.remove("auto-next--blink"); // limpa pisca
      autoNextWrapper.hidden = true;

      // INICIA NOVA RODADA AUTOMÁTICA
      iniciarCicloManual();
    }
  }, 1000);
}
// Atualiza HUD da barra automática
function atualizarAutoNextHUD() {
  autoNextTime.textContent = formatar(proximoCountdownSeg);

  const perc = 100 - ((proximoCountdownSeg / (intervaloAutoMin * 60)) * 100);
  autoNextFill.style.width = `${perc}%`;

  // ------------------------------------------------------------
  // 🔔 Piscar quando estiver perto de iniciar a rodada automática
  // ------------------------------------------------------------
  const AVISO_SEG = 10; // você pode trocar (ex.: 15, 20)

  if (proximoCountdownSeg > 0 && proximoCountdownSeg <= AVISO_SEG) {
    autoNextWrapper.classList.add("auto-next--blink");

    // (opcional) avisar sistemas/IA/chat que está prestes a iniciar
    dispatchEvent(new CustomEvent("testes:preparar", {
      detail: { faltamSegundos: proximoCountdownSeg }
    }));
  } else {
    autoNextWrapper.classList.remove("auto-next--blink");
  }
}

// ======================================================================
// EVENTOS DOS BOTÕES PRINCIPAIS
// ======================================================================
btnStart.addEventListener("click", iniciarCicloManual);
btnStop.addEventListener("click", pararCiclo);


// ======================================================================
// DEBUG OPCIONAL
// ======================================================================
window.__timerController = {
  iniciarCicloManual,
  pararCiclo,
  iniciarCountdownAutomatico,
  estado: () => ({
    tempoRestante,
    duracaoCiclo,
    automaticoAtivo,
    intervaloAutoMin
  })
};
// =======================================================
// SOC — Atualiza estado visual do HUD do temporizador
// =======================================================
function atualizarEstadoHud(estado, detalhe = "") {
  const hud = document.getElementById("timerHud");
  const status = document.getElementById("timerHudStatus");

  if (!hud) return;

  // limpa estados anteriores
  hud.classList.remove("timer-ok", "timer-manutencao", "timer-critico");

  // aplica estado atual
  if (estado === "ok") {
    hud.classList.add("timer-ok");
    if (status) status.textContent = "Operação normal";
  }

  if (estado === "manutencao") {
    hud.classList.add("timer-manutencao");
    if (status) status.textContent = detalhe || "Atenção operacional";
  }

  if (estado === "critico") {
    hud.classList.add("timer-critico");
    if (status) status.textContent = detalhe || "Anomalia detectada";
  }
}
