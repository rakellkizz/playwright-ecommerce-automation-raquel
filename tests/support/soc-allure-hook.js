// ======================================================================
// SOC → ALLURE HOOK (Playwright)
// - Coleta localStorage.soc_events do browser
// - Anexa como artifact no Allure por teste
// ======================================================================
const fs = require("fs");
const path = require("path");

async function coletarSocEvents(page) {
  return await page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem("soc_events") || "[]");
    } catch (_) {
      return [];
    }
  });
}

async function anexarNoAllure(testInfo, name, content, mime = "application/json") {
  // allure-playwright expõe testInfo.attach
  await testInfo.attach(name, {
    body: Buffer.from(typeof content === "string" ? content : JSON.stringify(content, null, 2)),
    contentType: mime,
  });
}

module.exports = { coletarSocEvents, anexarNoAllure };
