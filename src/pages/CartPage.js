// ======================================================================
// 📄 CartPage.js
// Página do carrinho de compras.
// Permite remover itens ou seguir para checkout.
// ======================================================================

export class CartPage {
  constructor(page) {
    this.page = page;

    // 🔹 Lista dos itens dentro do carrinho
    this.items = page.locator('.cart_item');

    // 🔹 Botão "Checkout"
    this.checkoutButton = page.locator('.checkout_button');

    // 🔹 Botão para remover item do carrinho
    this.removeButton = page.locator('.cart_button');
  }

  // ✨ Remove o primeiro item do carrinho
  async removeFirstItem() {
    await this.removeButton.first().click();
  }

  // ✨ Avança para o formulário de checkout
  async proceedToCheckout() {
    await this.checkoutButton.click();
  }
}
