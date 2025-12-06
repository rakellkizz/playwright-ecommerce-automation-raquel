// ======================================================================
// timer.js — Motor central do temporizador de testes
// Responsável por:
//   - Iniciar contagem regressiva
//   - Disparar callbacks (onStart, onTick, onFinish, onCancel)
//   - Expor estado atual para outros módulos (HUD, barra, chat)
// ======================================================================

let timerId = null;         // ID do setInterval ativo (se existir)
let restante = 0;           // Segundos restantes
let duracaoAtual = 0;       // Duração configurada para este ciclo
let callbacksAtuais = null; // Conjunto de callbacks ativos


// ======================================================================
// 🧮 formatarTempo(segundos)
// Converte segundos → "MM:SS" (ex.: 75 → "01:15")
// ======================================================================
export function formatarTempo(segundos) {
  const s = Math.max(0, Math.floor(segundos));
  const minutos = String(Math.floor(s / 60)).padStart(2, "0");
  const seg = String(s % 60).padStart(2, "0");
  return `${minutos}:${seg}`;
}


// ======================================================================
// 📡 obterEstadoTemporizador()
// Permite que outros módulos consultem o estado atual
// ======================================================================
export function obterEstadoTemporizador() {
  return {
    ativo: timerId !== null,
    restante,
    duracao: duracaoAtual
  };
}


// ======================================================================
// 🛑 cancelarTemporizador()
// Cancela o timer se estiver rodando
// ======================================================================
export function cancelarTemporizador() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;

    if (callbacksAtuais && typeof callbacksAtuais.onCancel === "function") {
      callbacksAtuais.onCancel();
    }
  }
}


// ======================================================================
// ▶ iniciarTemporizador(segundos, { onStart, onTick, onFinish, onCancel })
// Dispara um novo temporizador, cancelando o anterior se existir
// ======================================================================
export function iniciarTemporizador(segundos, callbacks = {}) {
  // Garante valor mínimo de 1 segundo
  const total = Math.max(1, Math.floor(segundos || 0));

  // Cancela timer anterior, se estiver ativo
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }

  duracaoAtual = total;
  restante = total;
  callbacksAtuais = callbacks;

  // Callback de início
  if (typeof callbacks.onStart === "function") {
    callbacks.onStart(duracaoAtual);
  }

  // Primeiro tick manual (estado inicial)
  if (typeof callbacks.onTick === "function") {
    callbacks.onTick(restante, duracaoAtual);
  }

  // Cria ciclo de 1 segundo
  timerId = setInterval(() => {
    restante -= 1;

    // Notifica cada tick
    if (typeof callbacksAtuais?.onTick === "function") {
      callbacksAtuais.onTick(restante, duracaoAtual);
    }

    // Quando chega a 0 ou menos → finaliza
    if (restante <= 0) {
      clearInterval(timerId);
      timerId = null;

      if (typeof callbacksAtuais?.onFinish === "function") {
        callbacksAtuais.onFinish();
      }
    }
  }, 1000);
}
// ======================================================================
// FIM DO ARQUIVO — 100% limpo, sem duplicações, pronto para produção 🚀
// ======================================================================