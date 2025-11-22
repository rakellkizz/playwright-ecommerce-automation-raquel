// config/siteConfig.js
// 🎯 Configuração do site de e-commerce a ser testado
// Aqui você pluga o site REAL, mas deixa os seletores centralizados
// para não precisar mexer nos testes toda hora.

// 🔹 Exemplo genérico – depois nós adaptamos para um site real específico.
export const siteConfig = {
  // URL base do site (pode ser ambiente de homologação)
  baseURL: "https://www.exemplo-ecommerce.com",

  // Termo de busca padrão para testes
  defaultSearchTerm: "tênis",

  // Seletores usados no fluxo principal
  selectors: {
    // Campo de busca principal no header
    searchInput: 'input[name="q"], input[type="search"]',

    // Botão de enviar busca (caso não seja só Enter)
    searchButton: 'button[type="submit"], button[aria-label*="Buscar"]',

    // Container de resultados de busca
    searchResultItem: '.product-item, .result-item, [data-testid="product-card"]',

    // Link / botão para abrir o primeiro produto
    firstProductLink: '.product-item a, .result-item a, [data-testid="product-card"] a'
  }
};
