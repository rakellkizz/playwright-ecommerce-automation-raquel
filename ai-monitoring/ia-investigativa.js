/* ======================================================================
   ia-investigativa.js — Camada “conversacional” (perguntas) em cima do analyzer
   ----------------------------------------------------------------------
   O que este arquivo faz:
   - Recebe um “resultado” do analyzer (objeto com sinais)
   - Decide se vale perguntar (ex.: baixa confiança / padrão suspeito)
   - Gera perguntas curtas e úteis (sem spam)
   - Envia as perguntas para o chat (window.chatAviso), se existir
   - Mantém fila, cooldown e “uma pergunta por vez”
   ====================================================================== */

/* ======================================================================
   1) CONFIGURAÇÕES (controlam o comportamento sem quebrar nada)
   ====================================================================== */

// Chave para persistir estado mínimo (não é log do Allure, é só IA “lembrar”)
// Ex.: evitar perguntar repetido toda vez que recarrega a página.
const STORAGE_KEY_IA = "rk_ia_investigativa_state_v1";

// Cooldown entre perguntas (evita flood no chat)
const COOLDOWN_MS = 25_000; // 25s

// Quantidade máxima de perguntas por “rodada” de análise
const MAX_PERGUNTAS_POR_RODADA = 3;

// Se a confiança vier baixa, perguntamos mais (se existir no resultado)
const LIMIAR_CONFIANCA_BAIXA = 0.72;

// Se detectarmos recorrência/temporalidade, vale perguntar
// (mesmo com confiança alta)
const LIMIAR_SINAL_RELEVANTE = 1; // 1 = qualquer sinal relevante já habilita perguntas

/* ======================================================================
   2) ESTADO INTERNO (fila, histórico e controle de spam)
   ====================================================================== */

function carregarState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_IA)) || {};
  } catch {
    return {};
  }
}

function salvarState(state) {
  try {
    localStorage.setItem(STORAGE_KEY_IA, JSON.stringify(state));
  } catch {}
}

const state = carregarState();

// Estrutura esperada do state:
// state.lastAskAt = number (timestamp ms)
// state.lastScenarioAsked = { [cenarioId]: timestamp }
// state.mutedScenarios = { [cenarioId]: true/false }

if (!state.lastAskAt) state.lastAskAt = 0;
if (!state.lastScenarioAsked) state.lastScenarioAsked = {};
if (!state.mutedScenarios) state.mutedScenarios = {};

// Fila de perguntas pendentes
const fila = [];

// Controle simples para não disparar duas vezes ao mesmo tempo
let enviando = false;

/* ======================================================================
   3) FUNÇÕES DE SAÍDA (chatAviso / console fallback)
   ====================================================================== */

function enviarNoChat(texto) {
  // Se você já tem um chat UI com função global:
  if (typeof window.chatAviso === "function") {
    window.chatAviso(texto);
    return true;
  }

  // Fallback: console
  console.log("[IA Investigativa]", texto);
  return false;
}

/* ======================================================================
   4) REGRAS DE DECISÃO — quando perguntar?
   ====================================================================== */

function agoraMs() {
  return Date.now();
}

function emCooldownGlobal() {
  return agoraMs() - state.lastAskAt < COOLDOWN_MS;
}

function emCooldownDoCenario(cenarioId) {
  const last = state.lastScenarioAsked[cenarioId] || 0;
  return agoraMs() - last < COOLDOWN_MS;
}

function cenarioMutado(cenarioId) {
  return !!state.mutedScenarios[cenarioId];
}

/**
 * Decide se vale perguntar com base no resultado do analyzer.
 * Espera um formato flexível, sem obrigar campos.
 */
