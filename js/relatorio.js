// ======================================================================
// relatorio.js — Geração e compartilhamento de relatórios técnicos
// ----------------------------------------------------------------------
// Responsável por:
//   ✔ Montar o texto final do relatório (montarTextoRelatorio)
//   ✔ Criar relatório em uma aba imprimível (gerarPDF)
//   ✔ Enviar relatório via WhatsApp (compartilharWhatsApp)
//   ✔ Abrir e-mail com o relatório (compartilharEmail)
//
// 100% compatível com GitHub Pages e navegadores modernos.
// ======================================================================



// ======================================================================
// MAPA — Nome bonitinho dos cenários
// ======================================================================
// Serve apenas para deixar o PDF/WhatsApp mais elegante.
const NOMES_CENARIOS = {
  login: "Login",
  carrinho: "Carrinho",
  checkout: "Checkout",
  busca: "Busca",
  smoke: "Smoke Tests",
  perfil: "Perfil",
};

// ======================================================================
// 1) montarTextoRelatorio(cenarioId, logs)
// ----------------------------------------------------------------------
// FUNÇÃO ESSENCIAL — Monta o TEXTO PURO que será enviado:
//   → PDF
//   → WhatsApp
//   → E-mail
//
// ⚠️ Se essa função não retornar texto → PDF fica branco / WhatsApp undefined.
// ======================================================================
export function montarTextoRelatorio(cenarioId, logs) {
  // Busca nome bonitinho do cenário
  const titulo = NOMES_CENARIOS[cenarioId] || cenarioId || "Cenário";

  // Data/hora atuais
  const agora = new Date();
  const dataBr = agora.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const horaBr = agora.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // ==================================================================
  // 🔮 IA MONITORAMENTO — C1 + C2
  // Aqui a gente manda os logs para a IA analisar:
  //   - Classificação de cada evento (iaTipo, iaSeveridade, iaTags)
  //   - Tendência (janela anterior x recente, nível de risco, insights)
  //
  // Nada disso muda o texto do relatório por enquanto, é só análise
  // paralela. O resultado fica disponível para:
  //   - Console do navegador (para você inspecionar)
  //   - C3 (relatório IA anexado no final — abaixo 👇)
  //   - Futuro: avisos automáticos no chat/HUD
  // ==================================================================
  let resultadoIA = null;
  try {
    if (window.IAMonitor && logs && logs.length) {
      resultadoIA = window.IAMonitor.analisarLote(logs);
      // 👉 Você pode abrir o console do navegador e ver esse objeto
      console.log("🔍 IA — Resultado da análise:", resultadoIA);
    } else {
      console.warn("IA Monitor não carregada ou não há logs para analisar.");
    }
  } catch (e) {
    console.error("Erro ao processar IA:", e);
  }

  // Início do texto do relatório
  let saida = "";
  saida += `Relatório técnico — ${titulo}\n`;
  saida += `Gerado em: ${dataBr} às ${horaBr}\n`;
  saida += `----------------------------------------\n\n`;

  // Caso não existam logs
  if (!logs || !logs.length) {
    saida += "Nenhum evento registrado para este cenário.\n";

    // 🔁 Mesmo sem logs, se a IA tiver algo, podemos anexar rascunho
    if (
      resultadoIA &&
      window.IAMonitor &&
      typeof window.IAMonitor.gerarRelatorioInteligente === "function"
    ) {
      try {
        const textoIA = window.IAMonitor.gerarRelatorioInteligente(resultadoIA);
        saida += `\n========================================\n`;
        saida += ` BLOCO GERADO PELA IA DE MONITORIA\n`;
        saida += `========================================\n\n`;
        saida += textoIA + "\n";
      } catch (e) {
        console.warn("Falha ao gerar bloco IA sem logs:", e);
      }
    }

    return saida;
  }

  // Ordena logs do mais antigo para o mais recente
  logs
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp)
    .forEach((log, indice) => {
      const data = new Date(log.timestamp);
      const d = data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const h = data.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // --------------------------------------------------------------
      // 🔶 CASO ESPECIAL: FALSO POSITIVO
      // --------------------------------------------------------------
      if (log.tipo === "falso-positivo") {
        saida += `Evento #${indice + 1}\n`;
        saida += `Tipo: FALSO POSITIVO\n`;
        saida += `Data/Hora: ${d} ${h}\n`;
        saida += `Descrição: Instabilidade momentânea detectada, mas não confirmada.\n`;
        saida += `Observação: O sistema voltou ao normal automaticamente.\n`;
        saida += `----------------------------------------\n\n`;
        return; // Continua para o próximo log
      }

      // --------------------------------------------------------------
      // 🔵 LOG NORMAL (incidente ou ação técnica)
      // --------------------------------------------------------------
      saida += `Evento #${indice + 1}\n`;
      saida += `Tipo: ${
        log.tipo === "incidente" ? "Incidente" : "Ação técnica"
      }\n`;
      saida += `Data/Hora: ${d} ${h}\n`;

      if (log.tecnico) saida += `Técnico: ${log.tecnico}\n`;
      if (log.severidade) saida += `Severidade: ${log.severidade}\n`;
      if (log.impacto) saida += `Impacto: ${log.impacto}\n`;
      if (log.causaProvavel)
        saida += `Causa provável: ${log.causaProvavel}\n`;
      if (log.acaoRecomendada)
        saida += `Ação recomendada: ${log.acaoRecomendada}\n`;
      if (log.acao) saida += `Ação realizada: ${log.acao}\n`;
      if (log.justificativa)
        saida += `Observações: ${log.justificativa}\n`;

      saida += `----------------------------------------\n\n`;
    });

  // ==================================================================
  // 🧠 C3 — ANEXANDO O RELATÓRIO INTELIGENTE DA IA NO FINAL
  // ------------------------------------------------------------------
  // Aqui usamos o mesmo resultadoIA calculado lá em cima.
  // Se o módulo ia-monitor.js estiver carregado, ele gera um texto
  // com:
  //   - Risco atual
  //   - Variação de incidentes
  //   - Janela anterior x recente
  // ==================================================================
  if (
    resultadoIA &&
    window.IAMonitor &&
    typeof window.IAMonitor.gerarRelatorioInteligente === "function"
  ) {
    try {
      const textoIA = window.IAMonitor.gerarRelatorioInteligente(resultadoIA);

      saida += `\n========================================\n`;
      saida += ` BLOCO GERADO PELA IA DE MONITORIA\n`;
      saida += `========================================\n\n`;
      saida += textoIA + "\n";
    } catch (e) {
      console.warn("Falha ao anexar bloco IA no relatório:", e);
    }
  }

  // 🔥 ESSA LINHA É FUNDAMENTAL — SEM ELA TUDO QUEBRA!
  return saida;
}
// ======================================================================
// 2) gerarPDF(cenarioId, logs, textoPronto?)
// ----------------------------------------------------------------------
// Versão clássica: abre uma nova aba com HTML simples e dispara o print.
//
// ✔ Usa window.open("", "_blank") (como você já tinha)
// ✔ Faz document.write() uma única vez com o HTML completo
// ✔ Chama window.print() dentro da própria página
// ======================================================================
export function gerarPDF(cenarioId, logs, textoPronto) {
  // Texto do relatório (usa texto pronto ou monta a partir dos logs)
  const texto = textoPronto || montarTextoRelatorio(cenarioId, logs);
  const titulo = NOMES_CENARIOS[cenarioId] || cenarioId || "Cenário";

  // Abre nova aba
  const win = window.open("", "_blank");
  if (!win) {
    alert(
      "Não foi possível abrir a janela de impressão. Verifique bloqueio de pop-ups."
    );
    return;
  }

  // Escreve o HTML completo de uma vez
  win.document.open();
  win.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <title>Relatório técnico — ${titulo}</title>
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
          margin: 24px;
          line-height: 1.5;
          color: #111827;
          white-space: pre-wrap;
        }
        h1 {
          font-size: 20px;
          margin-bottom: 12px;
        }
        .meta {
          font-size: 13px;
          color: #4b5563;
          margin-bottom: 20px;
        }
        pre {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
          font-size: 13px;
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <h1>Relatório técnico — ${titulo}</h1>
      <div class="meta">
        Gerado automaticamente pela ferramenta de QA da Raquel.
      </div>
      <pre>${texto.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
      <script>
        // Abre o diálogo de impressão assim que carregar
        window.print();
      </script>
    </body>
    </html>
  `);
  win.document.close();
}



// ======================================================================
// 3) compartilharWhatsApp(texto) — VERSÃO DEFINITIVA
// ----------------------------------------------------------------------
// Correção:
//   ✔ Divide mensagens muito grandes em blocos de 4000 caracteres
//   ✔ Envia cada parte separadamente
//   ✔ Evita corte no preview do WhatsApp Web
//   ✔ Garante entrega completa sem perder NADA do relatório
// ======================================================================
export function compartilharWhatsApp(texto) {
  if (!texto) return;

  // Normaliza quebras de linha
  const normalized = texto.replace(/\r\n/g, "\n");

  // WhatsApp trava preview acima de ~4000 chars
  const MAX = 3500; // seguro

  if (normalized.length <= MAX) {
    // Texto pequeno → envia normal
    const encoded = encodeURIComponent(normalized);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
    return;
  }

  // Texto grande → dividir em partes
  let partes = [];
  for (let i = 0; i < normalized.length; i += MAX) {
    partes.push(normalized.slice(i, i + MAX));
  }

  // Envia cada parte separadamente
  partes.forEach((parte, idx) => {
    const header = `📄 Parte ${idx + 1}/${partes.length}\n\n`;
    const encoded = encodeURIComponent(header + parte);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  });
}
// ======================================================================
// NOVO — gerarTextoUltimoEvento(logs)
// ----------------------------------------------------------------------
// Retorna apenas o último evento do cenário.
// Ideal para WhatsApp.
// ======================================================================
export function gerarTextoUltimoEvento(cenarioId, logs) {
  if (!logs || logs.length === 0) return "Nenhum evento encontrado.";

  const ultimo = logs[logs.length - 1];

  const data = new Date(ultimo.timestamp);
  const d = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const h = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const titulo = NOMES_CENARIOS[cenarioId] || cenarioId || "Cenário";

  let texto = "";
  texto += `🚨 Alerta técnico — ${titulo}\n`;
  texto += `Data/Hora: ${d} ${h}\n`;
  texto += `Tipo: ${ultimo.tipo === "incidente" ? "Incidente" : "Ação técnica"}\n`;
  if (ultimo.tecnico) texto += `Técnico: ${ultimo.tecnico}\n`;
  if (ultimo.severidade) texto += `Severidade: ${ultimo.severidade}\n`;
  if (ultimo.impacto) texto += `Impacto: ${ultimo.impacto}\n`;
  if (ultimo.causaProvavel) texto += `Causa provável: ${ultimo.causaProvavel}\n`;
  if (ultimo.acaoRecomendada) texto += `Ação recomendada: ${ultimo.acaoRecomendada}\n`;
  if (ultimo.acao) texto += `Ação realizada: ${ultimo.acao}\n`;
  if (ultimo.justificativa) texto += `Observações: ${ultimo.justificativa}\n`;

  texto += `----------------------------------------\n`;
  texto += `Mensagem automática do painel E2E`;

  return texto;
}
// ======================================================================
// 4) compartilharEmail(texto)
// ----------------------------------------------------------------------
// Abre o cliente de e-mail (mailto) com assunto e corpo preenchidos.
// ======================================================================
export function compartilharEmail(texto) {
  const assunto = encodeURIComponent(
    "Relatório de incidente — Monitoramento E2E"
  );
  const corpo = encodeURIComponent(texto);

  const link = `mailto:?subject=${assunto}&body=${corpo}`;

  const a = document.createElement("a");
  a.href = link;
  a.style.display = "none";

  document.body.appendChild(a);
  a.click();
  a.remove();
}



// ======================================================================
// FIM DO ARQUIVO — Geração e compartilhamento de relatórios técnicos
// ======================================================================
