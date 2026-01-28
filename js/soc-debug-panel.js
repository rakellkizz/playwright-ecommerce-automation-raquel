// ======================================================================
// soc-debug-panel.js — Painel operacional SOC (modo demonstração)
// ----------------------------------------------------------------------
// ✔ NÃO interfere no sistema
// ✔ NÃO altera lógica existente
// ✔ Apenas dispara eventos reais
// ✔ Só aparece se ?debug=1
// ======================================================================

(function socDebugPanel() {
  // 🔒 Guard
  if (window.__SOC_DEBUG_PANEL__) return;
  window.__SOC_DEBUG_PANEL__ = true;

  // Só ativa em modo debug
  const params = new URLSearchParams(window.location.search);
  if (params.get("debug") !== "1") return;

  const cenarios = ["login", "carrinho", "checkout", "busca", "smoke", "perfil"];

  // Container
  const panel = document.createElement("div");
  panel.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 99999;
    background: rgba(15,15,30,.95);
    border: 1px solid #6c5ce7;
    border-radius: 12px;
    padding: 12px;
    font-family: system-ui, sans-serif;
    color: #fff;
    max-width: 280px;
  `;

  panel.innerHTML = `<strong>🛠️ SOC Ops (Debug)</strong><br/><small>Disparos manuais</small><hr/>`;

  cenarios.forEach((c) => {
    const bloco = document.createElement("div");
    bloco.style.marginBottom = "8px";

    bloco.innerHTML = `
      <div style="margin-bottom:4px"><strong>${c}</strong></div>
      <button data-a="anomalia">⚠️ Anomalia</button>
      <button data-a="erro">🚨 Crise</button>
      <button data-a="manut">🟡 Manut.</button>
      <button data-a="ok">✅ OK</button>
    `;

    bloco.querySelectorAll("button").forEach((btn) => {
      btn.style.cssText = `
        margin:2px;
        padding:4px 6px;
        font-size:12px;
        cursor:pointer;
      `;

      btn.onclick = () => {
        const a = btn.dataset.a;

        if (a === "anomalia") {
          dispatch("testes:anomalia", c);
        }
        if (a === "erro") {
          dispatch("testes:erro-critico", c);
        }
        if (a === "manut") {
          dispatch("testes:manutencao", c);
        }
        if (a === "ok") {
          dispatch("testes:finalizar", null);
        }
      };
    });

    panel.appendChild(bloco);
  });

  document.body.appendChild(panel);

  function dispatch(ev, cenario) {
    window.dispatchEvent(
      new CustomEvent(ev, {
        detail: cenario ? { cenario } : {},
      })
    );
  }
})();
