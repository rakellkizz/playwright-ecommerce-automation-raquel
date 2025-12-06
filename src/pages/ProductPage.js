// ======================================================================
// 📄 ProductPage.js
// Página de detalhes de um produto individual.
// Permite ver nome, preço e adicionar o item ao carrinho.
// ======================================================================

export class ProductPage {
  constructor(page) {
    this.page = page;

    // 🔹 Nome do produto
    this.title = page.locator('.inventory_details_name');

    // 🔹 Preço do produto
    this.price = page.locator('.inventory_details_price');

    // 🔹 Botão "Add to cart"
    this.addToCart = page.locator('.btn_primary');

    // 🔹 Botão de voltar para a lista de produtos
    this.backButton = page.locator('.inventory_details_back_button');
  }

  // ✨ Adiciona o produto ao carrinho
  async addProductToCart() {
    await this.addToCart.click();
  }
}
