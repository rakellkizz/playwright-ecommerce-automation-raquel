// ======================================================================
// hud-soc.js — HUD Inteligente estilo SOC para o timerHud
// ----------------------------------------------------------------------
// O QUE ESTE MÓDULO FAZ:
//   • Usa o #timerHud como “painel de monitoramento”.
//   • Mostra o nível de risco atual vindo da IA (IAMonitor).
//   • Mostra percentual aproximado de falhas.
//   • Desenha um mini "heatmap" visual simples (blocos de severidade).
//
// DE ONDE VEM OS DADOS?
//   • Evento global: "ia-monitor:resultado" (disparado em ia-monitor.js)
//   • Estrutura esperada:
//        resultado = {
//          logsEnriquecidos: [...],
//          tendencia: {
//             nivelRisco: "Baixo|Médio|Alto|Crítico",
//             variacaoIncidentes: Number,
//             janelaAnterior: { incidentes, severidade },
//             janelaRecente:  { incidentes, severidade }
//          }
//        }
//
// IMPORTANTE:
//   • Não interfere no funcionamento do temporizador.
//   • Não altera o drag do HUD (usa só conteúdo interno).
//   • Se não houver dados ainda, mostra estado “Aguardando IA...”.
// ======================================================================

window.addEventListener("DOMContentLoaded", () => {
  const hud = document.getElementById("timerHud");
  if (!hud) {
    console.warn("HUD SOC: #timerHud não encontrado. Módulo ignorado.");
    return;
  }

  // ------------------------------------------------------------------
  // 1) Cria a área SOC dentro do timerHud
  // ------------------------------------------------------------------
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

      <div class="hud-soc__heatmap" id="hudSocHeatmap" aria-label="Mapa de severidade dos últimos eventos">
        <!-- Blocos do heatmap serão atualizados via JS -->
        <div class="hud-soc__heat-block" data-level="0"></div>
        <div class="hud-soc__heat-block" data-level="0"></div>
        <div class="hud-soc__heat-block" data-level="0"></div>
        <div class="hud-soc__heat-block" data-level="0"></div>
        <div class="hud-soc__heat-block" data-level="0"></div>
      </div>
    </div>
  `
  );

  // Referências dos elementos que vamos atualizar
  const riskBadgeEl = document.getElementById("hudSocRisk");
  const incidentsEl = document.getElementById("hudSocIncidentes");
  const falhasEl = document.getElementById("hudSocFalhas");
  const tendenciaEl = document.getElementById("hudSocTendencia");
  const heatmapEl = document.getElementById("hudSocHeatmap");
  const heatBlocks = heatmapEl ? Array.from(heatmapEl.querySelectorAll(".hud-soc__heat-block")) : [];

  if (!riskBadgeEl || !incidentsEl || !falhasEl || !tendenciaEl || !heatmapEl) {
    console.warn("HUD SOC: elementos internos não encontrados, abortando.");
    return;
  }

  // ------------------------------------------------------------------
  // 2) Funções auxiliares para atualizar o HUD
  // ------------------------------------------------------------------

  function atualizarRisco(nivelRisco) {
    // remove classes anteriores
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

  function atualizarTendencia(variacaoIncidentes) {
    if (variacaoIncidentes === null || variacaoIncidentes === undefined) {
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

  function atualizarPercentualFalhas(resultado) {
    const logs = Array.isArray(resultado.logsEnriquecidos)
      ? resultado.logsEnriquecidos
      : [];

    if (!logs.length) {
      falhasEl.textContent = "–";
      return;
    }

    const total = logs.length;
    const incidentes = logs.filter((l) => l.iaTipo === "incidente").length;

    const perc = Math.round((incidentes / total) * 100);
    falhasEl.textContent = `${perc}%`;
  }

  function atualizarIncidentesRecentes(tendencia) {
    const recentes = tendencia?.janelaRecente?.incidentes ?? null;
    incidentsEl.textContent = recentes !== null ? String(recentes) : "–";
  }

  function atualizarHeatmap(tendencia) {
    if (!heatBlocks.length || !tendencia || !tendencia.janelaRecente) return;

    const sev = tendencia.janelaRecente.severidade || {
      Crítico: 0,
      Alto: 0,
      Médio: 0,
      Baixo: 0,
    };

    const total =
      sev.Crítico + sev.Alto + sev.Médio + sev.Baixo || 1;

    // Calcula “peso” de severidade (0–4)
    const pesoCritico = sev.Crítico / total;
    const pesoAlto = sev.Alto / total;
    const pesoMedio = sev.Médio / total;

    // Score simples: 0 a 4
    const score = Math.min(
      4,
      Math.round(pesoCritico * 4 + pesoAlto * 3 + pesoMedio * 2)
    );

    heatBlocks.forEach((block, idx) => {
      const level = idx < score ? score : 0;
      block.setAttribute("data-level", String(level));
    });
  }

  // ------------------------------------------------------------------
  // 3) OUVE OS RESULTADOS DO IA MONITOR
  // ------------------------------------------------------------------
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
