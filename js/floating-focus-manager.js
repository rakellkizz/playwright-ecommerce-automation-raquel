// =====================================================================
// floating-focus-manager.js — Gerenciador de foco e soberania de HUDs
// ---------------------------------------------------------------------
// Resolve DEFINITIVAMENTE (sem quebrar drag/resize):
// • Timer sumindo ao clicar
// • Chat interferindo no Timer
// • Conflito com listeners globais (click-outside)
// • Foco/Z-index dos HUDs
//
// NÃO altera layout
// NÃO altera drag
// NÃO altera resize
// Apenas protege HUDs flutuantes
// =====================================================================

(function () {
  // -------------------------------------------------------------------
  // GUARDA GLOBAL — evita múltiplas inicializações
  // -------------------------------------------------------------------
  if (window.__floatingFocusManagerLoaded) return;
  window.__floatingFocusManagerLoaded = true;

  // -------------------------------------------------------------------
  // HUDs SOBERANOS — nunca devem sofrer "click-outside"
  // -------------------------------------------------------------------
  const HUD_SELECTORS = [
    "#iaChat",
    "#iaLauncher",
    "#timerHud",
    "#socDashboard"
  ];

  // -------------------------------------------------------------------
  // Z-INDEX PROGRESSIVO (apenas visual)
  // -------------------------------------------------------------------
  const BASE_Z = 9000;
  let zCounter = BASE_Z;

  function bringToFront(el) {
    if (!el) return;
    zCounter += 1;
    el.style.zIndex = zCounter;
  }

  // -------------------------------------------------------------------
  // DETECTA CANTO DE RESIZE DO TIMER (CRÍTICO)
  // -------------------------------------------------------------------
  function isResizingTimerHud(e, hud) {
    if (!hud) return false;

    const r = hud.getBoundingClientRect();
    const margem = 20; // margem confortável do canto

    return (
      e.target === hud &&
      e.clientX >= r.right - margem &&
      e.clientY >= r.bottom - margem
    );
  }

  // -------------------------------------------------------------------
  // PROTEÇÃO INTELIGENTE POR HUD
  // -------------------------------------------------------------------
  function protectHUD(selector) {
    const el = document.querySelector(selector);
    if (!el) return;

    // ===============================================================
    // POINTER / MOUSE DOWN
    // ===============================================================
    ["mousedown", "pointerdown", "touchstart"].forEach((evt) => {
      el.addEventListener(
        evt,
        (e) => {
          // ---------------------------------------------------------
          // TIMER HUD — regra especial
          // ---------------------------------------------------------
          if (el.id === "timerHud") {
            // 🟢 Se for resize → NÃO INTERFERIR EM NADA
            if (isResizingTimerHud(e, el)) {
              bringToFront(el);
              return;
            }

            // 🟡 Clique normal dentro do timer
            bringToFront(el);
            e.stopPropagation();
            return;
          }

          // ---------------------------------------------------------
          // OUTROS HUDs (chat, launcher, dashboard)
          // ---------------------------------------------------------
          bringToFront(el);
          e.stopPropagation();
        },
        false // 🔑 BUBBLE — nunca capture
      );
    });

    // ===============================================================
    // CLICK — apenas para bloquear "click-outside"
    // ===============================================================
    el.addEventListener(
      "click",
      (e) => {
        // Timer: clique no canto pode ser resize → deixa passar
        if (el.id === "timerHud" && isResizingTimerHud(e, el)) return;

        e.stopPropagation();
      },
      false
    );
  }

  // -------------------------------------------------------------------
  // Ativa proteção nos HUDs
  // -------------------------------------------------------------------
  HUD_SELECTORS.forEach(protectHUD);

})();
// =====================================================================
// Fim do floating-focus-manager.js
// =====================================================================
