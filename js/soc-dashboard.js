// ====================================================================
// 🔘 ACTIONS — Botões do painel (bind 1x, estado sempre atualizado)
// --------------------------------------------------------------------
// ✅ Não duplica handler a cada atualizar()
// ✅ No clique, lê state "fresco" do socCollector
// ✅ Mantém stopPropagation para não interferir no drag do chat
// ✅ Mantém logs técnicos (socLog) + aviso no chat
// ====================================================================
try {
  const btnCopy = painel.querySelector("[data-soc-copy]");
  const btnWhats = painel.querySelector("[data-soc-whats]");
  const btnEmail = painel.querySelector("[data-soc-email]");

  // ---------------------------------------------------------------
  // Helper: pega estado SOC SEMPRE atualizado (no momento do clique)
  // ---------------------------------------------------------------
  function lerSocStateSeguro() {
    const st = window.socCollector?.getState?.();
    if (!st || typeof st !== "object") return null;

    return {
      sala: st.sala || null,
      salaLink: st.salaLink || null,
      severidade: st.severidade || "Indefinida",
      eventos: Array.isArray(st.eventos) ? st.eventos : [],
    };
  }

  // ---------------------------------------------------------------
  // Helper: trava evento (não “vaza” clique para trás)
  // ---------------------------------------------------------------
  function travarClique(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
  }

  // ===============================================================
  // 📋 COPIAR LINK
  // ===============================================================
  if (btnCopy && !btnCopy.dataset.bound) {
    btnCopy.dataset.bound = "1";

    btnCopy.addEventListener("click", async (e) => {
      travarClique(e);

      const st = lerSocStateSeguro();
      const link = st?.salaLink;
      if (!link) return;

      try {
        await navigator.clipboard.writeText(link);
        window.socLog?.({
          type: "soc_copy_link",
          url: link,
          origem: "soc-dashboard",
        });
      } catch (_) {
        // fallback (caso clipboard falhe)
        const ta = document.createElement("textarea");
        ta.value = link;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();

        window.socLog?.({
          type: "soc_copy_link_fallback",
          url: link,
          origem: "soc-dashboard",
        });
      }

      window.chatAviso?.("📋 Link da sala copiado.");
    });
  }

  // ===============================================================
  // 📤 WHATS
  // ===============================================================
  if (btnWhats && !btnWhats.dataset.bound) {
    btnWhats.dataset.bound = "1";

    btnWhats.addEventListener("click", (e) => {
      travarClique(e);

      const st = lerSocStateSeguro();
      const link = st?.salaLink;
      if (!link) return;

      const totalEventos = st.eventos.length;

      // (opcional) stakeholders no clique (sempre atual)
      const times =
        window.socCollector?.sugerirStakeholders?.() || [];

      const texto =
        `🆘 Sala de Crise: ${st.sala || "Não formalizada"}\n` +
        `Severidade: ${st.severidade || "Indefinida"}\n` +
        `Eventos: ${totalEventos}\n` +
        `Times: ${times.length ? times.join(", ") : "—"}\n` +
        `Link: ${link}`;

      window.socLog?.({
        type: "soc_share_whats",
        url: link,
        origem: "soc-dashboard",
      });

      window.open(
        `https://wa.me/?text=${encodeURIComponent(texto)}`,
        "_blank",
        "noopener"
      );
    });
  }

  // ===============================================================
  // ✉️ EMAIL (mailto)
  // ===============================================================
  if (btnEmail && !btnEmail.dataset.bound) {
    btnEmail.dataset.bound = "1";

    btnEmail.addEventListener("click", (e) => {
      travarClique(e);

      const st = lerSocStateSeguro();
      const link = st?.salaLink;
      if (!link) return;

      const totalEventos = st.eventos.length;
      const times =
        window.socCollector?.sugerirStakeholders?.() || [];

      const subject = `🆘 Sala de Crise — ${st.sala || "SOC"}`;

      const body =
        `Sala: ${st.sala || "Não formalizada"}\n` +
        `Severidade: ${st.severidade || "Indefinida"}\n` +
        `Eventos: ${totalEventos}\n` +
        `Times: ${times.length ? times.join(", ") : "—"}\n\n` +
        `Link da sala:\n${link}\n`;

      window.socLog?.({
        type: "soc_share_email",
        url: link,
        origem: "soc-dashboard",
      });

      window.location.href =
        `mailto:?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`;
    });
  }
} catch (_) {
  // silencioso: painel nunca pode quebrar o app
}
// ====================================================================
// 👁️ VISIBILIDADE DO HOLOGRAMA — gatilho automático por estado SOC
// --------------------------------------------------------------------
// Objetivo:
// • Abrir o painel automaticamente quando uma sala de crise existir
// • Sincronizar Chat / SOC Ops / Dashboard
// • NÃO depender de clique manual
// ====================================================================
(function bindHologramaAutoOpen() {
  if (window.__socDashboardAutoOpenBound) return;
  window.__socDashboardAutoOpenBound = true;

  // Helper: abre o painel (respeita implementação atual)
  function abrirPainelSeNecessario() {
    try {
      const st = window.socCollector?.getState?.();
      if (!st || !st.salaLink) return;

      // Se existir uma função oficial de abrir, use
      if (typeof window.socDashboardOpen === "function") {
        window.socDashboardOpen();
        return;
      }

      // Fallback: remover hidden / aria-hidden
      const painel = document.querySelector("[data-soc-dashboard]");
      if (!painel) return;

      painel.hidden = false;
      painel.setAttribute("aria-hidden", "false");
    } catch (_) {}
  }

  // ---------------------------------------------------------------
  // Gatilhos que indicam “crise ativa”
  // ---------------------------------------------------------------

  // 1) Quando o link da sala é definido
  window.addEventListener("crise:link", () => {
    abrirPainelSeNecessario();
  });

  // 2) Quando o estado SOC é atualizado
  window.addEventListener("soc:state_updated", () => {
    abrirPainelSeNecessario();
  });

  // 3) Caso a página carregue com crise já ativa (reload)
  document.addEventListener("DOMContentLoaded", () => {
    abrirPainelSeNecessario();
  });
})();
// ======================================================================
// Fim do soc-dashboard.js
// ====================================================================== 