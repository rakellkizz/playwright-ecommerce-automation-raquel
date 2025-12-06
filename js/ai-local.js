// ======================================================================
// ai-local.js — IA 100% local (gratuita, sem API)
// ======================================================================

// ======================================================================
// OBJETO PRINCIPAL — IA_LOCAL
// ======================================================================
export const IA_LOCAL = {

  // --------------------------------------------------------------
  // Resposta simples usada como fallback
  // --------------------------------------------------------------
  async respostaSimples(texto) {
    return `🤖 (IA Local): Você escreveu: "${texto}".`;
  }
};



// ======================================================================
// ANÁLISE DE SENTIMENTO (via SentimentJS CDN)
// ======================================================================
export function analisarSentimentoLocal(texto) {
  const frase = (texto || "").toString();
  const sentiment = new Sentiment();
  const resultado = sentiment.analyze(frase);

  let polaridade = "neutro";
  if (resultado.score > 0) polaridade = "positivo";
  if (resultado.score < 0) polaridade = "negativo";

  return {
    textoOriginal: frase,
    score: resultado.score,
    comparativo: resultado.comparative,
    polaridade,
    tokens: resultado.tokens,
    palavrasPositivas: resultado.positive,
    palavrasNegativas: resultado.negative,
    origem: "sentiment-local"
  };
}



// ======================================================================
// CLASSIFICAÇÃO DE INTENÇÃO LOCAL
// ======================================================================
export function classificarIntencaoLocal(texto) {
  const frase = (texto || "").toLowerCase();

  // ===============================================================
  // NOVA INTENÇÃO — DIAGNÓSTICO TÉCNICO
  // ===============================================================
  if (
    frase.includes("onde está o problema") ||
    frase.includes("qual o erro") ||
    frase.includes("erro") ||
    frase.includes("falha") ||
    frase.includes("alarme") ||
    frase.includes("diagnóstico")
  ) {
    return {
      textoOriginal: frase,
      intent: "diagnostico",
      score: 999,
      origem: "regras-locais"
    };
  }

  // ===============================================================
  // Dicionário de intenções comuns
  // ===============================================================
  const regras = [
    {
      intent: "login",
      palavras: ["login", "entrar", "logar", "senha", "usuario", "usuário"]
    },
    {
      intent: "compra",
      palavras: ["comprar", "carrinho", "checkout", "pagar", "pedido"]
    },
    {
      intent: "busca",
      palavras: ["buscar", "pesquisar", "procurar", "produto"]
    },
    {
      intent: "erro",
      palavras: ["erro", "bug", "falha", "problema"]
    },
    {
      intent: "duvida",
      palavras: ["?", "como faço", "ajuda", "help"]
    }
  ];

  let melhorIntent = "desconhecida";
  let melhorScore = 0;

  for (const regra of regras) {
    let score = 0;

    for (const palavra of regra.palavras) {
      if (frase.includes(palavra)) score++;
    }

    if (score > melhorScore) {
      melhorScore = score;
      melhorIntent = regra.intent;
    }
  }

  return {
    textoOriginal: frase,
    intent: melhorIntent,
    score: melhorScore,
    origem: "regras-locais"
  };
}
