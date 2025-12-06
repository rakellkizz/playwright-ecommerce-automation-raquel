// ======================================================================
// 📄 CheckoutPage.js
// Página do processo de checkout dividido em etapas.
// Aqui preenchemos dados e finalizamos a compra.
// ======================================================================

export class CheckoutPage {
  constructor(page) {
    this.page = page;

    // 🔹 Campo Nome
    this.firstName = page.locator('#first-name');

    // 🔹 Campo Sobrenome
    this.lastName = page.locator('#last-name');

    // 🔹 Campo CEP
    this.postalCode = page.locator('#postal-code');

    // 🔹 Botão de continuar (vai para o resumo)
    this.continueBtn = page.locator('.cart_button');

    // 🔹 Botão de finalizar compra
    this.finishBtn = page.locator('#finish');

    // 🔹 Mensagem de sucesso após finalizar
    this.successMessage = page.locator('.complete-header');
  }

  // ✨ Preenche o formulário inicial do checkout
  async fillForm(first, last, zip) {
    await this.firstName.fill(first);
    await this.lastName.fill(last);
    await this.postalCode.fill(zip);

    // Avança para a tela de resumo
    await this.continueBtn.click();
  }

  // ✨ Finaliza o pedido
  async finishOrder() {
    await this.finishBtn.click();
  }
}
