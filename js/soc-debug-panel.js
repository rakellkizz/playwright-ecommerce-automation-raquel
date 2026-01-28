// ======================================================================
// soc-debug-panel.js — Painel operacional SOC (modo demonstração)
// ----------------------------------------------------------------------
// ✔ NÃO interfere no sistema
// ✔ NÃO altera lógica existente
// ✔ Apenas dispara eventos reais
// ✔ Só aparece se ?debug=1
// ✔ BLINDADO contra DOM ainda não carregado
// ======================================================================

(function socDebugPanel() {
  // --------------------------------------------------------------------
  // 🔒 GUARD GLOBAL — impede inicialização duplicada
  // --------------------------------------------------------------------
  if (window.__SOC_DEBUG_PANEL__) return;
  window.__SOC_DEBUG_PANEL__ = true;

  // --------------------------------------------------------------------
  // 🔎 ATIVA SOMENTE EM MODO DEBUG (?debug=1)
  // --------------------------------------------------------------------
  const params = new URLSearchParams(window.location.search);
  if (params.get("debug") !== "1") return;

  // --------------------------------------------------------------------
  // 📋 CENÁRIOS SUPORTADOS
  // --------------------------------------------------------------------
  const cenarios = ["login", "carrinho", "checkout", "busca", "smoke", "perfil"];

  // --------------------------------------------------------------------
  // 🧱 FUNÇÃO DE CONSTRUÇÃO DO PAINEL
  // (isolada para permitir fallback via DOMContentLoaded)
  // --------------------------------------------------------------------
  function montarPainel() {
    // Garante body disponível
    if (!document.body) return;

    // Container principal
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

    panel.innerHTML = `
      <strong>🛠️ SOC Ops (Debug)</strong><br/>
      <small>Disparos manuais</small>
      <hr/>
    `;

    // --------------------------------------------------------------
    // Botões por cenário
    // --------------------------------------------------------------
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

          if (a === "anomalia") dispatch("testes:anomalia", c);
          if (a === "erro") dispatch("testes:erro-critico", c);
          if (a === "manut") dispatch("testes:manutencao", c);
          if (a === "ok") dispatch("testes:finalizar", null);
        };
      });

      panel.appendChild(bloco);
    });

    // --------------------------------------------------------------
    // 🔗 Anexa com segurança ao body
    // --------------------------------------------------------------
    document.body.appendChild(panel);

    console.info("🛡️ SOC Ops Debug carregado com sucesso");
  }

  // --------------------------------------------------------------------
  // 🕒 GARANTIA DE DOM — monta agora ou após DOMContentLoaded
  // --------------------------------------------------------------------
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", montarPainel);
  } else {
    montarPainel();
  }

  // --------------------------------------------------------------------
  // 📡 DISPATCH DE EVENTOS SOC
  // --------------------------------------------------------------------
  function dispatch(ev, cenario) {
    window.dispatchEvent(
      new CustomEvent(ev, {
        detail: cenario ? { cenario } : {},
      })
    );
  }
})();
// ======================================================================
// Fim do soc-debug-panel.js
// ======================================================================