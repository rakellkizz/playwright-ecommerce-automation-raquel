// ======================================================================
// hud-event-shield.js — ESCUDO DE EVENTOS para HUDs flutuantes
// ----------------------------------------------------------------------
// Objetivo:
//  ✅ Impedir que cliques dentro do timer/chat/launcher "vazem" para
//     listeners globais (document/window) que estão fechando/sumindo HUDs.
//  ✅ Permitir RESIZE NATIVO do #timerHud (canto inferior direito)
//     sem o drag "roubar" o pointerdown.
// ----------------------------------------------------------------------
// Não altera layout.
// Não altera estilos.
// Só controla PROPAGAÇÃO de eventos de forma segura.
// ======================================================================

(function () {
  if (window.__hudEventShieldLoaded) return;
  window.__hudEventShieldLoaded = true;

  const HUDS = ["#timerHud", "#iaChat", "#iaLauncher"];

  // ------------------------------------------------------------
  // Detecta se o clique/pointerdown foi no "canto de resize" do timer
  // (área inferior direita).
  // ------------------------------------------------------------
  function isResizeCornerTimer(e) {
    const hud = document.getElementById("timerHud");
    if (!hud) return false;

    const r = hud.getBoundingClientRect();
    const margem = 18; // área do canto (ajuste fino)

    return e.clientX >= r.right - margem && e.clientY >= r.bottom - margem;
  }

  // ------------------------------------------------------------
  // 1) TRAVA o DRAG de roubar o resize:
  //    - Se o pointerdown cair no canto de resize, bloqueia apenas
  //      listeners de drag (sem impedir o resize nativo do browser).
  // ------------------------------------------------------------
  function bindTimerCornerGuard() {
    const hud = document.getElementById("timerHud");
    if (!hud) return;

    hud.addEventListener(
      "pointerdown",
      (e) => {
        if (isResizeCornerTimer(e)) {
          // NÃO usar preventDefault aqui (senão mata o resize nativo)
          // ✅ Bloqueia apenas listeners concorrentes (drag) no mesmo alvo
          e.stopImmediatePropagation();
          // ❌ Não usar stopPropagation aqui para não interferir no resize do browser
        }
      },
      true
    );
  }

  // ------------------------------------------------------------
  // 2) BLOQUEIA "clique vazando" pro document/window:
  //    - Se o alvo do evento estiver dentro de qualquer HUD,
  //      impedimos que listeners globais fechem/sumam os HUDs.
  //
  // ⚠️ Ajuste cirúrgico:
  //    - NÃO bloquear cliques em elementos interativos (botões/inputs/etc)
  //    - NÃO bloquear o launcher (ele precisa receber click)
  //    - NÃO usar stopImmediatePropagation no escudo geral,
  //      para não matar listeners internos dos próprios HUDs.
  // ------------------------------------------------------------
  function bindDocumentShield() {
    const events = ["click", "mousedown", "pointerdown", "touchstart"];

    events.forEach((evt) => {
      document.addEventListener(
  evt,
  (e) => {
    // 1️⃣ SEMPRE permitir controles clicáveis
    const interactive = e.target && e.target.closest
      ? e.target.closest("button, input, textarea, select, a, label, summary, details")
      : null;
    if (interactive) return;

    // 2️⃣ SEMPRE permitir handles de DRAG (senão HUD fica grudado)
    const dragHandle = e.target && e.target.closest
      ? e.target.closest(".timer-hud__header, .ia-chat__header, #iaLauncher")
      : null;
    if (dragHandle) return;

    // 3️⃣ Bloqueia apenas vazamento para listeners globais
    for (const sel of HUDS) {
      const el = document.querySelector(sel);
      if (el && el.contains(e.target)) {
        e.stopPropagation(); // ⚠️ NÃO usar stopImmediatePropagation
        return;
      }
    }
  },
  true // CAPTURE
);
});
}
  // Inicializa
  bindTimerCornerGuard();
  bindDocumentShield();
})();

// ======================================================================
// Fim do hud-event-shield.js
// ======================================================================