function devePerguntar(cenarioId, resultado) {
  if (!cenarioId) return false;
  if (cenarioMutado(cenarioId)) return false;

  // Evita spam:
  if (emCooldownGlobal()) return false;
  if (emCooldownDoCenario(cenarioId)) return false;

  // Se o analyzer trouxer “confianca”
  const confianca = typeof resultado?.confianca === "number" ? resultado.confianca : null;

  // Sinais (podem vir como booleans/strings/números)
  const recorrente = !!resultado?.recorrente;
  const padraoTemporal = !!resultado?.padraoTemporal;
  const instabilidade = resultado?.tipoFalha === "instabilidade";
  const regressao = resultado?.tipoFalha === "regressao";
  const falhaAbrupta = !!resultado?.falhaAbrupta;
  const degradacao = !!resultado?.degradacao;

  // Conta “sinais relevantes”
  let sinais = 0;
  if (recorrente) sinais++;
  if (padraoTemporal) sinais++;
  if (instabilidade || regressao) sinais++;
  if (falhaAbrupta) sinais++;
  if (degradacao) sinais++;

  // Caso 1: confiança baixa -> perguntar para confirmar/descartar
  if (confianca !== null && confianca < LIMIAR_CONFIANCA_BAIXA) return true;

  // Caso 2: sinais relevantes presentes -> perguntar para coletar contexto humano
  if (sinais >= LIMIAR_SINAL_RELEVANTE) return true;

  return false;
}

/* ======================================================================
   5) GERADOR DE PERGUNTAS — monta perguntas objetivas
   ====================================================================== */

function gerarPerguntas(cenarioId, resultado) {
  const perguntas = [];

  // Baseado nos campos que você citou:
  // “recorrente”, “degrada”, “instabilidade/regressão”, “funcional/técnico”, “padrão temporal”

  // 5.1 — Recorrência
  if (resultado?.recorrente) {
    perguntas.push("Esse erro é recorrente mesmo (acontece em execuções diferentes) ou foi pontual?");
  } else {
    // Se não marcou recorrente mas houve alerta/erro, ainda vale perguntar levemente
    if (resultado?.severidade && resultado.severidade !== "baixa") {
      perguntas.push("Isso parece pontual ou você já viu acontecer antes nesse cenário?");
    }
  }

  // 5.2 — Degradação vs falha abrupta
  if (resultado?.degradacao) {
    perguntas.push("Esse cenário degrada aos poucos (lentidão/timeout) ou falha de uma vez (quebra abrupta)?");
  } else if (resultado?.falhaAbrupta) {
    perguntas.push("A falha acontece de forma abrupta (de uma vez) ou existe degradação antes?");
  } else {
    perguntas.push("O comportamento piora antes de falhar (degrada) ou falha direto?");
  }

  // 5.3 — Instabilidade vs regressão
  if (resultado?.tipoFalha === "instabilidade") {
    perguntas.push("Isso parece instabilidade (oscila) ou uma regressão (quebrou e permanece quebrado)?");
  } else if (resultado?.tipoFalha === "regressao") {
    perguntas.push("Isso tem cara de regressão (mudança recente) ou pode ser instabilidade do ambiente?");
  } else {
    perguntas.push("Você acha que é instabilidade (intermitente) ou regressão (constante após mudança)?");
  }

  // 5.4 — Funcional vs técnico
  // (não precisa de IA “adivinhar”; a pergunta coleta contexto)
  perguntas.push("O erro parece funcional (regra de negócio/fluxo) ou técnico (infra, timeout, dependência, rede)?");

  // 5.5 — Padrão temporal
  if (resultado?.padraoTemporal) {
    perguntas.push("Tem padrão temporal? (ex.: só à noite, horário de pico, sempre após X minutos)");
  } else {
    perguntas.push("Você notou algum padrão temporal? (horário específico, pico, após login, após checkout, etc.)");
  }

  // 5.6 — Limita o volume por rodada
  return perguntas.slice(0, MAX_PERGUNTAS_POR_RODADA);
}
// ======================================================================
// 5.7 🔔 Se sinais forem MUITO fortes, sugerir Sala de Crise no chat
// ----------------------------------------------------------------------
// Sem forçar abertura — só sugere (decisão humana)
// ======================================================================
try {
  const severo =
    resultado?.severidade === "alta" ||
    resultado?.prioridade === "P1" ||
    resultado?.falhaAbrupta ||
    (resultado?.recorrente && resultado?.tipoFalha === "regressao");

  if (severo) {
    window.dispatchEvent(
      new CustomEvent("soc:sugerir_crise", {
        detail: {
          origem: "IA Investigativa",
          motivo: "Sinais fortes (alta severidade/recorrência/regressão).",
          cenarioId,
        },
      })
    );
  }
} catch (_) {}

