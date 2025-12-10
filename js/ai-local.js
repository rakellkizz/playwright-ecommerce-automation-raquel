// ===================================================================
// 1. IA Local — Núcleo 100% Offline
// -------------------------------------------------------------------
// Este módulo é responsável por:
//   ✔ Resposta simples local (fallback)
//   ✔ Análise de sentimento (via SentimentJS CDN)
//   ✔ Classificação de intenção (intents básicos)
//   ✔ Base para C1, C2 e C3 se conectarem sem API externa
//
// Ele NÃO altera DOM, NÃO chama APIs, NÃO mexe no chat sozinho.
// ===================================================================


// ===================================================================
// 1.1 Objeto Principal — IA_LOCAL
// ===================================================================
export const IA_LOCAL = {

  // --------------------------------------------------------------
  // 1.1.1 Resposta simples — usada quando nenhuma IA avançada está ativa
  // --------------------------------------------------------------
  async respostaSimples(texto) {
    return `🤖 (IA Local): Você escreveu: "${texto}".`;
  }
};



// ===================================================================
// 2. ANÁLISE DE SENTIMENTO LOCAL
// -------------------------------------------------------------------
// Usa SentimentJS (CDN já carregada no index).
// Retorna sentimento + tokens + score + polaridade.
// Nenhuma alteração de comportamento foi feita.
// ===================================================================
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



// ===================================================================
// 3. CLASSIFICAÇÃO DE INTENÇÃO LOCAL (INTENTS)
// -------------------------------------------------------------------
// Lógica 100% sem API. Apenas regras.
// Retorna { intent, score, origem }.
// Bloco está limpo e compatível com C1, C2 e C3.
// ===================================================================
export function classificarIntencaoLocal(texto) {
  const frase = (texto || "").toLowerCase();

  // ---------------------------------------------------------------
  // 3.1 INTENÇÃO ESPECIAL — DIAGNÓSTICO TÉCNICO
  // ---------------------------------------------------------------
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



  // ---------------------------------------------------------------
  // 3.2 DICIONÁRIO DE INTENÇÕES COMUNS
  // ---------------------------------------------------------------
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

  // ---------------------------------------------------------------
  // 3.3 Analisador de match por palavra-chave
  // ---------------------------------------------------------------
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



// ===================================================================
// 4. PREPARAÇÃO PARA C1 / C2 / C3 (NÃO ALTERA NADA HOJE)
// -------------------------------------------------------------------
// Aqui ficam ganchos para:
//   • IA Monitor (C1 e C2)
//   • HUD SOC (exibição de severidade/tendência)
//   • IA híbrida (quando online)
//   • IA avançada do chat
//
// *Esse bloco NÃO modifica nada no comportamento atual.*
// ===================================================================
//
// // Exemplo de interface futura:
// IA_LOCAL.analisarCenario = async (texto) => {
//   return {
//     sentimento: analisarSentimentoLocal(texto),
//     intencao: classificarIntencaoLocal(texto)
//   };
// };
//
// // Mantido comentado até ativarmos C1/C2/C3 completos.
//
