// ======================================================================
// timer-hud-drag.js — Drag seguro do #timerHud (SEM quebrar resize)
// ----------------------------------------------------------------------
// Resolve DEFINITIVAMENTE:
// • Timer “colado” (drag interceptando tudo)
// • Resize nativo não funciona (mouse no canto não “pega”)
// • Clique em input/botões não quebra
//
// NÃO altera layout
// NÃO altera CSS
// Apenas controla DRAG com segurança
// ======================================================================

(function () {
  // --------------------------------------------------------------------
  // 0) Proteção contra carregar 2x
  // --------------------------------------------------------------------
  if (window.__timerHudDragLoaded) return;
  window.__timerHudDragLoaded = true;

  // --------------------------------------------------------------------
  // 1) Elementos do HUD
  // --------------------------------------------------------------------
  const hud = document.getElementById("timerHud");
  if (!hud) return;

  // Drag SOMENTE pelo header (isso é o que salva o resize)
  const header = hud.querySelector(".timer-hud__header");
  if (!header) return;

  // --------------------------------------------------------------------
  // 2) Helper: detecta se o mouse está no canto de resize
  //    (área inferior direita do HUD)
  // --------------------------------------------------------------------
  function isOnResizeCorner(e) {
    const r = hud.getBoundingClientRect();
    const margem = 18; // área “pegável” do canto (ajuste se quiser)
    return (
      e.clientX >= r.right - margem &&
      e.clientY >= r.bottom - margem
    );
  }

  // --------------------------------------------------------------------
  // 3) Estado do drag
  // --------------------------------------------------------------------
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  // --------------------------------------------------------------------
  // 4) Converte posição atual do HUD (top/left) com fallback
  //    Importante: drag usa top/left (não transform) para não brigar com resize
  // --------------------------------------------------------------------
  function getCurrentLeftTop() {
    const cs = getComputedStyle(hud);

    // Se top/left já existem em inline style, usa-os
    const left = parseFloat(hud.style.left || cs.left) || 0;
    const top = parseFloat(hud.style.top || cs.top) || 0;

    return { left, top };
  }

  // --------------------------------------------------------------------
  // 5) Mantém o HUD dentro da tela (anti-sumir)
  // --------------------------------------------------------------------
  function clampToViewport(left, top) {
    const r = hud.getBoundingClientRect();

    const maxLeft = window.innerWidth - r.width - 8;
    const maxTop = window.innerHeight - r.height - 8;

    return {
      left: Math.max(8, Math.min(left, maxLeft)),
      top: Math.max(8, Math.min(top, maxTop)),
    };
  }

  // --------------------------------------------------------------------
  // 6) Início do drag (apenas no header)
  // --------------------------------------------------------------------
  function onDown(e) {
    // Se clicou no canto de resize, NÃO inicia drag
    if (isOnResizeCorner(e)) return;

    // Se clicou em inputs/botões/elementos interativos dentro do header, não trava
    const t = e.target;
    if (t && (t.closest("button") || t.closest("input") || t.closest("select") || t.closest("textarea"))) {
      return;
    }

    // Aqui podemos “segurar” o evento do header para não selecionar texto
    // (mas não fazemos isso no HUD todo, só no header)
    e.preventDefault();

    dragging = true;
    hud.classList.add("dragging");

    // Posição inicial do mouse
    startX = e.clientX;
    startY = e.clientY;

    // Posição inicial do HUD
    const pos = getCurrentLeftTop();
    startLeft = pos.left;
    startTop = pos.top;

    // Força modo por top/left (pra não ficar preso no right/bottom)
    hud.style.right = "auto";
    hud.style.bottom = "auto";
    hud.style.left = startLeft + "px";
    hud.style.top = startTop + "px";

    // Captura movimentos no documento
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("mouseup", onUp, true);
  }

  // --------------------------------------------------------------------
  // 7) Movimento do drag
  // --------------------------------------------------------------------
  function onMove(e) {
    if (!dragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let nextLeft = startLeft + dx;
    let nextTop = startTop + dy;

    const clamped = clampToViewport(nextLeft, nextTop);
    hud.style.left = clamped.left + "px";
    hud.style.top = clamped.top + "px";
  }

  // --------------------------------------------------------------------
  // 8) Final do drag
  // --------------------------------------------------------------------
  function onUp() {
    dragging = false;
    hud.classList.remove("dragging");

    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("mouseup", onUp, true);
  }

  // --------------------------------------------------------------------
  // 9) Bind no header (drag só aqui!)
  // --------------------------------------------------------------------
  header.addEventListener("mousedown", onDown, { passive: false });

})();
// ======================================================================
// Fim do timer-hud-drag.js
// ======================================================================   