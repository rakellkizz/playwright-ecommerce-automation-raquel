// ================================================================
// torpedos-ultra.js — Montador de torpedos corporativos de incidente
// -------------------------------------------------------------------
// OBJETIVO:
//   • Gerar textos prontos para SMS / WhatsApp / e-mail
//   • Formato ultra corporativo (Governança de TI, NOC, GMUD, etc.)
//   • NÃO toca em DOM, NÃO abre modal – só devolve string
//
// COMO USAR (exemplo):
//   const msg = TorpedosUltra.montarTorpedoCrise({
//     sistema: "E-Commerce Playwright",
//     ambiente: "Produção",
//     prioridade: "P1",
//     ticket: "INC-2025-0001",
//     sla: "Resposta em 15 min / Normalização em 2h",
//     impacto: "Clientes não conseguem finalizar compras.",
//     status: "Início",
//     checkpoint: "13/07 - 11:00",
//     inicio: "13/07 - 10:45",
//     linkReuniao: "https://meet.google.com/xxx-yyyy-zzz",
//     analista: "Raquel Souza",
//     gestor: "Gestor de TI",
//     times: "NOC, Aplicações, Banco de Dados"
//   });
//
//   console.log(msg);
// ================================================================

(function () {
  // ==============================================================
  // 1. FUNÇÕES AUXILIARES
  // ==============================================================

  // 1.1 — Data/hora atual formatada "dd/MM - HH:mm"
  function formatarDataHoraCurta(date = new Date()) {
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const hora = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${dia}/${mes} - ${hora}:${min}`;
  }

  // 1.2 — Normaliza valor para evitar "undefined"
  function val(v, fallback = "—") {
    if (v === null || v === undefined) return fallback;
    const s = String(v).trim();
    return s.length ? s : fallback;
  }

  // 1.3 — Identificador simples de crise (se quiser usar automático)
  function gerarIdCrise() {
    const agora = new Date();
    const y = agora.getFullYear();
    const m = String(agora.getMonth() + 1).padStart(2, "0");
    const d = String(agora.getDate()).padStart(2, "0");
    const h = String(agora.getHours()).padStart(2, "0");
    const min = String(agora.getMinutes()).padStart(2, "0");
    return `CR-${y}${m}${d}-${h}${min}`;
  }

  // ==============================================================
  // 2. TORPEDO DE CRISE (Incidente crítico)
  // ==============================================================

  function montarTorpedoCrise(opts = {}) {
    const {
      numeroCrise = gerarIdCrise(),
      sistema = "Aplicação",
      ambiente = "Produção",
      prioridade = "P1",
      ticket = "INC-000000",
      sla = "Conforme catálogo de serviços.",
      impacto = "Aplicação apresenta falha para os usuários.",
      status = "Início",
      repercussao = "Impacto elevado para o negócio.",
      checkpoint = formatarDataHoraCurta(),
      inicio = formatarDataHoraCurta(),
      linkReuniao = "",
      analista = "Analista de Plantão",
      gestor = "Gestor de TI",
      times = "NOC, Aplicação, Infraestrutura",
    } = opts;

    let msg = "";
    msg += `Governança de TI informa:\n`;
    msg += `Incidente Crítico: ${val(sistema)}\n`;
    msg += `Número da Crise: ${val(numeroCrise)}\n`;
    msg += `Ambiente Impactado: ${val(ambiente)}\n`;
    msg += `Prioridade: ${val(prioridade)}\n`;
    msg += `Ticket: ${val(ticket)}\n`;
    msg += `SLA: ${val(sla)}\n`;
    msg += `Status: ${val(status)}\n`;
    msg += `Repercussão: ${val(repercussao)}\n`;
    msg += `Aplicação: ${val(impacto)}\n`;
    msg += `Checkpoint: ${val(checkpoint)}\n`;

    if (linkReuniao) {
      msg += `Link da reunião: ${linkReuniao}\n`;
    }

    msg += `Início: ${val(inicio)}\n`;
    msg += `Times envolvidos: ${val(times)}\n`;
    msg += `Analista responsável: ${val(analista)}\n`;
    msg += `Gestor envolvido: ${val(gestor)}\n`;

    return msg.trim();
  }

  // ==============================================================
  // 3. TORPEDO GMUD PROGRAMADA
  // ==============================================================

  function montarTorpedoGmud(opts = {}) {
    const {
      sistema = "Aplicação",
      tipo = "Programada",
      ticket = "GV-000000",
      ambiente = "Produção",
      atividade = "Deploy para evolução do ambiente.",
      inicio = formatarDataHoraCurta(),
      termino = formatarDataHoraCurta(),
      linkReuniao = "",
    } = opts;

    let msg = "";
    msg += `GMUD: ${val(sistema)}\n`;
    msg += `Tipo: ${val(tipo)}\n`;
    msg += `Ticket: ${val(ticket)}\n`;
    msg += `Ambiente: ${val(ambiente)}\n`;
    msg += `Atividade: ${val(atividade)}\n`;
    msg += `Durante a janela de execução o ambiente poderá ficar indisponível, conforme acordado com a área de negócios.\n`;

    if (linkReuniao) {
      msg += `Hangouts/Reunião: ${linkReuniao}\n`;
    }

    msg += `Início: ${val(inicio)}\n`;
    msg += `Término: ${val(termino)}\n`;

    return msg.trim();
  }

  // ==============================================================
  // 4. TORPEDO DE ATUALIZAÇÃO / VALIDAÇÃO
  // ==============================================================

  function montarTorpedoAtualizacao(opts = {}) {
    const {
      sistema = "Aplicação",
      ambiente = "Produção",
      prioridade = "P1",
      ticket = "INC-000000",
      status = "Em validação",
      checkpoint = formatarDataHoraCurta(),
      impacto = "Aplicação segue apresentando falha para parte dos usuários.",
      linkReuniao = "",
    } = opts;

    let msg = "";
    msg += `Incidente Crítico: ${val(sistema)}\n`;
    msg += `Ambiente Impactado: ${val(ambiente)}\n`;
    msg += `Prioridade: ${val(prioridade)}\n`;
    msg += `Ticket: ${val(ticket)}\n`;
    msg += `Status: ${val(status)}\n`;
    msg += `Checkpoint: ${val(checkpoint)}\n`;
    msg += `Aplicação: ${val(impacto)}\n`;

    if (linkReuniao) {
      msg += `Link da videochamada: ${linkReuniao}\n`;
    }

    return msg.trim();
  }

  // ==============================================================
  // 5. TORPEDO DE NORMALIZAÇÃO
  // ==============================================================

  function montarTorpedoNormalizado(opts = {}) {
    const {
      sistema = "Aplicação",
      ambiente = "Produção",
      ticket = "INC-000000",
      horarioNormalizacao = formatarDataHoraCurta(),
      causa = "Causa raiz em análise.",
      proximoPasso = "Próximos passos serão comunicados via relatório pós-incidente.",
    } = opts;

    let msg = "";
    msg += `Governança de TI informa:\n`;
    msg += `Incidente Normalizado: ${val(sistema)}\n`;
    msg += `Ambiente: ${val(ambiente)}\n`;
    msg += `Ticket: ${val(ticket)}\n`;
    msg += `Horário de normalização: ${val(horarioNormalizacao)}\n`;
    msg += `Causa provável: ${val(causa)}\n`;
    msg += `${val(proximoPasso)}\n`;

    return msg.trim();
  }

  // ==============================================================
  // 6. EXPŌR API PÚBLICA
  // ==============================================================

  window.TorpedosUltra = {
    formatarDataHoraCurta,
    gerarIdCrise,
    montarTorpedoCrise,
    montarTorpedoGmud,
    montarTorpedoAtualizacao,
    montarTorpedoNormalizado,
  };

  console.log("✅ TorpedosUltra carregado (crise, GMUD, atualização, normalizado).");
})();
