<p align="center">
  <img
    src="https://readme-typing-svg.demolab.com?font=Fira+Code&amp;weight=500&amp;size=22&amp;duration=2400&amp;pause=900&amp;color=00F0FF&amp;center=true&amp;vCenter=true&amp;width=780&amp;lines=Playwright+E2E+Automation;E-commerce+Testing+Suite;Relat%C3%B3rios+Allure+%7C+HTML;CI%2FCD+Completo+com+GitHub+Actions"
    alt="Playwright E2E Automation banner"
  />
</p>
<h1 align="center">🎭 Playwright E-commerce Automation</h1>

<p align="center"><strong>Testes E2E completos para fluxo real de compra, com relatórios avançados, arquitetura limpa e execução automatizada.</strong></p>

---

## 🚀 Tecnologias Principais

<p align="center">
  <img src="https://img.shields.io/badge/Playwright-1.45%2B-2ecc71?style=for-the-badge&logo=playwright&logoColor=white" />
  <img src="https://img.shields.io/badge/Allure-Report-9b59b6?style=for-the-badge&logo=allure&logoColor=white" />
  <img src="https://img.shields.io/badge/GitHub-Actions-3498db?style=for-the-badge&logo=githubactions&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-E2E%20Tests-f1c40f?style=for-the-badge&logo=javascript&logoColor=000" />
</p>

---

# 🛒 Visão Geral

Este projeto valida o fluxo completo de um e-commerce:
Testes de sites Msites e App Androis e IOS

- Login  
- Busca dinâmica  
- Listagem de produtos  
- Carrinho e remoção  
- Validações de interface  
- Execução paralela  
- Evidências (vídeo, trace, screenshot)  

Tudo integrado com **GitHub Actions**, **Allure Report**, **relatório HTML** e arquitetura baseada em **Page Objects**.

---

# 🌐 Relatórios Online

🔍 **Allure Report:**  
https://rakellkizz.github.io/playwright-ecommerce-automation-raquel/

📊 **Playwright HTML Report:**  
https://rakellkizz.github.io/playwright-ecommerce-automation-raquel/playwright-report/

## 🔧 Modo Debug (SOC Ops)

- Produção (normal): https://rakellkizz.github.io/playwright-ecommerce-automation-raquel/
- Debug (SOC Ops): https://rakellkizz.github.io/playwright-ecommerce-automation-raquel/?debug=1

---

# 🧪 Testes Implementados

## 🔹 Smoke Tests
- Login com sucesso  
- Listagem de produtos  
- Busca → produto → detalhes  
- Execução rápida para validações essenciais  

## 🔹 Carrinho
- Adicionar itens  
- Remover itens  
- Recalcular valores  
- Testes mobile + desktop  

## 🔹 Busca
- Resultados dinâmicos  
- Recomendações da API  
- Filtros simultâneos  

---
Gerar relatório HTML local:
# 🧱 Arquitetura do Projeto

npx playwright show-report

🔄 Fluxo da Automação (SVG Técnico)
<p align="center"> <svg width="780" height="260"> <!-- Login --> <rect x="40" y="40" width="160" height="55" rx="12" fill="#00eaff" opacity="0.90"/> <text x="92" y="75" font-size="18" font-weight="600" fill="#000">Login</text> <!-- Home --> <rect x="260" y="40" width="160" height="55" rx="12" fill="#8a2be2" opacity="0.90"/> <text x="312" y="75" font-size="18" font-weight="600" fill="#fff">Home</text> <!-- Busca --> <rect x="480" y="40" width="160" height="55" rx="12" fill="#ff0099" opacity="0.90"/> <text x="530" y="75" font-size="18" font-weight="600" fill="#fff">Busca</text> <!-- Produto --> <rect x="260" y="150" width="160" height="55" rx="12" fill="#00ff99" opacity="0.90"/> <text x="310" y="185" font-size="18" font-weight="600" fill="#000">Produto</text> <!-- Carrinho --> <rect x="40" y="150" width="160" height="55" rx="12" fill="#ffd700" opacity="0.90"/> <text x="82" y="185" font-size="18" font-weight="600" fill="#000">Carrinho</text> <!-- Checkout --> <rect x="480" y="150" width="160" height="55" rx="12" fill="#ff4444" opacity="0.90"/> <text x="525" y="185" font-size="18" font-weight="600" fill="#fff">Checkout</text> <!-- Arrows --> <defs> <marker id="arrow" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto"> <polygon points="0 0, 10 3, 0 6" fill="#fff" /> </marker> </defs> <line x1="200" y1="67" x2="260" y2="67" stroke="#fff" stroke-width="3" marker-end="url(#arrow)" /> <line x1="420" y1="67" x2="480" y2="67" stroke="#fff" stroke-width="3" marker-end="url(#arrow)" /> <line x1="120" y1="95" x2="120" y2="150" stroke="#fff" stroke-width="3" marker-end="url(#arrow)" /> <line x1="340" y1="95" x2="340" y2="150" stroke="#fff" stroke-width="3" marker-end="url(#arrow)" /> <line x1="560" y1="95" x2="560" y2="150" stroke="#fff" stroke-width="3" marker-end="url(#arrow)" /> </svg> </p>

## 🔍 Evidências da Automação

### 📁 Artefatos Gerados
- 📸 **Screenshots automáticos**  
  Capturam o estado exato da aplicação no momento da execução.

- 🎥 **Vídeos da execução**  
  Permitem revisar o comportamento real de cada teste.

- 🧵 **Traces detalhados**  
  Oferecem depuração passo a passo, incluindo ações, logs e DOM.

- 📊 **Relatórios HTML**  
  Visualização estruturada dos resultados dos testes.

- 🌈 **Allure Results / History**  
  Relatórios avançados com timeline, estatísticas e anexos.

Esses artefatos são produzidos automaticamente em cada execução da suíte E2E, garantindo **auditabilidade, rastreabilidade e análise completa** do comportamento dos testes.

## 🛠️ Como Rodar o Projeto Localmente
📥 1. Instalar dependências

npm install

🌐 2. Instalar navegadores do Playwright

npx playwright install

▶️ 3. Executar os testes

npx playwright test

📊 4. Gerar relatório HTML local

npx playwright show-report


## ⚙️ 9. Pipeline CI/CD

A pipeline (GitHub Actions) executa automaticamente:

🔁 Execução dos testes

Rodagem paralela

Ambientes independentes

Registros completos

## 📦 Geração e upload de artifacts

vídeos (videos/)

screenshots (screenshots/)

traces (traces/)

relatório HTML (playwright-report/)

base do Allure (allure-results/)

## 🌐 Publicação automática

Publica o Allure Report no GitHub Pages

Atualiza o HTML Reporter

Mantém o histórico das execuções

A pipeline garante rastreabilidade completa da execução E2E.


## 💡 Objetivos Técnicos do Projeto

🎯 Modularidade
Estrutura em Page Objects para fácil manutenção e expansão.

⚡ Escalabilidade
Preparado para novos cenários, múltiplas suites e paralelismo.

🔍 Observabilidade
Evidências completas: vídeo, trace, screenshots e logs detalhados.

🧩 Rastreabilidade
Cada step pode ser auditado via Allure + Reporter HTML.

## 💜 Créditos
Desenvolvido com cuidado, precisão técnica e foco total em qualidade por Raquel Souza.
Automação moderna, arquitetura limpa e entrega consistente.

