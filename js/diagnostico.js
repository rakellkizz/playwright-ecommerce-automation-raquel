// ======================================================================
// diagnostico.js
// ----------------------------------------------------------------------
// 🎯 Responsável por gerar diagnósticos técnicos por CENÁRIO:
//
//   • login
//   • carrinho
//   • checkout
//   • busca
//   • smoke
//   • perfil
//
//   → Retorna um texto em HTML para o chat
//   → Dispara um CustomEvent para o sistema de LOGS / ALERTAS
// ======================================================================

// ----------------------------------------------------------------------
// 1) Catálogo de cenários com metadados padrão
// ----------------------------------------------------------------------
// Aqui você centraliza a "inteligência" por cenário:
//   título, severidade, impacto, causa provável, ação recomendada.
// ----------------------------------------------------------------------
const CENARIOS = {
  login: {
    id: "login",
    titulo: "Falha no fluxo de Login",
    severidade: "Alta",
    impacto:
      "Usuários não conseguem acessar o ambiente, afetando vendas e suporte.",
    causaProvavel:
      "Erro na validação de credenciais, bloqueio agressivo ou problema na API de autenticação.",
    acaoRecomendada:
      "Verificar logs de autenticação, revisar política de bloqueio, validar resposta da API de login e cobertura de testes de erro.",
  },

  carrinho: {
    id: "carrinho",
    titulo: "Anomalia no Carrinho",
    severidade: "Média",
    impacto:
      "Usuários podem perder itens ou ver totais incorretos, afetando conversão.",
    causaProvavel:
      "Problemas de sincronização de estado, cálculo de totais ou persistência no localStorage/sessionStorage.",
    acaoRecomendada:
      "Reexecutar cenários E2E do carrinho, revisar cálculos de desconto e impostos, validar persistência entre telas e dispositivos.",
  },

  checkout: {
    id: "checkout",
    titulo: "Inconsistência no Checkout",
    severidade: "Crítica",
    impacto:
      "Usuários não conseguem concluir pedidos, gerando perda direta de receita.",
    causaProvavel:
      "Falha na integração com gateway de pagamento, validação de endereço ou serviço de confirmação de pedido.",
    acaoRecomendada:
      "Inspecionar logs do gateway de pagamento, validar campos obrigatórios, testar fluxos alternativos (cartão, boleto, PIX) e monitorar taxa de erro.",
  },

  busca: {
    id: "busca",
    titulo: "Lentidão/Erro na Busca",
    severidade: "Média",
    impacto:
      "Usuários não encontram produtos, reduzindo interesse e engajamento.",
    causaProvavel:
      "Índices desatualizados, filtros pesados no backend ou falhas na API de autosuggest.",
    acaoRecomendada:
      "Monitorar tempo de resposta da API de busca, revisar índices, validar relevância e cobertura de testes de busca/filtro.",
  },

  smoke: {
    id: "smoke",
    titulo: "Falha em Smoke Tests",
    severidade: "Alta",
    impacto:
      "Fluxo principal do e-commerce está instável, comprometendo releases.",
    causaProvavel:
      "Mudanças recentes sem cobertura de testes, regressão em componentes centrais ou configuração incorreta de ambiente.",
    acaoRecomendada:
      "Revisar últimos commits, reexecutar bateria de smoke, validar variáveis de ambiente e dados de teste.",
  },

  perfil: {
    id: "perfil",
    titulo: "Problemas no Perfil do Usuário",
    severidade: "Baixa",
    impacto:
      "Impacto moderado em experiência, mas pode gerar chamados de suporte.",
    causaProvavel:
      "Falhas de validação de campos, problemas de cache ou inconsistência entre front e API de perfil.",
    acaoRecomendada:
      "Verificar validações de formulário, sincronização com backend e dados retornados pela API.",
  },
};

// ----------------------------------------------------------------------
// 2) Função utilitária: monta um HTML bonitinho para o chat
// ----------------------------------------------------------------------
function montarHtmlDiagnostico(info) {
  const dataAgora = new Date();

  const dataFormatada = dataAgora.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const horaFormatada = dataAgora.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
    <p><strong>🧠 Diagnóstico técnico — ${info.titulo}</strong></p>
    <p><strong>Severidade:</strong> ${info.severidade}</p>
    <p><strong>Impacto:</strong> ${info.impacto}</p>
    <p><strong>Causa provável:</strong> ${info.causaProvavel}</p>
    <p><strong>Ação recomendada:</strong> ${info.acaoRecomendada}</p>
    <p><strong>Data/Horário:</strong> ${dataFormatada} às ${horaFormatada}</p>
  `;
}

// ----------------------------------------------------------------------
// 3) Função pública: gerarDiagnostico(cenarioId)
// ----------------------------------------------------------------------
// • cenarioId deve ser um dos keys de CENARIOS: "login", "carrinho", etc
// • Retorna uma string HTML para ser mostrada no chat
// • Dispara um CustomEvent para alimentar LOGS + ALERTAS
// ----------------------------------------------------------------------
export function gerarDiagnostico(cenarioId) {
  const chave = (cenarioId || "").toString().toLowerCase().trim();

  const info = CENARIOS[chave];
  if (!info) {
    // cenário desconhecido → não quebra nada, apenas retorna null
    return null;
  }

  // Monta o texto em HTML para o chat
  const html = montarHtmlDiagnostico(info);

  // Dispara um evento global para o sistema de logs/alertas
  // Qualquer módulo pode ouvir:
  //   window.addEventListener("cenario:diagnostico", (ev) => { ... })
  window.dispatchEvent(
    new CustomEvent("cenario:diagnostico", {
      detail: {
        id: info.id,
        titulo: info.titulo,
        severidade: info.severidade,
        impacto: info.impacto,
        causaProvavel: info.causaProvavel,
        acaoRecomendada: info.acaoRecomendada,
        timestamp: Date.now(),
      },
    }),
  );

  return html;
}
