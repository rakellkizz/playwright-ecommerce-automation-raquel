// ======================================================================
// 🤖 ia-monitor.js — Inteligência Artificial para Monitoramento E2E
// ----------------------------------------------------------------------
// VERSÃO: C1 + C2 PRONTOS · C3 PREPARADO · ALERTAS AUTOMÁTICOS ATIVOS
//
// OBJETIVO:
//   • Analisar cada log → C1
//   • Detectar tendências → C2
//   • Oferecer estrutura para relatórios inteligentes → C3
//   • Emitir eventos globais e alertas automáticos (módulo C-alerts)
//
// ESTE ARQUIVO NÃO:
//   ✘ Modifica DOM
//   ✘ Controla chat
//   ✘ Desenha HUD
//
// ELE SÓ ENTREGA:
//   ✔ Análise bruta
//   ✔ Insights de tendência
//   ✔ Severidade inteligente
//   ✔ Eventos para outros módulos reagirem (chat, HUD, IA avançada)
//
// QUALQUER TÉCNICO PODE PLUGAR OUTROS SISTEMAS AQUI.
// ======================================================================

(() => {
  // Mantém qualquer versão existente (segurança)
  const nsExistente = window.IAMonitor || {};

  // ====================================================================
  // 🧪 UTILITÁRIO: Normalizar datas
  // Aceita Date, string ISO, string BR e tenta parsear
  // ====================================================================
  function normalizarData(valor) {
    if (!valor) return null;

    if (valor instanceof Date) return valor;

    if (typeof valor === "string") {
      const iso = new Date(valor);
      if (!isNaN(iso.getTime())) return iso;

      // Formato BR: 05/12/2025 14:20:00
      const match = valor.match(
        /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/
      );
      if (match) {
        const [, dd, mm, yyyy, hh, min, ss] = match;
        return new Date(
          Number(yyyy),
          Number(mm) - 1,
          Number(dd),
          Number(hh || 0),
          Number(min || 0),
          Number(ss || 0)
        );
      }
    }

    return null;
  }

  // ====================================================================
  // 🧠 C1 — CLASSIFICAÇÃO INTELIGENTE DOS LOGS
  // ====================================================================

  // ----------------------- Inferir tipo de evento ----------------------
  function inferirTipo(log) {
    const txt = (
      log.mensagem ||
      log.descricao ||
      log.status ||
      ""
    ).toLowerCase();

    const tipoOriginal = (log.tipo || "").toLowerCase();

    if (tipoOriginal.includes("falso") || txt.includes("falso positivo"))
      return "falso-positivo";

    if (tipoOriginal.includes("incidente")) return "incidente";

    if (
      txt.includes("instab") ||
      txt.includes("oscil") ||
      txt.includes("latência") ||
      txt.includes("lento")
    )
      return "instabilidade";

    if (txt.includes("fail") || txt.includes("erro")) return "incidente";

    return "acao-tecnica";
  }

  // ----------------------- Tags automáticas ----------------------------
  function extrairTags(log) {
    const texto =
      `${log.mensagem} ${log.descricao} ${log.cenario} ${log.endpoint}`.toLowerCase();

    const tags = [];

    if (texto.includes("login") || texto.includes("auth")) tags.push("auth");
    if (texto.includes("timeout")) tags.push("timeout");
    if (texto.includes("500") || texto.includes("exception"))
      tags.push("erro-servidor");
    if (texto.includes("latência") || texto.includes("lento"))
      tags.push("performance");
    if (texto.includes("dns") || texto.includes("socket"))
      tags.push("rede");
    if (texto.includes("db") || texto.includes("sql"))
      tags.push("banco-de-dados");

    return tags;
  }

  // ----------------------- Severidade inteligente -----------------------
  function inferirSeveridade(log, tipo, tags) {
    const txt = (
      log.mensagem ||
      log.descricao ||
      ""
    ).toLowerCase();

    if (txt.includes("500") || txt.includes("falha geral") || tags.includes("erro-servidor"))
      return "Crítico";

    if (tags.includes("auth") || tags.includes("timeout") || tipo === "incidente")
      return "Alto";

    if (tipo === "instabilidade" || tags.includes("performance"))
      return "Médio";

    return "Baixo";
  }

  // ----------------------- Enriquecer objeto log -----------------------
  function enriquecerLog(log) {
    const data = normalizarData(log.dataHora || log.data || log.timestamp);
    const tipo = inferirTipo(log);
    const tags = extrairTags(log);
    const severidade = inferirSeveridade(log, tipo, tags);

    return {
      ...log,
      iaData: data,
      iaTipo: tipo,
      iaTags: tags,
      iaSeveridade: severidade,
    };
  }

  // ====================================================================
  // 📈 C2 — DETECÇÃO DE TENDÊNCIA
  // ====================================================================

  function dividirJanelas(logs) {
    if (!logs.length) return { anterior: [], recente: [] };

    const ordenados = [...logs].sort((a, b) => {
      if (a.iaData && b.iaData) return a.iaData - b.iaData;
      return 0;
    });

    const meio = Math.floor(ordenados.length / 2) || 1;

    return {
      anterior: ordenados.slice(0, meio),
      recente: ordenados.slice(meio),
    };
  }

  function contar(lista) {
    const severidade = { Crítico: 0, Alto: 0, Médio: 0, Baixo: 0 };

    let incidentes = 0;

    for (const log of lista) {
      if (log.iaTipo === "incidente") incidentes++;
      severidade[log.iaSeveridade]++;
    }

    return { incidentes, severidade };
  }

  function variacao(a, b) {
    if (a === 0 && b > 0) return 100;
    if (a === 0 && b === 0) return 0;
    return ((b - a) / a) * 100;
  }

  function determinarRisco(cont, varInc) {
    if (cont.severidade.Crítico >= 2) return "Crítico";
    if (cont.severidade.Alto >= 3 || varInc > 50) return "Alto";
    if (cont.incidentes >= 1 || cont.severidade.Médio >= 1) return "Médio";
    return "Baixo";
  }

  function analisarLote(logsBrutos = []) {
    const logs = logsBrutos.map(enriquecerLog);

    const { anterior, recente } = dividirJanelas(logs);

    const contA = contar(anterior);
    const contR = contar(recente);

    const varInc = variacao(contA.incidentes, contR.incidentes);
    const risco = determinarRisco(contR, varInc);

    const resultado = {
      logsEnriquecidos: logs,
      tendencia: {
        variacaoIncidentes: varInc,
        nivelRisco: risco,
        janelaAnterior: contA,
        janelaRecente: contR,
      },
    };

    // ----------------------------------------------------------------
    // 🔮 EVENTO GLOBAL PARA CHAT / HUD (IA Monitor Live)
    // ----------------------------------------------------------------
    try {
      window.dispatchEvent(
        new CustomEvent("ia-monitor:resultado", { detail: resultado })
      );
    } catch (e) {}

    // ----------------------------------------------------------------
    // 🔥 ALERTAS AUTOMÁTICOS DO MÓDULO C (se existir)
    // ----------------------------------------------------------------
    if (window.IAAlerts && typeof window.IAAlerts.analisar === "function") {
      try {
        window.IAAlerts.analisar(resultado);
      } catch (e) {
        console.warn("IAAlerts falhou:", e);
      }
    }

    return resultado;
  }

  // ====================================================================
  // 🔜 C3 — RELATÓRIO INTELIGENTE (RASCUNHO)
  // ====================================================================
  function gerarRelatorioInteligente(resultado) {
    if (!resultado || !resultado.tendencia)
      return "IA: Sem dados suficientes para gerar relatório inteligente.";

    const t = resultado.tendencia;

    return [
      "Relatório Inteligente (IA) — Rascunho",
      "--------------------------------------",
      `Risco atual: ${t.nivelRisco}`,
      `Variação de incidentes: ${Math.round(t.variacaoIncidentes)}%`,
      "",
      "Insights:",
      `• Incidentes anteriores: ${t.janelaAnterior.incidentes}`,
      `• Incidentes recentes: ${t.janelaRecente.incidentes}`,
    ].join("\n");
  }

  // ====================================================================
  // 🌎 Expōr API pública
  // ====================================================================
  window.IAMonitor = {
    ...nsExistente,
    analisarLote,
    gerarRelatorioInteligente,
  };

  console.log("✅ IA Monitor carregado com C1 + C2 + gatilhos automáticos.");
})();