/* ======================================================================
   6) FILA E ENVIO — uma pergunta por vez, com controle
   ====================================================================== */

function enfileirarPerguntas(cenarioId, perguntas) {
  perguntas.forEach((p) => {
    fila.push({ cenarioId, texto: p, createdAt: agoraMs() });
  });
}

/**
 * Envia a próxima pergunta disponível.
 * - marca cooldown global e do cenário
 * - evita enviar se fila vazia
 */
async function enviarProxima() {
  if (enviando) return;
  if (!fila.length) return;

  // Marca “travado” para não duplicar
  enviando = true;

  try {
    const item = fila.shift();

    // Se por algum motivo mutou o cenário no meio
    if (cenarioMutado(item.cenarioId)) return;

    // Atualiza cooldown
    state.lastAskAt = agoraMs();
    state.lastScenarioAsked[item.cenarioId] = agoraMs();
    salvarState(state);

    // Formato da mensagem (curta e direta)
    enviarNoChat(`🤖 (${item.cenarioId}) ${item.texto}`);

// ---------------------------------------------------------------
// 🧾 REGISTRAR PERGUNTA DA IA NO HISTÓRICO (auditoria / relatório)
// ---------------------------------------------------------------
try {
  window.dispatchEvent(
  new CustomEvent("logs:add", {
    detail: {
      id: item.cenarioId,
      log: {
        tipo: "ia_pergunta",
        tipoNarrativo: "pergunta_ia",
        timestamp: Date.now(),
        tecnico: "IA · Investigativa",
        acao: `❓ Pergunta: ${item.texto}`,
        justificativa:
          "Pergunta gerada automaticamente para coleta de contexto humano.",
      },
    },
  })
);
} catch (_) {
  // silencioso para não quebrar UX
}


  } finally {
    enviando = false;
  }
}
/* ======================================================================
   7) API PÚBLICA — como outras partes chamam essa IA
   ====================================================================== */

/**
 * Chamada principal:
 * iaInvestigativa.perguntar("login", resultadoDoAnalyzer)
 */
function perguntar(cenarioId, resultado) {
  if (!cenarioId) return;

  // Decide se pergunta ou não
  if (!devePerguntar(cenarioId, resultado)) return;

  const perguntas = gerarPerguntas(cenarioId, resultado);
  if (!perguntas.length) return;

  enfileirarPerguntas(cenarioId, perguntas);

  // Dispara a primeira pergunta imediatamente
  enviarProxima();
}

/**
 * Permite mutar um cenário (não perguntar mais)
 */
function mutarCenario(cenarioId, mutar = true) {
  if (!cenarioId) return;
  state.mutedScenarios[cenarioId] = !!mutar;
  salvarState(state);
}

/**
 * Limpa mute/cooldowns (útil para testes)
 */
function resetar() {
  state.lastAskAt = 0;
  state.lastScenarioAsked = {};
  state.mutedScenarios = {};
  salvarState(state);
  fila.length = 0;
}

/* ======================================================================
   8) INTEGRAÇÃO POR EVENTO — ouvir “resultado do analyzer”
   ====================================================================== */

/**
 * Espera que algum ponto do seu sistema dispare:
 * window.dispatchEvent(new CustomEvent("ia:analyzer_result", { detail: { id, resultado } }))
 */
window.addEventListener("ia:analyzer_result", (ev) => {
  const d = ev.detail;
  if (!d?.id || !d?.resultado) return;
  perguntar(d.id, d.resultado);
});


/* ======================================================================
   09) EXPOSIÇÃO GLOBAL — para você testar pelo console
   ====================================================================== */

window.iaInvestigativa = {
  perguntar,
  mutarCenario,
  resetar,
  _fila: fila, // debug
};
/* ====================================================================== */