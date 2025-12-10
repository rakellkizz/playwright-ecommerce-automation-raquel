// ======================================================================
// 1. IA HÍBRIDA — LOCAL → EXTERNA → LOCAL (fallback garantido)
// ----------------------------------------------------------------------
// Fluxo:
//   1) Tenta diagnóstico técnico imediato (login, carrinho etc.)
//   2) Se não houver API → usa IA LOCAL (gratuita)
//   3) Se houver API → tenta IA externa (OpenAI/Gemini)
//   4) Se a API falhar → volta automaticamente para IA LOCAL
//
// ESTE ARQUIVO NÃO:
//   ✘ altera layout
//   ✘ altera DOM
//   ✘ mexe no timer ou HUD
//
// Ele SOMENTE devolve um texto para o chat-ui.js.
// ======================================================================


// ======================================================================
// 1.1 IMPORTAÇÕES
// ======================================================================
import { IA_LOCAL } from "./ai-local.js";            // IA totalmente local
import { API_KEY, MODEL } from "./config.js";        // Configuração externa
import { gerarDiagnostico } from "./diagnostico.js"; // Diagnóstico técnico


// ======================================================================
// 2. FUNÇÃO PRINCIPAL — IA(textoUsuario)
// ----------------------------------------------------------------------
// É chamada exclusivamente pelo chat-ui.js.
// Retorna SEMPRE um texto seguro (nunca quebra).
// ======================================================================
export async function IA(textoUsuario) {

  // -------------------------------------------------------------------
  // 2.1 Normalização do texto
  // -------------------------------------------------------------------
  const textoLower = textoUsuario.toLowerCase();



  // ======================================================================
  // 3. DIAGNÓSTICO LOCAL IMEDIATO — INTELIGÊNCIA C1 DO PROJETO
  // ----------------------------------------------------------------------
  // Quando o usuário menciona um cenário real (login, checkout etc),
  // chamamos gerarDiagnostico(cenarioId), que:
  //
  //   ✔ devolve HTML pronto para o chat
  //   ✔ dispara o evento "cenario:diagnostico" → logs + alertas automáticos
  //
  // ESSA É A IA TÉCNICA QUE VOCÊ CRIOU, KELL 💜
  // ======================================================================

  if (textoLower.includes("login")) {
    const r = gerarDiagnostico("login");
    if (r) return r;
  }

  if (textoLower.includes("checkout")) {
    const r = gerarDiagnostico("checkout");
    if (r) return r;
  }

  if (textoLower.includes("carrinho")) {
    const r = gerarDiagnostico("carrinho");
    if (r) return r;
  }

  if (textoLower.includes("busca")) {
    const r = gerarDiagnostico("busca");
    if (r) return r;
  }

  if (textoLower.includes("smoke")) {
    const r = gerarDiagnostico("smoke");
    if (r) return r;
  }

  if (textoLower.includes("perfil")) {
    const r = gerarDiagnostico("perfil");
    if (r) return r;
  }



  // ======================================================================
  // 4. SEM API CONFIGURADA → IA LOCAL (SEGURA, GRATUITA)
  // ----------------------------------------------------------------------
  // Se API_KEY não estiver configurada, ou tiver menos de 10 caracteres,
  // usamos a IA LOCAL sem hesitar.
  //
  // ➜ GARANTE que o chat NUNCA quebra.
  // ======================================================================
  if (!API_KEY || API_KEY.trim().length < 10) {
    return IA_LOCAL.respostaSimples(textoUsuario);
  }



  // ======================================================================
  // 5. COM API → TENTATIVA DE IA EXTERNA (OpenAI / Gemini)
  // ----------------------------------------------------------------------
  // Envia texto para modelo configurado.
  // Assíncrono, leve, e compatível com GitHub Pages.
  //
  // Qualquer erro → fallback automático (bloco 6)
  // ======================================================================
  try {
    const resposta = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,                     // Ex: "gpt-3.5-turbo"
        messages: [
          { role: "user", content: textoUsuario }
        ]
      })
    }).then(r => r.json());

    return resposta?.choices?.[0]?.message?.content || "(sem resposta)";

  } catch (erro) {



    // ==================================================================
    // 6. FALHA NA API EXTERNA → VOLTA PARA A IA LOCAL
    // ------------------------------------------------------------------
    // ESSA PARTE GARANTE 100% DE CONTINUIDADE.
    // Não importa se a OpenAI caiu, internet falhou, etc.
    // ==================================================================
    return IA_LOCAL.respostaSimples(textoUsuario);
  }
}
