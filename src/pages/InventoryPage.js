// ======================================================================
// 📄 InventoryPage.js
// Representa a página de inventário (lista de produtos).
// Contém seletores e ações para navegar e abrir produtos.
// ======================================================================

export class InventoryPage {
  constructor(page) {
    this.page = page;

    // 🔹 Lista de todos os produtos exibidos
    this.inventoryItems = page.locator('.inventory_item');

    // 🔹 Nome de cada produto – clicável
    this.itemName = page.locator('.inventory_item_name');

    // 🔹 Ícone do carrinho no topo
    this.cartLink = page.locator('.shopping_cart_link');
  }

  // ✨ Abre o primeiro produto da lista
  async openFirstItem() {
    await this.itemName.first().click();
  }

  // ✨ Acessa o carrinho de compras
  async goToCart() {
    await this.cartLink.click();
  }
  // <-- ADICIONE AQUI
  tituloProdutos() {
    return this.page.locator('.title');
}
}
