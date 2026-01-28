// ======================================================================
// config.js — Configurações globais da IA
// ======================================================================

// ============================================================
// config.js — flags globais do site (Debug via query/hash)
// ============================================================

export const DEBUG =
  new URLSearchParams(location.search).get("debug") === "1" ||
  location.hash.toLowerCase().includes("debug");

// Facilita CSS/JS (sem mexer em layout/HTML)
if (DEBUG) {
  document.documentElement.setAttribute("data-debug", "1");
}
// ======================================================================
// 🔑 API KEY — deixe vazia para usar APENAS IA LOCAL
// ======================================================================
// Se quiser usar OpenAI/Gemini no futuro:
// export const API_KEY = "SUA_CHAVE_AQUI";
export const API_KEY = ""; // IA local ativada automaticamente


// ======================================================================
// 🤖 Modelo de IA externa (OpenAI/Gemini)
// ======================================================================
// Se deixar IA local (API_KEY = ""), o modelo é ignorado.
export const MODEL = "gpt-3.5-turbo";
