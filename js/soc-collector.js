// ======================================================================
// soc-collector.js — Coletor e correlacionador de eventos SOC
// ----------------------------------------------------------------------
// ✔ Junta logs técnicos, humanos e decisões
// ✔ Mantém timeline única
// ✔ Base para relatório / PDF / dashboard
// ✔ Persiste em localStorage (salva + recarrega)
// ✔ Severidade automática (Indefinida → P3 → P2 → P1) sem “rebaixar” sozinha
//
// 🔒 ANTI-DUPLICAÇÃO (import/load múltiplo):
// - Se o arquivo for carregado 2x por engano, ele NÃO registra listeners de novo.
// ======================================================================

(function socCollectorModule() {
  // ====================================================================
  // 0) GUARD GLOBAL — impede duplicar listeners se o script carregar 2x
  // ====================================================================
  if (window.__socCollectorLoaded) return;
  window.__socCollectorLoaded = true;

  // ====================================================================
  // ✅ PATCH PASSO A — Exposição estável para Playwright/Allure (sem F12)
  // --------------------------------------------------------------------
  // - Não muda seu state
  // - Apenas expõe ponteiros para testes coletarem snapshots
  // ====================================================================
  // OBS: Mantemos "ponteiros" estáveis:
  //   __socCollectorState -> fonte da verdade
  //   __socEvents         -> timeline (array)
  // Atualizamos sempre que salvar/registrar
  // ====================================================================

  // ====================================================================
  // 1) CONSTS + STATE (fonte da verdade)
  // ====================================================================
  const SOC_COLLECTOR_KEY = "soc_collector_state_v1";

  const socCollectorState = {
    sala: null,
    salaLink: null,
    severidade: "Indefinida",
    eventos: [],
  };

  // Expor imediatamente (mesmo antes de carregar do storage)
  window.__socCollectorState = socCollectorState;
  window.__socEvents = socCollectorState.eventos;

  // ====================================================================
  // 2) LOAD + SAVE — persistência segura
  // ====================================================================
  (function carregarSocCollector() {
    try {
      const raw = localStorage.getItem(SOC_COLLECTOR_KEY);
      if (!raw) return;

      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== "object") return;

      if ("sala" in saved) socCollectorState.sala = saved.sala;
      if ("salaLink" in saved) socCollectorState.salaLink = saved.salaLink;
      if ("severidade" in saved) socCollectorState.severidade = saved.severidade;

      if (Array.isArray(saved.eventos)) socCollectorState.eventos = saved.eventos;

      // ✅ PATCH PASSO A — manter ponteiros atualizados após load
      window.__socCollectorState = socCollectorState;
      window.__socEvents = socCollectorState.eventos;
    } catch (_) {
      // silencioso por segurança
    }
  })();

  function salvarSocCollector() {
    try {
      localStorage.setItem(SOC_COLLECTOR_KEY, JSON.stringify(socCollectorState));
    } catch (_) {}

    // ✅ PATCH PASSO A — sempre manter ponteiros atualizados
    window.__socCollectorState = socCollectorState;
    window.__socEvents = socCollectorState.eventos;
  }

  // ====================================================================
  // 3) HELPERS — normalização e severidade automática (leve e robusta)
  // ====================================================================
  function normalizarTexto(x) {
    try {
      return String(x ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // remove acentos
    } catch {
      return "";
    }
  }

  // ====================================================================
  // ✅ PATCH PASSO A — Identificação de cenário (para sincronizar cards)
  // --------------------------------------------------------------------
  // Tentamos identificar cenário por:
  //   1) campos conhecidos (id/cenario/cenarioId/scenario)
  //   2) texto do evento
  // Se não achar -> não mexe nos cards (evita falso positivo)
  // ====================================================================
  const SOC_CENARIOS = ["login", "carrinho", "checkout", "busca", "smoke", "perfil"];

  function extrairCenarioDoEvento(evento) {
    const e = evento || {};
    const detailId = (e?.id ?? "").toString().toLowerCase(); // em logs:add você usa { id: "soc" } ou cenário
    if (detailId && SOC_CENARIOS.includes(detailId)) return detailId;

    const c1 = (e?.cenario || e?.cenarioId || e?.scenario || "").toString().toLowerCase();
    if (c1 && SOC_CENARIOS.includes(c1)) return c1;

    const texto = normalizarTexto(JSON.stringify(e));
    const achou = SOC_CENARIOS.find((c) => texto.includes(c));
    return achou || null;
  }

  // ====================================================================
  // ✅ PATCH PASSO A — Classificador P1/P2/P3 por evento (sem quebrar nada)
  // --------------------------------------------------------------------
  // Regras:
  //   - P1: crítico (5xx/prod, checkout/pagamento fora do ar, etc.)
  //   - P2: em análise/manutenção/instabilidade sob controle
  //   - P3: anomalia detectada (default)
  //
  // OBS IMPORTANTE:
  //   - Seu sistema já faz "só sobe" (Indefinida→P3→P2→P1).
  //   - Aqui mantemos isso intacto. Nenhum rebaixamento automático.
  // ====================================================================
  function classificarSeveridadePorEvento(evento) {
    const texto = normalizarTexto(JSON.stringify(evento));

    // -----------------------------
    // P1 — Incidente crítico
    // -----------------------------
    const tem5xx =
      texto.includes("erro 500") ||
      texto.includes("status code 500") ||
      /\b5\d\d\b/.test(texto); // pega 500/502/503...

    const temProducao = texto.includes("producao") || texto.includes("produção") || texto.includes("prod");
    const checkoutCritico =
      texto.includes("checkout") && (texto.includes("fora do ar") || texto.includes("indispon") || texto.includes("quebrou") || texto.includes("falha") || texto.includes("erro"));
    const pagamentoCritico =
      texto.includes("pagamento") && (texto.includes("fora do ar") || texto.includes("indispon") || texto.includes("quebrou") || texto.includes("falha") || texto.includes("erro"));

    const isP1 =
      (tem5xx && temProducao) ||
      checkoutCritico ||
      pagamentoCritico ||
      (texto.includes("fora do ar") && (texto.includes("checkout") || texto.includes("login") || texto.includes("pagamento")));

    if (isP1) {
      return { sev: "P1", motivo: "Impacto crítico detectado", evidencia: texto.slice(0, 220) };
    }

    // -----------------------------
    // P2 — Em análise / manutenção / instabilidade sob controle
    // -----------------------------
    const isP2 =
      texto.includes("manutencao") ||
      texto.includes("manutenção") ||
      texto.includes("analise") ||
      texto.includes("análise") ||
      texto.includes("investig") ||
      texto.includes("verificando") ||
      texto.includes("timeout") ||
      texto.includes("lentidao") ||
      texto.includes("lentidão") ||
      texto.includes("instabilidade") ||
      texto.includes("intermitente") ||
      texto.includes("degradacao") ||
      texto.includes("degradação") ||
      texto.includes("regressao") ||
      texto.includes("regressão") ||
      texto.includes("recorrente");

    if (isP2) {
      return { sev: "P2", motivo: "Em análise/manutenção ou instabilidade", evidencia: texto.slice(0, 220) };
    }

    // -----------------------------
    // P3 — Default: anomalia detectada
    // -----------------------------
    return { sev: "P3", motivo: "Anomalia detectada (default)", evidencia: texto.slice(0, 220) };
  }

  // ====================================================================
  // ✅ PATCH PASSO A — Sincronização automática dos cards (sem F12)
  // --------------------------------------------------------------------
  // Mapeamento para cards-status (seu arquivo ajustado no PASSO B):
  //   P3 -> testes:anomalia      (amarelo)
  //   P2 -> testes:manutencao    (amarelo soberano)
  //   P1 -> testes:erro-critico  (vermelho)
  //
  // Anti-loop:
  //   - Evita disparar o mesmo cenário+sev repetidamente em cascata
  // ====================================================================
  function sincronizarCardsPorSeveridade(sev, evento) {
    const cenario = extrairCenarioDoEvento(evento);
    if (!cenario) return; // sem cenário confiável -> não mexe em card

    const key = `__SOC_CARD_SYNC_${cenario}_${sev}__`;
    if (window[key]) return; // já sincronizado nesse ciclo
    window[key] = true;

    try {
      if (sev === "P1") {
        window.dispatchEvent(new CustomEvent("testes:erro-critico", { detail: { cenario } }));
      } else if (sev === "P2") {
        window.dispatchEvent(new CustomEvent("testes:manutencao", { detail: { cenario } }));
      } else {
        window.dispatchEvent(new CustomEvent("testes:anomalia", { detail: { cenario } }));
      }
    } catch (_) {}

    // libera rapidamente (não prende)
    Promise.resolve().then(() => {
      window[key] = false;
    });
  }

  // ====================================================================
  // (mantido) calcularSeveridadePorEvento — agora só chama o classificador
  // ====================================================================
  function calcularSeveridadePorEvento(evento) {
    // ✅ PATCH PASSO A: passa a usar o classificador central
    return classificarSeveridadePorEvento(evento).sev;
  }

  function aplicarSeveridadeSeSubir(nova, motivo, evidencia) {
    const atual = socCollectorState.severidade || "Indefinida";

    // regra: só “sobe”; não rebaixa automaticamente
    const rank = { Indefinida: 0, P3: 1, P2: 2, P1: 3 };
    const a = rank[atual] ?? 0;
    const n = rank[nova] ?? 0;

    if (n <= a) return false;

    socCollectorState.severidade = nova;
    salvarSocCollector();

    // Auditoria técnica (Allure / trilha)
    window.socLog?.({
      type: "soc_severidade_update",
      de: atual,
      para: nova,
      motivo,
      evidencia,
    });

    // Registro narrativo (entra no relatório/PDF via logs:add)
    try {
      window.dispatchEvent(
        new CustomEvent("logs:add", {
          detail: {
            id: "soc",
            log: {
              tipo: "soc_severidade",
              timestamp: Date.now(),
              tecnico: "Sistema · SOC",
              acao: `📌 Severidade alterada: ${atual} → ${nova}`,
              justificativa: evidencia || `Motivo: ${motivo}`,
            },
          },
        })
      );
    } catch (_) {}

    return true;
  }

  function autoAtualizarSeveridade(motivo = "evento", evento = null) {
    // Se não tem evento ainda, não força nada
    if (!evento) return;

    // ✅ PATCH PASSO A: pega também motivo/evidência do classificador
    const cls = classificarSeveridadePorEvento(evento);
    const nova = cls.sev;

    // evidência curta (não pesa) — mantém seu padrão
    const evidencia = normalizarTexto(
      evento?.tipo === "humano"
        ? `humano: ${evento?.texto ?? ""}`
        : evento?.tipo === "log"
        ? `log: ${evento?.log?.tipo ?? ""} ${evento?.log?.acao ?? ""}`
        : JSON.stringify(evento)
    ).slice(0, 240);

    // Severidade sobe (sua regra original)
    const subiu = aplicarSeveridadeSeSubir(nova, cls.motivo || motivo, evidencia);

    // ✅ PATCH PASSO A: sincroniza cards SEM depender de console
    // - Mesmo que a severidade não "suba", o evento ainda pode ser P2/P3 e deve refletir no card do cenário.
    // - Manutenção é soberana (cards-status já protege).
    try {
      sincronizarCardsPorSeveridade(nova, evento);
    } catch (_) {}

    return subiu;
  }

  // ====================================================================
  // 4) registrarEvento() — adiciona na timeline + auto-severidade + salva
  // ====================================================================
  function registrarEvento(evento) {
    socCollectorState.eventos.push(evento);

    // limite de segurança (não “explode” o navegador)
    if (socCollectorState.eventos.length > 500) {
      socCollectorState.eventos.shift();
    }

    // severidade automática (só sobe) + sincroniza cards
    try {
      autoAtualizarSeveridade("evento", evento);
    } catch (_) {}

    salvarSocCollector();
  }

  // ====================================================================
  // 5) SETTERS — forma oficial de gravar no state real
  // ====================================================================
  function setSala(salaId) {
    if (!salaId) return;
    socCollectorState.sala = salaId;
    salvarSocCollector();
  }

  function setSalaLink(url) {
    if (!url) return;
    socCollectorState.salaLink = url;
    salvarSocCollector();
  }

  // ====================================================================
  // 6) LISTENERS — UM POR EVENTO (sem duplicar)
  // ====================================================================

  // 6.1) Logs técnicos / IA (relatório)
  window.addEventListener("logs:add", (ev) => {
    registrarEvento({
      tipo: "log",
      timestamp: Date.now(),
      ...ev.detail,
    });
  });

  // 6.2) Respostas humanas (chat técnico)
  window.addEventListener("ia:resposta_humana", (ev) => {
    registrarEvento({
      tipo: "humano",
      texto: ev?.detail?.texto,
      timestamp: ev?.detail?.timestamp || Date.now(),
    });
  });

  // ✅ PATCH PASSO A — Captura manutenção/erro crítico direto dos cards (opcional e seguro)
  // ------------------------------------------------------------------
  // Isso NÃO muda seu fluxo: apenas registra no SOC quando o UI marcar.
  // Ajuda a manter timeline coerente sem F12.
  // ------------------------------------------------------------------
  window.addEventListener("testes:manutencao", (ev) => {
    const cenario = ev?.detail?.cenario;
    if (!cenario) return;

    registrarEvento({
      tipo: "soc",
      acao: "manutencao",
      cenario,
      origem: "testes:manutencao",
      timestamp: Date.now(),
      texto: `Manutenção ativada no cenário: ${cenario}`
    });
  });

  window.addEventListener("testes:erro-critico", (ev) => {
    const cenario = ev?.detail?.cenario;
    if (!cenario) return;

    registrarEvento({
      tipo: "soc",
      acao: "erro_critico",
      cenario,
      origem: "testes:erro-critico",
      timestamp: Date.now(),
      texto: `Erro crítico confirmado no cenário: ${cenario}`
    });
  });

  // 6.3) Ação SOC — quando ativa/continua análise
  window.addEventListener("soc:continuar_analise", (ev) => {
    try {
      const d = ev?.detail || {};

      if (d.sala) setSala(d.sala);

      registrarEvento({
        tipo: "soc",
        acao: "continuar_analise",
        sala: d.sala || socCollectorState.sala || null,
        decisao: d.decisao || null,
        origem: d.origem || "soc:continuar_analise",
        tipoNarrativo: d.tipoNarrativo || "decisao_soc",
        timestamp: Date.now(),
      });
    } catch (_) {}
  });

  // 6.4) Link da sala (evento crise:link)
  window.addEventListener("crise:link", (ev) => {
    try {
      const d = ev?.detail || {};
      if (!d.url) return;

      setSalaLink(d.url);

      // Auditoria técnica
      window.socLog?.({
        type: "soc_sala_link_set",
        url: d.url,
        origem: d.origem || "crise:link",
      });

      // Registro narrativo (relatório/PDF)
      window.dispatchEvent(
        new CustomEvent("logs:add", {
          detail: {
            id: "soc",
            log: {
              tipo: "soc_sala_link",
              timestamp: Date.now(),
              tecnico: "Sistema · SOC",
              acao: "🔗 Link da sala registrado",
              justificativa: d.url,
            },
          },
        })
      );
    } catch (_) {}
  });

  // ====================================================================
  // 7) CORRELAÇÃO — stakeholders automáticos
  // ====================================================================
  function sugerirStakeholders() {
    const times = new Set();

    socCollectorState.eventos.forEach((e) => {
      const texto = normalizarTexto(JSON.stringify(e));

      if (texto.includes("timeout") || texto.includes("infra")) times.add("Infraestrutura");
      if (texto.includes("login") || texto.includes("checkout")) times.add("Aplicações");
      if (texto.includes("impacto") || texto.includes("negocio") || texto.includes("negócio")) times.add("Negócio");
      if (texto.includes("instabilidade") || texto.includes("recorrente")) times.add("NOC");
    });

    return Array.from(times);
  }

  // ====================================================================
  // 8) RESUMO — base para relatório
  // ====================================================================
  function gerarResumoSoc() {
    return {
      sala: socCollectorState.sala,
      salaLink: socCollectorState.salaLink,
      severidade: socCollectorState.severidade,
      totalEventos: socCollectorState.eventos.length,
      stakeholders: sugerirStakeholders(),
      timeline: socCollectorState.eventos,
    };
  }

  // ====================================================================
  // 9) EXPOSIÇÃO GLOBAL — debug / integração
  // ====================================================================
  window.socCollector = {
    getState: () => socCollectorState, // state real
    setSala,
    setSalaLink,
    sugerirStakeholders,
    gerarResumoSoc,
  };

  // Debug opcional
  window.socCollectorAutoSev = {
    recalcularUltimo: () => {
      const ultimo = socCollectorState.eventos[socCollectorState.eventos.length - 1] || null;
      if (ultimo) autoAtualizarSeveridade("manual", ultimo);
      return socCollectorState.severidade;
    },
  };
})();
//=====================================================================
// Fim do soc-collector.js
//=====================================================================
