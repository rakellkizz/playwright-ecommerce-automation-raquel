// ======================================================================
// analyzer-global.js — Núcleo de análise (versão SEM módulos)
// ----------------------------------------------------------------------
// Exponibiliza: window.analisarEventos(eventos)
// Para uso em Pages sem "type=module"
// ======================================================================

(function () {
  // 🔒 Guard
  if (window.__ANALYZER_GLOBAL__) return;
  window.__ANALYZER_GLOBAL__ = true;

  const RECORRENCIA_THRESHOLD = 3;
  const TIME_WINDOW = 5 * 60 * 1000;

  function criarResultadoVazio() {
    return {
      timestamp: Date.now(),
      totalEventos: 0,
      categorias: {},
      severidadeGeral: "normal",
    };
  }

  function agruparPorTipo(eventos) {
    return eventos.reduce((acc, evento) => {
      const tipo = evento.tipo || "desconhecido";
      (acc[tipo] ||= []).push(evento);
      return acc;
    }, {});
  }

  function classificarImpacto(tipo, quantidade) {
    if (quantidade >= 5) return "alto";
    if (quantidade >= 3) return "medio";
    return "baixo";
  }

  function avaliarRecorrencia(eventosPorTipo) {
    const resultado = {};
    for (const tipo in eventosPorTipo) {
      const quantidade = eventosPorTipo[tipo].length;
      resultado[tipo] = {
        quantidade,
        recorrente: quantidade >= RECORRENCIA_THRESHOLD,
        impacto: classificarImpacto(tipo, quantidade),
      };
    }
    return resultado;
  }

  function calcularSeveridadeGeral(categorias) {
    if (!categorias) return "desconhecida";
    let severidade = "normal";
    for (const tipo in categorias) {
      if (categorias[tipo].impacto === "alto") return "critica";
      if (categorias[tipo].impacto === "medio") severidade = "atencao";
    }
    return severidade;
  }

  window.analisarEventos = function analisarEventos(eventos = []) {
    if (!Array.isArray(eventos) || eventos.length === 0) return criarResultadoVazio();

    const agora = Date.now();
    const eventosRecentes = eventos.filter((e) => agora - (e.timestamp || 0) <= TIME_WINDOW);

    const agrupados = agruparPorTipo(eventosRecentes);
    const analise = avaliarRecorrencia(agrupados);

    return {
      timestamp: agora,
      totalEventos: eventosRecentes.length,
      categorias: analise,
      severidadeGeral: calcularSeveridadeGeral(analise),
    };
  };

  console.info("🧠 Analyzer global carregado (sem módulos).");
})();
