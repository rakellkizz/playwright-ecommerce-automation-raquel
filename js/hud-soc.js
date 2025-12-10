// ======================================================================
// 1. HUD SOC — Sobre o módulo
// ----------------------------------------------------------------------
// Este HUD usa o próprio #timerHud como painel.
// Ele mostra:
//   • Nível de risco (IAMonitor)
//   • % de falhas
//   • Incidentes recentes
//   • Tendência da IA
//   • Mini heatmap de severidade
//
// Ele depende APENAS do evento:
//   -> ia-monitor:resultado
// vindo do ia-monitor.js
//
// NÃO altera DOM principal, NÃO mexe no timer, NÃO interfere no arraste.
// ======================================================================


window.addEventListener("DOMContentLoaded", () => {

  // ====================================================================
  // 2. Seleção do HUD base (#timerHud)
  // ====================================================================
  const hud = document.getElementById("timerHud");
  if (!hud) {
    console.warn("HUD SOC: #timerHud não encontrado. Módulo ignorado.");
    return;
  }



  // ====================================================================
  // 3. Inserção da estrutura SOC dentro do timerHud
  // --------------------------------------------------------------------
  // Aqui adicionamos SOMENTE elementos internos.
  // Nada troca posição do HUD principal.
  // ====================================================================
  hud.insertAdjacentHTML(
    "beforeend",
    `
    <div class="hud-soc">

      <div class="hud-soc__header">
        <span class="hud-soc__title">IA · Monitoramento</span>
        <span class="hud-soc__risk-badge hud-soc__risk--desconhecido" id="hudSocRisk">
          Aguardando IA...
        </span>
      </div>

      <div class="hud-soc__body">

        <div class="hud-soc__metric">
          <span class="hud-soc__metric-label">Incidentes recentes</span>
          <span class="hud-soc__metric-value" id="hudSocIncidentes">–</span>
        </div>

        <div class="hud-soc__metric">
          <span class="hud-soc__metric-label">% de falhas</span>
          <span class="hud-soc__metric-value" id="hudSocFalhas">–</span>
        </div>

        <div class="hud-soc__metric hud-soc__metric--small">
          <span class="hud-soc__metric-label">Tendência</span>
          <span class="hud-soc__metric-chip" id="hudSocTendencia">Sem dados</span>
        </div>

      </div>

      <div class="hud-soc__heatmap" id="hudSocHeatmap">
        <div class="hud-soc__heat-block" data-level="0"></div>
        <div class="hud-soc__heat-block" data-level="0"></div>
        <div class="hud-soc__heat-block" data-level="0"></div>
        <div class="hud-soc__heat-block" data-level="0"></div>
        <div class="hud-soc__heat-block" data-level="0"></div>
      </div>

    </div>
  `
  );



  // ====================================================================
  // 4. Referências internas do SOC HUD
  // ====================================================================
  const riskBadgeEl = document.getElementById("hudSocRisk");
  const incidentsEl = document.getElementById("hudSocIncidentes");
  const falhasEl = document.getElementById("hudSocFalhas");
  const tendenciaEl = document.getElementById("hudSocTendencia");
  const heatmapEl = document.getElementById("hudSocHeatmap");
  const heatBlocks = heatmapEl
    ? Array.from(heatmapEl.querySelectorAll(".hud-soc__heat-block"))
    : [];

  if (!riskBadgeEl || !incidentsEl || !falhasEl || !tendenciaEl || !heatmapEl) {
    console.warn("HUD SOC: elementos internos não encontrados, abortando.");
    return;
  }



  // ====================================================================
  // 5. Funções auxiliares para atualizar o painel SOC
  // ====================================================================

  // 5.1 Atualiza o badge de risco
  function atualizarRisco(nivelRisco) {
    riskBadgeEl.classList.remove(
      "hud-soc__risk--baixo",
      "hud-soc__risk--medio",
      "hud-soc__risk--alto",
      "hud-soc__risk--critico",
      "hud-soc__risk--desconhecido"
    );

    switch (nivelRisco) {
      case "Baixo":
        riskBadgeEl.textContent = "Risco baixo";
        riskBadgeEl.classList.add("hud-soc__risk--baixo");
        break;

      case "Médio":
        riskBadgeEl.textContent = "Risco médio";
        riskBadgeEl.classList.add("hud-soc__risk--medio");
        break;

      case "Alto":
        riskBadgeEl.textContent = "Risco alto";
        riskBadgeEl.classList.add("hud-soc__risk--alto");
        break;

      case "Crítico":
        riskBadgeEl.textContent = "Risco crítico";
        riskBadgeEl.classList.add("hud-soc__risk--critico");
        break;

      default:
        riskBadgeEl.textContent = "Aguardando IA...";
        riskBadgeEl.classList.add("hud-soc__risk--desconhecido");
        break;
    }
  }



  // 5.2 Atualiza tendência (variação dos incidentes)
  function atualizarTendencia(variacaoIncidentes) {
    if (variacaoIncidentes == null) {
      tendenciaEl.textContent = "Sem dados";
      tendenciaEl.classList.remove(
        "hud-soc__chip--up",
        "hud-soc__chip--down",
        "hud-soc__chip--stable"
      );
      return;
    }

    const v = Math.round(variacaoIncidentes);

    tendenciaEl.classList.remove(
      "hud-soc__chip--up",
      "hud-soc__chip--down",
      "hud-soc__chip--stable"
    );

    if (v > 10) {
      tendenciaEl.textContent = `Subindo (${v}% ↑)`;
      tendenciaEl.classList.add("hud-soc__chip--up");
    } else if (v < -10) {
      tendenciaEl.textContent = `Caindo (${Math.abs(v)}% ↓)`;
      tendenciaEl.classList.add("hud-soc__chip--down");
    } else {
      tendenciaEl.textContent = "Estável";
      tendenciaEl.classList.add("hud-soc__chip--stable");
    }
  }



  // 5.3 Atualiza % de falhas
  function atualizarPercentualFalhas(resultado) {
    const logs = Array.isArray(resultado.logsEnriquecidos)
      ? resultado.logsEnriquecidos
      : [];

    if (!logs.length) {
      falhasEl.textContent = "–";
      return;
    }

    const total = logs.length;
    const incidentes = logs.filter(l => l.iaTipo === "incidente").length;

    falhasEl.textContent = `${Math.round((incidentes / total) * 100)}%`;
  }



  // 5.4 Atualiza contador de incidentes recentes
  function atualizarIncidentesRecentes(tendencia) {
    const recentes = tendencia?.janelaRecente?.incidentes ?? null;
    incidentsEl.textContent = recentes !== null ? String(recentes) : "–";
  }



  // 5.5 Atualiza heatmap visual
  function atualizarHeatmap(tendencia) {
    if (!heatBlocks.length || !tendencia || !tendencia.janelaRecente) return;

    const sev = tendencia.janelaRecente.severidade || {
      Crítico: 0,
      Alto: 0,
      Médio: 0,
      Baixo: 0,
    };

    const total = sev.Crítico + sev.Alto + sev.Médio + sev.Baixo || 1;

    const pesoCritico = sev.Crítico / total;
    const pesoAlto = sev.Alto / total;
    const pesoMedio = sev.Médio / total;

    const score = Math.min(
      4,
      Math.round(pesoCritico * 4 + pesoAlto * 3 + pesoMedio * 2)
    );

    heatBlocks.forEach((block, idx) => {
      const level = idx < score ? score : 0;
      block.setAttribute("data-level", String(level));
    });
  }



  // ====================================================================
  // 6. EVENTO PRINCIPAL — recebe os dados do IA Monitor
  // --------------------------------------------------------------------
  // Quando ia-monitor.js chamar:
  //   dispatchEvent("ia-monitor:resultado", { detail: resultado })
  //
  // Este HUD atualiza tudo automaticamente.
  // ====================================================================
  window.addEventListener("ia-monitor:resultado", (event) => {
    const resultado = event.detail;
    if (!resultado || !resultado.tendencia) return;

    const tendencia = resultado.tendencia;

    atualizarRisco(tendencia.nivelRisco);
    atualizarTendencia(tendencia.variacaoIncidentes);
    atualizarPercentualFalhas(resultado);
    atualizarIncidentesRecentes(tendencia);
    atualizarHeatmap(tendencia);
  });

});
