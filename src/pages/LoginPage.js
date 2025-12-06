// ======================================================================
// 📄 LoginPage.js
// Page Object responsável pela página de Login do SauceDemo
// Aqui ficam os seletores e métodos para interagir com os campos,
// botões e mensagens da tela de login.
// ======================================================================

export class LoginPage {
  constructor(page) {
    // Guarda a instância do Playwright dentro da classe
    this.page = page;

    // 🔹 Campo de usuário – identificador único da página
    this.username = page.locator('#user-name');

    // 🔹 Campo de senha
    this.password = page.locator('#password');

    // 🔹 Botão para efetuar login
    this.loginButton = page.locator('#login-button');

    // 🔹 Exibe erro quando o login falha
    this.errorMessage = page.locator('[data-test="error"]');
  }

  // ✨ Acessa diretamente a página inicial do SauceDemo
  async goto() {
    await this.page.goto('/');
  }

  // ✨ Realiza login preenchendo usuário e senha
  async login(user, pass) {
    await this.username.fill(user);
    await this.password.fill(pass);
    await this.loginButton.click();
  }
}
