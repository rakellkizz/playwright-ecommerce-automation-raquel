// ======================================================================
// IA HÍBRIDA — Primeiro tenta diagnóstico técnico local (gratuito),
// depois tenta IA externa (OpenAI/Gemini), e por fim cai na IA Local.
// ----------------------------------------------------------------------
// NÃO ALTERA NADA NO LAYOUT, no chat, nem no timer.
// Apenas recebe uma frase e devolve um texto para o chat.
// ======================================================================

import { IA_LOCAL } from "./ai-local.js";         // IA 100% local (fallback)
import { API_KEY, MODEL } from "./config.js";     // Configuração de IA externa
import { gerarDiagnostico } from "./diagnostico.js"; // Diagnóstico por cenário

// ======================================================================
// FUNÇÃO PRINCIPAL — IA(textoUsuario)
// ----------------------------------------------------------------------
// Responsável por:
//   1) Detectar palavras-chave e gerar diagnósticos técnicos (login, etc.)
//   2) Se não houver API → usa IA local (gratuita)
//   3) Se houver API → tenta OpenAI/Gemini
//   4) Se a API falhar → volta para IA local
//
// -> Essa função é chamada exclusivamente pelo chat-ui.js
// -> NÃO toca no DOM, não mexe na tela.
// ======================================================================
export async function IA(textoUsuario) {

  // Normaliza texto para evitar erros de comparação
  const textoLower = textoUsuario.toLowerCase();

  // ======================================================================
  // 1) DIAGNÓSTICO LOCAL IMEDIATO (SISTEMA DA RAQUEL 💜)
  // ----------------------------------------------------------------------
  // Aqui detectamos termos relacionados a cenários reais do seu projeto:
  // login, checkout, carrinho.
  //
  // Ao detectar, chamamos gerarDiagnostico(), que:
  //   • devolve um HTML bonitinho para o chat
  //   • dispara evento "cenario:diagnostico" → logs + alertas
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
  // 2) SEM API CONFIGURADA → IA LOCAL
  // ----------------------------------------------------------------------
  // Se a API não existir ou estiver curta (<10 chars),
  // usamos IA_LOCAL.respostaSimples(), que é leve e garantida.
  // ======================================================================
  if (!API_KEY || API_KEY.trim().length < 10) {
    return IA_LOCAL.respostaSimples(textoUsuario);
  }

  // ======================================================================
  // 3) COM API → Tenta IA EXTERNA (OpenAI/Gemini)
  // ----------------------------------------------------------------------
  // Aqui enviamos a pergunta para o modelo configurado.
  // Se a API responder, retornamos o texto dela.
  //
  // -> TOTALMENTE ASSÍNCRONO
  // -> Não trava o navegador
  // -> Seguro para GitHub Pages
  // ======================================================================
  try {
    const resposta = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,     // chave da usuária
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,                             // ex: "gpt-3.5-turbo"
        messages: [
          { role: "user", content: textoUsuario }  // texto enviado ao modelo
        ]
      })
    }).then(r => r.json());

    // Extrai resposta ou retorna fallback "(sem resposta)"
    return resposta?.choices?.[0]?.message?.content || "(sem resposta)";

  } catch (erro) {

    // ==================================================================
    // 4) API FALHOU → Volta para IA LOCAL (garantido)
    // ------------------------------------------------------------------
    // Aqui garantimos que o chat NUNCA quebra.
    // ==================================================================
    return IA_LOCAL.respostaSimples(textoUsuario);
  }
}
