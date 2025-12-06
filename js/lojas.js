// ======================================================================
// lojas.js — Sistema de Multi-lojas (Dafiti, Kanui, Tricae, etc.)
// ======================================================================

export let LOJAS = JSON.parse(localStorage.getItem("lojas")) || [];


// ======================================================================
// Adiciona uma nova loja no sistema
// ======================================================================
export function cadastrarLoja(dados) {
  LOJAS.push(dados);
  salvar();
}


// ======================================================================
// Lista todas as lojas cadastradas
// ======================================================================
export function listarLojas() {
  return LOJAS;
}


// ======================================================================
// Remove loja por ID
// ======================================================================
export function removerLoja(id) {
  LOJAS = LOJAS.filter(l => l.id !== id);
  salvar();
}


// ======================================================================
// Salvar no storage
// ======================================================================
function salvar() {
  localStorage.setItem("lojas", JSON.stringify(LOJAS));
}


// ======================================================================
// Criar modelo de loja
// ======================================================================
export function novaLoja(nome, url, analista) {
  return {
    id: crypto.randomUUID(),
    nome,
    url,
    analistaResponsavel: analista,
    criadoEm: new Date().toLocaleString("pt-BR")
  };
}
