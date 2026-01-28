// ======================================================================
// analyzer.js — Núcleo de análise técnica da POC
// ----------------------------------------------------------------------
// Responsável por:
// - Interpretar eventos técnicos já coletados
// - Detectar padrões simples de falha
// - Classificar impacto operacional
// - Fornecer base para alertas, relatórios e IA futura
//
// IMPORTANTE:
// - NÃO executa testes
// - NÃO coleta dados
// - NÃO toma decisões automáticas
// ======================================================================


// ======================================================================
// CONFIGURAÇÕES BÁSICAS
// ======================================================================

// Limite de eventos semelhantes para considerar recorrência
const RECORRENCIA_THRESHOLD = 3;

// Janela de tempo (ms) para análise de repetição
const TIME_WINDOW = 5 * 60 * 1000; // 5 minutos


// ======================================================================
// FUNÇÃO PRINCIPAL
// ======================================================================

/**
 * Analisa um conjunto de eventos técnicos
 * @param {Array} eventos - lista de eventos normalizados
 * @returns {Object} resultado da análise
 */
export function analisarEventos(eventos = []) {
  if (!Array.isArray(eventos) || eventos.length === 0) {
    return criarResultadoVazio();
  }

  const agora = Date.now();

  // Filtra apenas eventos recentes
  const eventosRecentes = eventos.filter(e =>
    agora - e.timestamp <= TIME_WINDOW
  );

  const agrupados = agruparPorTipo(eventosRecentes);
  const analise = avaliarRecorrencia(agrupados);

  return {
    timestamp: agora,
    totalEventos: eventosRecentes.length,
    categorias: analise,
    severidadeGeral: calcularSeveridadeGeral(analise)
  };
}


// ======================================================================
// AGRUPAMENTO
// ======================================================================

/**
 * Agrupa eventos por tipo
 */
function agruparPorTipo(eventos) {
  return eventos.reduce((acc, evento) => {
    const tipo = evento.tipo || "desconhecido";

    if (!acc[tipo]) {
      acc[tipo] = [];
    }

    acc[tipo].push(evento);
    return acc;
  }, {});
}


// ======================================================================
// ANÁLISE DE RECORRÊNCIA
// ======================================================================

/**
 * Avalia se eventos são pontuais ou recorrentes
 */
function avaliarRecorrencia(eventosPorTipo) {
  const resultado = {};

  for (const tipo in eventosPorTipo) {
    const quantidade = eventosPorTipo[tipo].length;

    resultado[tipo] = {
      quantidade,
      recorrente: quantidade >= RECORRENCIA_THRESHOLD,
      impacto: classificarImpacto(tipo, quantidade)
    };
  }

  return resultado;
}


// ======================================================================
// CLASSIFICAÇÃO DE IMPACTO
// ======================================================================

/**
 * Classifica impacto com base em tipo e frequência
 */
function classificarImpacto(tipo, quantidade) {
  if (quantidade >= 5) return "alto";
  if (quantidade >= 3) return "medio";
  return "baixo";
}


// ======================================================================
// SEVERIDADE GLOBAL
// ======================================================================

function calcularSeveridadeGeral(categorias) {
  if (!categorias) return "desconhecida";

  let severidade = "normal";

  for (const tipo in categorias) {
    if (categorias[tipo].impacto === "alto") {
      severidade = "critica";
      break;
    }
    if (categorias[tipo].impacto === "medio") {
      severidade = "atencao";
    }
  }

  return severidade;
}


// ======================================================================
// FALLBACK
// ======================================================================

function criarResultadoVazio() {
  return {
    timestamp: Date.now(),
    totalEventos: 0,
    categorias: {},
    severidadeGeral: "normal"
  };
}
