// ======================================================================
// boot-init.js — Inicialização defensiva e observabilidade do sistema
// ======================================================================
//
// ✔ NÃO muda layout
// ✔ NÃO cria UI
// ✔ NÃO altera lógica existente
// ✔ Protege contra duplicação de execução
// ✔ Ativa debug sem F12 (?debug=1)
// ✔ Prepara coleta para Playwright / Allure
//
// ======================================================================

(() => {
  "use strict";

  // ==============================================================
  // 🛡️ GUARD GLOBAL — impede execução dupla
  // ==============================================================
  if (window.__BOOT_INIT_V1__) return;
  window.__BOOT_INIT_V1__ = true;

  // ==============================================================
  // 🔍 Detecta modo DEBUG via URL
  // Ex: index.html?debug=1
  // ==============================================================
  const DEBUG = new URLSearchParams(window.location.search).get("debug") === "1";

  // ==============================================================
  // 📦 Objeto público de observabilidade
  // ==============================================================
  const boot = {
    version: "1.0.0",
    debug: DEBUG,
    startedAt: Date.now(),
    events: [],
    smoke: {
      ran: false,
      ok: null,
      checks: []
    },

    // Snapshot seguro para testes (Playwright / Allure)
    dump() {
      return {
        boot: {
          version: this.version,
          debug: this.debug,
          uptimeMs: Date.now() - this.startedAt,
          lastEvents: this.events.slice(-30)
        },
        soc: {
          state: window.__socCollectorState ?? null,
          events: window.__socEvents ?? null
        }
      };
    }
  };

  window.__boot = boot;

  // ==============================================================
  // 🧠 Ring buffer de eventos
  // ==============================================================
  const MAX = 200;
  function record(evt, detail) {
    boot.events.push({ evt, t: Date.now(), detail });
    if (boot.events.length > MAX) boot.events.shift();
  }

  // ==============================================================
  // 🔁 LISTENERS OBSERVÁVEIS (blindados)
  // ==============================================================
  if (!window.__BOOT_LISTENERS__) {
    window.__BOOT_LISTENERS__ = true;

    [
      "ia:resposta_humana",
      "soc:continuar_analise",
      "crise:link",
      "logs:add",
      "soc_severidade_update"
    ].forEach((name) => {
      window.addEventListener(name, (ev) => {
        record(name, ev?.detail ?? null);
      });
    });
  }

  // ==============================================================
  // 🧪 SMOKE TESTS (somente em DEBUG)
  // ==============================================================
  function check(label, ok, extra) {
    boot.smoke.checks.push({ label, ok: !!ok, extra });
  }

  function runSmoke() {
    boot.smoke.ran = true;

    check("DOM pronto", document.readyState !== "loading", document.readyState);
    check("chat-ui carregado", !!window.iaChat || !!document.getElementById("iaChat"));
    check("SOC collector disponível", !!window.__socCollectorState || true);
    check("boot.dump existe", typeof boot.dump === "function");

    boot.smoke.ok = boot.smoke.checks.every(c => c.ok);
    record("boot:smoke", { ok: boot.smoke.ok });
  }

  // ==============================================================
  // 🚀 INIT
  // ==============================================================
  function init() {
    record("boot:init", { debug: DEBUG });

    if (DEBUG) {
      runSmoke();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
// ======================================================================
// Fim do boot-init.js
// ======================================================================   