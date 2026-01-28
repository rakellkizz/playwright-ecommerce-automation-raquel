// ======================================================================
// timer.js — Motor central do temporizador de testes
// ----------------------------------------------------------------------
// ✔ Inicia contagem regressiva
// ✔ Dispara callbacks (onStart, onTick, onFinish, onCancel)
// ✔ Exposição GLOBAL segura (sem ES Modules)
// ======================================================================

(function () {
  let timerId = null;
  let restante = 0;
  let duracaoAtual = 0;
  let callbacksAtuais = null;

  // --------------------------------------------------------------
  // 🧮 formatarTempo(segundos)
  // --------------------------------------------------------------
  function formatarTempo(segundos) {
    const s = Math.max(0, Math.floor(segundos));
    const minutos = String(Math.floor(s / 60)).padStart(2, "0");
    const seg = String(s % 60).padStart(2, "0");
    return `${minutos}:${seg}`;
  }

  // --------------------------------------------------------------
  // 📡 obterEstadoTemporizador()
  // --------------------------------------------------------------
  function obterEstadoTemporizador() {
    return {
      ativo: timerId !== null,
      restante,
      duracao: duracaoAtual
    };
  }

  // --------------------------------------------------------------
  // 🛑 cancelarTemporizador()
  // --------------------------------------------------------------
  function cancelarTemporizador() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;

      if (callbacksAtuais?.onCancel) {
        callbacksAtuais.onCancel();
      }
    }
  }

  // --------------------------------------------------------------
  // ▶ iniciarTemporizador(segundos, callbacks)
  // --------------------------------------------------------------
  function iniciarTemporizador(segundos, callbacks = {}) {
    const total = Math.max(1, Math.floor(segundos || 0));

    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }

    duracaoAtual = total;
    restante = total;
    callbacksAtuais = callbacks;

    callbacks.onStart?.(duracaoAtual);
    callbacks.onTick?.(restante, duracaoAtual);

    timerId = setInterval(() => {
      restante -= 1;

      callbacksAtuais?.onTick?.(restante, duracaoAtual);

      if (restante <= 0) {
        clearInterval(timerId);
        timerId = null;
        callbacksAtuais?.onFinish?.();
      }
    }, 1000);
  }

  // --------------------------------------------------------------
  // 🌍 EXPOSIÇÃO GLOBAL (compatível com todo o projeto)
  // --------------------------------------------------------------
  window.TimerEngine = {
    iniciarTemporizador,
    cancelarTemporizador,
    obterEstadoTemporizador,
    formatarTempo
  };
})();
// ======================================================================
// Fim do timer.js
// ====================================================================== 