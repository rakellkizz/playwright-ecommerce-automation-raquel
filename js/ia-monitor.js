// ======================================================================
// 1. IA MONITOR — Núcleo de Inteligência do Sistema
// ----------------------------------------------------------------------
// Responsável por:
//   • C1 → Classificar logs individualmente (tipo, severidade, tags)
//   • C2 → Detectar tendência e calcular risco
//   • C3 → Gerar relatório inteligente (usado pelo HUD, Chat e Relatórios)
//   • Disparar o evento global "ia-monitor:resultado"
//   • Integrar com IAAlerts (módulo C-alerts)
// 
// NÃO ALTERA DOM
// NÃO TOCA EM CHAT
// NÃO ALTERA TIMER
//
// Apenas ANALISA e ENTREGA dados para quem quiser consumir.
// ======================================================================

(() => {

  // ======================================================================
  // 2. PRESERVAÇÃO DE QUALQUER VERSÃO EXISTENTE
  // ----------------------------------------------------------------------
  // Caso o usuário já tenha IAMonitor carregado, não perde funções antigas.
  // ======================================================================
  const nsExistente = window.IAMonitor || {};

  // ======================================================================
  // 3. UTILITÁRIO — Normalizar datas (aceita vários formatos)
  // ======================================================================
  function normalizarData(valor) {
    if (!valor) return null;

    if (valor instanceof Date) return valor;

    if (typeof valor === "string") {
      const iso = new Date(valor);
      if (!isNaN(iso.getTime())) return iso;

      // Formato BR: DD/MM/YYYY HH:MM:SS
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

  // ======================================================================
  // 4. C1 — CLASSIFICAÇÃO INDIVIDUAL DO LOG
  // ======================================================================

  // ---------------------------------------------------------------
  // 4.1 Inferir tipo do evento (incidente, instabilidade, técnico…)
  // ---------------------------------------------------------------
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

  // ---------------------------------------------------------------
  // 4.2 Extrair TAGs automáticas (auth, timeout, rede, DB…)
  // ---------------------------------------------------------------
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

  // ---------------------------------------------------------------
  // 4.3 Determinar severidade inteligente
  // ---------------------------------------------------------------
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

  // ---------------------------------------------------------------
  // 4.4 Enriquecer log com IA
  // ---------------------------------------------------------------
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

  // ======================================================================
  // 5. C2 — Análise de tendência e risco
  // ======================================================================

  // ---------------------------------------------------------------
  // 5.1 Separar logs na "janela anterior" e "janela recente"
  // ---------------------------------------------------------------
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

  // ---------------------------------------------------------------
  // 5.2 Contagem de severidade / incidentes
  // ---------------------------------------------------------------
  function contar(lista) {
    const severidade = { Crítico: 0, Alto: 0, Médio: 0, Baixo: 0 };
    let incidentes = 0;

    for (const log of lista) {
      if (log.iaTipo === "incidente") incidentes++;
      severidade[log.iaSeveridade]++;
    }

    return { incidentes, severidade };
  }

  // ---------------------------------------------------------------
  // 5.3 Cálculo de variação percentual entre janelas
  // ---------------------------------------------------------------
  function variacao(a, b) {
    if (a === 0 && b > 0) return 100;
    if (a === 0 && b === 0) return 0;
    return ((b - a) / a) * 100;
  }

  // ---------------------------------------------------------------
  // 5.4 Determinar risco global
  // ---------------------------------------------------------------
  function determinarRisco(cont, varInc) {
    if (cont.severidade.Crítico >= 2) return "Crítico";
    if (cont.severidade.Alto >= 3 || varInc > 50) return "Alto";
    if (cont.incidentes >= 1 || cont.severidade.Médio >= 1) return "Médio";
    return "Baixo";
  }

  // ---------------------------------------------------------------
  // 5.5 Função principal da análise de lote
  // ---------------------------------------------------------------
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

    // -------------------------------------------------------------
    // 5.6 Evento global → usado por:
    //     - hud-soc.js
    //     - chat-ui.js
    //     - cards-status.js
    // -------------------------------------------------------------
    try {
      window.dispatchEvent(
        new CustomEvent("ia-monitor:resultado", { detail: resultado })
      );
    } catch (e) {}

    // -------------------------------------------------------------
    // 5.7 Integração com Alertas Inteligentes (C-alerts.js)
    // -------------------------------------------------------------
    if (window.IAAlerts && typeof window.IAAlerts.analisar === "function") {
      try {
        window.IAAlerts.analisar(resultado);
      } catch (e) {
        console.warn("IAAlerts falhou:", e);
      }
    }

    return resultado;
  }

  // ======================================================================
  // 6. C3 — GERAR RELATÓRIO INTELIGENTE (rascunho)
  // ======================================================================
  function gerarRelatorioInteligente(resultado) {
    if (!resultado || !resultado.tendencia)
      return "IA: Sem dados suficientes para gerar relatório inteligente.";

    const t = resultado.tendencia;

    return [
      "📘 RELATÓRIO INTELIGENTE (IA) — Rascunho",
      "--------------------------------------",
      `• Risco atual: ${t.nivelRisco}`,
      `• Variação de incidentes: ${Math.round(t.variacaoIncidentes)}%`,
      "",
      "Histórico:",
      `• Incidentes anteriores: ${t.janelaAnterior.incidentes}`,
      `• Incidentes recentes: ${t.janelaRecente.incidentes}`,
    ].join("\n");
  }

  // ======================================================================
  // 7. EXPŌR API PÚBLICA
  // ======================================================================
  window.IAMonitor = {
    ...nsExistente,
    analisarLote,
    gerarRelatorioInteligente,
  };

  console.log("✅ IA Monitor carregado (C1 + C2 + C3 preparados).");

})();
